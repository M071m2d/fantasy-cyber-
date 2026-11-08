import { prisma } from "@/lib/db";
import {
  createMatchAction,
  createRoundAction,
  setRoundStatusAction,
} from "@/app/actions/admin";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const STATUS_VARIANT = {
  UPCOMING: "neutral",
  OPEN: "info",
  LOCKED: "warning",
  SCORED: "success",
} as const;

export default async function AdminRoundsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const [rounds, realTeams] = await Promise.all([
    prisma.round.findMany({
      include: {
        matches: {
          include: {
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
          },
        },
      },
      orderBy: { number: "asc" },
    }),
    prisma.realTeam.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create a round</CardTitle>
          </CardHeader>
          <CardBody>
            <form action={createRoundAction} className="space-y-3">
              <div className="grid grid-cols-[1fr_100px] gap-3">
                <div className="space-y-1">
                  <Label htmlFor="round-name">Round name</Label>
                  <Input
                    id="round-name"
                    name="name"
                    placeholder="e.g. Matchday 1"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="round-number">Number</Label>
                  <Input
                    id="round-number"
                    name="number"
                    type="number"
                    min="1"
                    defaultValue={rounds.length + 1}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="round-deadline">Deadline</Label>
                <Input
                  id="round-deadline"
                  name="deadline"
                  type="datetime-local"
                  required
                />
              </div>
              <SubmitButton pendingText="Creating…">Create round</SubmitButton>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add a fixture</CardTitle>
          </CardHeader>
          <CardBody>
            <form action={createMatchAction} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="match-round">Round</Label>
                <Select id="match-round" name="roundId" required>
                  {rounds.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="home-team">Home team</Label>
                  <Select id="home-team" name="homeTeamId" required>
                    {realTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="away-team">Away team</Label>
                  <Select id="away-team" name="awayTeamId" required>
                    {realTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <SubmitButton pendingText="Adding…">Add fixture</SubmitButton>
            </form>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rounds & fixtures</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          {rounds.length === 0 && (
            <p className="text-sm text-slate-500">No rounds yet.</p>
          )}
          {rounds.map((round) => (
            <div key={round.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {round.name}{" "}
                    <Badge variant={STATUS_VARIANT[round.status]}>
                      {round.status}
                    </Badge>
                  </p>
                  <p className="text-xs text-slate-500">
                    Deadline {formatDate(round.deadline)}
                  </p>
                </div>
                <form
                  action={setRoundStatusAction}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="id" value={round.id} />
                  <Select
                    name="status"
                    defaultValue={round.status}
                    className="h-8 w-36"
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="OPEN">Open</option>
                    <option value="LOCKED">Locked</option>
                    <option value="SCORED">Scored</option>
                  </Select>
                  <SubmitButton variant="outline" size="sm" pendingText="…">
                    Set
                  </SubmitButton>
                </form>
              </div>

              <ul className="mt-3 space-y-1">
                {round.matches.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded bg-slate-50 px-3 py-1.5 text-sm"
                  >
                    <span className="text-slate-700">
                      {m.homeTeam.name}{" "}
                      <span className="text-slate-400">vs</span>{" "}
                      {m.awayTeam.name}
                    </span>
                    <Badge
                      variant={m.status === "PLAYED" ? "success" : "neutral"}
                    >
                      {m.status}
                    </Badge>
                  </li>
                ))}
                {round.matches.length === 0 && (
                  <li className="text-xs text-slate-400">No fixtures yet.</li>
                )}
              </ul>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
