import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Leaderboard } from "@/components/Leaderboard";
import { PlayerModal } from "@/components/PlayerModal";
import { ListOrdered } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Vanilla Tiers" },
      { name: "description", content: "Competitive Vanilla Minecraft PvP leaderboard. Search, filter by tier and region." },
      { property: "og:title", content: "Leaderboard — Vanilla Tiers" },
      { property: "og:description", content: "The competitive Vanilla Minecraft PvP leaderboard." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary glow-primary">
            <ListOrdered className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gradient">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">Every ranked Vanilla PvP player, sorted by peak points.</p>
          </div>
        </div>
        <Leaderboard onSelect={setSelected} />
      </main>
      <PlayerModal playerId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
