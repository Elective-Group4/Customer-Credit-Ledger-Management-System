import { useState } from "react"
import { Activity, CircleDollarSign, UserCheck, Users } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"

import { useOwnerDashboard } from "@/hooks/use-owner-dashboard"
import { DataTable } from "@/components/owner/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"

const chartConfig = {
	active: { label: "Active", color: "var(--color-chart-2)" },
	inactive: { label: "Inactive", color: "var(--color-chart-4)" },
	credit: { label: "Credit", color: "var(--color-chart-1)" },
	payments: { label: "Payments", color: "var(--color-chart-2)" },
}

const rankingColumns = [
	{ key: "rank", header: "Rank", cell: (_row, index) => index + 1 },
	{ key: "name", header: "Customer Name", cell: (row) => row.name },
	{ key: "balance", header: "Credit Balance", cell: (row) => `PHP ${row.balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` },
]

function StatCard({ title, value, description, icon: Icon }) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				<Icon className="size-5 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-semibold">{value}</div>
				<p className="text-xs text-muted-foreground">{description}</p>
			</CardContent>
		</Card>
	)
}

export default function OwnerDashboard() {
	const { data, loading, error, refresh } = useOwnerDashboard()
	const [page, setPage] = useState(1)
	const totals = data?.totals
	const ranking = data?.ranking || []
	const customerStatus = totals
		? [
			{ name: "Active", value: totals.activeCustomers, fill: "var(--color-active)" },
			{ name: "Inactive", value: Math.max(0, totals.totalCustomers - totals.activeCustomers), fill: "var(--color-inactive)" },
		]
		: []

	return (
		<main className="flex flex-1 flex-col gap-6 p-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Owner Dashboard</h1>
					<p className="text-muted-foreground">A current view of customers, credit, and payments.</p>
				</div>
				<Button variant="outline" onClick={refresh} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</Button>
			</div>

			{error && <Card className="border-destructive"><CardContent className="pt-6 text-sm text-destructive">{error}</CardContent></Card>}

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard title="Total Customers" value={loading ? "..." : totals?.totalCustomers ?? 0} description="Customers in this store" icon={Users} />
				<StatCard title="Overall Balance" value={loading ? "..." : `PHP ${(totals?.overallBalance ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`} description="Outstanding credit" icon={CircleDollarSign} />
				<StatCard title="Active Customers" value={loading ? "..." : totals?.activeCustomers ?? 0} description="Currently active accounts" icon={UserCheck} />
				<StatCard title="Due This Month" value={loading ? "..." : totals?.customersDueThisMonth ?? 0} description="Customers with a monthly due date" icon={Activity} />
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader><CardTitle>Customer Status</CardTitle><CardDescription>Active and inactive customer accounts.</CardDescription></CardHeader>
					<CardContent>
						{customerStatus.some((item) => item.value > 0) ? (
							<ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
								<PieChart><ChartTooltip content={<ChartTooltipContent hideLabel />} /><Pie data={customerStatus} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}>{customerStatus.map((item) => <Cell key={item.name} fill={item.fill} />)}</Pie></PieChart>
							</ChartContainer>
						) : <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">No customer data yet.</div>}
					</CardContent>
				</Card>

				<Card>
					<CardHeader><CardTitle>Credit by Month</CardTitle><CardDescription>Credit entries and recorded payments.</CardDescription></CardHeader>
					<CardContent>
						{data?.monthlyCredit?.length ? (
							<ChartContainer config={chartConfig} className="min-h-[280px] w-full">
								<BarChart accessibilityLayer data={data.monthlyCredit}><CartesianGrid vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="credit" fill="var(--color-credit)" radius={4} /><Bar dataKey="payments" fill="var(--color-payments)" radius={4} /></BarChart>
							</ChartContainer>
						) : <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">No monthly credit data yet.</div>}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader><CardTitle>Credit Ranking</CardTitle><CardDescription>Customers with the highest outstanding balances.</CardDescription></CardHeader>
				<CardContent><DataTable columns={rankingColumns} rows={ranking} rowKey={(row) => row.id} page={page} onPageChange={setPage} loading={loading} error={error} emptyMessage="No outstanding credit found." /></CardContent>
			</Card>
		</main>
	)
}
