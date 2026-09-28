import { z } from "zod"

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters.").max(60, "Name must be 60 characters or fewer."),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must include an uppercase letter.")
    .regex(/[a-z]/, "Password must include a lowercase letter.")
    .regex(/[0-9]/, "Password must include a number."),
  confirmPassword: z.string().min(1, "Confirm your new password."),
}).superRefine((values, context) => {
  if (values.newPassword === values.currentPassword) {
    context.addIssue({ code: "custom", path: ["newPassword"], message: "New password must differ from current password." })
  }
  if (values.newPassword !== values.confirmPassword) {
    context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match." })
  }
})
