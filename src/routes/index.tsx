import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight, Trophy, Users, Zap, Grid3x3, ChevronDown, Play } from "lucide-react";
import haalandAsset from "@/assets/faces/haaland.png.asset.json";
import sakaAsset from "@/assets/faces/saka.png.asset.json";
import martinelliAsset from "@/assets/faces/martinelli.webp.asset.json";
import mitomaAsset from "@/assets/faces/mitoma.png.asset.json";
import salahAsset from "@/assets/faces/salah.png.asset.json";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Nav />
      <Hero />
      <Ticker />
      <HowItWorks />
      <Features />
      <Stats />
      <Testimonials />
      <Faq />
      <Footer />
    </div>
  );
}

/* ---------------- NAV ---------------- */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "backdrop-blur-xl bg-background/70 border-b border-border" : ""}`}>
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-display text-2xl tracking-widest">
          <span className="w-2 h-2 rounded-full bg-primary ticker-dot" />
          GAFFER
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#how" className="hover:text-foreground transition">How it works</a>
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#stats" className="hover:text-foreground transition">Stats</a>
          <a href="#faq" className="hover:text-foreground transition">FAQ</a>
        </nav>
        <a href="#hero-cta" className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:shadow-[0_10px_40px_-10px_var(--crimson)] transition-all">
          Start drafting
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
        </a>
      </div>
    </header>
  );
}

/* ---------------- HERO ---------------- */
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const bx = useSpring(mx, { stiffness: 60, damping: 20 });
  const by = useSpring(my, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mx.set((e.clientX - r.left) / r.width);
      my.set((e.clientY - r.top) / r.height);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  const blob1X = useTransform(bx, (v) => `${v * 40 - 20}%`);
  const blob1Y = useTransform(by, (v) => `${v * 40 - 20}%`);
  const blob2X = useTransform(bx, (v) => `${-v * 30 + 15}%`);
  const blob2Y = useTransform(by, (v) => `${-v * 30 + 15}%`);

  const verbs = ["DOMINATE.", "OUTPLAY.", "SILENCE 'EM.", "LIFT SILVERWARE."];
  const [vi, setVi] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setVi((i) => (i + 1) % verbs.length), 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center pt-24 grain overflow-hidden">
      {/* Mouse-reactive blobs */}
      <motion.div style={{ x: blob1X, y: blob1Y }} className="absolute top-[10%] left-[10%] w-[55vw] h-[55vw] rounded-full bg-primary/25 blur-[120px] pointer-events-none" />
      <motion.div style={{ x: blob2X, y: blob2Y }} className="absolute bottom-[5%] right-[5%] w-[45vw] h-[45vw] rounded-full bg-[oklch(0.55_0.18_260)]/25 blur-[120px] pointer-events-none" />
      {/* Pitch line grid */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />

      <div className="relative mx-auto max-w-7xl px-6 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 backdrop-blur px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-accent ticker-dot" /> Season 26 · Now open
        </motion.div>

        <h1 className="mt-8 font-display text-[clamp(3.5rem,12vw,11rem)] leading-[0.85] tracking-tight">
          <motion.span initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="block">DRAFT.</motion.span>
          <motion.span initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="block text-muted-foreground">DEPLOY.</motion.span>
          <span className="block relative h-[0.95em] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span key={verbs[vi]}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.7, 0, 0.3, 1] }}
                className="block text-primary italic"
                style={{ textShadow: "0 0 60px oklch(0.63 0.24 25 / 0.4)" }}
              >
                {verbs[vi]}
              </motion.span>
            </AnimatePresence>
          </span>
        </h1>

        <div className="mt-12 flex flex-col md:flex-row md:items-end justify-between gap-8 max-w-6xl">
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
            Draft your XI from every Premier League star. Set the tactics. Battle 15 rival clubs in a knockout bracket. No wallets, no packs — just you and the gaffer's chair.
          </p>
          <div id="hero-cta" className="flex items-center gap-4">
            <a href="/draft" className="group relative inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 font-semibold text-primary-foreground shadow-[0_20px_60px_-20px_var(--crimson)] hover:shadow-[0_25px_80px_-15px_var(--crimson)] transition-all">
              Start your draft
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </a>
            <button className="group inline-flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground transition">
              <span className="w-10 h-10 rounded-full border border-border grid place-items-center group-hover:border-primary transition">
                <Play className="w-3.5 h-3.5 fill-current" />
              </span>
              Watch 30s reel
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs font-mono uppercase tracking-widest text-muted-foreground flex flex-col items-center gap-2">
          <span>Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- TICKER ---------------- */
function Ticker() {
  const items = [
    "24,881 squads drafted today",
    "Haaland picked 62% of the time",
    "Longest win streak · 14",
    "Biggest upset · Luton 3-1 Man City",
    "Avg squad rating · 84",
    "Most-used formation · 4-3-3",
    "127 gaffers online now",
  ];
  const doubled = [...items, ...items];
  return (
    <section className="relative border-y border-border bg-surface/40 overflow-hidden py-4">
      <div className="marquee flex gap-12 whitespace-nowrap font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {doubled.map((t, i) => (
          <span key={i} className="flex items-center gap-3">
            <span className="w-1 h-1 rounded-full bg-primary" />
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------------- HOW IT WORKS ---------------- */
function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.7], ["0%", "100%"]);

  const steps = [
    { n: "01", title: "Enter the draft", body: "Every Premier League player enters one pool. Rarity tiers from Bronze to Icon. Fair for everyone." },
    { n: "02", title: "Pick your XI", body: "Each position gives you 5 random eligible players. Choose once. Live with it. No rerolls." },
    { n: "03", title: "Set your tactics", body: "Formation, mentality, tempo, pressing, width. Fit players out of position — pay the price." },
    { n: "04", title: "Win the bracket", body: "16-team knockout. Your squad quality vs their reputation. Watch the match unfold live." },
  ];

  return (
    <section id="how" ref={ref} className="relative py-32 md:py-48">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel n="01">The Loop</SectionLabel>
        <h2 className="mt-4 font-display text-6xl md:text-8xl leading-[0.9]">
          Four steps.<br /><span className="text-muted-foreground">One trophy.</span>
        </h2>

        <div className="relative mt-20 grid md:grid-cols-4 gap-8 md:gap-4">
          {/* progress line */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-px bg-border">
            <motion.div style={{ width: lineHeight }} className="h-full bg-primary origin-left" />
          </div>
          {steps.map((s, i) => (
            <StepCard key={s.n} step={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, index }: { step: { n: string; title: string; body: string }; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative pt-16 md:pt-20"
    >
      <div className="absolute top-0 left-0 md:left-4 w-4 h-4 rounded-full bg-background border-2 border-primary">
        <div className="absolute inset-0.5 rounded-full bg-primary/30 ticker-dot" />
      </div>
      <div className="font-mono text-xs text-primary tracking-widest">{step.n}</div>
      <h3 className="mt-3 font-display text-3xl">{step.title}</h3>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{step.body}</p>
    </motion.div>
  );
}

/* ---------------- FEATURES ---------------- */
function Features() {
  return (
    <section id="features" className="relative py-32 md:py-48 border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel n="02">Kit bag</SectionLabel>
        <h2 className="mt-4 font-display text-6xl md:text-8xl leading-[0.9]">
          Built for<br /><span className="text-primary italic">the touchline.</span>
        </h2>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-6 auto-rows-[200px]">
          <TiltCard className="md:col-span-4 md:row-span-2 bg-gradient-to-br from-primary/20 via-surface to-surface">
            <FeatureDraft />
          </TiltCard>
          <TiltCard className="md:col-span-2 md:row-span-1 bg-surface">
            <FeatureTactics />
          </TiltCard>
          <TiltCard className="md:col-span-2 md:row-span-1 bg-surface-2">
            <FeatureBracket />
          </TiltCard>
          <TiltCard className="md:col-span-6 md:row-span-1 bg-gradient-to-r from-surface via-[oklch(0.2_0.03_260)] to-surface">
            <FeatureMatch />
          </TiltCard>
        </div>
      </div>
    </section>
  );
}

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rxs = useSpring(rx, { stiffness: 150, damping: 15 });
  const rys = useSpring(ry, { stiffness: 150, damping: 15 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 8);
    rx.set(-py * 8);
  };
  const onLeave = () => { rx.set(0); ry.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rxs, rotateY: rys, transformStyle: "preserve-3d" }}
      className={`relative rounded-2xl border border-border overflow-hidden p-8 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function FeatureDraft() {
  return (
    <div className="relative h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary"><Users className="w-3.5 h-3.5" /> Draft</div>
        <h3 className="mt-4 font-display text-5xl md:text-6xl leading-[0.9]">Card packs,<br />without the wallet.</h3>
        <p className="mt-4 text-muted-foreground max-w-md">Five eligible players. One pick. Rarity tiers glow gold, silver, bronze — Icons burn purple.</p>
      </div>
      <div className="flex gap-3 mt-8">
        {[
          { r: "94", n: "HAALAND", pos: "ST", tier: "gold", face: haalandAsset.url },
          { r: "89", n: "SAKA", pos: "RW", tier: "gold", face: sakaAsset.url },
          { r: "82", n: "MARTINELLI", pos: "LW", tier: "silver", face: martinelliAsset.url },
          { r: "76", n: "MITOMA", pos: "LM", tier: "bronze", face: mitomaAsset.url },
          { r: "91", n: "SALAH", pos: "RW", tier: "gold", face: salahAsset.url },
        ].map((p, i) => (
          <PlayerCard key={i} {...p} delay={i * 0.08} />
        ))}
      </div>
    </div>
  );
}

