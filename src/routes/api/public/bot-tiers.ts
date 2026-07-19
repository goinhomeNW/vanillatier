import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const VALID_TIERS = new Set([
  "HT1","LT1","HT2","LT2","HT3","LT3","HT4","LT4","HT5","LT5",
]);
const VALID_REGIONS = new Set(["NA","EU","AS","SA","OCE","AF"]);
const RETIRABLE = new Set(["HT1","LT1","HT2","LT2"]);

function hasRetiredMark(v: unknown): boolean {
  return typeof v === "string" && /^\(R\)/i.test(v.trim());
}
function cleanTier(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/^\(R\)/i, "").trim().toUpperCase();
  return VALID_TIERS.has(t) ? t : null;
}

export const Route = createFileRoute("/api/public/bot-tiers")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () => {
        try {
          const res = await fetch("http://185.14.93.211:9014/api/tiers", {
            headers: { Accept: "application/json" },
          });
          if (!res.ok) {
            return new Response(
              JSON.stringify({ error: `bot ${res.status}` }),
              { status: 502, headers: CORS },
            );
          }
          const raw = (await res.json()) as Record<string, {
            uuid?: string;
            name?: string;
            region?: string;
            tiers?: Record<string, string>;
            peaks?: Record<string, string>;
            retired?: boolean;
          }>;

          const players = Object.values(raw)
            .map((p) => {
              const current = cleanTier(p.tiers?.vanilla);
              const peak = cleanTier(p.peaks?.vanilla) ?? current;
              if (!current && !peak) return null;
              const region = (p.region ?? "").toUpperCase();
              const retiredRaw =
                !!p.retired || hasRetiredMark(p.peaks?.vanilla) || hasRetiredMark(p.tiers?.vanilla);
              const retired = retiredRaw && !!peak && RETIRABLE.has(peak);
              return {
                uuid: p.uuid ?? "",
                username: p.name ?? "",
                region: VALID_REGIONS.has(region) ? region : "EU",
                currentTier: current,
                peakTier: peak,
                retired,
              };
            })
            .filter((p): p is NonNullable<typeof p> => !!p && !!p.username);

          return new Response(JSON.stringify({ players }), { headers: CORS });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "fetch failed";
          return new Response(JSON.stringify({ error: msg }), {
            status: 502,
            headers: CORS,
          });
        }
      },
    },
  },
});
