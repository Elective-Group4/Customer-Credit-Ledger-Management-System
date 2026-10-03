import { lazy, Suspense, useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";

import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

// Components
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Modules
import LoginPage from "./components/Modules/Login/LoginPage";
import LandingPage from "./components/Modules/LandingPage/LandingPage";
import StoreLoader from "./components/Modules/LandingPage/StoreLoader";
import AdminDashboard from "./components/Modules/Admin/AdminDashboard";
import OwnerManagement from "./components/Modules/Admin/OwnerManagement";
import AdminLayout from "./components/Modules/Admin/AdminLayout";
import AdminLogs from "./components/Modules/Admin/AdminLogs";
import LandingPageManagement from "./components/Modules/Admin/LandingPageManagement";
import OwnerLayout from "./components/Modules/StoreOwner/OwnerLayout";
import OwnerDashboard from "./components/Modules/StoreOwner/OwnerDashboard";
import CreditTab from "./components/Modules/StoreOwner/CreditTab";
import ProductManagement from "./components/Modules/StoreOwner/ProductManagement";
import TransactionHistory from "./components/Modules/StoreOwner/TransactionHistory";
import CustomerManagement from "./components/Modules/StoreOwner/CustomerManagement";
import ForgotPasswordPage from "./components/Modules/ForgotPassword/ForgotPassword";
import ResetPassword from "./components/Modules/ForgotPassword/ResetPassword";

import { supabase } from "./lib/supabase";
import { OWNER_DEACTIVATED_MESSAGE } from "./hooks/use-owner-access-guard";
import { toast } from "sonner";

const queryClient = new QueryClient();
const OwnerProfile = lazy(
  () => import("./components/Modules/StoreOwner/OwnerProfile"),
);

function LandingPageEntry() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 2800);

    return () => window.clearTimeout(timer);
  }, []);

  return loading ? <StoreLoader /> : <LandingPage />;
}

function AdminRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let mounted = true;

    async function checkAdminAccess() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session?.user) {
        setStatus("denied");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", session.user.id)
        .single();

      if (!mounted) return;

      if (error) {
        console.error("Failed to check admin role:", error);
        setStatus("denied");
        return;
      }

      if (profile?.role === "admin" && profile?.status === "active") {
        setStatus("allowed");
      } else {
        if (profile?.role === "admin") {
          await supabase.auth.signOut();
        }
        setStatus("denied");
      }
    }

    checkAdminAccess();

    return () => {
      mounted = false;
    };
  }, []);

  if (status === "checking") {
    return null;
  }

  if (status === "denied") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function OwnerRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let mounted = true;

    async function checkOwnerAccess() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session?.user) {
        setStatus("denied");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", session.user.id)
        .single();

      if (!mounted) return;

      const ownerAccessRevoked =
        !error &&
        (!profile || (profile.role === "owner" && profile.status !== "active"));

      if (ownerAccessRevoked) {
        await supabase.auth.signOut();
        toast.error(OWNER_DEACTIVATED_MESSAGE);
      }

      if (error || profile?.role !== "owner" || profile?.status !== "active") {
        setStatus("denied");
        return;
      }

      setStatus("allowed");
    }

    checkOwnerAccess();

    return () => {
      mounted = false;
    };
  }, []);

  if (status === "checking") return null;
  if (status === "denied") return <Navigate to="/login" replace />;

  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
      >
        <TooltipProvider>
          <BrowserRouter>
            <Toaster position="top-center" />

            <Routes>
              {/* ================================
              DEFAULT
          ================================= */}

              <Route path="/" element={<LandingPageEntry />} />

              {/* ================================
              LOGIN
          ================================= */}

              <Route path="/login" element={<LoginPage />} />

              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminDashboard />} />

                <Route path="owners" element={<OwnerManagement />} />
                <Route path="logs" element={<AdminLogs />} />
                <Route path="landing" element={<LandingPageManagement />} />
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
                <Route
                  path="profile"
                  element={
                    <Suspense
                      fallback={
                        <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
                          Loading profile...
                        </div>
                      }
                    >
                      <OwnerProfile />
                    </Suspense>
                  }
                />
                <Route path="credits" element={<CreditTab />} />
                <Route path="products" element={<ProductManagement />} />
                <Route path="transactions" element={<TransactionHistory />} />
                <Route path="customers" element={<CustomerManagement />} />
              </Route>

              {/* ================================
              UNKNOWN ROUTE
          ================================= */}

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
