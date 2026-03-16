/** Format minutes as "1h 20m" or "45m" */
export function formatDuration(minutes: number): string {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Format a date string as "Mon 16 Mar" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

/** Format a datetime string as "18:10" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  });
}

/** Return elapsed seconds between a date and now */
export function elapsedSeconds(since: string): number {
  return Math.floor((Date.now() - new Date(since).getTime()) / 1000);
}

/** Format seconds as "00:00:00" */
export function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

/** Colour palette for subjects */
const PALETTE = [
  '#4A7C59', '#D4A017', '#C05E3C', '#3C6EA6', '#7C4A7C',
  '#4A7C7C', '#A67C3C', '#7C3C4A', '#3C7C4A', '#6C4AA6',
];
export function subjectColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}
