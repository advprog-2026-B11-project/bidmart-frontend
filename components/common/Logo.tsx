import { cn } from "@/lib/utils";

type LogoVariant = "full" | "icon-only" | "mark-only";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  white?: boolean;
}

const iconPx = { sm: 24, md: 32, lg: 48 } as const;
const textClass = {
  sm: "text-lg font-bold tracking-tight",
  md: "text-xl font-bold tracking-tight",
  lg: "text-3xl font-bold tracking-tight",
} as const;

export function Logo({ variant = "full", size = "md", className, white = false }: LogoProps) {
  const px = iconPx[size];
  const gradId = `bm-grad-${size}`;

  const icon = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#FCD34D" />
        </linearGradient>
      </defs>
      {/* Gavel head */}
      <rect
        x="3" y="9" width="26" height="12" rx="3.5"
        fill={`url(#${gradId})`}
        transform="rotate(-38 16 15)"
      />
      {/* Gavel handle */}
      <line
        x1="23" y1="27" x2="44" y2="45"
        stroke={`url(#${gradId})`}
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Strike block */}
      <rect x="2" y="41" width="20" height="5" rx="2.5" fill={`url(#${gradId})`} />
    </svg>
  );

  const wordmark = (
    <span className={cn(textClass[size], white ? "text-white" : "text-slate-900 dark:text-white")}>
      Bid
      <span className={white ? "text-yellow-300" : "text-blue-700 dark:text-blue-400"}>Mart</span>
    </span>
  );

  if (variant === "icon-only") {
    return <div className={cn("inline-flex items-center", className)}>{icon}</div>;
  }
  if (variant === "mark-only") {
    return <div className={cn("inline-flex items-center", className)}>{wordmark}</div>;
  }
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {icon}
      {wordmark}
    </div>
  );
}
