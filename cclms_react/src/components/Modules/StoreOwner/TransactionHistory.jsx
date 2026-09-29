import { useMemo, useState } from "react"
import { Download, Search } from "lucide-react"
import * as XLSX from "xlsx"
import { toast } from "sonner"

import { useOwnerTransactions } from "@/hooks/use-owner-transactions"
import { DataTable } from "@/components/owner/data-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

function formatTime(value) {
	return new Date(value).toLocaleString("en-PH", {
		dateStyle: "medium",
		timeStyle: "short",
	})
}

function toDateInputValue(date) {
	if (!date) return ""
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

export default function TransactionHistory() {
	const { transactions, loading, error } = useOwnerTransactions()
	const [search, setSearch] = useState("")
	const [date, setDate] = useState("")
	const [page, setPage] = useState(1)
	const filteredTransactions = useMemo(() => {
		const query = search.trim().toLowerCase()
		return transactions.filter((transaction) => {
			const matchesSearch = !query || transaction.id.toLowerCase().includes(query) || transaction.customerName.toLowerCase().includes(query) || transaction.products.toLowerCase().includes(query)
			const matchesDate = !date || transaction.createdAt.slice(0, 10) === date
			return matchesSearch && matchesDate
		})
	}, [date, search, transactions])
	const selectedDate = date ? new Date(`${date}T00:00:00`) : undefined

	function updateSearch(value) {
		setSearch(value)
		setPage(1)
	}

	function updateDate(value) {
		setDate(value)
		setPage(1)
	}

	function exportFilteredTransactions() {
		try {
			const rows = filteredTransactions.map((transaction) => ({
				"ID Code": transaction.id,
				Customer: transaction.customerName,
				Products: transaction.products,
				Time: formatTime(transaction.createdAt),
			}))
			const worksheet = XLSX.utils.json_to_sheet(rows)
			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions")
			XLSX.writeFile(workbook, "credit-transactions.xlsx")
			toast.success("Transactions exported", { description: `${rows.length} filtered record${rows.length === 1 ? "" : "s"} exported.` })
		} catch (exportError) {
			toast.error("Unable to export transactions", { description: exportError instanceof Error ? exportError.message : "Please try again." })
		}
	}

	const columns = [
		{ key: "id", header: "ID Code" },
		{ key: "customerName", header: "Customer" },
		{ key: "products", header: "Products" },
		{ key: "createdAt", header: "Time", cell: (row) => formatTime(row.createdAt) },
	]

	return (
		<main className="flex flex-1 flex-col gap-7 bg-[#FAFAF9] p-5 md:p-7 dark:bg-background">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-3xl font-bold tracking-tight text-[#171717] dark:text-foreground md:text-4xl">Transaction History</h1><p className="text-muted-foreground">Review and export recorded credit transactions.</p></div><Button variant="outline" className="border-stone-200 bg-white shadow-sm dark:border-border dark:bg-card" onClick={exportFilteredTransactions} disabled={loading}><Download /> Export Excel</Button></div>
			<div className="flex flex-col gap-3 sm:flex-row"><div className="relative w-full max-w-md"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search ID, customer, or product..." value={search} onChange={(event) => updateSearch(event.target.value)} /></div><Popover><PopoverTrigger asChild><Button type="button" variant="outline" className="w-full justify-start font-normal sm:max-w-xs">{selectedDate ? selectedDate.toLocaleDateString("en-PH") : "Filter by date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selectedDate} onSelect={(value) => updateDate(toDateInputValue(value))} /><div className="border-t p-2"><Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => updateDate("")} disabled={!date}>Clear date</Button></div></PopoverContent></Popover></div>
			<Card className="border-stone-200 bg-white shadow-sm dark:border-border dark:bg-card"><CardHeader><CardTitle>Transactions</CardTitle><CardDescription>{filteredTransactions.length} filtered record{filteredTransactions.length === 1 ? "" : "s"}.</CardDescription></CardHeader><CardContent><DataTable columns={columns} rows={filteredTransactions} rowKey={(row) => row.id} page={page} onPageChange={setPage} loading={loading} error={error} emptyMessage="No transactions match the current filters." /></CardContent></Card>
		</main>
	)
}
