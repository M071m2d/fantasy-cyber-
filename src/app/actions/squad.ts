"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveSquadSchema } from "@/lib/validations";
import { validateSquad, type PoolPlayer } from "@/lib/squad";

export type SquadState = { error?: string; success?: string };

export async function saveSquadAction(
  _prev: SquadState,
  formData: FormData,
): Promise<SquadState> {
  const user = await requireUser();

  const raw = formData.get("data");
  if (typeof raw !== "string") {
    return { error: "Malformed squad submission." };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { error: "Malformed squad submission." };
  }

  const parsed = saveSquadSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid squad." };
  }

  const round = await prisma.round.findFirst({
    where: { status: { in: ["OPEN", "UPCOMING"] } },
    orderBy: { number: "asc" },
  });
  if (round && round.status === "OPEN" && round.deadline.getTime() < Date.now()) {
    return { error: "The deadline has passed. Squad editing is locked." };
  }

  const ids = parsed.data.picks.map((p) => p.playerId);
  const players = await prisma.player.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      position: true,
      price: true,
      realTeamId: true,
      isActive: true,
    },
  });

  const pool = new Map<string, PoolPlayer>();
  for (const p of players) pool.set(p.id, p);

  const result = validateSquad(parsed.data.picks, pool);
  if (!result.ok) {
    return { error: result.errors[0] ?? "Invalid squad." };
  }

  const team = await prisma.fantasyTeam.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      name: parsed.data.teamName,
      formation: result.formation,
    },
    update: {
      name: parsed.data.teamName,
      formation: result.formation,
    },
  });

  await prisma.$transaction([
    prisma.squadPlayer.deleteMany({ where: { fantasyTeamId: team.id } }),
    prisma.squadPlayer.createMany({
      data: parsed.data.picks.map((p) => ({
        fantasyTeamId: team.id,
        playerId: p.playerId,
        isStarting: p.isStarting,
        isCaptain: p.isCaptain,
        isVice: p.isVice,
        benchOrder: p.benchOrder,
      })),
    }),
  ]);

  revalidatePath("/squad");
  revalidatePath("/dashboard");

  return { success: "Squad saved!" };
}
