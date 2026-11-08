/**
 * HeroSection.tsx
 * ------------------------------------------------------------------
 * Full-viewport hero built to match the reference mockup:
 *   • left  → availability badge, name, tagline, CTAs
 *   • centre→ the large monochrome particle portrait (the star)
 *   • right → Expertise (skill bars) + Tech Stack (icon grid)
 *   • lower-left → Achievements strip
 *   • bottom-centre → "move your cursor over my portrait" hint
 *
 * The portrait is rendered exactly once and slotted into either the
 * desktop layered layout or the mobile stacked layout (a media query
 * decides), so there is never a second WebGL context.
 * ------------------------------------------------------------------
 */
import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Award, Boxes, Download, Mouse, Rocket, Sparkles } from "lucide-react";
import {
  SiPython,
  SiMysql,
  SiTensorflow,
  SiPandas,
  SiNumpy,
  SiGit,
  SiScikitlearn,
  SiJavascript,
} from "react-icons/si";
import { Button } from "@/components/ui/button";
import ParticleLoader from "@/components/ParticleLoader";

// Code-split Three.js so the hero layout paints instantly; particles hydrate after.
const ParticlePortrait = lazy(() => import("@/components/ParticlePortrait"));
const PORTRAIT_SRC = `${import.meta.env.BASE_URL}portrait-source.png`;
const RESUME_URL =
  "https://drive.google.com/file/d/1LN2AQ5XoojyQJdSyUy1KHfSSpbkF43Lk/view?usp=sharing";

/** Tailwind-free media query hook (client-only SPA). */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [query]);
  return matches;
}

// ---- Static content ------------------------------------------------
const EXPERTISE = [
  { label: "Data Science", value: 95 },
  { label: "Machine Learning", value: 90 },
  { label: "Deep Learning", value: 85 },
  { label: "Python", value: 95 },
];

const TECH = [
  { icon: SiPython, label: "Python", color: "#4B8BBE" },
  { icon: SiMysql, label: "SQL", color: "#4479A1" },
  { icon: SiTensorflow, label: "TensorFlow", color: "#FF6F00" },
  { icon: SiPandas, label: "Pandas", color: "#E70488" },
  { icon: SiNumpy, label: "NumPy", color: "#4DABCF" },
  { icon: SiGit, label: "Git", color: "#F05032" },
  { icon: SiScikitlearn, label: "Scikit-learn", color: "#F7931E" },
  { icon: SiJavascript, label: "JavaScript", color: "#F7DF1E" },
];

const ACHIEVEMENTS = [
  { icon: Boxes, value: "12+", label: "Projects" },
  { icon: Sparkles, value: "3+", label: "Years Learning" },
  { icon: Award, value: "18+", label: "Certifications" },
  { icon: Rocket, value: "Explore", label: "More" },
];

// ---- Reusable glass card shell -------------------------------------
const GlassCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div
    data-cursor="card"
    className={`group rounded-3xl border border-white/10 bg-black/40 p-5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:bg-black/55 hover:shadow-[0_22px_60px_-15px_rgba(124,92,240,0.4)] ${className}`}
  >
    {children}
  </div>
);

const CardEyebrow = ({ children }: { children: ReactNode }) => (
  <div className="mb-4 flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] text-muted-foreground">
    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
    {children}
  </div>
);

