"use server";

import { z } from "zod";
import { sponsorshipTiers } from "@/lib/data";

const sponsorshipSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  tierId: z.string().min(1, "Please select a sponsorship tier."),
  socialsImage: z
    .any()
    .refine((file) => file.size > 0, "Socials image is required."),
  printImage: z
    .any()
    .refine((file) => file.size > 0, "Print image is required."),
});

export async function processSponsorship(formData: FormData) {
  try {
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      tierId: formData.get("tierId"),
      socialsImage: formData.get("socialsImage"),
      printImage: formData.get("printImage"),
    };

    const parsed = sponsorshipSchema.safeParse(data);

    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid form data.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { name, email, tierId, socialsImage, printImage } = parsed.data;

    const selectedTier = sponsorshipTiers.find((t) => t.id === tierId);
    if (!selectedTier) {
      return { success: false, error: "Invalid tier selected." };
    }

    // --- In a real app, you would upload files to a storage service ---
    console.log("--- Mock File Upload ---");
    console.log(
      `Uploading socials image: ${socialsImage.name} (${(
        socialsImage.size / 1024
      ).toFixed(2)} KB)`
    );
    console.log(
      `Uploading print image: ${printImage.name} (${(
        printImage.size / 1024
      ).toFixed(2)} KB)`
    );
    // const socialsImageUrl = await uploadFile(socialsImage);
    // const printImageUrl = await uploadFile(printImage);

    // --- In a real app, you would use an email service (e.g., SendGrid, Resend) ---
    const adminEmail = "randerson@dobmac.com.au";
    console.log("--- Mock Email Notification ---");
    console.log(`Sending sponsorship details to ${adminEmail}`);
    console.log({
      sponsor: {
        name,
        email,
      },
      tier: selectedTier.name,
      price: selectedTier.price,
      // In a real app, these would be URLs to the uploaded files
      imageLinks: {
        socials: `mock_url_for_${socialsImage.name}`,
        print: `mock_url_for_${printImage.name}`,
      },
      paymentStatus: "Pending PayPal payment",
    });

    // --- Construct PayPal URL ---
    const paypalBusinessEmail = encodeURIComponent(adminEmail);
    const itemName = encodeURIComponent(
      `Devonport Tennis Club Sponsorship - ${selectedTier.name}`
    );
    const amount = selectedTier.price.toFixed(2);
    const currency = "AUD";
    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${paypalBusinessEmail}&item_name=${itemName}&amount=${amount}&currency_code=${currency}&no_shipping=1`;

    return { success: true, paypalUrl };
  } catch (error) {
    console.error("Error processing sponsorship:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
