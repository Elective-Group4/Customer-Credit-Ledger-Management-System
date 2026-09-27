import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { TooltipProvider } from "@/components/ui/tooltip"

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <TooltipProvider>
        <SidebarInset>
          <Outlet />
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  )
}