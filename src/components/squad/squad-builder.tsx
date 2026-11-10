"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import type { Position } from "@/generated/prisma/enums";
import { saveSquadAction, type SquadState } from "@/app/actions/squad";
import {
  BUDGET,
  MAX_PER_REAL_TEAM,
  POSITION_ORDER,
  SQUAD_MAX,
  SQUAD_MIN,
  SQUAD_SIZE,
} from "@/lib/constants";
import { countByPosition } from "@/lib/scoring";
import { validateSquad } from "@/lib/squad";
import { formatPrice, cn } from "@/lib/utils";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export type PoolPlayerView = {
  id: string;
  name: string;
  position: Position;
  price: number;
  realTeamId: string;
  realTeamName: string;
  isActive: boolean;
};

export type InitialPick = {
  playerId: string;
  isStarting: boolean;
  isCaptain: boolean;
  isVice: boolean;
  benchOrder: number;
};

type PickMeta = { isCaptain: boolean; isVice: boolean };

const POSITION_BADGE: Record<Position, string> = {
  GK: "bg-amber-100 text-amber-800",
  CB: "bg-sky-100 text-sky-800",
  ST: "bg-rose-100 text-rose-800",
};

const GROUPS: { label: string; pos: Position }[] = [
  { label: "Strikers", pos: "ST" },
  { label: "Defenders", pos: "CB" },
  { label: "Goalkeepers", pos: "GK" },
];