function PlayerCard({ r, n, pos, tier, face, delay = 0 }: { r: string; n: string; pos: string; tier: string; face?: string; delay?: number }) {
  const grad = tier === "gold" ? "from-[oklch(0.82_0.16_85)] to-[oklch(0.55_0.15_70)]"
    : tier === "silver" ? "from-[oklch(0.85_0.01_260)] to-[oklch(0.55_0.008_260)]"
    : "from-[oklch(0.62_0.13_55)] to-[oklch(0.4_0.1_40)]";
  return (
    <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay }}
      className={`relative flex-1 aspect-[3/4] max-w-[110px] rounded-lg bg-gradient-to-b ${grad} p-2 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] hover:-translate-y-2 transition-transform overflow-hidden`}
      style={{ transform: "translateZ(40px)" }}
    >
      {face && (
        <img src={face} alt={n} className="absolute inset-x-0 bottom-6 mx-auto w-[85%] object-contain pointer-events-none mix-blend-luminosity opacity-90" />
      )}
      <div className="relative text-black font-display">
        <div className="text-3xl leading-none">{r}</div>
        <div className="text-[10px] font-bold">{pos}</div>
      </div>
      <div className="absolute inset-x-2 bottom-2 text-black text-[10px] font-black uppercase tracking-tight truncate z-10">{n}</div>
    </motion.div>
  );
}

