import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { topologicalSort, getConnectedInputs } from '@/lib/workflow-engine/validation';
import { Node, Edge } from '@xyflow/react';

const executeWorkflowSchema = z.object({
    workflowId: z.string(),
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
    scope: z.enum(['FULL', 'PARTIAL', 'SINGLE']),
    nodeIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const validation = executeWorkflowSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        const { workflowId, nodes, edges, scope, nodeIds } = validation.data;

        // Determine which nodes to execute
        let nodesToExecute: Node[] = nodes;
        if (scope !== 'FULL' && nodeIds && nodeIds.length > 0) {
            nodesToExecute = nodes.filter((n: Node) => nodeIds.includes(n.id));
        }

        // Create workflow run record
        const run = await prisma.workflowRun.create({
            data: {
                workflowId: workflowId !== 'temp' ? workflowId : undefined as unknown as string,
                userId: user.id,
                scope,
                status: 'RUNNING',
            },
        });

        const startTime = Date.now();
        const results: Array<{
            nodeId: string;
            status: 'SUCCESS' | 'FAILED';
            output?: unknown;
            error?: string;
            duration: number;
        }> = [];

        // Get execution layers
        const executionLayers = topologicalSort(nodesToExecute, edges);

        // Store outputs for reference
        const nodeOutputs = new Map<string, unknown>();

        // Initialize outputs from existing node data
        nodes.forEach((node: Node) => {
            if (node.data?.output !== undefined) {
                nodeOutputs.set(node.id, node.data.output);
            }
        });

        // Execute layer by layer
        for (const layer of executionLayers) {
            const layerPromises = layer.map(async (nodeId) => {
                const node = nodes.find((n: Node) => n.id === nodeId);
                if (!node) return;

                const nodeStartTime = Date.now();

                // Create node result record
                const nodeResult = await prisma.nodeResult.create({
                    data: {
                        runId: run.id,
                        nodeId: node.id,
                        nodeType: node.type || 'unknown',
                        status: 'RUNNING',
                        startedAt: new Date(),
                    },
                });

                try {
                    // Gather inputs from connected nodes
                    const inputs = getConnectedInputs(node.id, nodes, edges);

                    // Override with actual outputs from executed nodes
                    edges.forEach((edge: Edge) => {
                        if (edge.target === node.id && edge.targetHandle) {
                            const output = nodeOutputs.get(edge.source);
                            if (output !== undefined) {
                                if (edge.targetHandle === 'images') {
                                    const currentImages = (inputs['images'] as string[]) || [];
                                    if (typeof output === 'string') {
                                        currentImages.push(output);
                                    }
                                    inputs['images'] = currentImages;
                                } else {
                                    inputs[edge.targetHandle] = output;
                                }
                            }
                        }
                    });

                    // Execute based on node type
                    let output: unknown;

                    switch (node.type) {
                        case 'text':
                            output = node.data?.text || '';
                            break;

                        case 'uploadImage':
                            output = node.data?.imageUrl || '';
                            if (!output) throw new Error('No image uploaded');
                            break;

                        case 'uploadVideo':
                            output = node.data?.videoUrl || '';
                            if (!output) throw new Error('No video uploaded');
                            break;

                        case 'llm':
                            output = await executeLLM(node, inputs);
                            break;

                        case 'cropImage':
                            output = await executeCropImage(node, inputs);
                            break;

                        case 'extractFrame':
                            output = await executeExtractFrame(node, inputs);
                            break;

                        default:
                            output = node.data?.output;
                    }

                    // Store output
                    nodeOutputs.set(node.id, output);

                    const duration = Date.now() - nodeStartTime;

                    // Update node result
                    await prisma.nodeResult.update({
                        where: { id: nodeResult.id },
                        data: {
                            status: 'SUCCESS',
                            input: inputs as object,
                            output: (typeof output === 'object' ? output : { value: output }) as object,
                            completedAt: new Date(),
                            duration,
                        },
                    });

                    results.push({
                        nodeId: node.id,
                        status: 'SUCCESS',
                        output,
                        duration,
                    });
                } catch (error) {
                    const duration = Date.now() - nodeStartTime;
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                    await prisma.nodeResult.update({
                        where: { id: nodeResult.id },
                        data: {
                            status: 'FAILED',
                            error: errorMessage,
                            completedAt: new Date(),
                            duration,
                        },
                    });

                    results.push({
                        nodeId: node.id,
                        status: 'FAILED',
                        error: errorMessage,
                        duration,
                    });
                }
            });

            await Promise.all(layerPromises);
        }

        // Determine final status
        const hasFailures = results.some(r => r.status === 'FAILED');
        const allSuccessful = results.every(r => r.status === 'SUCCESS');
        const finalStatus = allSuccessful ? 'SUCCESS' : hasFailures ? 'PARTIAL' : 'SUCCESS';
        const totalDuration = Date.now() - startTime;

        // Update run record
        await prisma.workflowRun.update({
            where: { id: run.id },
            data: {
                status: finalStatus,
                completedAt: new Date(),
                duration: totalDuration,
            },
        });

        return NextResponse.json({
            runId: run.id,
            status: finalStatus,
            results,
            duration: totalDuration,
        });
    } catch (error) {
        console.error('Failed to execute workflow:', error);
        return NextResponse.json(
            { error: 'Failed to execute workflow' },
            { status: 500 }
        );
    }
}

