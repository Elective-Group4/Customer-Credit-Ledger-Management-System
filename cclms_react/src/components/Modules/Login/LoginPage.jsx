import { GalleryVerticalEnd, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import Logo from "@/assets/images/logo_sarisari.png"

import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { getClientIp } from "@/lib/client-ip"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

function LoginForm({ className, ...props }) {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event) {
  event.preventDefault()
  setError("")
  setIsLoading(true)

  const formData = new FormData(event.currentTarget)
  const email = formData.get("email")
  const password = formData.get("password")

  // Login
  const { data, error: loginError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    })

  if (loginError) {
    setError(loginError.message)
    setIsLoading(false)
    return
  }

  // Get the user's profile and role
  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", data.user.id)
      .single()

  if (profileError) {
    console.error("Profile error:", profileError)
    setError("Unable to find your account profile.")

    await supabase.auth.signOut()

    setIsLoading(false)
    return
  }

  // Check admin role
  if (profile.role === "admin") {

    // Create LOGIN log
    const ipAddress = await getClientIp()
    const { error: logError } = await supabase
      .from("admin_logs")
      .insert({
        admin_id: data.user.id,
        action: "LOGIN",
        ip_address: ipAddress,
      })

    if (logError) {
      console.error("Login log error:", logError)
    }

    toast.success("Login successful", {
      description: "Welcome to the admin dashboard.",
    })

    navigate("/admin", { replace: true })

  } else {

    setError("This account does not have administrator access.")

    await supabase.auth.signOut()
  }

  setIsLoading(false)
}

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Welcome!</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Please enter your details to sign in.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" placeholder="user@gmail.com" required className="h-12 px-4 text-base" />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className="h-12 px-4 pr-12 text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberMe"
              className="h-4 w-4"
            />
            <label htmlFor="rememberMe" className="text-sm">
              Remember me
            </label>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline text-right"
            >
              Forgot your password?
            </a>
          </div>
        </Field>
        <Field>
          <Button type="submit" disabled={isLoading} className="h-12 px-4 text-base bg-[#D4A017]">
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </Field>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <FieldSeparator />
          <FieldDescription className="text-center text-xs text-muted-foreground">
            © 2026 Sari-Sari by Group 4 
          </FieldDescription>
      </FieldGroup>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden bg-[#0b0b0c]">
        <style>{`
          @keyframes brandGlow {
            0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 8px rgba(212, 175, 89, 0.35)); }
            50% { opacity: 1; filter: drop-shadow(0 0 20px rgba(212, 175, 89, 0.7)); }
          }
          @keyframes cornerPulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
          @keyframes bgShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .brand-bg {
            background: radial-gradient(circle at 50% 35%, rgba(212, 175, 89, 0.12), transparent 60%),
                        linear-gradient(135deg, #0b0b0c, #151513, #0b0b0c);
            background-size: 200% 200%;
            animation: bgShift 9s ease-in-out infinite;
          }
          .brand-text {
            animation: brandGlow 3s ease-in-out infinite;
          }
          .corner-tl, .corner-br {
            animation: cornerPulse 3s ease-in-out infinite;
          }
        `}</style>

        <div className="brand-bg absolute inset-0" />

        <div className="relative flex flex-col items-center gap-12 px-10">
          <img src={Logo} alt="Sari-Sari Logo" className="mb-4 h-40 w-40" />
          <div className="relative">
            <span className="corner-tl absolute -left-6 -top-6 h-4 w-4 border-l-2 border-t-2 border-[#d4af59]" />
            <span className="corner-br absolute -right-6 -bottom-6 h-4 w-4 border-r-2 border-b-2 border-[#d4af59]" />
            <h1 className="brand-text text-8xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-white via-[#e8c97a] to-[#d4af59] bg-clip-text text-transparent">
                SARI-SARI
              </span>
            </h1>
          </div>
          <p className="text-sm tracking-[0.3em] text-white/60 uppercase">
            Customer Credit Ledger Management System
          </p>
        </div>
      </div>
    </div>
  )
}