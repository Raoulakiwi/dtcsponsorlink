"use server";

import { z } from "zod";
import { insertSponsor } from "@/lib/db";
import { sendNewSponsorNotification } from "@/lib/email";
import { uploadAsset } from "@/lib/upload";

// This data is intentionally duplicated from lib/data.ts to avoid
// importing client-side 'lucide-react' components into a server action.
const sponsorshipTiers = [
  { id: "naming-rights", name: "Naming Rights", price: 5000 },
  { id: "platinum", name: "Platinum", price: 2000 },
  { id: "gold", name: "Gold", price: 1000 },
  { id: "silver", name: "Silver", price: 500 },
  { id: "bronze", name: "Bronze", price: 300 },
];

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB (same as admin / Vercel Blob limit)
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
  "image/vnd.adobe.photoshop",
  "image/tiff",
];

const sponsorshipSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    contactName: z
      .string()
      .min(2, "Contact name must be at least 2 characters."),
    email: z.string().email("Invalid email address."),
    contactNumber: z.string().min(1, "Please enter a contact number."),
    tierId: z.string().min(1, "Please select a sponsorship tier."),
    emailSeparately: z.preprocess((val) => val === "true", z.boolean()),
    socialsImage: z.any(),
    printImage: z.any(),
  })
  .superRefine(({ emailSeparately, socialsImage, printImage }, ctx) => {
    if (emailSeparately) {
      return;
    }

    const validateFile = (
      file: unknown,
      fieldName: "socialsImage" | "printImage"
    ) => {
      const fieldDisplayName =
        fieldName === "socialsImage" ? "Socials image" : "Print-ready image";

      if (
        !file ||
        typeof file !== "object" ||
        !("size" in file) ||
        (file as { size: number }).size <= 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${fieldDisplayName} is required.`,
          path: [fieldName],
        });
        return;
      }

      const f = file as { size: number; type: string };
      if (f.size > MAX_FILE_SIZE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Max file size is 4 MB.`,
          path: [fieldName],
        });
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(f.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Only .jpg, .jpeg, .png, .webp, .pdf, .psd, and .tiff files are accepted.",
          path: [fieldName],
        });
        return;
      }
    };

    validateFile(socialsImage, "socialsImage");
    validateFile(printImage, "printImage");
  });

export async function processSponsorship(formData: FormData) {
  try {
    const data = {
      name: formData.get("name"),
      contactName: formData.get("contactName"),
      email: formData.get("email"),
      contactNumber: formData.get("contactNumber"),
      tierId: formData.get("tierId"),
      emailSeparately: formData.get("emailSeparately"),
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

    const {
      name,
      contactName,
      email,
      contactNumber,
      tierId,
      emailSeparately,
      socialsImage,
      printImage,
    } = parsed.data;

    const selectedTier = sponsorshipTiers.find((t) => t.id === tierId);
    if (!selectedTier) {
      return { success: false, error: "Invalid tier selected." };
    }

    let socialsImageUrl: string | null = null;
    let printImageUrl: string | null = null;
    let socialsImageName: string | null = emailSeparately ? null : (socialsImage as { name?: string })?.name ?? null;
    let printImageName: string | null = emailSeparately ? null : (printImage as { name?: string })?.name ?? null;

    if (!emailSeparately && socialsImage && printImage) {
      const socialsFile = socialsImage as File;
      const printFile = printImage as File;
      const socialsUp = await uploadAsset(socialsFile, "sponsors/socials");
      if ("error" in socialsUp) {
        return { success: false, error: socialsUp.error };
      }
      socialsImageUrl = socialsUp.url;
      if (!socialsImageName) socialsImageName = socialsFile.name;

      const printUp = await uploadAsset(printFile, "sponsors/print");
      if ("error" in printUp) {
        return { success: false, error: printUp.error };
      }
      printImageUrl = printUp.url;
      if (!printImageName) printImageName = printFile.name;
    }

    const sponsorInsert = await insertSponsor({
      name,
      contactName,
      email,
      contactNumber,
      tierId,
      tierName: selectedTier.name,
      tierPrice: selectedTier.price,
      emailSeparately,
      socialsImageName,
      printImageName,
      socialsImageUrl,
      printImageUrl,
    });
    if (!sponsorInsert.ok) {
      console.error("Failed to save sponsor:", sponsorInsert.error);
    }

    // Notify admin by email (PayPal disabled for now)
    const emailResult = await sendNewSponsorNotification({
      name,
      contactName,
      email,
      contactNumber,
      tierName: selectedTier.name,
      tierPrice: selectedTier.price,
      emailSeparately,
      socialsImageName,
      printImageName,
    });
    if (!emailResult.ok) {
      console.error("Failed to send new-sponsor email:", emailResult.error);
    }

    return { success: true };
  } catch (error) {
    console.error("Error processing sponsorship:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
