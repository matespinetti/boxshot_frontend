# Section 1 — Base Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the full project skeleton — `src/` layout, API client layer, env validation, utilities, constants, and providers — so that all subsequent feature sections have a consistent foundation and `pnpm type-check` passes with zero errors.

**Architecture:** Move existing `app/` into `src/app/`, update tsconfig paths to `"@/*": ["./src/*"]`, then create `lib/`, `constants/`, and skeleton feature directories under `src/`. All HTTP calls funnel through `lib/api/fetcher.ts` → `lib/api/client.ts`. Providers live in `src/app/providers.tsx` (client component) imported by the server-component `layout.tsx`.

**Tech Stack:** Next.js 15 App Router, TypeScript strict mode, TanStack Query v5, Zod, clsx + tailwind-merge, sonner, Vitest

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `tsconfig.json` | Modify | Update `@/*` alias to `./src/*`; add `type-check` script awareness |
| `package.json` | Modify | Add `type-check` and `test`/`test:run` scripts |
| `vitest.config.ts` | Create | Vitest config with `@/` alias and node environment |
| `src/test/setup.ts` | Create | Empty Vitest setup file (placeholder for Testing Library later) |
| `src/app/globals.css` | Move | Migrate from `app/globals.css` |
| `src/app/layout.tsx` | Move + Modify | Migrate; add `<Providers>`, update metadata |
| `src/app/page.tsx` | Move + Modify | Migrate; redirect to `/generate` via ROUTES |
| `src/app/providers.tsx` | Create | `"use client"` — QueryClientProvider + Toaster |
| `src/lib/env/index.ts` | Create | Zod-validated `NEXT_PUBLIC_API_URL`; throws at startup if missing |
| `src/lib/api/errors.ts` | Create | `ApiError`, `NotFoundError`, `NetworkError`, `TimeoutError` |
| `src/lib/api/types.ts` | Create | `PaginatedResponse<T>` matching backend shape |
| `src/lib/api/fetcher.ts` | Create | Single `fetch()` call, timeout, error normalisation |
| `src/lib/api/client.ts` | Create | Typed `get/post/patch/delete/put` methods |
| `src/lib/auth/token.ts` | Create | `getAuthToken()` stub — always returns null (V1) |
| `src/lib/utils/cn.ts` | Create | clsx + tailwind-merge helper |
| `src/lib/utils/formatters.ts` | Create | `formatDate`, `formatFileSize`, `formatStatusLabel` |
| `src/lib/utils/__tests__/formatters.test.ts` | Create | Unit tests for all three formatters |
| `src/constants/routes.ts` | Create | Typed `ROUTES` object |
| `src/constants/status.ts` | Create | `ImageStatus`, `JobStatus` enums + labels + colours |
| `src/constants/__tests__/status.test.ts` | Create | Tests: every status value has a label and colour |

Skeleton empty directories (no files needed — Next.js and TypeScript ignore empty dirs):
`src/components/ui/`, `src/components/shared/`, `src/features/generation/`, `src/features/jobs/`, `src/features/images/`, `src/features/admin/`, `src/hooks/`, `src/types/`

---

## Task 1: Install packages + add scripts

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Install runtime and dev dependencies**

Run from `frontend/`:
```bash
pnpm add @tanstack/react-query zod clsx tailwind-merge sonner
pnpm add -D @tanstack/react-query-devtools vitest
```

Expected: no errors, packages appear in `package.json`.

- [ ] **Step 2: Add scripts to `package.json`**

Open `frontend/package.json`. The current `scripts` block is:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "lint": "eslint"
}
```

Replace with:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "lint": "eslint",
  "type-check": "tsc --noEmit",
  "test": "vitest",
  "test:run": "vitest run"
}
```

- [ ] **Step 3: Create `vitest.config.ts` at `frontend/`**

