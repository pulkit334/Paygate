import * as z from "zod";

export const RegisterAppSchema = z.object({
  name: z.string().min(3).max(50),
  ownerEmail: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 characters"),
  callbackUrl: z.string().url().optional(),
})

export const LoginSchema = z.object({
  ownerEmail: z.string().email("Invalid email"),
  password: z.string().min(8, "Password required").max(16)
})

export type RegisterAppInput = z.infer<typeof RegisterAppSchema>
export type LoginInput = z.infer<typeof LoginSchema>