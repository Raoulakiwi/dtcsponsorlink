"use server";

import { redirect } from "next/navigation";
import { verifyAdmin, updateAdminPassword } from "@/lib/db";
import {
  getSession,
  createSessionCookie,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";

export async function login(formData: FormData) {
  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;
  if (!username || !password) {
    redirect(`/admin/login?error=${encodeURIComponent("Username and password are required.")}`);
  }
  const valid = await verifyAdmin(username, password);
  if (!valid) {
    redirect(`/admin/login?error=${encodeURIComponent("Invalid username or password.")}`);
  }
  const cookie = createSessionCookie(username);
  await setSessionCookie(cookie);
  redirect("/admin");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/admin/login");
}

function redirectWithError(error: string) {
  redirect(`/admin/change-password?error=${encodeURIComponent(error)}`);
}

export async function changePassword(formData: FormData) {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  if (!currentPassword || !newPassword || !confirmPassword) {
    redirectWithError("All fields are required.");
  }
  if (newPassword.length < 8) {
    redirectWithError("New password must be at least 8 characters.");
  }
  if (newPassword !== confirmPassword) {
    redirectWithError("New password and confirmation do not match.");
  }
  const valid = await verifyAdmin(session.username, currentPassword);
  if (!valid) {
    redirectWithError("Current password is incorrect.");
  }
  const result = await updateAdminPassword(session.username, newPassword);
  if (!result.ok) {
    redirectWithError(result.error ?? "Failed to update password.");
  }
  await clearSessionCookie();
  redirect("/admin/login?passwordChanged=1");
}
