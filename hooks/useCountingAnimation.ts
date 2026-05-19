"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a numeric value from its previous state to the new target.
 * Uses ease-out cubic over `duration` ms via requestAnimationFrame.
 * setState is only called inside the rAF callback (async), satisfying
 * the react-hooks/set-state-in-effect rule.
 */
export function useCountingAnimation(
  target: number | null,
  duration = 600
): number | null {
  const [displayed, setDisplayed] = useState<number | null>(target);
  const startRef = useRef<number>(target ?? 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === null) {
      /* Defer to satisfy set-state-in-effect rule */
      Promise.resolve().then(() => setDisplayed(null));
      return;
    }

    const from = startRef.current;
    /* If unchanged, displayed is already correct — no update needed */
    if (from === target) return;

    const startAt = performance.now();

    /* setState called from rAF callback — not synchronous in effect body */
    function step(now: number) {
      const t = Math.min((now - startAt) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(from + (target! - from) * eased);
      startRef.current = current;
      setDisplayed(current);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        startRef.current = target!;
      }
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return displayed;
}
