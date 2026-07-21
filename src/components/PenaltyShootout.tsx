import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import standsImg from "@/assets/penalty-stands.webp";

type Dir = "left" | "center" | "right";
export type PenAnim = { dir: Dir; keeperDir: Dir; scored: boolean };

/* A big 3D-ish penalty scene: a goal in front of you split into three zones.
   Pick one, the ball flies, the keeper dives, and you sweat the result. */
export function PenaltyShootout({ taker, homeAbbr, awayAbbr, home, away, userIsHome, anim, onPick, showTracker = true, label = "Penalty Shootout", subtitle, mode = "shoot" }: {
  taker: string;
  homeAbbr: string; awayAbbr: string;
  home: (boolean | null)[]; away: (boolean | null)[];
  userIsHome: boolean;
  anim: PenAnim | null;
  onPick: (dir: Dir) => void;
  showTracker?: boolean;
  label?: string;
  subtitle?: string;
  mode?: "shoot" | "dive";
}) {
  const [hover, setHover] = useState<Dir | null>(null);
  const aiming = !anim;

  // Horizontal target per zone (percentage across the goal mouth).
  const zoneX: Record<Dir, number> = { left: 20, center: 50, right: 80 };
  const ballTargetX = anim ? zoneX[anim.dir] : 50;
  const keeperX = anim ? zoneX[anim.keeperDir] : 50;
  const showResult = anim ? "result" : "aim";

  // Shooting is crimson; diving/saving is a keeper-blue — so the two screens
  // read differently at a glance.
  const dive = mode === "dive";
  const A = dive
    ? { main: "oklch(0.7 0.16 235)", glow: "oklch(0.7 0.16 235 / 0.55)", grad: "oklch(0.7 0.16 235 / 0.35)", gradSoft: "oklch(0.7 0.16 235 / 0.08)", hit: "oklch(0.7 0.16 235 / 0.18)" }
    : { main: "oklch(0.63 0.24 25)", glow: "oklch(0.63 0.24 25 / 0.5)", grad: "oklch(0.63 0.24 25 / 0.35)", gradSoft: "oklch(0.63 0.24 25 / 0.08)", hit: "oklch(0.63 0.24 25 / 0.18)" };
  const zoneIcon = dive ? "🧤" : "✛";

  const yourRow = userIsHome ? home : away;
  const theirRow = userIsHome ? away : home;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9] overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 12%, oklch(0.28 0.03 260) 0%, oklch(0.08 0.015 260) 62%, oklch(0.05 0.01 260) 100%)" }}
    >
      {/* Packed stands — a single full-bleed backdrop covering everything from
          the top of the screen down to the pitch horizon, so it reads as one
          continuous wall of fans behind the goal rather than a floating band.
          The pitch (drawn later in the scene) sits in front and meets it at the
          fade, hiding the seam. */}
      <img
        src={standsImg}
        alt=""
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 top-0 w-full"
        style={{
          height: "66%",
          maxWidth: "none", // preflight caps images at 100%, killing the bleed
          objectFit: "cover",
          objectPosition: "center 58%",
          filter: "brightness(0.34) contrast(1.04) saturate(0.82)",
          maskImage: "linear-gradient(to bottom, black 0%, black 84%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 84%, transparent 100%)",
        }}
      />
      {/* floodlight glows over the crowd */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 22% 0%, rgba(255,255,255,0.1), transparent 28%), radial-gradient(circle at 78% 0%, rgba(255,255,255,0.1), transparent 28%)" }} />

      {/* header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 text-center">
        <div className="font-mono text-xs uppercase tracking-[0.4em]" style={{ color: A.main }}>{label}</div>
        {/* big glanceable mode badge: shoot vs save */}
        <div
          className="mt-2 inline-flex items-center gap-2 rounded-full border px-5 py-1.5 font-display text-2xl md:text-3xl tracking-wide leading-none"
          style={{ color: A.main, borderColor: A.main, background: A.gradSoft, boxShadow: `0 0 30px ${A.glow}` }}
        >
          <span className="text-xl md:text-2xl">{dive ? "🧤" : "⚽"}</span>
          {dive ? "YOU SAVE" : "YOU SHOOT"}
        </div>
        {!showTracker && subtitle && (
          <div className="mt-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{subtitle}</div>
        )}
      </div>

      {/* shootout scoreboard — own panel, top-left, so it stays readable */}
      {showTracker && (
        <div className="absolute z-20 flex flex-col gap-2 rounded-xl border border-white/15 bg-black/70 backdrop-blur-md px-4 py-2.5 sm:py-3 shadow-2xl left-1/2 -translate-x-1/2 top-[104px] sm:left-5 sm:translate-x-0 sm:top-5">
          <PenTracker abbr={userIsHome ? homeAbbr : awayAbbr} row={yourRow} you />
          <PenTracker abbr={userIsHome ? awayAbbr : homeAbbr} row={theirRow} />
        </div>
      )}

      {/* 3D scene */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "1000px", perspectiveOrigin: "50% 38%" }}>
        <div className="relative" style={{ transformStyle: "preserve-3d", width: "min(88vw, 900px)", height: "min(70vh, 560px)" }}>

          {/* pitch floor receding to the goal */}
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2"
            style={{
              width: "160%", height: "150%",
              transform: "rotateX(72deg) translateZ(-40px)",
              transformOrigin: "50% 100%",
              background: "linear-gradient(to top, oklch(0.32 0.09 145) 0%, oklch(0.24 0.08 145) 45%, oklch(0.18 0.06 145) 100%)",
            }}
          >
            {/* mow stripes */}
            <div className="absolute inset-0 opacity-25" style={{ background: "repeating-linear-gradient(90deg, transparent 0 8%, rgba(255,255,255,0.06) 8% 16%)" }} />
            {/* penalty box lines */}
            <div className="absolute left-1/2 -translate-x-1/2 border-2 border-white/40 rounded-[2px]" style={{ width: "56%", height: "34%", top: "0" }} />
            <div className="absolute left-1/2 -translate-x-1/2 border-2 border-white/30" style={{ width: "26%", height: "16%", top: "0" }} />
          </div>

          {/* The goal. Driven by an aspect ratio rather than a % of the scene
              height: on a phone the scene box is portrait, and a % height made
              the goal taller than it was wide. A real goal is ~3:1; 2.7 keeps
              the three target zones comfortably tappable. */}
          <div className="absolute left-1/2 bottom-[46%] -translate-x-1/2 w-[88%] sm:w-[76%] aspect-[2.7/1]"
            style={{ transformStyle: "preserve-3d" }}>
            {/* net */}
            <div className="absolute inset-0 rounded-t-[4px] overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.05)",
                boxShadow: "inset 0 0 40px rgba(0,0,0,0.5)",
                backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.16) 0 1px, transparent 1px 13px), repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 1px, transparent 1px 13px)",
              }}
            />
            {/* target zones */}
            <div className="absolute inset-0 flex">
              {(["left", "center", "right"] as Dir[]).map((d) => {
                const active = hover === d;
                const hit = anim?.dir === d;
                return (
                  <button
                    key={d}
                    disabled={!aiming}
                    onMouseEnter={() => setHover(d)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => aiming && onPick(d)}
                    className={`relative flex-1 border-x transition-all duration-150 ${aiming ? "cursor-pointer" : "cursor-default"}`}
                    style={{
                      borderColor: active ? A.main : "rgba(255,255,255,0.12)",
                      background: active
                        ? `linear-gradient(to bottom, ${A.grad}, ${A.gradSoft})`
                        : hit ? A.hit : "transparent",
                      boxShadow: active ? `inset 0 0 30px ${A.glow}` : "none",
                    }}
                  >
                    {aiming && (
                      <span className="absolute inset-2 rounded-md border-2 border-dashed transition-opacity"
                        style={{ opacity: active ? 1 : 0, borderColor: active ? A.main : "rgba(255,255,255,0.4)" }} />
                    )}
                    {aiming && active && (
                      <span className="absolute inset-0 grid place-items-center">
                        <span className="grid place-items-center w-12 h-12 rounded-full border-2 font-display text-xl"
                          style={{ borderColor: A.main, color: A.main, boxShadow: `0 0 24px ${A.glow}` }}>{zoneIcon}</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* posts + crossbar (in front of the net) */}
            <div className="absolute -left-[3%] -top-[3%] w-[3%] h-[106%] rounded bg-gradient-to-r from-white to-white/70 shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
            <div className="absolute -right-[3%] -top-[3%] w-[3%] h-[106%] rounded bg-gradient-to-l from-white to-white/70 shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
            <div className="absolute -left-[3%] -top-[3%] w-[106%] h-[7%] rounded bg-gradient-to-b from-white to-white/70 shadow-[0_0_10px_rgba(255,255,255,0.4)]" />

            {/* keeper */}
            <motion.div
              className="absolute bottom-[2%] z-10 origin-bottom"
              style={{ height: "78%" }}
              initial={false}
              animate={anim
                ? {
                    left: `${keeperX}%`,   // slide toward the corner
                    x: "-50%",
                    // explode toward the corner: rotate + leap
                    rotate: anim.keeperDir === "left" ? [0, 4, -72] : anim.keeperDir === "right" ? [0, -4, 72] : [0, 0, 0],
                    y: anim.keeperDir === "center" ? [0, 4, -16] : [0, 6, -22],
                    scale: anim.keeperDir === "center" ? [1, 0.96, 1.1] : [1, 0.94, 1.14],
                  }
                : { left: "50%", x: "-50%", rotate: 0, y: [0, -3, 0], scale: 1 }}
              transition={anim
                ? { duration: 0.52, delay: 0.22, times: [0, 0.22, 1], ease: [0.45, 0, 0.25, 1], left: { duration: 0.52, delay: 0.22, ease: [0.3, 0, 0.2, 1] } }
                : { y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" }, left: { duration: 0.3 } }}
            >
              <Keeper dir={anim?.keeperDir ?? null} />
            </motion.div>
          </div>

          {/* ball on the spot / in flight */}
          <motion.div
            className="absolute z-20"
            style={{ left: `${ballTargetX}%`, bottom: "14%" }}
            initial={false}
            animate={anim
              ? { left: `${ballTargetX}%`, bottom: anim.scored ? "40%" : "34%", scale: 0.42, x: "-50%" }
              : { left: "50%", bottom: "14%", scale: 1, x: "-50%" }}
            transition={{ duration: anim ? 0.45 : 0.3, ease: anim ? "easeIn" : "easeOut" }}
          >
            <Ball />
          </motion.div>
        </div>
      </div>

      {/* prompt / result */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-center">
        <AnimatePresence mode="wait">
          {showResult === "aim" ? (
            <motion.div key="aim" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="font-display text-3xl md:text-4xl text-white">
                {dive ? `${taker} to shoot.` : `${taker} steps up.`}
              </div>
              <div className="mt-1 font-mono text-xs uppercase tracking-widest" style={{ color: A.main }}>
                {dive ? "Pick your dive — which way do you go?" : "Pick your corner — where do you aim?"}
              </div>
            </motion.div>
          ) : (
            (() => {
              // In dive mode a save is the good outcome, so the colours flip.
              const good = mode === "dive" ? !anim?.scored : anim?.scored;
              return (
                <motion.div key="result"
                  initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 16, delay: 0.5 }}
                  className="font-display leading-none text-[clamp(3rem,9vw,6rem)]"
                  style={{
                    color: good ? "oklch(0.85 0.22 140)" : "oklch(0.7 0.2 25)",
                    textShadow: good ? "0 0 50px oklch(0.8 0.22 145 / 0.7)" : "0 0 50px oklch(0.63 0.24 25 / 0.7)",
                  }}
                >
                  {anim?.scored ? "GOAL!" : "SAVED!"}
                </motion.div>
              );
            })()
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function PenTracker({ abbr, row, you }: { abbr: string; row: (boolean | null)[]; you?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`font-mono text-xs w-10 ${you ? "text-white font-bold" : "text-white/60"}`}>{abbr}</span>
      <div className="flex gap-1.5">
        {Array.from({ length: Math.max(5, row.length) }).map((_, i) => (
          <span key={i} className={`w-3 h-3 rounded-full transition-colors ${
            i < row.length ? (row[i] ? "bg-[oklch(0.75_0.19_145)]" : "bg-primary") : "bg-white/10 border border-white/25"
          }`} />
        ))}
      </div>
    </div>
  );
}

function Ball() {
  return (
    <div className="relative w-11 h-11 rounded-full"
      style={{
        background: "radial-gradient(circle at 34% 30%, #ffffff, #cdd3da 62%, #9aa3ad 100%)",
        boxShadow: "0 8px 18px rgba(0,0,0,0.55), inset -3px -4px 8px rgba(0,0,0,0.25)",
      }}
    >
      {/* pentagon hints */}
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rotate-12" style={{ clipPath: "polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%)", background: "#1a1d22" }} />
      <span className="absolute left-1 top-2 w-2 h-2" style={{ clipPath: "polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%)", background: "#1a1d22" }} />
      <span className="absolute right-1 top-3 w-2 h-2" style={{ clipPath: "polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%)", background: "#1a1d22" }} />
      <span className="absolute right-2 bottom-1 w-2 h-2" style={{ clipPath: "polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%)", background: "#1a1d22" }} />
    </div>
  );
}

function Keeper({ dir }: { dir: "left" | "center" | "right" | null }) {
  // Distinct keeper kit + bright gloves. Arms react to the dive.
  const JERSEY = "#12b981", JERSEY_D = "#0b7a58", SKIN = "#e8b98f", SHORT = "#0c1220", GLOVE = "#f4e04a";
  const diving = dir === "left" || dir === "right";

  // Arm/glove positions (SVG coords, viewBox 0 0 100 150).
  // Ready: both arms out and slightly up. Dive: leading arm reaches the corner.
  const arms = (() => {
    if (dir === "center") {
      // both hands up
      return { l: { x: 30, y: 34 }, r: { x: 70, y: 34 } };
    }
    if (dir === "left") {
      return { l: { x: 10, y: 30 }, r: { x: 58, y: 66 } }; // left glove reaching up-out
    }
    if (dir === "right") {
      return { l: { x: 42, y: 66 }, r: { x: 90, y: 30 } };
    }
    return { l: { x: 20, y: 52 }, r: { x: 80, y: 52 } }; // ready stance
  })();

  return (
    <svg viewBox="0 0 100 150" className="h-full w-auto overflow-visible" style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))" }}>
      {/* legs */}
      {diving ? (
        <>
          <rect x="40" y="98" width="13" height="46" rx="6" fill={SHORT} transform="rotate(18 46 100)" />
          <rect x="52" y="100" width="13" height="42" rx="6" fill={SHORT} transform="rotate(-8 58 100)" />
        </>
      ) : (
        <>
          <rect x="38" y="100" width="12" height="48" rx="5" fill={SHORT} />
          <rect x="50" y="100" width="12" height="48" rx="5" fill={SHORT} />
        </>
      )}
      {/* boots */}
      <ellipse cx={diving ? 45 : 44} cy="146" rx="8" ry="4" fill="#111" />
      <ellipse cx={diving ? 60 : 56} cy="146" rx="8" ry="4" fill="#111" />

      {/* torso */}
      <path d="M34 52 Q34 44 42 42 L58 42 Q66 44 66 52 L64 104 Q50 110 36 104 Z"
        fill={JERSEY} stroke={JERSEY_D} strokeWidth="1.5" />
      <path d="M50 44 L50 104" stroke={JERSEY_D} strokeWidth="1" opacity="0.5" />

      {/* arms (shoulder -> glove) */}
      <line x1="40" y1="50" x2={arms.l.x} y2={arms.l.y} stroke={JERSEY} strokeWidth="8" strokeLinecap="round" />
      <line x1="60" y1="50" x2={arms.r.x} y2={arms.r.y} stroke={JERSEY} strokeWidth="8" strokeLinecap="round" />
      {/* gloves */}
      <circle cx={arms.l.x} cy={arms.l.y} r="7" fill={GLOVE} stroke="#b9a91f" strokeWidth="1" />
      <circle cx={arms.r.x} cy={arms.r.y} r="7" fill={GLOVE} stroke="#b9a91f" strokeWidth="1" />

      {/* head */}
      <circle cx="50" cy="30" r="13" fill={SKIN} />
      <path d="M39 26 Q50 14 61 26 Q56 20 50 20 Q44 20 39 26 Z" fill="#3a2a1a" />
    </svg>
  );
}
