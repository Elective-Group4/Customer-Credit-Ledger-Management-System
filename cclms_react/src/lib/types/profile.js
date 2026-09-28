/**
 * @typedef {'owner'} OwnerRole
 *
 * @typedef {Object} OwnerProfile
 * @property {string} id
 * @property {string} fullName
 * @property {string} email
 * @property {OwnerRole} role
 * @property {string|null} avatarUrl
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} UpdateProfileInput
 * @property {string} fullName
 *
 * @typedef {Object} ChangePasswordInput
 * @property {string} currentPassword
 * @property {string} newPassword
 * @property {string} confirmPassword
 */
export {}
