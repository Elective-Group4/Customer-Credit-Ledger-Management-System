import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

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

import { Input } from "@/components/ui/input"

export default function AdminLogs() {
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  async function fetchLogs() {
    setLoading(true)

    const { data, error } = await supabase
    .from("admin_logs")
    .select(`
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
    `)
    .order("created_at", {
        ascending: false,
    })

    if (error) {
      console.error("Admin logs error:", error)
      setLogs([])
    } else {
      setLogs(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter((log) => {
    const searchText = search.toLowerCase()

    return (
      log.action?.toLowerCase().includes(searchText) ||
      log.target_name?.toLowerCase().includes(searchText) ||
      log.admin?.full_name?.toLowerCase().includes(searchText) ||
      log.admin?.email?.toLowerCase().includes(searchText) ||
      log.ip_address?.toString().includes(searchText)
    )
  })

  function formatDate(date) {
    return new Date(date).toLocaleString()
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">

      <div>
        <h2 className="text-2xl font-bold">
          Admin Logs
        </h2>

        <p className="text-muted-foreground">
          View administrator activity and system actions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Activity Logs
          </CardTitle>

          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading logs...
            </p>
          ) : (
            <div className="rounded-md border">

              <Table>

                <TableHeader>
                  <TableRow>

                    <TableHead>
                      Date & Time
                    </TableHead>

                    <TableHead>
                      Admin
                    </TableHead>

                    <TableHead>
                      Action
                    </TableHead>

                    <TableHead>
                      Target
                    </TableHead>

                    <TableHead>
                      IP Address
                    </TableHead>

                  </TableRow>
                </TableHeader>

                <TableBody>

                  {filteredLogs.length === 0 ? (

                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        No logs found.
                      </TableCell>
                    </TableRow>

                  ) : (

                    filteredLogs.map((log) => (

                      <TableRow key={log.id}>

                        <TableCell>
                          {formatDate(log.created_at)}
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {log.admin?.full_name || "Unknown"}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {log.admin?.email || "Unknown"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          {log.action}
                        </TableCell>

                        <TableCell>
                          {log.target_name || "-"}
                        </TableCell>

                        <TableCell>
                          {log.ip_address || "-"}
                        </TableCell>

                      </TableRow>

                    ))

                  )}

                </TableBody>

              </Table>

            </div>
          )}
        </CardContent>
      </Card>

    </main>
  )
}