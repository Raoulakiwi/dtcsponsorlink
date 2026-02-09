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
        <div className="text-center mt-8 text-sm text-foreground/60 max-w-2xl mx-auto">
          <p className="font-semibold">A note on signage:</p>
          <p className="mt-1">
            With our packages, sponsors pay for their own sign. We are happy to arrange for signs to be made on your behalf. The standard size is 1220mm x 500mm.
          </p>
        </div>
      </div>
    </main>
  );
}
