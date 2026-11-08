import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/players", label: "Teams & Players" },
  { href: "/admin/rounds", label: "Rounds & Fixtures" },
  { href: "/admin/stats", label: "Match Stats" },
  { href: "/admin/scoring", label: "Scoring" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
        <p className="text-sm text-slate-600">
          Manage the tournament, enter match stats and calculate scores.
        </p>
      </div>
      <nav className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
