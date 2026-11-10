import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SquadBuilder, type PoolPlayerView } from "@/components/squad/squad-builder";

export default async function SquadPage() {
  const user = await requireUser();

  const [players, team, round] = await Promise.all([
    prisma.player.findMany({
      where: { isActive: true },
      include: { realTeam: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.fantasyTeam.findUnique({
      where: { userId: user.id },
      include: { players: true },
    }),
    prisma.round.findFirst({
      where: { status: { in: ["OPEN", "UPCOMING"] } },
      orderBy: { number: "asc" },
    }),
  ]);

  const pool: PoolPlayerView[] = players.map((p) => ({
    id: p.id,
    name: p.name,
    position: p.position,
    price: p.price,
    realTeamId: p.realTeamId,
    realTeamName: p.realTeam.name,
    isActive: p.isActive,
  }));

  // eslint-disable-next-line react-hooks/purity -- server component; current time is intentional
  const editable = !round || round.deadline.getTime() > Date.now();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Pick your squad</h1>
        <p className="mt-1 text-sm text-slate-600">
          Choose 7 players within an £{80}m budget: 1 GK, 2-4 CB, 2-4 ST.
          Nominate a captain and a vice-captain.
        </p>
      </div>

      <SquadBuilder
        pool={pool}
        initialPicks={
          team?.players.map((p) => ({
            playerId: p.playerId,
            isStarting: p.isStarting,
            isCaptain: p.isCaptain,
            isVice: p.isVice,
            benchOrder: p.benchOrder,
          })) ?? []
        }
        initialTeamName={team?.name ?? `${user.displayName}'s XI`}
        roundName={round ? round.name : null}
        editable={editable}
      />
    </div>
  );
}
