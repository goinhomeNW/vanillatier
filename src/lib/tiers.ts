export type TierKey =
  | "HT1" | "LT1"
  | "HT2" | "LT2"
  | "HT3" | "LT3"
  | "HT4" | "LT4"
  | "HT5" | "LT5";

export const TIER_POINTS: Record<TierKey, number> = {
  HT1: 60, LT1: 45,
  HT2: 30, LT2: 20,
  HT3: 10, LT3: 6,
  HT4: 4,  LT4: 3,
  HT5: 2,  LT5: 1,
};

export const TIER_ORDER: TierKey[] = [
  "HT1","LT1","HT2","LT2","HT3","LT3","HT4","LT4","HT5","LT5",
];

export const RETIRABLE_TIERS: TierKey[] = ["HT1","LT1","HT2","LT2"];

export function tierRank(t: TierKey): number {
  return TIER_ORDER.indexOf(t);
}

export function isHT(t: TierKey): boolean {
  return t.startsWith("HT");
}

export type Region = "NA" | "EU" | "AS" | "SA" | "OCE" | "AF";
export const REGIONS: Region[] = ["NA","EU","AS","SA","OCE","AF"];

export type RankTitle =
  | "Combat Master" | "Combat Ace" | "Combat Specialist"
  | "Combat Cadet" | "Combat Novice" | "Combat Rookie";

export function rankFromPoints(points: number): RankTitle {
  if (points >= 250) return "Combat Master";
  if (points >= 150) return "Combat Ace";
  if (points >= 80)  return "Combat Specialist";
  if (points >= 30)  return "Combat Cadet";
  if (points >= 10)  return "Combat Novice";
  return "Combat Rookie";
}

export interface Player {
  id: string;
  username: string;
  uuid: string;
  region: Region;
  /** Per-mode current tier (Vanilla only here) */
  currentTier: TierKey | null;
  /** Per-mode peak tier */
  peakTier: TierKey | null;
  retired: boolean;
  notes?: string;
  avatarUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export function avatarFor(p: Pick<Player, "uuid" | "username" | "avatarUrl">): string {
  if (p.avatarUrl) return p.avatarUrl;
  // Use crafatar for UUID-based head; fallback to username via mc-heads
  if (p.uuid && p.uuid.length >= 8) {
    return `https://crafatar.com/avatars/${p.uuid}?size=80&overlay`;
  }
  return `https://mc-heads.net/avatar/${encodeURIComponent(p.username)}/80`;
}

export function bodyFor(p: Pick<Player, "uuid" | "username" | "avatarUrl">): string {
  if (p.avatarUrl) return p.avatarUrl;
  if (p.uuid && p.uuid.length >= 8) {
    return `https://crafatar.com/renders/body/${p.uuid}?size=128&overlay`;
  }
  return `https://mc-heads.net/body/${encodeURIComponent(p.username)}/128`;
}

export function pointsForPlayer(p: Player): number {
  const t = p.peakTier ?? p.currentTier;
  return t ? TIER_POINTS[t] : 0;
}

/** Trophy tint per tier variant. HT = darker/richer, LT = lighter. */
export const TROPHY_COLOR: Record<TierKey, string> = {
  HT1: "text-yellow-400",
  LT1: "text-orange-400",
  HT2: "text-zinc-400",
  LT2: "text-zinc-200",
  HT3: "text-amber-700",
  LT3: "text-amber-500",
  HT4: "text-accent",
  LT4: "text-accent/70",
  HT5: "text-muted-foreground",
  LT5: "text-muted-foreground/70",
};

export function trophyColorFor(t: TierKey): string {
  return TROPHY_COLOR[t];
}
