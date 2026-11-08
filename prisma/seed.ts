import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/fantasy_local?schema=public",
});

const prisma = new PrismaClient({ adapter });

const FIRST = [
  "Alex", "Sam", "Jordan", "Chris", "Daniel", "Marco", "Liam", "Noah",
  "Adam", "Yusuf", "Omar", "Karim", "Leo", "Mateo", "Ethan", "Owen",
  "Ryan", "Kai", "Diego", "Andre", "Tariq", "Bilal", "Hugo", "Felix",
  "Ivan", "Milan", "Sergio", "Bruno",
];
const LAST = [
  "Silva", "Costa", "Haddad", "Mensah", "Novak", "Rossi", "Khan", "Bauer",
  "Lopez", "Dubois", "Okafor", "Kim", "Tanaka", "Ali", "Brown", "Fischer",
  "Moreau", "Santos", "Petrov", "Kowalski", "Reyes", "Bakker", "Hansen",
  "Mbiya", "Farah", "Ibrahim", "Adeyemi", "Torres",
];

const TEAMS = [
  { name: "Riverside United", group: "Group A" },
  { name: "Northside Athletic", group: "Group A" },
  { name: "Falcons FC", group: "Group A" },
  { name: "Eastview Rovers", group: "Group B" },
  { name: "Hillcrest City", group: "Group B" },
  { name: "Lakeside FC", group: "Group B" },
  { name: "Westgate Warriors", group: "Group C" },
  { name: "Central Sporting", group: "Group C" },
];

type Pos = "GK" | "DEF" | "MID" | "FWD";

const ROSTER: Pos[] = [
  "GK", "GK", "DEF", "DEF", "DEF", "MID", "MID", "MID", "FWD", "FWD",
];

function priceFor(pos: Pos, index: number): number {
  const base: Record<Pos, number> = { GK: 4.0, DEF: 4.0, MID: 4.5, FWD: 5.0 };
  const step = 0.5;
  const price = base[pos] + (index % 8) * step;
  return Math.round(price * 10) / 10;
}

async function main() {
  const adminEmail = "admin@local.test";
  const adminPassword = "admin1234";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      displayName: "League Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  let nameCounter = 0;
  for (const team of TEAMS) {
    const realTeam = await prisma.realTeam.upsert({
      where: { name: team.name },
      update: { group: team.group },
      create: team,
    });

    const existing = await prisma.player.count({
      where: { realTeamId: realTeam.id },
    });
    if (existing > 0) continue;

    const data = ROSTER.map((pos, i) => {
      const first = FIRST[nameCounter % FIRST.length];
      const last = LAST[(nameCounter * 3 + i) % LAST.length];
      nameCounter += 1;
      return {
        name: `${first} ${last}`,
        position: pos,
        price: priceFor(pos, i),
        realTeamId: realTeam.id,
      };
    });

    await prisma.player.createMany({ data });
  }

  const roundSpecs = [
    { name: "Matchday 1", number: 1, offsetDays: 7, status: "OPEN" as const },
    { name: "Matchday 2", number: 2, offsetDays: 14, status: "UPCOMING" as const },
    { name: "Matchday 3", number: 3, offsetDays: 21, status: "UPCOMING" as const },
  ];

  for (const spec of roundSpecs) {
    const deadline = new Date(Date.now() + spec.offsetDays * 24 * 60 * 60 * 1000);
    await prisma.round.upsert({
      where: { number: spec.number },
      update: {},
      create: {
        name: spec.name,
        number: spec.number,
        deadline,
        status: spec.status,
      },
    });
  }

  const firstRound = await prisma.round.findUnique({ where: { number: 1 } });
  const allTeams = await prisma.realTeam.findMany({ orderBy: { name: "asc" } });

  if (firstRound && (await prisma.match.count({ where: { roundId: firstRound.id } })) === 0) {
    const pairs: [number, number][] = [
      [0, 1],
      [2, 3],
      [4, 5],
      [6, 7],
    ];
    for (const [h, a] of pairs) {
      if (allTeams[h] && allTeams[a]) {
        await prisma.match.create({
          data: {
            roundId: firstRound.id,
            homeTeamId: allTeams[h].id,
            awayTeamId: allTeams[a].id,
          },
        });
      }
    }
  }

  const playerCount = await prisma.player.count();
  console.log(`Seed complete: ${playerCount} players, admin ${adminEmail}`);
  console.log(`Admin password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
