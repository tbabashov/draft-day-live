import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Trophy, Settings as SettingsIcon, RotateCcw, ArrowRight, PlayCircle, X, Info } from "lucide-react";
import { loadHistory, computeRecords, HISTORY_KEY, type RecordBook } from "@/lib/history";
import { loadSettings, saveSettings, type Settings } from "@/lib/settings";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Manager's Office — GAFFER" },
      { name: "description", content: "Your GAFFER hub — start a run, check the trophy cabinet, tweak settings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HomePage,
});

const RUN_KEYS = ["gaffer.draft.v1", "gaffer.tactics.v1", "gaffer.bracket.v1", "gaffer.league.v1", "gaffer.squadstatus.v1"];

/* Where an in-progress run should resume — or null when nothing is actually
   playable. A finished cup (won/eliminated) or completed league season is NOT
   continuable, so a decided result can't be re-entered and undone. */
function resumePoint(): { to: string; label: string } | null {
  if (typeof window === "undefined") return null;
  const get = (k: string) => {
    try { return window.localStorage.getItem(k); } catch { return null; }
  };

  const braw = get("gaffer.bracket.v1");
  if (braw) {
    try {
      const { bracket, championId } = JSON.parse(braw);
      let eliminated = false, hasNext = false;
      for (const round of bracket.rounds) {
        for (const m of round) {
          const involvesUser = m.home?.id === "user" || m.away?.id === "user";
          if (m.played && involvesUser && m.winner?.id !== "user") eliminated = true;
          if (!m.played && m.home && m.away && involvesUser) hasNext = true;
        }
      }
      // Still alive, trophy undecided, and a tie left to play → resume.
      return !championId && !eliminated && hasNext ? { to: "/tournament", label: "Resume cup run" } : null;
    } catch { return null; }
  }

  const lraw = get("gaffer.league.v1");
  if (lraw) {
    try {
      const { fixtures } = JSON.parse(lraw) as { fixtures: { played: boolean }[] };
      return fixtures.some((f) => !f.played) ? { to: "/league", label: "Resume league season" } : null;
    } catch { return null; }
  }

  // Mid-setup: tactics chosen but no competition entered, or draft under way.
  if (get("gaffer.tactics.v1")) return { to: "/compete", label: "Continue — pick a competition" };
  if (get("gaffer.draft.v1")) return { to: "/draft", label: "Continue your draft" };
  return null;
}

