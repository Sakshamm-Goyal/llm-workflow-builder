import {
  GoogleGenerativeAI
} from "../../../../../../chunk-WYYJFJAY.mjs";
import {
  task
} from "../../../../../../chunk-Y4C7RL5F.mjs";
import {
  __name,
  init_esm
} from "../../../../../../chunk-5A2LE32G.mjs";

// src/trigger/index.ts
init_esm();
import sharp from "sharp";
var llmTask = task({
  id: "llm-execution",
  maxDuration: 120,
  retry: {
    maxAttempts: 2
  },
  run: /* @__PURE__ */ __name(async (payload) => {
    const { model, systemPrompt, userMessage, images, nodeId, runId } = payload;
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelInstance = genAI.getGenerativeModel({ model });
    const parts = [];
    if (systemPrompt) {
      parts.push({ text: `System: ${systemPrompt}\\n\\n` });
    }
    parts.push({ text: userMessage });
    for (const imageUrl of images) {
      try {
        const response2 = await fetch(imageUrl);
        const buffer = await response2.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const mimeType = response2.headers.get("content-type") || "image/jpeg";
        parts.push({
          inlineData: {
            mimeType,
            data: base64
          }
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
      tokensUsed: response.usageMetadata?.totalTokenCount || 0
    };
  }, "run")
});
var cropImageTask = task({
  id: "crop-image",
  maxDuration: 60,
  retry: {
    maxAttempts: 2
  },
  run: /* @__PURE__ */ __name(async (payload) => {
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
    const left = Math.round(xPercent / 100 * metadata.width);
    const top = Math.round(yPercent / 100 * metadata.height);
    const width = Math.round(widthPercent / 100 * metadata.width);
    const height = Math.round(heightPercent / 100 * metadata.height);
    const croppedBuffer = await sharp(imageBuffer).extract({ left, top, width, height }).toBuffer();
    const base64 = croppedBuffer.toString("base64");
    const croppedUrl = `data:image/png;base64,${base64}`;
    return {
      nodeId,
      runId,
      croppedUrl,
      originalDimensions: { width: metadata.width, height: metadata.height },
      cropDimensions: { left, top, width, height }
    };
  }, "run")
});
var extractFrameTask = task({
  id: "extract-frame",
  maxDuration: 120,
  retry: {
    maxAttempts: 2
  },
  run: /* @__PURE__ */ __name(async (payload) => {
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
      message: "Frame extraction requires ffmpeg integration. Video URL preserved."
    };
  }, "run")
});
export {
  cropImageTask,
  extractFrameTask,
  llmTask
};
//# sourceMappingURL=index.mjs.map
