/** Date and time formatting helpers (German locale). */

/** Absolute date, e.g. "8. Juli 2026". */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Relative "last opened" label, e.g. "vor 3 Tagen". */
export function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return 'Noch nicht geöffnet';

  const diff = Date.now() - timestamp;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'Gerade eben';
  if (diff < hour) {
    const m = Math.floor(diff / minute);
    return `vor ${m} Min.`;
  }
  if (diff < day) {
    const h = Math.floor(diff / hour);
    return h === 1 ? 'vor 1 Stunde' : `vor ${h} Stunden`;
  }
  const d = Math.floor(diff / day);
  if (d === 1) return 'Gestern';
  if (d < 7) return `vor ${d} Tagen`;

  return new Date(timestamp).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Duration in minutes as a compact label, e.g. "1 Std. 5 Min.". */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return 'weniger als 1 Min.';
  const total = Math.round(minutes);
  if (total < 60) return `${total} Min.`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours} Std.` : `${hours} Std. ${rest} Min.`;
}
