import { useMemo } from "react";
import { motion } from "framer-motion";
import { loadSettings } from "@/lib/settings";

const DEFAULT_COLORS = [
  "oklch(0.63 0.24 25)",   // crimson
  "oklch(0.82 0.16 85)",   // gold
  "oklch(0.88 0.22 125)",  // acid
  "oklch(0.75 0.19 145)",  // green
  "#ffffff",
];

export function Confetti({ count = 70, colors = DEFAULT_COLORS }: { count?: number; colors?: string[] }) {
  const enabled = loadSettings().celebrations;
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.4,
        dur: 2.8 + Math.random() * 2.2,
        color: colors[i % colors.length],
        w: 6 + Math.random() * 7,
        h: 4 + Math.random() * 5,
        rot: Math.random() * 360,
        drift: (Math.random() - 0.5) * 120,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  if (!enabled) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-[2px]"
          style={{ left: `${p.left}%`, top: "-6%", width: p.w, height: p.h, background: p.color }}
          initial={{ y: 0, rotate: p.rot, opacity: 1 }}
          animate={{ y: "115vh", x: [0, p.drift, -p.drift * 0.6], rotate: p.rot + 540, opacity: [1, 1, 0.85] }}
          transition={{ duration: p.dur, delay: p.delay, ease: "linear", repeat: Infinity }}
        />
      ))}
    </div>
  );
}
