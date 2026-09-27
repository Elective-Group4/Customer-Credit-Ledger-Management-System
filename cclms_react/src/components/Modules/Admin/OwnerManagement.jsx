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
    console.error(
      "Create owner error:",
      error
    )

    toast.error(
      "Failed to create store owner",
      {
        description: error.message,
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

    <div className="flex flex-col gap-6 p-6">

      {/* PAGE HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-2xl font-semibold tracking-tight">
            Store Owner Management
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage store owner accounts and store information.
          </p>

        </div>


        <Button
          onClick={openAddDialog}
          className = "bg-[#D4A017] text-white hover:bg-[#D4A017]/90 h-10 px-4 text-base"
        >

          <Plus className="mr-2 h-4 w-4" />

          Add Store Owner

        </Button>

      </div>


      {/* OWNER CARD */}

      <Card>

        <CardHeader>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <CardTitle>
              Store Owners
            </CardTitle>


            {/* SEARCH */}

            <div className="relative w-full sm:w-[300px]">

              <Search
                className="
                  absolute
                  left-3
                  top-1/2
                  h-4
                  w-4
                  -translate-y-1/2
                  text-muted-foreground
                "
              />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search owner or store..."
                className="pl-9"
              />

            </div>

          </div>

        </CardHeader>


        <CardContent>

          <div className="rounded-md border">

            <Table>

              <TableHeader>

                <TableRow>

                  <TableHead>
                    Store Owner
                  </TableHead>

                  <TableHead>
                    Email
                  </TableHead>

                  <TableHead>
                    Phone
                  </TableHead>

                  <TableHead>
                    Store
                  </TableHead>

                  <TableHead>
                    Branch
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead className="w-[60px]">
                    <span className="sr-only">
                      Actions
                    </span>
                  </TableHead>

                </TableRow>

              </TableHeader>


              <TableBody>

                {/* LOADING */}

                {loading && (

                  <TableRow>

                    <TableCell
                      colSpan={7}
                      className="h-32 text-center"
                    >

                      <Loader2
                        className="
                          mx-auto
                          h-6
                          w-6
                          animate-spin
                          text-muted-foreground
                        "
                      />

                    </TableCell>

                  </TableRow>

                )}


                {/* EMPTY */}

                {!loading &&
                  filteredOwners.length === 0 && (

                    <TableRow>

                      <TableCell
                        colSpan={7}
                        className="
                          h-32
                          text-center
                          text-muted-foreground
                        "
                      >
                        No store owners found.
                      </TableCell>

                    </TableRow>

                  )}


                {/* DATA */}

                {!loading &&
                  filteredOwners.map(
                    (owner) => (

                      <TableRow
                        key={owner.id}
                      >

                        <TableCell className="font-medium">

                          {owner.profiles?.full_name ||
                            "Unknown"}

                        </TableCell>


                        <TableCell>

                          {owner.profiles?.email ||
                            "-"}

                        </TableCell>


                        <TableCell>

                          {owner.profiles?.phone_number ||
                            "-"}

                        </TableCell>


                        <TableCell>

                          {owner.store_name}

                        </TableCell>


                        <TableCell>

                          {owner.branch}

                        </TableCell>


                        <TableCell>

                          <span
                            className={`
                              inline-flex
                              items-center
                              rounded-full
                              px-2.5
                              py-0.5
                              text-xs
                              font-medium
                              ${
                                owner.profiles?.status ===
                                "active"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-muted text-muted-foreground"
                              }
                            `}
                          >

                            {owner.profiles?.status ||
                              "active"}

                          </span>

                        </TableCell>


                        {/* ACTIONS */}

                        <TableCell>

                          <DropdownMenu>

                            <DropdownMenuTrigger
                              asChild
                            >

                              <Button
                                variant="ghost"
                                size="icon"
                              >

                                <MoreHorizontal
                                  className="h-4 w-4"
                                />

                                <span className="sr-only">
                                  Open menu
                                </span>

                              </Button>

                            </DropdownMenuTrigger>


                            <DropdownMenuContent
                              align="end"
                            >

                              <DropdownMenuItem
                                onClick={() =>
                                  viewOwner(owner)
                                }
                              >

                                <Eye className="mr-2 h-4 w-4" />

                                View

                              </DropdownMenuItem>


                              <DropdownMenuItem
                                onClick={() =>
                                  openEditDialog(owner)
                                }
                              >

                                <Pencil className="mr-2 h-4 w-4" />

                                Edit

                              </DropdownMenuItem>


                              <DropdownMenuSeparator />


                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() =>
                                  openDeleteDialog(
                                    owner
                                  )
                                }
                              >

                                <Trash2 className="mr-2 h-4 w-4" />

                                Delete

                              </DropdownMenuItem>

                            </DropdownMenuContent>

                          </DropdownMenu>

                        </TableCell>

                      </TableRow>

                    )
                  )}

              </TableBody>

            </Table>

          </div>

        </CardContent>

      </Card>


      {/* ================================================= */}
      {/* ADD / EDIT DIALOG */}
      {/* ================================================= */}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >

        <DialogContent className="sm:max-w-[550px]">

          <DialogHeader>

            <DialogTitle>

              {editingOwner
                ? "Edit Store Owner"
                : "Add Store Owner"}

            </DialogTitle>

            <DialogDescription>

              {editingOwner
                ? "Update the store owner and store information."
                : "Create a new store owner account."}

            </DialogDescription>

          </DialogHeader>


          <div className="grid gap-4 py-4">


            {/* NAME */}

            <div className="grid gap-2">

              <Label htmlFor="full_name">
                Store Owner Name
              </Label>

              <Input
                id="full_name"
                value={form.full_name}
                onChange={(event) =>
                  handleChange(
                    "full_name",
                    event.target.value
                  )
                }
                placeholder="Juan Dela Cruz"
              />

            </div>


            {/* EMAIL */}

            <div className="grid gap-2">

              <Label htmlFor="email">
                Email
              </Label>

              <Input
                id="email"
                type="email"
                value={form.email}
                disabled={!!editingOwner}
                onChange={(event) =>
                  handleChange(
                    "email",
                    event.target.value
                  )
                }
                placeholder="juan@example.com"
              />

              {editingOwner && (

                <p className="text-xs text-muted-foreground">
                  Auth email changes require a server-side admin operation and are not available from the browser form.
                </p>

              )}

            </div>


            {/* PASSWORD */}

            {!editingOwner && (

              <div className="grid gap-2">

                <Label htmlFor="password">
                  Password
                </Label>

                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    handleChange(
                      "password",
                      event.target.value
                    )
                  }
                  placeholder="Enter password"
                />

                <p className="text-xs text-muted-foreground">
                  Minimum 6 characters.
                </p>

              </div>

            )}


            {/* PHONE */}

            <div className="grid gap-2">

              <Label htmlFor="phone_number">
                Phone Number
              </Label>

              <Input
                id="phone_number"
                value={form.phone_number}
                onChange={(event) =>
                  handleChange(
                    "phone_number",
                    event.target.value
                  )
                }
                placeholder="09171234567"
              />

            </div>


            {/* STORE NAME */}

            <div className="grid gap-2">

              <Label htmlFor="store_name">
                Store Name
              </Label>

              <Input
                id="store_name"
                value={form.store_name}
                onChange={(event) =>
                  handleChange(
                    "store_name",
                    event.target.value
                  )
                }
                placeholder="Juan Sari-Sari Store"
              />

            </div>


            {/* BRANCH */}

            <div className="grid gap-2">

              <Label htmlFor="branch">
                Branch
              </Label>

              <Input
                id="branch"
                value={form.branch}
                onChange={(event) =>
                  handleChange(
                    "branch",
                    event.target.value
                  )
                }
                placeholder="Main Branch"
              />

            </div>


            {/* STATUS */}

            <div className="grid gap-2">

              <Label>
                Status
              </Label>

              <Select
                value={form.status}
                onValueChange={(value) =>
                  handleChange(
                    "status",
                    value
                  )
                }
              >

                <SelectTrigger>

                  <SelectValue
                    placeholder="Select status"
                  />

                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="active">
                    Active
                  </SelectItem>

                  <SelectItem value="inactive">
                    Inactive
                  </SelectItem>

                </SelectContent>

              </Select>

            </div>

          </div>


          <DialogFooter>

            <Button
              variant="outline"
              onClick={() =>
                setDialogOpen(false)
              }
              disabled={saving}
            >
              Cancel
            </Button>


            <Button
              onClick={
                editingOwner
                  ? updateOwner
                  : createOwner
              }
              disabled={saving}
            >

              {saving && (

                <Loader2
                  className="
                    mr-2
                    h-4
                    w-4
                    animate-spin
                  "
                />

              )}

              {editingOwner
                ? "Save Changes"
                : "Create Owner"}

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>


      {/* ================================================= */}
      {/* VIEW OWNER */}
      {/* ================================================= */}

      <Dialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      >

        <DialogContent className="sm:max-w-[500px]">

          <DialogHeader>

            <DialogTitle>
              Store Owner Details
            </DialogTitle>

            <DialogDescription>
              View account and store information.
            </DialogDescription>

          </DialogHeader>


          {selectedOwner && (

            <div className="grid gap-5 py-4">


              <div className="grid gap-1">

                <p className="text-sm text-muted-foreground">
                  Store Owner
                </p>

                <p className="font-medium">
                  {selectedOwner.profiles?.full_name ||
                    "-"}
                </p>

              </div>


              <div className="grid gap-1">

                <p className="text-sm text-muted-foreground">
                  Email
                </p>

                <p className="font-medium">
                  {selectedOwner.profiles?.email ||
                    "-"}
                </p>

              </div>


              <div className="grid gap-1">

                <p className="text-sm text-muted-foreground">
                  Phone Number
                </p>

                <p className="font-medium">
                  {selectedOwner.profiles?.phone_number ||
                    "-"}
                </p>

              </div>


              <div className="grid gap-1">

                <p className="text-sm text-muted-foreground">
                  Store Name
                </p>

                <p className="font-medium">
                  {selectedOwner.store_name}
                </p>

              </div>


              <div className="grid gap-1">

                <p className="text-sm text-muted-foreground">
                  Branch
                </p>

                <p className="font-medium">
                  {selectedOwner.branch}
                </p>

              </div>


              <div className="grid gap-1">

                <p className="text-sm text-muted-foreground">
                  Status
                </p>

                <p className="font-medium capitalize">
                  {selectedOwner.profiles?.status ||
                    "active"}
                </p>

              </div>


              <div className="grid gap-1">

                <p className="text-sm text-muted-foreground">
                  Created
                </p>

                <p className="font-medium">

                  {selectedOwner.created_at
                    ? new Date(
                        selectedOwner.created_at
                      ).toLocaleString()
                    : "-"}

                </p>

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

        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle>
              Delete Store Owner?
            </AlertDialogTitle>

            <AlertDialogDescription>

              Are you sure you want to delete{" "}

              <span className="font-medium text-foreground">

                {ownerToDelete?.profiles?.full_name}

              </span>

              ? This will remove the store owner's
              account and store information.

            </AlertDialogDescription>

          </AlertDialogHeader>


          <AlertDialogFooter>

            <AlertDialogCancel
              disabled={saving}
            >
              Cancel
            </AlertDialogCancel>


            <AlertDialogAction
              onClick={deleteOwner}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >

              {saving && (

                <Loader2
                  className="
                    mr-2
                    h-4
                    w-4
                    animate-spin
                  "
                />

              )}

              Delete

            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>

      </AlertDialog>

    </div>
  )
}