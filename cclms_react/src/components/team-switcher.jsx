"use client"

import * as React from "react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function TeamSwitcher({ teams }) {
  const activeTeam = teams?.[0]

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3 whitespace-nowrap group-data-[collapsible=icon]:hidden">
            <span className="text-2xl font-extrabold tracking-tight text-[#D4A017]">
              Sari-Sari
            </span>

            <span className="rounded-full bg-[#D4A017] px-3 py-1 text-xs font-bold text-white">
              ADMIN
            </span>
          </div>

          <SidebarTrigger className="h-8 w-8 shrink-0 rounded-lg text-[#6B4226] hover:bg-[#D4A017] hover:text-white" />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}