# Balanced Sidebar Icon Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a balanced visual pass to the dashboard sidebar with icons, a stronger brand block, and cleaner spacing while preserving routing and active-state behavior.

**Architecture:** Keep the existing `AppSidebar` component as the single sidebar composition point. Store icon metadata alongside each nav item, render icons inside `SidebarMenuButton`, and update the existing component test to drive the visual enhancement through a failing test before implementation. No routing, data flow, or generated shadcn primitives change.

**Tech Stack:** Next.js App Router, React 19, `lucide-react`, shadcn/ui sidebar primitives, Vitest, Testing Library

---

## File Map

| File | Status | Purpose |
|---|---|---|
| `src/components/layout/AppSidebar.tsx` | Modify | Add icon metadata, brand block, and balanced spacing/hierarchy |
| `src/components/layout/__tests__/AppSidebar.test.tsx` | Modify | Add regression coverage for the new brand block and icon rendering while preserving active-state checks |

---

## Task 1: Add a failing sidebar visual regression test

**Files:**
- Modify: `src/components/layout/__tests__/AppSidebar.test.tsx`

- [ ] **Step 1: Update the test file with a brand-and-icons regression test**

Replace `src/components/layout/__tests__/AppSidebar.test.tsx` with:

```tsx
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"

import { AppSidebar } from "../AppSidebar"

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

  it("renders the balanced brand block and one icon per destination", () => {
    const { container } = renderSidebar()

    expect(screen.getByText("ParcelFlow")).toBeInTheDocument()
    expect(screen.getByText("Image operations")).toBeInTheDocument()
    expect(container.querySelectorAll("svg.lucide").length).toBe(9)
  })

  it("renders all navigation links with correct hrefs", () => {
    renderSidebar()

    expect(screen.getByRole("link", { name: "Generate" })).toHaveAttribute(
      "href",
      "/generate",
    )
    expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute(
      "href",
      "/admin/products",
    )
    expect(screen.getByRole("link", { name: "Colours / RAL" })).toHaveAttribute(
      "href",
      "/admin/colours",
    )
    expect(screen.getByRole("link", { name: "Countries" })).toHaveAttribute(
      "href",
      "/admin/countries",
    )
    expect(screen.getByRole("link", { name: "Shot Types" })).toHaveAttribute(
      "href",
      "/admin/shot-types",
    )
    expect(
      screen.getByRole("link", { name: "Installation Types" }),
    ).toHaveAttribute("href", "/admin/installation-types")
    expect(
      screen.getByRole("link", { name: "Prompt Templates" }),
    ).toHaveAttribute("href", "/admin/prompt-templates")
    expect(
      screen.getByRole("link", { name: "Prompt Overrides" }),
    ).toHaveAttribute("href", "/admin/overrides")
  })

  it("marks Generate as active on /generate", () => {
    mockUsePathname.mockReturnValue("/generate")

    renderSidebar()

    expect(screen.getByRole("link", { name: "Generate" })).toHaveAttribute(
      "data-active",
      "true",
    )
  })

  it("does not mark Generate as active on an admin page", () => {
    mockUsePathname.mockReturnValue("/admin/products")

    renderSidebar()

    expect(
      screen.getByRole("link", { name: "Generate" }),
    ).not.toHaveAttribute("data-active", "true")
  })

  it("marks Products as active on /admin/products", () => {
    mockUsePathname.mockReturnValue("/admin/products")

    renderSidebar()

    expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute(
      "data-active",
      "true",
    )
  })

  it("marks Shot Types as active on /admin/shot-types", () => {
    mockUsePathname.mockReturnValue("/admin/shot-types")

    renderSidebar()

    expect(screen.getByRole("link", { name: "Shot Types" })).toHaveAttribute(
      "data-active",
      "true",
    )
  })
})
```

- [ ] **Step 2: Run the sidebar test to verify it fails**

Run:

```bash
pnpm vitest run src/components/layout/__tests__/AppSidebar.test.tsx
```

Expected:
- FAIL
- The new `renders the balanced brand block and one icon per destination` test fails because `Image operations` is not rendered and the icon count is `0`

