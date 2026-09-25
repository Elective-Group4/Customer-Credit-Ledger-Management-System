import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function AdminDashboard() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <TooltipProvider>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />

          <div className="h-4 w-px bg-border" />

          <h1 className="font-semibold">
            Admin Dashboard
          </h1>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6">
          <div>
            <h2 className="text-2xl font-bold">
              Dashboard
            </h2>

            <p className="text-muted-foreground">
              Welcome to the system administration panel.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Store Owners
              </p>

              <p className="mt-2 text-3xl font-bold">
                0
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Customers
              </p>

              <p className="mt-2 text-3xl font-bold">
                0
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Transactions
              </p>

              <p className="mt-2 text-3xl font-bold">
                0
              </p>
            </div>
          </div>
        </main>
      </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  )
}