import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { POSITION_ORDER } from "@/lib/constants";
import type { TeamRoundResult } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const team = await prisma.fantasyTeam.findUnique({
    where: { id },
    include: {
      user: { select: { displayName: true } },
      scores: {
        include: { round: { select: { name: true, number: true } } },
        orderBy: { round: { number: "asc" } },
      },
      players: {
        include: {
          player: {
            include: { realTeam: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!team) notFound();

  const total = team.scores.reduce((sum, s) => sum + s.points, 0);
  const last = team.scores[team.scores.length - 1];
  const breakdown = last?.breakdownJson as unknown as TeamRoundResult | undefined;
  const nameById = new Map(
    team.players.map((sp) => [sp.playerId, sp.player.name]),
  );

  const squads = POSITION_ORDER.map((pos) => ({
    pos,
    players: team.players
      .filter((sp) => sp.player.position === pos)
      .sort((a, b) => Number(b.isStarting) - Number(a.isStarting)),
  }));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href="/leaderboard" className="text-xs text-emerald-700">
          ← Back to leaderboard
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{team.name}</h1>
            <p className="text-sm text-slate-600">
              Managed by {team.user.displayName} · Formation {team.formation}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-slate-900">{total}</p>
            <p className="text-xs text-slate-400">total points</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Round history</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {team.scores.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                No rounds scored yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {[...team.scores].reverse().map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between px-5 py-2.5 text-sm"
                  >
                    <span className="text-slate-700">{s.round.name}</span>
                    <Badge variant="success">{s.points} pts</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {last ? `${last.round.name} breakdown` : "Squad"}
            </CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {breakdown ? (
              <ul className="divide-y divide-slate-100">
                {breakdown.players
                  .filter((p) => !p.benched)
                  .sort(
                    (a, b) =>
                      POSITION_ORDER.indexOf(a.position) -
                      POSITION_ORDER.indexOf(b.position),
                  )
                  .map((p) => (
                    <li
                      key={p.playerId}
                      className="flex items-center justify-between px-5 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2 text-slate-700">
                        {p.isCaptain && <Badge variant="default">C</Badge>}
                        {p.cameOffBench && (
                          <Badge variant="warning">sub</Badge>
                        )}
                        {nameById.get(p.playerId) ?? p.playerId}
                      </span>
                      <span className="font-bold text-slate-900">
                        {p.points}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="space-y-3 px-5 py-4">
                {squads.map((group) => (
                  <div key={group.pos}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {group.pos}
                    </p>
                    <ul className="mt-1 space-y-1">
                      {group.players.map((sp) => (
                        <li
                          key={sp.id}
                          className="flex items-center justify-between text-sm text-slate-700"
                        >
                          <span className="flex items-center gap-2">
                            {sp.player.name}
                            {sp.isCaptain && (
                              <Badge variant="default">C</Badge>
                            )}
                            {!sp.isStarting && (
                              <Badge variant="neutral">Bench</Badge>
                            )}
                          </span>
                          <span className="text-xs text-slate-400">
                            {sp.player.realTeam.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
