/// <reference path="../create-store-owner/types.d.ts" />

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function createOtp() {
  return String(crypto.getRandomValues(new Uint32Array(1))[0] % 10000).padStart(
    4,
    "0",
  );
}

const OTP_TTL_MS = 10 * 60_000;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { email: rawEmail } = await request.json();
    const email = String(rawEmail || "")
      .trim()
      .toLowerCase();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return json({ error: "Please enter a valid email address." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL");

    if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !resendFromEmail) {
      console.error("Reset OTP email configuration is incomplete");
      return json({ error: "Something went wrong. Please try again." }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      console.error("Reset OTP profile lookup failed", profileError);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }

    // Keep the response the same for unknown accounts to avoid email enumeration.
    if (!profile) {
      return json({ success: true });
    }

    const otp = createOtp();
    const { error: otpError } = await admin.from("password_reset_otps").upsert(
      {
        email,
        code_hash: await sha256(`${email}:${otp}`),
        attempts: 0,
        expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
        reset_token_hash: null,
        token_expires_at: null,
      },
      { onConflict: "email" },
    );

    if (otpError) {
      console.error("Reset OTP database write failed", otpError);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [email],
        subject: "Your Sari-Sari password reset code",
        text: `Your password reset code is ${otp}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
      }),
    });

    if (!emailResponse.ok) {
      console.error("Reset OTP email delivery failed", {
        status: emailResponse.status,
        body: await emailResponse.text(),
      });
      await admin.from("password_reset_otps").delete().eq("email", email);
      return json({ error: "Unable to send the verification code." }, 502);
    }

    return json({ success: true });
  } catch (error) {
    console.error("Send reset OTP failed", error);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
