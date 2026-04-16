import { env } from "@/lib/env"

import { ApiError, NetworkError, TimeoutError } from "./errors"

const DEFAULT_TIMEOUT_MS = 30_000

interface FetcherOptions extends RequestInit {
  token?: string
  timeout?: number
}

function extractErrorMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "Request failed"
  const candidate = body as Record<string, unknown>

  if (Array.isArray(candidate.detail)) {
    return (candidate.detail as Array<{ loc?: unknown[]; msg?: string }>)
      .map((error) => {
        const field = Array.isArray(error.loc) ? error.loc.slice(1).join(".") : ""
        return field ? `${field}: ${error.msg ?? "invalid"}` : (error.msg ?? "invalid")
      })
      .join("; ")
  }

  if (typeof candidate.detail === "string") return candidate.detail
  if (typeof candidate.message === "string") return candidate.message

  return "Request failed"
}

export async function fetcher<T>(
  path: string,
  options: FetcherOptions = {},
): Promise<T> {
  const { token, timeout = DEFAULT_TIMEOUT_MS, ...init } = options

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers ?? {}),
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  let response: Response

  try {
    response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new TimeoutError()
    }

    throw new NetworkError()
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const message = extractErrorMessage(body)
    throw new ApiError(response.status, message)
  }

  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}
