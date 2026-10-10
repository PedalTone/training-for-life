// A deliberate, mostly horizontal gesture; leave slow drags and scrolling alone.
export function swipeStep(dx: number, dy: number, elapsed: number): -1 | 0 | 1 {
  if (elapsed > 700 || Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2) return 0;
  return dx < 0 ? 1 : -1;
}
export const swipeTabs = ["home", "today", "week", "history", "performance", "more"] as const;
export function adjacentSwipeTab(current: typeof swipeTabs[number], step: number) {
  return swipeTabs[swipeTabs.indexOf(current) + step];
}
