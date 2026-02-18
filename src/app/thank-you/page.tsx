import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function ThankYouPage() {
  return (
    <main className="min-h-screen w-full bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl mx-auto text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-6" aria-hidden />
        <h1 className="font-headline text-3xl sm:text-4xl font-bold text-primary tracking-tight">
          Thank you
        </h1>
        <p className="mt-4 text-lg text-foreground/90">
          Your information has been received.
        </p>
        <p className="mt-2 text-foreground/80">
          You will receive a Tax Invoice soon for your sponsorship of the Devonport Tennis Club.
        </p>
        <Button asChild variant="outline" className="mt-8">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
