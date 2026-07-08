/**
 * Generates a reasonably unique, sortable id without pulling in a uuid
 * dependency. Format: <base36 timestamp>-<random>. Good enough for a
 * local-first app where ids never leave the device.
 */
export function createId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${time}-${rand}`;
}