// LLM execution (direct call for now, can be moved to Trigger.dev)
async function executeLLM(node: Node, inputs: Record<string, unknown>): Promise<string> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
        throw new Error('Google AI API key not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelId = (node.data as { model?: string })?.model || 'gemini-2.0-flash-exp';

    const model = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: (inputs['system_prompt'] as string) || (node.data as { systemPrompt?: string })?.systemPrompt,
    });

    const userMessage = (inputs['user_message'] as string) || (node.data as { userMessage?: string })?.userMessage;
    if (!userMessage) {
        throw new Error('User message is required');
    }

    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [{ text: userMessage }];

    // Add images if provided
    const images = (inputs['images'] as string[]) || [];
    for (const imageUrl of images) {
        try {
            const response = await fetch(imageUrl);
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const mimeType = response.headers.get('content-type') || 'image/jpeg';

            parts.push({
                inlineData: {
                    data: base64,
                    mimeType,
                },
            });
        } catch (error) {
            console.warn('Failed to fetch image:', imageUrl, error);
        }
    }

    const result = await model.generateContent(parts);
    const response = result.response;
    const text = response.text();

    return text;
}

// Crop image execution (placeholder - would use FFmpeg via Trigger.dev)
async function executeCropImage(node: Node, inputs: Record<string, unknown>): Promise<string> {
    const imageUrl = inputs['image_url'] as string;
    if (!imageUrl) {
        throw new Error('Image URL is required');
    }

    // For now, return the original image
    // In production, this would call Trigger.dev with FFmpeg
    console.log('Crop image called with:', {
        imageUrl,
        xPercent: inputs['x_percent'] ?? (node.data as { xPercent?: number })?.xPercent ?? 0,
        yPercent: inputs['y_percent'] ?? (node.data as { yPercent?: number })?.yPercent ?? 0,
        widthPercent: inputs['width_percent'] ?? (node.data as { widthPercent?: number })?.widthPercent ?? 100,
        heightPercent: inputs['height_percent'] ?? (node.data as { heightPercent?: number })?.heightPercent ?? 100,
    });

    return imageUrl;
}

// Extract frame execution (placeholder - would use FFmpeg via Trigger.dev)
async function executeExtractFrame(node: Node, inputs: Record<string, unknown>): Promise<string> {
    const videoUrl = inputs['video_url'] as string;
    if (!videoUrl) {
        throw new Error('Video URL is required');
    }

    // For now, return a placeholder
    // In production, this would call Trigger.dev with FFmpeg
    console.log('Extract frame called with:', {
        videoUrl,
        timestamp: inputs['timestamp'] ?? (node.data as { timestamp?: string })?.timestamp ?? '0',
    });

    return videoUrl;
}
