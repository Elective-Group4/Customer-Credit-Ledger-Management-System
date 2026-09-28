// Development-only profile adapter. Replace this module with Supabase calls without changing the UI API.
let profile = {
  id: "mock-owner",
  fullName: "Store Owner",
  email: "owner.local@gmail.com",
  role: "owner",
  avatarUrl: null,
  createdAt: "2026-01-15T00:00:00.000Z",
  updatedAt: "2026-01-15T00:00:00.000Z",
}
let password = "Owner123!"

export const mockProfileData = {
  getProfile: async () => ({ ...profile }),
  updateProfile: async ({ fullName }) => {
    profile = { ...profile, fullName, updatedAt: new Date().toISOString() }
    return { ...profile }
  },
  changePassword: async ({ currentPassword, newPassword }) => {
    if (currentPassword !== password) throw new Error("Current password is incorrect.")
    password = newPassword
  },
}
