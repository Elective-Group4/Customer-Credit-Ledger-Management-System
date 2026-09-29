import { supabase } from "@/lib/supabase"

/**
 * @typedef {import("@/lib/types/profile").OwnerProfile} OwnerProfile
 * @typedef {import("@/lib/types/profile").UpdateProfileInput} UpdateProfileInput
 * @typedef {import("@/lib/types/profile").ChangePasswordInput} ChangePasswordInput
 */

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error("You are not logged in.")
  return data.user
}

/** @returns {Promise<OwnerProfile>} */
export async function getCurrentOwnerProfile() {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .eq("id", user.id)
    .single()

  if (error) throw error

  return {
    id: data.id,
    fullName: data.full_name,
    email: data.email || user.email || "",
    role: data.role,
    avatarUrl: null,
    createdAt: data.created_at,
    updatedAt: data.created_at,
  }
}

/**
 * @param {UpdateProfileInput} input
 * @returns {Promise<OwnerProfile>}
 */
export async function updateOwnerProfile(input) {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: input.fullName })
    .eq("id", user.id)
    .select("id, full_name, email, role, created_at")
    .single()

  if (error) throw error

  return {
    id: data.id,
    fullName: data.full_name,
    email: data.email || user.email || "",
    role: data.role,
    avatarUrl: null,
    createdAt: data.created_at,
    updatedAt: data.created_at,
  }
}

/**
 * @param {ChangePasswordInput} input
 * @returns {Promise<void>}
 */
export async function changeOwnerPassword(input) {
  const user = await getCurrentUser()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: input.currentPassword,
  })
  if (signInError) throw signInError

  const { error } = await supabase.auth.updateUser({ password: input.newPassword })
  if (error) throw error
}
