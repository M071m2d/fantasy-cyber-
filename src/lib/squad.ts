import type { Position } from "@/generated/prisma/enums";
import {
  BUDGET,
  MAX_PER_REAL_TEAM,
  SQUAD_QUOTA,
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
  (Object.keys(SQUAD_QUOTA) as Position[]).forEach((pos) => {
    if (byPosition[pos] !== SQUAD_QUOTA[pos]) {
      errors.push(
        `You need exactly ${SQUAD_QUOTA[pos]} ${pos} players (currently ${byPosition[pos]}).`,
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

  const starters = selection.filter((s) => s.isStarting);
  if (starters.length !== STARTING_XI) {
    errors.push(`You must select exactly ${STARTING_XI} starters.`);
  }

  const starterPositions = starters
    .map((s) => pool.get(s.playerId))
    .filter((p): p is PoolPlayer => Boolean(p));
  const starterCounts = countByPosition(starterPositions);
  if (!isValidFormation(starterCounts)) {
    errors.push(
      "Starting XI formation is invalid (need 1 GK, 3-5 DEF, 2-5 MID, 1-3 FWD).",
    );
  }

  const captains = selection.filter((s) => s.isCaptain);
  const vices = selection.filter((s) => s.isVice);
  if (captains.length !== 1) errors.push("Select exactly one captain.");
  if (vices.length !== 1) errors.push("Select exactly one vice-captain.");
  if (
    captains.length === 1 &&
    vices.length === 1 &&
    captains[0].playerId === vices[0].playerId
  ) {
    errors.push("Captain and vice-captain must be different players.");
  }
  for (const c of [...captains, ...vices]) {
    if (!c.isStarting) {
      errors.push("Captain and vice-captain must be in the starting XI.");
    }
  }

  const bench = selection.filter((s) => !s.isStarting);
  const benchOrders = bench.map((b) => b.benchOrder);
  if (new Set(benchOrders).size !== benchOrders.length) {
    errors.push("Bench players must have unique bench order numbers.");
  }

  return {
    ok: errors.length === 0,
    errors,
    totalCost,
    formation: formationString(starterCounts),
  };
}
