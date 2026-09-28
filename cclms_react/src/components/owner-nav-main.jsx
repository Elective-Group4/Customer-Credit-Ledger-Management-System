import { Link, useLocation } from "react-router-dom"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

export function OwnerNavMain({ items }) {
  const location = useLocation()

  return (
    <SidebarMenu className="px-3 py-4">
      {items.map((item) => {
        const isActive = location.pathname === item.url
        return (
          <SidebarMenuItem key={item.title} className="mb-2">
            <SidebarMenuButton asChild tooltip={item.title} className={isActive ? "h-12 rounded-lg bg-[#6B4226] px-4 text-base text-white hover:bg-[#B8860B] hover:text-white" : "h-12 rounded-lg px-4 text-base text-black hover:bg-[#F3F4F6] hover:text-[#6B4226]"}>
              <Link to={item.url}><item.icon className="size-5" /><span>{item.title}</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
