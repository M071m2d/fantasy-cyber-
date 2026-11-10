import type { Position } from "@/generated/prisma/enums";

export const POSITION_BADGE: Record<Position, string> = {
  GK: "bg-amber-100 text-amber-800",
  CB: "bg-sky-100 text-sky-800",
  ST: "bg-rose-100 text-rose-800",
};
