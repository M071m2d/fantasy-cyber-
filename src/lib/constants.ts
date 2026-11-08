import type { Position } from "@/generated/prisma/enums";

/** Default budget in millions. Change here to reconfigure the game. */
export const BUDGET = 100;

export const SQUAD_SIZE = 15;
export const MAX_PER_REAL_TEAM = 3;

export const SQUAD_QUOTA: Record<Position, number> = {
  GK: 2,
  DEF: 5,
  MID: 5,
  FWD: 3,
};

export const STARTING_QUOTA: Record<Position, number> = {
  GK: 1,
  DEF: 4,
  MID: 4,
  FWD: 2,
};

export const FORMATION_LIMITS: Record<
  Position,
  { min: number; max: number }
> = {
  GK: { min: 1, max: 1 },
  DEF: { min: 3, max: 5 },
  MID: { min: 2, max: 5 },
  FWD: { min: 1, max: 3 },
};

export const STARTING_XI = 11;

export const POSITION_ORDER: Position[] = ["GK", "DEF", "MID", "FWD"];

export const POSITION_LABEL: Record<Position, string> = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Forward",
};
