import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type Variant = "default" | "success" | "warning" | "danger" | "info" | "neutral";

const variants: Record<Variant, string> = {
  default: "bg-emerald-100 text-emerald-800",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-rose-100 text-rose-800",
  info: "bg-sky-100 text-sky-800",
  neutral: "bg-slate-100 text-slate-700",
};

export function Badge({
  variant = "default",
  className,
  ...props
}: ComponentProps<"span"> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