```ts
import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

- [ ] **Step 4: Create `src/test/setup.ts`**

```ts
// Vitest setup — add @testing-library/jest-dom import here when component tests are added
```

- [ ] **Step 5: Verify Vitest runs**

```bash
pnpm test:run
```

Expected: "No test files found" — not an error, just no tests yet.

- [ ] **Step 6: Commit**

```bash
git add package.json vitest.config.ts src/test/setup.ts
git commit -m "chore: install base deps and add type-check/test scripts"
```

---

## Task 2: Migrate to `src/` layout

**Files:**
- Move: `app/` → `src/app/`
- Modify: `tsconfig.json`

- [ ] **Step 1: Move existing files into `src/`**

```bash
mkdir -p src/app
mv app/layout.tsx src/app/layout.tsx
mv app/page.tsx src/app/page.tsx
mv app/globals.css src/app/globals.css
mv app/favicon.ico src/app/favicon.ico
rmdir app
```

- [ ] **Step 2: Update `tsconfig.json` paths**

Open `frontend/tsconfig.json`. Find:
```json
"paths": {
  "@/*": ["./*"]
}
```

Replace with:
```json
"paths": {
  "@/*": ["./src/*"]
}
```

Also update the `include` array to keep `next-env.d.ts` at root:
```json
"include": [
  "next-env.d.ts",
  "src/**/*.ts",
  "src/**/*.tsx",
  ".next/types/**/*.ts",
  ".next/dev/types/**/*.ts",
  "vitest.config.ts"
]
```

- [ ] **Step 3: Fix the `globals.css` import in `layout.tsx`**

Open `src/app/layout.tsx`. The import currently reads `"./globals.css"` — that stays correct since both files are now in `src/app/`. No change needed.

- [ ] **Step 4: Create skeleton directories**

```bash
mkdir -p src/components/ui
mkdir -p src/components/shared
mkdir -p src/features/generation
mkdir -p src/features/jobs
mkdir -p src/features/images
mkdir -p src/features/admin
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/lib/api
mkdir -p src/lib/auth
mkdir -p src/lib/env
mkdir -p src/lib/utils/__tests__
mkdir -p src/constants/__tests__
```

- [ ] **Step 5: Verify type-check still passes**

```bash
pnpm type-check
```

Expected: 0 errors. If Next.js complains about missing `app/` — make sure `.next/` cache is cleared: `rm -rf .next && pnpm type-check`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: migrate to src/ layout, update tsconfig paths"
```

---

## Task 3: `lib/env/index.ts`

**Files:**
- Create: `src/lib/env/index.ts`

> No dedicated test file — env validation is tested by type-check + runtime behaviour at startup. Testing it in isolation would require mocking `process.env` with module resets, which adds Vitest complexity not worth it for a two-field schema.

- [ ] **Step 1: Create `src/lib/env/index.ts`**

```ts
import { z } from "zod"

const schema = z.object({
  NEXT_PUBLIC_API_URL: z.string().min(1, "NEXT_PUBLIC_API_URL is required"),
})

export const env = schema.parse(process.env)
```

- [ ] **Step 2: Verify type-check**

```bash
pnpm type-check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/env/index.ts
git commit -m "feat: add Zod-validated env with NEXT_PUBLIC_API_URL"
```

---

## Task 4: `lib/api/errors.ts` and `lib/api/types.ts`

**Files:**
- Create: `src/lib/api/errors.ts`
- Create: `src/lib/api/types.ts`

- [ ] **Step 1: Create `src/lib/api/errors.ts`**

```ts
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export class NotFoundError extends ApiError {
  constructor(resource?: string) {
    super(404, resource ? `${resource} not found` : "Not found")
    this.name = "NotFoundError"
  }
}

export class NetworkError extends Error {
  constructor() {
    super("Network error — check your connection")
    this.name = "NetworkError"
  }
}

export class TimeoutError extends Error {
  constructor() {
    super("Request timed out")
    this.name = "TimeoutError"
  }
}

// UnauthorizedError — add here in V2 (status 401, triggers redirect to /login)
```

