"use server";

import { redirect } from "next/navigation";
import { verifyAdmin, updateAdminPassword, insertSponsor, updateSponsor, setSponsorInactive } from "@/lib/db";
import { tierOptions } from "@/lib/tiers";
import {
  getSession,
  createSessionCookie,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";

export async function login(formData: FormData) {
  try {
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
    if (!cookie) {
      redirect(
        `/admin/login?error=${encodeURIComponent("Server configuration error: ADMIN_SESSION_SECRET is not set (min 16 characters). Add it in Vercel project settings.")}`
      );
    }
    await setSessionCookie(cookie);
    redirect("/admin");
  } catch (e) {
    const err = e as { digest?: string } | null;
    if (err && typeof err === "object" && typeof err.digest === "string" && err.digest.startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    console.error("Admin login error:", e);
    redirect(
      `/admin/login?error=${encodeURIComponent("Login failed. Please try again or check server logs.")}`
    );
  }
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

export async function createSponsor(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const name = (formData.get("name") as string)?.trim();
  const contactName = (formData.get("contactName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const contactNumber = (formData.get("contactNumber") as string)?.trim();
  const tierId = formData.get("tierId") as string;
  const emailSeparately = formData.get("emailSeparately") === "on";
  const socialsImageName = (formData.get("socialsImageName") as string)?.trim() || null;
  const printImageName = (formData.get("printImageName") as string)?.trim() || null;
  const sponsorshipStartDate = (formData.get("sponsorshipStartDate") as string)?.trim() || null;
  const renewalDate = (formData.get("renewalDate") as string)?.trim() || null;
  const customAmountRaw = formData.get("customAmount") as string;
  const customAmountNote = (formData.get("customAmountNote") as string)?.trim() || null;

  if (!name || name.length < 2) {
    redirect(`/admin/sponsors/new?error=${encodeURIComponent("Name must be at least 2 characters.")}`);
  }
  if (!contactName || contactName.length < 2) {
    redirect(`/admin/sponsors/new?error=${encodeURIComponent("Contact name must be at least 2 characters.")}`);
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(`/admin/sponsors/new?error=${encodeURIComponent("Please enter a valid email address.")}`);
  }
  if (!contactNumber?.trim()) {
    redirect(`/admin/sponsors/new?error=${encodeURIComponent("Please enter a contact number.")}`);
  }

  let tierIdFinal: string;
  let tierNameFinal: string;
  let tierPriceFinal: number;
  let customNoteFinal: string | null = null;

  if (tierId === "custom") {
    const amount = customAmountRaw ? Number(customAmountRaw) : NaN;
    if (Number.isNaN(amount) || amount < 0) {
      redirect(`/admin/sponsors/new?error=${encodeURIComponent("Please enter a valid custom amount (0 or more).")}`);
    }
    if (!customAmountNote || customAmountNote.length < 1) {
      redirect(`/admin/sponsors/new?error=${encodeURIComponent("A note is required when using a custom sponsorship amount.")}`);
    }
    tierIdFinal = "custom";
    tierNameFinal = "Custom";
    tierPriceFinal = Math.round(amount);
    customNoteFinal = customAmountNote;
  } else {
    const tier = tierOptions.find((t) => t.id === tierId);
    if (!tier) {
      redirect(`/admin/sponsors/new?error=${encodeURIComponent("Please select a sponsorship tier.")}`);
    }
    tierIdFinal = tier.id;
    tierNameFinal = tier.name;
    tierPriceFinal = tier.price;
  }

  const result = await insertSponsor({
    name,
    contactName,
    email,
    contactNumber: contactNumber.trim(),
    tierId: tierIdFinal,
    tierName: tierNameFinal,
    tierPrice: tierPriceFinal,
    emailSeparately,
    socialsImageName,
    printImageName,
    sponsorshipStartDate,
    renewalDate,
    customAmountNote: customNoteFinal,
  });

  if (!result.ok) {
    redirect(
      `/admin/sponsors/new?error=${encodeURIComponent(result.error ?? "Failed to save sponsor.")}`
    );
  }
  redirect("/admin?added=1");
}

function editErrorRedirect(id: string, error: string) {
  redirect(`/admin/sponsors/${id}/edit?error=${encodeURIComponent(error)}`);
}

export async function updateSponsorAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const id = formData.get("id") as string;
  if (!id) redirect("/admin");

  const name = (formData.get("name") as string)?.trim();
  const contactName = (formData.get("contactName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const contactNumber = (formData.get("contactNumber") as string)?.trim();
  const tierId = formData.get("tierId") as string;
  const emailSeparately = formData.get("emailSeparately") === "on";
  const socialsImageName = (formData.get("socialsImageName") as string)?.trim() || null;
  const printImageName = (formData.get("printImageName") as string)?.trim() || null;
  const sponsorshipStartDate = (formData.get("sponsorshipStartDate") as string)?.trim() || null;
  const renewalDate = (formData.get("renewalDate") as string)?.trim() || null;
  const customAmountRaw = formData.get("customAmount") as string;
  const customAmountNote = (formData.get("customAmountNote") as string)?.trim() || null;

  if (!name || name.length < 2) editErrorRedirect(id, "Name must be at least 2 characters.");
  if (!contactName || contactName.length < 2) editErrorRedirect(id, "Contact name must be at least 2 characters.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) editErrorRedirect(id, "Please enter a valid email address.");
  if (!contactNumber?.trim()) editErrorRedirect(id, "Please enter a contact number.");

  let tierIdFinal: string;
  let tierNameFinal: string;
  let tierPriceFinal: number;
  let customNoteFinal: string | null = null;

  if (tierId === "custom") {
    const amount = customAmountRaw ? Number(customAmountRaw) : NaN;
    if (Number.isNaN(amount) || amount < 0) editErrorRedirect(id, "Please enter a valid custom amount (0 or more).");
    if (!customAmountNote || customAmountNote.length < 1) editErrorRedirect(id, "A note is required when using a custom sponsorship amount.");
    tierIdFinal = "custom";
    tierNameFinal = "Custom";
    tierPriceFinal = Math.round(amount);
    customNoteFinal = customAmountNote;
  } else {
    const tier = tierOptions.find((t) => t.id === tierId);
    if (!tier) editErrorRedirect(id, "Please select a sponsorship tier.");
    tierIdFinal = tier.id;
    tierNameFinal = tier.name;
    tierPriceFinal = tier.price;
  }

  const result = await updateSponsor(id, {
    name,
    contactName,
    email,
    contactNumber: contactNumber.trim(),
    tierId: tierIdFinal,
    tierName: tierNameFinal,
    tierPrice: tierPriceFinal,
    emailSeparately,
    socialsImageName,
    printImageName,
    sponsorshipStartDate,
    renewalDate,
    customAmountNote: customNoteFinal,
  });

  if (!result.ok) {
    editErrorRedirect(id, result.error ?? "Failed to save changes.");
  }
  redirect("/admin?updated=1");
}

export async function deleteSponsorAction(id: string) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!id) redirect("/admin");
  const result = await setSponsorInactive(id);
  if (!result.ok) {
    redirect(`/admin/sponsors/${id}/edit?error=${encodeURIComponent(result.error ?? "Failed to delete.")}`);
  }
  redirect("/admin?deleted=1");
}
