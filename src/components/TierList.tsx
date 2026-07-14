import { useMemo } from "react";
import { usePlayers } from "@/lib/players-store";
import type { Player, TierKey } from "@/lib/tiers";
import { avatarFor, pointsForPlayer, tierRank } from "@/lib/tiers";
import { Trophy } from "lucide-react";

interface Props {
  onSelect: (id: string) => void;
}

const TIER_LEVELS = [1, 2, 3, 4, 5] as const;

export function TierList({ onSelect }: Props) {
  const players = usePlayers();

  // Group by tier level (1..5). A player appears in their PEAK tier level.
  // HT players listed above LT players inside the same level.
  const grouped = useMemo(() => {
    const map = new Map<number, Player[]>();
    for (const lvl of TIER_LEVELS) map.set(lvl, []);
    for (const p of players) {
      if (p.retired) continue;
      const t = p.peakTier ?? p.currentTier;
      if (!t) continue;
      const lvl = Number(t.slice(2)) as 1 | 2 | 3 | 4 | 5;
      map.get(lvl)!.push(p);
    }
    for (const lvl of TIER_LEVELS) {
      const arr = map.get(lvl)!;
      arr.sort((a, b) => {
        const ta = (a.peakTier ?? a.currentTier)!;
        const tb = (b.peakTier ?? b.currentTier)!;
        // HT before LT
        const r = tierRank(ta) - tierRank(tb);
        if (r !== 0) return r;
        return pointsForPlayer(b) - pointsForPlayer(a);
      });
    }
    return map;
  }, [players]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {TIER_LEVELS.map((lvl) => (
        <Column key={lvl} level={lvl} players={grouped.get(lvl) ?? []} onSelect={onSelect} />
      ))}
    </div>
  );
}

const TROPHY_TINT: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-zinc-300",
  3: "text-orange-400",
  4: "text-accent",
  5: "text-muted-foreground",
};

const HEADER_TINT: Record<number, string> = {
  1: "from-yellow-500/30 to-yellow-700/10 border-yellow-500/40",
  2: "from-zinc-300/20 to-zinc-500/10 border-zinc-300/30",
  3: "from-orange-500/25 to-orange-800/10 border-orange-500/40",
  4: "from-accent/20 to-accent/5 border-accent/30",
  5: "from-secondary/60 to-secondary/20 border-border/60",
};

function Column({
  level, players, onSelect,
}: { level: number; players: Player[]; onSelect: (id: string) => void }) {
  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col">
      <div className={`bg-gradient-to-b ${HEADER_TINT[level]} border-b px-4 py-3 flex items-center justify-center gap-2`}>
        <Trophy className={`h-5 w-5 ${TROPHY_TINT[level]}`} />
        <span className="text-lg font-black tracking-tight">Tier {level}</span>
      </div>
      <div className="divide-y divide-border/40">
        {players.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-muted-foreground">No players</div>
        )}
        {players.map((p) => {
          const t = (p.peakTier ?? p.currentTier)!;
          const ht = t.startsWith("HT");
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={
                "w-full flex items-center gap-2.5 px-3 py-2 transition group text-left " +
                (ht
                  ? "bg-tier-ht/15 hover:bg-tier-ht/25"
                  : "bg-tier-lt/[0.06] hover:bg-tier-lt/[0.12]")
              }
            >
              <img
                src={avatarFor(p)}
                alt=""
                className="h-7 w-7 rounded bg-secondary/40 border border-border/60"
                loading="lazy"
              />
              <span className="flex-1 truncate text-sm font-medium">{p.username}</span>
              <ChevronsUp
                className={
                  "h-4 w-4 transition " +
                  (ht ? "text-tier-ht" : "text-tier-lt/70")
                }
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
