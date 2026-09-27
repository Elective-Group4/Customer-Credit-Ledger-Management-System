import { useEffect, useState } from "react"

import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
} from "react-router-dom"

// Components
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

// Modules
import LoginPage from "./components/Modules/Login/LoginPage"
import AdminDashboard from "./components/Modules/Admin/AdminDashboard"
import OwnerManagement from "./components/Modules/Admin/OwnerManagement"
import AdminLayout from "./components/Modules/Admin/AdminLayout"
import AdminLogs from "./components/Modules/Admin/AdminLogs"

import { supabase } from "./lib/supabase"


function AdminRoute({ children }) {
  const [status, setStatus] = useState("checking")

  useEffect(() => {
    let mounted = true

    async function checkAdminAccess() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      if (!session?.user) {
        setStatus("denied")
        return
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()

      console.log("Current session:", session.user.email)
      console.log("Profile:", profile)
      console.log("Profile error:", error)

      if (!mounted) return

      if (error) {
        console.error("Failed to check admin role:", error)
        setStatus("denied")
        return
      }

      if (profile?.role === "admin") {
        setStatus("allowed")
      } else {
        console.log("User role is:", profile?.role)
        setStatus("denied")
      }
    }

    checkAdminAccess()

    return () => {
      mounted = false
    }
  }, [])

  if (status === "checking") {
    return null
  }

  if (status === "denied") {
    return <Navigate to="/login" replace />
  }

  return children
}


export default function App() {
  return (
    <TooltipProvider>

      <BrowserRouter>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0B1F3A",
              color: "#FFFFFF",
              border: "1px solid #163A5F",
            },
          }}
        />

        <Routes>

          {/* ================================
              DEFAULT
          ================================= */}

          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />


          {/* ================================
              LOGIN
          ================================= */}

          <Route
            path="/login"
            element={
              <LoginPage />
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route
              index
              element={<AdminDashboard />}
            />

            <Route
              path="owners"
              element={<OwnerManagement />}
            />
            <Route
              path="logs"
              element={<AdminLogs />}
            />
          </Route>
            


          {/* ================================
              UNKNOWN ROUTE
          ================================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

        </Routes>

      </BrowserRouter>

    </TooltipProvider>
  )
}