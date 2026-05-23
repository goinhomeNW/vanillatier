import { Link, useLocation } from "@tanstack/react-router";
import { Trophy, Shield } from "lucide-react";

export function Header() {
  const { pathname } = useLocation();
  const onAdmin = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-border/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary glow-primary">
            <Trophy className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-black tracking-tight text-gradient">MCranks</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Vanilla Tiers</span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
            activeProps={{ className: "px-3 py-2 rounded-md text-sm font-semibold text-foreground bg-white/5" }}
            activeOptions={{ exact: true }}
          >
            Leaderboard
          </Link>
          <Link
            to="/admin"
            className="ml-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border border-border/70 hover:bg-white/5 transition"
          >
            <Shield className="h-4 w-4" />
            {onAdmin ? "Admin" : "Admin"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
