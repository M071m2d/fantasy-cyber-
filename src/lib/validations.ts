import { z } from "zod";

export const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(32, "Display name must be at most 32 characters"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const playerPositions = ["GK", "CB", "ST"] as const;

export const squadPickSchema = z.object({
  playerId: z.string().min(1),
  isStarting: z.boolean(),
  isCaptain: z.boolean(),
  isVice: z.boolean(),
  benchOrder: z.number().int().min(0).max(7),
});

export const saveSquadSchema = z.object({
  teamName: z.string().trim().min(2).max(40),
  picks: z.array(squadPickSchema).length(7),
});

export const realTeamSchema = z.object({
  name: z.string().trim().min(2).max(60),
  group: z.string().trim().min(1).max(30),
});

export const playerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  position: z.enum(playerPositions),
  price: z.coerce.number().min(3.5).max(20),
  realTeamId: z.string().min(1),
  isActive: z.coerce.boolean().default(true),
});

export const roundSchema = z.object({
  name: z.string().trim().min(2).max(60),
  number: z.coerce.number().int().min(1),
  deadline: z.coerce.date(),
});

export const matchSchema = z.object({
  roundId: z.string().min(1),
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
});

export const statEntrySchema = z.object({
  matchId: z.string().min(1),
  playerId: z.string().min(1),
  minutes: z.coerce.number().int().min(0).max(120).default(0),
  goals: z.coerce.number().int().min(0).max(20).default(0),
  assists: z.coerce.number().int().min(0).max(20).default(0),
  cleanSheet: z.coerce.boolean().default(false),
  saves: z.coerce.number().int().min(0).max(30).default(0),
  penaltiesSaved: z.coerce.number().int().min(0).max(5).default(0),
  penaltiesMissed: z.coerce.number().int().min(0).max(5).default(0),
  yellowCards: z.coerce.number().int().min(0).max(2).default(0),
  redCards: z.coerce.number().int().min(0).max(1).default(0),
  ownGoals: z.coerce.number().int().min(0).max(5).default(0),
  bonus: z.coerce.number().int().min(0).max(3).default(0),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SaveSquadInput = z.infer<typeof saveSquadSchema>;
export type StatEntryInput = z.infer<typeof statEntrySchema>;
