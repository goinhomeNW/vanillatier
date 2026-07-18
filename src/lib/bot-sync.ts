let lastSync = 0;
let inflight: Promise<void> | null = null;
const INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

export function triggerBotSync(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const now = Date.now();
  if (inflight) return inflight;
  if (now - lastSync < INTERVAL_MS) return Promise.resolve();
  lastSync = now;
  inflight = fetch("/api/public/sync-tiers", { method: "POST" })
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => { inflight = null; });
  return inflight;
}
