import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Leaderboard } from "@/components/Leaderboard";
import { TierList } from "@/components/TierList";
import { PlayerModal } from "@/components/PlayerModal";
import { Trophy, ListOrdered, Layers } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MCranks — Vanilla Minecraft PvP Tier List & Leaderboard" },
      { name: "description", content: "Official MCranks Vanilla tier list and competitive leaderboard. Track HT and LT tiers, regions, and player rankings." },
      { property: "og:title", content: "MCranks — Vanilla Tier List" },
      { property: "og:description", content: "Competitive Vanilla Minecraft PvP rankings." },
    ],
  }),
  component: Index,
});

type Tab = "leaderboard" | "tierlist";

function Index() {
  const [tab, setTab] = useState<Tab>("leaderboard");
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Hero */}
        <section className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-4">
            <Trophy className="h-3.5 w-3.5 text-gold" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Competitive Rankings
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
            <span className="text-gradient">MCranks</span>{" "}
            <span className="text-foreground">Vanilla</span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            The official tier list & leaderboard for Vanilla Minecraft PvP.
            HT tiers always rank above LT tiers.
          </p>
        </section>

        {/* Mode chip + Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-strong">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold uppercase tracking-wider">Vanilla</span>
            <span className="text-xs text-muted-foreground">— only gamemode</span>
          </div>

          <div className="glass rounded-xl p-1 flex">
            <TabButton active={tab === "leaderboard"} onClick={() => setTab("leaderboard")}>
              <ListOrdered className="h-4 w-4" />
              Leaderboard
            </TabButton>
            <TabButton active={tab === "tierlist"} onClick={() => setTab("tierlist")}>
              <Layers className="h-4 w-4" />
              Tier List
            </TabButton>
          </div>
        </div>

        {tab === "leaderboard" ? (
          <Leaderboard onSelect={setSelected} />
        ) : (
          <TierList onSelect={setSelected} />
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-6 py-10 text-center text-xs text-muted-foreground">
        MCranks · Vanilla PvP Tiers · {new Date().getFullYear()}
      </footer>

      <PlayerModal playerId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function TabButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
        active
          ? "bg-gradient-primary text-primary-foreground glow-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}
