import { ChartPie, CreditCard, Package, ReceiptText, Users, Store } from "lucide-react"
import { OwnerNavMain } from "@/components/owner-nav-main"
import { OwnerNavUser } from "@/components/owner-nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

const navItems = [
  { title: "Dashboard", url: "/owner", icon: ChartPie },
  { title: "Credit Ledger", url: "/owner/credits", icon: CreditCard },
  { title: "Products Management", url: "/owner/products", icon: Package },
  { title: "Transactions History", url: "/owner/transactions", icon: ReceiptText },
  { title: "Customers", url: "/owner/customers", icon: Users },
]

const teams = [{ name: "SARI-SARI", logo: Store, plan: "Store Owner" }]

export function OwnerSidebar() {
  return (
    <Sidebar collapsible="icon" className="w-64 border-r border-[#E5E7EB] bg-white">
      <SidebarHeader className="h-20 border-b border-[#E5E7EB] px-5"><TeamSwitcher teams={teams} /></SidebarHeader>
      <SidebarContent><OwnerNavMain items={navItems} /></SidebarContent>
      <SidebarFooter className="h-16"><OwnerNavUser /></SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
