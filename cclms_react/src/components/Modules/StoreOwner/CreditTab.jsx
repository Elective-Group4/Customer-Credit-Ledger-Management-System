import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Grid2X2, List, Plus, ScanBarcode, Search } from "lucide-react";
import { toast } from "sonner";

import { useOwnerCredits } from "@/hooks/use-owner-credits";
import { ownerApi } from "@/lib/api/owner";
import { creditSchema, paymentSchema } from "@/lib/schemas/owner";
import { DataTable } from "@/components/owner/data-table";
import { BarcodeScannerDialog } from "@/components/Modules/StoreOwner/ProductBarcodeScanner.jsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatBalance(value) {
  return `PHP ${value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function formatDateTime(value, withSeconds = false) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: withSeconds ? "medium" : "short",
  });
}

/**
 * Barcodes can differ only by leading zeros (UPC-A vs EAN-13),
 * so numeric codes are compared without them.
 */
function normalizeCode(code) {
  const value = String(code ?? "").trim();

  return /^\d+$/.test(value) ? value.replace(/^0+/, "") : value.toLowerCase();
}

const creditColumns = [
  { key: "id", header: "ID Code" },
  { key: "customerName", header: "Customer" },
  {
    key: "totalAmount",
    header: "Amount",
    cell: (row) =>
      `PHP ${row.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
  },
  {
    key: "createdAt",
    header: "Date & Time",
    cell: (row) => formatDateTime(row.createdAt),
  },
];

const ledgerColumns = [
  { key: "productName", header: "Product" },
  { key: "quantity", header: "Qty" },
  {
    key: "unitPrice",
    header: "Price",
    cell: (row) => `PHP ${row.unitPrice.toFixed(2)}`,
  },
  {
    key: "subtotal",
    header: "Subtotal",
    cell: (row) => `PHP ${row.subtotal.toFixed(2)}`,
  },
  {
    key: "createdAt",
    header: "Date & Time",
    cell: (row) => formatDateTime(row.createdAt),
  },
];

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/* Live clock shown in the Add Credit dialog */
function LiveTimestamp() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm tabular-nums text-muted-foreground">
      {formatDateTime(now, true)}
    </div>
  );
}

/* Decorative barcode derived from the customer code */
function Barcode({ value }) {
  const bars = Array.from(String(value || "")).flatMap((ch) => {
    const c = ch.charCodeAt(0);
    return [1 + (c % 3), 1 + ((c >> 2) % 2)];
  });
  return (
    <div className="flex h-7 items-stretch gap-[1.5px]" aria-hidden="true">
      {bars.map((w, i) => (
        <span
          key={i}
          className="bg-foreground/70"
          style={{ width: `${w}px` }}
        />
      ))}
    </div>
  );
}

function StatusPill({ status }) {
  const active = status === "active";
  return (
    <span
      className={
        "rounded-sm px-2 py-0.5 text-[11px] font-semibold capitalize " +
        (active
          ? "bg-primary-foreground text-primary"
          : "bg-primary-foreground/20 text-primary-foreground")
      }
    >
      {status}
    </span>
  );
}

function CustomerIdCard({
  customer,
  onSelect,
  onAddCredit,
  addDisabled,
  addDisabledReason,
}) {
  const owes = customer.balance > 0;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* Click to open the customer's pop-up card */}
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
          }
        }}
        className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="flex items-center justify-between bg-[#6B4226] px-4 py-2.5 text-primary-foreground">
          <span className="text-xs font-medium tracking-wide text-primary-foreground/80">
            Customer credit ID
          </span>
          <StatusPill status={customer.status} />
        </div>

        <div className="flex items-center gap-4 p-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted text-xl font-semibold text-foreground ring-1 ring-border">
            {getInitials(customer.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">
              {customer.name}
            </p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {customer.customerCode}
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 border-t border-dashed border-border bg-muted/50 px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">Outstanding balance</p>
            <p
              className={
                "text-xl font-semibold tabular-nums " +
                (owes ? "text-foreground" : "text-muted-foreground")
              }
            >
              {formatBalance(customer.balance)}
            </p>
          </div>
          <Barcode value={customer.customerCode} />
        </div>
      </div>

      {/* Add credit for this customer */}
      <div className="border-t p-3">
        <Button
          type="button"
          className="w-full bg-[#D4A017] text-white hover:bg-[#D4A017]/90"
          disabled={addDisabled}
          title={addDisabled ? addDisabledReason : undefined}
          onClick={onAddCredit}
        >
          <Plus /> Add Credit
        </Button>
      </div>
    </div>
  );
}

