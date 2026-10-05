import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ThemeProvider, useTheme } from "next-themes";

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
import OwnerManual from "./components/Modules/StoreOwner/OwnerManual";
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

/* ============================================================
   THEME PERSISTENCE (per authenticated user)

   - Supabase (profiles.theme_preference) is the source of truth.
   - The saved preference is loaded ONCE per user.
   - A save happens only when the active theme differs from what
     the database already holds.
   - next-themes' setTheme does not keep a stable identity, so it is
     read through a ref and never used as an effect dependency.
     (Depending on it restarted the load on every toggle, which
     re-applied the old preference and blocked the save.)
   - ThemeProvider is keyed by userId, so all state here resets
     automatically when the account changes.
============================================================ */

const toAppTheme = (value) => (value === "dark" ? "dark" : "light");

function AccountThemePersistence({ userId, children }) {
  const { theme, setTheme } = useTheme();

  // Latest values in refs so effects can read them without re-running
  const setThemeRef = useRef(setTheme);
  setThemeRef.current = setTheme;
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const [loadedUserId, setLoadedUserId] = useState(null);
  const [savedTheme, setSavedTheme] = useState(null); // value the DB currently holds
  const savingRef = useRef(false);

  const preferenceLoaded = !userId || loadedUserId === userId;

  // 1) Load the saved preference once per user
  useEffect(() => {
    if (!userId) {
      setThemeRef.current("light");
      return;
    }

    let cancelled = false;
    const themeAtRequestStart = themeRef.current;

    async function loadThemePreference() {
      const { data, error } = await supabase
        .from("profiles")
        .select("theme_preference")
        .eq("id", userId)
        .single();

      if (cancelled) return;

      let baseline;

      if (error) {
        console.error("Failed to load theme preference:", error);
        // Never overwrite the DB with a default after a failed load;
        // later manual changes can still be saved.
        baseline = toAppTheme(themeRef.current);
      } else {
        baseline = toAppTheme(data?.theme_preference);

        // Don't override a manual selection made while loading
        if (themeRef.current === themeAtRequestStart) {
          setThemeRef.current(baseline);
        }
      }

      setSavedTheme(baseline);
      setLoadedUserId(userId);
    }

    loadThemePreference();

    return () => {
      cancelled = true;
    };
  }, [userId]); // intentionally NOT depending on setTheme

  // 2) Save only when the theme differs from what the DB holds
  useEffect(() => {
    if (
      !userId ||
      !preferenceLoaded ||
      savedTheme === null ||
      !["light", "dark"].includes(theme) ||
      theme === savedTheme ||
      savingRef.current
    ) {
      return;
    }

    const themeToSave = theme;
    savingRef.current = true;

    async function saveThemePreference() {
      // Local session check (no network): the session must still be this user's
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.id !== userId) {
        savingRef.current = false;
        return;
      }

      const { error } = await supabase.rpc("set_my_theme_preference", {
        p_theme_preference: themeToSave,
      });

      savingRef.current = false;

      if (error) {
        console.error("Failed to save theme preference:", error);
        return;
      }

      // Re-runs this effect, so a toggle made mid-save is saved next
      setSavedTheme(themeToSave);
    }

    saveThemePreference();
  }, [userId, preferenceLoaded, theme, savedTheme]);

  return children;
}

function AccountThemeProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authEventReceived = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;

      if (mounted) {
        setUserId(session?.user?.id || null);
        setAuthReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      if (!authEventReceived) {
        setUserId(data.session?.user?.id || null);
      }

      setAuthReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!authReady) return null;

  // key remounts the provider (and resets persistence state) per account
  return (
    <ThemeProvider
      key={userId || "signed-out"}
      attribute="class"
      storageKey={`cclms.theme.${userId || "signed-out"}`}
      defaultTheme="light"
      enableSystem={false}
    >
      <AccountThemePersistence userId={userId}>
        {children}
      </AccountThemePersistence>
    </ThemeProvider>
  );
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
      <BrowserRouter>
        <AccountThemeProvider>
          <TooltipProvider>
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
                <Route path="manual" element={<OwnerManual />} />
              </Route>

              {/* ================================
              UNKNOWN ROUTE
          ================================= */}

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </TooltipProvider>
        </AccountThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
