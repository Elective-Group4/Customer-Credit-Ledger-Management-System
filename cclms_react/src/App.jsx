import { lazy, Suspense, useEffect, useState } from "react"

import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
} from "react-router-dom"

// Components
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Modules
import LoginPage from "./components/Modules/Login/LoginPage"
import LandingPage from "./components/Modules/LandingPage/LandingPage"
import AdminDashboard from "./components/Modules/Admin/AdminDashboard"
import OwnerManagement from "./components/Modules/Admin/OwnerManagement"
import AdminLayout from "./components/Modules/Admin/AdminLayout"
import AdminLogs from "./components/Modules/Admin/AdminLogs"
import LandingPageManagement from "./components/Modules/Admin/LandingPageManagement"
import OwnerLayout from "./components/Modules/StoreOwner/OwnerLayout"
import OwnerDashboard from "./components/Modules/StoreOwner/OwnerDashboard"
import CreditTab from "./components/Modules/StoreOwner/CreditTab"
import ProductManagement from "./components/Modules/StoreOwner/ProductManagement"
import TransactionHistory from "./components/Modules/StoreOwner/TransactionHistory"
import CustomerManagement from "./components/Modules/StoreOwner/CutomerManagement"

import { supabase } from "./lib/supabase"

const queryClient = new QueryClient()
const OwnerProfile = lazy(() => import("./components/Modules/StoreOwner/OwnerProfile"))


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

function OwnerRoute({ children }) {
  const [status, setStatus] = useState("checking")

  useEffect(() => {
    let mounted = true

    async function checkOwnerAccess() {
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

      if (!mounted) return

      if (error || profile?.role !== "owner") {
        setStatus("denied")
        return
      }

      setStatus("allowed")
    }

    checkOwnerAccess()

    return () => {
      mounted = false
    }
  }, [])

  if (status === "checking") return null
  if (status === "denied") return <Navigate to="/login" replace />

  return children
}


export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
              <LandingPage />
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
            <Route
              path="landing"
              element={<LandingPageManagement />}
            />
          </Route>

          <Route
            path="/owner"
            element={
              <OwnerRoute>
                <OwnerLayout />
              </OwnerRoute>
            }
          >
            <Route index element={<OwnerDashboard />} />
            <Route path="profile" element={<Suspense fallback={<div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">Loading profile...</div>}><OwnerProfile /></Suspense>} />
            <Route path="credits" element={<CreditTab />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="transactions" element={<TransactionHistory />} />
            <Route path="customers" element={<CustomerManagement />} />
          </Route>
            


          {/* ================================
              UNKNOWN ROUTE
          ================================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </BrowserRouter>

      </TooltipProvider>
    </QueryClientProvider>
  )
}