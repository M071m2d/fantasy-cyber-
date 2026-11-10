import type { Position } from "@/generated/prisma/enums";

/** Default budget in millions. Change here to reconfigure the game. */
export const BUDGET = 80;

export const SQUAD_SIZE = 7;
export const STARTING_XI = SQUAD_SIZE;
export const MAX_PER_REAL_TEAM = 3;

/** Every squad must include at least these many players per position. */
export const SQUAD_MIN: Record<Position, number> = {
  GK: 1,
  CB: 2,
  ST: 2,
};

export const FORMATION_LIMITS: Record<
  Position,
  { min: number; max: number }
> = {
  GK: { min: 1, max: 1 },
  CB: { min: 2, max: 4 },
  ST: { min: 2, max: 4 },
};

/** Squad composition limits used to cap picks while building. */
export const SQUAD_MAX: Record<Position, number> = {
  GK: 1,
  CB: 4,
  ST: 4,
};

export const POSITION_ORDER: Position[] = ["GK", "CB", "ST"];

export const POSITION_LABEL: Record<Position, string> = {
  GK: "Goalkeeper",
  CB: "Defender",
  ST: "Striker",
};
