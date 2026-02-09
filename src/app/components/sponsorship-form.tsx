"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, Loader2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { sponsorshipTiers } from "@/lib/data";
import { processSponsorship } from "@/app/actions";
import { cn } from "@/lib/utils";
import type { SponsorshipTier } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
  "image/vnd.adobe.photoshop",
  "image/tiff",
];

const formSchema = z
  .object({
    name: z.string().min(2, {
      message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
    contactNumber: z.string().min(1, "Please enter a contact number."),
    tierId: z.string({
      required_error: "You need to select a sponsorship tier.",
    }),
    emailSeparately: z.boolean().default(false),
    socialsImage: z.any(),
    printImage: z.any(),
  })
  .superRefine(({ emailSeparately, socialsImage, printImage }, ctx) => {
    if (emailSeparately) {
      return;
    }

    const validateFile = (
      files: unknown,
      fieldName: "socialsImage" | "printImage"
    ) => {
      const fieldDisplayName =
        fieldName === "socialsImage" ? "Socials image" : "Print-ready image";
      if (!(files instanceof FileList) || files.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${fieldDisplayName} is required.`,
          path: [fieldName],
        });
        return;
      }
      const file = files[0];
      if (file.size <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "File cannot be empty.",
          path: [fieldName],
        });
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Max file size is 10MB.`,
          path: [fieldName],
        });
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
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

export default function SponsorshipForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      contactNumber: "",
      emailSeparately: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("email", values.email);
    formData.append("contactNumber", values.contactNumber);
    formData.append("tierId", values.tierId);
    formData.append("emailSeparately", String(values.emailSeparately));

    if (!values.emailSeparately) {
      formData.append("socialsImage", values.socialsImage[0]);
      formData.append("printImage", values.printImage[0]);
    }

    const result = await processSponsorship(formData);

    if (result.success && result.paypalUrl) {
      toast({
        title: "Submission successful!",
        description: "Redirecting you to PayPal to complete your sponsorship.",
      });
      window.location.href = result.paypalUrl;
    } else {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description:
          result.error || "There was a problem with your submission.",
      });
      setIsSubmitting(false);
    }
  }

  const socialsImageRef = form.register("socialsImage");
  const printImageRef = form.register("printImage");

  const selectedTierId = form.watch("tierId");
  const emailSeparately = form.watch("emailSeparately");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Sponsor Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name / Company Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. John Smith or Smith Co."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="you@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 0412 345 678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Select a Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="tierId"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      {sponsorshipTiers.map((tier) => (
                        <FormItem key={tier.id}>
                          <FormControl>
                            <RadioGroupItem
                              value={tier.id}
                              className="sr-only"
                            />
                          </FormControl>
                          <FormLabel
                            className={cn(
                              "flex flex-col h-full p-6 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50",
                              field.value === tier.id &&
                                "border-primary ring-2 ring-primary"
                            )}
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <h3 className="font-headline text-xl font-semibold">
                                  {tier.name}
                                </h3>
                                <p className="text-2xl font-bold">
                                  ${tier.price}
                                </p>
                              </div>
                              <tier.icon className="w-8 h-8 text-accent" />
                            </div>
                            <ul className="mt-4 space-y-2 text-sm text-foreground/80 flex-grow">
                              {tier.benefits.map((benefit, i) => (
                                <li key={i} className="flex items-start">
                                  <Check className="w-4 h-4 mr-2 mt-0.5 text-accent flex-shrink-0" />
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="space-y-1.5">
                <CardTitle className="font-headline text-2xl">
                  Upload Assets
                </CardTitle>
                <FormDescription>
                  Please provide a logo for social media and a
                  high-resolution version for print.
                </FormDescription>
              </div>
              <FormField
                control={form.control}
                name="emailSeparately"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0 bg-secondary p-3 rounded-md">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="email-separately"
                      />
                    </FormControl>
                    <FormLabel
                      htmlFor="email-separately"
                      className="font-normal whitespace-nowrap"
                    >
                      Email Separately
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="socialsImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo for Socials</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <UploadCloud className="absolute top-1/2 left-4 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="file"
                        className="pl-12"
                        {...socialsImageRef}
                        disabled={emailSeparately}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Square format (PNG, JPG, WebP)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="printImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo for Printing</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <UploadCloud className="absolute top-1/2 left-4 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="file"
                        className="pl-12"
                        {...printImageRef}
                        disabled={emailSeparately}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    High-res vector (PDF, EPS) or image (PSD, TIFF)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={isSubmitting || !selectedTierId}
            aria-label="Submit and proceed to PayPal payment"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Sponsor for $${
                sponsorshipTiers.find((t) => t.id === selectedTierId)?.price ??
                "..."
              }`
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
