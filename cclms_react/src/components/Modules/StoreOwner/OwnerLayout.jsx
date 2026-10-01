import { Outlet } from "react-router-dom";
import { OwnerSidebar } from "@/components/owner-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useOwnerAccessGuard } from "@/hooks/use-owner-access-guard";

export default function OwnerLayout() {
  useOwnerAccessGuard();

  return (
    <SidebarProvider>
      <OwnerSidebar />
      <TooltipProvider>
        <SidebarInset>
          <header className="flex h-14 items-center border-b px-4 lg:hidden">
            <SidebarTrigger />
          </header>
          <Outlet />
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}
