# Section 1 — Base Infrastructure Design

**Date:** 2026-04-16  
**Scope:** ParcelFlow frontend base infrastructure — folder structure, API client, env validation, utilities, constants, providers.

---

## Goals

Stand up the full project skeleton so that all subsequent feature sections can be built on a consistent foundation. After this section, `pnpm type-check` passes with zero errors.

---

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Directory layout | `src/` at `frontend/src/` | Matches ARCHITECTURE.md; all feature work references `src/` |
| tsconfig paths | `"@/*": ["./src/*"]` | Updated to match `src/` root |
| Auth in V1 | Stubbed (`withAuth()` returns `{}`) | One-file change when V2 auth lands |
| `PaginatedResponse` field | `per_page` | Matches actual backend shape (not `size` from skill default) |
| Providers | Separate `src/app/providers.tsx` | Keeps `layout.tsx` a Server Component; clean extension point |
| Section 1 deps only | `@tanstack/react-query`, `zod`, `clsx`, `tailwind-merge`, `sonner` | Defers nuqs/zustand/rhf to the sections that need them |

---

## Directory Structure

```
src/
  app/
    layout.tsx            # Server Component — imports <Providers>
    page.tsx              # Redirects to /generate
    providers.tsx         # "use client" — QueryClientProvider + Toaster
    globals.css
    (dashboard)/          # empty skeleton
    api/                  # empty skeleton
  components/
    ui/                   # shadcn target (auto-generated, never edit)
    shared/               # empty skeleton
  features/
    generation/
    jobs/
    images/
    admin/
  lib/
    api/
      fetcher.ts          # Only place fetch() is called
      client.ts           # get/post/patch/delete/put typed methods
      errors.ts           # ApiError, NotFoundError, NetworkError, TimeoutError
      types.ts            # PaginatedResponse<T>
    auth/
      token.ts            # getAuthToken() stub — returns null (no auth V1)
    env/
      index.ts            # Zod-validated NEXT_PUBLIC_API_URL
    utils/
      cn.ts               # clsx + tailwind-merge
      formatters.ts       # formatDate, formatFileSize, formatStatusLabel
  hooks/                  # empty skeleton
  types/                  # empty skeleton
  constants/
    routes.ts             # ROUTES object
    status.ts             # ImageStatus, JobStatus enums + labels + colours
```

---

## Packages

Install inside `frontend/`:

```bash
pnpm add @tanstack/react-query zod clsx tailwind-merge sonner
pnpm add -D @tanstack/react-query-devtools
```

Root `node_modules` (shadcn CLI) is unrelated — do not touch.

---

## File Specs

### `lib/env/index.ts`

Zod schema over `process.env`. Throws at module load if `NEXT_PUBLIC_API_URL` is missing or empty. Exports a typed `env` object consumed by `fetcher.ts`.

```ts
const schema = z.object({
  NEXT_PUBLIC_API_URL: z.string().min(1),
})
export const env = schema.parse(process.env)
```

---

### `lib/api/errors.ts`

```ts
ApiError(status: number, message: string)     // base
NotFoundError(resource?: string)               // 404
NetworkError()                                 // fetch() threw — no connection
TimeoutError()                                 // AbortController fired
// UnauthorizedError — add here in V2
```

---

### `lib/api/types.ts`

```ts
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number   // matches backend — NOT "size"
  pages: number
}
```

---

### `lib/api/fetcher.ts`

- Single `fetch()` call; base URL from `env.NEXT_PUBLIC_API_URL`
- 30s timeout via `AbortController`
- Sets `Content-Type: application/json`; attaches `Authorization: Bearer <token>` if token provided
- On network failure → `NetworkError`; on abort → `TimeoutError`
- On non-2xx: parses body, normalises both FastAPI error shapes:
  - `{ detail: string }` → use directly
  - `{ detail: [{loc, msg, type}] }` → join field messages
- 204 → returns `undefined as T`
- No retry logic here — TanStack Query handles retries

---

### `lib/api/client.ts`

```ts
export const apiClient = {
  get<T>(path: string): Promise<T>
  post<T>(path: string, body: unknown): Promise<T>
  patch<T>(path: string, body: unknown): Promise<T>
  delete<T = void>(path: string): Promise<T>
  put<T>(path: string, body: unknown): Promise<T>
}
```

`withAuth()` always returns `{}`. Comment: `// no auth in V1 — wire token here in V2`.

---

### `lib/auth/token.ts`

```ts
export async function getAuthToken(): Promise<string | null> {
  return null // no auth in V1 — read cookie here in V2
}
```

---

### `lib/utils/cn.ts`

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

### `lib/utils/formatters.ts`

| Function | Signature | Notes |
|---|---|---|
| `formatDate` | `(iso: string) => string` | `toLocaleDateString()` |
| `formatFileSize` | `(bytes: number) => string` | KB/MB/GB, 1 decimal |
| `formatStatusLabel` | `(status: string) => string` | Looks up `STATUS_LABELS`, falls back to title-case |

---

### `constants/routes.ts`

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

---

### `constants/status.ts`

**`ImageStatus`** enum values: `pending`, `generating`, `complete`, `failed`, `approved`, `rejected`

**`JobStatus`** enum values: `idle`, `generating`, `complete`, `failed`

Each status has a `STATUS_LABELS` entry (human-readable string) and a `STATUS_COLORS` entry (Tailwind badge classes):

| Status | Label | Color classes |
|---|---|---|
| `pending` | Pending | `bg-gray-100 text-gray-700` |
| `generating` | Generating | `bg-blue-100 text-blue-700` |
| `complete` | Complete | `bg-green-100 text-green-800` |
| `failed` | Failed | `bg-red-100 text-red-700` |
| `approved` | Approved | `bg-emerald-100 text-emerald-800` |
| `rejected` | Rejected | `bg-zinc-100 text-zinc-500` |
| `idle` | Idle | `bg-gray-100 text-gray-700` |

---

### `app/providers.tsx`

`"use client"`. Creates `QueryClient` via `useState` (stable across re-renders). Default options: `retry: 2`, `staleTime: 30_000`. Renders `<QueryClientProvider>` wrapping children, `<Toaster richColors />` inside.

---

### `app/layout.tsx`

Server Component. Updated metadata (`title: "ParcelFlow"`). Wraps `{children}` in `<Providers>`. Retains Geist font setup.

---

### `app/page.tsx`

Redirects to `/generate` via Next.js `redirect()`.

---

## Checkpoint

`pnpm type-check` (from `frontend/`) passes with zero errors.

---

## Out of Scope

- nuqs, Zustand, React Hook Form (later sections)
- All feature modules (`features/`, `components/shared/`, `hooks/`, `types/`)
- Route handlers in `app/api/`
- shadcn component installation
