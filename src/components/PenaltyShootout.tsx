import { useState } from "react";
import { motion, AnimatePresence, type Easing } from "framer-motion";
import standsImg from "@/assets/penalty-stands.webp";

type Dir = "left" | "center" | "right";
export type PenAnim = { dir: Dir; keeperDir: Dir; scored: boolean };

/* ---- dive choreography -------------------------------------------------
   A dive only reads as a dive rather than a jump if it plays as separate
   beats, each with its own easing, and if the limbs run on their own clocks:
   the glove leads the body, the legs trail the torso. All the fractions below
   are of DIVE_S, so the beats stay legible next to each other.

     read    the keeper picks a side — small crouch, weight onto that leg
     load    hips drop, arms pull back
     launch  explosive push off the loaded leg, body starts rotating
     reach   full extension in the air; this is where the ball arrives
     impact  hands take the ball, body keeps rotating into the ground
     land    absorb and settle                                            */
const DIVE_S = 1;
const BALL_HIT = 0.45; // ball crosses the line — the glove has to be there too
const P = { read: 0.1, load: 0.19, launch: 0.32, reach: 0.46, impact: 0.68 };
const BEATS = [0, P.read, P.load, P.launch, P.reach, P.impact, 1];

const EXPLODE: Easing = [0.1, 0.82, 0.28, 1]; // sharp ease-out — the push off the turf
const SETTLE: Easing = [0.32, 1.3, 0.62, 1];  // lands with a little overshoot
const DEFLECT: Easing = [0.12, 0.72, 0.3, 1]; // ball leaves the glove fast, then slows
// One easing per beat: settle in, drop, explode, coast, fall, absorb.
const BODY_EASE: Easing[] = ["easeInOut", "easeIn", EXPLODE, "linear", "easeIn", SETTLE];
const LIFT_EASE: Easing[] = ["easeInOut", "easeIn", EXPLODE, "easeOut", "easeIn", SETTLE];
const PUSH_EASE: Easing[] = ["linear", EXPLODE, "linear", "easeOut"];
const ARM_EASE: Easing[] = ["easeIn", EXPLODE, SETTLE];

const dirSign = (d: Dir) => (d === "left" ? -1 : d === "right" ? 1 : 0);

/* Mode icons. Drawn rather than set as emoji: emoji render in someone else's
   art style at whatever weight the platform ships, which next to this scene's
   flat vectors looks like clip-art dropped into the page. */
