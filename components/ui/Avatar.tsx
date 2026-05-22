"use client";

import { forwardRef, useState } from "react";
import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const pixelSizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, name = "", size = "md", className, ...props }, ref) => {
    const [imgError, setImgError] = useState(false);
    const initials = getInitials(name);
    const showImage = src && !imgError;

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
          "bg-blue-100 text-blue-700",
          "font-semibold select-none",
          sizeMap[size],
          className
        )}
        {...props}
      >
        {showImage ? (
          <Image
            src={src}
            alt={alt ?? name}
            width={pixelSizeMap[size]}
            height={pixelSizeMap[size]}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <span aria-label={alt ?? name}>{initials || "?"}</span>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";
