import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const variantMap = {
  default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  success: "bg-green-600 text-white shadow-sm dark:bg-green-500 dark:text-white",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  danger:  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  info:    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  accent:  "bg-yellow-200 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
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
