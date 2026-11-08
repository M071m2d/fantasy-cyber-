import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchStatsForm, type StatPlayer } from "@/components/admin/match-stats-form";
import { cn } from "@/lib/utils";

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ roundId?: string; matchId?: string; error?: string }>;
}) {
  const sp = await searchParams;

  const rounds = await prisma.round.findMany({
    include: {
      matches: {
        include: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
        orderBy: { id: "asc" },
      },
    },
    orderBy: { number: "asc" },
  });

  const activeRound =
    rounds.find((r) => r.id === sp.roundId) ??
    rounds.find((r) => r.matches.length > 0) ??
    rounds[0];

  const matches = activeRound?.matches ?? [];
  const activeMatch =
    matches.find((m) => m.id === sp.matchId) ?? matches[0];

  let homePlayers: StatPlayer[] = [];
  let awayPlayers: StatPlayer[] = [];

  if (activeMatch) {
    const [players, stats] = await Promise.all([
      prisma.player.findMany({
        where: {
          realTeamId: { in: [activeMatch.homeTeamId, activeMatch.awayTeamId] },
        },
        orderBy: [{ position: "asc" }, { name: "asc" }],
      }),
      prisma.playerMatchStat.findMany({
        where: { matchId: activeMatch.id },
      }),
    ]);

    const statByPlayer = new Map(stats.map((s) => [s.playerId, s]));

    const toView = (teamId: string): StatPlayer[] =>
      players
        .filter((p) => p.realTeamId === teamId)
        .map((p) => {
          const s = statByPlayer.get(p.id);
          return {
            id: p.id,
            name: p.name,
            position: p.position,
            teamName: "",
            existing: s
              ? {
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
                }
              : null,
          };
        });

    homePlayers = toView(activeMatch.homeTeamId);
    awayPlayers = toView(activeMatch.awayTeamId);
  }

  return (
    <div className="space-y-6">
      {sp.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {sp.error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Select round</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-wrap gap-2">
          {rounds.map((r) => (
            <Link
              key={r.id}
              href={`/admin/stats?roundId=${r.id}`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium",
                r.id === activeRound?.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {r.name}
            </Link>
          ))}
          {rounds.length === 0 && (
            <p className="text-sm text-slate-500">No rounds created yet.</p>
          )}
        </CardBody>
      </Card>

      {activeRound && (
        <Card>
          <CardHeader>
            <CardTitle>Select fixture</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-wrap gap-2">
            {matches.map((m) => (
              <Link
                key={m.id}
                href={`/admin/stats?roundId=${activeRound.id}&matchId=${m.id}`}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium",
                  m.id === activeMatch?.id
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {m.homeTeam.name} vs {m.awayTeam.name}
              </Link>
            ))}
            {matches.length === 0 && (
              <p className="text-sm text-slate-500">
                No fixtures in this round. Add one on the Rounds page.
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {activeMatch && (
        <Card>
          <CardHeader>
            <CardTitle>
              {activeMatch.homeTeam.name} vs {activeMatch.awayTeam.name}
            </CardTitle>
          </CardHeader>
          <CardBody>
            <MatchStatsForm
              matchId={activeMatch.id}
              homeName={activeMatch.homeTeam.name}
              awayName={activeMatch.awayTeam.name}
              homePlayers={homePlayers}
              awayPlayers={awayPlayers}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
