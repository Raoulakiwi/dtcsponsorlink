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
import { format, parseISO, isValid, startOfDay } from "date-fns";
import type { Sponsor } from "@/lib/db";
import { AssetCell } from "./asset-cell";

function formatDateSafe(value: string | Date | null | undefined): string {
  if (value == null) return "—";
  try {
    const date = typeof value === "string" ? parseISO(value) : value;
    return isValid(date) ? format(date, "PP") : "—";
  } catch {
    return "—";
  }
}

function isArchived(s: Sponsor): boolean {
  if (s.inactive) return true;
  if (!s.renewal_date) return false;
  try {
    const renewal = typeof s.renewal_date === "string" ? parseISO(s.renewal_date) : s.renewal_date;
    return isValid(renewal) && startOfDay(renewal) < startOfDay(new Date());
  } catch {
    return false;
  }
}

function SponsorTable({ sponsors }: { sponsors: Sponsor[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name / Company</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Tier</TableHead>
          <TableHead>Note</TableHead>
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
            <TableCell className="max-w-[200px] truncate text-muted-foreground" title={s.custom_amount_note ?? undefined}>
              {s.custom_amount_note ?? "—"}
            </TableCell>
            <TableCell>
              <AssetCell
                socialsImageUrl={s.socials_image_url}
                printImageUrl={s.print_image_url}
                emailSeparately={s.email_separately}
                socialsImageName={s.socials_image_name}
                printImageName={s.print_image_name}
              />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateSafe(s.sponsorship_start_date)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateSafe(s.renewal_date)}
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
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; updated?: string; deleted?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const sponsors = await getSponsors();
  const params = await searchParams;
  const activeSponsors = sponsors.filter((s) => !isArchived(s));
  const archivedSponsors = sponsors.filter((s) => isArchived(s));

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
      {params.deleted === "1" && (
        <p className="mb-4 text-sm text-green-600 dark:text-green-400">
          Sponsor moved to archived.
        </p>
      )}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="font-headline text-lg">Active sponsors</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Not inactive and renewal date in the future or not set.
          </p>
        </CardHeader>
        <CardContent>
          {activeSponsors.length === 0 ? (
            <p className="text-muted-foreground">No active sponsors.</p>
          ) : (
            <SponsorTable sponsors={activeSponsors} />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">Archived</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Manually deleted (inactive) or renewal date in the past.
          </p>
        </CardHeader>
        <CardContent>
          {archivedSponsors.length === 0 ? (
            <p className="text-muted-foreground">No archived sponsors.</p>
          ) : (
            <SponsorTable sponsors={archivedSponsors} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
