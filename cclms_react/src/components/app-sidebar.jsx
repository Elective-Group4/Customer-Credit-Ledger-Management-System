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
      title: "Owner Management",
      url: "/admin/owner",
      icon: UserRoundGroup,
    },
    {
      title: "Login Audit",
      url: "/admin/audit",
      icon: Calendar,
    },
  ],
}

export function AppSidebar({ ...props }) {
  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="w-64 border-r border-[#E5E7EB] bg-white"
    >
      <SidebarHeader className="h-20 border-b border-[#E5E7EB] px-5">
        <TeamSwitcher teams={data.teams} />
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