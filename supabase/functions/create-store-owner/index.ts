/// <reference path="./types.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
}

const response = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  })

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders })
  }

  if (request.method !== "POST") {
    return response({ success: false, message: "Method not allowed" }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const authorization = request.headers.get("Authorization")

    if (!supabaseUrl || !serviceRoleKey || !authorization) {
      return response({ success: false, message: "Missing server configuration or authorization" }, 401)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authorization } },
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: { user: adminUser }, error: userError } = await adminClient.auth.getUser()
    if (userError || !adminUser) {
      return response({ success: false, message: "Unauthorized" }, 401)
    }

    const { data: adminProfile, error: profileError } = await serviceClient
      .from("profiles")
      .select("role")
      .eq("id", adminUser.id)
      .single()

    if (profileError || adminProfile?.role !== "admin") {
      return response({ success: false, message: "Admin access required" }, 403)
    }

    const body = await request.json()
    const requiredFields = ["full_name", "email", "password", "phone_number", "store_name", "branch"]
    const missingField = requiredFields.find((field) => !String(body[field] ?? "").trim())

    if (missingField) {
      return response({ success: false, message: `${missingField} is required` }, 400)
    }

    const { data: createdAuth, error: authError } = await serviceClient.auth.admin.createUser({
      email: String(body.email).trim(),
      password: String(body.password),
      email_confirm: true,
    })

    if (authError || !createdAuth.user) {
      return response({ success: false, message: authError?.message ?? "Unable to create authentication user" }, 400)
    }

    const profileId = createdAuth.user.id
    const { error: newProfileError } = await serviceClient.from("profiles").insert({
      id: profileId,
      full_name: String(body.full_name).trim(),
      email: String(body.email).trim(),
      phone_number: String(body.phone_number).trim(),
      role: "owner",
      status: body.status === "inactive" ? "inactive" : "active",
    })

    if (newProfileError) {
      await serviceClient.auth.admin.deleteUser(profileId)
      return response({ success: false, message: newProfileError.message }, 400)
    }

    const { error: storeOwnerError } = await serviceClient.from("store_owners").insert({
      profile_id: profileId,
      store_name: String(body.store_name).trim(),
      branch: String(body.branch).trim(),
    })

    if (storeOwnerError) {
      await serviceClient.from("profiles").delete().eq("id", profileId)
      await serviceClient.auth.admin.deleteUser(profileId)
      return response({ success: false, message: storeOwnerError.message }, 400)
    }

    const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    const ipAddress = String(body.ip_address ?? "").trim() ||
      forwardedIp ||
      request.headers.get("cf-connecting-ip") ||
      null

    const { error: adminLogError } = await serviceClient.from("admin_logs").insert({
      admin_id: adminUser.id,
      action: "CREATE_OWNER",
      target_user_id: profileId,
      target_name: String(body.full_name).trim(),
      ip_address: ipAddress,
    })

    if (adminLogError) {
      console.error("Create owner log error:", adminLogError)
    }

    return response({ success: true, profile_id: profileId })
  } catch (error) {
    console.error("smart-action failed", error)
    return response({
      success: false,
      message: error instanceof Error ? error.message : "Unexpected server error",
    }, 500)
  }
})
