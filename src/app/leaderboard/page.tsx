import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PER_PAGE = 50;

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const current = Math.max(1, Number(sp.page) || 1);

  const [teams, agg] = await Promise.all([
    prisma.fantasyTeam.findMany({
      select: {
        id: true,
        name: true,
        user: { select: { displayName: true } },
      },
    }),
    prisma.roundScore.groupBy({
      by: ["fantasyTeamId"],
      _sum: { points: true },
    }),
  ]);

  const totals = new Map<string, number>();
  for (const a of agg) totals.set(a.fantasyTeamId, a._sum.points ?? 0);

  const ranked = teams
    .map((t) => ({ ...t, points: totals.get(t.id) ?? 0 }))
    .sort(
      (a, b) => b.points - a.points || a.name.localeCompare(b.name),
    );

  const totalPages = Math.max(1, Math.ceil(ranked.length / PER_PAGE));
  const pageItems = ranked.slice(
    (current - 1) * PER_PAGE,
    current * PER_PAGE,
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Leaderboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          {ranked.length} managers competing for the top spot.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall standings</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2 font-medium">Rank</th>
                <th className="px-5 py-2 font-medium">Manager</th>
                <th className="px-5 py-2 font-medium">Team</th>
                <th className="px-5 py-2 text-right font-medium">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.map((t, i) => {
                const rank = (current - 1) * PER_PAGE + i + 1;
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 font-semibold text-slate-500">
                      {rank}
                    </td>
                    <td className="px-5 py-2.5 text-slate-700">
                      {t.user.displayName}
                    </td>
                    <td className="px-5 py-2.5">
                      <Link
                        href={`/team/${t.id}`}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        {t.name}
                      </Link>
                    </td>
                    <td className="px-5 py-2.5 text-right font-bold text-slate-900">
                      {t.points}
                    </td>
                  </tr>
                );
              })}
              {ranked.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No teams yet. Be the first to build a squad!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/leaderboard?page=${p}`}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium",
                p === current
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
