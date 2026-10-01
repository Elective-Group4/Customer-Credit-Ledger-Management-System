/// <reference path="./types.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

const response = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });

const phoneNumberPattern = /^\+63 9\d{9}$/;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return response({ success: false, message: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = request.headers.get("Authorization");

    if (!supabaseUrl || !serviceRoleKey || !authorization) {
      return response(
        {
          success: false,
          message: "Missing server configuration or authorization",
        },
        401,
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authorization } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user: adminUser },
      error: userError,
    } = await adminClient.auth.getUser();
    if (userError || !adminUser) {
      return response({ success: false, message: "Unauthorized" }, 401);
    }

    const { data: adminProfile, error: profileError } = await serviceClient
      .from("profiles")
      .select("role")
      .eq("id", adminUser.id)
      .single();

    if (profileError || adminProfile?.role !== "admin") {
      return response(
        { success: false, message: "Admin access required" },
        403,
      );
    }

    const body = await request.json();
    const forwardedIp = request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();
    const ipAddress =
      String(body.ip_address ?? "").trim() ||
      forwardedIp ||
      request.headers.get("cf-connecting-ip") ||
      null;
    const action = String(body.action ?? "create_owner").trim();

    if (!["create_owner", "update_owner", "delete_owner"].includes(action)) {
      return response(
        { success: false, message: "Unsupported owner action" },
        400,
      );
    }

    if (action === "update_owner") {
      const profileId = String(body.profile_id ?? "").trim();
      const storeOwnerId = String(body.store_owner_id ?? "").trim();
      const email = String(body.email ?? "")
        .trim()
        .toLowerCase();
      const requiredFields = [
        "profile_id",
        "store_owner_id",
        "full_name",
        "email",
        "phone_number",
        "store_name",
        "branch",
      ];
      const missingField = requiredFields.find(
        (field) => !String(body[field] ?? "").trim(),
      );

      if (!profileId || !storeOwnerId || missingField) {
        return response(
          {
            success: false,
            message: missingField
              ? `${missingField} is required`
              : "Missing owner identifiers",
          },
          400,
        );
      }

      const phoneNumber = String(body.phone_number).trim();
      if (!phoneNumberPattern.test(phoneNumber)) {
        return response(
          {
            success: false,
            message: "Phone number must use the format +63 9123456789",
          },
          400,
        );
      }

      if (profileId === adminUser.id) {
        return response(
          {
            success: false,
            message: "The administrator account cannot be edited here",
          },
          403,
        );
      }

      const { data: existingProfile, error: existingProfileError } =
        await serviceClient
          .from("profiles")
          .select("id, full_name, email, phone_number, role, status")
          .eq("id", profileId)
          .single();

      if (existingProfileError || !existingProfile) {
        return response(
          { success: false, message: "Owner profile not found" },
          404,
        );
      }

      if (existingProfile.role !== "owner") {
        return response(
          { success: false, message: "Only owner accounts can be edited here" },
          403,
        );
      }

      const { data: existingStoreOwner, error: existingStoreOwnerError } =
        await serviceClient
          .from("store_owners")
          .select("id")
          .eq("id", storeOwnerId)
          .eq("profile_id", profileId)
          .single();

      if (existingStoreOwnerError || !existingStoreOwner) {
        return response(
          { success: false, message: "Store owner record not found" },
          404,
        );
      }

      const { data: authUser, error: authUserError } =
        await serviceClient.auth.admin.getUserById(profileId);
      if (authUserError || !authUser.user) {
        return response(
          { success: false, message: "Authentication user not found" },
          404,
        );
      }

      const previousEmail = authUser.user.email ?? existingProfile.email;
      const emailChanged = email !== previousEmail?.toLowerCase();

      if (emailChanged) {
        const { error: authUpdateError } =
          await serviceClient.auth.admin.updateUserById(profileId, {
            email,
            email_confirm: true,
          });

        if (authUpdateError) {
          return response(
            { success: false, message: authUpdateError.message },
            400,
          );
        }
      }

      const { error: profileUpdateError } = await serviceClient
        .from("profiles")
        .update({
          full_name: String(body.full_name).trim(),
          email,
          phone_number: phoneNumber,
          status: body.status === "inactive" ? "inactive" : "active",
        })
        .eq("id", profileId);

      if (profileUpdateError) {
        if (emailChanged) {
          await serviceClient.auth.admin.updateUserById(profileId, {
            email: previousEmail,
            email_confirm: true,
          });
        }
        return response(
          { success: false, message: profileUpdateError.message },
          400,
        );
      }

      const { error: storeOwnerUpdateError } = await serviceClient
        .from("store_owners")
        .update({
          store_name: String(body.store_name).trim(),
          branch: String(body.branch).trim(),
        })
        .eq("id", storeOwnerId)
        .eq("profile_id", profileId);

      if (storeOwnerUpdateError) {
        const { error: rollbackError } = await serviceClient
          .from("profiles")
          .update({
            full_name: existingProfile.full_name,
            email: existingProfile.email,
            phone_number: existingProfile.phone_number,
            status: existingProfile.status,
          })
          .eq("id", profileId);

        if (rollbackError) {
          console.error("Update owner profile rollback failed", rollbackError);
        }
        if (emailChanged) {
          const { error: authRollbackError } =
            await serviceClient.auth.admin.updateUserById(profileId, {
              email: previousEmail,
              email_confirm: true,
            });
          if (authRollbackError) {
            console.error(
              "Update owner Auth rollback failed",
              authRollbackError,
            );
          }
        }
        return response(
          { success: false, message: storeOwnerUpdateError.message },
          400,
        );
      }

      const { error: adminLogError } = await serviceClient
        .from("admin_logs")
        .insert({
          admin_id: adminUser.id,
          action: "UPDATE_OWNER",
          target_user_id: profileId,
          target_name: String(body.full_name).trim(),
          ip_address: ipAddress,
        });

      if (adminLogError) {
        console.error("Update owner log error", adminLogError);
      }

      return response({ success: true, profile_id: profileId });
    }

    if (action === "delete_owner") {
      const profileId = String(body.profile_id ?? "").trim();
      const storeOwnerId = String(body.store_owner_id ?? "").trim();

      if (!profileId || !storeOwnerId) {
        return response(
          {
            success: false,
            message: "profile_id and store_owner_id are required",
          },
          400,
        );
      }

      if (profileId === adminUser.id) {
        return response(
          {
            success: false,
            message: "The administrator account cannot be deleted here",
          },
          403,
        );
      }

      const { data: ownerProfile, error: ownerProfileError } =
        await serviceClient
          .from("profiles")
          .select(
            "id, full_name, email, phone_number, role, status, created_at",
          )
          .eq("id", profileId)
          .single();

      if (ownerProfileError || !ownerProfile) {
        return response(
          { success: false, message: "Owner profile not found" },
          404,
        );
      }

      if (ownerProfile.role !== "owner") {
        return response(
          {
            success: false,
            message: "Only owner accounts can be deleted here",
          },
          403,
        );
      }

      const { data: storeOwner, error: storeOwnerLookupError } =
        await serviceClient
          .from("store_owners")
          .select("id, profile_id, store_name, branch, created_at, updated_at")
          .eq("id", storeOwnerId)
          .eq("profile_id", profileId)
          .single();

      if (storeOwnerLookupError || !storeOwner) {
        return response(
          { success: false, message: "Store owner record not found" },
          404,
        );
      }

      const { data: authUser, error: authUserError } =
        await serviceClient.auth.admin.getUserById(profileId);
      if (authUserError || !authUser.user) {
        return response(
          { success: false, message: "Authentication user not found" },
          404,
        );
      }

      const { error: storeOwnerDeleteError } = await serviceClient
        .from("store_owners")
        .delete()
        .eq("id", storeOwnerId)
        .eq("profile_id", profileId);

      if (storeOwnerDeleteError) {
        return response(
          { success: false, message: storeOwnerDeleteError.message },
          400,
        );
      }

      const { error: profileDeleteError } = await serviceClient
        .from("profiles")
        .delete()
        .eq("id", profileId);

      if (profileDeleteError) {
        await serviceClient.from("store_owners").insert(storeOwner);
        return response(
          { success: false, message: profileDeleteError.message },
          400,
        );
      }

      const { error: authDeleteError } =
        await serviceClient.auth.admin.deleteUser(profileId);
      if (authDeleteError) {
        await serviceClient.from("profiles").insert(ownerProfile);
        await serviceClient.from("store_owners").insert(storeOwner);
        return response(
          { success: false, message: authDeleteError.message },
          400,
        );
      }

      const { error: adminLogError } = await serviceClient
        .from("admin_logs")
        .insert({
          admin_id: adminUser.id,
          action: "DELETE_OWNER",
          target_user_id: null,
          target_name: ownerProfile.full_name,
          ip_address: ipAddress,
        });

      if (adminLogError) {
        console.error("Delete owner log error", adminLogError);
      }

      return response({ success: true });
    }

    const requiredFields = [
      "full_name",
      "email",
      "password",
      "phone_number",
      "store_name",
      "branch",
    ];
    const missingField = requiredFields.find(
      (field) => !String(body[field] ?? "").trim(),
    );

    if (missingField) {
      return response(
        { success: false, message: `${missingField} is required` },
        400,
      );
    }

    const phoneNumber = String(body.phone_number).trim();
    if (!phoneNumberPattern.test(phoneNumber)) {
      return response(
        {
          success: false,
          message: "Phone number must use the format +63 9123456789",
        },
        400,
      );
    }

    const { data: createdAuth, error: authError } =
      await serviceClient.auth.admin.createUser({
        email: String(body.email).trim(),
        password: String(body.password),
        email_confirm: true,
      });

    if (authError || !createdAuth.user) {
      return response(
        {
          success: false,
          message: authError?.message ?? "Unable to create authentication user",
        },
        400,
      );
    }

    const profileId = createdAuth.user.id;
    const { error: newProfileError } = await serviceClient
      .from("profiles")
      .insert({
        id: profileId,
        full_name: String(body.full_name).trim(),
        email: String(body.email).trim(),
        phone_number: phoneNumber,
        role: "owner",
        status: body.status === "inactive" ? "inactive" : "active",
      });

    if (newProfileError) {
      await serviceClient.auth.admin.deleteUser(profileId);
      return response(
        { success: false, message: newProfileError.message },
        400,
      );
    }

    const { error: storeOwnerError } = await serviceClient
      .from("store_owners")
      .insert({
        profile_id: profileId,
        store_name: String(body.store_name).trim(),
        branch: String(body.branch).trim(),
      });

    if (storeOwnerError) {
      await serviceClient.from("profiles").delete().eq("id", profileId);
      await serviceClient.auth.admin.deleteUser(profileId);
      return response(
        { success: false, message: storeOwnerError.message },
        400,
      );
    }

    const { error: adminLogError } = await serviceClient
      .from("admin_logs")
      .insert({
        admin_id: adminUser.id,
        action: "CREATE_OWNER",
        target_user_id: profileId,
        target_name: String(body.full_name).trim(),
        ip_address: ipAddress,
      });

    if (adminLogError) {
      console.error("Create owner log error:", adminLogError);
    }

    return response({ success: true, profile_id: profileId });
  } catch (error) {
    console.error("smart-action failed", error);
    return response(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Unexpected server error",
      },
      500,
    );
  }
});
