import { useMemo, useState } from "react";
import { usePlayers } from "@/lib/players-store";
import { avatarFor, pointsForPlayer, rankFromPoints, REGIONS, TIER_ORDER } from "@/lib/tiers";
import type { Player, Region, TierKey } from "@/lib/tiers";
import { TierBadge } from "./TierBadge";
import { Search, Trophy, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  onSelect: (id: string) => void;
}

const STATUS = ["all", "active", "retired"] as const;
type Status = (typeof STATUS)[number];

export function Leaderboard({ onSelect }: Props) {
  const players = usePlayers();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<"all" | Region>("all");
  const [tier, setTier] = useState<"all" | TierKey>("all");
  const [status, setStatus] = useState<Status>("all");

  const rows = useMemo(() => {
    let list = [...players];
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter((p) => p.username.toLowerCase().includes(needle));
    }
    if (region !== "all") list = list.filter((p) => p.region === region);
    if (tier !== "all") list = list.filter((p) => p.currentTier === tier || p.peakTier === tier);
    if (status !== "all") list = list.filter((p) => (status === "retired" ? p.retired : !p.retired));
    return list.sort((a, b) => pointsForPlayer(b) - pointsForPlayer(a));
  }, [players, q, region, tier, status]);

  return (
    <div className="space-y-4">
      <div className="glass-strong rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search players..."
              className="pl-9 h-10 bg-secondary/40 border-border/60"
            />
          </div>
          <Pill label="Region">
            <Select value={region} onChange={(v) => setRegion(v as "all" | Region)} options={[
              { v: "all", l: "All" },
              ...REGIONS.map((r) => ({ v: r, l: r })),
            ]} />
          </Pill>
          <Pill label="Tier">
            <Select value={tier} onChange={(v) => setTier(v as "all" | TierKey)} options={[
              { v: "all", l: "All" },
              ...TIER_ORDER.map((t) => ({ v: t, l: t })),
            ]} />
          </Pill>
          <Pill label="Status">
            <Select value={status} onChange={(v) => setStatus(v as Status)} options={STATUS.map((s) => ({ v: s, l: s }))} />
          </Pill>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[60px_1fr_70px_120px] sm:grid-cols-[80px_1fr_90px_1fr_90px] px-4 sm:px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground border-b border-border/60">
          <div>#</div>
          <div>Player</div>
          <div className="text-center">Region</div>
          <div className="hidden sm:block">Tiers</div>
          <div className="text-right">Points</div>
        </div>

        {rows.length === 0 && (
          <div className="px-6 py-16 text-center text-muted-foreground">
            No players yet. Add some from the{" "}
            <span className="text-foreground font-semibold">Admin</span> dashboard.
          </div>
        )}

        {rows.map((p, i) => (
          <Row key={p.id} player={p} rank={i + 1} onClick={() => onSelect(p.id)} />
        ))}
      </div>
    </div>
  );
}

function Row({ player, rank, onClick }: { player: Player; rank: number; onClick: () => void }) {
  const points = pointsForPlayer(player);
  const title = rankFromPoints(points);
  const tiers = [player.peakTier, player.currentTier].filter(Boolean) as TierKey[];
  const uniq = Array.from(new Set(tiers));

  const rankColor =
    rank === 1 ? "from-yellow-500/30 to-amber-700/10 border-yellow-500/40"
    : rank === 2 ? "from-zinc-300/20 to-zinc-500/10 border-zinc-300/30"
    : rank === 3 ? "from-orange-500/20 to-orange-800/10 border-orange-500/30"
    : "from-white/5 to-transparent border-border/50";

  return (
    <button
      onClick={onClick}
      className="w-full text-left grid grid-cols-[60px_1fr_70px_120px] sm:grid-cols-[80px_1fr_90px_1fr_90px] items-center px-4 sm:px-6 py-3 border-b border-border/40 hover:bg-white/[0.03] transition group animate-fade-in-up"
    >
      <div className={`relative h-12 w-14 sm:w-16 rounded-md bg-gradient-to-br ${rankColor} border flex items-center justify-center font-black italic text-xl`}>
        {rank}.
      </div>
      <div className="flex items-center gap-3 min-w-0 pl-3">
        <img
          src={avatarFor(player)}
          alt=""
          className="h-9 w-9 rounded-md border border-border/60 bg-secondary/40"
          loading="lazy"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold truncate">{player.username}</span>
            {player.retired && (
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-crimson/20 text-crimson border border-crimson/40">
                Retired
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Trophy className="h-3 w-3 text-gold" />
            <span>{title}</span>
            <span className="opacity-60">({points} points)</span>
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <RegionPill region={player.region} />
      </div>
      <div className="hidden sm:flex flex-wrap gap-1.5">
        {uniq.map((t) => <TierBadge key={t} tier={t} size="sm" />)}
        {uniq.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
      </div>
      <div className="text-right font-bold tabular-nums">{points}</div>
    </button>
  );
}

function RegionPill({ region }: { region: Region }) {
  const color =
    region === "NA" ? "bg-crimson/20 text-crimson border-crimson/40"
    : region === "EU" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
    : region === "AS" ? "bg-accent/20 text-accent border-accent/40"
    : "bg-secondary/60 text-foreground/80 border-border/60";
  return (
    <span className={`inline-flex items-center justify-center min-w-10 h-6 rounded-md text-[11px] font-bold border ${color}`}>
      {region}
    </span>
  );
}

function Pill({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="inline-flex items-center gap-2 h-10 px-3 rounded-md bg-secondary/40 border border-border/60">
      <Filter className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent text-sm font-semibold outline-none capitalize"
    >
      {options.map((o) => (
        <option key={o.v} value={o.v} className="bg-card">{o.l}</option>
      ))}
    </select>
  );
}
