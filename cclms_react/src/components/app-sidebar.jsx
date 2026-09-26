"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import {
  GalleryVerticalEndIcon,
  LayoutDashboardIcon,
  StoreIcon,
  PackageIcon,
  ClipboardListIcon,
  Settings2Icon,
  UserRoundGroup,
  PersonStanding,
  PhilippinePeso,
  CreditCard,
  MessageSquareWarning,
  Columns3Cog,
} from "lucide-react"

const data = {
  user: {
    name: "System Administrator",
    email: "admin.local@gmail.com",
    avatar: "/avatars/admin.jpg",
  },

  teams: [
    {
      name: "SARI-SARI",
      logo: GalleryVerticalEndIcon,
      plan: "Administration",
    },
  ],

  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Products",
      url: "/admin/products",
      icon: PackageIcon,
    },
    {
      title: "Staff",
      url: "/admin/staff",
      icon: UserRoundGroup,
    },
    {
      title: "Customers",
      url: "/admin/customers",
      icon: PersonStanding,
    },
    {
      title: "Transactions/Ledger",
      url: "/admin/transactions",
      icon: PhilippinePeso,
    },
    {
      title: "Payments",
      url: "/admin/payments",
      icon: CreditCard,
    },
    {
      title: "Reports",
      url: "/admin/reports",
      icon: MessageSquareWarning,
    },
    {
      title: "Store Settings",
      url: "/admin/storesettings",
      icon: Columns3Cog,
    },
  ],
}

export function AppSidebar({ ...props }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}