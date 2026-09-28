import { mockProfileData } from "@/lib/mock/profile-data"

/**
 * @typedef {import("@/lib/types/profile").OwnerProfile} OwnerProfile
 * @typedef {import("@/lib/types/profile").UpdateProfileInput} UpdateProfileInput
 * @typedef {import("@/lib/types/profile").ChangePasswordInput} ChangePasswordInput
 */

/**
 * UI-facing profile data boundary. Replace mockProfileData calls with Supabase Auth and profiles queries.
 * @returns {Promise<OwnerProfile>}
 */
export function getCurrentOwnerProfile() {
  return mockProfileData.getProfile()
}

/**
 * @param {UpdateProfileInput} input
 * @returns {Promise<OwnerProfile>}
 */
export function updateOwnerProfile(input) {
  return mockProfileData.updateProfile(input)
}

/**
 * @param {ChangePasswordInput} input
 * @returns {Promise<void>}
 */
export function changeOwnerPassword(input) {
  return mockProfileData.changePassword(input)
}
