import { z } from "zod"

import type { LoginValues } from "@/features/auth/schemas/login.schema"
import { apiClient } from "@/lib/api/client"

const AuthUserSchema = z.object({
  username: z.string(),
})

export type AuthUser = z.infer<typeof AuthUserSchema>

export async function login(values: LoginValues): Promise<AuthUser> {
  const data = await apiClient.post<unknown>("/auth/login", values)
  return AuthUserSchema.parse(data)
}

export async function logout(): Promise<void> {
  await apiClient.post<void>("/auth/logout", {})
}

export async function getCurrentUser(): Promise<AuthUser> {
  const data = await apiClient.get<unknown>("/auth/me")
  return AuthUserSchema.parse(data)
}
