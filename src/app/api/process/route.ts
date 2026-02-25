import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const TRANSLOADIT_AUTH_KEY = process.env.TRANSLOADIT_AUTH_KEY || process.env.NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY;
const TRANSLOADIT_AUTH_SECRET = process.env.TRANSLOADIT_AUTH_SECRET;

interface TransloaditParams {
    auth: {
        key: string;
        expires: string;
    };
    steps: Record<string, unknown>;
}

function isLocalUrl(url: string): boolean {
    if (!url) return false;
    if (url.startsWith('/')) return true;

    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) return false;

        const host = parsed.hostname.toLowerCase();
        return (
            host === 'localhost' ||
            host === '127.0.0.1' ||
            host === '::1' ||
            host.endsWith('.localhost')
        );
    } catch {
        return false;
    }
}

function normalizeImportUrl(inputUrl: string): string {
    if (!inputUrl) return inputUrl;
    if (inputUrl.startsWith('http://') || inputUrl.startsWith('https://') || inputUrl.startsWith('data:') || inputUrl.startsWith('blob:')) {
        return inputUrl;
    }

    if (inputUrl.startsWith('/')) {
        const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL ||
            process.env.NEXT_PUBLIC_APP_ORIGIN ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        return `${baseUrl.replace(/\/$/, '')}${inputUrl}`;
    }

    return inputUrl;
}

function getContentTypeFromExtension(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();
    switch (extension) {
        case '.webp':
            return 'image/webp';
        case '.png':
            return 'image/png';
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.gif':
            return 'image/gif';
        case '.mp4':
            return 'video/mp4';
        case '.mov':
            return 'video/quicktime';
        case '.m4v':
            return 'video/x-m4v';
        case '.webm':
            return 'video/webm';
        default:
            return 'application/octet-stream';
    }
}

function resolveLocalPublicPath(inputUrl: string): string | null {
    if (!inputUrl) return null;

    if (inputUrl.startsWith('/')) {
        const cleanedPath = decodeURIComponent(inputUrl.replace(/^\/+/, ''));
        return path.join(process.cwd(), 'public', cleanedPath);
    }

    try {
        const parsed = new URL(inputUrl);
        if (!isLocalUrl(inputUrl) || !parsed.pathname) return null;

        const cleanedPath = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
        return path.join(process.cwd(), 'public', cleanedPath);
    } catch {
        return null;
    }
}

async function loadLocalFileAsBlob(inputUrl: string): Promise<{ file: Blob; fileName: string }> {
    const localFilePath = resolveLocalPublicPath(inputUrl);
    if (!localFilePath) {
        throw new Error('Cannot resolve local file path for media URL');
    }

    const normalizedPublicPath = path.resolve(process.cwd(), 'public');
    const resolvedFilePath = path.resolve(localFilePath);
    if (!resolvedFilePath.startsWith(`${normalizedPublicPath}${path.sep}`) && resolvedFilePath !== normalizedPublicPath) {
        throw new Error(`Refusing to read outside public directory: ${resolvedFilePath}`);
    }

    const buffer = await fs.readFile(resolvedFilePath);
    const fileName = path.basename(resolvedFilePath);
    return {
        file: new Blob([buffer], { type: getContentTypeFromExtension(fileName) }),
        fileName,
    };
}

async function createAssemblyWithUpload(steps: Record<string, unknown>, file: Blob, fileName: string): Promise<TransloaditResult> {
    const params: TransloaditParams = {
        auth: {
            key: TRANSLOADIT_AUTH_KEY,
            expires: getExpiryDate(),
        },
        steps,
    };

    const signature = generateSignature(params);

    const formData = new FormData();
    formData.append('params', JSON.stringify(params));
    formData.append('signature', signature);
    formData.append('file', file, fileName);

    const response = await fetch('https://api2.transloadit.com/assemblies', {
        method: 'POST',
        body: formData,
    });

    const assembly = await response.json();
    if (assembly.error) {
        throw new Error(`Transloadit error: ${assembly.error} - ${assembly.message}`);
    }

    return await pollForCompletion(assembly.assembly_ssl_url);
}

interface TransloaditResult {
    ok: string;
    assembly_id: string;
    assembly_ssl_url: string;
    results: Record<string, Array<{
        ssl_url: string;
        url: string;
        name: string;
    }>>;
    steps?: Record<string, unknown>;
    error?: string;
    message?: string;
}

