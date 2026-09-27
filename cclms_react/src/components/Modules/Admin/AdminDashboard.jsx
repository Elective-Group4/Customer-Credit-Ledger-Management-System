import * as React from "react"
import {
  Users,
  UserCheck,
  UserPlus,
  RefreshCw,
  Store,
  ShieldAlert,
} from "lucide-react"

import { supabase } from "@/lib/supabase"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Label,
} from "recharts"

const chartConfig = {
  owners: {
    label: "Owners",
  },
}

export default function AdminDashboard() {
  const [owners, setOwners] = React.useState([])
  const [currentDateTime, setCurrentDateTime] = React.useState(new Date())
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
  const timer = setInterval(() => {
    setCurrentDateTime(new Date())
  }, 1000)

  return () => clearInterval(timer)
}, [])

const formattedDate = currentDateTime.toLocaleDateString("en-PH", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
})

const formattedTime = currentDateTime.toLocaleTimeString("en-PH", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, created_at")
        .eq("role", "owner")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Dashboard error:", error)
        throw error
      }

      setOwners(data || [])
    } catch (error) {
      console.error(error)
      setError(error.message || "Failed to load dashboard.")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchDashboardData()
  }, [])

  /*
   * ==============================
   * OWNER STATISTICS
   * ==============================
   */

  const totalOwners = owners.length

  /*
   * At the moment every profile with role = owner
   * is considered an active owner.
   *
   * If your profiles table has a status column,
   * this can later be changed to:
   *
   * owners.filter(owner => owner.status === "active").length
   */
  const activeOwners = owners.length

  /*
   * ==============================
   * MONTHLY OWNER REGISTRATIONS
   * ==============================
   */

  const monthlyOwnerData = React.useMemo(() => {
    const months = {}

    owners.forEach((owner) => {
      if (!owner.created_at) return

      const date = new Date(owner.created_at)

      const month = date.toLocaleDateString("en-PH", {
        month: "short",
        year: "numeric",
      })

      if (!months[month]) {
        months[month] = 0
      }

      months[month]++
    })

    return Object.entries(months)
      .map(([month, count]) => ({
        month,
        owners: count,
        date: new Date(month),
      }))
      .sort((a, b) => a.date - b.date)
      .map(({ month, owners }) => ({
        month,
        owners,
      }))
  }, [owners])

  /*
   * ==============================
   * OWNER PIE CHART
   * ==============================
   *
   * Currently shows:
   * Active Owners
   *
   * If inactive owners are added later,
   * we can change this to:
   *
   * Active vs Inactive
   */

  const ownerPieData = [
    {
      name: "Active Owners",
      value: activeOwners,
    },
  ]

  /*
   * ==============================
   * RECENT OWNERS
   * ==============================
   */

  const recentOwners = owners.slice(0, 5)

  const formatDate = (date) => {
    if (!date) return "Unknown"

    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">

      {/* ==============================
          HEADER
      ============================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Admin Dashboard
          </h1>

          <p className="text-muted-foreground">
            Overview of the CCLMS owner management system.
          </p>
        </div>
        <div className="mt-2">
          <p className="text-sm font-medium">
            {formattedDate}
          </p>

          <p className="text-sm text-muted-foreground">
            {formattedTime}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchDashboardData}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />

          Refresh
        </Button>

      </div>

      {/* ==============================
          ERROR
      ============================== */}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ==============================
          STATISTICS
      ============================== */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        {/* Total Owners */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Owners
            </CardTitle>

            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? "..." : totalOwners}
            </div>

            <p className="text-xs text-muted-foreground">
              Registered owner accounts
            </p>
          </CardContent>
        </Card>

        {/* Active Owners */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Owners
            </CardTitle>

            <UserCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? "..." : activeOwners}
            </div>

            <p className="text-xs text-muted-foreground">
              Currently active owners
            </p>
          </CardContent>
        </Card>


        {/* System */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Owners
            </CardTitle>

            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
          </CardHeader>

          <CardContent>

            <div className="text-lg font-bold">
              CCLMS
            </div>

            <p className="text-xs text-muted-foreground">
              Customer Credit Ledger
            </p>

          </CardContent>
        </Card>

        {/* Newest Owner */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Newest Owner
            </CardTitle>

            <UserPlus className="h-5 w-5 text-muted-foreground" />
          </CardHeader>

          <CardContent>

            {loading ? (
              <div className="text-lg font-bold">
                ...
              </div>
            ) : recentOwners.length > 0 ? (
              <>
                <div className="truncate text-lg font-bold">
                  {recentOwners[0].full_name || "Unnamed"}
                </div>

                <p className="text-xs text-muted-foreground">
                  {formatDate(recentOwners[0].created_at)}
                </p>
              </>
            ) : (
              <>
                <div className="text-lg font-bold">
                  No owners
                </div>

                <p className="text-xs text-muted-foreground">
                  No owner accounts yet
                </p>
              </>
            )}

          </CardContent>
        </Card>

        

      </div>

      {/* ==============================
          CHARTS
      ============================== */}

      <div className="grid gap-6 lg:grid-cols-2">

        {/* ==========================
            PIE CHART
        ========================== */}

        
        {/* ==============================
            OWNER DISTRIBUTION
        ============================== */}

        <Card>
          <CardHeader>
            <CardTitle>Owner Distribution</CardTitle>

            <CardDescription>
              Current owner account distribution.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />

                <Pie
                  data={ownerPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={100}
                  strokeWidth={5}
                >
                  {ownerPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} />
                  ))}

                  <Label
                    content={({ viewBox }) => {
                      if (
                        viewBox &&
                        "cx" in viewBox &&
                        "cy" in viewBox
                      ) {
                        return (
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
                              {totalOwners}
                            </tspan>

                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              Owners
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>

                <ChartLegend
                  content={<ChartLegendContent />}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* ==========================
            BAR GRAPH
        ========================== */}

        <Card>

          <CardHeader>
            <CardTitle>
              Owner Registrations
            </CardTitle>

            <CardDescription>
              Number of owners registered by month.
            </CardDescription>
          </CardHeader>

          <CardContent>

            <ChartContainer
              config={chartConfig}
              className="min-h-[300px] w-full"
            >

              <BarChart
                accessibilityLayer
                data={monthlyOwnerData}
              >

                <CartesianGrid
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />

                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />

                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent />
                  }
                />

                <Bar
                  dataKey="owners"
                  name="Owners"
                  radius={6}
                />

              </BarChart>

            </ChartContainer>

          </CardContent>

        </Card>

      </div>

      {/* ==============================
          RECENT OWNERS
      ============================== */}

      <Card>

        <CardHeader>
          <CardTitle>
            Recent Owners
          </CardTitle>

          <CardDescription>
            Recently registered owner accounts.
          </CardDescription>
        </CardHeader>

        <CardContent>

          {loading ? (

            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading owners...
            </div>

          ) : recentOwners.length === 0 ? (

            <div className="py-8 text-center text-sm text-muted-foreground">
              No owner accounts found.
            </div>

          ) : (

            <div className="space-y-3">

              {recentOwners.map((owner) => (

                <div
                  key={owner.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">

                      <Users className="h-5 w-5 text-primary" />

                    </div>

                    <div>

                      <p className="font-medium">
                        {owner.full_name || "Unnamed Owner"}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Owner
                      </p>

                    </div>

                  </div>

                  <div className="text-right">

                    <p className="text-sm font-medium">
                      Registered
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {formatDate(owner.created_at)}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          )}

        </CardContent>

      </Card>

    </div>
  )
}
