import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy, Table2, Home, ArrowRight, ClipboardList } from "lucide-react";
import { loadHistory, computeRecords, type RunRecord, type RecordBook } from "@/lib/history";
import { VerdictChip } from "@/components/VerdictChip";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Trophy Cabinet — GAFFER" },
      { name: "description", content: "Every run, every trophy, all-time records across your drafts." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [history, setHistory] = useState<RunRecord[]>([]);
  const [records, setRecords] = useState<RecordBook | null>(null);
  useEffect(() => {
    const h = loadHistory();
    setHistory(h);
    setRecords(computeRecords(h));
  }, []);

  const runs = [...history].reverse();

  return (
    <div className="min-h-screen bg-background text-foreground grain">
      <header className="sticky top-0 z-40 border-b border-border backdrop-blur-xl bg-background/70">
        <div className="mx-auto max-w-5xl px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
              <Home className="w-4 h-4" /> Home
            </Link>
            <div className="w-px h-6 bg-border" />
            <div className="font-display text-2xl tracking-widest">TROPHY CABINET</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 sm:px-6 py-6 sm:py-10">
        {!records || records.totalRuns === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-14 h-14 mx-auto text-muted-foreground" />
            <h2 className="mt-6 font-display text-5xl">NOTHING IN THE CABINET.</h2>
            <p className="mt-3 text-muted-foreground">Draft a squad and go win something.</p>
            <Link to="/draft" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110">
              Start drafting <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* counters */}
            <div className="grid grid-cols-3 gap-3">
              <Counter icon={<Trophy className="w-6 h-6" />} label="Cup wins" value={records.cupWins} />
              <Counter icon={<Trophy className="w-6 h-6" />} label="League titles" value={records.leagueTitles} />
              <Counter icon={<ClipboardList className="w-6 h-6" />} label="Total runs" value={records.totalRuns} />
            </div>

            {/* records */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <Rec label="Biggest win" value={records.biggestWin ?? "—"} />
              <Rec label="Most goals (run)" value={records.mostGoalsInRun || "—"} />
              <Rec label="Best squad OVR" value={records.bestSquadRating || "—"} />
              <Rec label="Trophy streak" value={records.silverwareStreak} />
            </div>

            {/* run list */}
            <div className="mt-8 space-y-3">
              {runs.map((r, i) => (
                <div key={i} className="rounded-2xl border border-border bg-surface p-4 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`grid place-items-center w-11 h-11 rounded-xl shrink-0 ${r.champion ? "bg-[oklch(0.85_0.17_85)]/20 text-[oklch(0.85_0.17_85)]" : "bg-surface-2 text-muted-foreground"}`}>
                      {r.mode === "cup" ? <Trophy className="w-5 h-5" /> : <Table2 className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-display text-xl truncate">
                        {r.mode === "cup" ? "Champions Cup" : "League Season"} · <span className={r.champion ? "text-[oklch(0.85_0.22_140)]" : ""}>{r.outcome}</span>
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                        {r.formation} · OVR {r.squadRating} · {r.record.w}W {r.record.d}D {r.record.l}L
                        {r.topScorer && ` · top scorer ${r.topScorer.name} ${r.topScorer.goals}`}
                      </div>
                    </div>
                  </div>
                  {r.verdict && <VerdictChip verdict={r.verdict} />}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Counter({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 text-center">
      <div className="grid place-items-center text-primary">{icon}</div>
      <div className="mt-1 font-display text-4xl">{value}</div>
      <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function Rec({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-center">
      <div className="font-display text-2xl truncate">{value}</div>
      <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
