import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const variantMap = {
  default: "bg-slate-100 text-slate-600",
  success: "bg-emerald-600 text-white",
  warning: "bg-amber-500 text-white",
  danger:  "bg-red-600 text-white",
  info:    "bg-blue-600 text-white",
  accent:  "bg-yellow-400 text-yellow-900",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variantMap;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantMap[variant],
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";
