import { task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

// LLM Task
interface LLMTaskPayload {
    model: string;
    systemPrompt: string;
    userMessage: string;
    images: string[];
    nodeId: string;
    runId: string;
}

export const llmTask = task({
    id: "llm-execution",
    maxDuration: 120,
    retry: {
        maxAttempts: 2,
    },
    run: async (payload: LLMTaskPayload) => {
        const { model, systemPrompt, userMessage, images, nodeId, runId } = payload;

        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            throw new Error("GOOGLE_AI_API_KEY is not configured");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelInstance = genAI.getGenerativeModel({ model });

        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

        if (systemPrompt) {
            parts.push({ text: `System: ${systemPrompt}\\n\\n` });
        }

        parts.push({ text: userMessage });

        for (const imageUrl of images) {
            try {
                const response = await fetch(imageUrl);
                const buffer = await response.arrayBuffer();
                const base64 = Buffer.from(buffer).toString("base64");
                const mimeType = response.headers.get("content-type") || "image/jpeg";

                parts.push({
                    inlineData: {
                        mimeType,
                        data: base64,
                    },
                });
            } catch (error) {
                console.warn(`Failed to fetch image: ${imageUrl}`, error);
            }
        }

        const result = await modelInstance.generateContent(parts);
        const response = result.response;
        const text = response.text();

        return {
            nodeId,
            runId,
            response: text,
            model,
            tokensUsed: response.usageMetadata?.totalTokenCount || 0,
        };
    },
});

// Crop Image Task
interface CropImagePayload {
    imageUrl: string;
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
    nodeId: string;
    runId: string;
}

export const cropImageTask = task({
    id: "crop-image",
    maxDuration: 60,
    retry: {
        maxAttempts: 2,
    },
    run: async (payload: CropImagePayload) => {
        const { imageUrl, xPercent, yPercent, widthPercent, heightPercent, nodeId, runId } = payload;

        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const imageBuffer = Buffer.from(await response.arrayBuffer());

        const metadata = await sharp(imageBuffer).metadata();
        if (!metadata.width || !metadata.height) {
            throw new Error("Could not determine image dimensions");
        }

        const left = Math.round((xPercent / 100) * metadata.width);
        const top = Math.round((yPercent / 100) * metadata.height);
        const width = Math.round((widthPercent / 100) * metadata.width);
        const height = Math.round((heightPercent / 100) * metadata.height);

        const croppedBuffer = await sharp(imageBuffer)
            .extract({ left, top, width, height })
            .toBuffer();

        const base64 = croppedBuffer.toString("base64");
        const croppedUrl = `data:image/png;base64,${base64}`;

        return {
            nodeId,
            runId,
            croppedUrl,
            originalDimensions: { width: metadata.width, height: metadata.height },
            cropDimensions: { left, top, width, height },
        };
    },
});

// Extract Frame Task
interface ExtractFramePayload {
    videoUrl: string;
    timestamp: string;
    nodeId: string;
    runId: string;
}

export const extractFrameTask = task({
    id: "extract-frame",
    maxDuration: 120,
    retry: {
        maxAttempts: 2,
    },
    run: async (payload: ExtractFramePayload) => {
        const { videoUrl, timestamp, nodeId, runId } = payload;

        if (!videoUrl) {
            throw new Error("Video URL is required");
        }

        let timestampSeconds = 0;
        if (timestamp.includes(":")) {
            const parts = timestamp.split(":").map(Number);
            if (parts.length === 3) {
                timestampSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
            } else if (parts.length === 2) {
                timestampSeconds = parts[0] * 60 + parts[1];
            }
        } else {
            timestampSeconds = parseFloat(timestamp) || 0;
        }

        return {
            nodeId,
            runId,
            frameUrl: videoUrl,
            timestamp: timestampSeconds,
            status: "frame_extraction_placeholder",
            message: "Frame extraction requires ffmpeg integration. Video URL preserved.",
        };
    },
});
