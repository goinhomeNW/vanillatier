import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SkinViewer } from "@/components/SkinViewer";
import { PlayerModal } from "@/components/PlayerModal";
import { usePlayers } from "@/lib/players-store";
import { pointsForPlayer, rankFromPoints } from "@/lib/tiers";
import type { Player } from "@/lib/tiers";
import { Swords, ListOrdered, Layers, Trophy, ArrowRight, Crown } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vanilla Tiers — Competitive Minecraft PvP Rankings" },
      { name: "description", content: "The home of competitive Vanilla Minecraft PvP. Browse the leaderboard, tier list, and see the top 3 champions on the podium." },
      { property: "og:title", content: "Vanilla Tiers — Competitive Minecraft PvP" },
      { property: "og:description", content: "Leaderboard, tier list, and the reigning top 3 of competitive Vanilla PvP." },
    ],
  }),
  component: Home,
});

/**
 * YouTube video id used as the hero background (looping, muted, no chrome).
 * Replace with any YouTube video id.
 */
const HERO_YOUTUBE_ID = "g3hSCcXKVN0";

function Home() {
  const players = usePlayers();
  const [selected, setSelected] = useState<string | null>(null);

  const ranked = useMemo(() => {
    return [...players]
      .filter((p) => !p.retired)
      .sort((a, b) => pointsForPlayer(b) - pointsForPlayer(a));
  }, [players]);

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3, 10);

  // Podium display order: 2nd, 1st, 3rd
  const podiumOrder: (Player | undefined)[] = [top3[1], top3[0], top3[2]];

  return (
    <div className="min-h-screen">
      <Header />

      {/* HERO with video background + podium overlay */}
      <section className="relative overflow-hidden">
        <VideoBackground clips={HERO_CLIPS} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-24">
          {/* Title */}
          <div className="text-center mb-14 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-5">
              <Swords className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Competitive Minecraft PvP
              </span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight">
              <span className="text-gradient">Vanilla</span>{" "}
              <span className="text-foreground">Tiers</span>
            </h1>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              The home of competitive Vanilla PvP. Rankings, tier list, and the reigning champions
              of the sword.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <CTA to="/leaderboard" icon={<ListOrdered className="h-4 w-4" />} primary>
                View Leaderboard
              </CTA>
              <CTA to="/tierlist" icon={<Layers className="h-4 w-4" />}>
                View Tier List
              </CTA>
            </div>
          </div>

          {/* Podium */}
          <div className="relative">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass">
                <Crown className="h-3.5 w-3.5 text-gold" />
                <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Top 3 Contenders
                </span>
              </div>
            </div>

            {ranked.length === 0 ? (
              <div className="glass-strong rounded-2xl px-6 py-12 text-center text-muted-foreground max-w-md mx-auto">
                No ranked players yet. Add players in the admin panel.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-end max-w-4xl mx-auto">
                {podiumOrder.map((p, i) => {
                  // i=0 -> 2nd, i=1 -> 1st, i=2 -> 3rd
                  const place = i === 0 ? 2 : i === 1 ? 1 : 3;
                  return (
                    <PodiumSlot
                      key={p?.id ?? `empty-${i}`}
                      player={p}
                      place={place}
                      onSelect={setSelected}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* REST OF TOP 10 */}
      {rest.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">The Contenders</h2>
              <p className="text-sm text-muted-foreground">Ranks 4–{3 + rest.length}, climbing the ladder.</p>
            </div>
            <Link
              to="/leaderboard"
              className="text-sm text-primary hover:text-primary/80 font-semibold inline-flex items-center gap-1"
            >
              Full leaderboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="glass rounded-2xl overflow-hidden divide-y divide-border/40">
            {rest.map((p, i) => (
              <ContenderRow key={p.id} player={p} rank={i + 4} onClick={() => setSelected(p.id)} />
            ))}
          </div>
        </section>
      )}

      <footer className="mx-auto max-w-7xl px-6 py-10 text-center text-xs text-muted-foreground">
        Vanilla Tiers · Competitive Minecraft PvP · {new Date().getFullYear()}
      </footer>

      <PlayerModal playerId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

/* ----------------------------- Sub-components ----------------------------- */

function CTA({
  to, icon, children, primary,
}: { to: "/leaderboard" | "/tierlist"; icon: React.ReactNode; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      to={to}
      className={
        primary
          ? "inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-bold text-sm glow-primary hover:brightness-110 transition"
          : "inline-flex items-center gap-2 px-5 py-3 rounded-xl glass-strong text-foreground font-bold text-sm hover:bg-white/10 transition"
      }
    >
      {icon}
      {children}
    </Link>
  );
}

const PLACE_STYLES: Record<number, { border: string; glow: string; badge: string; label: string; height: string; medal: string }> = {
  1: {
    border: "border-gold/60",
    glow: "shadow-[0_0_60px_-10px_oklch(0.82_0.17_85/0.55)]",
    badge: "bg-gold/25 text-gold border-gold/50",
    label: "1st — Champion",
    height: "sm:h-[420px]",
    medal: "text-gold",
  },
  2: {
    border: "border-primary/40",
    glow: "shadow-[0_0_45px_-10px_oklch(0.62_0.24_295/0.55)]",
    badge: "bg-primary/20 text-primary border-primary/40",
    label: "2nd",
    height: "sm:h-[360px]",
    medal: "text-zinc-300",
  },
  3: {
    border: "border-accent/40",
    glow: "shadow-[0_0_45px_-10px_oklch(0.7_0.2_250/0.5)]",
    badge: "bg-accent/20 text-accent border-accent/40",
    label: "3rd",
    height: "sm:h-[340px]",
    medal: "text-orange-400",
  },
};

function PodiumSlot({
  player, place, onSelect,
}: { player?: Player; place: number; onSelect: (id: string) => void }) {
  const style = PLACE_STYLES[place];
  const [hover, setHover] = useState(false);

  if (!player) {
    return (
      <div className={`glass rounded-2xl border ${style.border} ${style.height} flex flex-col items-center justify-center p-6 text-center opacity-60`}>
        <Crown className={`h-8 w-8 ${style.medal} mb-2 opacity-50`} />
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{style.label}</div>
        <div className="text-sm mt-2 text-muted-foreground">Slot open</div>
      </div>
    );
  }

  const points = pointsForPlayer(player);
  const rank = rankFromPoints(points);

  return (
    <button
      onClick={() => onSelect(player.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className={`group relative glass-strong rounded-2xl border ${style.border} ${style.glow} ${style.height} flex flex-col items-center justify-end p-4 pt-6 transition hover:scale-[1.02] text-left w-full`}
    >
      {/* Place badge */}
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${style.badge}`}>
        <Crown className={`h-3.5 w-3.5 ${style.medal}`} />
        {style.label}
      </div>

      {/* Skin stand */}
      <div className="flex-1 flex items-end justify-center w-full min-h-[220px]">
        <div className="relative">
          <SkinViewer
            player={player}
            width={180}
            height={260}
            emote={hover}
          />
          {/* Podium base glow disc */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-3 w-32 rounded-full bg-primary/30 blur-md" />
        </div>
      </div>

      {/* Player info */}
      <div className="mt-3 text-center w-full">
        <div className="font-black text-lg tracking-tight truncate">{player.username}</div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{player.region}</div>
        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Trophy className="h-3 w-3 text-gold" />
          <span>{rank}</span>
          <span className="opacity-60">· {points} pts</span>
        </div>
      </div>
    </button>
  );
}

function ContenderRow({
  player, rank, onClick,
}: { player: Player; rank: number; onClick: () => void }) {
  const points = pointsForPlayer(player);
  const t = player.peakTier ?? player.currentTier;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 sm:px-6 py-3 hover:bg-white/[0.04] transition text-left"
    >
      <div className="w-8 text-lg font-black italic text-muted-foreground tabular-nums">{rank}.</div>
      <img
        src={`https://mc-heads.net/avatar/${encodeURIComponent(player.username)}/48`}
        alt=""
        className="h-9 w-9 rounded-md border border-border/60 bg-secondary/40"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{player.username}</div>
        <div className="text-xs text-muted-foreground">{player.region} · {t ?? "—"}</div>
      </div>
      <div className="text-right">
        <div className="font-black tabular-nums">{points}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">pts</div>
      </div>
    </button>
  );
}

/* ----------------------------- Video BG ----------------------------- */

function VideoBackground({ clips }: { clips: string[] }) {
  const src = clips[0];
  return (
    <div className="absolute inset-0 -z-0 overflow-hidden">
      {src ? (
        <video
          key={src}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      )}
      {/* Purple + dark overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.35_0.22_295/0.55),transparent_60%),radial-gradient(ellipse_at_bottom,oklch(0.25_0.18_280/0.7),transparent_65%),linear-gradient(180deg,oklch(0.14_0.03_285/0.85),oklch(0.12_0.025_280/0.95))]" />
      {/* Grain / scanline vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,oklch(0.1_0.02_280/0.55))]" />
    </div>
  );
}
