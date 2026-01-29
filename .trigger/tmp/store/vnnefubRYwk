import {
  task
} from "../../../../../../../chunk-Y4C7RL5F.mjs";
import {
  __name,
  init_esm
} from "../../../../../../../chunk-5A2LE32G.mjs";

// src/trigger/tasks/extract-frame-task.ts
init_esm();
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
      // Placeholder - would be actual frame URL
      timestamp: timestampSeconds,
      status: "frame_extraction_placeholder",
      message: "Frame extraction requires ffmpeg integration. Video URL preserved."
    };
  }, "run")
});
export {
  extractFrameTask
};
//# sourceMappingURL=extract-frame-task.mjs.map