async function assertImportUrlReachable(url: string, label: 'image' | 'video'): Promise<void> {
    if (!url.startsWith('http://') && !url.startsWith('https://')) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { range: 'bytes=0-0' },
            redirect: 'follow',
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.status !== 200 && response.status !== 206) {
            throw new Error(`Status ${response.status}`);
        }
    } catch (error) {
        clearTimeout(timeout);
        throw new Error(
            `Cannot access ${label} import URL "${url}" from the API. ` +
            `Set NEXT_PUBLIC_APP_URL to a public endpoint. ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

function generateSignature(params: TransloaditParams): string {
    if (!TRANSLOADIT_AUTH_SECRET) {
        throw new Error('Missing TRANSLOADIT_AUTH_SECRET');
    }

    const toSign = JSON.stringify(params);
    const signature = crypto
        .createHmac('sha384', TRANSLOADIT_AUTH_SECRET)
        .update(toSign)
        .digest('hex');
    return `sha384:${signature}`;
}

function getExpiryDate(): string {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return date.toISOString().replace(/\.\d{3}Z$/, '+00:00');
}

async function pollForCompletion(assemblyUrl: string, maxWait = 120000): Promise<TransloaditResult> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
        const response = await fetch(assemblyUrl);
        const result = await response.json();

        if (result.ok === 'ASSEMBLY_COMPLETED') {
            return result;
        }

        if (result.error) {
            const stepInfo = result.steps ? ` Steps: ${JSON.stringify(result.steps).slice(0, 1200)}` : '';
            throw new Error(`Transloadit error: ${result.error} - ${result.message}${stepInfo}`);
        }

        // Wait 1 second before polling again
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Assembly timeout');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, fileUrl, ...options } = body;

        if (!TRANSLOADIT_AUTH_KEY) {
            return NextResponse.json(
                { error: 'Missing Transloadit auth key. Set TRANSLOADIT_AUTH_KEY or NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY.' },
                { status: 500 }
            );
        }

        if (!fileUrl) {
            return NextResponse.json(
                { error: 'fileUrl is required' },
                { status: 400 }
            );
        }

        let steps: Record<string, unknown>;

        const normalizedUrl = normalizeImportUrl(fileUrl);
        const localUpload = isLocalUrl(normalizedUrl);

        if (type === 'crop') {
            // Crop image using /image/resize robot
            const { x, y, width, height } = options;

            if (!localUpload) {
                await assertImportUrlReachable(normalizedUrl, 'image');
                steps = {
                    imported: {
                        robot: '/http/import',
                        url: normalizedUrl,
                    },
                    cropped: {
                        robot: '/image/resize',
                        use: 'imported',
                        crop: {
                            x1: x || 0,
                            y1: y || 0,
                            x2: (x || 0) + (width || 100),
                            y2: (y || 0) + (height || 100),
                        },
                        resize_strategy: 'crop',
                        result: true,
                    },
                };
            } else {
                const { file, fileName } = await loadLocalFileAsBlob(normalizedUrl);
                steps = {
                    ':original': {
                        robot: '/upload/handle',
                    },
                    cropped: {
                        robot: '/image/resize',
                        use: ':original',
                        crop: {
                            x1: x || 0,
                            y1: y || 0,
                            x2: (x || 0) + (width || 100),
                            y2: (y || 0) + (height || 100),
                        },
                        resize_strategy: 'crop',
                        result: true,
                    },
                };

                const result = await createAssemblyWithUpload(steps, file, fileName);
                let resultUrl: string | null = result.results.cropped?.[0]?.ssl_url || null;
                if (!resultUrl) {
                    return NextResponse.json({ error: 'No result from processing' }, { status: 500 });
                }
                return NextResponse.json({
                    success: true,
                    resultUrl,
                    assemblyId: result.assembly_id,
                });
            }
        } else if (type === 'frame') {
            // Extract frame using /video/thumbs robot
            const { timestamp = 0 } = options;

            if (!localUpload) {
                await assertImportUrlReachable(normalizedUrl, 'video');
                steps = {
                    imported: {
                        robot: '/http/import',
                        url: normalizedUrl,
                    },
                    thumbnail: {
                        robot: '/video/thumbs',
                        use: 'imported',
                        offsets: [timestamp],
                        width: 1280,
                        height: 720,
                        resize_strategy: 'fit',
                        format: 'png',
                        result: true,
                    },
                };
            } else {
                const { file, fileName } = await loadLocalFileAsBlob(normalizedUrl);
                steps = {
                    ':original': {
                        robot: '/upload/handle',
                    },
                    thumbnail: {
                        robot: '/video/thumbs',
                        use: ':original',
                        offsets: [timestamp],
                        width: 1280,
                        height: 720,
                        resize_strategy: 'fit',
                        format: 'png',
                        result: true,
                    },
                };

                const result = await createAssemblyWithUpload(steps, file, fileName);
                let resultUrl: string | null = result.results.thumbnail?.[0]?.ssl_url || null;
                if (!resultUrl) {
                    return NextResponse.json({ error: 'No result from processing' }, { status: 500 });
                }
                return NextResponse.json({
                    success: true,
                    resultUrl,
                    assemblyId: result.assembly_id,
                });
            }
        } else {
            return NextResponse.json(
                { error: 'Invalid type. Use "crop" or "frame"' },
                { status: 400 }
            );
        }

        const params: TransloaditParams = {
            auth: {
                key: TRANSLOADIT_AUTH_KEY,
                expires: getExpiryDate(),
            },
            steps,
        };

        const signature = generateSignature(params);

        // Create assembly (no file upload, using HTTP import)
        const formData = new FormData();
        formData.append('params', JSON.stringify(params));
        formData.append('signature', signature);

        const response = await fetch('https://api2.transloadit.com/assemblies', {
            method: 'POST',
            body: formData,
        });

        const assembly = await response.json();

        if (assembly.error) {
            return NextResponse.json(
                { error: assembly.message || 'Assembly creation failed' },
                { status: 500 }
            );
        }

        // Poll for completion
        const result = await pollForCompletion(assembly.assembly_ssl_url);

        // Get the result URL
        let resultUrl: string | null = null;

        if (type === 'crop' && result.results.cropped) {
            resultUrl = result.results.cropped[0]?.ssl_url;
        } else if (type === 'frame' && result.results.thumbnail) {
            resultUrl = result.results.thumbnail[0]?.ssl_url;
        }

        if (!resultUrl) {
            return NextResponse.json(
                { error: 'No result from processing' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            resultUrl,
            assemblyId: result.assembly_id,
        });

    } catch (error) {
        console.error('Process error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Processing failed' },
            { status: 500 }
        );
    }
}
