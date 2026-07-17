import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Table2, Home, Lock } from "lucide-react";
import { activeCompetition } from "@/lib/run-state";

export const Route = createFileRoute("/compete")({
  head: () => ({
    meta: [
      { title: "Choose your competition — GAFFER" },
      { name: "description", content: "Knockout cup or a full league season — pick how your squad proves itself." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CompetePage,
});

function CompetePage() {
  // Once you're committed to a competition you can't jump to the other —
  // only a New Game (which wipes the run) frees the choice. Read after mount
  // so the server render (no localStorage) doesn't mismatch on hydration.
  const [active, setActive] = useState<"cup" | "league" | null>(null);
  useEffect(() => setActive(activeCompetition()), []);
  return (
    <div className="min-h-screen bg-background text-foreground grain">
      <header className="sticky top-0 z-40 border-b border-border backdrop-blur-xl bg-background/70">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/tactics" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="w-4 h-4" /> Tactics
            </Link>
            <div className="w-px h-6 bg-border" />
            <div className="font-display text-2xl tracking-widest">COMPETE</div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/history" title="Trophy cabinet" className="grid place-items-center w-10 h-10 rounded-full border border-border hover:border-primary hover:text-primary transition">
              <Trophy className="w-4 h-4" />
            </Link>
            <Link to="/home" title="Home" className="grid place-items-center w-10 h-10 rounded-full border border-border hover:border-primary hover:text-primary transition">
              <Home className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center">
          <div className="font-mono text-xs uppercase tracking-widest text-primary">Squad locked · Tactics set</div>
          <h1 className="mt-3 font-display text-6xl md:text-7xl leading-[0.9]">
            How do you want<br /><span className="text-primary italic">to prove it?</span>
          </h1>
        </div>

        {active && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            You're committed to the {active === "cup" ? "Champions Cup" : "Draft League"} for this run.
            Start a new game to switch competitions.
          </p>
        )}

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <CompetitionCard
            to="/tournament"
            icon={<Trophy className="w-8 h-8" />}
            title="CHAMPIONS CUP"
            tagline="Knockout"
            body="Sixteen clubs, a random draw, four rounds. Lose once and the whole run is over — no second chances, maximum drama."
            points={["16 teams · UCL-style draw", "Penalties settle level ties", "One defeat ends the run"]}
            delay={0.1}
            locked={active === "league"}
            enter={active === "cup" ? "Continue" : "Enter"}
          />
          <CompetitionCard
            to="/league"
            icon={<Table2 className="w-8 h-8" />}
            title="DRAFT LEAGUE"
            tagline="Season"
            body="You and all twenty Premier League clubs in one table, each faced once. Draws count, every point matters, the table never lies."
            points={["21 teams · single round-robin", "Win 3 · Draw 1 · Loss 0", "Finish top to take the title"]}
            delay={0.2}
            locked={active === "cup"}
            enter={active === "league" ? "Continue" : "Enter"}
          />
        </div>
      </main>
    </div>
  );
}

function CompetitionCard({ to, icon, title, tagline, body, points, delay, locked = false, enter = "Enter" }: {
  to: string; icon: React.ReactNode; title: string; tagline: string; body: string; points: string[]; delay: number; locked?: boolean; enter?: string;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <div className={locked ? "text-muted-foreground" : "text-primary"}>{icon}</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{tagline}</div>
      </div>
      <div className="mt-4 font-display text-4xl">{title}</div>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{body}</p>
      <ul className="mt-5 space-y-1.5">
        {points.map((p) => (
          <li key={p} className="flex gap-2 text-xs text-muted-foreground">
            <span className={locked ? "text-muted-foreground" : "text-primary"}>·</span>{p}
          </li>
        ))}
      </ul>
      <div className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold ${locked ? "text-muted-foreground" : "text-primary"}`}>
        {locked ? (
          <><Lock className="w-3.5 h-3.5" /> Locked this run</>
        ) : (
          <>{enter} <span className="group-hover:translate-x-1 transition">→</span></>
        )}
      </div>
    </>
  );

  return (
    <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay, type: "spring", stiffness: 180, damping: 20 }}>
      {locked ? (
        <div
          aria-disabled
          title="Start a new game to switch competitions"
          className="block h-full rounded-2xl border border-border bg-surface p-8 opacity-50 cursor-not-allowed select-none"
        >
          {inner}
        </div>
      ) : (
        <Link
          to={to}
          className="group block h-full rounded-2xl border border-border bg-surface p-8 hover:border-primary/60 hover:bg-surface-2 transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_var(--crimson)]"
        >
          {inner}
        </Link>
      )}
    </motion.div>
  );
}
