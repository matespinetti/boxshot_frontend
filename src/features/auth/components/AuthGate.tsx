"use client"

import { type ReactNode, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { usePathname, useRouter } from "next/navigation"

import { getCurrentUser } from "@/features/auth/api/auth"
import { ApiError } from "@/lib/api/errors"

interface AuthGateProps {
  children: ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter()
  const pathname = usePathname()
  const authQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    retry: false,
  })

  useEffect(() => {
    if (
      authQuery.error instanceof ApiError &&
      authQuery.error.status === 401
    ) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [authQuery.error, pathname, router])

  if (authQuery.isPending) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Checking session...</p>
      </main>
    )
  }

  if (authQuery.error) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Redirecting to login...</p>
      </main>
    )
  }

  return children
}
