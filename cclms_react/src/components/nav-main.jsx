import { Link, useLocation } from "react-router-dom"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export function NavMain({ items }) {
  const location = useLocation()

  return (
    <SidebarMenu className="px-3 py-4">
      {items.map((item) => {
        const isActive = location.pathname === item.url

        return (
          <SidebarMenuItem key={item.title} className="mb-2">
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              className={`h-12 rounded-lg px-4 text-base transition-colors ${
                isActive
                  ? "bg-[#6B4226] text-white hover:bg-[#B8860B] hover:text-white"
                  : "text-black hover:bg-[#F3F4F6] hover:text-[#6B4226]"
              }`}
            >
              <Link to={item.url}>
                <item.icon className="size-5" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}