import {
  task
} from "../../chunk-NL3CHZZW.mjs";
import "../../chunk-U76V5X4F.mjs";
import "../../chunk-33IJXG33.mjs";
import "../../chunk-USHNXJ63.mjs";
import "../../chunk-IA2HBA2V.mjs";
import {
  __name,
  init_esm
} from "../../chunk-244PAGAH.mjs";

// src/trigger/index.ts
init_esm();
import sharp from "sharp";
var llmTask = task({
  id: "llm-execution",
  retry: { maxAttempts: 2 },
  run: /* @__PURE__ */ __name(async (payload) => {
    const modelId = payload.model || "groq:meta-llama/llama-4-scout-17b-16e-instruct";
    if (modelId.startsWith("groq:")) {
      const Groq = (await import("../../groq-sdk-VBQ2OKLA.mjs")).default;
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error("GROQ_API_KEY not set");
      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        model: modelId.replace("groq:", ""),
        messages: [{ role: "user", content: payload.prompt }],
        temperature: 0.7,
        max_tokens: 4096
      });
      return { text: completion.choices[0]?.message?.content || "" };
    } else {
      const { GoogleGenerativeAI } = await import("../../dist-K5XIWUNF.mjs");
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not set");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelId });
      const parts = [{ text: payload.prompt }];
      if (payload.images?.length) {
        for (const img of payload.images) {
          const base64Match = img.match(/^data:(.+);base64,(.+)$/);
          if (base64Match) {
            parts.push({
              inlineData: { mimeType: base64Match[1], data: base64Match[2] }
            });
          }
        }
      }
      const result = await model.generateContent(parts);
      return { text: result.response.text() };
    }
  }, "run")
});
var cropImageTask = task({
  id: "crop-image",
  retry: { maxAttempts: 2 },
  run: /* @__PURE__ */ __name(async (payload) => {
    let imageBuffer;
    if (payload.imageData.startsWith("data:")) {
      const base64Data = payload.imageData.split(",")[1];
      imageBuffer = Buffer.from(base64Data, "base64");
    } else if (payload.imageData.startsWith("http://") || payload.imageData.startsWith("https://")) {
      const response = await fetch(payload.imageData);
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      imageBuffer = Buffer.from(payload.imageData, "base64");
    }
    const { x, y, width, height } = payload.crop;
    const croppedBuffer = await sharp(imageBuffer).extract({
      left: Math.round(x),
      top: Math.round(y),
      width: Math.round(width),
      height: Math.round(height)
    }).toFormat(payload.outputFormat || "png").toBuffer();
    const format = payload.outputFormat || "png";
    const mimeType = `image/${format}`;
    const base64 = croppedBuffer.toString("base64");
    return { imageUrl: `data:${mimeType};base64,${base64}` };
  }, "run")
});
var extractFrameTask = task({
  id: "extract-frame",
  retry: { maxAttempts: 1 },
  run: /* @__PURE__ */ __name(async (payload) => {
    console.log(
      `[Extract Frame] Received request for video: ${payload.videoUrl?.substring(0, 50)}...`
    );
    console.log(
      `[Extract Frame] Timestamp: ${payload.timestamp || 0}, Format: ${payload.format || "png"}`
    );
    throw new Error(
      "Extract Frame requires FFmpeg. Deploy to Trigger.dev Cloud with the FFmpeg build extension, or configure FFmpeg in your deployment environment. See: https://trigger.dev/docs/guides/frameworks/nextjs"
    );
  }, "run")
});
export {
  cropImageTask,
  extractFrameTask,
  llmTask
};
//# sourceMappingURL=index.mjs.map
