import { getSession } from "@/lib/auth";
import { AdminNav } from "./components/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return (
    <div className="min-h-screen bg-background">
      {session && <AdminNav />}
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
