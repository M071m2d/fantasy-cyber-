import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { Button, buttonClass } from "@/components/ui/button";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-lg font-black text-white">
            F
          </span>
          <span className="hidden text-sm font-semibold leading-tight text-slate-900 sm:block">
            Local Fantasy
            <span className="block text-xs font-normal text-slate-500">
              Tournament League
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/leaderboard"
            className={buttonClass("ghost", "sm")}
          >
            Leaderboard
          </Link>

          {user ? (
            <>
              <Link href="/dashboard" className={buttonClass("ghost", "sm")}>
                Dashboard
              </Link>
              <Link href="/squad" className={buttonClass("ghost", "sm")}>
                My Squad
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className={buttonClass("ghost", "sm")}>
                  Admin
                </Link>
              )}
              <span className="mx-1 hidden text-xs text-slate-400 md:inline">
                {user.displayName}
              </span>
              <form action={logoutAction}>
                <Button variant="outline" size="sm" type="submit">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClass("ghost", "sm")}>
                Log in
              </Link>
              <Link href="/register" className={buttonClass("primary", "sm")}>
                Play now
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
