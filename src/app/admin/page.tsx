import { redirect } from "next/navigation";
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
import { format } from "date-fns";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const sponsors = await getSponsors();
  return (
    <div>
      <h1 className="font-headline text-2xl font-bold mb-6">Sponsors</h1>
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
                  <TableHead>Submitted</TableHead>
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
                      {format(new Date(s.created_at), "PPp")}
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
