import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              Local tournament · Season game
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Build your squad.
              <br />
              Beat your friends.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Fantasy football for your local tournament. Pick 7 players on a
              budget, choose your captain each round, and score points from real
              match stats — all tracked on one leaderboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Link href="/dashboard" className={buttonClass("primary", "lg")}>
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link href="/register" className={buttonClass("primary", "lg")}>
                    Create your team
                  </Link>
                  <Link href="/login" className={buttonClass("outline", "lg")}>
                    I already play
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="pitch-surface rounded-2xl p-6 shadow-xl ring-1 ring-black/10">
            <div className="mx-auto grid max-w-sm grid-cols-3 gap-3">
              {["ST", "ST", "ST", "CB", "CB", "CB", "GK"].map(
                (pos, i) => (
                  <div
                    key={i}
                    className="flex aspect-square items-center justify-center rounded-lg bg-white/90 text-xs font-bold text-emerald-800 shadow"
                  >
                    {pos}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-16 sm:grid-cols-3">
          {[
            {
              title: "Pick a legal VII",
              body: "7 players, an 80m budget, and formation rules. Build a squad that actually works.",
            },
            {
              title: "Score every round",
              body: "Goals, assists, clean sheets, saves and bonus points — standard fantasy scoring, calculated automatically.",
            },
            {
              title: "Climb the table",
              body: "Every manager competes on one leaderboard. Watch your rank move after each tournament round.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
