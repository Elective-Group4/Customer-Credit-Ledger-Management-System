import {
  ChartPie,
  CreditCard,
  Package,
  ReceiptText,
  Users,
  Store,
  BookOpenText,
} from "lucide-react";
import { OwnerNavMain } from "@/components/owner-nav-main";
import { OwnerNavUser } from "@/components/owner-nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/owner", icon: ChartPie },
  { title: "Customers", url: "/owner/customers", icon: Users },
  { title: "Products Management", url: "/owner/products", icon: Package },
  { title: "Credit Ledger", url: "/owner/credits", icon: CreditCard },
  {
    title: "Transactions History",
    url: "/owner/transactions",
    icon: ReceiptText,
  },
  { title: "Owner Manual", url: "/owner/manual", icon: BookOpenText },
];

const teams = [{ name: "SARI-SARI", logo: Store, plan: "Store Owner" }];

export function OwnerSidebar() {
  return (
    <Sidebar
      collapsible="icon"
      className="w-64 border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="h-20 border-b border-sidebar-border px-5">
        <TeamSwitcher teams={teams} role="OWNER" />
      </SidebarHeader>
      <SidebarContent>
        <OwnerNavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter className="h-16">
        <OwnerNavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
