import Link from "next/link";
import { logout } from "../actions";

export function AdminNav() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/admin" className="font-headline text-xl font-semibold text-primary">
          SponsorLink Admin
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/admin" className="text-sm text-foreground/80 hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/admin/change-password" className="text-sm text-foreground/80 hover:text-foreground">
            Change password
          </Link>
          <form action={logout}>
            <button type="submit" className="text-sm text-foreground/80 hover:text-foreground">
              Log out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
