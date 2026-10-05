import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  History,
  ImagePlus,
  LayoutDashboard,
  LockKeyhole,
  Moon,
  Package,
  ScanBarcode,
  Settings2,
  Sun,
  UserRound,
  Users,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const guideSteps = [
  {
    title: "Add a customer",
    path: "Customers → Add Customer → Enter information → Save",
    icon: Users,
  },
  {
    title: "Add a product",
    path: "Products Management → Add Product → Enter product information → Save",
    icon: Package,
  },
  {
    title: "Record customer credit",
    path: "Credit Ledger → Add Credit → Select Customer → Add Items → Save",
    icon: CreditCard,
  },
  {
    title: "Record a payment",
    path: "Credit Ledger → Select Customer → Record Payment → Enter Amount → Save",
    icon: CircleDollarSign,
  },
  {
    title: "Check a customer's balance",
    path: "Customers → Select Customer → View Balance",
    icon: CheckCircle2,
  },
  {
    title: "Delete a customer",
    path: "Customers → Select Customer → Check balance is ₱0.00 → Delete",
    icon: LockKeyhole,
  },
];

function Steps({ items }) {
  return (
    <ol className="mt-3 space-y-2 pl-5 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <li key={item} className="pl-1 leading-6">
          <span className="font-medium text-foreground">{index + 1}.</span>{" "}
          {item}
        </li>
      ))}
    </ol>
  );
}

