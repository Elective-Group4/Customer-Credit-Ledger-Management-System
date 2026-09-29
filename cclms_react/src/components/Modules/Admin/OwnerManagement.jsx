import * as React from "react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getClientIp } from "@/lib/client-ip"

import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Loader2,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Label } from "@/components/ui/label"

import { toast } from "sonner"


export default function OwnerManagement() {

  // =====================================================
  // STATE
  // =====================================================

  const [owners, setOwners] = useState([])

  const [search, setSearch] = useState("")

  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)

  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [editingOwner, setEditingOwner] = useState(null)

  const [selectedOwner, setSelectedOwner] = useState(null)

  const [ownerToDelete, setOwnerToDelete] = useState(null)

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone_number: "",
    store_name: "",
    branch: "",
    status: "active",
  })


  // =====================================================
  // FETCH OWNERS
  // =====================================================

  const fetchOwners = async () => {

    try {

      setLoading(true)

      const { data, error } = await supabase
        .from("store_owners")
        .select(`
          id,
          profile_id,
          store_name,
          branch,
          created_at,
          updated_at,
          profiles (
            id,
            full_name,
            email,
            phone_number,
            role,
            status,
            created_at
          )
        `)
        .order("created_at", {
          ascending: false,
        })

      if (error) {
        throw error
      }

      setOwners(data || [])

    } catch (error) {

      console.error(error)

      toast.error("Unable to load store owners", {
        description: error.message,
      })

    } finally {

      setLoading(false)

    }
  }


  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {

    fetchOwners()

  }, [])


  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {

    setForm({
      full_name: "",
      email: "",
      password: "",
      phone_number: "",
      store_name: "",
      branch: "",
      status: "active",
    })

  }


  // =====================================================
  // OPEN ADD
  // =====================================================

  const openAddDialog = () => {

    setEditingOwner(null)

    resetForm()

    setDialogOpen(true)

  }


  // =====================================================
  // OPEN EDIT
  // =====================================================

  const openEditDialog = (owner) => {

    setEditingOwner(owner)

    setForm({
      full_name: owner.profiles?.full_name || "",
      email: owner.profiles?.email || "",
      password: "",
      phone_number: owner.profiles?.phone_number || "",
      store_name: owner.store_name || "",
      branch: owner.branch || "",
      status: owner.profiles?.status || "active",
    })

    setDialogOpen(true)

  }


  // =====================================================
  // HANDLE INPUT
  // =====================================================

  const handleChange = (field, value) => {

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))

  }


  // =====================================================
  // CREATE OWNER
  // =====================================================

  const createOwner = async () => {
  if (!form.full_name.trim()) {
    toast.error("Store owner name is required")
    return
  }

  if (!form.email.trim()) {
    toast.error("Email is required")
    return
  }

  if (!form.password) {
    toast.error("Password is required")
    return
  }

  if (form.password.length < 6) {
    toast.error("Password must be at least 6 characters")
    return
  }

  if (!form.phone_number.trim()) {
    toast.error("Phone number is required")
    return
  }

  if (!form.store_name.trim()) {
    toast.error("Store name is required")
    return
  }

  if (!form.branch.trim()) {
    toast.error("Branch is required")
    return
  }

  try {
    setSaving(true)

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    console.log("Current session:", session)
    console.log(
      "Has access token:",
      !!session?.access_token
    )

    if (sessionError) {
      throw sessionError
    }

    if (!session) {
      throw new Error(
        "No active admin session. Please log in again."
      )
    }

    const ipAddress = await getClientIp()

    const { data, error } =
      await supabase.functions.invoke(
        "smart-action",
        {
          body: {
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            password: form.password,
            phone_number: form.phone_number.trim(),
            store_name: form.store_name.trim(),
            branch: form.branch.trim(),
            status: form.status,
            ip_address: ipAddress,
          },
        }
      )

    console.log("Function data:", data)
    console.log("Function error:", error)

    if (error) {
      throw error
    }

    if (!data?.success) {
      throw new Error(
        data?.message ||
        "Failed to create store owner"
      )
    }

    toast.success(
      "Store owner created successfully"
    )

    setDialogOpen(false)
    resetForm()

    await fetchOwners()
  } catch (error) {
    let errorMessage = error?.message || "The owner could not be created."

    if (error?.context instanceof Response) {
      try {
        const responseBody = await error.context.clone().json()
        errorMessage = responseBody?.message || errorMessage
      } catch {
        // Keep the generic FunctionsHttpError message when the response is not JSON.
      }
    }

    console.error(
      "Create owner error:",
      error,
      { message: errorMessage }
    )

    toast.error(
      "Failed to create store owner",
      {
        description: errorMessage,
      }
    )
  } finally {
    setSaving(false)
  }
}
  


  // =====================================================
  // UPDATE OWNER
  // =====================================================

  const updateOwner = async () => {

    if (!editingOwner) {
      return
    }

    if (!form.full_name.trim()) {
      toast.error("Store owner name is required")
      return
    }

    if (!form.email.trim()) {
      toast.error("Email is required")
      return
    }

    if (!form.phone_number.trim()) {
      toast.error("Phone number is required")
      return
    }

    if (!form.store_name.trim()) {
      toast.error("Store name is required")
      return
    }

    if (!form.branch.trim()) {
      toast.error("Branch is required")
      return
    }

    try {

      setSaving(true)

      const { data, error } = await supabase.functions.invoke(
        "smart-action",
        {
          body: {
            action: "update_owner",
            profile_id: editingOwner.profile_id,
            store_owner_id: editingOwner.id,
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            phone_number: form.phone_number.trim(),
            store_name: form.store_name.trim(),
            branch: form.branch.trim(),
            status: form.status,
          },
        }
      )

      if (error) {
        throw error
      }

      if (!data?.success) {
        throw new Error(data?.message || "Failed to update store owner")
      }

      toast.success(
        "Store owner updated successfully"
      )

      setDialogOpen(false)

      setEditingOwner(null)

      resetForm()

      await fetchOwners()

    } catch (error) {

      console.error("EDIT OWNER ERROR:", {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        error,
      })

      toast.error(
        "Failed to update store owner",
        {
          description:
            error?.message ||
            "The owner could not be updated.",
        }
      )

    } finally {

      setSaving(false)

    }
  }


  // =====================================================
  // OPEN DELETE CONFIRMATION
  // =====================================================

  const openDeleteDialog = (owner) => {

    setOwnerToDelete(owner)

    setDeleteDialogOpen(true)

  }


  // =====================================================
  // DELETE OWNER
  // =====================================================

  const deleteOwner = async () => {

    if (!ownerToDelete) {
      return
    }

    try {

      setSaving(true)

      const { data, error } = await supabase.functions.invoke(
        "smart-action",
        {
          body: {
            action: "delete_owner",
            profile_id: ownerToDelete.profile_id,
            store_owner_id: ownerToDelete.id,
          },
        }
      )

      if (error) {
        throw error
      }

      if (!data?.success) {
        throw new Error(data?.message || "Failed to delete store owner")
      }

      toast.success(
        "Store owner deleted successfully"
      )

      setDeleteDialogOpen(false)

      setOwnerToDelete(null)

      await fetchOwners()

    } catch (error) {

      console.error("DELETE OWNER ERROR:", {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        error,
      })

      toast.error(
        "Failed to delete store owner",
        {
          description:
            error?.message ||
            "The owner could not be deleted.",
        }
      )

    } finally {

      setSaving(false)

    }
  }


  // =====================================================
  // VIEW OWNER
  // =====================================================

  const viewOwner = (owner) => {

    setSelectedOwner(owner)

    setViewDialogOpen(true)

  }


  // =====================================================
  // SEARCH
  // =====================================================

  const filteredOwners = owners.filter(
    (owner) => {

      const searchValue =
        search.toLowerCase().trim()

      const name =
        owner.profiles?.full_name
          ?.toLowerCase() || ""

      const email =
        owner.profiles?.email
          ?.toLowerCase() || ""

      const phone =
        owner.profiles?.phone_number
          ?.toLowerCase() || ""

      const store =
        owner.store_name
          ?.toLowerCase() || ""

      const branch =
        owner.branch
          ?.toLowerCase() || ""

      return (
        name.includes(searchValue) ||
        email.includes(searchValue) ||
        phone.includes(searchValue) ||
        store.includes(searchValue) ||
        branch.includes(searchValue)
      )
    }
  )


  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="admin-theme-surface flex min-h-full flex-col gap-6 bg-background p-5 md:p-7">

      {/* PAGE HEADER */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717]">
            Store Owner Management
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage store owner accounts and store information.
          </p>
        </div>

        <Button
          onClick={openAddDialog}
          className="h-11 rounded-lg bg-[#D4A017] px-5 font-semibold text-white shadow-sm hover:bg-[#BD8D0F]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Store Owner
        </Button>
      </div>


      {/* SUMMARY */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Total Owners</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#171717]">
            {loading ? "..." : owners.length}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Active Owners</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#171717]">
            {loading
              ? "..."
              : owners.filter(
                  (owner) =>
                    (owner.profiles?.status || "active").toLowerCase() === "active"
                ).length}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Inactive Owners</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#171717]">
            {loading
              ? "..."
              : owners.filter(
                  (owner) =>
                    (owner.profiles?.status || "active").toLowerCase() !== "active"
                ).length}
          </p>
        </div>
      </div>


      {/* OWNER CARD */}
      <Card className="overflow-hidden rounded-xl border-stone-200 bg-white shadow-sm">
        <CardHeader className="border-b border-stone-100 px-5 py-5 md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-[#171717]">
                Store Owners
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                View and manage registered store owner accounts.
              </p>
            </div>

            {/* SEARCH */}
            <div className="relative w-full lg:w-[320px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search owner, email, or store..."
                className="h-10 rounded-lg border-stone-200 bg-stone-50 pl-9 shadow-none placeholder:text-stone-400 focus-visible:ring-[#8B4E2F]/30"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-stone-100 bg-stone-50/70 hover:bg-stone-50/70">
                  <TableHead className="h-11 px-5 text-xs font-semibold uppercase tracking-wide text-stone-500 md:px-6">
                    Store Owner
                  </TableHead>
                  <TableHead className="h-11 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Contact
                  </TableHead>
                  <TableHead className="h-11 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Store
                  </TableHead>
                  <TableHead className="h-11 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Branch
                  </TableHead>
                  <TableHead className="h-11 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Status
                  </TableHead>
                  <TableHead className="h-11 w-[60px] pr-5 md:pr-6">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {/* LOADING */}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-36 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-[#8B4E2F]" />
                        <span className="text-sm">Loading store owners...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* EMPTY */}
                {!loading && filteredOwners.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F5EEE9] text-[#8B4E2F]">
                          <Search className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-medium text-[#171717]">
                          No store owners found
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Try changing your search or add a new store owner.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* DATA */}
                {!loading &&
                  filteredOwners.map((owner) => {
                    const ownerName = owner.profiles?.full_name || "Unknown"
                    const initials = ownerName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part.charAt(0))
                      .join("")
                      .toUpperCase() || "OW"

                    const status = owner.profiles?.status || "active"
                    const isActive = status.toLowerCase() === "active"

                    return (
                      <TableRow
                        key={owner.id}
                        className="border-stone-100 transition-colors hover:bg-stone-50/70"
                      >
                        <TableCell className="px-5 py-4 md:px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5EEE9] text-xs font-bold text-[#8B4E2F]">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#171717]">
                                {ownerName}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                Store Owner
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="min-w-[190px]">
                            <p className="truncate text-sm text-[#171717]">
                              {owner.profiles?.email || "-"}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {owner.profiles?.phone_number || "No phone number"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <p className="text-sm font-medium text-[#171717]">
                            {owner.store_name || "-"}
                          </p>
                        </TableCell>

                        <TableCell className="py-4">
                          <p className="text-sm text-[#171717]">
                            {owner.branch || "-"}
                          </p>
                        </TableCell>

                        <TableCell className="py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isActive ? "bg-emerald-600" : "bg-stone-400"
                              }`}
                            />
                            {status}
                          </span>
                        </TableCell>

                        {/* ACTIONS */}
                        <TableCell className="pr-5 text-right md:pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-[#8B4E2F]"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="w-40 rounded-lg border-stone-200"
                            >
                              <DropdownMenuItem onClick={() => viewOwner(owner)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => openEditDialog(owner)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Owner
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                className="text-red-600 focus:bg-red-50 focus:text-red-600"
                                onClick={() => openDeleteDialog(owner)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Owner
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


      {/* ================================================= */}
      {/* ADD / EDIT DIALOG */}
      {/* ================================================= */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="overflow-hidden rounded-2xl border-stone-200 bg-background p-0 shadow-xl dark:border-border dark:bg-card sm:max-w-[560px]">
          <DialogHeader className="border-b border-stone-100 bg-stone-50/70 px-6 py-5 dark:border-border dark:bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5EEE9] text-[#8B4E2F]">
                {editingOwner ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg text-[#171717] dark:text-foreground">
                  {editingOwner ? "Edit Store Owner" : "Add Store Owner"}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {editingOwner
                    ? "Update the store owner and store information."
                    : "Create a new store owner account."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-5 px-6 py-5">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Store Owner Name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(event) => handleChange("full_name", event.target.value)}
                placeholder="Juan Dela Cruz"
                className="h-10 border-stone-200 focus-visible:ring-[#8B4E2F]/30 dark:border-border dark:bg-background"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                disabled={!!editingOwner}
                onChange={(event) => handleChange("email", event.target.value)}
                placeholder="juan@example.com"
                className="h-10 border-stone-200 focus-visible:ring-[#8B4E2F]/30 dark:border-border dark:bg-background"
              />
              {editingOwner && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Auth email changes require a server-side admin operation and are not available from the browser form.
                </p>
              )}
            </div>

            {!editingOwner && (
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => handleChange("password", event.target.value)}
                  placeholder="Enter password"
                  className="h-10 border-stone-200 focus-visible:ring-[#8B4E2F]/30 dark:border-border dark:bg-background"
                />
                <p className="text-xs text-muted-foreground">Minimum 6 characters.</p>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={form.phone_number}
                  onChange={(event) => handleChange("phone_number", event.target.value)}
                  placeholder="09171234567"
                  className="h-10 border-stone-200 focus-visible:ring-[#8B4E2F]/30 dark:border-border dark:bg-background"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="store_name">Store Name</Label>
                <Input
                  id="store_name"
                  value={form.store_name}
                  onChange={(event) => handleChange("store_name", event.target.value)}
                  placeholder="Juan Sari-Sari Store"
                  className="h-10 border-stone-200 focus-visible:ring-[#8B4E2F]/30 dark:border-border dark:bg-background"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={form.branch}
                  onChange={(event) => handleChange("branch", event.target.value)}
                  placeholder="Main Branch"
                  className="h-10 border-stone-200 focus-visible:ring-[#8B4E2F]/30"
                />
              </div>

              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => handleChange("status", value)}
                >
                  <SelectTrigger className="h-10 border-stone-200 focus:ring-[#8B4E2F]/30 dark:border-border dark:bg-background">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-stone-100 bg-stone-50/50 px-6 pt-4 pb-8 dark:border-border dark:bg-muted/40">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
              className="border-stone-200 bg-white dark:border-border dark:bg-background"
            >
              Cancel
            </Button>

            <Button
              onClick={editingOwner ? updateOwner : createOwner}
              disabled={saving}
              className="bg-[#8B4E2F] text-white hover:bg-[#713D24]"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingOwner ? "Save Changes" : "Create Owner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* ================================================= */}
      {/* VIEW OWNER */}
      {/* ================================================= */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="overflow-hidden rounded-2xl border-stone-200 bg-background p-0 shadow-xl dark:border-border dark:bg-card sm:max-w-[520px]">
          <DialogHeader className="border-b border-stone-100 bg-stone-50/70 px-6 py-5 dark:border-border dark:bg-muted/40">
            <DialogTitle className="text-lg text-[#171717] dark:text-foreground">
              Store Owner Details
            </DialogTitle>
            <DialogDescription>
              View account and store information.
            </DialogDescription>
          </DialogHeader>

          {selectedOwner && (
            <div className="px-6 py-6">
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-border dark:bg-card">
                <div className="h-20 bg-[#8B4E2F]" />

                <div className="relative px-6 pb-6">
                  <div className="-mt-10 flex items-end justify-between">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-[#F5EEE9] text-2xl font-bold text-[#8B4E2F] shadow-sm dark:border-card dark:bg-[#8B4E2F]/20 dark:text-[#D9A66A]">
                      {selectedOwner.profiles?.full_name?.charAt(0).toUpperCase() || "?"}
                    </div>

                    <span
                      className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        selectedOwner.profiles?.status?.toLowerCase() === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          selectedOwner.profiles?.status?.toLowerCase() === "active"
                            ? "bg-emerald-600"
                            : "bg-stone-400"
                        }`}
                      />
                      {selectedOwner.profiles?.status || "Active"}
                    </span>
                  </div>

                  <div className="mt-4 border-b border-stone-100 pb-5">
                    <h3 className="text-xl font-bold tracking-tight text-[#171717] dark:text-foreground">
                      {selectedOwner.profiles?.full_name || "Unknown Owner"}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Store Owner · {selectedOwner.store_name || "-"}
                    </p>
                  </div>

                  <div className="grid gap-5 pt-5 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Email Address
                      </p>
                      <p className="mt-1 break-all text-sm font-medium text-[#171717] dark:text-foreground">
                        {selectedOwner.profiles?.email || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Phone Number
                      </p>
                      <p className="mt-1 text-sm font-medium text-[#171717] dark:text-foreground">
                        {selectedOwner.profiles?.phone_number || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Branch Assignment
                      </p>
                      <p className="mt-1 text-sm font-medium text-[#171717] dark:text-foreground">
                        {selectedOwner.branch || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Date Issued
                      </p>
                      <p className="mt-1 text-sm font-medium text-[#171717] dark:text-foreground">
                        {selectedOwner.created_at
                          ? new Date(selectedOwner.created_at).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* ================================================= */}
      {/* DELETE CONFIRMATION */}
      {/* ================================================= */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent className="rounded-2xl border-stone-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Store Owner?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {ownerToDelete?.profiles?.full_name}
              </span>
              ? This will remove the store owner's account and store information.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={deleteOwner}
              disabled={saving}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Owner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}