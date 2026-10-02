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

const MAX_ATTEMPTS = 5;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { email: rawEmail, otp: rawOtp } = await request.json();
    const email = String(rawEmail || "")
      .trim()
      .toLowerCase();
    const otp = String(rawOtp || "");

    if (!email || !/^\d{4}$/.test(otp)) {
      return json({ error: "Please enter the 4-digit code." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Something went wrong. Please try again." }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: row, error: lookupError } = await admin
      .from("password_reset_otps")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      console.error("Verify reset OTP lookup failed", lookupError);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }

    if (!row || new Date(row.expires_at).getTime() < Date.now()) {
      return json(
        {
          error:
            "This code is invalid or has expired. Please request a new one.",
        },
        400,
      );
    }

    if (row.attempts >= MAX_ATTEMPTS) {
      return json(
        { error: "Too many incorrect attempts. Please request a new code." },
        429,
      );
    }

    if ((await sha256(`${email}:${otp}`)) !== row.code_hash) {
      const { error: attemptError } = await admin
        .from("password_reset_otps")
        .update({ attempts: row.attempts + 1 })
        .eq("email", email);

      if (attemptError) {
        console.error("Verify reset OTP attempt update failed", attemptError);
      }

      const left = MAX_ATTEMPTS - (row.attempts + 1);
      return json(
        {
          error:
            left > 0
              ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.`
              : "Too many incorrect attempts. Please request a new code.",
        },
        400,
      );
    }

    const resetToken = crypto.randomUUID();
    const { error: tokenError } = await admin
      .from("password_reset_otps")
      .update({
        expires_at: new Date(0).toISOString(),
        reset_token_hash: await sha256(resetToken),
        token_expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
      })
      .eq("email", email);

    if (tokenError) {
      console.error("Verify reset OTP token update failed", tokenError);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }

    return json({ resetToken });
  } catch (error) {
    console.error("Verify reset OTP failed", error);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
