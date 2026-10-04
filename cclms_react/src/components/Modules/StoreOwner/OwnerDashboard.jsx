import { useState } from "react";
import {
  Activity,
  CircleDollarSign,
  UserCheck,
  Users,
  ShoppingBasket,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import { useOwnerDashboard } from "@/hooks/use-owner-dashboard";
import { DataTable } from "@/components/owner/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";

const chartConfig = {
  active: { label: "Active", color: "#8B4E2F" },
  inactive: { label: "Inactive", color: "#E7E5E4" },
  credit: { label: "Credit", color: "#8B4E2F" },
  payments: { label: "Payments", color: "#D99A16" },
};

const rankingColumns = [
  { key: "rank", header: "Rank", cell: (_row, index) => index + 1 },
  { key: "name", header: "Customer Name", cell: (row) => row.name },
  {
    key: "balance",
    header: "Credit Balance",
    cell: (row) =>
      `PHP ${row.balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
  },
];

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
  iconBackground,
  iconColor,
}) {
  return (
    <Card className="relative overflow-hidden border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-border dark:bg-card">
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: accent }}
      />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pl-6">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="mt-2 text-3xl font-bold tracking-tight text-[#171717] dark:text-foreground">
            {value}
          </div>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBackground, color: iconColor }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="pl-6">
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function OwnerDashboard() {
  const { data, loading, error, refresh } = useOwnerDashboard();
  const [page, setPage] = useState(1);
  const totals = data?.totals;
  const ranking = data?.ranking || [];
  const customerStatus = totals
    ? [
        { name: "Active", value: totals.activeCustomers, fill: "#8B4E2F" },
        {
          name: "Inactive",
          value: Math.max(0, totals.totalCustomers - totals.activeCustomers),
          fill: "#E7E5E4",
        },
      ]
    : [];

  return (
    <main className="flex flex-1 flex-col gap-7 bg-background p-5 md:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717] dark:text-foreground md:text-4xl">
            Owner Dashboard
          </h1>
          <p className="text-muted-foreground">
            A current view of customers, credit, and payments.
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Customers"
          value={loading ? "..." : (totals?.totalCustomers ?? 0)}
          description="Customers in this store"
          icon={Users}
          accent="#8B4E2F"
          iconBackground="#F5EEE9"
          iconColor="#8B4E2F"
        />
        <StatCard
          title="Overall Balance"
          value={
            loading
              ? "..."
              : `PHP ${(totals?.overallBalance ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
          }
          description="Outstanding credit"
          icon={CircleDollarSign}
          accent="#D99A16"
          iconBackground="#FFF7DF"
          iconColor="#B47A00"
        />
        <StatCard
          title="Active Customers"
          value={loading ? "..." : (totals?.activeCustomers ?? 0)}
          description="Currently active accounts"
          icon={UserCheck}
          accent="#059669"
          iconBackground="#ECFDF5"
          iconColor="#059669"
        />
        <StatCard
          title="Active Products"
          value={loading ? "..." : (totals?.listProducts ?? 0)}
          description="Total products in the store"
          icon={ShoppingBasket}
          accent="#EF4444"
          iconBackground="#FEE2E2"
          iconColor="#DC2626"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="border-stone-200 bg-white shadow-sm dark:border-border dark:bg-card lg:col-span-2">
          <CardHeader className="border-b border-stone-100 pb-4">
            <CardTitle className="text-lg">Customer Status</CardTitle>
            <CardDescription>
              Active and inactive customer accounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customerStatus.some((item) => item.value > 0) ? (
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
                <ChartContainer
                  config={chartConfig}
                  className="h-[220px] w-[220px]"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={customerStatus}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={68}
                      outerRadius={88}
                      paddingAngle={3}
                      cornerRadius={6}
                      strokeWidth={0}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {customerStatus.map((item, index) => (
                        <Cell key={`status-${index}`} fill={item.fill} />
                      ))}
                      <Label
                        content={({ viewBox }) =>
                          viewBox && "cx" in viewBox && "cy" in viewBox ? (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {totals?.totalCustomers ?? 0}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 23}
                                className="fill-muted-foreground text-xs"
                              >
                                Total Customers
                              </tspan>
                            </text>
                          ) : null
                        }
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="w-full max-w-[220px] space-y-4">
                  {customerStatus.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-semibold">
                        {loading ? "..." : item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                No customer data yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white shadow-sm dark:border-border dark:bg-card lg:col-span-3">
          <CardHeader className="border-b border-stone-100 pb-4">
            <CardTitle className="text-lg">Credit by Month</CardTitle>
            <CardDescription>
              Credit entries and recorded payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.monthlyCredit?.length ? (
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <BarChart
                  accessibilityLayer
                  data={data.monthlyCredit}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="4 4"
                    className="stroke-stone-200"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    className="text-xs"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={30}
                    className="text-xs"
                  />
                  <ChartTooltip
                    cursor={{ fill: "#F5EEE9" }}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar
                    dataKey="credit"
                    name="Credit"
                    fill="#8B4E2F"
                    radius={[6, 6, 2, 2]}
                    maxBarSize={45}
                  />
                  <Bar
                    dataKey="payments"
                    name="Payments"
                    fill="#D99A16"
                    radius={[6, 6, 2, 2]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                No monthly credit data yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-stone-200 bg-white shadow-sm dark:border-border dark:bg-card">
        <CardHeader>
          <CardTitle>Credit Ranking</CardTitle>
          <CardDescription>
            Customers with the highest outstanding balances.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={rankingColumns}
            rows={ranking}
            rowKey={(row) => row.id}
            page={page}
            onPageChange={setPage}
            loading={loading}
            error={error}
            emptyMessage="No outstanding credit found."
          />
        </CardContent>
      </Card>
    </main>
  );
}
