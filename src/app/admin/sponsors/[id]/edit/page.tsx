import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getSponsor } from "@/lib/db";
import { updateSponsorAction } from "@/app/admin/actions";
import { tierOptionsWithCustom } from "@/lib/tiers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { DeleteSponsorButton } from "./delete-sponsor-button";

function toDateInputValue(value: string | Date | null | undefined): string {
  if (value == null) return "";
  try {
    const date = typeof value === "string" ? parseISO(value) : value;
    return isValid(date) ? format(date, "yyyy-MM-dd") : "";
  } catch {
    return "";
  }
}

export default async function EditSponsorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const { id } = await params;
  const sponsor = await getSponsor(id);
  if (!sponsor) notFound();
  const search = await searchParams;

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to dashboard
      </Link>
      <h1 className="font-headline text-2xl font-bold mb-6">Edit sponsor</h1>
      <form action={updateSponsorAction} className="space-y-6" encType="multipart/form-data">
        <input type="hidden" name="id" value={sponsor.id} />
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">Sponsor details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {search.error && (
              <p className="text-sm text-destructive">{search.error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name / Company Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={sponsor.name}
                placeholder="e.g. John Smith or Smith Co."
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                name="contactName"
                defaultValue={sponsor.contact_name}
                placeholder="e.g. Jane Doe"
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={sponsor.email}
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                name="contactNumber"
                defaultValue={sponsor.contact_number}
                placeholder="e.g. 0412 345 678"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">Dates</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Initial sponsorship date and when it is up for renewal.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sponsorshipStartDate">Initial sponsorship date</Label>
              <Input
                id="sponsorshipStartDate"
                name="sponsorshipStartDate"
                type="date"
                defaultValue={toDateInputValue(sponsor.sponsorship_start_date)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="renewalDate">Renewal / anniversary date</Label>
              <Input
                id="renewalDate"
                name="renewalDate"
                type="date"
                defaultValue={toDateInputValue(sponsor.renewal_date)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">Sponsorship tier</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Choose a fixed tier or &quot;Custom amount&quot; (note required).
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tierId">Tier</Label>
              <select
                id="tierId"
                name="tierId"
                required
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                )}
                defaultValue={sponsor.tier_id}
              >
                <option value="">Select a tier</option>
                {tierOptionsWithCustom.map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.id === "custom" ? tier.name : `${tier.name} — $${tier.price}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 p-4">
              <Label htmlFor="customAmount">Custom amount (when &quot;Custom amount&quot; selected)</Label>
              <Input
                id="customAmount"
                name="customAmount"
                type="number"
                min={0}
                step={1}
                placeholder="e.g. 750"
                defaultValue={sponsor.tier_id === "custom" ? sponsor.tier_price : undefined}
              />
              <Label htmlFor="customAmountNote" className="mt-2 block">
                Note <span className="text-destructive">*required for custom amount</span>
              </Label>
              <Textarea
                id="customAmountNote"
                name="customAmountNote"
                placeholder="Document the sponsorship details..."
                rows={3}
                className="resize-y"
                defaultValue={sponsor.custom_amount_note ?? ""}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">Assets (optional)</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Upload images or download existing ones. Max 4 MB per file.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <input type="hidden" name="socialsImageUrl" value={sponsor.socials_image_url ?? ""} />
            <input type="hidden" name="printImageUrl" value={sponsor.print_image_url ?? ""} />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="emailSeparately"
                name="emailSeparately"
                value="on"
                defaultChecked={sponsor.email_separately}
              />
              <Label htmlFor="emailSeparately" className="font-normal">
                Assets will be emailed separately
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="socialsImage">Socials image</Label>
              <div className="flex flex-col gap-2">
                {sponsor.socials_image_url && (
                  <a
                    href={sponsor.socials_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline"
                  >
                    Download current socials image
                  </a>
                )}
                <Input
                  id="socialsImage"
                  name="socialsImage"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.psd,.tiff,image/*"
                />
                <Input
                  id="socialsImageName"
                  name="socialsImageName"
                  defaultValue={sponsor.socials_image_name ?? ""}
                  placeholder="File name or note (optional)"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="printImage">Print-ready image</Label>
              <div className="flex flex-col gap-2">
                {sponsor.print_image_url && (
                  <a
                    href={sponsor.print_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline"
                  >
                    Download current print image
                  </a>
                )}
                <Input
                  id="printImage"
                  name="printImage"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.psd,.tiff,image/*"
                />
                <Input
                  id="printImageName"
                  name="printImageName"
                  defaultValue={sponsor.print_image_name ?? ""}
                  placeholder="File name or note (optional)"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
            Save changes
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin">Cancel</Link>
          </Button>
          <DeleteSponsorButton sponsorId={sponsor.id} isArchived={sponsor.inactive} />
        </div>
        {sponsor.inactive && (
          <p className="mt-4 text-sm text-muted-foreground">
            This sponsor is archived (inactive). They appear in the Archived section on the dashboard.
          </p>
        )}
      </form>
    </div>
  );
}
