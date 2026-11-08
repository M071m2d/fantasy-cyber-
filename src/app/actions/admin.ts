"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { statEntrySchema } from "@/lib/validations";
import {
  computeTeamRound,
  type PlayerStatInput,
  type SquadPick,
} from "@/lib/scoring";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createRealTeamAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const group = String(formData.get("group") ?? "").trim();
  if (name.length < 2 || group.length < 1) {
    fail("/admin/players", "Team name and group are required.");
  }
  const existing = await prisma.realTeam.findUnique({ where: { name } });
  if (existing) fail("/admin/players", "A team with that name already exists.");

  await prisma.realTeam.create({ data: { name, group } });
  revalidatePath("/admin/players");
  redirect("/admin/players");
}

export async function createPlayerAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const position = String(formData.get("position") ?? "");
  const price = Number(formData.get("price"));
  const realTeamId = String(formData.get("realTeamId") ?? "");

  if (
    name.length < 2 ||
    !["GK", "DEF", "MID", "FWD"].includes(position) ||
    !Number.isFinite(price) ||
    price < 3.5 ||
    price > 20 ||
    !realTeamId
  ) {
    fail("/admin/players", "Please provide valid player details.");
  }

  await prisma.player.create({
    data: {
      name,
      position: position as "GK" | "DEF" | "MID" | "FWD",
      price,
      realTeamId,
      isActive: true,
    },
  });
  revalidatePath("/admin/players");
  redirect("/admin/players");
}

export async function updatePlayerAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const price = Number(formData.get("price"));
  const isActive = formData.get("isActive") === "on";
  if (!id || !Number.isFinite(price) || price < 3.5 || price > 20) {
    fail("/admin/players", "Invalid player update.");
  }
  await prisma.player.update({
    where: { id },
    data: { price, isActive },
  });
  revalidatePath("/admin/players");
  redirect("/admin/players");
}

export async function createRoundAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const number = Number(formData.get("number"));
  const deadlineRaw = String(formData.get("deadline") ?? "");
  const deadline = new Date(deadlineRaw);

  if (
    name.length < 2 ||
    !Number.isInteger(number) ||
    number < 1 ||
    Number.isNaN(deadline.getTime())
  ) {
    fail("/admin/rounds", "Please provide a valid round name, number and deadline.");
  }

  const existing = await prisma.round.findUnique({ where: { number } });
  if (existing) fail("/admin/rounds", "A round with that number already exists.");

  await prisma.round.create({
    data: { name, number, deadline, status: "UPCOMING" },
  });
  revalidatePath("/admin/rounds");
  redirect("/admin/rounds");
}

export async function setRoundStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = ["UPCOMING", "OPEN", "LOCKED", "SCORED"];
  if (!id || !allowed.includes(status)) fail("/admin/rounds", "Invalid round status.");

  await prisma.round.update({
    where: { id },
    data: { status: status as "UPCOMING" | "OPEN" | "LOCKED" | "SCORED" },
  });
  revalidatePath("/admin/rounds");
  revalidatePath("/squad");
  redirect("/admin/rounds");
}

export async function createMatchAction(formData: FormData) {
  await requireAdmin();
  const roundId = String(formData.get("roundId") ?? "");
  const homeTeamId = String(formData.get("homeTeamId") ?? "");
  const awayTeamId = String(formData.get("awayTeamId") ?? "");
  if (!roundId || !homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
    fail("/admin/rounds", "Select a round and two different teams.");
  }
  await prisma.match.create({
    data: { roundId, homeTeamId, awayTeamId, status: "SCHEDULED" },
  });
  revalidatePath("/admin/rounds");
  revalidatePath("/admin/stats");
  redirect("/admin/rounds");
}

