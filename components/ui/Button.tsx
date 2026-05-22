"use client";

import {
  forwardRef,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ButtonHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

/* ─── Variants & sizes ───────────────────────────────────────────────────── */

const variantMap = {
  primary:
    "bg-blue-700 text-white hover:bg-blue-800 active:bg-blue-900 focus-visible:ring-blue-500",
  accent:
    "bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-700 focus-visible:ring-yellow-400",
  outline:
    "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-blue-500",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-blue-500",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500",
  dark:
    "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-700 focus-visible:ring-slate-500",
};

const sizeMap = {
  sm:   "h-8  px-3   text-xs  gap-1.5",
  md:   "h-9  px-4   text-sm  gap-2",
  lg:   "h-11 px-6   text-base gap-2",
  icon: "h-9  w-9    text-sm",
};

/* ─── Simple Slot implementation for asChild ─────────────────────────────── */

interface SlotProps {
  children: ReactElement<Record<string, unknown>>;
  [key: string]: unknown;
}

function Slot({ children, ...slotProps }: SlotProps) {
  if (!isValidElement(children)) return null;
  return cloneElement(children, {
    ...slotProps,
    ...(children.props as Record<string, unknown>),
    className: cn(
      (slotProps as { className?: string }).className,
      (children.props as { className?: string }).className
    ),
  });
}

/* ─── Button ─────────────────────────────────────────────────────────────── */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantMap;
  size?: keyof typeof sizeMap;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      asChild = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseClass = cn(
      "inline-flex items-center justify-center rounded-lg font-medium",
      "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      variantMap[variant],
      sizeMap[size],
      className
    );

    const content = (
      <>
        {loading ? <Spinner size="sm" /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </>
    );

    if (asChild && isValidElement(children)) {
      return (
        <Slot className={baseClass}>
          {children as ReactElement<Record<string, unknown>>}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        className={baseClass}
        {...props}
      >
        {content}
      </button>
    );
  }
);
Button.displayName = "Button";
