import { useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Grid2X2, List, Search, Plus } from "lucide-react"
import { toast } from "sonner"

import { useOwnerCredits } from "@/hooks/use-owner-credits"
import { ownerApi } from "@/lib/api/owner"
import { creditSchema, paymentSchema } from "@/lib/schemas/owner"
import { DataTable } from "@/components/owner/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const creditColumns = [
	{ key: "id", header: "ID Code" },
	{ key: "customerName", header: "Customer" },
	{ key: "totalAmount", header: "Amount", cell: (row) => `PHP ${row.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` },
	{ key: "createdAt", header: "Date", cell: (row) => new Date(row.createdAt).toLocaleDateString("en-PH") },
]

const ledgerColumns = [
	{ key: "productName", header: "Product" },
	{ key: "quantity", header: "Qty" },
	{ key: "unitPrice", header: "Price", cell: (row) => `PHP ${row.unitPrice.toFixed(2)}` },
	{ key: "subtotal", header: "Subtotal", cell: (row) => `PHP ${row.subtotal.toFixed(2)}` },
]

const customerColumns = [
	{ key: "customerCode", header: "ID#" },
	{ key: "name", header: "Customer" },
	{ key: "balance", header: "Credit Balance", cell: (row) => formatBalance(row.balance) },
	{ key: "status", header: "Status", cell: (row) => <Badge variant={row.status === "active" ? "default" : "secondary"}>{row.status}</Badge> },
]

