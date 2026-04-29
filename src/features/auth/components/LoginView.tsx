"use client"

import { useState } from "react"
import { LockKeyhole } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { ROUTES } from "@/constants/routes"
import { login } from "@/features/auth/api/auth"
import { type LoginValues } from "@/features/auth/schemas/login.schema"
import { ApiError } from "@/lib/api/errors"

import { LoginForm } from "./LoginForm"

export function LoginView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string>()

  async function handleSubmit(values: LoginValues) {
    setError(undefined)
    try {
      await login(values)
      router.replace(searchParams.get("next") || ROUTES.generate)
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed")
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <section className="w-full max-w-sm space-y-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LockKeyhole className="size-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">ParcelFlow</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to continue
            </p>
          </div>
        </div>

        <LoginForm onSubmit={handleSubmit} error={error} />
      </section>
    </main>
  )
}
