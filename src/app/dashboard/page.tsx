import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();

  const [team, currentRound, totalTeams, scoreAgg, lastScores] =
    await Promise.all([
      prisma.fantasyTeam.findUnique({
        where: { userId: user.id },
        include: { players: true },
      }),
      prisma.round.findFirst({
        where: { status: { in: ["OPEN", "UPCOMING"] } },
        orderBy: { number: "asc" },
      }),
      prisma.fantasyTeam.count(),
      prisma.roundScore.groupBy({
        by: ["fantasyTeamId"],
        _sum: { points: true },
      }),
      prisma.roundScore.findMany({
        where: { fantasyTeam: { userId: user.id } },
        orderBy: { round: { number: "desc" } },
        take: 5,
        include: { round: { select: { name: true, number: true } } },
      }),
    ]);

  const totals = scoreAgg
    .map((s) => ({ id: s.fantasyTeamId, points: s._sum.points ?? 0 }))
    .sort((a, b) => b.points - a.points);

  const myTotal = team
    ? (totals.find((t) => t.id === team.id)?.points ?? 0)
    : 0;
  const myRank = team
    ? totals.findIndex((t) => t.id === team.id) + 1
    : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user.displayName}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {team ? team.name : "You have not built a squad yet."}
          </p>
        </div>
        <Link href="/squad" className={buttonClass("primary", "md")}>
          {team ? "Edit my squad" : "Build my squad"}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total points
            </p>
            <p className="mt-1 text-3xl font-black text-slate-900">{myTotal}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Overall rank
            </p>
            <p className="mt-1 text-3xl font-black text-slate-900">
              {myRank > 0 ? `#${myRank}` : "—"}
            </p>
            <p className="text-xs text-slate-400">of {totalTeams} managers</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Squad
            </p>
            <p className="mt-1 text-3xl font-black text-slate-900">
              {team ? `${team.players.length}/15` : "0/15"}
            </p>
            <p className="text-xs text-slate-400">
              {team ? `Formation ${team.formation}` : "Not built"}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Current round
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {currentRound ? currentRound.name : "No active round"}
            </p>
            <p className="text-xs text-slate-400">
              {currentRound
                ? `Deadline ${formatDate(currentRound.deadline)}`
                : "Check back soon"}
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent rounds</CardTitle>
            <Link
              href="/leaderboard"
              className="text-xs font-semibold text-emerald-700"
            >
              View leaderboard
            </Link>
          </CardHeader>
          <CardBody>
            {lastScores.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                No rounds scored yet. Your points will appear here after the
                admin enters match stats.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {lastScores.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <span className="text-sm text-slate-700">
                      {s.round.name}
                    </span>
                    <Badge variant="success">{s.points} pts</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick guide</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm text-slate-600">
            <p>• Build a legal 15-player squad within budget.</p>
            <p>• Pick 11 starters and nominate a captain (double points).</p>
            <p>• Edit your team until the round deadline.</p>
            <p>• Points are calculated from real tournament match stats.</p>
            <p>• Climb the global leaderboard round by round.</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
