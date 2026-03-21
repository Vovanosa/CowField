import { z } from 'zod'

export const registerInputSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
})

export const loginInputSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export const requestPasswordResetInputSchema = z.object({
  email: z.string().trim().email(),
})

export const resetPasswordInputSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

export type RegisterInput = z.infer<typeof registerInputSchema>
export type LoginInput = z.infer<typeof loginInputSchema>
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetInputSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>
