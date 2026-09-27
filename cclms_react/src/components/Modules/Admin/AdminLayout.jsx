import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { TooltipProvider } from "@/components/ui/tooltip"

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <TooltipProvider>
        <SidebarInset>
          <header className="flex h-14 items-center border-b px-4 lg:hidden">
            <SidebarTrigger />
          </header>
          <Outlet />
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  )
}