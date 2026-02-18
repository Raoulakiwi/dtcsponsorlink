import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getSponsors } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; updated?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const sponsors = await getSponsors();
  const params = await searchParams;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-headline text-2xl font-bold">Sponsors</h1>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/admin/sponsors/new">
            <Plus className="mr-2 h-4 w-4" />
            Add sponsor
          </Link>
        </Button>
      </div>
      {params.added === "1" && (
        <p className="mb-4 text-sm text-green-600 dark:text-green-400">
          Sponsor added successfully.
        </p>
      )}
      {params.updated === "1" && (
        <p className="mb-4 text-sm text-green-600 dark:text-green-400">
          Sponsor updated successfully.
        </p>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">All submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {sponsors.length === 0 ? (
            <p className="text-muted-foreground">No sponsors yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name / Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Assets</TableHead>
                  <TableHead>Start date</TableHead>
                  <TableHead>Renewal date</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sponsors.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.contact_name}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.contact_number}</TableCell>
                    <TableCell>
                      {s.tier_name} (${s.tier_price})
                    </TableCell>
                    <TableCell>
                      {s.email_separately
                        ? "Emailed separately"
                        : [s.socials_image_name, s.print_image_name].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.sponsorship_start_date
                        ? format(parseISO(s.sponsorship_start_date), "PP")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.renewal_date
                        ? format(parseISO(s.renewal_date), "PP")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild aria-label="Edit sponsor">
                        <Link href={`/admin/sponsors/${s.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
