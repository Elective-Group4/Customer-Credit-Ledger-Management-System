import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ChevronsUpDownIcon, LogOutIcon, MoonIcon, SunIcon, UserRound } from "lucide-react"
import { useTheme } from "next-themes"

import { useOwnerProfile } from "@/hooks/use-owner-profile"
import { supabase } from "@/lib/supabase"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"

function initials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SO"
}

export function OwnerNavUser() {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { profileQuery } = useOwnerProfile()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const profile = profileQuery.data
  const name = profile?.fullName || "Store Owner"
  const email = profile?.email || ""

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error("Logout failed", { description: error.message })
      return
    }
    toast.success("Logged out")
    navigate("/login", { replace: true })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><SidebarMenuButton size="lg" aria-label="Open owner profile menu" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"><Avatar className="h-8 w-8 rounded-lg"><AvatarImage src={profile?.avatarUrl || undefined} alt={name} /><AvatarFallback className="rounded-lg">{initials(name)}</AvatarFallback></Avatar><div className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-medium">{name}</span><span className="truncate text-xs">{email}</span></div><ChevronsUpDownIcon className="ml-auto size-4" /></SidebarMenuButton></DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
            <DropdownMenuLabel className="p-2 font-normal"><div className="flex items-center gap-2"><Avatar className="h-8 w-8 rounded-lg"><AvatarImage src={profile?.avatarUrl || undefined} alt={name} /><AvatarFallback>{initials(name)}</AvatarFallback></Avatar><div className="grid min-w-0 text-left text-sm"><span className="truncate font-medium">{name}</span><span className="truncate text-xs text-muted-foreground">{email}</span></div></div></DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/owner/profile")}><UserRound /> Profile</DropdownMenuItem>
            <DropdownMenuItem onSelect={(event) => { event.preventDefault(); setTheme(theme === "dark" ? "light" : "dark") }}>{theme === "dark" ? <SunIcon /> : <MoonIcon />} {theme === "dark" ? "Light mode" : "Dark mode"}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setLogoutOpen(true)}><LogOutIcon /> Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Log out?</AlertDialogTitle><AlertDialogDescription>You will need to sign in again to continue.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleLogout}>Log out</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </SidebarMenu>
  )
}
