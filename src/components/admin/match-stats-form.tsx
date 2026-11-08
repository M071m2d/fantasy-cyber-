"use client";

import { useMemo, useState } from "react";
import type { Position } from "@/generated/prisma/enums";
import { saveMatchStatsAction } from "@/app/actions/admin";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { POSITION_BADGE } from "@/lib/labels";
import { cn } from "@/lib/utils";

export type StatRow = {
  minutes: number;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  saves: number;
  penaltiesSaved: number;
  penaltiesMissed: number;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
  bonus: number;
};

export type StatPlayer = {
  id: string;
  name: string;
  position: Position;
  teamName: string;
  existing: StatRow | null;
};

const DEFAULT_ROW: StatRow = {
  minutes: 0,
  goals: 0,
  assists: 0,
  cleanSheet: false,
  saves: 0,
  penaltiesSaved: 0,
  penaltiesMissed: 0,
  yellowCards: 0,
  redCards: 0,
  ownGoals: 0,
  bonus: 0,
};

const NUMERIC_FIELDS: { key: keyof StatRow; label: string; max: number }[] = [
  { key: "minutes", label: "Min", max: 120 },
  { key: "goals", label: "G", max: 20 },
  { key: "assists", label: "A", max: 20 },
  { key: "saves", label: "Sv", max: 30 },
  { key: "penaltiesSaved", label: "PS", max: 5 },
  { key: "penaltiesMissed", label: "PM", max: 5 },
  { key: "yellowCards", label: "YC", max: 2 },
  { key: "redCards", label: "RC", max: 1 },
  { key: "ownGoals", label: "OG", max: 5 },
  { key: "bonus", label: "B", max: 3 },
];

export function MatchStatsForm({
  matchId,
  homeName,
  awayName,
  homePlayers,
  awayPlayers,
}: {
  matchId: string;
  homeName: string;
  awayName: string;
  homePlayers: StatPlayer[];
  awayPlayers: StatPlayer[];
}) {
  const allPlayers = useMemo(
    () => [...homePlayers, ...awayPlayers],
    [homePlayers, awayPlayers],
  );

  const [rows, setRows] = useState<Record<string, StatRow>>(() => {
    const out: Record<string, StatRow> = {};
    for (const p of allPlayers) {
      out[p.id] = p.existing ? { ...p.existing } : { ...DEFAULT_ROW };
    }
    return out;
  });

  function setField<K extends keyof StatRow>(
    playerId: string,
    key: K,
    value: StatRow[K],
  ) {
    setRows((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [key]: value },
    }));
  }

  const payload = allPlayers.map((p) => ({
    playerId: p.id,
    ...rows[p.id],
  }));

  function renderTeam(
    title: string,
    players: StatPlayer[],
    side: "home" | "away",
  ) {
    return (
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-900">{title}</p>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="px-2 py-1.5 font-medium">Player</th>
                <th className="px-1 py-1.5 font-medium">CS</th>
                {NUMERIC_FIELDS.map((f) => (
                  <th
                    key={f.key}
                    className="px-1 py-1.5 text-center font-medium"
                  >
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {players.map((p) => (
                <tr key={p.id}>
                  <td className="px-2 py-1">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "flex h-5 w-7 items-center justify-center rounded text-[10px] font-bold",
                          POSITION_BADGE[p.position],
                        )}
                      >
                        {p.position}
                      </span>
                      <span className="truncate">{p.name}</span>
                    </span>
                  </td>
                  <td className="px-1 py-1 text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={rows[p.id]?.cleanSheet ?? false}
                      onChange={(e) =>
                        setField(p.id, "cleanSheet", e.target.checked)
                      }
                    />
                  </td>
                  {NUMERIC_FIELDS.map((f) => (
                    <td key={f.key} className="px-1 py-1">
                      <Input
                        type="number"
                        min={0}
                        max={f.max}
                        value={String(rows[p.id]?.[f.key] ?? 0)}
                        onChange={(e) =>
                          setField(
                            p.id,
                            f.key,
                            Number(e.target.value) as StatRow[typeof f.key],
                          )
                        }
                        className="h-8 w-14 px-1.5 text-center"
                        aria-label={`${p.name} ${f.label}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td
                    colSpan={NUMERIC_FIELDS.length + 2}
                    className="px-2 py-6 text-center text-xs text-slate-400"
                  >
                    No players for {side} team.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <form action={saveMatchStatsAction} className="space-y-5">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="rows" value={JSON.stringify(payload)} />

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Badge variant="info">CS</Badge> clean sheet
        <Badge variant="neutral">Sv</Badge> saves
        <Badge variant="neutral">PS/PM</Badge> pens saved/missed
        <Badge variant="neutral">YC/RC</Badge> cards
        <Badge variant="neutral">OG</Badge> own goal
        <Badge variant="neutral">B</Badge> bonus
      </div>

      {renderTeam(homeName, homePlayers, "home")}
      {renderTeam(awayName, awayPlayers, "away")}

      <SubmitButton pendingText="Saving stats…">Save match stats</SubmitButton>
    </form>
  );
}