function TopicHeading({ icon: Icon, title, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#6B4226]/10 text-[#6B4226] dark:bg-[#D4A017]/15 dark:text-[#D4A017]">
        <Icon className="size-4" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ManualSection({ value, icon, title, children }) {
  return (
    <AccordionItem value={value} className="border-b last:border-b-0">
      <AccordionTrigger className="px-1 text-left text-base hover:no-underline sm:text-lg">
        <span className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-md bg-muted text-[#6B4226] dark:text-[#D4A017]">
            {(() => {
              const Icon = icon;
              return <Icon className="size-4" />;
            })()}
          </span>
          {title}
        </span>
      </AccordionTrigger>
      <AccordionContent className="space-y-6 px-1 pb-6 text-sm leading-6 text-muted-foreground">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

function SummaryCard({ label, value, icon: Icon, tone = "brown" }) {
  const toneClass =
    tone === "gold"
      ? "bg-[#D4A017]/10 text-[#9A7000] dark:text-[#E6B52A]"
      : "bg-[#6B4226]/10 text-[#6B4226] dark:text-[#D4A017]";

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`rounded-md p-1.5 ${toneClass}`}>
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className="mt-2 font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default function OwnerManual() {
  return (
    <main className="flex flex-1 flex-col gap-7 bg-[#FAFAF9] p-5 md:p-7 dark:bg-background">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#171717] dark:text-foreground md:text-4xl">
          User Manual
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Learn how to manage your customers, products, credits, and payments.
        </p>
      </div>

      <Card className="border-[#6B4226]/20 bg-white shadow-sm dark:border-border dark:bg-card">
        <CardHeader>
          <CardTitle className="text-xl">
            Your store records, together
          </CardTitle>
          <CardDescription className="max-w-3xl leading-6">
            SARI-SARI helps you manage your sari-sari store&apos;s customer
            credit records, products, payments, and balances in one place.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [Users, "Manage customers"],
            [Package, "Manage products"],
            [CreditCard, "Record customer credit"],
            [CircleDollarSign, "Record payments"],
            [CheckCircle2, "Monitor balances"],
            [History, "Review transaction history"],
          ].map(([Icon, label]) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <Icon className="size-4 text-[#D4A017]" />
              <span>{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3">
            <Settings2 className="size-4 text-[#D4A017]" />
            <span>Manage your account settings and theme</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm dark:bg-card">
        <CardHeader>
          <CardTitle>Store Owner Guide</CardTitle>
          <CardDescription>
            Open a topic to see the steps for that part of your store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <ManualSection
              value="dashboard"
              icon={LayoutDashboard}
              title="Owner Dashboard"
            >
              <p>
                The dashboard gives you a quick view of your store&apos;s
                current customers, products, credit, payments, and activity.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  label="Total Customers"
                  value="Your current count"
                  icon={Users}
                />
                <SummaryCard
                  label="Active Products"
                  value="Your active products"
                  icon={Package}
                  tone="gold"
                />
                <SummaryCard
                  label="Total Credit"
                  value="Current credit total"
                  icon={CreditCard}
                />
                <SummaryCard
                  label="Total Payments"
                  value="Recorded payments"
                  icon={CircleDollarSign}
                  tone="gold"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-foreground">
                    What you can review
                  </h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Top customers and their credit balances</li>
                    <li>Product categories and customer status</li>
                    <li>Store activity and summary information</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    How to use the dashboard
                  </h3>
                  <Steps
                    items={[
                      "Log in to your CCLMS account.",
                      "The system opens the Owner Dashboard.",
                      "Review the summary cards and charts.",
                      "Use the sidebar to open Customers, Products Management, Credit Ledger, Transactions History, or your account area.",
                    ]}
                  />
                </div>
              </div>
            </ManualSection>

            <ManualSection
              value="customers"
              icon={Users}
              title="Customer Management"
            >
              <p>
                Manage the customer records belonging to your store and review
                each customer&apos;s credit, payments, and balance.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                <TopicHeading icon={Users} title="Add Customer">
                  <Steps
                    items={[
                      "Open Customers from the sidebar.",
                      "Click Add Customer.",
                      "Enter the customer name, contact information, address, and other available details.",
                      "Review the information, then click Save.",
                    ]}
                  />
                </TopicHeading>
                <TopicHeading icon={UserRound} title="View or Edit Customer">
                  <Steps
                    items={[
                      "Open Customers.",
                      "Select a customer to view their information, credit, payments, and balance.",
                      "To edit, click Edit, update the information, and save the changes.",
                    ]}
                  />
                </TopicHeading>
              </div>
              <TopicHeading icon={LockKeyhole} title="Delete Customer">
                <p className="mt-1">
                  A customer can only be deleted when their outstanding balance
                  is <strong className="text-foreground">₱0.00</strong>.
                </p>
                <Steps
                  items={[
                    "Open Customers and select the customer.",
                    "Check that the balance is ₱0.00.",
                    "Click Delete and confirm the deletion.",
                  ]}
                />
              </TopicHeading>
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Customers with an outstanding balance cannot be deleted.
                </AlertDescription>
              </Alert>
              <div>
                <h3 className="font-semibold text-foreground">
                  Inactive Customers
                </h3>
                <p className="mt-1">
                  An inactive customer remains in the system, cannot receive new
                  credit, and keeps existing transaction and history records
                  available according to the system&apos;s behavior.
                </p>
              </div>
            </ManualSection>

            <ManualSection
              value="products"
              icon={Package}
              title="Product Management"
            >
              <p>
                Manage products sold by your store, including their names,
                prices, product codes, and images.
              </p>
              <TopicHeading icon={Package} title="Add Product">
                <Steps
                  items={[
                    "Open Products Management.",
                    "Click Add Product.",
                    "Enter the product information and add a product image if available.",
                    "Enter the product code or barcode when applicable.",
                    "Save the product.",
                  ]}
                />
              </TopicHeading>
              <TopicHeading
                icon={ImagePlus}
                title="Edit Product or Product Image"
              >
                <Steps
                  items={[
                    "Open Products Management and select a product.",
                    "Click Edit and update the product information.",
                    "Choose a new image to add or update the product image if needed.",
                    "Save the changes.",
                  ]}
                />
              </TopicHeading>
              <TopicHeading icon={ScanBarcode} title="Scan Product Barcode">
                <Steps
                  items={[
                    "Open Products Management.",
                    "Click the barcode scanner button.",
                    "Allow camera access if requested.",
                    "Scan the product barcode.",
                    "Review the scanned information and continue with the product operation.",
                  ]}
                />
              </TopicHeading>
            </ManualSection>

            <ManualSection
              value="credit"
              icon={CreditCard}
              title="Credit Management"
            >
              <p>
                Use Credit Ledger to record a customer&apos;s credit or utang.
                Credit represents the amount currently owed by the customer.
              </p>
              <TopicHeading icon={CreditCard} title="Add Credit">
                <Steps
                  items={[
                    "Open Credit Ledger.",
                    "Click Add Credit.",
                    "Select the customer.",
                    "Add the products or items.",
                    "Enter or review quantities and amounts.",
                    "Review the total amount, then click Save.",
                  ]}
                />
              </TopicHeading>
              <Card className="border-[#D4A017]/30 bg-[#D4A017]/5 dark:bg-[#D4A017]/10">
                <CardContent className="grid gap-2 pt-6 sm:grid-cols-2">
                  <span className="text-sm text-muted-foreground">
                    Instructional example only
                  </span>
                  <span className="font-medium sm:text-right">
                    Customer: Juan Dela Cruz
                  </span>
                  <span className="font-medium sm:text-right">
                    Credit Amount: ₱500.00
                  </span>
                </CardContent>
              </Card>
              <Alert>
                <AlertCircle />
                <AlertTitle>Important rule</AlertTitle>
                <AlertDescription>
                  Inactive customers cannot receive new credit.
                </AlertDescription>
              </Alert>
            </ManualSection>

            <ManualSection
              value="payments"
              icon={CircleDollarSign}
              title="Payment Management"
            >
              <p>
                Payments reduce a customer&apos;s outstanding balance. Payment
                recording is available from the selected customer in Credit
                Ledger.
              </p>
              <TopicHeading icon={CircleDollarSign} title="Record a Payment">
                <Steps
                  items={[
                    "Open Credit Ledger.",
                    "Select the customer.",
                    "Choose the payment action.",
                    "Enter the payment amount and review the information.",
                    "Click Save.",
                  ]}
                />
              </TopicHeading>
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="font-semibold text-foreground">
                  Balance = Total Credit − Total Payments
                </p>
                <p className="mt-2 text-sm">
                  Instructional example only: Previous Balance ₱500.00 − Payment
                  ₱200.00 = Remaining Balance ₱300.00. This is not live system
                  data.
                </p>
              </div>
            </ManualSection>

            <ManualSection
              value="balance"
              icon={CheckCircle2}
              title="Customer Balance"
            >
              <p>To check a customer&apos;s current balance:</p>
              <Steps
                items={[
                  "Open Customers.",
                  "Select a customer.",
                  "Review their credit and payment information.",
                  "Check the current outstanding balance.",
                ]}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryCard
                  label="Total Credit"
                  value="All credit recorded"
                  icon={CreditCard}
                />
                <SummaryCard
                  label="Total Payments"
                  value="All payments recorded"
                  icon={CircleDollarSign}
                  tone="gold"
                />
                <SummaryCard
                  label="Outstanding Balance"
                  value="Credit minus payments"
                  icon={CheckCircle2}
                />
              </div>
            </ManualSection>

            <ManualSection value="history" icon={History} title="History">
              <p>
                Transactions History lets you review credit transactions,
                payment transactions, customer-related transaction information,
                dates, amounts, and relevant details.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-foreground">
                    Why history is useful
                  </h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Track customer activity</li>
                    <li>Verify previous transactions</li>
                    <li>Review payments</li>
                    <li>Monitor credit records</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    What you can do
                  </h3>
                  <p className="mt-2">
                    Open Transactions History from the sidebar, search records,
                    filter by date, and export the filtered transaction list
                    when needed.
                  </p>
                </div>
              </div>
            </ManualSection>

            <ManualSection
              value="profile"
              icon={UserRound}
              title="Owner Profile"
            >
              <p>
                Use the owner account area to view and update the profile
                information supported by CCLMS, including your name, account
                email information, password, and profile picture/avatar when
                available.
              </p>
              <Steps
                items={[
                  "Open your account menu from the Owner layout.",
                  "Select Profile.",
                  "Review or update the available account information.",
                  "Save the changes.",
                ]}
              />
            </ManualSection>

            <ManualSection value="theme" icon={Sun} title="Theme Settings">
              <p>
                Change the appearance of CCLMS from your account area by
                selecting Light Mode or Dark Mode.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <Sun className="size-5 text-[#D4A017]" />
                  <div>
                    <p className="font-medium text-foreground">Light Mode</p>
                    <p className="text-sm text-muted-foreground">
                      A bright interface for daytime work.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <Moon className="size-5 text-[#6B4226] dark:text-[#D4A017]" />
                  <div>
                    <p className="font-medium text-foreground">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">
                      A lower-light interface for evening work.
                    </p>
                  </div>
                </div>
              </div>
              <p className="font-medium text-foreground">
                Your selected theme is saved to your account and does not change
                another user&apos;s theme.
              </p>
            </ManualSection>
          </Accordion>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Important Rules</h2>
          <p className="text-muted-foreground">
            Keep these rules in mind when managing store records.
          </p>
        </div>
        <Alert className="border-[#D4A017]/40 bg-[#D4A017]/5 dark:bg-[#D4A017]/10">
          <AlertCircle className="text-[#9A7000] dark:text-[#E6B52A]" />
          <AlertTitle>Before you save</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Inactive customers cannot receive new credit.</li>
              <li>Customers with an outstanding balance cannot be deleted.</li>
              <li>
                A customer can only be deleted when their balance is ₱0.00.
              </li>
              <li>Record credit and payments for the correct customer.</li>
              <li>
                Always verify the amount before saving a credit or payment.
              </li>
              <li>You can only access data belonging to your own store.</li>
            </ul>
          </AlertDescription>
        </Alert>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quick Guide</h2>
          <p className="text-muted-foreground">Common tasks at a glance.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guideSteps.map(({ title, path, icon: Icon }, index) => (
            <Card key={title} className="bg-white shadow-sm dark:bg-card">
              <CardContent className="flex gap-3 p-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#6B4226] text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-[#D4A017]" />
                    <p className="font-semibold">
                      How do I {title.toLowerCase()}?
                    </p>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {path}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="border-[#6B4226]/20 bg-white shadow-sm dark:border-border dark:bg-card">
        <CardHeader>
          <CardTitle>
            Troubleshooting &amp; Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="delete">
              <AccordionTrigger>
                Why can&apos;t I delete a customer?
              </AccordionTrigger>
              <AccordionContent>
                The customer still has an outstanding balance. Their balance
                must be ₱0.00 before deletion.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="credit">
              <AccordionTrigger>
                Why can&apos;t I add credit to a customer?
              </AccordionTrigger>
              <AccordionContent>
                Check whether the customer is inactive. Inactive customers
                cannot receive new credit.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="balance">
              <AccordionTrigger>
                Why is my balance different from what I expected?
              </AccordionTrigger>
              <AccordionContent>
                Review the customer&apos;s credit and payment history and
                confirm that each amount was recorded for the correct customer.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="login">
              <AccordionTrigger>Why can&apos;t I log in?</AccordionTrigger>
              <AccordionContent>
                Verify your email and password. If the issue continues, contact
                the system administrator.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="theme">
              <AccordionTrigger>
                How do I change dark/light mode?
              </AccordionTrigger>
              <AccordionContent>
                Open the account/settings area and select your preferred theme.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Separator />
      <div className="flex items-start gap-3 pb-2">
        <BookOpen className="mt-0.5 size-5 text-[#6B4226] dark:text-[#D4A017]" />
        <div>
          <h2 className="font-semibold">Need Help?</h2>
          <p className="text-sm text-muted-foreground">
            Contact your system administrator if you experience a problem that
            cannot be resolved using this guide.
          </p>
        </div>
      </div>
    </main>
  );
}