- [ ] **Step 2: Create `src/lib/api/types.ts`**

```ts
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}
```

Note: field is `per_page` (matching the FastAPI backend), NOT `size`.

- [ ] **Step 3: Verify type-check**

```bash
pnpm type-check
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/errors.ts src/lib/api/types.ts
git commit -m "feat: add API error classes and PaginatedResponse type"
```

---

## Task 5: `lib/api/fetcher.ts`

**Files:**
- Create: `src/lib/api/fetcher.ts`

- [ ] **Step 1: Create `src/lib/api/fetcher.ts`**

```ts
import { env } from "@/lib/env"
import { ApiError, NetworkError, TimeoutError } from "./errors"

const DEFAULT_TIMEOUT_MS = 30_000

interface FetcherOptions extends RequestInit {
  token?: string
  timeout?: number
}

function extractErrorMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "Request failed"
  const b = body as Record<string, unknown>

  if (Array.isArray(b.detail)) {
    return (b.detail as Array<{ msg?: string; loc?: unknown[] }>)
      .map((e) => {
        const field = Array.isArray(e.loc) ? e.loc.slice(1).join(".") : ""
        return field ? `${field}: ${e.msg ?? "invalid"}` : (e.msg ?? "invalid")
      })
      .join("; ")
  }

  if (typeof b.detail === "string") return b.detail
  if (typeof b.message === "string") return b.message
  return "Request failed"
}

export async function fetcher<T>(path: string, options: FetcherOptions = {}): Promise<T> {
  const { token, timeout = DEFAULT_TIMEOUT_MS, ...init } = options

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers ?? {}),
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  let res: Response
  try {
    res = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new TimeoutError()
    }
    throw new NetworkError()
  } finally {
    clearTimeout(timeoutId)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message = extractErrorMessage(body)
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
```

- [ ] **Step 2: Verify type-check**

```bash
pnpm type-check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/fetcher.ts
git commit -m "feat: add base fetcher with timeout and error normalisation"
```

---

## Task 6: `lib/api/client.ts` and `lib/auth/token.ts`

**Files:**
- Create: `src/lib/auth/token.ts`
- Create: `src/lib/api/client.ts`

- [ ] **Step 1: Create `src/lib/auth/token.ts`**

```ts
export async function getAuthToken(): Promise<string | null> {
  return null // no auth in V1 — read cookie here in V2
}
```

- [ ] **Step 2: Create `src/lib/api/client.ts`**

```ts
import { fetcher } from "./fetcher"
import { getAuthToken } from "@/lib/auth/token"

async function withAuth(): Promise<{ token?: string }> {
  // no auth in V1 — wire token here in V2
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
```

- [ ] **Step 3: Verify type-check**

```bash
pnpm type-check
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth/token.ts src/lib/api/client.ts
git commit -m "feat: add API client with auth stub (V1: no auth)"
```

---

## Task 7: `lib/utils/cn.ts` and `lib/utils/formatters.ts`

**Files:**
- Create: `src/lib/utils/cn.ts`
- Create: `src/lib/utils/formatters.ts`
- Create: `src/lib/utils/__tests__/formatters.test.ts`

- [ ] **Step 1: Write failing tests for formatters**

Create `src/lib/utils/__tests__/formatters.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { formatDate, formatFileSize, formatStatusLabel } from "../formatters"

describe("formatDate", () => {
  it("formats an ISO date string as a locale date", () => {
    const result = formatDate("2026-04-16T10:00:00Z")
    expect(result).toMatch(/2026/)
    expect(typeof result).toBe("string")
    expect(result.length).toBeGreaterThan(0)
  })
})

describe("formatFileSize", () => {
  it("formats bytes as B", () => {
    expect(formatFileSize(500)).toBe("500 B")
  })

  it("formats kilobytes with one decimal", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB")
  })

  it("formats megabytes with one decimal", () => {
    expect(formatFileSize(2621440)).toBe("2.5 MB")
  })

  it("formats gigabytes with one decimal", () => {
    expect(formatFileSize(1073741824)).toBe("1.0 GB")
  })
})

describe("formatStatusLabel", () => {
  it("returns the mapped label for a known status", () => {
    expect(formatStatusLabel("approved")).toBe("Approved")
    expect(formatStatusLabel("generating")).toBe("Generating")
  })

  it("title-cases unknown statuses as fallback", () => {
    expect(formatStatusLabel("some_status")).toBe("Some status")
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test:run
```