/**
 * Details shown inside the pop-up card: credit items table,
 * payment history table (side by side on large screens) and
 * the payment controls.
 */
function CustomerDetails({ customer, entries, payments, saving, onPay }) {
  const [partialAmount, setPartialAmount] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // Ledger rows carry the time the credit was made
  const items = entries.flatMap((entry) =>
    entry.items.map((item) => ({ ...item, createdAt: entry.createdAt })),
  );

  async function handlePay(amount, paymentType) {
    const result = await onPay(customer, amount, paymentType);

    setPaymentError(result.error);

    if (result.ok && paymentType === "partial") {
      setPartialAmount("");
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Credit items */}
        <section className="grid content-start gap-2 lg:col-span-3">
          <h3 className="flex items-center justify-between text-sm font-medium">
            Credit items
            <span className="text-xs font-normal text-muted-foreground">
              {items.length}
            </span>
          </h3>

          <div className="max-h-72 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  {ledgerColumns.map((column) => (
                    <TableHead key={column.key}>{column.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    {ledgerColumns.map((column) => (
                      <TableCell key={column.key}>
                        {column.cell ? column.cell(item) : item[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={ledgerColumns.length}
                      className="h-20 text-center text-muted-foreground"
                    >
                      No credit products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Payment history */}
        <section className="grid content-start gap-2 lg:col-span-2">
          <h3 className="flex items-center justify-between text-sm font-medium">
            Payment history
            <span className="text-xs font-normal text-muted-foreground">
              {payments.length}
            </span>
          </h3>

          <div className="max-h-72 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                    <TableCell className="capitalize">
                      {payment.paymentType}
                    </TableCell>
                    <TableCell>{formatBalance(payment.amount)}</TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-20 text-center text-muted-foreground"
                    >
                      No payments recorded.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      {/* Payment controls */}
      {customer.balance > 0 && (
        <div className="grid gap-3 border-t pt-4 sm:grid-cols-[auto_1fr_auto] sm:items-end">
          <Button
            type="button"
            onClick={() => handlePay(customer.balance, "full")}
            disabled={saving}
          >
            Pay Full
          </Button>

          <div className="grid gap-2">
            <Label htmlFor={`partial-payment-${customer.id}`}>
              Partial payment
            </Label>
            <Input
              id={`partial-payment-${customer.id}`}
              type="number"
              min="0.01"
              step="0.01"
              value={partialAmount}
              onChange={(event) => setPartialAmount(event.target.value)}
              placeholder="Enter amount"
            />
            {paymentError && (
              <p className="text-sm text-destructive">{paymentError}</p>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => handlePay(partialAmount, "partial")}
            disabled={saving}
          >
            Record Payment
          </Button>
        </div>
      )}
    </div>
  );
}

function SummaryStrip({ customers, loading }) {
  const totalOutstanding = customers.reduce((sum, c) => sum + c.balance, 0);
  const withBalance = customers.filter((c) => c.balance > 0).length;
  const active = customers.filter((c) => c.status === "active").length;
  const items = [
    { label: "Total outstanding", value: formatBalance(totalOutstanding) },
    { label: "Customers with balance", value: String(withBalance) },
    { label: "Active customers", value: String(active) },
  ];
  return (
    <div className="grid grid-cols-1 divide-y overflow-hidden rounded-xl border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {items.map((item) => (
        <div key={item.label} className="px-5 py-4">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {loading ? "—" : item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function CreditTab() {
  const { customers, products, credits, payments, loading, error, refresh } =
    useOwnerCredits();
  const [search, setSearch] = useState("");
  const [creditPage, setCreditPage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);
  const [customerView, setCustomerView] = useState("card");
  const [addOpen, setAddOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [saving, setSaving] = useState(false);
  const {
    register,
    control,
    setValue,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(creditSchema),
    defaultValues: { customerId: "", productId: "", quantity: 1, dueDate: "" },
  });
  const selectedProductId = useWatch({ control, name: "productId" });
  const selectedCustomerId = useWatch({ control, name: "customerId" });
  const quantity = useWatch({ control, name: "quantity" });

  const selectedProduct = products.find(
    (product) => product.id === selectedProductId,
  );
  const creditCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId,
  );
  const hasActiveProducts = products.some(
    (product) => product.status === "active",
  );

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.customerCode.toLowerCase().includes(query),
    );
  }, [customers, search]);

  // Latest data for the pop-up (balance changes after payments)
  const currentCustomer = selectedCustomer
    ? customers.find((customer) => customer.id === selectedCustomer.id) ||
      selectedCustomer
    : null;
  const activeCustomers = customers.filter(
    (customer) => customer.status === "active",
  );
  const selectedCreditCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId,
  );

  function getAddCreditBlockReason(customer) {
    if (customer.status !== "active") {
      return "Inactive customers can't receive credit.";
    }

    if (!hasActiveProducts) {
      return "Add an active product first.";
    }

    return "";
  }

  function openAddCredit(customer) {
    reset({
      customerId: customer.id,
      productId: "",
      quantity: 1,
      dueDate: "",
    });

    setAddOpen(true);
  }

  function handleProductScanned(code) {
    setScannerOpen(false);

    const scanned = normalizeCode(code);
    const product = products.find(
      (item) => normalizeCode(item.idCode) === scanned,
    );

    if (!product) {
      toast.error("Product not found", {
        description: `No product has the ID code ${String(code).trim()}.`,
      });
      return;
    }

    if (product.status !== "active") {
      toast.error("Product is inactive", {
        description: `${product.name} can't be added to credit right now.`,
      });
      return;
    }

    // Scanning the same product again adds one more
    if (product.id === selectedProductId) {
      const nextQuantity = Number(quantity || 1) + 1;

      setValue("quantity", nextQuantity, { shouldValidate: true });

      toast.success(`${product.name} × ${nextQuantity}`);
      return;
    }

    setValue("productId", product.id, { shouldValidate: true });

    toast.success("Product selected", { description: product.name });
  }

  async function submitCredit(values) {
    const customer = customers.find((item) => item.id === values.customerId);
    if (customer?.status !== "active") {
      toast.error("Cannot add credit. This customer is inactive.");
      return;
    }

    setSaving(true);
    try {
      // No due date: the entry is stamped with the time it is created
      await ownerApi.createCredit({ ...values, dueDate: "" });
      toast.success("Credit added", {
        description: "The customer balance has been updated.",
      });
      reset();
      setAddOpen(false);
      await refresh();
    } catch (saveError) {
      console.error("Create credit error:", saveError);
      toast.error("Unable to add credit", {
        description: saveError?.message || "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  /**
   * Returns { ok, error }. `error` is a validation message to show
   * under the payment field; API failures are shown as a toast.
   */
  async function recordPayment(customer, amount, paymentType) {
    const parsed = paymentSchema.safeParse({ amount });

    if (!parsed.success) {
      return {
        ok: false,
        error:
          parsed.error.issues[0]?.message || "Enter a valid payment amount.",
      };
    }

    if (parsed.data.amount > customer.balance) {
      return {
        ok: false,
        error: "Payment cannot exceed the outstanding balance.",
      };
    }

    setSaving(true);
    try {
      await ownerApi.createPayment({
        customerId: customer.id,
        amount: parsed.data.amount,
        paymentType,
      });

      toast.success(
        paymentType === "full"
          ? "Balance paid in full"
          : "Partial payment recorded",
      );

      await refresh();

      return { ok: true, error: "" };
    } catch (saveError) {
      console.error("Create payment error:", saveError);
      toast.error("Unable to record payment", {
        description: saveError?.message || "Please try again.",
      });

      return { ok: false, error: "" };
    } finally {
      setSaving(false);
    }
  }

  const customerColumns = [
    { key: "customerCode", header: "ID#" },
    { key: "name", header: "Customer" },
    {
      key: "balance",
      header: "Credit Balance",
      cell: (row) => formatBalance(row.balance),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.status === "active" ? "default" : "secondary"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => {
        const blockReason = getAddCreditBlockReason(row);

        return (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelectedCustomer(row)}
            >
              View
            </Button>

            <Button
              type="button"
              size="sm"
              className="bg-[#D4A017] text-white hover:bg-[#D4A017]/90"
              disabled={Boolean(blockReason)}
              title={blockReason || undefined}
              onClick={() => openAddCredit(row)}
            >
              <Plus /> Add Credit
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 bg-background p-5 md:p-7">
      {/* Page header */}
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Credit Ledger
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track customer credit and record payments.
          </p>
        </div>
        <Button
          className="h-11 px-5 bg-[#D4A017] hover:bg-[#D4A017]/90 text-white"
          onClick={() => setAddOpen(true)}
          disabled={!activeCustomers.length || !products.length}
        >
          <Plus /> Add Credit
        </Button>
      </div>

      <SummaryStrip customers={customers} loading={loading} />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search customer name or ID..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCreditPage(1);
              setCustomerPage(1);
            }}
          />
        </div>
        <div
          className="flex items-center gap-1 rounded-lg border bg-card p-1"
          aria-label="Customer display mode"
        >
          <Button
            className={
              customerView === "card"
                ? "bg-[#6B4226] text-white hover:bg-[#6B4226]/90 hover:text-white"
                : ""
            }
            type="button"
            size="sm"
            variant={customerView === "card" ? "default" : "ghost"}
            aria-pressed={customerView === "card"}
            title="Show customers as cards"
            onClick={() => setCustomerView("card")}
          >
            <Grid2X2 />
            <span className="sr-only">Card view</span>
          </Button>
          <Button
            className={
              customerView === "table"
                ? "bg-[#6B4226] text-white hover:bg-[#6B4226]/90 hover:text-white"
                : ""
            }
            type="button"
            size="sm"
            variant={customerView === "table" ? "default" : "ghost"}
            aria-pressed={customerView === "table"}
            title="Show customers as a table"
            onClick={() => setCustomerView("table")}
          >
            <List />
            <span className="sr-only">Table view</span>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Customers */}
      <section>
        {customerView === "card" ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {loading && (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  Loading customers...
                </CardContent>
              </Card>
            )}
            {!loading && filteredCustomers.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  No customers match this search.
                </CardContent>
              </Card>
            )}
            {!loading &&
              filteredCustomers.map((customer) => {
                const blockReason = getAddCreditBlockReason(customer);

                return (
                  <CustomerIdCard
                    key={customer.id}
                    customer={customer}
                    onSelect={() => setSelectedCustomer(customer)}
                    onAddCredit={() => openAddCredit(customer)}
                    addDisabled={Boolean(blockReason)}
                    addDisabledReason={blockReason}
                  />
                );
              })}
          </div>
        ) : (
          <DataTable
            columns={customerColumns}
            rows={filteredCustomers}
            rowKey={(row) => row.id}
            page={customerPage}
            onPageChange={setCustomerPage}
            loading={loading}
            error={error}
            emptyMessage="No customers match this search."
          />
        )}
      </section>

      {/* Credit entries */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Credit Entries</CardTitle>
          <CardDescription>
            Every credit entry recorded for this store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={creditColumns}
            rows={credits}
            rowKey={(row) => row.id}
            page={creditPage}
            onPageChange={setCreditPage}
            loading={loading}
            error={error}
            emptyMessage="No credit entries yet."
          />
        </CardContent>
      </Card>

      {/* Add credit dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credit</DialogTitle>
            <DialogDescription>
              Record a product purchased on credit for this customer.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleSubmit(submitCredit)}>
            <div className="grid gap-2">
              <Label htmlFor="credit-customer">Customer</Label>
              <Select
                value={selectedCustomerId}
                onValueChange={(value) =>
                  setValue("customerId", value, { shouldValidate: true })
                }
              >
                <SelectTrigger id="credit-customer" className="w-full">
                  <SelectValue placeholder="Choose a customer" />
                </SelectTrigger>
                <SelectContent>
                  {activeCustomers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.customerCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && (
                <p className="text-sm text-destructive">
                  {errors.customerId.message}
                </p>
              )}
            </div>
            {errors.customerId && (
              <p className="text-sm text-destructive">
                {errors.customerId.message}
              </p>
            )}

            {/* Product + scan */}
            <div className="grid gap-2">
              <Label htmlFor="credit-product">Product</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedProductId}
                  onValueChange={(value) =>
                    setValue("productId", value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger id="credit-product" className="flex-1">
                    <SelectValue placeholder="Choose or scan a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter((product) => product.status === "active")
                      .map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({formatBalance(product.price)})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setScannerOpen(true);
                  }}
                >
                  <ScanBarcode />
                  Scan
                </Button>
              </div>
              {errors.productId && (
                <p className="text-sm text-destructive">
                  {errors.productId.message}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="grid gap-2">
              <Label htmlFor="credit-quantity">Quantity</Label>
              <Input
                id="credit-quantity"
                type="number"
                min="1"
                {...register("quantity")}
              />
              {selectedProduct && (
                <p className="text-xs text-muted-foreground">
                  Subtotal:{" "}
                  {formatBalance(selectedProduct.price * Number(quantity || 1))}
                </p>
              )}
              {errors.quantity && (
                <p className="text-sm text-destructive">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            {/* Timestamp */}
            <div className="grid gap-2">
              <Label>Date &amp; time</Label>
              <LiveTimestamp />
              <p className="text-xs text-muted-foreground">
                Recorded automatically when you save.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#D4A017] hover:bg-[#D4A017]/90 text-white"
                type="submit"
                disabled={saving || selectedCreditCustomer?.status !== "active"}
              >
                {saving ? "Saving..." : "Add Credit"}
              </Button>
            </DialogFooter>
          </form>

          {/* Outside the form so its buttons can't submit it */}
          <BarcodeScannerDialog
            open={scannerOpen}
            onOpenChange={setScannerOpen}
            onDetected={handleProductScanned}
          />
        </DialogContent>
      </Dialog>

      {/* Customer pop-up card (wide, so every table fits) */}
      <Dialog
        open={Boolean(selectedCustomer)}
        onOpenChange={(open) => {
          if (!open) setSelectedCustomer(null);
        }}
      >
        <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-xl p-0 sm:max-w-5xl [&>button]:text-white">
          {currentCustomer && (
            <>
              {/* Card header bar */}
              <div className="flex items-center justify-between bg-[#6B4226] py-3 pl-5 pr-14 text-primary-foreground">
                <span className="text-xs font-medium tracking-wide text-primary-foreground/80">
                  Customer credit ID
                </span>
                <StatusPill status={currentCustomer.status} />
              </div>

              {/* Identity */}
              <div className="flex items-center gap-4 p-5">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted text-xl font-semibold text-foreground ring-1 ring-border">
                  {getInitials(currentCustomer.name)}
                </div>
                <div className="min-w-0 text-left">
                  <DialogTitle className="truncate text-lg">
                    {currentCustomer.name}
                  </DialogTitle>
                  <DialogDescription className="font-mono text-xs">
                    {currentCustomer.customerCode}
                  </DialogDescription>
                </div>
              </div>

              {/* Balance strip */}
              <div className="flex items-end justify-between gap-3 border-y border-dashed border-border bg-muted/50 px-5 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Outstanding balance
                  </p>
                  <p
                    className={
                      "text-xl font-semibold tabular-nums " +
                      (currentCustomer.balance > 0
                        ? "text-foreground"
                        : "text-muted-foreground")
                    }
                  >
                    {formatBalance(currentCustomer.balance)}
                  </p>
                </div>
                <Barcode value={currentCustomer.customerCode} />
              </div>

              {/* Tables + payment controls */}
              <div className="p-5">
                <CustomerDetails
                  key={currentCustomer.id}
                  customer={currentCustomer}
                  entries={credits.filter(
                    (entry) => entry.customerId === currentCustomer.id,
                  )}
                  payments={payments.filter(
                    (payment) => payment.customerId === currentCustomer.id,
                  )}
                  saving={saving}
                  onPay={recordPayment}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
