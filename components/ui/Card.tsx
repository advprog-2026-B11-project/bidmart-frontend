import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const variantMap = {
  default:     "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
  elevated:    "bg-white dark:bg-slate-900 shadow-md dark:shadow-slate-900/60",
  interactive: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md",
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variantMap;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-xl", variantMap[variant], className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold leading-snug text-slate-900 dark:text-slate-50", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-slate-500 dark:text-slate-400", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-6 pb-6", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center px-6 pb-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";
