import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { changePassword } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const params = await searchParams;
  return (
    <div className="max-w-sm mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={changePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            {params.error && (
              <p className="text-sm text-destructive">{params.error}</p>
            )}
            <Button type="submit" className="w-full">
              Change password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
