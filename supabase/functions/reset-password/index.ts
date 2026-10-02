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

const MIN_PASSWORD_LENGTH = 8;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const {
      email: rawEmail,
      resetToken: rawResetToken,
      newPassword: rawNewPassword,
    } = await request.json();
    const email = String(rawEmail || "")
      .trim()
      .toLowerCase();
    const resetToken = String(rawResetToken || "").trim();
    const newPassword = String(rawNewPassword || "");

    if (!email || !resetToken || newPassword.length < MIN_PASSWORD_LENGTH) {
      return json(
        {
          error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        },
        400,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Something went wrong. Please try again." }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: row, error: otpError } = await admin
      .from("password_reset_otps")
      .select("email, reset_token_hash, token_expires_at")
      .eq("email", email)
      .maybeSingle();

    if (otpError) {
      console.error("Reset password token lookup failed", otpError);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }

    const tokenIsValid =
      row &&
      row.reset_token_hash &&
      row.token_expires_at &&
      new Date(row.token_expires_at).getTime() >= Date.now() &&
      (await sha256(resetToken)) === row.reset_token_hash;

    if (!tokenIsValid) {
      return json(
        {
          error:
            "This reset link is invalid or has expired. Please start again.",
        },
        400,
      );
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Reset password profile lookup failed", profileError);
      return json({ error: "Unable to find the account." }, 404);
    }

    const { error: authError } = await admin.auth.admin.updateUserById(
      profile.id,
      { password: newPassword },
    );

    if (authError) {
      console.error("Reset password Auth update failed", authError);
      return json({ error: authError.message }, 400);
    }

    const { error: burnError } = await admin
      .from("password_reset_otps")
      .update({
        reset_token_hash: null,
        token_expires_at: new Date(0).toISOString(),
      })
      .eq("email", email)
      .eq("reset_token_hash", row.reset_token_hash);

    if (burnError) {
      console.error("Reset password token burn failed", burnError);
    }

    return json({ success: true });
  } catch (error) {
    console.error("Reset password failed", error);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