- [ ] **Step 3: Commit the red test**

```bash
git add src/components/layout/__tests__/AppSidebar.test.tsx
git commit -m "test: cover balanced sidebar brand block and icons"
```

---

## Task 2: Implement the balanced sidebar visual pass

**Files:**
- Modify: `src/components/layout/AppSidebar.tsx`

- [ ] **Step 1: Replace `AppSidebar.tsx` with the balanced icon implementation**

Replace `src/components/layout/AppSidebar.tsx` with:

```tsx
"use client"

import type { LucideIcon } from "lucide-react"
import {
  Camera,
  FileText,
  Globe,
  Package,
  Palette,
  PanelsTopLeft,
  SlidersHorizontal,
  Sparkles,
  Wrench,
} from "lucide-react"
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

interface NavLink {
  label: string
  href: string
  icon: LucideIcon
}

const generateLink: NavLink = {
  label: "Generate",
  href: ROUTES.generate,
  icon: Sparkles,
}

const adminLinks: NavLink[] = [
  { label: "Products", href: ROUTES.admin.products, icon: Package },
  { label: "Colours / RAL", href: ROUTES.admin.colours, icon: Palette },
  { label: "Countries", href: ROUTES.admin.countries, icon: Globe },
  { label: "Shot Types", href: ROUTES.admin.shotTypes, icon: Camera },
  {
    label: "Installation Types",
    href: ROUTES.admin.installationTypes,
    icon: Wrench,
  },
  {
    label: "Prompt Templates",
    href: ROUTES.admin.promptTemplates,
    icon: FileText,
  },
  {
    label: "Prompt Overrides",
    href: ROUTES.admin.overrides,
    icon: SlidersHorizontal,
  },
]

function getActiveProps(isActive: boolean) {
  return isActive ? { "data-active": "true" } : {}
}

export function AppSidebar() {
  const pathname = usePathname()
  const isGenerateActive = pathname === generateLink.href
  const GenerateIcon = generateLink.icon

  return (
    <Sidebar>
      <SidebarContent className="gap-4 p-3">
        <SidebarGroup className="gap-3 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/20 p-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-sidebar-primary/10 p-2 text-sidebar-primary">
              <PanelsTopLeft className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight">ParcelFlow</p>
              <p className="text-xs text-muted-foreground">Image operations</p>
            </div>
          </div>

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isGenerateActive}
                className="h-9 rounded-lg"
                render={
                  <Link
                    href={generateLink.href}
                    {...getActiveProps(isGenerateActive)}
                  />
                }
              >
                <GenerateIcon className="size-4" />
                <span>{generateLink.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="gap-2">
          <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground/90">
            Admin
          </SidebarGroupLabel>
          <SidebarMenu>
            {adminLinks.map((link) => {
              const isActive = pathname.startsWith(link.href)
              const Icon = link.icon

              return (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton
                    isActive={isActive}
                    className="h-9 rounded-lg"
                    render={
                      <Link href={link.href} {...getActiveProps(isActive)} />
                    }
                  >
                    <Icon className="size-4" />
                    <span>{link.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
```

- [ ] **Step 2: Run the targeted sidebar test to verify it passes**

Run:

```bash
pnpm vitest run src/components/layout/__tests__/AppSidebar.test.tsx
```

Expected:
- PASS
- `6 passed`

- [ ] **Step 3: Commit the implementation**

```bash
git add src/components/layout/AppSidebar.tsx
git commit -m "feat: add balanced sidebar icons and brand block"
```

---

## Task 3: Full verification

**Files:**
- Verify only: no new files

- [ ] **Step 1: Run the full test suite**

Run:

```bash
pnpm vitest run
```

Expected:
- PASS
- All test files green with zero failures

- [ ] **Step 2: Run type-check**

Run:

```bash
pnpm type-check
```

Expected:
- `Generating route types...`
- `✓ Types generated successfully`
- exit code `0`

- [ ] **Step 3: Commit only if verification required follow-up fixes**

If verification exposed issues and you fixed them:

```bash
git add -p
git commit -m "fix: polish balanced sidebar icon pass"
```

If no fixes were needed, skip this step.
