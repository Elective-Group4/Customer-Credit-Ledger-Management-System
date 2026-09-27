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
      return response(
        { success: false, message: "Missing server configuration or authorization" },
        401,
      )
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
    const profileId = String(body.profile_id ?? "").trim()

    if (!profileId) {
      return response({ success: false, message: "profile_id is required" }, 400)
    }

    if (profileId === adminUser.id) {
      return response({ success: false, message: "The administrator account cannot be deleted here" }, 403)
    }

    const { data: ownerProfile, error: ownerProfileError } = await serviceClient
      .from("profiles")
      .select("id, full_name, email, phone_number, role, status, created_at")
      .eq("id", profileId)
      .single()

    if (ownerProfileError || !ownerProfile) {
      return response({ success: false, message: "Owner profile not found" }, 404)
    }

    if (ownerProfile.role !== "owner") {
      return response({ success: false, message: "Only owner accounts can be deleted here" }, 403)
    }

    const { data: storeOwner, error: storeOwnerLookupError } = await serviceClient
      .from("store_owners")
      .select("id, profile_id, store_name, branch, created_at, updated_at")
      .eq("profile_id", profileId)
      .maybeSingle()

    if (storeOwnerLookupError) {
      return response({ success: false, message: storeOwnerLookupError.message }, 400)
    }

    if (!storeOwner) {
      return response({ success: false, message: "Store owner record not found" }, 404)
    }

    const { data: authUser, error: authUserError } = await serviceClient.auth.admin.getUserById(profileId)
    if (authUserError || !authUser.user) {
      return response({ success: false, message: "Authentication user not found" }, 404)
    }

    const { error: storeOwnerDeleteError } = await serviceClient
      .from("store_owners")
      .delete()
      .eq("profile_id", profileId)

    if (storeOwnerDeleteError) {
      return response({ success: false, message: storeOwnerDeleteError.message }, 400)
    }

    const { error: profileDeleteError } = await serviceClient
      .from("profiles")
      .delete()
      .eq("id", profileId)

    if (profileDeleteError) {
      const { error: storeOwnerRestoreError } = await serviceClient.from("store_owners").insert(storeOwner)
      if (storeOwnerRestoreError) {
        console.error("Unable to restore store owner after profile deletion failure", storeOwnerRestoreError)
      }

      return response({ success: false, message: profileDeleteError.message }, 400)
    }

    const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(profileId)
    if (authDeleteError) {
      const { error: profileRestoreError } = await serviceClient.from("profiles").insert(ownerProfile)
      if (profileRestoreError) {
        console.error("Unable to restore profile after Auth deletion failure", profileRestoreError)
      }

      const { error: storeOwnerRestoreError } = await serviceClient.from("store_owners").insert(storeOwner)
      if (storeOwnerRestoreError) {
        console.error("Unable to restore store owner after Auth deletion failure", storeOwnerRestoreError)
      }

      return response({ success: false, message: authDeleteError.message }, 400)
    }

    return response({ success: true })
  } catch (error) {
    console.error("delete-store-owner failed", error)
    return response(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unexpected server error",
      },
      500,
    )
  }
})