function FeatureTactics() {
  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent"><Grid3x3 className="w-3.5 h-3.5" /> Tactics</div>
      <div>
        <h3 className="font-display text-3xl md:text-4xl leading-[0.9]">Formation matters.</h3>
        <p className="mt-2 text-sm text-muted-foreground">4-3-3, 3-5-2, 4-2-3-1. Play a striker at CB — good luck.</p>
      </div>
    </div>
  );
}

function FeatureBracket() {
  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[oklch(0.82_0.16_85)]"><Trophy className="w-3.5 h-3.5" /> Bracket</div>
      <div>
        <h3 className="font-display text-3xl md:text-4xl leading-[0.9]">16 teams.<br />One trophy.</h3>
        <p className="mt-2 text-sm text-muted-foreground">UCL-style draw. Upsets happen.</p>
      </div>
    </div>
  );
}

function FeatureMatch() {
  return (
    <div className="h-full flex items-center justify-between gap-8">
      <div>
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary"><Zap className="w-3.5 h-3.5" /> Live match engine</div>
        <h3 className="mt-3 font-display text-4xl md:text-5xl leading-[0.9]">Watch the ball move.<br />Not a text log.</h3>
      </div>
      <div className="hidden md:flex items-center gap-6 font-mono text-sm">
        <StatBox label="POSS" value="58%" />
        <StatBox label="SHOTS" value="14" />
        <StatBox label="xG" value="2.1" />
        <div className="font-display text-5xl text-primary">2 - 1</div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-2xl">{value}</div>
    </div>
  );
}

