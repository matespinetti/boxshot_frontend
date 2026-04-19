# Dashboard Layout + Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `(dashboard)` route group with a shadcn sidebar layout, all route stubs, and loading/error boundaries so every app route resolves and navigation works.

**Architecture:** shadcn `sidebar` primitives (`SidebarProvider`, `Sidebar`, `SidebarMenuButton`) wrap all dashboard pages. `AppSidebar` is a dedicated `"use client"` component that reads `usePathname()` for active state. All page files are Server Component stubs — no feature logic yet.

**Tech Stack:** Next.js 15 App Router, shadcn/ui sidebar, Tailwind CSS v4, Vitest + Testing Library (jsdom)

---

## File Map

| File | Status | Purpose |
|---|---|---|
| `src/components/ui/sidebar.tsx` | Create (shadcn) | shadcn sidebar primitives |
| `src/test/setup.ts` | Modify | Add ResizeObserver mock |
| `src/components/layout/AppSidebar.tsx` | Create | "use client" sidebar nav |
| `src/components/layout/__tests__/AppSidebar.test.tsx` | Create | Smoke test for nav links + active state |
| `src/app/(dashboard)/layout.tsx` | Create | SidebarProvider + AppSidebar + main |
| `src/app/(dashboard)/loading.tsx` | Create | Skeleton fallback |
| `src/app/(dashboard)/error.tsx` | Create | Error boundary with reset |
| `src/app/(dashboard)/generate/page.tsx` | Create | Stub page |
| `src/app/(dashboard)/jobs/[id]/page.tsx` | Create | Stub page |
| `src/app/(dashboard)/admin/page.tsx` | Create | Redirect to /admin/products |
| `src/app/(dashboard)/admin/products/page.tsx` | Create | Stub page |
| `src/app/(dashboard)/admin/colours/page.tsx` | Create | Stub page |
| `src/app/(dashboard)/admin/countries/page.tsx` | Create | Stub page |
| `src/app/(dashboard)/admin/shot-types/page.tsx` | Create | Stub page |
| `src/app/(dashboard)/admin/installation-types/page.tsx` | Create | Stub page |
| `src/app/(dashboard)/admin/prompt-templates/page.tsx` | Create | Stub page |
| `src/app/(dashboard)/admin/overrides/page.tsx` | Create | Stub page |

---

## Task 1: Install shadcn sidebar + patch test setup

**Files:**
- Create: `src/components/ui/sidebar.tsx` (via CLI)
- Modify: `src/test/setup.ts`

- [ ] **Step 1: Install shadcn sidebar component**

Run from `frontend/`:
```bash
pnpm shadcn add sidebar
```

Expected output: prints a list of files written, ending with something like `✓ Done`. This creates `src/components/ui/sidebar.tsx` (large file — shadcn sidebar ships many sub-components in one file).

- [ ] **Step 2: Verify the file exists**

```bash
ls src/components/ui/sidebar.tsx
```

Expected: file path printed, no error.

- [ ] **Step 3: Add ResizeObserver mock to test setup**

shadcn's sidebar uses `ResizeObserver` internally. jsdom doesn't implement it, which causes tests to crash. Add the mock to `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom"
import { vi } from "vitest"

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/sidebar.tsx src/test/setup.ts
git commit -m "feat: add shadcn sidebar component + ResizeObserver mock for tests"
```

---

## Task 2: AppSidebar — test then implement

**Files:**
- Create: `src/components/layout/__tests__/AppSidebar.test.tsx`
- Create: `src/components/layout/AppSidebar.tsx`

- [ ] **Step 1: Create the test file**

```bash
mkdir -p src/components/layout/__tests__
```

Create `src/components/layout/__tests__/AppSidebar.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppSidebar } from "../AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}))

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import { usePathname } from "next/navigation"
const mockUsePathname = vi.mocked(usePathname)

function renderSidebar() {
  return render(
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>,
  )
}

describe("AppSidebar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/generate")
  })

  it("renders all navigation links with correct hrefs", () => {
    renderSidebar()
    expect(screen.getByRole("link", { name: "Generate" })).toHaveAttribute("href", "/generate")
    expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute("href", "/admin/products")
    expect(screen.getByRole("link", { name: "Colours / RAL" })).toHaveAttribute("href", "/admin/colours")
    expect(screen.getByRole("link", { name: "Countries" })).toHaveAttribute("href", "/admin/countries")
    expect(screen.getByRole("link", { name: "Shot Types" })).toHaveAttribute("href", "/admin/shot-types")
    expect(screen.getByRole("link", { name: "Installation Types" })).toHaveAttribute("href", "/admin/installation-types")
    expect(screen.getByRole("link", { name: "Prompt Templates" })).toHaveAttribute("href", "/admin/prompt-templates")
    expect(screen.getByRole("link", { name: "Prompt Overrides" })).toHaveAttribute("href", "/admin/overrides")
  })

  it("marks Generate as active on /generate", () => {
    mockUsePathname.mockReturnValue("/generate")
    renderSidebar()
    expect(screen.getByRole("link", { name: "Generate" })).toHaveAttribute("data-active", "true")
  })

  it("does not mark Generate as active on an admin page", () => {
    mockUsePathname.mockReturnValue("/admin/products")
    renderSidebar()
    expect(screen.getByRole("link", { name: "Generate" })).not.toHaveAttribute("data-active", "true")
  })

  it("marks Products as active on /admin/products", () => {
    mockUsePathname.mockReturnValue("/admin/products")
    renderSidebar()
    expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute("data-active", "true")
  })

  it("marks Shot Types as active on /admin/shot-types", () => {
    mockUsePathname.mockReturnValue("/admin/shot-types")
    renderSidebar()
    expect(screen.getByRole("link", { name: "Shot Types" })).toHaveAttribute("data-active", "true")
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pnpm vitest run src/components/layout/__tests__/AppSidebar.test.tsx
```

