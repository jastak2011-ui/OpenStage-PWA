export function calculateAutoscrollPixelsPerSecond(maxScroll: number, durationSeconds?: number, manualSpeed = 18) {
  if (Number.isFinite(durationSeconds) && durationSeconds && durationSeconds > 0 && maxScroll > 0) {
    return Math.max(1, maxScroll / durationSeconds);
  }
  return manualSpeed;
}

export function advanceVirtualScrollTop(currentScrollTop: number, elapsedSeconds: number, pixelsPerSecond: number, maxScroll: number) {
  const nextScrollTop = Math.min(maxScroll, currentScrollTop + Math.max(0, elapsedSeconds) * Math.max(0, pixelsPerSecond));
  return {
    nextScrollTop,
    reachedEnd: maxScroll > 0 && nextScrollTop >= maxScroll
  };
}

export function detectAutoscrollHeartbeatStall(isRunning: boolean, nowMs: number, lastFrameMs: number | null, thresholdMs = 750) {
  if (!isRunning || lastFrameMs === null) return false;
  return nowMs - lastFrameMs > thresholdMs;
}

export type BpmDurationEstimateInput = {
  bpm?: number;
  lyricLineCount: number;
  sectionMarkerCount: number;
  maxScroll: number;
  clientHeight: number;
  scrollHeight: number;
  fontSize: number;
  readingPaceMultiplier: number;
  portraitMode?: boolean;
  mirroredMode?: boolean;
  splitScreen?: boolean;
};

export function estimateBpmAutoscrollDurationSeconds(input: BpmDurationEstimateInput) {
  if (!input.bpm || input.bpm <= 0) return undefined;
  const layoutMultiplier = getLayoutDurationMultiplier(input);
  const estimatedBeats =
    Math.max(1, input.lyricLineCount) * 4 + input.sectionMarkerCount * 2 + Math.max(0, input.maxScroll / Math.max(1, input.clientHeight)) * 4;
  return {
    estimatedBeats,
    durationSeconds: (estimatedBeats / input.bpm) * 60 * input.readingPaceMultiplier * layoutMultiplier,
    layoutMultiplier
  };
}

export function getLayoutDurationMultiplier(input: Pick<BpmDurationEstimateInput, 'fontSize' | 'portraitMode' | 'mirroredMode' | 'splitScreen' | 'scrollHeight' | 'clientHeight'>) {
  const fontMultiplier = Math.max(0.8, Math.min(1.35, input.fontSize / 34));
  const viewportMultiplier = Math.max(0.85, Math.min(1.25, input.clientHeight > 0 ? input.scrollHeight / input.clientHeight / 6 : 1));
  const portraitMultiplier = input.portraitMode ? 1.08 : 1;
  const mirroredMultiplier = input.mirroredMode ? 1.02 : 1;
  const columnsMultiplier = input.splitScreen ? 0.92 : 1;
  return fontMultiplier * viewportMultiplier * portraitMultiplier * mirroredMultiplier * columnsMultiplier;
}
