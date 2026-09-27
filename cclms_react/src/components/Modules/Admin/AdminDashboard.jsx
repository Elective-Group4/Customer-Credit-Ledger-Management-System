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