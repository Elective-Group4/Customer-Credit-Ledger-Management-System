import { useEffect, useState } from "react"
import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
} from "react-router-dom"

import LoginPage from "./components/Modules/Login/LoginPage"
import AdminDashboard from "./components/Modules/Admin/AdminDashboard"
import { TooltipProvider } from "@/components/ui/tooltip"

import { supabase } from "./lib/supabase"

function AdminRoute() {
  const [status, setStatus] = useState("checking")

  useEffect(() => {
    let mounted = true

    async function checkAdminAccess() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        if (mounted) {
          setStatus("denied")
        }
        return
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()

      console.log("AdminRoute profile:", profile)
      console.log("AdminRoute error:", error)

      if (mounted) {
        setStatus(
          profile?.role === "admin"
            ? "allowed"
            : "denied"
        )
      }
    }

    checkAdminAccess()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAdminAccess()
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (status === "checking") {
    return null
  }

  return status === "allowed"
    ? <AdminDashboard />
    : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <TooltipProvider>
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
    </TooltipProvider>
  )
}