const HeroSection = () => {
  const isLg = useMediaQuery("(min-width: 1024px)");

  // The single portrait instance — sized differently per layout.
  const portrait = (
    <Suspense
      fallback={
        <div className="relative h-full w-full">
          <ParticleLoader />
        </div>
      }
    >
      <ParticlePortrait src={PORTRAIT_SRC} alt="Praveen Tak" className="h-full w-full" />
    </Suspense>
  );

  // ---- Content blocks (declared once, placed by each layout) --------
  // ---- Content pieces (composed differently on desktop vs mobile) ----
  const availabilityBadge = (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium tracking-wide text-foreground">
      <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
      AVAILABLE FOR OPPORTUNITIES
    </span>
  );

  const nameBlock = (
    <div className="w-full space-y-2">
      <span className="block text-2xl font-medium text-muted-foreground md:text-3xl">Hi, I'm</span>
      {/* Original animated Name.gif on its original blue gradient band */}
      <Link to="/" aria-label="Praveen Tak" className="block">
        <div className="name-gradient-band mx-auto flex w-[min(92vw,420px)] items-center justify-center overflow-hidden rounded-2xl px-4 py-1.5 shadow-[0_10px_30px_-14px_rgba(0,60,180,0.45)] md:mx-0 md:w-fit md:max-w-[80vw] md:px-6 md:py-2">
          <img
            src={`${import.meta.env.BASE_URL}Name.gif`}
            alt="Praveen Tak"
            className="w-full object-contain md:h-56 md:w-auto"
          />
        </div>
      </Link>
    </div>
  );

  const subtitle = (
    <p className="text-lg text-muted-foreground md:text-xl">Computer Science Graduate</p>
  );

  const tagline = (
    <p className="max-w-sm leading-relaxed text-muted-foreground">
      Passionate about Data Science, Machine Learning and building intelligent systems that solve
      real-world problems.
    </p>
  );

  const ctas = (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
      <Link to="/experience" className="w-full sm:w-auto">
        <Button size="lg" className="group w-full shadow-glow sm:w-auto">
          View Experience
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </Link>
      <a href={RESUME_URL} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
        <Button size="lg" variant="outline" className="w-full sm:w-auto">
          Download Resume
          <Download className="ml-2 h-4 w-4" />
        </Button>
      </a>
    </div>
  );

  // Desktop intro block (left column) — assembled pieces, left-aligned.
  const intro = (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="max-w-md space-y-6"
    >
      {availabilityBadge}
      {nameBlock}
      {subtitle}
      {tagline}
      {ctas}
    </motion.div>
  );

  const expertiseCard = (
    <GlassCard>
      <CardEyebrow>EXPERTISE</CardEyebrow>
      <div className="space-y-4">
        {EXPERTISE.map((s) => (
          <div key={s.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-foreground">{s.label}</span>
              <span className="text-muted-foreground">{s.value}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: 0 }}
                whileInView={{ width: `${s.value}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );

  const techCard = (
    <GlassCard>
      <CardEyebrow>TECH STACK</CardEyebrow>
      <div className="grid grid-cols-4 gap-3">
        {TECH.map((t) => (
          <div
            key={t.label}
            title={t.label}
            className="flex aspect-square items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-105 hover:border-primary/40 hover:bg-white/[0.09] hover:shadow-[0_8px_24px_-8px_rgba(124,92,240,0.5)]"
          >
            <t.icon
              className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
              style={{ color: t.color }}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 text-center text-muted-foreground">•••</div>
    </GlassCard>
  );

  const achievementsCard = (
    <GlassCard>
      <CardEyebrow>ACHIEVEMENTS</CardEyebrow>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {ACHIEVEMENTS.map((a) => (
          <div key={a.label} className="space-y-1">
            <a.icon className="h-5 w-5 text-primary" />
            <p className="text-lg font-bold text-foreground">{a.value}</p>
            <p className="text-xs text-muted-foreground">{a.label}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );

  const scrollHint = (
    <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
      <Mouse className="h-5 w-5 animate-bounce" />
      <span>{isLg ? "Move your cursor over my portrait" : "Tap & drag anywhere to play"}</span>
    </div>
  );

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Near-black stage (slightly translucent so the dot-grid background
          shows through) with a faint purple bloom in the top-left */}
      <div className="pointer-events-none absolute inset-0 bg-black/70" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,hsl(var(--primary)/0.12),transparent_42%)]" />

      {isLg ? (
        /* ---------------- Desktop: layered layout ---------------- */
        <>
          {/* Big portrait, centred behind the content — allowed to overflow
              its bounds so hair / dust / glow can extend past the face. */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto aspect-[3/4] h-screen max-h-[1120px] translate-x-[24px]">{portrait}</div>
          </div>

          <div className="pointer-events-none absolute inset-0">
            <div className="container mx-auto h-full max-w-7xl px-8">
              {/* Intro — upper left */}
              <div className="pointer-events-auto absolute left-8 top-28 xl:left-12">{intro}</div>

              {/* Expertise — upper right */}
              <div className="pointer-events-auto absolute right-8 top-24 w-[300px] xl:right-12">
                {expertiseCard}
              </div>

              {/* Tech stack — lower right */}
              <div className="pointer-events-auto absolute bottom-28 right-8 w-[300px] xl:right-12">
                {techCard}
              </div>

              {/* Achievements — lower left */}
              <div className="pointer-events-auto absolute bottom-16 left-8 w-[460px] xl:left-12">
                {achievementsCard}
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2">
            {scrollHint}
          </div>
        </>
      ) : (
        /* ---------------- Mobile / tablet: clean stacked ---------------- */
        <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-6 px-5 pb-16 pt-24 text-center">
          {availabilityBadge}
          {nameBlock}
          <div className="aspect-[3/4] w-full max-w-[300px]">{portrait}</div>
          {subtitle}
          {tagline}
          {ctas}
          <div className="mt-2 w-full space-y-5">
            {expertiseCard}
            {techCard}
            {achievementsCard}
          </div>
          {scrollHint}
        </div>
      )}
    </section>
  );
};

export default HeroSection;
