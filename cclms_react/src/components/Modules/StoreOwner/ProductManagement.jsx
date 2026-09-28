import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Power, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { useOwnerProducts } from "@/hooks/use-owner-products"
import { ownerApi } from "@/lib/api/owner"
import { productSchema } from "@/lib/schemas/owner"
import { DataTable } from "@/components/owner/data-table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function formatPrice(value) {
	return `PHP ${value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
}

export default function ProductManagement() {
	const { products, loading, error, refresh } = useOwnerProducts()
	const [search, setSearch] = useState("")
	const [page, setPage] = useState(1)
	const [dialogOpen, setDialogOpen] = useState(false)
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [editingProduct, setEditingProduct] = useState(null)
	const [productToDelete, setProductToDelete] = useState(null)
	const [saving, setSaving] = useState(false)
	const { register, reset, handleSubmit, formState: { errors } } = useForm({
		resolver: zodResolver(productSchema),
		defaultValues: { name: "", idCode: "", price: "" },
	})
	const filteredProducts = useMemo(() => {
		const query = search.trim().toLowerCase()
		if (!query) return products
		return products.filter((product) => product.name.toLowerCase().includes(query) || product.idCode.toLowerCase().includes(query))
	}, [products, search])

	function openAddDialog() {
		setEditingProduct(null)
		reset({ name: "", idCode: "", price: "" })
		setDialogOpen(true)
	}

	function openEditDialog(product) {
		setEditingProduct(product)
		reset({ name: product.name, idCode: product.idCode, price: product.price })
		setDialogOpen(true)
	}

	async function submitProduct(values) {
		setSaving(true)
		try {
			if (editingProduct) {
				await ownerApi.updateProduct(editingProduct.id, values)
				toast.success("Product updated")
			} else {
				await ownerApi.createProduct(values)
				toast.success("Product added")
			}
			setDialogOpen(false)
			await refresh()
		} catch (saveError) {
			toast.error(editingProduct ? "Unable to update product" : "Unable to add product", { description: saveError instanceof Error ? saveError.message : "Please try again." })
		} finally {
			setSaving(false)
		}
	}

	async function deleteProduct() {
		if (!productToDelete) return
		setSaving(true)
		try {
			await ownerApi.deleteProduct(productToDelete.id)
			toast.success("Product deleted")
			setDeleteOpen(false)
			setProductToDelete(null)
			await refresh()
		} catch (deleteError) {
			toast.error("Unable to delete product", { description: deleteError instanceof Error ? deleteError.message : "Please try again." })
		} finally {
			setSaving(false)
		}
	}

	async function toggleStatus(product) {
		try {
			await ownerApi.toggleProductStatus(product.id)
			toast.success(product.status === "active" ? "Product deactivated" : "Product activated")
			await refresh()
		} catch (statusError) {
			toast.error("Unable to update product status", { description: statusError instanceof Error ? statusError.message : "Please try again." })
		}
	}

	const columns = [
		{ key: "idCode", header: "ID Code" },
		{ key: "name", header: "Name" },
		{ key: "price", header: "Price", cell: (row) => formatPrice(row.price) },
		{ key: "status", header: "Status", cell: (row) => <Badge variant={row.status === "active" ? "default" : "secondary"}>{row.status}</Badge> },
		{ key: "actions", header: "Actions", cell: (row) => <div className="flex gap-1"><Button variant="ghost" size="icon" title={`Edit ${row.name}`} onClick={() => openEditDialog(row)}><Pencil /></Button><Button variant="ghost" size="icon" title={`Toggle ${row.name} status`} onClick={() => toggleStatus(row)}><Power /></Button><Button variant="ghost" size="icon" title={`Delete ${row.name}`} onClick={() => { setProductToDelete(row); setDeleteOpen(true) }}><Trash2 /></Button></div> },
	]

	return (
		<main className="flex flex-1 flex-col gap-6 p-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight">Product Management</h1><p className="text-muted-foreground">Maintain the products available for credit entries.</p></div><Button onClick={openAddDialog}><Plus /> Add New Product</Button></div>
			<div className="relative max-w-md"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search products..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></div>
			<Card><CardHeader><CardTitle>Products</CardTitle><CardDescription>{filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"} found.</CardDescription></CardHeader><CardContent><DataTable columns={columns} rows={filteredProducts} rowKey={(row) => row.id} page={page} onPageChange={setPage} loading={loading} error={error} emptyMessage="No products found." /></CardContent></Card>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle><DialogDescription>{editingProduct ? "Update the product details." : "Add a product to the credit catalog."}</DialogDescription></DialogHeader><form className="grid gap-4" onSubmit={handleSubmit(submitProduct)}><div className="grid gap-2"><Label htmlFor="product-name">Name</Label><Input id="product-name" {...register("name")} />{errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}</div><div className="grid gap-2"><Label htmlFor="product-id-code">ID Code</Label><Input id="product-id-code" {...register("idCode")} />{errors.idCode && <p className="text-sm text-destructive">{errors.idCode.message}</p>}</div><div className="grid gap-2"><Label htmlFor="product-price">Price</Label><Input id="product-price" type="number" min="0.01" step="0.01" {...register("price")} />{errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}</div><DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : editingProduct ? "Save Changes" : "Add Product"}</Button></DialogFooter></form></DialogContent></Dialog>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete product?</AlertDialogTitle><AlertDialogDescription>This will remove {productToDelete?.name || "this product"} from the catalog. Historical credit snapshots remain unchanged.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={deleteProduct} disabled={saving}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
		</main>
	)
}
