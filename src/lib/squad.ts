import type { Position } from "@/generated/prisma/enums";
import {
  BUDGET,
  MAX_PER_REAL_TEAM,
  SQUAD_MIN,
  SQUAD_SIZE,
  STARTING_XI,
} from "@/lib/constants";
import {
  countByPosition,
  formationString,
  isValidFormation,
} from "@/lib/scoring";

export interface PoolPlayer {
  id: string;
  position: Position;
  price: number;
  realTeamId: string;
  isActive: boolean;
}

export interface SquadSelection {
  playerId: string;
  isStarting: boolean;
  isCaptain: boolean;
  isVice: boolean;
  benchOrder: number;
}

export interface SquadValidationResult {
  ok: boolean;
  errors: string[];
  totalCost: number;
  formation: string;
}

export function validateSquad(
  selection: SquadSelection[],
  pool: Map<string, PoolPlayer>,
): SquadValidationResult {
  const errors: string[] = [];

  if (selection.length !== SQUAD_SIZE) {
    errors.push(`Squad must contain exactly ${SQUAD_SIZE} players.`);
  }

  const ids = selection.map((s) => s.playerId);
  if (new Set(ids).size !== ids.length) {
    errors.push("Squad cannot contain duplicate players.");
  }

  const chosen: PoolPlayer[] = [];
  for (const pick of selection) {
    const player = pool.get(pick.playerId);
    if (!player) {
      errors.push("One or more selected players are invalid.");
      continue;
    }
    if (!player.isActive) {
      errors.push(`${pick.playerId} is not available for selection.`);
    }
    chosen.push(player);
  }

  const byPosition = countByPosition(chosen);
  (Object.keys(SQUAD_MIN) as Position[]).forEach((pos) => {
    if (byPosition[pos] < SQUAD_MIN[pos]) {
      errors.push(
        `You need at least ${SQUAD_MIN[pos]} ${pos} players (currently ${byPosition[pos]}).`,
      );
    }
  });

  const perTeam = new Map<string, number>();
  for (const p of chosen) {
    perTeam.set(p.realTeamId, (perTeam.get(p.realTeamId) ?? 0) + 1);
  }
  for (const [, count] of perTeam) {
    if (count > MAX_PER_REAL_TEAM) {
      errors.push(`Maximum ${MAX_PER_REAL_TEAM} players from a single team.`);
      break;
    }
  }

  const totalCost = chosen.reduce((sum, p) => sum + p.price, 0);
  if (totalCost > BUDGET + 1e-9) {
    errors.push(
      `Squad costs £${totalCost.toFixed(1)}m, over the £${BUDGET.toFixed(1)}m budget.`,
    );
  }

  if (!isValidFormation(byPosition)) {
    errors.push(
      `Invalid formation (need 1 GK, 2-4 CB, 2-4 ST — ${SQUAD_SIZE} players total).`,
    );
  }

  const starters = selection.filter((s) => s.isStarting);
  if (starters.length !== STARTING_XI) {
    errors.push(`All ${STARTING_XI} squad players must be in the lineup.`);
  }

  const captain = selection.find((s) => s.isCaptain);
  const vice = selection.find((s) => s.isVice);
  if (!captain) errors.push("Select a captain.");
  if (!vice) errors.push("Select a vice-captain.");
  if (captain && vice && captain.playerId === vice.playerId) {
    errors.push("Captain and vice-captain must be different players.");
  }
  if (captain && !captain.isStarting) {
    errors.push("Captain must be in the lineup.");
  }
  if (vice && !vice.isStarting) {
    errors.push("Vice-captain must be in the lineup.");
  }

  return {
    ok: errors.length === 0,
    errors,
    totalCost,
    formation: formationString(byPosition),
  };
}
