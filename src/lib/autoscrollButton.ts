export const autoscrollLongPressMs = 500;
export const autoscrollSpeedStep = 0.05;
export const autoscrollSpeedMin = 0.25;
export const autoscrollSpeedMax = 3;
export const autoscrollSpeedQuickPresets = [0.75, 1, 1.25, 1.5] as const;

export function shouldOpenAutoscrollSpeedPopover(pressDurationMs: number) {
  return pressDurationMs >= autoscrollLongPressMs;
}

export function clampAutoscrollSpeedMultiplier(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(autoscrollSpeedMax, Math.max(autoscrollSpeedMin, Number(value.toFixed(2))));
}

export function adjustAutoscrollSpeedMultiplier(current: number, delta: number) {
  return clampAutoscrollSpeedMultiplier(current + delta);
}
