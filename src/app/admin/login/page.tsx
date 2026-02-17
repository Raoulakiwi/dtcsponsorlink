import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { login } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ passwordChanged?: string; error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/admin");
  const params = await searchParams;
  return (
    <div className="max-w-sm mx-auto mt-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Admin login</CardTitle>
        </CardHeader>
        <CardContent>
          {params.passwordChanged === "1" && (
            <p className="mb-4 text-sm text-green-600 dark:text-green-400">
              Password changed. Please log in with your new password.
            </p>
          )}
          {params.error && (
            <p className="mb-4 text-sm text-destructive">{params.error}</p>
          )}
          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                defaultValue="admin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Log in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
