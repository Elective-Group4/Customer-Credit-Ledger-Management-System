import { ArrowLeft, Mail, Send } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import Logo from "@/assets/images/logo_sarisari.png";

import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { getFunctionErrorMessage } from "@/lib/function-error";

import { Button } from "@/components/ui/button";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";

function ForgotPasswordForm({ className, ...props }) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();

    const { error: sendError } = await supabase.functions.invoke(
      "send-reset-otp",
      { body: { email } },
    );

    if (sendError) {
      console.error("Send OTP error:", sendError);
      setError(await getFunctionErrorMessage(sendError));
      setIsLoading(false);
      return;
    }

    toast.success("Verification code sent", {
      description: "Please check your email inbox.",
    });

    navigate("/verify-otp", { state: { email } });
    setIsLoading(false);
  }

  // ============================
  // FORM STATE
  // ============================
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
            Forgot password?
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Enter the email linked to your account and we&apos;ll send you a
            4-digit verification code.
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
                text-gray-900
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

        {/* Submit Button */}
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
              "Sending code..."
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Send code
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
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          </div>
        )}

        {/* Back to login */}
        <p className="text-center text-sm text-gray-500">
          Remembered your password?{" "}
          <Link
            to="/login"
            className="font-medium text-[#C28F00] transition-colors hover:text-[#9D7500] hover:underline"
          >
            Back to login
          </Link>
        </p>

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

export default function ForgotPasswordPage() {
  return (
    <div className="login-page grid min-h-svh lg:grid-cols-2">
      {/* =====================================================
          LEFT SIDE - FORGOT PASSWORD
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
            <Link to="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <ForgotPasswordForm />
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