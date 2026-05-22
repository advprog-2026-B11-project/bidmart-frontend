import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const variantMap = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-green-600 text-white shadow-sm",
  warning: "bg-yellow-100 text-yellow-700",
  danger:  "bg-red-100 text-red-700",
  info:    "bg-blue-100 text-blue-700",
  accent:  "bg-yellow-200 text-yellow-800",
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
