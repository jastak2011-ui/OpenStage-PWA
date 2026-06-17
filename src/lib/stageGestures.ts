export type StageSwipeDirection = -1 | 0 | 1;

export type StageSwipeInput = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  minHorizontalDistance?: number;
};

export function getStageSwipeDirection({
  startX,
  startY,
  endX,
  endY,
  minHorizontalDistance = 50
}: StageSwipeInput): StageSwipeDirection {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (absX < minHorizontalDistance) return 0;
  if (absX <= absY) return 0;

  return deltaX < 0 ? 1 : -1;
}
