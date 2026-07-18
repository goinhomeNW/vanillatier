import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const VALID_TIERS = new Set([
  "HT1","LT1","HT2","LT2","HT3","LT3","HT4","LT4","HT5","LT5",
]);
const VALID_REGIONS = new Set(["NA","EU","AS","SA","OCE","AF"]);

function cleanTier(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/^\(R\)/i, "").trim().toUpperCase();
  return VALID_TIERS.has(t) ? t : null;
}

interface BotEntry {
  uuid?: string;
  name?: string;
  region?: string;
  tiers?: Record<string, string>;
  peaks?: Record<string, string>;
  retired?: boolean;
}

interface Normalized {
  username: string;
  region: string;
  currentTier: string | null;
  peakTier: string | null;
  retired: boolean;
}

async function fetchBotPlayers(): Promise<Normalized[]> {
  const res = await fetch("http://185.14.93.211:9014/api/tiers", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`bot ${res.status}`);
  const raw = (await res.json()) as Record<string, BotEntry>;
  return Object.values(raw)
    .map((p): Normalized | null => {
      const current = cleanTier(p.tiers?.vanilla);
      const peak = cleanTier(p.peaks?.vanilla) ?? current;
      if (!current && !peak) return null;
      const region = (p.region ?? "").toUpperCase();
      const name = (p.name ?? "").trim();
      if (!name) return null;
      return {
        username: name,
        region: VALID_REGIONS.has(region) ? region : "EU",
        currentTier: current,
        peakTier: peak,
        retired: !!p.retired,
      };
    })
    .filter((p): p is Normalized => p !== null);
}

export const Route = createFileRoute("/api/public/sync-tiers")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () => runSync(),
      POST: async () => runSync(),
    },
  },
});

async function runSync(): Promise<Response> {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      return new Response(JSON.stringify({ error: "missing supabase env" }), {
        status: 500, headers: CORS,
      });
    }

    const supabase = createClient(url, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const bot = await fetchBotPlayers();
    if (bot.length === 0) {
      return new Response(JSON.stringify({ added: 0, updated: 0, total: 0 }), { headers: CORS });
    }

    const { data: existing, error: readErr } = await supabase
      .from("players")
      .select("id, username, region, current_tier, peak_tier, retired");
    if (readErr) throw new Error(readErr.message);

    const byName = new Map<string, {
      id: string; username: string; region: string;
      current_tier: string | null; peak_tier: string | null; retired: boolean;
    }>();
    for (const r of existing ?? []) byName.set(r.username.toLowerCase(), r);

    const toInsert: Array<{
      username: string; region: string;
      current_tier: string | null; peak_tier: string | null; retired: boolean;
    }> = [];
    const updates: Array<Promise<unknown>> = [];
    let updatedCount = 0;

    for (const p of bot) {
      const key = p.username.toLowerCase();
      const prev = byName.get(key);
      if (!prev) {
        toInsert.push({
          username: p.username,
          region: p.region,
          current_tier: p.currentTier,
          peak_tier: p.peakTier,
          retired: p.retired,
        });
        continue;
      }
      const changed =
        prev.username !== p.username ||
        prev.region !== p.region ||
        prev.current_tier !== p.currentTier ||
        prev.peak_tier !== p.peakTier ||
        prev.retired !== p.retired;
      if (changed) {
        updatedCount++;
        updates.push(
          supabase.from("players").update({
            username: p.username,
            region: p.region,
            current_tier: p.currentTier,
            peak_tier: p.peakTier,
            retired: p.retired,
          }).eq("id", prev.id),
        );
      }
    }

    if (toInsert.length > 0) {
      const { error: insErr } = await supabase.from("players").insert(toInsert);
      if (insErr) throw new Error(insErr.message);
    }
    if (updates.length > 0) await Promise.all(updates);

    return new Response(JSON.stringify({
      added: toInsert.length,
      updated: updatedCount,
      total: bot.length,
    }), { headers: CORS });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "sync failed";
    return new Response(JSON.stringify({ error: msg }), { status: 502, headers: CORS });
  }
}
