import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";

export default async function AdminOverviewPage() {
  const [players, teams, rounds, managers, scored] = await Promise.all([
    prisma.player.count(),
    prisma.realTeam.count(),
    prisma.round.count(),
    prisma.fantasyTeam.count(),
    prisma.round.count({ where: { status: "SCORED" } }),
  ]);

  const stats = [
    { label: "Managers", value: managers, href: "/leaderboard" },
    { label: "Tournament players", value: players, href: "/admin/players" },
    { label: "Real teams", value: teams, href: "/admin/players" },
    { label: "Rounds", value: rounds, href: "/admin/rounds" },
    { label: "Rounds scored", value: scored, href: "/admin/scoring" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition hover:border-emerald-300 hover:shadow-md">
              <CardBody>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {s.label}
                </p>
                <p className="mt-1 text-3xl font-black text-slate-900">
                  {s.value}
                </p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Typical workflow</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3 text-sm text-slate-600">
          <p>1. Add real teams and their players with prices.</p>
          <p>2. Create rounds and fixtures (matches).</p>
          <p>3. Open a round so managers can edit squads before the deadline.</p>
          <p>4. Enter each player&apos;s match stats after the games.</p>
          <p>5. Lock the round, then calculate scores to update the leaderboard.</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/admin/players" className={buttonClass("primary", "sm")}>
              Manage players
            </Link>
            <Link href="/admin/rounds" className={buttonClass("outline", "sm")}>
              Manage rounds
            </Link>
            <Link href="/admin/stats" className={buttonClass("outline", "sm")}>
              Enter stats
            </Link>
            <Link href="/admin/scoring" className={buttonClass("outline", "sm")}>
              Calculate scores
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
