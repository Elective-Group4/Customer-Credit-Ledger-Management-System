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
    const storeOwnerId = String(body.store_owner_id ?? "").trim()
    const email = String(body.email ?? "").trim().toLowerCase()

    const requiredFields = [
      "profile_id",
      "store_owner_id",
      "full_name",
      "email",
      "phone_number",
      "store_name",
      "branch",
    ]

    const missingField = requiredFields.find((field) => !String(body[field] ?? "").trim())

    if (!profileId || !storeOwnerId || missingField) {
      return response(
        { success: false, message: missingField ? `${missingField} is required` : "Missing owner identifiers" },
        400,
      )
    }

    if (profileId === adminUser.id) {
      return response({ success: false, message: "The administrator account cannot be edited here" }, 403)
    }

    const { data: existingProfile, error: existingProfileError } = await serviceClient
      .from("profiles")
      .select("id, full_name, email, phone_number, role, status")
      .eq("id", profileId)
      .single()

    if (existingProfileError || !existingProfile) {
      return response({ success: false, message: "Owner profile not found" }, 404)
    }

    if (existingProfile.role !== "owner") {
      return response({ success: false, message: "Only owner accounts can be edited here" }, 403)
    }

    const { data: existingStoreOwner, error: existingStoreOwnerError } = await serviceClient
      .from("store_owners")
      .select("id")
      .eq("id", storeOwnerId)
      .eq("profile_id", profileId)
      .single()

    if (existingStoreOwnerError || !existingStoreOwner) {
      return response({ success: false, message: "Store owner record not found" }, 404)
    }

    const { data: authUser, error: authUserError } = await serviceClient.auth.admin.getUserById(profileId)
    if (authUserError || !authUser.user) {
      return response({ success: false, message: "Authentication user not found" }, 404)
    }

    const previousEmail = authUser.user.email ?? existingProfile.email
    const emailChanged = email !== previousEmail?.toLowerCase()

    if (emailChanged) {
      const { error: authUpdateError } = await serviceClient.auth.admin.updateUserById(profileId, {
        email,
        email_confirm: true,
      })

      if (authUpdateError) {
        return response({ success: false, message: authUpdateError.message }, 400)
      }
    }

    const profileStatus = body.status === "inactive" ? "inactive" : "active"

    const { error: profileUpdateError } = await serviceClient
      .from("profiles")
      .update({
        full_name: String(body.full_name).trim(),
        email,
        phone_number: String(body.phone_number).trim(),
        status: profileStatus,
      })
      .eq("id", profileId)

    if (profileUpdateError) {
      if (emailChanged) {
        const { error: rollbackError } = await serviceClient.auth.admin.updateUserById(profileId, {
          email: previousEmail,
        })
        if (rollbackError) {
          console.error("Unable to roll back Auth email after profile update failure", rollbackError)
        }
      }
      return response({ success: false, message: profileUpdateError.message }, 400)
    }

    const { error: storeOwnerUpdateError } = await serviceClient
      .from("store_owners")
      .update({
        store_name: String(body.store_name).trim(),
        branch: String(body.branch).trim(),
      })
      .eq("id", storeOwnerId)
      .eq("profile_id", profileId)

    if (storeOwnerUpdateError) {
      const { error: profileRollbackError } = await serviceClient
        .from("profiles")
        .update({
          full_name: existingProfile.full_name,
          email: existingProfile.email,
          phone_number: existingProfile.phone_number,
          status: existingProfile.status,
        })
        .eq("id", profileId)

      if (profileRollbackError) {
        console.error("Unable to roll back profile after store owner update failure", profileRollbackError)
      }

      if (emailChanged) {
        const { error: rollbackError } = await serviceClient.auth.admin.updateUserById(profileId, {
          email: previousEmail,
        })
        if (rollbackError) {
          console.error("Unable to roll back Auth email after store owner update failure", rollbackError)
        }
      }
      return response({ success: false, message: storeOwnerUpdateError.message }, 400)
    }

    return response({ success: true, profile_id: profileId })
  } catch (error) {
    console.error("update-store-owner failed", error)
    return response(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unexpected server error",
      },
      500,
    )
  }
})
