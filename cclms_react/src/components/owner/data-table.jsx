import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export function DataTable({ columns, rows, rowKey, page, pageSize = 10, onPageChange, loading, error, emptyMessage = "No records found." }) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => <TableHead key={column.key}>{column.header}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">Loading...</TableCell></TableRow>}
            {!loading && error && <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-destructive">{error}</TableCell></TableRow>}
            {!loading && !error && visibleRows.length === 0 && <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">{emptyMessage}</TableCell></TableRow>}
            {!loading && !error && visibleRows.map((row, index) => (
              <TableRow key={rowKey(row)}>
                {columns.map((column) => <TableCell key={column.key}>{column.cell ? column.cell(row, index) : row[column.key]}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
        </div>
      </div>
    </div>
  )
}
