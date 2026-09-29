import { Link } from "react-router-dom";
import {
  UserPlus,
  ReceiptText,
  HandCoins,
  LayoutDashboard,
  History,
  Smartphone,
  NotebookPen,
} from "lucide-react";

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

/* ---------- Content (edit here, not in the JSX) ---------- */

const LOGIN_PATH = "/login"; // change to your actual login route

const FEATURES = [
  {
    icon: UserPlus,
    title: "Customer records",
    text: "Add customers with auto-generated IDs.",
  },
  {
    icon: ReceiptText,
    title: "Quick credit recording",
    text: "Add items by product ID code and quantity.",
  },
  {
    icon: HandCoins,
    title: "Partial payments",
    text: "Record bayad any time, and the balance updates automatically.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    text: "See the overall balance, charts, and a ranking of customers by credit.",
  },
  {
    icon: History,
    title: "Transaction history",
    text: "Keep full records you can export.",
  },
];

const STEPS = [
  "Add your products and customers",
  "Record credit and payments as they happen",
  "Check your dashboard for balances and top debtors",
];

const FAQS = [
  {
    q: "What is CCLMS?",
    a: "A web-based tool that helps sari-sari store owners digitally track customer utang (credit) and bayad (payments), replacing manual notebook tracking.",
  },
  {
    q: "Who can use this system?",
    a: "Only registered store owners and system admins. Owner accounts are created by the admin, and customers are recorded in the system but don't log in themselves.",
  },
  {
    q: "Is my store's data secure?",
    a: "Yes. Passwords are protected, and each store owner can only see their own store's data.",
  },
  {
    q: "Can customers pay in parts?",
    a: "Yes. You can record a partial payment at any time, and the customer's balance updates automatically.",
  },
  {
    q: "What if I forget my password?",
    a: "You can reset it using your email and a one-time code (OTP).",
  },
  {
    q: "Does this work on my phone?",
    a: "Yes. It works on phones and desktop browsers, so you can use it right at the counter.",
  },
];

// Illustration only: shows what a ledger looks like. Not real data.
const SAMPLE_LEDGER = [
  { name: "Customer A", note: "3 items", amount: "1,250.00", status: "Unpaid" },
  { name: "Customer B", note: "1 item", amount: "480.00", status: "Partial" },
  { name: "Customer C", note: "6 items", amount: "2,030.00", status: "Unpaid" },
];

/* ---------- Small pieces ---------- */

function LoginButton({ size = "default", className }) {
  return (
    <Button asChild size={size} className={className}>
      <Link to={LOGIN_PATH}>Log In</Link>
    </Button>
  );
}

function LedgerPreview() {
  return (
    <Card className="w-full max-w-md overflow-hidden shadow-lg" aria-hidden="true">
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
          <span className="font-mono text-lg font-bold tabular-nums">₱3,760.00</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Page ---------- */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2 font-bold tracking-tight">
            <img src={logo} alt="SARI-SARI" className="h-16 w-16 text-primary" />
            <a className="text-xl font-bold">SARI-SARI</a>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
            <a href="#about" className="hover:text-foreground">About</a>
            <a href="#faqs" className="hover:text-foreground">FAQs</a>
          </nav>
          <LoginButton />
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
          <div>
            <Badge variant="secondary" className="mb-4">
              Customer Credit Ledger Management System
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Replace your utang notebook with a digital ledger.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              CCLMS replaces the handwritten notebook sari-sari store owners use
              to track customer utang with a simple, web-based ledger. Record
              credit by product code, accept partial payments, and see every
              customer's running balance instantly, right from your phone at the
              counter.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <LoginButton size="lg" />
              <p className="text-sm text-muted-foreground">
                Owner accounts are created by your system admin.
              </p>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <LedgerPreview />
          </div>
        </section>

        <Separator />

        {/* Key features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">Key features</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <Card key={title}>
                <CardHeader className="pb-2">
                  <Icon className="mb-2 h-6 w-6 text-primary" />
                  <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {text}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <p className="pt-2 font-medium">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <Separator />

        {/* About */}
        <section id="about" className="mx-auto max-w-3xl scroll-mt-16 px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">About CCLMS</h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            CCLMS was built to solve a problem sari-sari store owners deal with
            every day: keeping track of who owes what, without relying on a
            notebook that's easy to lose or hard to search. It's designed around
            real small-business needs rather than as a generic demo app.
          </p>
        </section>

        <Separator />

        {/* FAQs */}
        <section id="faqs" className="mx-auto max-w-3xl scroll-mt-16 px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">FAQs</h2>
          <Accordion type="single" collapsible className="mt-6">
            {FAQS.map(({ q, a }, i) => (
              <AccordionItem key={q} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">
                  {i + 1}. {q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Closing CTA */}
        <section className="border-t bg-muted/40">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-14 text-center sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight">
              Ready to put your ledger online?
            </h2>
            <LoginButton size="lg" />
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SARI-SARI. Customer Credit Ledger Management System.
      </footer>
    </div>
  );
}