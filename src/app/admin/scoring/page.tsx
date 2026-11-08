import Link from "next/link";
import { prisma } from "@/lib/db";
import { calculateRoundAction } from "@/app/actions/admin";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/submit-button";
import { cn } from "@/lib/utils";

export default async function AdminScoringPage({
  searchParams,
}: {
  searchParams: Promise<{ roundId?: string; done?: string; error?: string }>;
}) {
  const sp = await searchParams;

  const rounds = await prisma.round.findMany({
    orderBy: { number: "asc" },
    include: { _count: { select: { matches: true, scores: true } } },
  });

  const activeRound =
    rounds.find((r) => r.id === sp.roundId) ??
    rounds.find((r) => r._count.matches > 0) ??
    rounds[0];

  const statsCount = activeRound
    ? await prisma.playerMatchStat.count({
        where: { match: { roundId: activeRound.id } },
      })
    : 0;

  return (
    <div className="space-y-6">
      {sp.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {sp.error}
        </p>
      )}
      {sp.done && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Scores calculated — {sp.done}.
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
              href={`/admin/scoring?roundId=${r.id}`}
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
            <CardTitle>Calculate scores · {activeRound.name}</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Fixtures</p>
                <p className="text-xl font-bold text-slate-900">
                  {activeRound._count.matches}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Player stat rows</p>
                <p className="text-xl font-bold text-slate-900">
                  {statsCount}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Status</p>
                <p className="mt-0.5">
                  <Badge
                    variant={
                      activeRound.status === "SCORED" ? "success" : "warning"
                    }
                  >
                    {activeRound.status}
                  </Badge>
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Recalculating overwrites previous scores for this round. Make sure
              all match stats are entered first.
            </p>
            <form action={calculateRoundAction}>
              <input type="hidden" name="roundId" value={activeRound.id} />
              <SubmitButton pendingText="Calculating…">
                Calculate scores for {activeRound.name}
              </SubmitButton>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
