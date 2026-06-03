/** Smoothly increments displayed progress while waiting on the network (no real API %). */
export function startProgressTicker(
  onTick: (pct: number) => void,
  from: number,
  to: number,
  step = 2,
  intervalMs = 350
) {
  let current = from;
  onTick(current);
  const id = window.setInterval(() => {
    current = Math.min(to, current + step);
    onTick(current);
    if (current >= to) window.clearInterval(id);
  }, intervalMs);
  return () => window.clearInterval(id);
}
