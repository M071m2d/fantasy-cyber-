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

type Pos = "GK" | "CB" | "ST";

type SeedPlayer = { name: string; position: Pos; price: number };
type SeedTeam = { name: string; group: string; players: SeedPlayer[] };

const TEAMS: SeedTeam[] = [
  {
    name: "OSPF",
    group: "POULE A",
    players: [
      { name: "Oussama Meraihai", position: "CB", price: 15 },
      { name: "Ait Amer Meziane Hocine", position: "ST", price: 5 },
      { name: "Bouzid Haithem", position: "CB", price: 5 },
      { name: "Zaidi Taha Amine", position: "ST", price: 10 },
      { name: "Reffas Chouaib", position: "GK", price: 7 },
      { name: "Boudjella Mohammed Amine", position: "CB", price: 9 },
      { name: "Larbi Ibrahim", position: "ST", price: 20 },
    ],
  },
  {
    name: "ELITE WOLVES",
    group: "POULE A",
    players: [
      { name: "Nessissen Mohamed", position: "CB", price: 10 },
      { name: "Halis Hassen", position: "ST", price: 10 },
      { name: "Hadjar Rezki", position: "ST", price: 12 },
      { name: "Amine Belouis", position: "ST", price: 18 },
      { name: "Fahem Mohamed", position: "GK", price: 15 },
      { name: "Mezdoud Mohammed Rayene", position: "CB", price: 10 },
      { name: "Amine Deradji", position: "CB", price: 8 },
    ],
  },
  {
    name: "Spider-Feet",
    group: "POULE A",
    players: [
      { name: "Saci Mohammed Yasser", position: "ST", price: 7 },
      { name: "Dahak Achraf Abd Madjid", position: "CB", price: 9 },
      { name: "Chenika Merwane", position: "GK", price: 7 },
      { name: "Difallah Anes", position: "CB", price: 7 },
      { name: "Baghdouche Yacer", position: "ST", price: 6 },
      { name: "Boukhares Mohamed Amine", position: "CB", price: 10 },
      { name: "Kherroubi Khaled", position: "ST", price: 9 },
    ],
  },
  {
    name: "Laghbina FC",
    group: "POULE A",
    players: [
      { name: "كابريس محمد لؤي", position: "CB", price: 8 },
      { name: "فتاكة سيد أحمد", position: "ST", price: 10 },
      { name: "بن دادة منصف", position: "ST", price: 12 },
      { name: "أحمد بهاء عمران", position: "CB", price: 7 },
      { name: "سعدي أيوب عبد المجيد", position: "GK", price: 11 },
      { name: "نوس زكرياء", position: "CB", price: 8 },
      { name: "برمجة أمين", position: "CB", price: 10 },
    ],
  },
  {
    name: "Rats Team",
    group: "POULE B",
    players: [
      { name: "Amine", position: "CB", price: 10 },
      { name: "Hassan", position: "ST", price: 9 },
      { name: "Abdou", position: "CB", price: 6 },
      { name: "Achraf", position: "ST", price: 8 },
      { name: "Malek", position: "GK", price: 11 },
      { name: "Ali", position: "CB", price: 11 },
      { name: "Akrem", position: "CB", price: 12 },
    ],
  },
  {
    name: "PVC",
    group: "POULE B",
    players: [
      { name: "Bourouba Younes", position: "GK", price: 11 },
      { name: "Benchaiba Aymen", position: "CB", price: 7 },
      { name: "Laabidi Achref", position: "CB", price: 17 },
      { name: "Skander Ishak", position: "CB", price: 10 },
      { name: "Kebich Anes", position: "CB", price: 8 },
      { name: "Boughedah Amine", position: "ST", price: 12 },
      { name: "Toubi Nizar", position: "ST", price: 15 },
    ],
  },
  {
    name: "Nscs",
    group: "POULE B",
    players: [
      { name: "Abb ou Idris", position: "CB", price: 8 },
      { name: "Saada Houssem", position: "CB", price: 9 },
      { name: "Taha Chaouch Yacine", position: "GK", price: 6 },
      { name: "Hemari Mahdi", position: "ST", price: 9 },
      { name: "Dib Abdelmalak", position: "ST", price: 10 },
      { name: "Akram Zerguine", position: "ST", price: 7 },
      { name: "Bouzira Yacine", position: "CB", price: 10 },
    ],
  },
  {
    name: "Zoro",
    group: "POULE C",
    players: [
      { name: "رمضاني سيف الدين", position: "CB", price: 10 },
      { name: "فراح محمد الأمين", position: "CB", price: 7 },
      { name: "طه البشير", position: "GK", price: 9 },
      { name: "بن بوشريط مروان", position: "ST", price: 6 },
      { name: "أنس حضرون", position: "ST", price: 12 },
      { name: "أوديج إسلام", position: "ST", price: 10 },
      { name: "حجار كمال", position: "ST", price: 12 },
    ],
  },
  {
    name: "FC deddou",
    group: "POULE C",
    players: [
      { name: "Saifi Abdennour", position: "ST", price: 11 },
      { name: "Saadi Moncif", position: "GK", price: 12 },
      { name: "Sadek Fehis", position: "ST", price: 15 },
      { name: "Zaki Raghda", position: "ST", price: 10 },
      { name: "Kahoul Mohamed", position: "CB", price: 14 },
      { name: "Mechir Nour El Islem", position: "CB", price: 13 },
      { name: "Lahacani Mohammed Reda", position: "CB", price: 11 },
    ],
  },
  {
    name: "فريق الرجال",
    group: "POULE C",
    players: [
      { name: "عيساوي عبد الهادي أمين", position: "CB", price: 6 },
      { name: "زرين مصطفى", position: "CB", price: 6 },
      { name: "لحسن فاضل تاج الدين", position: "ST", price: 11 },
      { name: "شرواطي عبد الرحيم", position: "ST", price: 15 },
      { name: "كسول علي", position: "GK", price: 13 },
      { name: "رفافة عبد الإله", position: "ST", price: 12 },
    ],
  },
  {
    name: "FC Rono",
    group: "POULE C",
    players: [
      { name: "Zinedine Ider", position: "GK", price: 10 },
      { name: "Mouhamed Mesaoud", position: "CB", price: 6 },
      { name: "Ayoub B1", position: "CB", price: 7 },
      { name: "Ayoub² B1", position: "ST", price: 15 },
      { name: "Nabil Elaifaoui", position: "ST", price: 14 },
    ],
  },
];

