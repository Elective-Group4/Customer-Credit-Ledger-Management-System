import { ArrowLeft, Eye, EyeOff, LockKeyhole, LogIn, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import Logo from "@/assets/images/logo_sarisari.png";

import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { getClientIp } from "@/lib/client-ip";

import { Button } from "@/components/ui/button";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";

function LoginForm({ className, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(event) {
  event.preventDefault();
  setError("");
  setIsLoading(true);

  const formData = new FormData(event.currentTarget);
  const email = formData.get("email");
  const password = formData.get("password");

  // Login with Supabase Auth
  const { data, error: loginError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (loginError) {
    setError(loginError.message);
    setIsLoading(false);
    return;
  }

  // Make sure we received a user
  if (!data?.user) {
    setError("Unable to retrieve your account.");
    setIsLoading(false);
    return;
  }

  // Get user's profile and role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", data.user.id)
    .single();

  if (profileError) {
    console.error("Profile error:", profileError);

    setError("Unable to find your account profile.");

    await supabase.auth.signOut();
    setIsLoading(false);
    return;
  }

  console.log("Logged in user:", data.user.email);
  console.log("User role:", profile.role);

  // ============================
  // ADMIN LOGIN
  // ============================
  if (profile.role === "admin") {
    // Create ADMIN LOGIN log
    const ipAddress = await getClientIp();

    const { error: logError } = await supabase
      .from("admin_logs")
      .insert({
        admin_id: data.user.id,
        action: "LOGIN",
        ip_address: ipAddress,
      });

    if (logError) {
      console.error("Login log error:", logError);
    }

    toast.success("Login successful", {
      description: "Welcome to the admin dashboard.",
    });

    navigate("/admin", {
      replace: true,
    });

    setIsLoading(false);
    return;
  }

  // ============================
  // OWNER LOGIN
  // ============================
  if (profile.role === "owner") {
    toast.success("Login successful", {
      description: "Welcome to your owner dashboard.",
    });

    navigate("/owner", {
      replace: true,
    });

    setIsLoading(false);
    return;
  }

  // ============================
  // INVALID ROLE
  // ============================
  console.error("Invalid user role:", profile.role);

  setError("Your account has an invalid role.");

  await supabase.auth.signOut();

  setIsLoading(false);
}

  return (
    <form
      className={cn("w-full", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>

        {/* Header */}
        <div className="mb-4 flex flex-col items-start">

          <h1 className="text-3xl font-bold tracking-tight text-gray-950">
            Welcome!
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Please enter your details to sign in.
          </p>

          {/* Gold Accent */}
          <div className="mt-5 h-1 w-14 rounded-full bg-[#D4A017]" />

        </div>

        {/* Email */}
        <Field>
          <FieldLabel
            htmlFor="email"
            className="text-sm font-semibold text-gray-900"
          >
            Email
          </FieldLabel>

          <div className="relative mt-2">
            <Mail
              className="
                absolute
                left-4
                top-1/2
                h-5
                w-5
                -translate-y-1/2
                text-gray-400
              "
            />

            <Input
              id="email"
              name="email"
              type="email"
              placeholder="user@gmail.com"
              required
              autoComplete="email"
              className="
                h-14
                rounded-xl
                border-gray-300
                bg-white
                pl-12
                pr-4
                text-base
                shadow-none
                transition
                placeholder:text-gray-400
                focus:border-[#D4A017]
                focus:ring-2
                focus:ring-[#D4A017]/20
              "
            />
          </div>
        </Field>

        {/* Password */}
        <Field>
          <FieldLabel
            htmlFor="password"
            className="text-sm font-semibold text-gray-900"
          >
            Password
          </FieldLabel>

          <div className="relative mt-2">
            <LockKeyhole
              className="
                absolute
                left-4
                top-1/2
                h-5
                w-5
                -translate-y-1/2
                text-gray-400
              "
            />

            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="
                h-14
                rounded-xl
                border-gray-300
                bg-white
                pl-12
                pr-12
                text-base
                shadow-none
                transition
                placeholder:text-gray-400
                focus:border-[#D4A017]
                focus:ring-2
                focus:ring-[#D4A017]/20
              "
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword((previous) => !previous)
              }
              className="
                absolute
                right-4
                top-1/2
                -translate-y-1/2
                text-gray-400
                transition-colors
                hover:text-gray-800
              "
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Remember Me / Forgot Password */}
          <div className="mt-3 flex items-center justify-between gap-4">

            <label
              htmlFor="rememberMe"
              className="flex cursor-pointer items-center gap-2"
            >
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                className="
                  h-4
                  w-4
                  cursor-pointer
                  rounded
                  border-gray-300
                  accent-[#D4A017]
                "
              />

              <span className="text-sm text-gray-600">
                Remember me
              </span>
            </label>

            <a
              href="#"
              className="
                text-sm
                font-medium
                text-[#C28F00]
                transition-colors
                hover:text-[#9D7500]
                hover:underline
              "
            >
              Forgot your password?
            </a>

          </div>
        </Field>

        {/* Login Button */}
        <Field className="mt-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="
              h-14
              w-full
              rounded-xl
              bg-[#D4A017]
              text-base
              font-semibold
              text-white
              shadow-md
              shadow-[#D4A017]/20
              transition-all
              duration-200
              hover:bg-[#C28F00]
              hover:shadow-lg
              hover:shadow-[#D4A017]/25
              active:scale-[0.99]
              disabled:cursor-not-allowed
              disabled:opacity-70
            "
          >
            {isLoading ? (
              "Logging in..."
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Login
              </>
            )}
          </Button>
        </Field>

        {/* Error */}
        {error && (
          <div
            className="
              rounded-lg
              border
              border-red-200
              bg-red-50
              px-4
              py-3
            "
          >
            <p
              className="text-sm text-red-600"
              role="alert"
            >
              {error}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-2">
          <FieldSeparator />

          <FieldDescription className="pt-4 text-center text-xs text-gray-500">
            © 2026 Sari-Sari • Developed by Group 4
          </FieldDescription>
        </div>

      </FieldGroup>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">

      {/* =====================================================
          LEFT SIDE - LOGIN
      ====================================================== */}
      <div
        className="
          flex
          flex-col
          bg-[#FCFAF5]
          p-6
          md:p-10
        "
      >

        <div className="flex justify-center gap-2 md:justify-start">
          <Button
            asChild
            variant="ghost"
            className="-ml-3 text-gray-600 hover:bg-transparent hover:text-gray-950"
          >
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to landing page
            </Link>
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-center">

          <div className="w-full max-w-md">
            <LoginForm />
          </div>

        </div>
      </div>

      {/* =====================================================
          RIGHT SIDE - BRANDING
      ====================================================== */}
      <div
        className="
          relative
          hidden
          overflow-hidden
          bg-[#0B0B0C]
          lg:flex
          lg:flex-col
          lg:items-center
          lg:justify-center
        "
      >

        {/* Background */}
        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,89,0.14),transparent_55%)]
          "
        />

        {/* Decorative Gold Circles */}
        <div
          className="
            absolute
            -left-32
            -top-32
            h-64
            w-64
            rounded-full
            border-[20px]
            border-[#D4AF59]/20
          "
        />

        <div
          className="
            absolute
            -bottom-32
            -right-32
            h-64
            w-64
            rounded-full
            border-[20px]
            border-[#D4AF59]/20
          "
        /> 

        {/* Branding Content */}
        <div
          className="
            relative
            z-10
            flex
            w-full
            max-w-2xl
            flex-col
            items-center
            px-10
            text-center
          "
        >

          {/* Logo */}
          <img
            src={Logo}
            alt="Sari-Sari Logo"
            className="
              mb-8
              h-36
              w-36
              object-contain
              drop-shadow-[0_0_20px_rgba(212,175,89,0.25)]
            "
          />

          {/* Brand */}
          <div className="relative">

            <span
              className="
                absolute
                -left-6
                -top-5
                h-4
                w-4
                border-l-2
                border-t-2
                border-[#D4AF59]
              "
            />

            <span
              className="
                absolute
                -bottom-5
                -right-6
                h-4
                w-4
                border-b-2
                border-r-2
                border-[#D4AF59]
              "
            />

            <h1
              className="
                bg-gradient-to-r
                from-white
                via-[#F4D98B]
                to-[#D4AF59]
                bg-clip-text
                text-7xl
                font-extrabold
                tracking-tight
                text-transparent
                xl:text-8xl
              "
            >
              SARI-SARI
            </h1>

          </div>

          {/* Divider */}
          <div
            className="
              mt-6
              h-px
              w-3/4
              max-w-md
              bg-gradient-to-r
              from-transparent
              via-[#D4AF59]
              to-transparent
            "
          />

          {/* Subtitle */}
          <p
            className="
              mt-6
              max-w-xl
              text-sm
              font-medium
              uppercase
              tracking-[0.25em]
              text-white/65
            "
          >
            Customer Credit Ledger
            <br />
            Management System
          </p>

        </div>
      </div>
    </div>
  );
}