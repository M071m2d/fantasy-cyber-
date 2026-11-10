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
      position: "CB",
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
        position: "ST", minutes: 90, goals: 2, assists: 1, cleanSheet: false,
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
  it("accepts legal 7-a-side formations", () => {
    expect(isValidFormation({ GK: 1, CB: 3, ST: 3 })).toBe(true);
    expect(isValidFormation({ GK: 1, CB: 2, ST: 4 })).toBe(true);
    expect(isValidFormation({ GK: 1, CB: 4, ST: 2 })).toBe(true);
  });
  it("rejects illegal formations", () => {
    expect(isValidFormation({ GK: 2, CB: 2, ST: 3 })).toBe(false);
    expect(isValidFormation({ GK: 1, CB: 1, ST: 5 })).toBe(false);
    expect(isValidFormation({ GK: 1, CB: 3, ST: 2 })).toBe(false);
  });
});

describe("computeTeamRound", () => {
  const picks: SquadPick[] = [
    { playerId: "gk", position: "GK", isStarting: true, isCaptain: false, isVice: false, benchOrder: 0 },
    { playerId: "c1", position: "CB", isStarting: true, isCaptain: false, isVice: false, benchOrder: 0 },
    { playerId: "c2", position: "CB", isStarting: true, isCaptain: false, isVice: false, benchOrder: 0 },
    { playerId: "c3", position: "CB", isStarting: true, isCaptain: false, isVice: false, benchOrder: 0 },
    { playerId: "s1", position: "ST", isStarting: true, isCaptain: true, isVice: false, benchOrder: 0 },
    { playerId: "s2", position: "ST", isStarting: true, isCaptain: false, isVice: true, benchOrder: 0 },
    { playerId: "s3", position: "ST", isStarting: true, isCaptain: false, isVice: false, benchOrder: 0 },
  ];

  it("doubles the captain's points", () => {
    const stats = picks.map((p) =>
      stat({ playerId: p.playerId, goals: p.position === "ST" ? 1 : 0 }),
    );
    const result = computeTeamRound(picks, stats);
    const captain = result.players.find((p) => p.isCaptain);
    expect(captain?.multipliedBy).toBe(2);
    expect(result.points).toBeGreaterThan(0);
    expect(result.formation).toEqual({ GK: 1, CB: 3, ST: 3 });
  });

  it("promotes the vice-captain when the captain does not play", () => {
    const stats = picks
      .filter((p) => p.playerId !== "s1")
      .map((p) => stat({ playerId: p.playerId }));
    const result = computeTeamRound(picks, stats);
    expect(result.captainId).toBe("s2");
    expect(result.players.find((p) => p.playerId === "s2")?.multipliedBy).toBe(2);
  });
});