export async function saveMatchStatsAction(formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId") ?? "");
  const raw = String(formData.get("rows") ?? "[]");
  if (!matchId) fail("/admin/stats", "Missing match.");

  let rows: unknown;
  try {
    rows = JSON.parse(raw);
  } catch {
    fail("/admin/stats", "Malformed stats submission.");
  }
  if (!Array.isArray(rows)) fail("/admin/stats", "Malformed stats submission.");

  const parsedRows = [];
  for (const row of rows) {
    const parsed = statEntrySchema.safeParse({ ...row, matchId });
    if (!parsed.success) {
      fail("/admin/stats", parsed.error.issues[0]?.message ?? "Invalid stat row.");
    }
    parsedRows.push(parsed.data);
  }

  await prisma.$transaction(
    parsedRows.map((row) =>
      prisma.playerMatchStat.upsert({
        where: {
          matchId_playerId: { matchId: row.matchId, playerId: row.playerId },
        },
        create: {
          matchId: row.matchId,
          playerId: row.playerId,
          minutes: row.minutes,
          goals: row.goals,
          assists: row.assists,
          cleanSheet: row.cleanSheet,
          saves: row.saves,
          penaltiesSaved: row.penaltiesSaved,
          penaltiesMissed: row.penaltiesMissed,
          yellowCards: row.yellowCards,
          redCards: row.redCards,
          ownGoals: row.ownGoals,
          bonus: row.bonus,
        },
        update: {
          minutes: row.minutes,
          goals: row.goals,
          assists: row.assists,
          cleanSheet: row.cleanSheet,
          saves: row.saves,
          penaltiesSaved: row.penaltiesSaved,
          penaltiesMissed: row.penaltiesMissed,
          yellowCards: row.yellowCards,
          redCards: row.redCards,
          ownGoals: row.ownGoals,
          bonus: row.bonus,
        },
      }),
    ),
  );

  await prisma.match.update({
    where: { id: matchId },
    data: { status: "PLAYED" },
  });

  revalidatePath("/admin/stats");
  redirect(`/admin/stats?matchId=${matchId}`);
}

export async function calculateRoundAction(formData: FormData) {
  await requireAdmin();
  const roundId = String(formData.get("roundId") ?? "");
  if (!roundId) fail("/admin/scoring", "Select a round.");

  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: { matches: { include: { stats: true } } },
  });
  if (!round) fail("/admin/scoring", "Round not found.");

  if (round.matches.length === 0) {
    fail("/admin/scoring", "This round has no matches yet.");
  }

  const stats: PlayerStatInput[] = round.matches.flatMap((m) =>
    m.stats.map((s) => ({
      playerId: s.playerId,
      minutes: s.minutes,
      goals: s.goals,
      assists: s.assists,
      cleanSheet: s.cleanSheet,
      saves: s.saves,
      penaltiesSaved: s.penaltiesSaved,
      penaltiesMissed: s.penaltiesMissed,
      yellowCards: s.yellowCards,
      redCards: s.redCards,
      ownGoals: s.ownGoals,
      bonus: s.bonus,
    })),
  );

  const teams = await prisma.fantasyTeam.findMany({
    include: { players: { include: { player: { select: { position: true } } } } },
  });

  const ops = teams.map((team) => {
    const picks: SquadPick[] = team.players.map((sp) => ({
      playerId: sp.playerId,
      position: sp.player.position,
      isStarting: sp.isStarting,
      isCaptain: sp.isCaptain,
      isVice: sp.isVice,
      benchOrder: sp.benchOrder,
    }));
    const result = computeTeamRound(picks, stats);
    return prisma.roundScore.upsert({
      where: {
        fantasyTeamId_roundId: {
          fantasyTeamId: team.id,
          roundId: round.id,
        },
      },
      create: {
        fantasyTeamId: team.id,
        roundId: round.id,
        points: result.points,
        breakdownJson: result as unknown as Prisma.InputJsonValue,
      },
      update: {
        points: result.points,
        breakdownJson: result as unknown as Prisma.InputJsonValue,
        computedAt: new Date(),
      },
    });
  });

  await prisma.$transaction(ops);
  await prisma.round.update({
    where: { id: round.id },
    data: { status: "SCORED" },
  });

  revalidatePath("/admin/scoring");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  redirect(
    `/admin/scoring?roundId=${roundId}&done=${encodeURIComponent(
      `${teams.length} teams scored`,
    )}`,
  );
}
