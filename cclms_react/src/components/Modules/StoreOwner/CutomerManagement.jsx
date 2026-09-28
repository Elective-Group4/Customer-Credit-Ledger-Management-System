import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { useOwnerCustomers } from "@/hooks/use-owner-customers"
import { ownerApi } from "@/lib/api/owner"
import { customerSchema } from "@/lib/schemas/owner"
import { DataTable } from "@/components/owner/data-table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CustomerManagement() {
	const { customers, loading, error, refresh } = useOwnerCustomers()
	const [search, setSearch] = useState("")
	const [page, setPage] = useState(1)
	const [dialogOpen, setDialogOpen] = useState(false)
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [editingCustomer, setEditingCustomer] = useState(null)
	const [customerToDelete, setCustomerToDelete] = useState(null)
	const [saving, setSaving] = useState(false)
	const { register, reset, handleSubmit, formState: { errors } } = useForm({
		resolver: zodResolver(customerSchema),
		defaultValues: { customerCode: "", name: "", phoneNumber: "", address: "" },
	})
	const filteredCustomers = useMemo(() => {
		const query = search.trim().toLowerCase()
		if (!query) return customers
		return customers.filter((customer) => customer.customerCode.toLowerCase().includes(query) || customer.name.toLowerCase().includes(query) || customer.address.toLowerCase().includes(query))
	}, [customers, search])

	async function openAddDialog() {
		try {
			const customerCode = await ownerApi.nextCustomerCode()
			setEditingCustomer(null)
			reset({ customerCode, name: "", phoneNumber: "", address: "" })
			setDialogOpen(true)
		} catch (codeError) {
			toast.error("Unable to generate customer ID", { description: codeError instanceof Error ? codeError.message : "Please try again." })
		}
	}

	function openEditDialog(customer) {
		setEditingCustomer(customer)
		reset({ customerCode: customer.customerCode, name: customer.name, phoneNumber: customer.phoneNumber, address: customer.address })
		setDialogOpen(true)
	}

	async function submitCustomer(values) {
		setSaving(true)
		try {
			if (editingCustomer) {
				await ownerApi.updateCustomer(editingCustomer.id, values)
				toast.success("Customer updated")
			} else {
				await ownerApi.createCustomer(values)
				toast.success("Customer added")
			}
			setDialogOpen(false)
			await refresh()
		} catch (saveError) {
			toast.error(editingCustomer ? "Unable to update customer" : "Unable to add customer", { description: saveError instanceof Error ? saveError.message : "Please try again." })
		} finally {
			setSaving(false)
		}
	}

	async function deleteCustomer() {
		if (!customerToDelete) return
		setSaving(true)
		try {
			await ownerApi.deleteCustomer(customerToDelete.id)
			toast.success("Customer deleted")
			setDeleteOpen(false)
			setCustomerToDelete(null)
			await refresh()
		} catch (deleteError) {
			toast.error("Unable to delete customer", { description: deleteError instanceof Error ? deleteError.message : "Please try again." })
		} finally {
			setSaving(false)
		}
	}

	const columns = [
		{ key: "customerCode", header: "ID#" },
		{ key: "name", header: "Name" },
		{ key: "address", header: "Address" },
		{ key: "status", header: "Status", cell: (row) => <Badge variant={row.status === "active" ? "default" : "secondary"}>{row.status}</Badge> },
		{ key: "actions", header: "Actions", cell: (row) => <div className="flex gap-1"><Button variant="ghost" size="icon" title={`Edit ${row.name}`} onClick={() => openEditDialog(row)}><Pencil /></Button><Button variant="ghost" size="icon" title={`Delete ${row.name}`} onClick={() => { setCustomerToDelete(row); setDeleteOpen(true) }}><Trash2 /></Button></div> },
	]

	return (
		<main className="flex flex-1 flex-col gap-6 p-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight">Customer Management</h1><p className="text-muted-foreground">Manage the customers connected to your credit ledger.</p></div><Button onClick={openAddDialog}><Plus /> Add New Customer</Button></div>
			<div className="relative max-w-md"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search ID, name, or address..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></div>
			<Card><CardHeader><CardTitle>Customers</CardTitle><CardDescription>{filteredCustomers.length} customer{filteredCustomers.length === 1 ? "" : "s"} found.</CardDescription></CardHeader><CardContent><DataTable columns={columns} rows={filteredCustomers} rowKey={(row) => row.id} page={page} onPageChange={setPage} loading={loading} error={error} emptyMessage="No customers found." /></CardContent></Card>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle><DialogDescription>{editingCustomer ? "Update the customer contact details." : "The customer ID is generated automatically."}</DialogDescription></DialogHeader><form className="grid gap-4" onSubmit={handleSubmit(submitCustomer)}><div className="grid gap-2"><Label htmlFor="customer-code">ID</Label><Input id="customer-code" readOnly className="bg-muted" {...register("customerCode")} />{errors.customerCode && <p className="text-sm text-destructive">{errors.customerCode.message}</p>}</div><div className="grid gap-2"><Label htmlFor="customer-name">Name</Label><Input id="customer-name" {...register("name")} />{errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}</div><div className="grid gap-2"><Label htmlFor="customer-phone">Phone Number</Label><Input id="customer-phone" type="tel" {...register("phoneNumber")} />{errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>}</div><div className="grid gap-2"><Label htmlFor="customer-address">Address</Label><Input id="customer-address" {...register("address")} />{errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}</div><DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : editingCustomer ? "Save Changes" : "Add Customer"}</Button></DialogFooter></form></DialogContent></Dialog>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete customer?</AlertDialogTitle><AlertDialogDescription>This will remove {customerToDelete?.name || "this customer"}. Existing credit history may prevent deletion when connected to ledger records.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={deleteCustomer} disabled={saving}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
		</main>
	)
}