const FIXTURES: [string, string][] = [
  ["OSPF", "ELITE WOLVES"],
  ["Spider-Feet", "Laghbina FC"],
  ["Rats Team", "PVC"],
  ["Zoro", "FC deddou"],
  ["فريق الرجال", "FC Rono"],
];

function assertRoster(team: SeedTeam) {
  const counts: Record<Pos, number> = { GK: 0, CB: 0, ST: 0 };
  for (const p of team.players) counts[p.position] += 1;

  if (team.players.length > 7) {
    throw new Error(`${team.name} has ${team.players.length} players (max 7).`);
  }
  if (counts.GK < 1) throw new Error(`${team.name} needs at least 1 GK.`);
  if (counts.CB < 2) throw new Error(`${team.name} needs at least 2 CB.`);
  if (counts.ST < 2) throw new Error(`${team.name} needs at least 2 ST.`);
}

async function main() {
  await prisma.playerMatchStat.deleteMany();
  await prisma.roundScore.deleteMany();
  await prisma.squadPlayer.deleteMany();
  await prisma.fantasyTeam.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
  await prisma.realTeam.deleteMany();
  await prisma.round.deleteMany();

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

  for (const team of TEAMS) {
    assertRoster(team);
    const realTeam = await prisma.realTeam.create({
      data: { name: team.name, group: team.group },
    });
    await prisma.player.createMany({
      data: team.players.map((p) => ({
        name: p.name,
        position: p.position,
        price: p.price,
        realTeamId: realTeam.id,
        isActive: true,
      })),
    });
  }

  const roundSpecs = [
    { name: "Matchday 1", number: 1, offsetDays: 7, status: "OPEN" as const },
    { name: "Matchday 2", number: 2, offsetDays: 14, status: "UPCOMING" as const },
    { name: "Matchday 3", number: 3, offsetDays: 21, status: "UPCOMING" as const },
  ];

  for (const spec of roundSpecs) {
    const deadline = new Date(Date.now() + spec.offsetDays * 24 * 60 * 60 * 1000);
    await prisma.round.create({
      data: {
        name: spec.name,
        number: spec.number,
        deadline,
        status: spec.status,
      },
    });
  }

  const firstRound = await prisma.round.findUnique({ where: { number: 1 } });
  const realTeams = await prisma.realTeam.findMany();
  const byName = new Map(realTeams.map((t) => [t.name, t]));

  if (firstRound) {
    for (const [home, away] of FIXTURES) {
      const h = byName.get(home);
      const a = byName.get(away);
      if (!h || !a) throw new Error(`Missing fixture team: ${home} vs ${away}`);
      await prisma.match.create({
        data: {
          roundId: firstRound.id,
          homeTeamId: h.id,
          awayTeamId: a.id,
        },
      });
    }
  }

  const [teamCount, playerCount] = await Promise.all([
    prisma.realTeam.count(),
    prisma.player.count(),
  ]);
  console.log(
    `Seed complete: ${teamCount} teams, ${playerCount} players, admin ${adminEmail}`,
  );
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
