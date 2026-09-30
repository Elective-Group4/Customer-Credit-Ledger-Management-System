import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Search,
  Activity,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  UserRound,
  Globe,
} from "lucide-react";

const LOGS_PER_PAGE = 10;

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  async function fetchLogs() {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_logs")
      .select(
        `
        id,
        admin_id,
        action,
        target_user_id,
        target_name,
        ip_address,
        created_at,
        admin:profiles!admin_logs_admin_id_fkey (
          full_name,
          email
        )
      `,
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Admin logs error:", error);
      setLogs([]);
    } else {
      setLogs(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const searchText = search.toLowerCase();

    return (
      log.action?.toLowerCase().includes(searchText) ||
      log.target_name?.toLowerCase().includes(searchText) ||
      log.admin?.full_name?.toLowerCase().includes(searchText) ||
      log.admin?.email?.toLowerCase().includes(searchText) ||
      log.ip_address?.toString().includes(searchText)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / LOGS_PER_PAGE),
  );

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * LOGS_PER_PAGE,
    currentPage * LOGS_PER_PAGE,
  );

  function handleSearchChange(event) {
    setSearch(event.target.value);
    setCurrentPage(1);
  }

  function formatDate(date) {
    const formatted = new Date(date);

    return {
      date: formatted.toLocaleDateString(undefined, {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      time: formatted.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  }

  function getInitials(name) {
    if (!name) return "?";

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function getActionStyle(action) {
    const value = action?.toLowerCase() || "";

    if (
      value.includes("create") ||
      value.includes("add") ||
      value.includes("register")
    ) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (value.includes("delete") || value.includes("remove")) {
      return "bg-red-50 text-red-700 border-red-200";
    }

    if (value.includes("update") || value.includes("edit")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }

    if (value.includes("login") || value.includes("logout")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }

    return "bg-stone-100 text-stone-700 border-stone-200";
  }

  return (
    <main className="admin-theme-surface flex flex-1 flex-col gap-6 bg-background p-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B4E2F] text-white shadow-sm">
              <Activity className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                Admin Logs
              </h2>

              <p className="text-sm text-stone-500">
                Monitor administrator activity and system actions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* TOTAL LOGS */}
        <Card className="border-stone-200 bg-white shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-stone-500">Total Logs</p>

              <p className="mt-1 text-2xl font-bold text-stone-900">
                {logs.length}
              </p>

              <p className="mt-1 text-xs text-stone-400">
                Recorded system activities
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8B4E2F]/10 text-[#8B4E2F]">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* DISPLAYED LOGS */}
        <Card className="border-stone-200 bg-white shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-stone-500">Displayed</p>

              <p className="mt-1 text-2xl font-bold text-stone-900">
                {filteredLogs.length}
              </p>

              <p className="mt-1 text-xs text-stone-400">
                Matching current search
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-[#D4A017]">
              <Search className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* CURRENT PAGE */}
        <Card className="border-stone-200 bg-white shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-stone-500">Current Page</p>

              <p className="mt-1 text-2xl font-bold text-stone-900">
                {currentPage}
                <span className="text-base font-medium text-stone-400">
                  {" "}
                  / {totalPages}
                </span>
              </p>

              <p className="mt-1 text-xs text-stone-400">
                Logs per page: {LOGS_PER_PAGE}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LOGS CARD */}
      <Card className="overflow-hidden border-stone-200 bg-white shadow-sm">
        {/* HEADER */}
        <CardHeader className="border-b border-stone-100 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-stone-900">
                Activity Logs
              </CardTitle>

              <p className="mt-1 text-sm text-stone-500">
                Review recent administrator actions and system activity.
              </p>
            </div>

            {/* SEARCH */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />

              <Input
                placeholder="Search logs..."
                value={search}
                onChange={handleSearchChange}
                className="h-10 border-stone-200 bg-stone-50 pl-9 pr-4 text-sm focus-visible:ring-[#8B4E2F]"
              />
            </div>
          </div>
        </CardHeader>

        {/* CONTENT */}
        <CardContent className="p-0">
          {loading ? (
            /* LOADING STATE */
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8B4E2F]/10">
                <Activity className="h-5 w-5 animate-pulse text-[#8B4E2F]" />
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-stone-700">
                  Loading activity logs
                </p>

                <p className="mt-1 text-xs text-stone-400">
                  Please wait while we retrieve the records.
                </p>
              </div>
            </div>
          ) : (
            <div>
              {/* TABLE */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-stone-100 bg-stone-50/70 hover:bg-stone-50/70">
                      <TableHead className="h-12 px-6 text-xs font-semibold uppercase tracking-wide text-stone-500">
                        Date & Time
                      </TableHead>

                      <TableHead className="h-12 text-xs font-semibold uppercase tracking-wide text-stone-500">
                        Administrator
                      </TableHead>

                      <TableHead className="h-12 text-xs font-semibold uppercase tracking-wide text-stone-500">
                        Action
                      </TableHead>

                      <TableHead className="h-12 text-xs font-semibold uppercase tracking-wide text-stone-500">
                        Target
                      </TableHead>

                      <TableHead className="h-12 text-xs font-semibold uppercase tracking-wide text-stone-500">
                        IP Address
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedLogs.length === 0 ? (
                      /* EMPTY STATE */
                      <TableRow>
                        <TableCell colSpan={5} className="h-[280px]">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
                              <Search className="h-5 w-5 text-stone-400" />
                            </div>

                            <p className="mt-3 text-sm font-semibold text-stone-700">
                              No logs found
                            </p>

                            <p className="mt-1 max-w-sm text-xs text-stone-400">
                              Try changing your search keywords to find
                              different activity records.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedLogs.map((log) => {
                        const formattedDate = formatDate(log.created_at);

                        return (
                          <TableRow
                            key={log.id}
                            className="border-stone-100 transition-colors hover:bg-stone-50/60"
                          >
                            {/* DATE */}
                            <TableCell className="px-6 py-4">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                                  <Clock className="h-4 w-4" />
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-stone-800">
                                    {formattedDate.date}
                                  </p>

                                  <p className="mt-0.5 text-xs text-stone-400">
                                    {formattedDate.time}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            {/* ADMIN */}
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8B4E2F] text-xs font-semibold text-white">
                                  {getInitials(log.admin?.full_name)}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-stone-800">
                                    {log.admin?.full_name || "Unknown"}
                                  </p>

                                  <p className="truncate text-xs text-stone-400">
                                    {log.admin?.email || "Unknown"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            {/* ACTION */}
                            <TableCell className="py-4">
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getActionStyle(
                                  log.action,
                                )}`}
                              >
                                {log.action || "Unknown"}
                              </span>
                            </TableCell>

                            {/* TARGET */}
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                                  <UserRound className="h-4 w-4" />
                                </div>

                                <span className="text-sm text-stone-700">
                                  {log.target_name || "-"}
                                </span>
                              </div>
                            </TableCell>

                            {/* IP ADDRESS */}
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-stone-400" />

                                <span className="rounded-md bg-stone-100 px-2 py-1 font-mono text-xs text-stone-600">
                                  {log.ip_address || "-"}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* PAGINATION */}
              {filteredLogs.length > 0 && (
                <div className="flex flex-col gap-4 border-t border-stone-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-stone-500">
                    Showing{" "}
                    <span className="font-medium text-stone-700">
                      {(currentPage - 1) * LOGS_PER_PAGE + 1}
                    </span>{" "}
                    –{" "}
                    <span className="font-medium text-stone-700">
                      {Math.min(
                        currentPage * LOGS_PER_PAGE,
                        filteredLogs.length,
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-stone-700">
                      {filteredLogs.length}
                    </span>{" "}
                    logs
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((page) => page - 1)}
                      disabled={currentPage === 1}
                      className="h-9 border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex h-9 items-center rounded-md border border-stone-200 bg-stone-50 px-3 text-xs font-medium text-stone-600">
                      {currentPage} / {totalPages}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((page) => page + 1)}
                      disabled={currentPage === totalPages}
                      className="h-9 border-stone-200 bg-[#8B4E2F] text-white hover:bg-[#713D24] hover:text-white"
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
