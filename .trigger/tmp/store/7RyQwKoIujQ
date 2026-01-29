import {
  task
} from "../../../../../../../chunk-Y4C7RL5F.mjs";
import {
  __name,
  init_esm
} from "../../../../../../../chunk-5A2LE32G.mjs";

// src/trigger/tasks/crop-image-task.ts
init_esm();
import sharp from "sharp";
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
export {
  cropImageTask
};
//# sourceMappingURL=crop-image-task.mjs.map
