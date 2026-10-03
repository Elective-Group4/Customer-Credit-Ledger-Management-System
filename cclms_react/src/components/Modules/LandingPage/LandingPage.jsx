import { Link } from "react-router-dom";
import { getIcon, useLandingContent } from "@/lib/landing-content";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import logo from "@/assets/images/logo_sarisari.png";
import StoreLoader from "./StoreLoader";

const LOGIN_PATH = "/login"; // change to your actual login route

// Illustration only: shows what a ledger looks like. Not real data.
const SAMPLE_LEDGER = [
  { name: "Customer A", note: "3 items", amount: "1,250.00", status: "Unpaid" },
  { name: "Customer B", note: "1 item", amount: "480.00", status: "Partial" },
  { name: "Customer C", note: "6 items", amount: "2,030.00", status: "Unpaid" },
];

/* ---------- Small pieces ---------- */

function LoginButton({ label, size = "default", className }) {
  return (
    <Button asChild size={size} className={className}>
      <Link to={LOGIN_PATH}>{label}</Link>
    </Button>
  );
}

function LedgerPreview() {
  return (
    <Card
      className="w-full max-w-md overflow-hidden shadow-lg"
      aria-hidden="true"
    >
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b pb-3">
        <CardTitle className="text-base">Utang ledger</CardTitle>
        <Badge variant="secondary">Sample</Badge>
      </CardHeader>
      {/* red margin line, like a notebook page */}
      <CardContent className="border-l-4 border-destructive/40 p-0">
        {SAMPLE_LEDGER.map((row) => (
          <div
            key={row.name}
            className="flex items-center justify-between gap-4 border-b px-5 py-4"
          >
            <div>
              <p className="font-medium leading-none">{row.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{row.note}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-semibold tabular-nums">
                ₱{row.amount}
              </p>
              <Badge
                variant={row.status === "Partial" ? "default" : "outline"}
                className="mt-1"
              >
                {row.status}
              </Badge>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between bg-muted/50 px-5 py-4">
          <span className="text-sm text-muted-foreground">Overall balance</span>
          <span className="font-mono text-lg font-bold tabular-nums">
            ₱3,760.00
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Page ---------- */

export default function LandingPage() {
  const { content, loading, error } = useLandingContent();

  if (loading) {
    return <StoreLoader />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        Unable to load the landing page content. Please try again later.
      </div>
    );
  }

  const { brand, hero, features, steps, about, faqs, cta, footer } = content;

  return (
    <div className="landing-page min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a
            href="#top"
            className="flex items-center gap-2 font-bold tracking-tight"
          >
            <img
              src={logo}
              alt={brand.name}
              className="h-16 w-16 text-primary"
            />
            <span className="text-xl font-bold">{brand.name}</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-foreground">
              How it works
            </a>
            <a href="#about" className="hover:text-foreground">
              About
            </a>
            <a href="#faqs" className="hover:text-foreground">
              FAQs
            </a>
          </nav>
          <LoginButton label={brand.loginLabel} />
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
          <div>
            <Badge variant="secondary" className="mb-4">
              {hero.badge}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {hero.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              {hero.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <LoginButton label={brand.loginLabel} size="lg" />
              <p className="text-sm text-muted-foreground">{hero.note}</p>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <LedgerPreview />
          </div>
        </section>

        <Separator />

        {/* Key features */}
        <section
          id="features"
          className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16 sm:px-6"
        >
          <h2 className="text-3xl font-bold tracking-tight">
            {features.heading}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.items.map((item) => {
              const Icon = getIcon(item.icon);
              return (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <Icon className="mb-2 h-6 w-6 text-primary" />
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {item.text}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <Separator />

        {/* How it works */}
        <section
          id="how-it-works"
          className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16 sm:px-6"
        >
          <h2 className="text-3xl font-bold tracking-tight">{steps.heading}</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.items.map((step, i) => (
              <li key={step.id} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <p className="pt-2 font-medium">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <Separator />

        {/* About */}
        <section
          id="about"
          className="mx-auto max-w-3xl scroll-mt-16 px-4 py-16 sm:px-6"
        >
          <h2 className="text-3xl font-bold tracking-tight">{about.heading}</h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {about.text}
          </p>
        </section>

        <Separator />

        {/* FAQs */}
        <section
          id="faqs"
          className="mx-auto max-w-3xl scroll-mt-16 px-4 py-16 sm:px-6"
        >
          <h2 className="text-3xl font-bold tracking-tight">{faqs.heading}</h2>
          <Accordion type="single" collapsible className="mt-6">
            {faqs.items.map((faq, i) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="text-left">
                  {i + 1}. {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Closing CTA */}
        <section className="border-t bg-muted/40">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-14 text-center sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight">{cta.heading}</h2>
            <LoginButton label={brand.loginLabel} size="lg" />
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {brand.name}. {footer.text}
      </footer>
    </div>
  );
}
