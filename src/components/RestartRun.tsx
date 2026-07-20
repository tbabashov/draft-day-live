import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { btnDanger } from "@/lib/ui";

const RUN_KEYS = ["gaffer.draft.v1", "gaffer.tactics.v1", "gaffer.bracket.v1", "gaffer.league.v1", "gaffer.squadstatus.v1"];

/** Wipes the whole run (draft, tactics, bracket) after confirmation and
 *  starts over from a fresh draft. */
export function RestartRunButton() {
  const [open, setOpen] = useState(false);

  const restart = () => {
    try {
      for (const k of RUN_KEYS) window.localStorage.removeItem(k);
    } catch {}
    window.location.assign("/draft");
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className={`${btnDanger} !px-3 sm:!px-7`} title="Restart run">
        <RotateCcw className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Restart run</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] grid place-items-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 16, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 16, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-primary/40 bg-gradient-to-b from-surface-2 to-surface p-6 text-center"
            >
              <RotateCcw className="w-8 h-8 mx-auto text-primary" />
              <div className="mt-3 font-display text-3xl">START OVER?</div>
              <p className="mt-2 text-sm text-muted-foreground">
                This wipes your draft, tactics and tournament run for good.
                New formation, new captain, new cards.
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-border px-5 py-2 text-xs font-semibold hover:bg-surface-2"
                >
                  Keep playing
                </button>
                <button
                  onClick={restart}
                  className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110"
                >
                  Restart the game
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