function formatBalance(value) {
	return `PHP ${value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
}

function toDateInputValue(date) {
	if (!date) return ""
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

export default function CreditTab() {
	const { customers, products, credits, payments, loading, error, refresh } = useOwnerCredits()
	const [search, setSearch] = useState("")
	const [creditPage, setCreditPage] = useState(1)
	const [customerPage, setCustomerPage] = useState(1)
	const [customerView, setCustomerView] = useState("card")
	const [addOpen, setAddOpen] = useState(false)
	const [selectedCustomer, setSelectedCustomer] = useState(null)
	const [partialAmount, setPartialAmount] = useState("")
	const [paymentError, setPaymentError] = useState("")
	const [saving, setSaving] = useState(false)
	const { register, control, setValue, reset, handleSubmit, formState: { errors } } = useForm({
		resolver: zodResolver(creditSchema),
		defaultValues: { customerId: "", productId: "", quantity: 1, dueDate: "" },
	})
	const selectedProductId = useWatch({ control, name: "productId" })
	const selectedCustomerId = useWatch({ control, name: "customerId" })
	const quantity = useWatch({ control, name: "quantity" })
	const dueDate = useWatch({ control, name: "dueDate" })
	const selectedProduct = products.find((product) => product.id === selectedProductId)
	const filteredCustomers = useMemo(() => {
		const query = search.trim().toLowerCase()
		if (!query) return customers
		return customers.filter((customer) => customer.name.toLowerCase().includes(query) || customer.customerCode.toLowerCase().includes(query))
	}, [customers, search])
	const customerCredits = selectedCustomer ? credits.filter((entry) => entry.customerId === selectedCustomer.id) : []
	const customerPayments = selectedCustomer ? payments.filter((payment) => payment.customerId === selectedCustomer.id) : []
	const currentCustomer = selectedCustomer ? customers.find((customer) => customer.id === selectedCustomer.id) || selectedCustomer : null

	async function submitCredit(values) {
		setSaving(true)
		try {
			await ownerApi.createCredit(values)
			toast.success("Credit added", { description: "The customer balance has been updated." })
			reset()
			setAddOpen(false)
			await refresh()
		} catch (saveError) {
			toast.error("Unable to add credit", { description: saveError instanceof Error ? saveError.message : "Please try again." })
		} finally {
			setSaving(false)
		}
	}

	async function submitPayment(amount, paymentType) {
		if (!currentCustomer) return
		const parsed = paymentSchema.safeParse({ amount })
		if (!parsed.success) {
			setPaymentError(parsed.error.issues[0]?.message || "Enter a valid payment amount.")
			return
		}
		if (parsed.data.amount > currentCustomer.balance) {
			setPaymentError("Payment cannot exceed the outstanding balance.")
			return
		}
		setPaymentError("")
		setSaving(true)
		try {
			await ownerApi.createPayment({ customerId: currentCustomer.id, amount: parsed.data.amount, paymentType })
			toast.success(paymentType === "full" ? "Balance paid in full" : "Partial payment recorded")
			setPartialAmount("")
			await refresh()
		} catch (saveError) {
			toast.error("Unable to record payment", { description: saveError instanceof Error ? saveError.message : "Please try again." })
		} finally {
			setSaving(false)
		}
	}

	return (
		<main className="flex flex-1 flex-col gap-7 bg-[#FAFAF9] p-5 md:p-7 dark:bg-background">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div><h1 className="text-3xl font-bold tracking-tight text-[#171717] dark:text-foreground md:text-4xl">Credit Ledger</h1><p className="text-muted-foreground">Track customer credit and record payments.</p></div>
				<Button className="bg-[#8B4E2F] text-white hover:bg-[#713D24]" onClick={() => setAddOpen(true)} disabled={!customers.length || !products.length}><Plus /> Add Credit</Button>
			</div>

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative max-w-md"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search customer name or ID..." value={search} onChange={(event) => { setSearch(event.target.value); setCreditPage(1); setCustomerPage(1) }} /></div>
				<div className="flex items-center gap-1 rounded-lg border p-1" aria-label="Customer display mode">
					<Button type="button" size="sm" variant={customerView === "card" ? "default" : "ghost"} aria-pressed={customerView === "card"} title="Show customers as cards" onClick={() => setCustomerView("card")}><Grid2X2 /><span className="sr-only">Card view</span></Button>
					<Button type="button" size="sm" variant={customerView === "table" ? "default" : "ghost"} aria-pressed={customerView === "table"} title="Show customers as a table" onClick={() => setCustomerView("table")}><List /><span className="sr-only">Table view</span></Button>
				</div>
			</div>

			{error && <Card className="border-destructive"><CardContent className="pt-6 text-sm text-destructive">{error}</CardContent></Card>}

			<section>
				{customerView === "card" ? (
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{loading && <Card><CardContent className="pt-6 text-sm text-muted-foreground">Loading customers...</CardContent></Card>}
						{!loading && filteredCustomers.length === 0 && <Card><CardContent className="pt-6 text-sm text-muted-foreground">No customers match this search.</CardContent></Card>}
						{!loading && filteredCustomers.map((customer) => (
							<Card key={customer.id} className="cursor-pointer border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-border dark:bg-card" onClick={() => setSelectedCustomer(customer)}>
								<CardHeader><div className="flex items-start justify-between gap-2"><div><CardTitle>{customer.name}</CardTitle><CardDescription>{customer.customerCode}</CardDescription></div><Badge variant={customer.status === "active" ? "default" : "secondary"}>{customer.status}</Badge></div></CardHeader>
								<CardContent><p className="text-lg font-semibold">{formatBalance(customer.balance)}</p><p className="text-xs text-muted-foreground">Outstanding balance</p></CardContent>
							</Card>
						))}
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

			<Card className="border-stone-200 bg-white shadow-sm dark:border-border dark:bg-card">
				<CardHeader><CardTitle>Credit Entries</CardTitle><CardDescription>Every credit entry recorded for this store.</CardDescription></CardHeader>
				<CardContent><DataTable columns={creditColumns} rows={credits} rowKey={(row) => row.id} page={creditPage} onPageChange={setCreditPage} loading={loading} error={error} emptyMessage="No credit entries yet." /></CardContent>
			</Card>

			<Dialog open={addOpen} onOpenChange={setAddOpen}>
				<DialogContent>
					<DialogHeader><DialogTitle>Add Credit</DialogTitle><DialogDescription>Select the customer and product purchased on credit.</DialogDescription></DialogHeader>
					<form className="grid gap-4" onSubmit={handleSubmit(submitCredit)}>
						<div className="grid gap-2"><Label htmlFor="credit-customer">Customer</Label><Select value={selectedCustomerId} onValueChange={(value) => setValue("customerId", value, { shouldValidate: true })}><SelectTrigger id="credit-customer" className="w-full"><SelectValue placeholder="Choose a customer" /></SelectTrigger><SelectContent>{customers.map((customer) => <SelectItem key={customer.id} value={customer.id}>{customer.name} ({customer.customerCode})</SelectItem>)}</SelectContent></Select>{errors.customerId && <p className="text-sm text-destructive">{errors.customerId.message}</p>}</div>
						<div className="grid gap-2"><Label htmlFor="credit-product">Product</Label><Select value={selectedProductId} onValueChange={(value) => setValue("productId", value, { shouldValidate: true })}><SelectTrigger id="credit-product" className="w-full"><SelectValue placeholder="Choose a product" /></SelectTrigger><SelectContent>{products.filter((product) => product.status === "active").map((product) => <SelectItem key={product.id} value={product.id}>{product.name} ({formatBalance(product.price)})</SelectItem>)}</SelectContent></Select>{errors.productId && <p className="text-sm text-destructive">{errors.productId.message}</p>}</div>
						<div className="grid gap-2"><Label htmlFor="credit-quantity">Quantity</Label><Input id="credit-quantity" type="number" min="1" {...register("quantity")} />{selectedProduct && <p className="text-xs text-muted-foreground">Subtotal: {formatBalance(selectedProduct.price * Number(quantity || 1))}</p>}{errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}</div>
						<div className="grid gap-2"><Label>Due date</Label><Popover><PopoverTrigger asChild><Button type="button" variant="outline" className="w-full justify-start font-normal">{dueDate ? new Date(`${dueDate}T00:00:00`).toLocaleDateString("en-PH") : "Choose a due date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dueDate ? new Date(`${dueDate}T00:00:00`) : undefined} onSelect={(date) => setValue("dueDate", toDateInputValue(date), { shouldValidate: true })} /></PopoverContent></Popover>{errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate.message}</p>}</div>
						<DialogFooter><Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add Credit"}</Button></DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={Boolean(selectedCustomer)} onOpenChange={(open) => { if (!open) setSelectedCustomer(null) }}>
				<DialogContent className="max-w-3xl">
					<DialogHeader><DialogTitle>{currentCustomer?.name}</DialogTitle><DialogDescription>{currentCustomer?.customerCode} · Current balance {currentCustomer ? formatBalance(currentCustomer.balance) : ""}</DialogDescription></DialogHeader>
					<div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow>{ledgerColumns.map((column) => <TableHead key={column.key}>{column.header}</TableHead>)}</TableRow></TableHeader><TableBody>{customerCredits.flatMap((entry) => entry.items).map((item) => <TableRow key={item.id}>{ledgerColumns.map((column) => <TableCell key={column.key}>{column.cell ? column.cell(item) : item[column.key]}</TableCell>)}</TableRow>)}{customerCredits.length === 0 && <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">No credit products found.</TableCell></TableRow>}</TableBody></Table></div>
					<div className="grid gap-2"><h3 className="text-sm font-medium">Payment History</h3><div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader><TableBody>{customerPayments.map((payment) => <TableRow key={payment.id}><TableCell>{new Date(payment.createdAt).toLocaleDateString("en-PH")}</TableCell><TableCell className="capitalize">{payment.paymentType}</TableCell><TableCell>{formatBalance(payment.amount)}</TableCell></TableRow>)}{customerPayments.length === 0 && <TableRow><TableCell colSpan={3} className="h-16 text-center text-muted-foreground">No payments recorded.</TableCell></TableRow>}</TableBody></Table></div></div>
					{currentCustomer && currentCustomer.balance > 0 && <div className="grid gap-3 border-t pt-4 sm:grid-cols-[auto_1fr_auto] sm:items-end"><Button onClick={() => submitPayment(currentCustomer.balance, "full")} disabled={saving}>Pay Full</Button><div className="grid gap-2"><Label htmlFor="partial-payment">Partial payment</Label><Input id="partial-payment" type="number" min="0.01" step="0.01" value={partialAmount} onChange={(event) => setPartialAmount(event.target.value)} placeholder="Enter amount" />{paymentError && <p className="text-sm text-destructive">{paymentError}</p>}</div><Button variant="outline" onClick={() => submitPayment(partialAmount, "partial")} disabled={saving}>Record Payment</Button></div>}
				</DialogContent>
			</Dialog>
		</main>
	)
}