export function SquadBuilder({
  pool,
  initialPicks,
  initialTeamName,
  roundName,
  editable,
}: {
  pool: PoolPlayerView[];
  initialPicks: InitialPick[];
  initialTeamName: string;
  roundName: string | null;
  editable: boolean;
}) {
  const playerById = useMemo(() => {
    const map = new Map<string, PoolPlayerView>();
    for (const p of pool) map.set(p.id, p);
    return map;
  }, [pool]);

  const poolMap = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        position: Position;
        price: number;
        realTeamId: string;
        isActive: boolean;
      }
    >();
    for (const p of pool) {
      map.set(p.id, {
        id: p.id,
        position: p.position,
        price: p.price,
        realTeamId: p.realTeamId,
        isActive: p.isActive,
      });
    }
    return map;
  }, [pool]);

  const [teamName, setTeamName] = useState(initialTeamName);
  const [order, setOrder] = useState<string[]>(initialPicks.map((p) => p.playerId));
  const [meta, setMeta] = useState<Record<string, PickMeta>>(() => {
    const out: Record<string, PickMeta> = {};
    for (const p of initialPicks) {
      out[p.playerId] = { isCaptain: p.isCaptain, isVice: p.isVice };
    }
    return out;
  });
  const [filter, setFilter] = useState<Position | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const [state, formAction] = useActionState<SquadState, FormData>(
    saveSquadAction,
    {},
  );

  const selected = order
    .map((id) => playerById.get(id))
    .filter((p): p is PoolPlayerView => Boolean(p));

  const totalCost = selected.reduce((sum, p) => sum + p.price, 0);
  const remaining = BUDGET - totalCost;
  const positionCounts = countByPosition(selected);

  const selectionForValidation = selected.map((p) => ({
    playerId: p.id,
    isStarting: true,
    isCaptain: Boolean(meta[p.id]?.isCaptain),
    isVice: Boolean(meta[p.id]?.isVice),
    benchOrder: 0,
  }));

  const validation = validateSquad(selectionForValidation, poolMap);

  const teamCounts = new Map<string, number>();
  for (const p of selected) {
    teamCounts.set(p.realTeamId, (teamCounts.get(p.realTeamId) ?? 0) + 1);
  }

  const filteredPool = useMemo(() => {
    const term = search.trim().toLowerCase();
    return pool
      .filter((p) => p.isActive)
      .filter((p) => (filter === "ALL" ? true : p.position === filter))
      .filter(
        (p) =>
          term.length === 0 ||
          p.name.toLowerCase().includes(term) ||
          p.realTeamName.toLowerCase().includes(term),
      )
      .sort(
        (a, b) =>
          POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position) ||
          b.price - a.price,
      );
  }, [pool, filter, search]);

  function addPlayer(player: PoolPlayerView) {
    setLocalError(null);
    if (selected.some((p) => p.id === player.id)) return;
    if (selected.length >= SQUAD_SIZE) {
      setLocalError(`Your squad already has ${SQUAD_SIZE} players.`);
      return;
    }
    if (positionCounts[player.position] >= SQUAD_MAX[player.position]) {
      setLocalError(`You already have the maximum ${player.position} players.`);
      return;
    }
    if ((teamCounts.get(player.realTeamId) ?? 0) >= MAX_PER_REAL_TEAM) {
      setLocalError(
        `Maximum ${MAX_PER_REAL_TEAM} players from ${player.realTeamName}.`,
      );
      return;
    }
    if (totalCost + player.price > BUDGET + 1e-9) {
      setLocalError("That player would exceed your budget.");
      return;
    }

    setOrder((prev) => [...prev, player.id]);
    setMeta((prev) => ({
      ...prev,
      [player.id]: { isCaptain: false, isVice: false },
    }));
  }

  function removePlayer(id: string) {
    setLocalError(null);
    setOrder((prev) => prev.filter((x) => x !== id));
    setMeta((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function setCaptain(id: string) {
    setMeta((prev) => {
      const next: Record<string, PickMeta> = {};
      for (const [key, value] of Object.entries(prev)) {
        next[key] = { ...value, isCaptain: key === id };
      }
      return next;
    });
  }

  function setVice(id: string) {
    setMeta((prev) => {
      const next: Record<string, PickMeta> = {};
      for (const [key, value] of Object.entries(prev)) {
        next[key] = { ...value, isVice: key === id };
      }
      return next;
    });
  }

  const payload = {
    teamName,
    picks: selected.map((p) => ({
      playerId: p.id,
      isStarting: true,
      isCaptain: Boolean(meta[p.id]?.isCaptain),
      isVice: Boolean(meta[p.id]?.isVice),
      benchOrder: 0,
    })),
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      {/* Player pool */}
      <Card className="order-2 lg:order-1">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Player pool</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search players or teams…"
              className="h-9 w-48"
            />
            <div className="flex gap-1">
              {(["ALL", ...POSITION_ORDER] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setFilter(pos)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold",
                    filter === pos
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardBody className="max-h-[640px] overflow-y-auto p-0 scrollbar-thin">
          <ul className="divide-y divide-slate-100">
            {filteredPool.map((player) => {
              const picked = selected.some((p) => p.id === player.id);
              return (
                <li
                  key={player.id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <span
                    className={cn(
                      "flex h-8 w-10 items-center justify-center rounded-md text-xs font-bold",
                      POSITION_BADGE[player.position],
                    )}
                  >
                    {player.position}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {player.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {player.realTeamName}
                    </p>
                  </div>
                  <span className="w-16 text-right text-sm font-semibold text-slate-700">
                    {formatPrice(player.price)}
                  </span>
                  {picked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePlayer(player.id)}
                    >
                      Remove
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => addPlayer(player)}
                      disabled={!editable}
                    >
                      Add
                    </Button>
                  )}
                </li>
              );
            })}
            {filteredPool.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-slate-500">
                No players match your filters.
              </li>
            )}
          </ul>
        </CardBody>
      </Card>

      {/* Squad */}
      <div className="order-1 space-y-4 lg:order-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Your squad</CardTitle>
            <span className="text-xs text-slate-500">
              {roundName ? `${roundName}` : "No active round"}
            </span>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-xs text-slate-500">Spent</p>
                <p className="text-sm font-bold text-slate-900">
                  {formatPrice(totalCost)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-xs text-slate-500">Left</p>
                <p
                  className={cn(
                    "text-sm font-bold",
                    remaining < 0 ? "text-rose-600" : "text-emerald-600",
                  )}
                >
                  {formatPrice(remaining)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-xs text-slate-500">Squad</p>
                <p className="text-sm font-bold text-slate-900">
                  {selected.length}/{SQUAD_SIZE}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">
                Team name
              </label>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Real Ale FC"
                disabled={!editable}
              />
            </div>

            <div className="space-y-3">
              {GROUPS.map((group) => {
                const inGroup = selected.filter(
                  (p) => p.position === group.pos,
                );
                return (
                  <div key={group.pos}>
                    <p className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <span>{group.label}</span>
                      <span>
                        {positionCounts[group.pos]}/{SQUAD_MAX[group.pos]} · min{" "}
                        {SQUAD_MIN[group.pos]}
                      </span>
                    </p>
                    {inGroup.length === 0 ? (
                      <p className="rounded-md border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400">
                        No {group.label.toLowerCase()} selected.
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {inGroup.map((p) => {
                          const m = meta[p.id];
                          return (
                            <li
                              key={p.id}
                              className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5"
                            >
                              <span className="min-w-0 flex-1 truncate text-sm text-slate-800">
                                {p.name}
                              </span>
                              {m?.isCaptain && <Badge variant="default">C</Badge>}
                              {m?.isVice && <Badge variant="info">V</Badge>}
                              <button
                                type="button"
                                title="Captain"
                                disabled={!editable}
                                onClick={() => setCaptain(p.id)}
                                className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-600 disabled:opacity-30"
                              >
                                C
                              </button>
                              <button
                                type="button"
                                title="Vice-captain"
                                disabled={!editable}
                                onClick={() => setVice(p.id)}
                                className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-600 disabled:opacity-30"
                              >
                                V
                              </button>
                              <button
                                type="button"
                                title="Remove"
                                disabled={!editable}
                                onClick={() => removePlayer(p.id)}
                                className="rounded px-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                              >
                                ×
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            {!editable && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Squad editing is closed for the current round.
              </p>
            )}
            {(localError || state.error) && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {localError ?? state.error}
              </p>
            )}
            {state.success && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {state.success}
              </p>
            )}
            {selected.length === SQUAD_SIZE && !validation.ok && (
              <ul className="space-y-1 text-xs text-rose-600">
                {validation.errors.slice(0, 4).map((e) => (
                  <li key={e}>• {e}</li>
                ))}
              </ul>
            )}
            <form action={formAction}>
              <input type="hidden" name="data" value={JSON.stringify(payload)} />
              <SubmitButton
                className="w-full"
                disabled={!editable || !validation.ok}
                pendingText="Saving…"
              >
                Save squad
              </SubmitButton>
            </form>
            <p className="text-center text-xs text-slate-400">
              Formation: {validation.formation} · Captain scores double
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
