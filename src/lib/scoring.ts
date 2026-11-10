import type { Position } from "@/generated/prisma/enums";
import { FORMATION_LIMITS, STARTING_XI } from "@/lib/constants";

export interface StatLine {
  position: Position;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  saves: number;
  penaltiesSaved: number;
  penaltiesMissed: number;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
  bonus: number;
}

export interface ScoreBreakdown {
  appearance: number;
  goals: number;
  assists: number;
  cleanSheet: number;
  saves: number;
  penalties: number;
  cards: number;
  ownGoals: number;
  bonus: number;
  total: number;
}

const GOAL_POINTS: Record<Position, number> = {
  GK: 6,
  CB: 6,
  ST: 4,
};

const CLEAN_SHEET_POINTS: Record<Position, number> = {
  GK: 4,
  CB: 4,
  ST: 0,
};

export function appearancePoints(minutes: number): number {
  if (minutes <= 0) return 0;
  return minutes >= 60 ? 2 : 1;
}

/** Points for a single player given their match stat line. */
export function scorePlayer(stat: StatLine): ScoreBreakdown {
  const appearance = appearancePoints(stat.minutes);
  const goals = stat.goals * GOAL_POINTS[stat.position];

  const assists = stat.assists * 3;

  const cleanSheet =
    stat.cleanSheet && stat.minutes >= 60
      ? CLEAN_SHEET_POINTS[stat.position]
      : 0;

  const saves = Math.floor(stat.saves / 3);

  const penalties =
    stat.penaltiesSaved * 5 + stat.penaltiesMissed * -2;

  const cards = stat.yellowCards * -1 + stat.redCards * -3;

  const ownGoals = stat.ownGoals * -2;

  const bonus = stat.bonus;

  const total =
    appearance +
    goals +
    assists +
    cleanSheet +
    saves +
    penalties +
    cards +
    ownGoals +
    bonus;

  return {
    appearance,
    goals,
    assists,
    cleanSheet,
    saves,
    penalties,
    cards,
    ownGoals,
    bonus,
    total,
  };
}

export interface SquadPick {
  playerId: string;
  position: Position;
  isStarting: boolean;
  isCaptain: boolean;
  isVice: boolean;
  benchOrder: number;
}

export interface PlayerStatInput {
  playerId: string;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  saves: number;
  penaltiesSaved: number;
  penaltiesMissed: number;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
  bonus: number;
}

export interface ScoredPlayer {
  playerId: string;
  position: Position;
  points: number;
  basePoints: number;
  breakdown: ScoreBreakdown;
  played: boolean;
  isCaptain: boolean;
  isVice: boolean;
  multipliedBy: number;
  cameOffBench: boolean;
  benched: boolean;
}

export interface TeamRoundResult {
  points: number;
  players: ScoredPlayer[];
  formation: Record<Position, number>;
  captainId: string | null;
}

const EMPTY_STAT = {
  minutes: 0,
  goals: 0,
  assists: 0,
  cleanSheet: false,
  saves: 0,
  penaltiesSaved: 0,
  penaltiesMissed: 0,
  yellowCards: 0,
  redCards: 0,
  ownGoals: 0,
  bonus: 0,
};

export function countByPosition(
  picks: { position: Position }[],
): Record<Position, number> {
  const counts: Record<Position, number> = { GK: 0, CB: 0, ST: 0 };
  for (const p of picks) counts[p.position] += 1;
  return counts;
}

export function isValidFormation(counts: Record<Position, number>): boolean {
  const total = counts.GK + counts.CB + counts.ST;
  if (total !== STARTING_XI) return false;
  return (Object.keys(FORMATION_LIMITS) as Position[]).every(
    (pos) =>
      counts[pos] >= FORMATION_LIMITS[pos].min &&
      counts[pos] <= FORMATION_LIMITS[pos].max,
  );
}

export function formationString(counts: Record<Position, number>): string {
  return `${counts.CB}-${counts.ST}`;
}

/**
 * Compute a fantasy team's score for a round, applying:
 * - automatic substitutions for starters who did not play
 * - captain doubling (vice-captain takes over if the captain did not play)
 */
export function computeTeamRound(
  picks: SquadPick[],
  stats: PlayerStatInput[],
): TeamRoundResult {
  const statById = new Map<string, PlayerStatInput>();
  for (const s of stats) statById.set(s.playerId, s);

  const scoreFor = (pick: SquadPick) => {
    const raw = statById.get(pick.playerId);
    const line: StatLine = {
      ...EMPTY_STAT,
      ...(raw ?? {}),
      position: pick.position,
    };
    return scorePlayer(line);
  };

  const played = (pick: SquadPick) =>
    (statById.get(pick.playerId)?.minutes ?? 0) > 0;

  let starters = picks.filter((p) => p.isStarting);
  const bench = picks
    .filter((p) => !p.isStarting)
    .sort((a, b) => a.benchOrder - b.benchOrder);

  const usedBench = new Set<string>();
  const cameOffBench = new Set<string>();

  for (let i = 0; i < starters.length; i++) {
    const starter = starters[i];
    if (played(starter)) continue;

    for (const sub of bench) {
      if (usedBench.has(sub.playerId)) continue;
      if (starter.position === "GK" && sub.position !== "GK") continue;
      if (starter.position !== "GK" && sub.position === "GK") continue;

      const candidate = starters.map((s, idx) =>
        idx === i ? sub : s,
      );
      const counts = countByPosition(candidate);
      if (!isValidFormation(counts)) continue;

      usedBench.add(sub.playerId);
      cameOffBench.add(sub.playerId);
      starters = candidate;
      break;
    }
  }

  const starterIds = new Set(starters.map((s) => s.playerId));

  const captainPick =
    picks.find((p) => p.isCaptain && starterIds.has(p.playerId) && played(p)) ??
    null;
  const vicePick =
    picks.find((p) => p.isVice && starterIds.has(p.playerId) && played(p)) ??
    null;
  const effectiveCaptain = captainPick ?? vicePick;

  const scored: ScoredPlayer[] = picks.map((pick) => {
    const breakdown = scoreFor(pick);
    const isStarter = starterIds.has(pick.playerId);
    const isEffectiveCaptain =
      effectiveCaptain?.playerId === pick.playerId;
    const multiplier = isEffectiveCaptain ? 2 : 1;

    return {
      playerId: pick.playerId,
      position: pick.position,
      basePoints: breakdown.total,
      points: breakdown.total * multiplier,
      breakdown,
      played: played(pick),
      isCaptain: isEffectiveCaptain,
      isVice: pick.isVice && !isEffectiveCaptain,
      multipliedBy: multiplier,
      cameOffBench: cameOffBench.has(pick.playerId),
      benched: !isStarter,
    };
  });

  const points = scored
    .filter((p) => starterIds.has(p.playerId))
    .reduce((sum, p) => sum + p.points, 0);

  return {
    points,
    players: scored,
    formation: countByPosition(starters),
    captainId: effectiveCaptain?.playerId ?? null,
  };
}
