import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TIER_POINTS, avatarFor, bodyFor, pointsForPlayer, rankFromPoints } from "@/lib/tiers";
import { TierBadge, EmptyTierDot } from "./TierBadge";
import { Trophy, ExternalLink } from "lucide-react";
import { usePlayers } from "@/lib/players-store";
import { useMemo } from "react";

interface Props {
  playerId: string | null;
  onClose: () => void;
}

export function PlayerModal({ playerId, onClose }: Props) {
  const players = usePlayers();
  const player = useMemo(
    () => players.find((p) => p.id === playerId) ?? null,
    [players, playerId],
  );

  // Position by points among all players (incl. retired)
  const position = useMemo(() => {
    if (!player) return null;
    const sorted = [...players].sort((a, b) => pointsForPlayer(b) - pointsForPlayer(a));
    const i = sorted.findIndex((p) => p.id === player.id);
    return i >= 0 ? i + 1 : null;
  }, [players, player]);

  if (!player) {
    return (
      <Dialog open={false} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const points = pointsForPlayer(player);
  const rank = rankFromPoints(points);
  const peakPts = player.peakTier ? TIER_POINTS[player.peakTier] : 0;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden glass-strong border-border/60 bg-card/80">
        <div className="relative px-6 pt-8 pb-6">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/20 via-transparent to-transparent pointer-events-none" />

          <div className="relative flex flex-col items-center text-center gap-3">
            <div className="relative h-24 w-24 rounded-full overflow-hidden bg-secondary/60 border-2 border-border/60 glow-primary">
              <img
                src={bodyFor(player)}
                alt={player.username}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = avatarFor(player);
                }}
              />
            </div>
            <h2 className="text-2xl font-black tracking-tight">{player.username}</h2>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30">
              <Trophy className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-semibold">{rank}</span>
            </div>

            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {regionName(player.region)}
            </div>

            <a
              href={`https://namemc.com/profile/${encodeURIComponent(player.username)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-secondary/60 hover:bg-secondary border border-border/60"
            >
              NameMC <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="px-6 pb-3">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
            Position
          </div>
          <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl font-black italic">{position ? `${position}.` : "–"}</span>
            <Trophy className="h-5 w-5 text-gold" />
            <span className="font-bold uppercase tracking-wider text-sm">Overall</span>
            <span className="ml-auto text-sm text-muted-foreground">({points} points)</span>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Tiers</div>
          <div className="glass rounded-xl px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              {!player.currentTier && (
                <span className="text-sm text-muted-foreground">No tiers</span>
              )}
              {player.currentTier && (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <TierBadge tier={player.currentTier} />
                      </span>
                    </TooltipTrigger>
                    {player.peakTier && (
                      <TooltipContent className="glass-strong border-border/60 bg-card/95 px-3 py-2 text-center">
                        <div className="font-black tracking-tight">Peak {player.peakTier}</div>
                        <div className="text-xs text-muted-foreground">{peakPts} points</div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
              {Array.from({ length: player.currentTier ? 7 : 8 }).map((_, i) => (
                <EmptyTierDot key={`e-${i}`} />
              ))}
            </div>
            {player.retired && (
              <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-crimson">
                Retired
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function regionName(r: string) {
  switch (r) {
    case "NA": return "North America";
    case "EU": return "Europe";
    case "AS": return "Asia";
    case "SA": return "South America";
    case "OCE": return "Oceania";
    case "AF": return "Africa";
    default: return r;
  }
}