Expected: FAIL — `Cannot find module '../formatters'`

- [ ] **Step 3: Create `src/lib/utils/cn.ts`**

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 4: Create `src/lib/utils/formatters.ts`**

Note: `formatStatusLabel` imports from `@/constants/status` — that file doesn't exist yet, so we use a forward-safe approach: inline the lookup with a dynamic import fallback. Actually, to avoid a circular dependency concern and a missing module at this point, we'll create `constants/status.ts` first in the next task and come back. Instead, implement `formatStatusLabel` with a simple title-case fallback for now and update it after Task 8.

```ts
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString()
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function formatStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm test:run
```

Expected: all 6 tests PASS.

- [ ] **Step 6: Verify type-check**

```bash
pnpm type-check
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/utils/cn.ts src/lib/utils/formatters.ts src/lib/utils/__tests__/formatters.test.ts
git commit -m "feat: add cn helper and formatter utilities with tests"
```

---

## Task 8: `constants/routes.ts` and `constants/status.ts`

**Files:**
- Create: `src/constants/routes.ts`
- Create: `src/constants/status.ts`
- Create: `src/constants/__tests__/status.test.ts`
- Modify: `src/lib/utils/formatters.ts` (wire STATUS_LABELS)

- [ ] **Step 1: Write failing tests for status constants**

Create `src/constants/__tests__/status.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import {
  ImageStatus,
  JobStatus,
  STATUS_LABELS,
  STATUS_COLORS,
} from "../status"

const ALL_IMAGE_STATUSES = Object.values(ImageStatus)
const ALL_JOB_STATUSES = Object.values(JobStatus)
const ALL_STATUSES = [...new Set([...ALL_IMAGE_STATUSES, ...ALL_JOB_STATUSES])]

describe("STATUS_LABELS", () => {
  it("has a label for every ImageStatus value", () => {
    for (const status of ALL_IMAGE_STATUSES) {
      expect(STATUS_LABELS[status], `missing label for "${status}"`).toBeDefined()
    }
  })

  it("has a label for every JobStatus value", () => {
    for (const status of ALL_JOB_STATUSES) {
      expect(STATUS_LABELS[status], `missing label for "${status}"`).toBeDefined()
    }
  })
})

describe("STATUS_COLORS", () => {
  it("has a colour for every status value", () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_COLORS[status], `missing colour for "${status}"`).toBeDefined()
    }
  })

  it("colour values are non-empty strings", () => {
    for (const status of ALL_STATUSES) {
      expect(typeof STATUS_COLORS[status]).toBe("string")
      expect(STATUS_COLORS[status].length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test:run
```

Expected: FAIL — `Cannot find module '../status'`

- [ ] **Step 3: Create `src/constants/routes.ts`**

```ts
export const ROUTES = {
  generate: "/generate",
  job: (id: string) => `/jobs/${id}`,
  admin: {
    root: "/admin",
    products: "/admin/products",
    colours: "/admin/colours",
    countries: "/admin/countries",
    shotTypes: "/admin/shot-types",
    installationTypes: "/admin/installation-types",
    promptTemplates: "/admin/prompt-templates",
    overrides: "/admin/overrides",
  },
} as const
```

- [ ] **Step 4: Create `src/constants/status.ts`**

