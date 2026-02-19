import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { createSponsor } from "@/app/admin/actions";
import { tierOptionsWithCustom } from "@/lib/tiers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function NewSponsorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const params = await searchParams;

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to dashboard
      </Link>
      <h1 className="font-headline text-2xl font-bold mb-6">Add sponsor</h1>
      <p className="text-muted-foreground mb-6">
        Enter the same details that would be submitted from the public sponsorship form.
      </p>
      <form action={createSponsor} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">Sponsor details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {params.error && (
              <p className="text-sm text-destructive">{params.error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name / Company Name</Label>
              <Input
                id="name"
                name="name"
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
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                name="contactNumber"
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
              Initial sponsorship date and when it is up for renewal (optional).
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sponsorshipStartDate">Initial sponsorship date</Label>
              <Input
                id="sponsorshipStartDate"
                name="sponsorshipStartDate"
                type="date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="renewalDate">Renewal / anniversary date</Label>
              <Input
                id="renewalDate"
                name="renewalDate"
                type="date"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">Sponsorship tier</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Choose a fixed tier or &quot;Custom amount&quot; to enter a manual amount (note required).
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
              />
              <Label htmlFor="customAmountNote" className="mt-2 block">
                Note <span className="text-destructive">*required for custom amount</span>
              </Label>
              <Textarea
                id="customAmountNote"
                name="customAmountNote"
                placeholder="Document the sponsorship details (e.g. in-kind, special arrangement)..."
                rows={3}
                className="resize-y"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">Assets (optional)</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Upload images or tick &quot;Assets will be emailed separately&quot;. Max 4 MB per file.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="emailSeparately" name="emailSeparately" value="on" />
              <Label htmlFor="emailSeparately" className="font-normal">
                Assets will be emailed separately
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="socialsImage">Socials image</Label>
              <Input
                id="socialsImage"
                name="socialsImage"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,.psd,.tiff,image/*"
              />
              <Input
                id="socialsImageName"
                name="socialsImageName"
                placeholder="File name or note (optional)"
                className="mt-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="printImage">Print-ready image</Label>
              <Input
                id="printImage"
                name="printImage"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,.psd,.tiff,image/*"
              />
              <Input
                id="printImageName"
                name="printImageName"
                placeholder="File name or note (optional)"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
            Add sponsor
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