const strokeIcon = "w-[18px] h-[18px]";
function BallIcon({ className = strokeIcon }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.3 16.5 10.6 14.8 15.8H9.2L7.5 10.6Z" />
      <path d="M12 7.3V3M16.5 10.6 20.6 9.2M14.8 15.8 17.3 19.3M9.2 15.8 6.7 19.3M7.5 10.6 3.4 9.2" />
    </svg>
  );
}
function GloveIcon({ className = strokeIcon }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8.2 18.2v-6.3a4 4 0 0 1 8 0v6.3" />
      <path d="M8.2 12.4H6.5a2.4 2.4 0 0 0 0 4.8h1.7" />
      <path d="M10.9 8.2v4.3M13.5 8.2v4.3" />
      <rect x="6.9" y="18.2" width="10.6" height="3.4" rx="1.4" />
    </svg>
  );
}

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

      {/* Header. One panel rather than three floating lines: the round and
          score used to sit straight on the crossbar with nothing behind them,
          which read as a rendering fault. Matches the scoreboard panel below
          so the two look like one set of graphics. */}
      <div className="absolute top-4 sm:top-5 left-1/2 -translate-x-1/2 z-20 w-max max-w-[92vw]">
        <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-black/70 backdrop-blur-md py-2 pl-2 pr-4 shadow-2xl">
          <span className="grid place-items-center w-10 h-10 rounded-xl shrink-0"
            style={{ color: A.main, background: A.gradSoft, boxShadow: `inset 0 0 0 1px ${A.main}`, opacity: 0.95 }}>
            {dive ? <GloveIcon /> : <BallIcon />}
          </span>
          <span className="min-w-0">
            <span className="block font-display text-lg sm:text-xl leading-none tracking-wide" style={{ color: A.main }}>
              {dive ? "YOU SAVE" : "YOU SHOOT"}
            </span>
            <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 truncate">
              {!showTracker && subtitle ? subtitle : label}
            </span>
          </span>
        </div>
      </div>

      {/* shootout scoreboard — own panel, top-left, so it stays readable */}
      {showTracker && (
        <div className="absolute z-20 flex flex-col gap-2 rounded-2xl border border-white/12 bg-black/70 backdrop-blur-md px-4 py-2.5 sm:py-3 shadow-2xl left-1/2 -translate-x-1/2 top-[104px] sm:left-5 sm:translate-x-0 sm:top-5">
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
                          style={{ borderColor: A.main, color: A.main, boxShadow: `0 0 24px ${A.glow}` }}>
                          {dive ? <GloveIcon className="w-6 h-6" /> : <BallIcon className="w-6 h-6" />}
                        </span>
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

            {/* Keeper. The body carries position and the spine rotation; every
                limb animates on its own clock inside <Keeper>. Nothing waits
                for the ball — the keeper commits at the kick and is at full
                stretch as it arrives. */}
            <motion.div
              className="absolute bottom-[2%] z-10 origin-bottom"
              style={{ height: "78%" }}
              initial={false}
              animate={anim ? diveBody(anim.keeperDir, keeperX) : { left: "50%", x: "-50%", rotate: 0, y: [0, -3, 0], scaleX: 1, scaleY: 1 }}
              transition={anim
                ? {
                    // The lateral push doesn't start until the legs have loaded.
                    left: { duration: DIVE_S, times: [0, P.load, P.launch, P.impact, 1], ease: PUSH_EASE },
                    rotate: { duration: DIVE_S, times: BEATS, ease: BODY_EASE },
                    y: { duration: DIVE_S, times: BEATS, ease: LIFT_EASE },
                    scaleX: { duration: DIVE_S, times: BEATS, ease: "easeInOut" },
                    scaleY: { duration: DIVE_S, times: BEATS, ease: "easeInOut" },
                    x: { duration: 0 },
                  }
                : { y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" }, left: { duration: 0.3 } }}
            >
              <Keeper dir={anim?.keeperDir ?? null} saved={!!anim && !anim.scored} />
            </motion.div>
          </div>

          {/* Ball on the spot / in flight. It sits in a box exactly as wide as
              the goal so its corners share a coordinate space with the keeper
              (who lives inside the goal) — otherwise the two aim at different
              points and the ball sails past a glove that looked like it was
              there. */}
          <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-full w-[88%] sm:w-[76%] z-20">
            <motion.div
              className="absolute"
              style={{ left: "50%", bottom: "14%" }}
              initial={false}
              animate={anim ? ballFlight(anim) : { left: "50%", bottom: "14%", scale: 1, rotate: 0, x: "-50%" }}
              transition={anim
                ? {
                    // Struck hard, then either nestles in the net or is beaten
                    // away — the second leg only exists after contact.
                    default: { duration: DIVE_S, times: [0, BALL_HIT, 1], ease: ["easeIn", anim.scored ? "easeOut" : DEFLECT] as Easing[] },
                    x: { duration: 0 },
                  }
                : { duration: 0.3, ease: "easeOut" }}
            >
              <Ball />
            </motion.div>
          </div>
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

/* Whole-body motion. Keyframes line up with BEATS; each property gets its own
   easing per beat back where the transition is declared. */
function diveBody(dir: Dir, targetX: number) {
  const s = dirSign(dir);
  const toward = (f: number) => `${50 + (targetX - 50) * f}%`;
  return {
    // The hips barely travel. A keeper as tall as this one covers nearly the
    // whole centre-to-corner distance just by going horizontal — send the feet
    // all the way and he lands outside his own post.
    left: ["50%", "50%", toward(0.02), toward(0.13), toward(0.18)],
    x: "-50%",
    // Spine: leans onto the diving leg, then swings through to horizontal
    rotate: [0, s * 5, s * 8, s * 30, s * 70, s * 84, s * 88],
    // Hips drop into the crouch, the push throws them up, gravity takes them back
    y: s === 0 ? [0, 3, 10, -20, -36, -14, 2] : [0, 3, 9, -12, -28, -14, 3],
    // Squash into the load, stretch out of it
    scaleY: [1, 0.95, 0.88, 1.07, 1.02, 1, 1],
    scaleX: [1, 1.02, 1.07, 0.96, 1, 1, 1],
  };
}

/* Ball: spot -> corner (arriving at BALL_HIT) -> net, or beaten away by the
   glove it just ran into. */
function ballFlight(anim: PenAnim) {
  const x = { left: 20, center: 50, right: 80 }[anim.dir];
  const away = dirSign(anim.dir) || 1; // a centre parry still has to go somewhere
  // Contact height is set from the keeper's measured reach (the glove passes
  // bottom ~65% of the scene as the ball lands), so the two actually meet
  // inside the goal mouth instead of the ball crossing under his feet.
  return anim.scored
    ? { left: [`50%`, `${x}%`, `${x}%`], bottom: ["14%", "60%", "62%"], scale: [1, 0.42, 0.38], rotate: [0, 400, 470], x: "-50%" }
    : { left: [`50%`, `${x}%`, `${x + away * 26}%`], bottom: ["14%", "60%", "26%"], scale: [1, 0.44, 0.62], rotate: [0, 400, 780], x: "-50%" };
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

const KIT = { jersey: "#12b981", jerseyD: "#0b7a58", skin: "#e8b98f", short: "#0c1220", glove: "#f4e04a" };

/* One arm, pivoting at the shoulder. Canonical pose hangs straight down, so
   every pose below is a single rotation. The arm pulls back on the load before
   it reaches — and the reaching arm is at full stretch a quarter of the way
   into the flight, while the torso is still turning. */
function KeeperArm({ x, ready, target, leads, diving, clutch }: {
  x: number; ready: number; target: number; leads: boolean; diving: boolean; clutch: boolean;
}) {
  const pull = ready - Math.sign(target - ready) * 12;
  return (
    <motion.g
      style={{ originX: `${x}px`, originY: "50px", transformBox: "view-box" }}
      initial={false}
      animate={{ rotate: diving ? [ready, pull, target * 1.03, target] : ready }}
      transition={diving
        ? { duration: DIVE_S, times: [0, P.load, leads ? 0.35 : P.reach + 0.08, 1], ease: ARM_EASE }
        : { duration: 0.45, ease: "easeOut" }}
    >
      <line x1={x} y1={50} x2={x} y2={82} stroke={KIT.jersey} strokeWidth={8} strokeLinecap="round" />
      {/* the glove clutches at the moment of contact */}
      <motion.circle
        cx={x} cy={82} r={7} fill={KIT.glove} stroke="#b9a91f" strokeWidth={1}
        style={{ originX: `${x}px`, originY: "82px", transformBox: "view-box" }}
        initial={false}
        animate={{ scale: clutch ? [1, 1, 1.45, 1.15, 1.15] : 1 }}
        transition={clutch
          ? { duration: DIVE_S, times: [0, BALL_HIT - 0.03, BALL_HIT + 0.05, BALL_HIT + 0.14, 1], ease: "easeOut" }
          : { duration: 0.3 }}
      />
    </motion.g>
  );
}

/* Keeper rig. Every limb is a group on its own clock: the glove leads, the
   legs trail the spine, the head hangs back to keep its eyes on the ball.
   That lag between parts is most of what separates a dive from a jump. */
function Keeper({ dir, saved }: { dir: Dir | null; saved: boolean }) {
  const diving = dir !== null;
  const s = dir ? dirSign(dir) : 0;
  const centre = dir === "center";

  const READY_L = 58, READY_R = -58;
  const arm = dir === "left" ? { l: 166, r: -32 } : dir === "right" ? { l: 32, r: -166 } : { l: 148, r: -148 };
  const leadsL = dir === "left" || centre;
  const leadsR = dir === "right" || centre;
  // Draw order: the reaching arm goes in front of the body, the trailing one
  // behind it. Standing still, both sit in front.
  const frontL = !diving || leadsL;
  const frontR = !diving || leadsR;

  const beatTx = { duration: DIVE_S, times: BEATS, ease: BODY_EASE };
  const pushTx = { duration: 0.4, delay: P.load * DIVE_S, ease: EXPLODE };

  return (
    <svg viewBox="0 0 100 150" className="h-full w-auto overflow-visible" style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))" }}>
      {/* legs — lag behind the spine, then catch up on the way down */}
      <motion.g
        style={{ originX: "50px", originY: "102px", transformBox: "view-box" }}
        initial={false}
        animate={{ rotate: diving ? [0, -s * 3, -s * 9, -s * 24, -s * 17, -s * 6, 0] : 0 }}
        transition={diving ? beatTx : { duration: 0.4 }}
      >
        <motion.g
          style={{ originX: "45px", originY: "102px", transformBox: "view-box" }}
          initial={false}
          animate={{ rotate: diving ? (centre ? -15 : -s * 9) : 0 }}
          transition={diving ? pushTx : { duration: 0.4 }}
        >
          <rect x="39" y="98" width="13" height="50" rx="6" fill={KIT.short} />
          <ellipse cx="45.5" cy="147" rx="8" ry="4" fill="#111" />
        </motion.g>
        <motion.g
          style={{ originX: "57px", originY: "102px", transformBox: "view-box" }}
          initial={false}
          animate={{ rotate: diving ? (centre ? 15 : -s * 3) : 0 }}
          transition={diving ? pushTx : { duration: 0.4 }}
        >
          <rect x="51" y="98" width="13" height="50" rx="6" fill={KIT.short} />
          <ellipse cx="57.5" cy="147" rx="8" ry="4" fill="#111" />
        </motion.g>
      </motion.g>

      {/* trailing arm sits behind the body */}
      {!frontL && <KeeperArm x={40} ready={READY_L} target={arm.l} leads={false} diving={diving} clutch={false} />}
      {!frontR && <KeeperArm x={60} ready={READY_R} target={arm.r} leads={false} diving={diving} clutch={false} />}

      {/* torso — arches into the dive slightly ahead of the legs */}
      <motion.g
        style={{ originX: "50px", originY: "102px", transformBox: "view-box" }}
        initial={false}
        animate={{ rotate: diving ? [0, 0, s * 2, -s * 3, -s * 8, -s * 4, 0] : 0 }}
        transition={diving ? beatTx : { duration: 0.4 }}
      >
        <path d="M34 52 Q34 44 42 42 L58 42 Q66 44 66 52 L64 104 Q50 110 36 104 Z"
          fill={KIT.jersey} stroke={KIT.jerseyD} strokeWidth="1.5" />
        <path d="M50 44 L50 104" stroke={KIT.jerseyD} strokeWidth="1" opacity="0.5" />
        {/* head — hangs back off the spine, eyes on the ball */}
        <motion.g
          style={{ originX: "50px", originY: "44px", transformBox: "view-box" }}
          initial={false}
          animate={{ rotate: diving ? [0, 0, -s * 2, -s * 8, -s * 15, -s * 12, -s * 4] : 0 }}
          transition={diving ? beatTx : { duration: 0.4 }}
        >
          <circle cx="50" cy="30" r="13" fill={KIT.skin} />
          <path d="M39 26 Q50 14 61 26 Q56 20 50 20 Q44 20 39 26 Z" fill="#3a2a1a" />
        </motion.g>
      </motion.g>

      {/* reaching arm in front */}
      {frontL && <KeeperArm x={40} ready={READY_L} target={arm.l} leads={leadsL} diving={diving} clutch={saved && leadsL} />}
      {frontR && <KeeperArm x={60} ready={READY_R} target={arm.r} leads={leadsR} diving={diving} clutch={saved && leadsR} />}
    </svg>
  );
}
