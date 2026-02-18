import { neon } from "@neondatabase/serverless";
import { hash } from "bcryptjs";

// Support both DATABASE_URL and POSTGRES_URL (Vercel/Neon templates use POSTGRES_URL)
const connectionString =
  process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? null;
const sql = connectionString ? neon(connectionString) : null;

export type Sponsor = {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  contact_number: string;
  tier_id: string;
  tier_name: string;
  tier_price: number;
  email_separately: boolean;
  socials_image_name: string | null;
  print_image_name: string | null;
  sponsorship_start_date: string | null;
  renewal_date: string | null;
  custom_amount_note: string | null;
  created_at: Date;
};

const DEFAULT_ADMIN_PASSWORD = "DTC@dmin";

export async function ensureSchema() {
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS sponsors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      contact_number TEXT NOT NULL,
      tier_id TEXT NOT NULL,
      tier_name TEXT NOT NULL,
      tier_price INTEGER NOT NULL,
      email_separately BOOLEAN NOT NULL DEFAULT false,
      socials_image_name TEXT,
      print_image_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  const existing = await sql`SELECT 1 FROM admin_users WHERE username = 'admin' LIMIT 1`;
  if (existing.length === 0) {
    const passwordHash = await hash(DEFAULT_ADMIN_PASSWORD, 10);
    await sql`INSERT INTO admin_users (username, password_hash) VALUES ('admin', ${passwordHash})`;
  }
  try {
    await sql`ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS sponsorship_start_date DATE`;
    await sql`ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS renewal_date DATE`;
    await sql`ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS custom_amount_note TEXT`;
  } catch (_) {
    // Columns may already exist
  }
}

export async function insertSponsor(data: {
  name: string;
  contactName: string;
  email: string;
  contactNumber: string;
  tierId: string;
  tierName: string;
  tierPrice: number;
  emailSeparately: boolean;
  socialsImageName?: string | null;
  printImageName?: string | null;
  sponsorshipStartDate?: string | null;
  renewalDate?: string | null;
  customAmountNote?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!sql) return { ok: false, error: "Database not configured" };
  try {
    await ensureSchema();
    await sql`
      INSERT INTO sponsors (
        name, contact_name, email, contact_number,
        tier_id, tier_name, tier_price, email_separately,
        socials_image_name, print_image_name,
        sponsorship_start_date, renewal_date, custom_amount_note
      ) VALUES (
        ${data.name}, ${data.contactName}, ${data.email}, ${data.contactNumber},
        ${data.tierId}, ${data.tierName}, ${data.tierPrice}, ${data.emailSeparately},
        ${data.socialsImageName ?? null}, ${data.printImageName ?? null},
        ${data.sponsorshipStartDate || null}, ${data.renewalDate || null},
        ${data.customAmountNote ?? null}
      )
    `;
    return { ok: true };
  } catch (e) {
    console.error("insertSponsor:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Database error" };
  }
}

export async function getSponsors(): Promise<Sponsor[]> {
  if (!sql) return [];
  try {
    await ensureSchema();
    const rows = await sql`
      SELECT id, name, contact_name, email, contact_number,
             tier_id, tier_name, tier_price, email_separately,
             socials_image_name, print_image_name,
             sponsorship_start_date, renewal_date, custom_amount_note, created_at
      FROM sponsors
      ORDER BY created_at DESC
    `;
    return (rows as Record<string, unknown>[]).map((r) => ({
      ...r,
      custom_amount_note: r.custom_amount_note ?? null,
      sponsorship_start_date: r.sponsorship_start_date ?? null,
      renewal_date: r.renewal_date ?? null,
    })) as Sponsor[];
  } catch (e) {
    console.error("getSponsors:", e);
    return [];
  }
}

export async function getSponsor(id: string): Promise<Sponsor | null> {
  if (!sql) return null;
  try {
    await ensureSchema();
    const rows = await sql`
      SELECT id, name, contact_name, email, contact_number,
             tier_id, tier_name, tier_price, email_separately,
             socials_image_name, print_image_name,
             sponsorship_start_date, renewal_date, custom_amount_note, created_at
      FROM sponsors
      WHERE id = ${id}
      LIMIT 1
    `;
    return (rows[0] as Sponsor) ?? null;
  } catch (e) {
    console.error("getSponsor:", e);
    return null;
  }
}

export async function updateSponsor(
  id: string,
  data: {
    name: string;
    contactName: string;
    email: string;
    contactNumber: string;
    tierId: string;
    tierName: string;
    tierPrice: number;
    emailSeparately: boolean;
    socialsImageName?: string | null;
    printImageName?: string | null;
    sponsorshipStartDate?: string | null;
    renewalDate?: string | null;
    customAmountNote?: string | null;
  }
): Promise<{ ok: boolean; error?: string }> {
  if (!sql) return { ok: false, error: "Database not configured" };
  try {
    await ensureSchema();
    await sql`
      UPDATE sponsors SET
        name = ${data.name},
        contact_name = ${data.contactName},
        email = ${data.email},
        contact_number = ${data.contactNumber},
        tier_id = ${data.tierId},
        tier_name = ${data.tierName},
        tier_price = ${data.tierPrice},
        email_separately = ${data.emailSeparately},
        socials_image_name = ${data.socialsImageName ?? null},
        print_image_name = ${data.printImageName ?? null},
        sponsorship_start_date = ${data.sponsorshipStartDate || null},
        renewal_date = ${data.renewalDate || null},
        custom_amount_note = ${data.customAmountNote ?? null}
      WHERE id = ${id}
    `;
    return { ok: true };
  } catch (e) {
    console.error("updateSponsor:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Database error" };
  }
}

export async function verifyAdmin(username: string, password: string): Promise<boolean> {
  if (!sql) return false;
  try {
    await ensureSchema();
    const rows = await sql`SELECT password_hash FROM admin_users WHERE username = ${username} LIMIT 1`;
    if (rows.length === 0) return false;
    const { compare } = await import("bcryptjs");
    return compare(password, (rows[0] as { password_hash: string }).password_hash);
  } catch (e) {
    console.error("verifyAdmin:", e);
    return false;
  }
}

export async function updateAdminPassword(username: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  if (!sql) return { ok: false, error: "Database not configured" };
  try {
    await ensureSchema();
    const passwordHash = await hash(newPassword, 10);
    await sql`UPDATE admin_users SET password_hash = ${passwordHash} WHERE username = ${username}`;
    return { ok: true };
  } catch (e) {
    console.error("updateAdminPassword:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Database error" };
  }
}
