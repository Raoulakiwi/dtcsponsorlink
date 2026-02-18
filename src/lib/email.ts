import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const ADMIN_EMAIL = "randerson@dobmac.com.au";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Devonport Tennis Club Sponsorship <onboarding@resend.dev>";

export type NewSponsorEmailParams = {
  name: string;
  contactName: string;
  email: string;
  contactNumber: string;
  tierName: string;
  tierPrice: number;
  emailSeparately: boolean;
  socialsImageName: string | null;
  printImageName: string | null;
};

export async function sendNewSponsorNotification(params: NewSponsorEmailParams): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.error("RESEND_API_KEY is not set; skipping new sponsor email.");
    return { ok: false, error: "Email not configured" };
  }
  const assetsText = params.emailSeparately
    ? "Assets will be emailed separately."
    : `Socials image: ${params.socialsImageName ?? "—"}\nPrint image: ${params.printImageName ?? "—"}`;

  const html = `
    <h2>New sponsor added – SponsorLink</h2>
    <p>A new sponsorship has been submitted.</p>
    <ul>
      <li><strong>Name / Company:</strong> ${escapeHtml(params.name)}</li>
      <li><strong>Contact name:</strong> ${escapeHtml(params.contactName)}</li>
      <li><strong>Email:</strong> ${escapeHtml(params.email)}</li>
      <li><strong>Contact number:</strong> ${escapeHtml(params.contactNumber)}</li>
      <li><strong>Tier:</strong> ${escapeHtml(params.tierName)} ($${params.tierPrice})</li>
      <li><strong>Assets:</strong> ${escapeHtml(assetsText)}</li>
    </ul>
    <p>Payment is disabled for now. A Tax Invoice will be sent to the sponsor.</p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: "New sponsor added – SponsorLink",
      html,
    });
    if (error) {
      console.error("Resend error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    console.error("sendNewSponsorNotification:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Failed to send email" };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
