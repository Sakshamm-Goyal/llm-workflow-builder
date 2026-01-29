import {
  GoogleGenerativeAI
} from "../../../../../../../chunk-WYYJFJAY.mjs";
import {
  task
} from "../../../../../../../chunk-Y4C7RL5F.mjs";
import {
  __name,
  init_esm
} from "../../../../../../../chunk-5A2LE32G.mjs";

// src/trigger/tasks/llm-task.ts
init_esm();
var llmTask = task({
  id: "llm-execution",
  maxDuration: 120,
  // 2 minutes
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
      parts.push({ text: `System: ${systemPrompt}

` });
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
export {
  llmTask
};
//# sourceMappingURL=llm-task.mjs.map