function HomePage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<RecordBook | null>(null);
  const [resume, setResume] = useState<{ to: string; label: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);

  useEffect(() => {
    setRecords(computeRecords(loadHistory()));
    setResume(resumePoint());
  }, []);

  const startNew = () => {
    try { for (const k of RUN_KEYS) window.localStorage.removeItem(k); } catch {}
    navigate({ to: "/draft" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground grain">
      {/* subtle backdrop glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60"
        style={{ background: "radial-gradient(ellipse at 50% -10%, oklch(0.63 0.24 25 / 0.18), transparent 55%)" }} />

      <header className="relative border-b border-border/60 backdrop-blur-xl bg-background/60">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display text-2xl tracking-widest">
            <span className="w-2 h-2 rounded-full bg-primary ticker-dot" />
            GAFFER
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
              <Info className="w-4 h-4" /> About
            </Link>
            <button onClick={() => setShowSettings(true)}
              className="grid place-items-center w-10 h-10 rounded-full border border-border hover:border-primary hover:text-primary transition">
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 py-12">
        <div className="text-center">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-primary">The manager's office</div>
          <h1 className="mt-3 font-display text-6xl md:text-7xl leading-[0.9]">
            Take the<br /><span className="text-primary italic">gaffer's chair.</span>
          </h1>
        </div>

        {/* quick stats */}
        {records && records.totalRuns > 0 && (
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Runs played" value={records.totalRuns} />
            <Stat label="Cup wins" value={records.cupWins} accent={records.cupWins > 0} />
            <Stat label="League titles" value={records.leagueTitles} accent={records.leagueTitles > 0} />
            <Stat label="Best squad OVR" value={records.bestSquadRating || "—"} />
          </div>
        )}

        {/* main actions */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <HubCard
            onClick={() => resume && navigate({ to: resume.to })}
            disabled={!resume}
            icon={<PlayCircle className="w-8 h-8" />}
            title="CONTINUE"
            body={resume ? resume.label : "No game in progress."}
            primary={!!resume}
          />
          <HubCard
            onClick={() => (resume ? setConfirmNew(true) : startNew())}
            icon={<Play className="w-8 h-8" />}
            title="NEW GAME"
            body="Fresh draft, fresh squad, fresh shot at silverware."
            primary={!resume}
          />
          <HubCard
            onClick={() => navigate({ to: "/history" })}
            icon={<Trophy className="w-8 h-8" />}
            title="TROPHY CABINET"
            body={records && records.totalRuns > 0 ? `${records.totalRuns} run${records.totalRuns === 1 ? "" : "s"} on record.` : "No silverware yet. Go earn some."}
          />
          <HubCard
            onClick={() => setShowSettings(true)}
            icon={<SettingsIcon className="w-8 h-8" />}
            title="SETTINGS"
            body="Celebrations, match pace and data controls."
          />
        </div>
      </main>

      <AnimatePresence>
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onWiped={() => setRecords(computeRecords(loadHistory()))} />}
        {confirmNew && (
          <ConfirmModal
            title="START A NEW GAME?"
            body="Your current run — draft, tactics and competition — will be scrapped. Your trophy cabinet is kept."
            confirmLabel="Scrap it, new game"
            onConfirm={startNew}
            onCancel={() => setConfirmNew(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 text-center">
      <div className={`font-display text-3xl ${accent ? "text-[oklch(0.85_0.17_85)]" : ""}`}>{value}</div>
      <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function HubCard({ onClick, icon, title, body, primary, disabled }: {
  onClick: () => void; icon: React.ReactNode; title: string; body: string; primary?: boolean; disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -3 }}
      aria-disabled={disabled}
      className={`text-left rounded-2xl border p-6 transition-all group ${
        disabled
          ? "border-border/50 bg-surface/40 opacity-45 cursor-not-allowed"
          : primary
            ? "border-primary/50 bg-gradient-to-br from-primary/15 via-surface to-surface hover:shadow-[0_20px_60px_-20px_var(--crimson)]"
            : "border-border bg-surface hover:border-primary/50 hover:bg-surface-2"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={disabled ? "text-muted-foreground" : "text-primary"}>{icon}</div>
        {!disabled && <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition" />}
      </div>
      <div className="mt-4 font-display text-3xl">{title}</div>
      <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
    </motion.button>
  );
}

function SettingsModal({ onClose, onWiped }: { onClose: () => void; onWiped: () => void }) {
  const [s, setS] = useState<Settings>(loadSettings());
  const [confirmWipe, setConfirmWipe] = useState<"cabinet" | "all" | null>(null);
  const update = (patch: Partial<Settings>) => {
    const next = { ...s, ...patch };
    setS(next);
    saveSettings(next);
  };
  const wipeCabinet = () => {
    try { window.localStorage.removeItem(HISTORY_KEY); } catch {}
    setConfirmWipe(null);
    onWiped();
  };
  const wipeAll = () => {
    try {
      for (const k of [...RUN_KEYS, HISTORY_KEY, "gaffer.settings.v1"]) window.localStorage.removeItem(k);
    } catch {}
    setConfirmWipe(null);
    setS(loadSettings());
    onWiped();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 16, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 16, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6"
      >
        <div className="flex items-center justify-between">
          <div className="font-display text-3xl">SETTINGS</div>
          <button onClick={onClose} className="grid place-items-center w-8 h-8 rounded-full border border-border hover:border-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-2">
          <Toggle label="Celebrations" desc="Confetti and big full-time flourishes." on={s.celebrations} onChange={(v) => update({ celebrations: v })} />
          <Toggle label="Fast results" desc="Shorter goal celebrations during matches." on={s.fastResults} onChange={(v) => update({ fastResults: v })} />
        </div>

        <div className="mt-6 pt-5 border-t border-border">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Data</div>
          {confirmWipe === null ? (
            <div className="flex flex-col gap-2">
              <button onClick={() => setConfirmWipe("cabinet")}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface-2 text-left">
                Clear trophy cabinet
              </button>
              <button onClick={() => setConfirmWipe("all")}
                className="w-full rounded-lg border border-primary/50 text-primary px-4 py-2.5 text-sm font-semibold hover:bg-primary/10 text-left">
                Wipe all data
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
              <p className="text-sm text-muted-foreground">
                {confirmWipe === "cabinet"
                  ? "Delete your entire trophy cabinet? This can't be undone."
                  : "Delete everything — current run, trophy cabinet and settings? This can't be undone."}
              </p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setConfirmWipe(null)} className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-surface-2">Cancel</button>
                <button onClick={confirmWipe === "cabinet" ? wipeCabinet : wipeAll}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:brightness-110">
                  <RotateCcw className="w-3.5 h-3.5" /> Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Toggle({ label, desc, on, onChange }: { label: string; desc: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="w-full flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 hover:border-primary/50 transition text-left">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <div className={`shrink-0 w-11 h-6 rounded-full p-0.5 transition-colors ${on ? "bg-primary" : "bg-surface-2"}`}>
        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} />
      </div>
    </button>
  );
}

function ConfirmModal({ title, body, confirmLabel, onConfirm, onCancel }: {
  title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 16, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 16, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-primary/40 bg-gradient-to-b from-surface-2 to-surface p-6 text-center"
      >
        <div className="font-display text-3xl">{title}</div>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <button onClick={onCancel} className="rounded-full border border-border px-5 py-2 text-xs font-semibold hover:bg-surface-2">Keep playing</button>
          <button onClick={onConfirm} className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:brightness-110">{confirmLabel}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
