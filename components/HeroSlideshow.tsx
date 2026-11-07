"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";

export type HeroSlide = { src: string; alt: string; role: string; side: "freelancer" | "client" };

const INTERVAL_MS = 5500;

const QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReduceMotion(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function getReduceMotion() {
  return window.matchMedia(QUERY).matches;
}

// Cut-out people that cross-fade behind the floating milestone cards.
// Stops advancing on hover and for visitors who prefer reduced motion.
export function HeroSlideshow({ slides, className }: { slides: HeroSlide[]; className?: string }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useSyncExternalStore(subscribeReduceMotion, getReduceMotion, () => false);

  useEffect(() => {
    if (paused || reduceMotion || slides.length < 2) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % slides.length), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, reduceMotion, slides.length]);

  return (
    <div
      className={className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* soft glow so the cut-out sits on something */}
      <div
        className="pointer-events-none absolute inset-x-[-10%] bottom-0 h-[78%] rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(16,185,129,0.22), transparent 72%)" }}
      />

      {slides.map((s, i) => {
        const on = i === active;
        return (
          <div
            key={s.src}
            aria-hidden={!on}
            className="absolute inset-0"
            style={{
              opacity: on ? 1 : 0,
              transform: reduceMotion ? "none" : `translateX(${on ? 0 : 24}px)`,
              transition: reduceMotion ? "none" : "opacity 900ms ease, transform 900ms ease",
            }}
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              priority={i === 0}
              sizes="(max-width: 1024px) 60vw, 360px"
              className="object-contain object-bottom"
            />
          </div>
        );
      })}

      {/* role caption */}
      <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2">
        <div
          key={active}
          className="whitespace-nowrap rounded-full border border-slate-200 bg-white/95 px-3.5 py-1.5 text-[12px] font-semibold text-slate-700 shadow-md"
          style={{ animation: reduceMotion ? undefined : "capin 600ms ease both" }}
        >
          <span
            className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
              slides[active].side === "client" ? "bg-blue-500" : "bg-emerald-500"
            }`}
          />
          {slides[active].role}
        </div>
      </div>

      {/* dots */}
      {slides.length > 1 && (
        <div className="absolute right-0 top-2 z-10 flex gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              aria-label={`Show ${s.role}`}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-emerald-500" : "w-1.5 bg-slate-300 hover:bg-slate-400"}`}
            />
          ))}
        </div>
      )}

      <style>{`@keyframes capin { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }`}</style>
    </div>
  );
}
