import { prisma } from "@/lib/db";
import {
  createPlayerAction,
  createRealTeamAction,
  updatePlayerAction,
} from "@/app/actions/admin";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { cn, formatPrice } from "@/lib/utils";
import { POSITION_BADGE } from "@/lib/labels";
import { countByPosition } from "@/lib/scoring";

export default async function AdminPlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const realTeams = await prisma.realTeam.findMany({
    include: { players: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });

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
            <CardTitle>Add a real team</CardTitle>
          </CardHeader>
          <CardBody>
            <form action={createRealTeamAction} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="team-name">Team name</Label>
                <Input id="team-name" name="name" placeholder="e.g. Riverside FC" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="team-group">Group</Label>
                <Input id="team-group" name="group" placeholder="e.g. Group A" required />
              </div>
              <SubmitButton pendingText="Adding…">Add team</SubmitButton>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add a player</CardTitle>
          </CardHeader>
          <CardBody>
            <form action={createPlayerAction} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="player-name">Player name</Label>
                <Input id="player-name" name="name" placeholder="Full name" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="player-position">Position</Label>
                  <Select id="player-position" name="position" defaultValue="CB">
                    <option value="GK">GK</option>
                    <option value="CB">CB</option>
                    <option value="ST">ST</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="player-price">Price (m)</Label>
                  <Input
                    id="player-price"
                    name="price"
                    type="number"
                    step="0.1"
                    min="3.5"
                    max="20"
                    defaultValue="5.0"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="player-team">Real team</Label>
                <Select id="player-team" name="realTeamId" required>
                  {realTeams.length === 0 && (
                    <option value="">Add a real team first</option>
                  )}
                  {realTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
              <SubmitButton pendingText="Adding…">Add player</SubmitButton>
            </form>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Players ({realTeams.reduce((n, t) => n + t.players.length, 0)})
          </CardTitle>
        </CardHeader>
        <CardBody className="space-y-6">
          {realTeams.length === 0 && (
            <p className="text-sm text-slate-500">No teams yet.</p>
          )}
          {realTeams.map((team) => {
            const counts = countByPosition(team.players);
            return (
            <div key={team.id}>
              <p className="mb-2 text-sm font-semibold text-slate-900">
                {team.name}{" "}
                <span className="font-normal text-slate-400">
                  · {team.group}
                </span>
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {team.players.length}/7 · {counts.GK} GK · {counts.CB} CB ·{" "}
                  {counts.ST} ST
                </span>
              </p>
              <div className="space-y-1">
                {team.players.map((player) => (
                  <form
                    key={player.id}
                    action={updatePlayerAction}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5"
                  >
                    <input type="hidden" name="id" value={player.id} />
                    <span
                      className={cn(
                        "flex h-6 w-9 items-center justify-center rounded text-xs font-bold",
                        POSITION_BADGE[player.position],
                      )}
                    >
                      {player.position}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-800">
                      {player.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatPrice(player.price)}
                    </span>
                    <Input
                      name="price"
                      type="number"
                      step="0.1"
                      min="3.5"
                      max="20"
                      defaultValue={player.price}
                      className="h-8 w-20"
                    />
                    <label className="flex items-center gap-1 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        name="isActive"
                        defaultChecked={player.isActive}
                      />
                      Active
                    </label>
                    <SubmitButton variant="outline" size="sm" pendingText="…">
                      Save
                    </SubmitButton>
                  </form>
                ))}
                {team.players.length === 0 && (
                  <p className="text-xs text-slate-400">No players.</p>
                )}
              </div>
            </div>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