```ts
export enum ImageStatus {
  Pending = "pending",
  Generating = "generating",
  Complete = "complete",
  Failed = "failed",
  Approved = "approved",
  Rejected = "rejected",
}

export enum JobStatus {
  Idle = "idle",
  Generating = "generating",
  Complete = "complete",
  Failed = "failed",
}

export const STATUS_LABELS: Record<string, string> = {
  [ImageStatus.Pending]: "Pending",
  [ImageStatus.Generating]: "Generating",
  [ImageStatus.Complete]: "Complete",
  [ImageStatus.Failed]: "Failed",
  [ImageStatus.Approved]: "Approved",
  [ImageStatus.Rejected]: "Rejected",
  [JobStatus.Idle]: "Idle",
}

export const STATUS_COLORS: Record<string, string> = {
  [ImageStatus.Pending]: "bg-gray-100 text-gray-700",
  [ImageStatus.Generating]: "bg-blue-100 text-blue-700",
  [ImageStatus.Complete]: "bg-green-100 text-green-800",
  [ImageStatus.Failed]: "bg-red-100 text-red-700",
  [ImageStatus.Approved]: "bg-emerald-100 text-emerald-800",
  [ImageStatus.Rejected]: "bg-zinc-100 text-zinc-500",
  [JobStatus.Idle]: "bg-gray-100 text-gray-700",
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm test:run
```

Expected: all 4 tests PASS.

- [ ] **Step 6: Wire STATUS_LABELS into `formatStatusLabel`**

Open `src/lib/utils/formatters.ts`. Replace the entire file:

```ts
import { STATUS_LABELS } from "@/constants/status"

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString()
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function formatStatusLabel(status: string): string {
  return (
    STATUS_LABELS[status] ??
    status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")
  )
}
```

- [ ] **Step 7: Run all tests**

```bash
pnpm test:run
```

Expected: all tests PASS (formatters + status).

- [ ] **Step 8: Verify type-check**

```bash
pnpm type-check
```

Expected: 0 errors.

- [ ] **Step 9: Commit**

```bash
git add src/constants/routes.ts src/constants/status.ts src/constants/__tests__/status.test.ts src/lib/utils/formatters.ts
git commit -m "feat: add ROUTES, ImageStatus/JobStatus enums with labels and colours"
```

---

## Task 9: `app/providers.tsx`

**Files:**
- Create: `src/app/providers.tsx`

- [ ] **Step 1: Create `src/app/providers.tsx`**

```tsx
"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            staleTime: 30_000,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

- [ ] **Step 2: Verify type-check**

```bash
pnpm type-check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/providers.tsx
git commit -m "feat: add QueryClient + Toaster providers"
```

---

## Task 10: Update `app/layout.tsx` and `app/page.tsx`

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Providers } from "./providers"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "ParcelFlow",
  description: "AI product image generation",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Replace `src/app/page.tsx`**

```tsx
import { redirect } from "next/navigation"
import { ROUTES } from "@/constants/routes"

export default function Home() {
  redirect(ROUTES.generate)
}
```

- [ ] **Step 3: Verify type-check**

```bash
pnpm type-check
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "feat: wire Providers into layout, redirect root to /generate"
```

---

## Task 11: Final checkpoint

- [ ] **Step 1: Run all tests**

```bash
pnpm test:run
```

Expected: all tests PASS — no failures, no skipped.

- [ ] **Step 2: Run type-check**

```bash
pnpm type-check
```

Expected: 0 errors.

- [ ] **Step 3: Start dev server and verify no runtime errors**

```bash
pnpm dev
```

Open `http://localhost:3000`. Expected: browser redirects to `/generate` (404 page is fine — the route doesn't exist yet). No console errors about missing env vars means `NEXT_PUBLIC_API_URL` is set in `.env.local`. If it throws a Zod error on startup, create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: Section 1 base infrastructure complete — type-check passes"
```

---

## Post-Checkpoint: What's next

Section 2 will build on this foundation. All imports use `@/` alias. All API calls go through `apiClient`. All status display uses `STATUS_LABELS` / `STATUS_COLORS`. All routes reference `ROUTES`.