/* ---------------- STATS ---------------- */
function Stats() {
  const stats = [
    { v: 620, s: "+", l: "Real players in the pool" },
    { v: 24881, l: "Squads drafted this week" },
    { v: 16, l: "Teams in every bracket" },
    { v: 93, s: "%", l: "Gaffers say they'll draft again" },
  ];
  return (
    <section id="stats" className="relative py-32 border-t border-border bg-surface/30">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel n="03">By the numbers</SectionLabel>
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => <Counter key={i} target={s.v} suffix={s.s} label={s.l} />)}
        </div>
      </div>
    </section>
  );
}

function Counter({ target, suffix = "", label }: { target: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1600;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.floor(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);
  return (
    <div ref={ref}>
      <div className="font-display text-6xl md:text-7xl text-primary">
        {n.toLocaleString()}{suffix}
      </div>
      <div className="mt-2 text-sm text-muted-foreground uppercase tracking-widest font-mono">{label}</div>
    </div>
  );
}

/* ---------------- TESTIMONIALS ---------------- */
function Testimonials() {
  const rowA = [
    { q: "Drafted a bronze CB, he ended top scorer. Gaffer moment.", a: "@toffee_tom", club: "EVE" },
    { q: "Finally a manager sim where the tactics screen doesn't feel like tax software.", a: "@northlondoner", club: "ARS" },
    { q: "Lost the final on pens. Filed for divorce with my own squad.", a: "@sam_utd", club: "MUN" },
    { q: "The live match dots are strangely hypnotic.", a: "@potter_out", club: "CHE" },
  ];
  const rowB = [
    { q: "Finally something new in the football-game space.", a: "@katia_kop", club: "LIV" },
    { q: "Got Haaland at 94, immediately played him at LB for laughs. 0-6.", a: "@citizen42", club: "MCI" },
    { q: "Bracket format is genius. Every match matters.", a: "@blade_runner", club: "SHU" },
    { q: "My mate rage-quit after his bronze GK conceded 5. Peak entertainment.", a: "@spursy4life", club: "TOT" },
  ];
  return (
    <section className="py-32 border-t border-border overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel n="04">From the terraces</SectionLabel>
        <h2 className="mt-4 font-display text-5xl md:text-7xl leading-[0.9]">
          The <span className="text-primary italic">gaffers</span> speak.
        </h2>
      </div>
      <div className="mt-16 space-y-6">
        <TestimonialRow items={rowA} />
        <TestimonialRow items={rowB} reverse />
      </div>
    </section>
  );
}

function TestimonialRow({ items, reverse = false }: { items: { q: string; a: string; club: string }[]; reverse?: boolean }) {
  const doubled = [...items, ...items, ...items];
  return (
    <div className="relative overflow-hidden">
      <div className={`flex gap-6 whitespace-nowrap w-max ${reverse ? "marquee" : "marquee"}`}
        style={reverse ? { animationDirection: "reverse" } : {}}
      >
        {doubled.map((t, i) => (
          <div key={i} className="w-[420px] shrink-0 rounded-xl border border-border bg-surface p-6 hover:border-primary/50 transition">
            <p className="text-base text-foreground/90 whitespace-normal leading-relaxed">"{t.q}"</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 grid place-items-center font-mono text-xs text-primary">{t.club}</div>
              <span className="font-mono text-xs text-muted-foreground">{t.a}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- FAQ ---------------- */
function Faq() {
  const items = [
    { q: "Is this free?", a: "Yes. No packs, no paywalls, no premium currency. Draft as much as you want." },
    { q: "Where does the player data come from?", a: "Every current Premier League squad — real names, real attributes, live overall ratings." },
    { q: "Can I reroll a bad pick?", a: "No. Five options, one choice, you live with it. Swap between XI and bench as much as you like." },
    { q: "Does the match actually simulate or is it random?", a: "There's a real engine — squad quality, tactics, formation fit, opponent reputation all feed in. Randomness sits on top so upsets are possible." },
    { q: "Will there be more leagues?", a: "Premier League first. La Liga and Serie A once we've polished the loop." },
    { q: "Do I need an account?", a: "Not for the first draft. Save your history once you want to track streaks." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-32 border-t border-border">
      <div className="mx-auto max-w-4xl px-6">
        <SectionLabel n="05">Questions</SectionLabel>
        <h2 className="mt-4 font-display text-5xl md:text-7xl leading-[0.9]">Ask the ref.</h2>
        <div className="mt-16 divide-y divide-border border-y border-border">
          {items.map((it, i) => (
            <div key={i}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between py-6 text-left group">
                <span className="font-display text-2xl md:text-3xl group-hover:text-primary transition">{it.q}</span>
                <motion.span animate={{ rotate: open === i ? 45 : 0 }} className="text-3xl text-muted-foreground">+</motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
                    <p className="pb-6 text-muted-foreground leading-relaxed max-w-2xl">{it.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FOOTER ---------------- */
function Footer() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const y = useTransform(scrollYProgress, [0, 1], [80, -20]);
  return (
    <footer ref={ref} className="relative pt-32 pb-8 border-t border-border overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Ready?</div>
            <h2 className="mt-3 font-display text-5xl md:text-7xl leading-[0.9]">
              The touchline<br /><span className="text-primary italic">is calling.</span>
            </h2>
            <a href="/draft" className="mt-8 group inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 font-semibold text-primary-foreground shadow-[0_20px_60px_-20px_var(--crimson)] hover:shadow-[0_25px_80px_-15px_var(--crimson)] transition-all">
              Start your draft
              <ArrowUpRight className="w-5 h-5 group-hover:rotate-12 transition" />
            </a>
          </div>
          <div className="grid grid-cols-3 gap-6 text-sm">
            <FooterCol title="Play" links={["Draft", "Tactics", "Bracket", "Match engine"]} />
            <FooterCol title="Company" links={["About", "Press", "Careers", "Contact"]} />
            <FooterCol title="Legal" links={["Terms", "Privacy", "Cookies", "Licences"]} />
          </div>
        </div>
        <motion.div style={{ y }} className="mt-24 font-display leading-[0.8] text-[clamp(4rem,22vw,20rem)] text-foreground/[0.04] select-none">
          GAFFER
        </motion.div>
        <div className="mt-8 flex items-center justify-between text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <span>© 2026 Gaffer FC</span>
          <span>Made offside</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{title}</div>
      <ul className="mt-4 space-y-2">
        {links.map((l) => (
          <li key={l}><a href="#" className="hover:text-primary transition">{l}</a></li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Shared ---------------- */
function SectionLabel({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
      <span className="text-primary">{n}</span>
      <span className="w-8 h-px bg-border" />
      {children}
    </div>
  );
}
