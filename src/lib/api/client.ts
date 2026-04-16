import { getAuthToken } from "@/lib/auth/token"

import { fetcher } from "./fetcher"

async function withAuth(): Promise<{ token?: string }> {
  const token = await getAuthToken()
  return token ? { token } : {}
}

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    return fetcher<T>(path, { method: "GET", ...(await withAuth()) })
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    return fetcher<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      ...(await withAuth()),
    })
  },

  async patch<T>(path: string, body: unknown): Promise<T> {
    return fetcher<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...(await withAuth()),
    })
  },

  async delete<T = void>(path: string): Promise<T> {
    return fetcher<T>(path, { method: "DELETE", ...(await withAuth()) })
  },

  async put<T>(path: string, body: unknown): Promise<T> {
    return fetcher<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
      ...(await withAuth()),
    })
  },
}
