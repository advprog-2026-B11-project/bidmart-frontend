"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  endTime: string;
  className?: string;
}

export function CountdownTimer({ endTime, className }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(endTime).getTime() - Date.now())
  );

  useEffect(() => {
    const tick = () =>
      setRemaining(Math.max(0, new Date(endTime).getTime() - Date.now()));
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  if (remaining <= 0) {
    return (
      <span className={cn("text-xs text-slate-400", className)}>Berakhir</span>
    );
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days  = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins  = Math.floor((totalSeconds % 3600) / 60);
  const secs  = totalSeconds % 60;

  const isUrgent = remaining < 5 * 60 * 1000;
  const text =
    days > 0
      ? `${days} hari`
      : `${hours}j ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}d`;

  return (
    <span
      className={cn(
        "text-xs font-medium tabular-nums",
        isUrgent ? "text-red-600 animate-pulse" : "text-slate-500",
        className
      )}
    >
      {text}
    </span>
  );
}
