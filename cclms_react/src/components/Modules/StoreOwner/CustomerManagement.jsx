import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useOwnerCustomers } from "@/hooks/use-owner-customers";
import { ownerApi } from "@/lib/api/owner";
import { customerSchema } from "@/lib/schemas/owner";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/owner/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

import { Controller, useForm } from "react-hook-form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const phoneNumberPattern = /^\+63 9\d{9}$/;

function formatPhoneNumber(value = "") {
  const digits = value.replace(/\D/g, "");

  if (/^09\d{9}$/.test(digits)) {
    return `+63 ${digits.slice(1)}`;
  }

  if (/^639\d{9}$/.test(digits)) {
    return `+63 ${digits.slice(2)}`;
  }

  return value.trim();
}

function getLocalDigits(value = "") {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("63")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  digits = digits.slice(0, 10);

  // Philippine mobile numbers always start with 9
  if (digits && digits[0] !== "9") return "";

  return digits;
}

export default function CustomerManagement() {
  const { customers, loading, error, refresh } = useOwnerCustomers();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const {
    register,
    reset,
    control,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerCode: "",
      name: "",
      phoneNumber: "",
      address: "",
      status: "active",
    },
  });
  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(
      (customer) =>
        customer.customerCode.toLowerCase().includes(query) ||
        customer.name.toLowerCase().includes(query) ||
        customer.address.toLowerCase().includes(query),
    );
  }, [customers, search]);

  function openAddDialog() {
    setEditingCustomer(null);

    reset({
      customerCode: "",
      name: "",
      phoneNumber: "",
      address: "",
      status: "active",
    });

    setDialogOpen(true);
  }

  function openEditDialog(customer) {
    setEditingCustomer(customer);
    reset({
      customerCode: customer.customerCode,
      name: customer.name,
      phoneNumber: formatPhoneNumber(customer.phoneNumber),
      address: customer.address,
      status: customer.status || "active",
    });
    setDialogOpen(true);
  }

  async function submitCustomer(values) {
    // Phone number: format first, then validate (Philippine mobile only)
    const phoneNumber = formatPhoneNumber(values.phoneNumber);

    if (!phoneNumberPattern.test(phoneNumber)) {
      setError("phoneNumber", {
        type: "manual",
        message: "Enter a valid 10-digit mobile number starting with 9.",
      });
      return;
    }

    const customerValues = { ...values, phoneNumber };

    setSaving(true);
    try {
      if (editingCustomer) {
        await ownerApi.updateCustomer(editingCustomer.id, customerValues);
        toast.success("Customer updated");
      } else {
        await ownerApi.createCustomer(customerValues);
        toast.success("Customer added");
      }
      setDialogOpen(false);
      await refresh();
    } catch (saveError) {
      toast.error(
        editingCustomer
          ? "Unable to update customer"
          : "Unable to add customer",
        {
          description:
            saveError instanceof Error
              ? saveError.message
              : "Please try again.",
        },
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer() {
    if (!customerToDelete) return;
    setSaving(true);
    try {
      await ownerApi.deleteCustomer(customerToDelete.id);
      toast.success("Customer deleted");
      setDeleteOpen(false);
      setCustomerToDelete(null);
      await refresh();
    } catch (deleteError) {
      toast.error("Unable to delete customer", {
        description:
          deleteError instanceof Error
            ? deleteError.message
            : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: "customerCode", header: "ID#" },
    { key: "name", header: "Name" },
    { key: "phoneNumber", header: "Phone Number" },
    { key: "address", header: "Address" },
    {
      key: "balance",
      header: "Current Balance",
      cell: (row) =>
        `PHP ${Number(row.balance || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge
          className={
            row.status === "active"
              ? "bg-green-400/70"
              : "bg-muted text-muted-foreground"
          }
          variant={row.status === "active" ? "default" : "secondary"}
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (row) =>
        row.createdAt
          ? new Date(row.createdAt).toLocaleDateString("en-PH")
          : "-",
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            title={`Edit ${row.name}`}
            onClick={() => openEditDialog(row)}
          >
            <Pencil />
          </Button>
          <Button
            className="bg-red-400 text-white hover:bg-red-600"
            variant="ghost"
            size="icon"
            title={`Delete ${row.name}`}
            onClick={() => {
              setCustomerToDelete(row);
              setDeleteOpen(true);
            }}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <main className="flex flex-1 flex-col gap-7 bg-[#FAFAF9] p-5 md:p-7 dark:bg-background">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717] dark:text-foreground md:text-4xl">
            Customer Management
          </h1>
          <p className="text-muted-foreground">
            Manage the customers connected to your credit ledger.
          </p>
        </div>
        <Button
          className="bg-[#D4A017] text-white hover:bg-[#713D24] h-12"
          onClick={openAddDialog}
        >
          <Plus /> Add New Customer
        </Button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search ID, name, or address..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>
      <Card className="border-stone-200 bg-white shadow-sm dark:border-border dark:bg-card">
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>
            {filteredCustomers.length} customer
            {filteredCustomers.length === 1 ? "" : "s"} found.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={filteredCustomers}
            rowKey={(row) => row.id}
            page={page}
            onPageChange={setPage}
            loading={loading}
            error={error}
            emptyMessage="No customers found."
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? "Update the customer contact details."
                : "The database will generate the final customer ID when saved."}
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleSubmit(submitCustomer)}>
            <div className="grid gap-2">
              <Label htmlFor="customer-code">ID</Label>
              <Input
                id="customer-code"
                readOnly
                placeholder="Generated on save"
                className="bg-muted"
                {...register("customerCode")}
              />
              {errors.customerCode && (
                <p className="text-sm text-destructive">
                  {errors.customerCode.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-name">Name</Label>
              <Input id="customer-name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div className="grid gap-2">
              <Label htmlFor="customer-phone">Phone Number</Label>

              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center border-r px-3 text-sm font-medium text-muted-foreground">
                      +63
                    </span>

                    <Input
                      id="customer-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="9123456789"
                      className="pl-14"
                      ref={field.ref}
                      value={getLocalDigits(field.value ?? "")}
                      onChange={(event) => {
                        const digits = getLocalDigits(event.target.value);

                        // Stored as "+63 9XXXXXXXXX", or "" when empty
                        field.onChange(digits ? `+63 ${digits}` : "");
                      }}
                      onBlur={field.onBlur}
                    />
                  </div>
                )}
              />

              <p className="text-xs text-muted-foreground">
                Enter the 10-digit mobile number starting with 9.
              </p>

              {errors.phoneNumber && (
                <p className="text-sm text-destructive">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer-address">Address</Label>
              <Input id="customer-address" {...register("address")} />
              {errors.address && (
                <p className="text-sm text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="customer-status">Status</Label>

              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="customer-status"
                      className={cn(
                        "h-10 border-stone-200 focus:ring-[#8B4E2F]/30 dark:border-border dark:bg-background",
                        field.value === "inactive" &&
                          "bg-muted text-muted-foreground dark:bg-muted",
                      )}
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />

              {errors.status && (
                <p className="text-sm text-destructive">
                  {errors.status.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#6B4226] text-white hover:bg-[#D4A017]"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingCustomer
                    ? "Save Changes"
                    : "Add Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {customerToDelete?.name || "this customer"}.
              Existing credit history may prevent deletion when connected to
              ledger records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={deleteCustomer}
              disabled={saving}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}