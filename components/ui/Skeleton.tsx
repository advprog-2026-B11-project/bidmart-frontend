import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200",
        "",
        "bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]",
        className
      )}
      {...props}
    />
  );
}
