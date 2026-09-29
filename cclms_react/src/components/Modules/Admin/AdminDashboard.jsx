import * as React from "react"
import {
  Users,
  UserCheck,
  UserPlus,
  UserX,
  RefreshCw,
  CalendarDays,
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
  active: {
    label: "Active Owners",
    color: "#8B4E2F",
  },
  inactive: {
    label: "Inactive Owners",
    color: "#E7E5E4",
  },
  owners: {
    label: "Owners",
    color: "#8B4E2F",
  },
}


export default function AdminDashboard() {
  const [owners, setOwners] = React.useState([])
  const [currentDateTime, setCurrentDateTime] = React.useState(new Date())
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")


  // ==============================
  // LIVE DATE & TIME
  // ==============================

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


  // ==============================
  // FETCH DASHBOARD DATA
  // ==============================

  const fetchDashboardData = React.useCallback(async () => {
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
  }, [])


  React.useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])


  // ==============================
  // OWNER STATISTICS
  // ==============================

  const totalOwners = owners.length

  // Currently every owner account is considered active.
  // If a status column is added later, this can be changed.
  const activeOwners = owners.length

  const inactiveOwners = Math.max(totalOwners - activeOwners, 0)


  // ==============================
  // MONTHLY OWNER REGISTRATIONS
  // ==============================

  const monthlyOwnerData = React.useMemo(() => {
    const months = {}

    owners.forEach((owner) => {
      if (!owner.created_at) return

      const date = new Date(owner.created_at)

      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`

      if (!months[monthKey]) {
        months[monthKey] = {
          date,
          owners: 0,
        }
      }

      months[monthKey].owners++
    })

    return Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, value]) => ({
        month: value.date.toLocaleDateString("en-PH", {
          month: "short",
          year: "numeric",
        }),
        owners: value.owners,
      }))
  }, [owners])


  // ==============================
  // OWNER STATUS DATA
  // ==============================

  const ownerStatusData = [
    {
      name: "Active Owners",
      value: activeOwners,
      fill: "#8B4E2F",
    },
    {
      name: "Inactive Owners",
      value: inactiveOwners,
      fill: "#E7E5E4",
    },
  ]


  // ==============================
  // RECENT OWNERS
  // ==============================

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
    <div className="flex flex-1 flex-col gap-7 bg-[#FAFAF9] p-5 md:p-7">


      {/* ==============================
          HEADER
      ============================== */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#8B4E2F]" />

            <span className="text-sm font-medium text-[#8B4E2F]">
              CCLMS Administration
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#171717] md:text-4xl">
            Admin Dashboard
          </h1>

          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Monitor owner accounts and system activity.
          </p>
        </div>


        <div className="flex items-center gap-3">

          {/* DATE/TIME */}

          <div className="hidden items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-2.5 shadow-sm sm:flex">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5EEE9]">
              <CalendarDays className="h-4 w-4 text-[#8B4E2F]" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                {formattedDate}
              </p>

              <p className="text-sm font-semibold text-[#171717]">
                {formattedTime}
              </p>
            </div>

          </div>

        </div>

      </div>


      {/* ==============================
          ERROR
      ============================== */}

      {error && (
        <Card className="border-red-200 bg-red-50 shadow-sm">
          <CardContent className="flex items-center justify-between gap-4 p-4">

            <div>
              <p className="font-medium text-red-800">
                Unable to load dashboard
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>

            <Button
              variant="outline"
              onClick={fetchDashboardData}
              className="border-red-200 bg-white hover:bg-red-50"
            >
              Try Again
            </Button>

          </CardContent>
        </Card>
      )}


      {/* ==============================
          STATISTICS
      ============================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">


        {/* TOTAL OWNERS */}

        <Card className="relative overflow-hidden border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">

          <div className="absolute left-0 top-0 h-full w-1 bg-[#8B4E2F]" />

          <CardHeader className="flex flex-row items-center justify-between pb-3 pl-6">

            <div>
              <CardDescription className="text-sm font-medium">
                Total Owners
              </CardDescription>

              <CardTitle className="mt-2 text-3xl font-bold tracking-tight text-[#171717]">
                {loading ? "..." : totalOwners}
              </CardTitle>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5EEE9]">
              <Users className="h-5 w-5 text-[#8B4E2F]" />
            </div>

          </CardHeader>

          <CardContent className="pl-6">
            <p className="text-xs text-muted-foreground">
              Registered owner accounts
            </p>
          </CardContent>

        </Card>


        {/* ACTIVE OWNERS */}

        <Card className="relative overflow-hidden border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">

          <div className="absolute left-0 top-0 h-full w-1 bg-emerald-600" />

          <CardHeader className="flex flex-row items-center justify-between pb-3 pl-6">

            <div>
              <CardDescription className="text-sm font-medium">
                Active Owners
              </CardDescription>

              <CardTitle className="mt-2 text-3xl font-bold tracking-tight text-[#171717]">
                {loading ? "..." : activeOwners}
              </CardTitle>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <UserCheck className="h-5 w-5 text-emerald-600" />
            </div>

          </CardHeader>

          <CardContent className="pl-6">
            <p className="text-xs text-muted-foreground">
              Currently active owners
            </p>
          </CardContent>

        </Card>


        {/* INACTIVE OWNERS */}

        <Card className="relative overflow-hidden border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">

          <div className="absolute left-0 top-0 h-full w-1 bg-stone-400" />

          <CardHeader className="flex flex-row items-center justify-between pb-3 pl-6">

            <div>
              <CardDescription className="text-sm font-medium">
                Inactive Owners
              </CardDescription>

              <CardTitle className="mt-2 text-3xl font-bold tracking-tight text-[#171717]">
                {loading ? "..." : inactiveOwners}
              </CardTitle>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100">
              <UserX className="h-5 w-5 text-stone-500" />
            </div>

          </CardHeader>

          <CardContent className="pl-6">
            <p className="text-xs text-muted-foreground">
              Currently inactive owners
            </p>
          </CardContent>

        </Card>


        {/* NEWEST OWNER */}

        <Card className="relative overflow-hidden border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">

          <div className="absolute left-0 top-0 h-full w-1 bg-[#D99A16]" />

          <CardHeader className="flex flex-row items-center justify-between pb-3 pl-6">

            <div className="min-w-0">
              <CardDescription className="text-sm font-medium">
                Newest Owner
              </CardDescription>

              {loading ? (
                <CardTitle className="mt-2 text-2xl font-bold">
                  ...
                </CardTitle>
              ) : recentOwners.length > 0 ? (
                <CardTitle className="mt-2 truncate text-2xl font-bold tracking-tight text-[#171717]">
                  {recentOwners[0].full_name || "Unnamed"}
                </CardTitle>
              ) : (
                <CardTitle className="mt-2 text-2xl font-bold tracking-tight text-[#171717]">
                  None
                </CardTitle>
              )}
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF7DF]">
              <UserPlus className="h-5 w-5 text-[#B47A00]" />
            </div>

          </CardHeader>

          <CardContent className="pl-6">
            <p className="text-xs text-muted-foreground">
              {recentOwners.length > 0
                ? formatDate(recentOwners[0].created_at)
                : "No owner accounts yet"}
            </p>
          </CardContent>

        </Card>

      </div>


      {/* ==============================
          ANALYTICS
      ============================== */}

      <div className="grid gap-5 lg:grid-cols-5">


        {/* OWNER STATUS */}

        <Card className="border-stone-200 bg-white shadow-sm lg:col-span-2">

          <CardHeader className="border-b border-stone-100 pb-4">

            <CardTitle className="text-lg">
              Owner Status
            </CardTitle>

            <CardDescription>
              Current distribution of owner accounts.
            </CardDescription>

          </CardHeader>


          <CardContent className="pt-5">

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
                    data={ownerStatusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={68}
                    outerRadius={88}
                    paddingAngle={3}
                    cornerRadius={6}
                    strokeWidth={0}
                    startAngle={90}
                    endAngle={-270}
                    isAnimationActive
                    animationDuration={700}
                  >

                    {ownerStatusData.map((entry, index) => (
                      <Cell
                        key={`status-${index}`}
                        fill={entry.fill}
                      />
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
                                y={(viewBox.cy || 0) + 23}
                                className="fill-muted-foreground text-xs"
                              >
                                Total Owners
                              </tspan>

                            </text>
                          )
                        }

                        return null
                      }}
                    />

                  </Pie>

                </PieChart>

              </ChartContainer>


              {/* STATUS DETAILS */}

              <div className="w-full max-w-[220px] space-y-4">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <span className="h-2.5 w-2.5 rounded-full bg-[#8B4E2F]" />

                    <span className="text-sm text-muted-foreground">
                      Active
                    </span>

                  </div>

                  <span className="font-semibold">
                    {loading ? "..." : activeOwners}
                  </span>

                </div>


                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />

                    <span className="text-sm text-muted-foreground">
                      Inactive
                    </span>

                  </div>

                  <span className="font-semibold">
                    {loading ? "..." : inactiveOwners}
                  </span>

                </div>


                <div className="border-t border-stone-100 pt-4">

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Owner accounts are currently considered active when
                    they are registered in the system.
                  </p>

                </div>

              </div>

            </div>

          </CardContent>

        </Card>


        {/* OWNER REGISTRATIONS */}

        <Card className="border-stone-200 bg-white shadow-sm lg:col-span-3">

          <CardHeader className="border-b border-stone-100 pb-4">

            <CardTitle className="text-lg">
              Owner Registrations
            </CardTitle>

            <CardDescription>
              Number of owners registered by month.
            </CardDescription>

          </CardHeader>


          <CardContent className="pt-5">

            {monthlyOwnerData.length === 0 && !loading ? (

              <div className="flex h-[260px] items-center justify-center">

                <div className="text-center">

                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">
                    <Users className="h-5 w-5 text-stone-400" />
                  </div>

                  <p className="text-sm font-medium">
                    No registration data
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Owner registrations will appear here.
                  </p>

                </div>

              </div>

            ) : (

              <ChartContainer
                config={chartConfig}
                className="h-[260px] w-full"
              >

                <BarChart
                  accessibilityLayer
                  data={monthlyOwnerData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -15,
                    bottom: 0,
                  }}
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
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                    className="text-xs"
                  />

                  <ChartTooltip
                    cursor={{
                      fill: "#F5EEE9",
                    }}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                      />
                    }
                  />

                  <Bar
                    dataKey="owners"
                    name="Owners"
                    fill="#8B4E2F"
                    radius={[6, 6, 2, 2]}
                    maxBarSize={55}
                  />

                </BarChart>

              </ChartContainer>

            )}

          </CardContent>

        </Card>

      </div>


      {/* ==============================
          RECENT OWNERS
      ============================== */}

      <Card className="border-stone-200 bg-white shadow-sm">

        <CardHeader className="border-b border-stone-100 pb-4">

          <div className="flex items-center justify-between">

            <div>

              <CardTitle className="text-lg">
                Recent Owners
              </CardTitle>

              <CardDescription className="mt-1">
                Recently registered owner accounts.
              </CardDescription>

            </div>

            <div className="hidden rounded-lg bg-[#F5EEE9] px-3 py-1.5 text-xs font-medium text-[#8B4E2F] sm:block">
              {totalOwners} Total
            </div>

          </div>

        </CardHeader>


        <CardContent className="p-0">


          {/* LOADING */}

          {loading ? (

            <div className="flex items-center justify-center py-12">

              <div className="flex items-center gap-2 text-sm text-muted-foreground">

                <RefreshCw className="h-4 w-4 animate-spin" />

                Loading owners...

              </div>

            </div>

          ) : recentOwners.length === 0 ? (

            <div className="flex flex-col items-center justify-center py-12 text-center">

              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">

                <Users className="h-5 w-5 text-stone-400" />

              </div>

              <p className="text-sm font-medium">
                No owner accounts found
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Registered owners will appear here.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-stone-100">

              {recentOwners.map((owner, index) => (

                <div
                  key={owner.id}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-stone-50 md:px-6"
                >

                  <div className="flex min-w-0 items-center gap-4">

                    {/* AVATAR */}

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5EEE9] text-sm font-semibold text-[#8B4E2F]">

                      {owner.full_name
                        ? owner.full_name
                            .split(" ")
                            .slice(0, 2)
                            .map((name) => name[0])
                            .join("")
                            .toUpperCase()
                        : "OW"}

                    </div>


                    {/* OWNER INFO */}

                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold text-[#171717]">
                        {owner.full_name || "Unnamed Owner"}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Owner account
                      </p>

                    </div>

                  </div>


                  {/* STATUS + DATE */}

                  <div className="flex shrink-0 items-center gap-4">

                    <div className="hidden text-right sm:block">

                      <p className="text-xs text-muted-foreground">
                        Registered
                      </p>

                      <p className="mt-0.5 text-sm font-medium">
                        {formatDate(owner.created_at)}
                      </p>

                    </div>


                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">

                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />

                      Active

                    </div>

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