Expected: FAIL — `Cannot find module '../AppSidebar'`

- [ ] **Step 3: Implement AppSidebar**

Create `src/components/layout/AppSidebar.tsx`:

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ROUTES } from "@/constants/routes"

const adminLinks = [
  { label: "Products", href: ROUTES.admin.products },
  { label: "Colours / RAL", href: ROUTES.admin.colours },
  { label: "Countries", href: ROUTES.admin.countries },
  { label: "Shot Types", href: ROUTES.admin.shotTypes },
  { label: "Installation Types", href: ROUTES.admin.installationTypes },
  { label: "Prompt Templates", href: ROUTES.admin.promptTemplates },
  { label: "Prompt Overrides", href: ROUTES.admin.overrides },
] as const

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-2 py-3">
            <span className="text-sm font-semibold tracking-tight">ParcelFlow</span>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === ROUTES.generate}>
                <Link href={ROUTES.generate}>Generate</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarMenu>
            {adminLinks.map((link) => (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton asChild isActive={pathname.startsWith(link.href)}>
                  <Link href={link.href}>{link.label}</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pnpm vitest run src/components/layout/__tests__/AppSidebar.test.tsx
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/AppSidebar.tsx src/components/layout/__tests__/AppSidebar.test.tsx
git commit -m "feat: add AppSidebar with nav links and active state"
```

---

## Task 3: Dashboard layout, loading, error

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/loading.tsx`
- Create: `src/app/(dashboard)/error.tsx`

- [ ] **Step 1: Create the route group directory**

```bash
mkdir -p src/app/\(dashboard\)
```

- [ ] **Step 2: Create layout.tsx**

Create `src/app/(dashboard)/layout.tsx`:

```tsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

- [ ] **Step 3: Create loading.tsx**

Create `src/app/(dashboard)/loading.tsx`:

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

- [ ] **Step 4: Create error.tsx**

Create `src/app/(dashboard)/error.tsx`:

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
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/layout.tsx src/app/\(dashboard\)/loading.tsx src/app/\(dashboard\)/error.tsx
git commit -m "feat: add dashboard layout with sidebar, loading skeleton, and error boundary"
```

---

## Task 4: Page stubs

**Files:** All `page.tsx` stubs under `src/app/(dashboard)/`

- [ ] **Step 1: Create subdirectories**

```bash
mkdir -p src/app/\(dashboard\)/generate
mkdir -p src/app/\(dashboard\)/jobs/\[id\]
mkdir -p src/app/\(dashboard\)/admin/products
mkdir -p src/app/\(dashboard\)/admin/colours
mkdir -p src/app/\(dashboard\)/admin/countries
mkdir -p src/app/\(dashboard\)/admin/shot-types
mkdir -p src/app/\(dashboard\)/admin/installation-types
mkdir -p src/app/\(dashboard\)/admin/prompt-templates
mkdir -p src/app/\(dashboard\)/admin/overrides
```

- [ ] **Step 2: Create generate/page.tsx**

Create `src/app/(dashboard)/generate/page.tsx`:

```tsx
import { PageHeader } from "@/components/shared"

export default function GeneratePage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Generate"
        description="Select options and generate product images."
      />
    </div>
  )
}
```

- [ ] **Step 3: Create jobs/[id]/page.tsx**

Create `src/app/(dashboard)/jobs/[id]/page.tsx`:

```tsx
import { PageHeader } from "@/components/shared"

interface JobPageProps {
  params: Promise<{ id: string }>
}

export default async function JobPage({ params }: JobPageProps) {
  const { id } = await params
  return (
    <div className="p-6">
      <PageHeader title={`Job ${id}`} description="Review generated images." />
    </div>
  )
}
```

Note: In Next.js 15, `params` is a Promise — always `await` it.

- [ ] **Step 4: Create admin/page.tsx (redirect)**

Create `src/app/(dashboard)/admin/page.tsx`:

```tsx
import { redirect } from "next/navigation"
import { ROUTES } from "@/constants/routes"

export default function AdminPage() {
  redirect(ROUTES.admin.products)
}
```

- [ ] **Step 5: Create admin/products/page.tsx**

Create `src/app/(dashboard)/admin/products/page.tsx`:

```tsx
import { PageHeader } from "@/components/shared"

export default function ProductsPage() {
  return (
    <div className="p-6">
      <PageHeader title="Products" description="Manage products." />
    </div>
  )
}
```

- [ ] **Step 6: Create admin/colours/page.tsx**

Create `src/app/(dashboard)/admin/colours/page.tsx`:

```tsx
import { PageHeader } from "@/components/shared"

export default function ColoursPage() {
  return (
    <div className="p-6">
      <PageHeader title="Colours / RAL" description="Manage RAL colours." />
    </div>
  )
}
```

- [ ] **Step 7: Create admin/countries/page.tsx**

Create `src/app/(dashboard)/admin/countries/page.tsx`:

```tsx
import { PageHeader } from "@/components/shared"

export default function CountriesPage() {
  return (
    <div className="p-6">
      <PageHeader title="Countries" description="Manage countries." />
    </div>
  )
}
```

- [ ] **Step 8: Create admin/shot-types/page.tsx**

Create `src/app/(dashboard)/admin/shot-types/page.tsx`:

```tsx
import { PageHeader } from "@/components/shared"

export default function ShotTypesPage() {
  return (
    <div className="p-6">
      <PageHeader title="Shot Types" description="Manage shot types." />
    </div>
  )
}
```

- [ ] **Step 9: Create admin/installation-types/page.tsx**

Create `src/app/(dashboard)/admin/installation-types/page.tsx`:

```tsx
import { PageHeader } from "@/components/shared"

export default function InstallationTypesPage() {
  return (
    <div className="p-6">
      <PageHeader title="Installation Types" description="Manage installation types." />
    </div>
  )
}
```

- [ ] **Step 10: Create admin/prompt-templates/page.tsx**

Create `src/app/(dashboard)/admin/prompt-templates/page.tsx`:

```tsx
import { PageHeader } from "@/components/shared"

export default function PromptTemplatesPage() {
  return (
    <div className="p-6">
      <PageHeader title="Prompt Templates" description="Manage prompt templates." />
    </div>
  )
}
```

- [ ] **Step 11: Create admin/overrides/page.tsx**

Create `src/app/(dashboard)/admin/overrides/page.tsx`:

```tsx
import { PageHeader } from "@/components/shared"

export default function OverridesPage() {
  return (
    <div className="p-6">
      <PageHeader title="Prompt Overrides" description="Manage prompt block overrides." />
    </div>
  )
}
```

- [ ] **Step 12: Commit**

```bash
git add src/app/\(dashboard\)/
git commit -m "feat: add all dashboard page stubs with PageHeader"
```

---

## Task 5: Type-check + manual verification

**Files:** none created — verification only

- [ ] **Step 1: Run full test suite**

```bash
pnpm vitest run
```

Expected: all tests pass (AppSidebar + all Section 2 shared component tests). Zero failures.

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors. If any appear, fix before continuing.

- [ ] **Step 3: Start dev server**

```bash
pnpm dev
```

Expected: server starts on `http://localhost:3000` with no build errors in the terminal.

- [ ] **Step 4: Verify routing**

Open a browser and check each route:

| URL | Expected |
|---|---|
| `http://localhost:3000/` | Redirects to `/generate` |
| `http://localhost:3000/generate` | Sidebar visible, "Generate" active (highlighted), Generate PageHeader shown |
| `http://localhost:3000/admin` | Redirects to `/admin/products` |
| `http://localhost:3000/admin/products` | Sidebar visible, "Products" active, Products PageHeader shown |
| `http://localhost:3000/admin/colours` | "Colours / RAL" active |
| `http://localhost:3000/admin/overrides` | "Prompt Overrides" active |
| `http://localhost:3000/jobs/test-123` | Job page shown with "Job test-123" title |

- [ ] **Step 5: Verify mobile toggle**

Resize the browser window below 768px wide. Expected: sidebar hides, a hamburger button appears at the top of the page. Clicking it opens the sidebar as an overlay Sheet.

- [ ] **Step 6: Commit type-check confirmation (if any fixes were needed)**

If Step 2 required any fixes, commit them:

```bash
git add -p
git commit -m "fix: resolve type-check errors in dashboard layout"
```

If Step 2 had no errors, no commit needed — the checkpoint is done.
