import { describe, expect, it } from "vitest";
import {
  computeTeamRound,
  isValidFormation,
  scorePlayer,
  type PlayerStatInput,
  type SquadPick,
} from "../src/lib/scoring";

function stat(over: Partial<PlayerStatInput> & { playerId: string }): PlayerStatInput {
  return {
    minutes: 90,
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
    ...over,
  };
}

describe("scorePlayer", () => {
  it("scores an appearance and a defender clean sheet", () => {
    const b = scorePlayer({
      position: "DEF",
      minutes: 90,
      goals: 0,
      assists: 0,
      cleanSheet: true,
      saves: 0,
      penaltiesSaved: 0,
      penaltiesMissed: 0,
      yellowCards: 0,
      redCards: 0,
      ownGoals: 0,
      bonus: 0,
    });
    expect(b.appearance).toBe(2);
    expect(b.cleanSheet).toBe(4);
    expect(b.total).toBe(6);
  });

  it("scores goals by position", () => {
    expect(
      scorePlayer({
        position: "FWD", minutes: 90, goals: 2, assists: 1, cleanSheet: false,
        saves: 0, penaltiesSaved: 0, penaltiesMissed: 0, yellowCards: 0,
        redCards: 0, ownGoals: 0, bonus: 3,
      }).total,
    ).toBe(2 + 8 + 3 + 3);
  });

  it("handles saves, cards and penalties", () => {
    const b = scorePlayer({
      position: "GK", minutes: 90, goals: 0, assists: 0, cleanSheet: true,
      saves: 7, penaltiesSaved: 1, penaltiesMissed: 0, yellowCards: 1,
      redCards: 0, ownGoals: 0, bonus: 2,
    });
    expect(b.saves).toBe(2);
    expect(b.penalties).toBe(5);
    expect(b.cards).toBe(-1);
    expect(b.total).toBe(2 + 4 + 2 + 5 - 1 + 2);
  });
});

describe("isValidFormation", () => {
  it("accepts 4-4-2 and 3-5-2", () => {
    expect(isValidFormation({ GK: 1, DEF: 4, MID: 4, FWD: 2 })).toBe(true);
    expect(isValidFormation({ GK: 1, DEF: 3, MID: 5, FWD: 2 })).toBe(true);
  });
  it("rejects illegal formations", () => {
    expect(isValidFormation({ GK: 1, DEF: 2, MID: 5, FWD: 3 })).toBe(false);
    expect(isValidFormation({ GK: 2, DEF: 3, MID: 3, FWD: 3 })).toBe(false);
  });
});

describe("computeTeamRound", () => {
  const picks: SquadPick[] = [
    { playerId: "gk", position: "GK", isStarting: true, isCaptain: false, isVice: false, benchOrder: 0 },
    { playerId: "d1", position: "DEF", isStarting: true, isCaptain: false, isVice: false, benchOrder: 0 },
    { playerId: "d2", position: "DEF", isStarting: true, isCaptain: false, isVice: false, benchOrder: 0 },
    { playerId: "d3", position: "DEF", isStarting: true, isCaptain: false, isVice: false, benchOrder: 0 },
    { playerId: "d4", position: "DEF", isStarting: true, isCaptain: false, isVice: false, benchOrder: 0 },
    { playerId: "m1", position: "MID", isStarting: true, isCaptain: true, isVice: false, benchOrder: 0 },
    { playerId: "m2", position: "MID", isStarting: true, isCaptain: false, isVice: false, benchOrder: 0 },
    { playerId: "m3", position: "MID", isStarting: true, isCaptain: false, isVice: false, benchOrder: 0 },
    { playerId: "m4", position: "MID", isStarting: true, isCaptain: false, isVice: false, benchOrder: 0 },
    { playerId: "f1", position: "FWD", isStarting: true, isCaptain: false, isVice: false, benchOrder: 0 },
    { playerId: "f2", position: "FWD", isStarting: true, isCaptain: false, isVice: false, benchOrder: 0 },
    { playerId: "bench1", position: "MID", isStarting: false, isCaptain: false, isVice: false, benchOrder: 0 },
  ];

  it("doubles the captain's points", () => {
    const stats = picks
      .filter((p) => p.isStarting)
      .map((p) =>
        stat({
          playerId: p.playerId,
          goals: p.position === "MID" ? 1 : 0,
        }),
      );
    const result = computeTeamRound(picks, stats);
    const captain = result.players.find((p) => p.isCaptain);
    expect(captain?.multipliedBy).toBe(2);
    expect(result.points).toBeGreaterThan(0);
  });

  it("auto-subs a bench player when a starter does not play", () => {
    const stats = picks
      .filter((p) => p.isStarting && p.playerId !== "m4")
      .map((p) => stat({ playerId: p.playerId }));
    stats.push(stat({ playerId: "bench1", goals: 2 }));

    const result = computeTeamRound(picks, stats);
    const sub = result.players.find((p) => p.playerId === "bench1");
    expect(sub?.cameOffBench).toBe(true);
    expect(sub?.benched).toBe(false);
  });

  it("promotes the vice-captain when the captain does not play", () => {
    const stats = picks
      .filter((p) => p.isStarting && p.playerId !== "m1")
      .map((p) => stat({ playerId: p.playerId }));
    stats.push(stat({ playerId: "bench1" }));

    const vicePicks = picks.map((p) =>
      p.playerId === "m2" ? { ...p, isVice: true } : p,
    );
    const result = computeTeamRound(vicePicks, stats);
    expect(result.captainId).toBe("m2");
    expect(result.players.find((p) => p.playerId === "m2")?.multipliedBy).toBe(2);
  });
});
