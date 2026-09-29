import { useState } from "react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { getClientIp } from "@/lib/client-ip"
import { useNavigate } from "react-router-dom"
import { useTheme } from "next-themes"
import {
  ChevronsUpDownIcon,
  LogOutIcon,
  SunIcon,
  MoonIcon,
} from "lucide-react"

export function NavUser({
  user
}) {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const isDark = theme === "dark"

  function toggleTheme(e) {
    // Prevent the dropdown from closing when toggling
    e.preventDefault()
    setTheme(isDark ? "light" : "dark")
  }

  async function handleLogout() {
  // Get current user BEFORE signing out
    const {
      data: { user }, 
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("Get user error:", userError)
    }

    console.log("Logout user:", user)

    if (user) {
      const ipAddress = await getClientIp()
      const { data: logData, error: logError } = await supabase
        .from("admin_logs")
        .insert({
          admin_id: user.id,
          action: "LOGOUT",
          ip_address: ipAddress,
        })
        .select()

      console.log("Logout log data:", logData)
      console.log("Logout log error:", logError)

      if (logError) {
        toast.error("Logout log failed", {
          description: logError.message,
        })
        return
      }
    }

    // Only sign out after the log was successfully created
    const { error } = await supabase.auth.signOut()

    if (error) {
      toast.error("Logout failed", {
        description: error.message,
      })
      return
    }

    toast.success("Logged out", {
      description: "You have been signed out of the admin dashboard.",
    })

    navigate("/login", { replace: true })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={toggleTheme}>
                {isDark ? <SunIcon /> : <MoonIcon />}
                {isDark ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 rounded-lg text-red-500 focus:bg-red-100 focus:text-red-600"
              onSelect={(e) => {
                e.preventDefault()
                setLogoutDialogOpen(true)
              }}
            >
              
              <LogOutIcon style={{ color: "#ef4444", stroke: "#ef4444" }} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to log out of the admin dashboard? You'll need to sign in again to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-500 text-white hover:bg-red-600">
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarMenu>
  )
}