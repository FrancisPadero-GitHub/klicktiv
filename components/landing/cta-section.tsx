import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-foreground px-8 py-16 text-center">
          {/* Background accent */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute bottom-0 left-1/2 h-100 w-175 -translate-x-1/2 rounded-full bg-secondary opacity-30 blur-3xl" />
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Let&apos;s Talk
          </p>
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-background sm:text-4xl">
            Ready to solve your business problems? We are here to help.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Tell us what is slowing your business down and we will build a
            custom solution that works exactly the way you need it to.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="https://advancedvirtualstaff.com/booking"
              className="inline-flex items-center gap-2 rounded-xl bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a consultation
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-background ring-1 ring-border transition-all hover:bg-secondary/20"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
