import { ArrowLeft, ShieldCheck } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
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

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const RESEND_SECONDS = 60;

function VerifyOtpForm({ email, className, ...props }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  const navigate = useNavigate();

  // Resend countdown
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (otp.length !== 4) {
      setError("Please enter the 4-digit code.");
      return;
    }

    setIsLoading(true);

    const { data, error: verifyError } = await supabase.functions.invoke(
      "verify-reset-otp",
      { body: { email, otp } },
    );

    if (verifyError) {
      setError(await getFunctionErrorMessage(verifyError));
      setOtp("");
      setIsLoading(false);
      return;
    }

    toast.success("Code verified", {
      description: "You can now set a new password.",
    });

    // The token proves the OTP was verified; use it on the reset page.
    navigate("/reset-password", {
      replace: true,
      state: { email, resetToken: data.resetToken },
    });

    setIsLoading(false);
  }

  async function handleResend() {
    setError("");
    setIsResending(true);

    const { error: sendError } = await supabase.functions.invoke(
      "send-reset-otp",
      { body: { email } },
    );

    if (sendError) {
      setError(await getFunctionErrorMessage(sendError));
      setIsResending(false);
      return;
    }

    toast.success("New code sent", {
      description: "Please check your email inbox.",
    });

    setOtp("");
    setCooldown(RESEND_SECONDS);
    setIsResending(false);
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
            Enter your code
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            We sent a 4-digit verification code to{" "}
            <span className="font-semibold text-gray-900">{email}</span>.
          </p>

          {/* Gold Accent */}
          <div className="mt-5 h-1 w-14 rounded-full bg-[#D4A017]" />
        </div>

        {/* OTP */}
        <Field>
          <FieldLabel
            htmlFor="otp"
            className="text-sm font-semibold text-gray-900"
          >
            Verification code
          </FieldLabel>

          <div className="mt-2">
            <InputOTP
              id="otp"
              maxLength={4}
              pattern={REGEXP_ONLY_DIGITS}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={otp}
              onChange={setOtp}
              disabled={isLoading}
            >
              <InputOTPGroup className="gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    aria-invalid={Boolean(error)}
                    className="
                      size-16
                      rounded-xl
                      border
                      border-gray-300
                      bg-white
                      text-2xl
                      font-semibold
                      text-gray-900
                      shadow-none
                      first:rounded-xl
                      last:rounded-xl
                      data-[active=true]:border-[#D4A017]
                      data-[active=true]:ring-2
                      data-[active=true]:ring-[#D4A017]/20
                    "
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Resend */}
          <p className="mt-3 text-sm text-gray-500">
            Didn&apos;t get the code?{" "}
            {cooldown > 0 ? (
              <span className="text-gray-400">Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-medium text-[#C28F00] transition-colors hover:text-[#9D7500] hover:underline disabled:opacity-60"
              >
                {isResending ? "Sending..." : "Resend code"}
              </button>
            )}
          </p>
        </Field>

        {/* Verify Button */}
        <Field className="mt-2">
          <Button
            type="submit"
            disabled={isLoading || otp.length !== 4}
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
              "Verifying..."
            ) : (
              <>
                <ShieldCheck className="mr-2 h-5 w-5" />
                Verify code
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

        {/* Wrong email */}
        <p className="text-center text-sm text-gray-500">
          Wrong email?{" "}
          <Link
            to="/forgot-password"
            className="font-medium text-[#C28F00] transition-colors hover:text-[#9D7500] hover:underline"
          >
            Change it
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

export default function VerifyOtpPage() {
  const location = useLocation();
  const email = location.state?.email;

  // Opened directly without going through the forgot-password step
  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  return (
    <div className="login-page grid min-h-svh lg:grid-cols-2">
      {/* =====================================================
          LEFT SIDE - VERIFY OTP
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
            <Link to="/forgot-password">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <VerifyOtpForm email={email} />
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