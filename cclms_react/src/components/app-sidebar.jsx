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
  UserRoundGroup,
  Calendar,
  ChartPie,
  LayoutPanelTop,
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
      icon: ChartPie,
    },
    {
      title: "Owner Management",
      url: "/admin/owners",
      icon: UserRoundGroup,
    },
    {
      title: "Landing Page",
      url: "/admin/landing",
      icon: LayoutPanelTop,
    },
    {
      title: "Login Audit",
      url: "/admin/logs",
      icon: Calendar,
    },
  ],
}

export function AppSidebar({ ...props }) {
  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="w-64 border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="h-20 border-b border-[#E5E7EB] px-5">
        <TeamSwitcher teams={data.teams} role="ADMIN" />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      <SidebarFooter className="h-16">
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}