---
title: Section 3 — Dashboard Layout + Routing Design
date: 2026-04-17
status: approved
---

# Dashboard Layout + Routing Design

## Overview

The `(dashboard)` route group wraps all application pages under a shared sidebar layout. It covers the generation surface (`/generate`, `/jobs/[id]`) and the admin surface (`/admin/*`). The root `app/page.tsx` redirects to `/generate`.

`constants/routes.ts` already exists and is complete — no changes needed.

## Architecture

shadcn's `sidebar` component (`@shadcn/sidebar`) provides `SidebarProvider`, `Sidebar`, `SidebarContent`, `SidebarMenu`, `SidebarMenuItem`, and `SidebarMenuButton` primitives. The provider handles mobile Sheet toggle state internally — no Zustand needed for sidebar state.

`AppSidebar` is a dedicated client component at `components/layout/AppSidebar.tsx`. It uses `usePathname()` from `next/navigation` for active link detection and renders the full nav tree.

The dashboard layout wraps content in `SidebarProvider` → `AppSidebar` + `<main>`, giving all child pages access to the sidebar context.

## File Layout

```
app/
  page.tsx                          ← exists: redirects to /generate
  (dashboard)/
    layout.tsx                      ← new: SidebarProvider + AppSidebar + <main>
    loading.tsx                     ← new: dashboard-level Suspense fallback
    error.tsx                       ← new: dashboard-level error boundary
    generate/
      page.tsx                      ← new: stub Server Component
    jobs/
      [id]/
        page.tsx                    ← new: stub Server Component
    admin/
      page.tsx                      ← new: redirects to /admin/products
      products/page.tsx             ← new: stub
      colours/page.tsx              ← new: stub
      countries/page.tsx            ← new: stub
      shot-types/page.tsx           ← new: stub
      installation-types/page.tsx   ← new: stub
      prompt-templates/page.tsx     ← new: stub
      overrides/page.tsx            ← new: stub

components/
  layout/
    AppSidebar.tsx                  ← new: "use client" sidebar nav component
  ui/
    sidebar.tsx                     ← new: added via pnpm shadcn add sidebar

constants/
  routes.ts                         ← exists: already complete, no changes
```

## Component Interfaces

### `app/(dashboard)/layout.tsx`

Server Component. Wraps children in `SidebarProvider` and renders `AppSidebar` alongside `<main>`.

```tsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex items-center gap-2 p-4 md:hidden">
          <SidebarTrigger />
        </div>
        {children}
      </main>
    </SidebarProvider>
  )
}
```

`SidebarTrigger` renders the hamburger toggle and is hidden on `md:` and above — shadcn's sidebar handles its own visibility at the provider level.

### `components/layout/AppSidebar.tsx`

Client component. Reads `usePathname()` to determine active links. Renders two nav groups: a single "Generate" link and a labelled "Admin" group with 7 sub-links.

**Nav structure:**

| Label | Route |
|---|---|
| Generate | `/generate` |
| — *Admin section header* | — |
| Products | `/admin/products` |
| Colours / RAL | `/admin/colours` |
| Countries | `/admin/countries` |
| Shot Types | `/admin/shot-types` |
| Installation Types | `/admin/installation-types` |
| Prompt Templates | `/admin/prompt-templates` |
| Prompt Overrides | `/admin/overrides` |

**Active state logic:**
- Generate: exact match (`pathname === ROUTES.generate`)
- Admin links: `pathname.startsWith(route)` — covers nested routes like `/admin/products/new` when those are added later

Uses `SidebarMenuButton asChild` with Next.js `<Link>` for client-side navigation. `isActive` prop drives the active style.

### `app/(dashboard)/loading.tsx`

Server Component (no `"use client"` needed). Renders a full-width skeleton placeholder using the shadcn `Skeleton` component (already installed from Section 2).

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
```

### `app/(dashboard)/error.tsx`

Client component (`"use client"` required — receives `reset` function prop). Shows the error message and a "Try again" button.

```tsx
"use client"

import { Button } from "@/components/ui/button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-4">
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button variant="outline" onClick={reset}>Try again</Button>
    </div>
  )
}
```

### Page stubs

Each stub is a Server Component that renders the shared `PageHeader` from Section 2 with the page title. This confirms routing works and shared components are wired up correctly.

**Example — `app/(dashboard)/generate/page.tsx`:**
```tsx
import { PageHeader } from "@/components/shared"

export default function GeneratePage() {
  return <PageHeader title="Generate" description="Select options and generate product images." />
}
```

**Admin page stubs** follow the same pattern with appropriate titles. `app/(dashboard)/admin/page.tsx` redirects to `ROUTES.admin.products`.

### `constants/routes.ts`

Already complete. Exports `ROUTES` with `generate`, `job(id)`, and `admin.*` paths. No changes.

## Mobile Behaviour

On viewports below `md` (768px), the sidebar is hidden and `SidebarTrigger` renders a hamburger button. Tapping it opens the sidebar as a Sheet overlay — handled entirely by `SidebarProvider`. No custom mobile state logic needed.

Note: REQUIREMENTS.md lists mobile responsive as V2 out-of-scope. The basic mobile toggle included here is a low-cost addition enabled by shadcn's sidebar primitives and does not block the V1 desktop-first goal.

## Testing

Checkpoint: all routes resolve, sidebar renders, active links highlight correctly. Verified by running `pnpm dev` and navigating to `/generate`, `/admin/products`, and `/jobs/test-id`. Type-check passes (`pnpm type-check`).

No Vitest tests for the layout itself — routing and navigation are integration-level concerns better verified manually or via e2e tests (out of scope for V1).
