const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2025-08" → "Aug 2025" */
export function month(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Period label; a null end means the role is ongoing. */
export function period(start: string, end: string | null): string {
  return `${month(start)} — ${end ? month(end) : "Present"}`;
}

/** Sort key, newest first. */
export function byStartDesc<T extends { data: { start: string } }>(a: T, b: T): number {
  return b.data.start.localeCompare(a.data.start);
}
