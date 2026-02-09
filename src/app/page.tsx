import SponsorshipForm from "./components/sponsorship-form";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary tracking-tight">
            SponsorLink
          </h1>
          <p className="mt-2 text-lg text-foreground/80">
            Become a valued sponsor of the Devonport Tennis Club
          </p>
        </header>
        <SponsorshipForm />
      </div>
    </main>
  );
}
