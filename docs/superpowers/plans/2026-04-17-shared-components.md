# Section 2 — Shared Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build five production-ready shared components (StatusBadge, EmptyState, PageHeader, ConfirmDialog, DataTable) that all admin and feature pages consume.

**Architecture:** shadcn/ui primitives live in `src/components/ui/` (generated, not hand-edited). Shared components in `src/components/shared/` wrap them with typed, project-specific APIs. DataTable is server-driven — all sort/page/search state lives in the parent, the component fires callbacks. StatusBadge reads directly from the existing `STATUS_COLORS`/`STATUS_LABELS` constants in `src/constants/status.ts`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, TailwindCSS v4, shadcn/ui, Vitest + @testing-library/react

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `components.json` | Create | shadcn/ui configuration |
| `src/app/globals.css` | Modify | shadcn CSS variables (added by init) |
| `package.json` | Modify | Add testing deps |
| `vitest.config.ts` | Modify | Switch to jsdom, add React plugin |
| `src/test/setup.ts` | Modify | Import @testing-library/jest-dom |
| `src/components/ui/badge.tsx` | Create (shadcn) | Badge primitive |
| `src/components/ui/button.tsx` | Create (shadcn) | Button primitive |
| `src/components/ui/dialog.tsx` | Create (shadcn) | Dialog primitive |
| `src/components/ui/table.tsx` | Create (shadcn) | Table primitive |
| `src/components/ui/input.tsx` | Create (shadcn) | Input primitive |
| `src/components/ui/skeleton.tsx` | Create (shadcn) | Skeleton primitive |
| `src/components/shared/StatusBadge.tsx` | Create | Status badge for all status values |
| `src/components/shared/EmptyState.tsx` | Create | Zero-data and no-results state |
| `src/components/shared/PageHeader.tsx` | Create | Page title + optional action slot |
| `src/components/shared/ConfirmDialog.tsx` | Create | Declarative confirm/cancel dialog |
| `src/components/shared/DataTable.tsx` | Create | Server-driven table with sort/page/search |
| `src/components/shared/index.ts` | Create | Barrel export |
| `src/components/shared/__tests__/StatusBadge.test.tsx` | Create | StatusBadge render tests |
| `src/components/shared/__tests__/EmptyState.test.tsx` | Create | EmptyState render tests |
| `src/components/shared/__tests__/PageHeader.test.tsx` | Create | PageHeader render tests |
| `src/components/shared/__tests__/ConfirmDialog.test.tsx` | Create | ConfirmDialog interaction tests |
| `src/components/shared/__tests__/DataTable.test.tsx` | Create | DataTable render + interaction tests |

---

### Task 1: Install shadcn/ui

**Files:**
- Create: `components.json`
- Modify: `src/app/globals.css`

shadcn/ui is not yet installed. This task runs the CLI init which generates `components.json` and patches `globals.css` with CSS variables.

> **Before running the CLI:** Use the shadcn MCP (`mcp__shadcn__get_add_command_for_items` or similar) to confirm the correct init flags for TailwindCSS v4 + Next.js App Router.

- [ ] **Step 1: Run shadcn init**

```bash
cd /home/matespinetti/projects/boxshot/frontend
pnpm dlx shadcn@latest init
```

When prompted, choose:
- Style: **Default**
- Base color: **Neutral**
- Would you like to use CSS variables for theming? **Yes**
- Tailwind CSS config: shadcn detects v4 automatically — confirm when prompted

> **Note on utils path:** During init, if asked for the `utils` path, enter `@/lib/utils/cn` — this matches our existing `src/lib/utils/cn.ts`. Do NOT let shadcn create a new `lib/utils.ts` that duplicates `cn`.

- [ ] **Step 2: Verify components.json was created**

```bash
cat /home/matespinetti/projects/boxshot/frontend/components.json
```

Expected: JSON file with `aliases.utils` pointing to `@/lib/utils/cn` and `aliases.components` pointing to `@/components`.

If `aliases.utils` is wrong (e.g. `@/lib/utils`), edit `components.json` manually to set it to `@/lib/utils/cn`.

- [ ] **Step 3: Verify globals.css has shadcn variables**

```bash
head -40 /home/matespinetti/projects/boxshot/frontend/src/app/globals.css
```

Expected: CSS variables like `--background`, `--foreground`, `--primary`, `--muted`, etc. added inside `:root {}`.

- [ ] **Step 4: Commit**

```bash
cd /home/matespinetti/projects/boxshot/frontend
git add components.json src/app/globals.css
git commit -m "chore: initialise shadcn/ui"
```

---

### Task 2: Set up component testing infrastructure

**Files:**
- Modify: `vitest.config.ts`
- Modify: `src/test/setup.ts`
- Modify: `package.json` (via pnpm add)

The current vitest config uses `environment: "node"` and has no React plugin — component render tests need jsdom and JSX transform support.

- [ ] **Step 1: Install testing dependencies**

```bash
cd /home/matespinetti/projects/boxshot/frontend
pnpm add -D @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

- [ ] **Step 2: Update vitest.config.ts**

Replace the entire file with:

```ts
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

- [ ] **Step 3: Update src/test/setup.ts**

Replace the entire file with:

```ts
import "@testing-library/jest-dom"
```

- [ ] **Step 4: Verify existing tests still pass**

```bash
cd /home/matespinetti/projects/boxshot/frontend
pnpm test
```

Expected: All existing tests pass (status.test.ts, formatters.test.ts). No failures.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts src/test/setup.ts package.json pnpm-lock.yaml
git commit -m "chore: configure jsdom + @testing-library/react for component tests"
```

---

### Task 3: StatusBadge

**Files:**
- Create: `src/components/ui/badge.tsx` (via shadcn add)
- Create: `src/components/shared/StatusBadge.tsx`
- Create: `src/components/shared/__tests__/StatusBadge.test.tsx`

> **Before implementing:** Use the shadcn MCP to look up the Badge component signature. Run: check `mcp__shadcn__view_items_in_registries` or `mcp__shadcn__get_add_command_for_items` for `badge` to see current props and usage.

- [ ] **Step 1: Add shadcn Badge primitive**

```bash
cd /home/matespinetti/projects/boxshot/frontend
pnpm dlx shadcn@latest add badge
```

Verify it created `src/components/ui/badge.tsx`.

- [ ] **Step 2: Write the failing test**

Create `src/components/shared/__tests__/StatusBadge.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ImageStatus, JobStatus } from "@/constants/status"
import { StatusBadge } from "../StatusBadge"

describe("StatusBadge", () => {
  it("renders the label for ImageStatus.Complete", () => {
    render(<StatusBadge status={ImageStatus.Complete} />)
    expect(screen.getByText("Complete")).toBeInTheDocument()
  })

  it("renders the label for ImageStatus.Approved", () => {
    render(<StatusBadge status={ImageStatus.Approved} />)
    expect(screen.getByText("Approved")).toBeInTheDocument()
  })

  it("renders the label for JobStatus.Idle", () => {
    render(<StatusBadge status={JobStatus.Idle} />)
    expect(screen.getByText("Idle")).toBeInTheDocument()
  })

  it("renders the label for ImageStatus.Failed with correct colour class", () => {
    const { container } = render(<StatusBadge status={ImageStatus.Failed} />)
    expect(container.firstChild).toHaveClass("bg-red-100")
  })

  it("renders the label for ImageStatus.Generating with correct colour class", () => {
    const { container } = render(<StatusBadge status={ImageStatus.Generating} />)
    expect(container.firstChild).toHaveClass("bg-blue-100")
  })
})
```

- [ ] **Step 3: Run test — verify it fails**

```bash
pnpm test src/components/shared/__tests__/StatusBadge.test.tsx
```

Expected: FAIL — `Cannot find module '../StatusBadge'`

- [ ] **Step 4: Implement StatusBadge**

Create `src/components/shared/StatusBadge.tsx`:

```tsx
import { Badge } from "@/components/ui/badge"
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type ImageStatus,
  type JobStatus,
} from "@/constants/status"
import { cn } from "@/lib/utils/cn"

interface StatusBadgeProps {
  status: ImageStatus | JobStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"
  const label = STATUS_LABELS[status] ?? status

  return <Badge className={cn(colorClass)}>{label}</Badge>
}
```

> `ImageStatus` and `JobStatus` are enums — check that `src/constants/status.ts` exports them as types (they are `export enum`, which TypeScript allows to import as both value and type).

- [ ] **Step 5: Run tests — verify they pass**

```bash
pnpm test src/components/shared/__tests__/StatusBadge.test.tsx
```

Expected: 5 passed, 0 failed

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/badge.tsx src/components/shared/StatusBadge.tsx src/components/shared/__tests__/StatusBadge.test.tsx
git commit -m "feat: add StatusBadge shared component"
```

---

### Task 4: EmptyState

**Files:**
- Create: `src/components/ui/button.tsx` (via shadcn add)
- Create: `src/components/shared/EmptyState.tsx`
- Create: `src/components/shared/__tests__/EmptyState.test.tsx`

> **Before implementing:** Use the shadcn MCP to look up the Button component — confirm the `variant` and `size` prop values available.

- [ ] **Step 1: Add shadcn Button primitive**

```bash
pnpm dlx shadcn@latest add button
```

Verify it created `src/components/ui/button.tsx`.

- [ ] **Step 2: Write the failing test**

Create `src/components/shared/__tests__/EmptyState.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { EmptyState } from "../EmptyState"

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="No products found" />)
    expect(screen.getByText("No products found")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(<EmptyState title="No products found" description="Add one to get started." />)
    expect(screen.getByText("Add one to get started.")).toBeInTheDocument()
  })

  it("does not render description when omitted", () => {
    render(<EmptyState title="No products found" />)
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument()
  })

  it("renders action button when provided", () => {
    render(
      <EmptyState
        title="No products found"
        action={{ label: "Add Product", onClick: vi.fn() }}
      />,
    )
    expect(screen.getByRole("button", { name: "Add Product" })).toBeInTheDocument()
  })

  it("calls action.onClick when button is clicked", () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        title="No products found"
        action={{ label: "Add Product", onClick }}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Add Product" }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("does not render action button when action is omitted", () => {
    render(<EmptyState title="No products found" />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test — verify it fails**

```bash
pnpm test src/components/shared/__tests__/EmptyState.test.tsx
```

Expected: FAIL — `Cannot find module '../EmptyState'`

- [ ] **Step 4: Implement EmptyState**

Create `src/components/shared/EmptyState.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <svg
          className="h-8 w-8 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
pnpm test src/components/shared/__tests__/EmptyState.test.tsx
```

Expected: 6 passed, 0 failed

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/button.tsx src/components/shared/EmptyState.tsx src/components/shared/__tests__/EmptyState.test.tsx
git commit -m "feat: add EmptyState shared component"
```

---

### Task 5: PageHeader

**Files:**
- Create: `src/components/shared/PageHeader.tsx`
- Create: `src/components/shared/__tests__/PageHeader.test.tsx`

No new shadcn primitives needed. `action` is a `ReactNode` slot — the caller owns whatever goes there.

- [ ] **Step 1: Write the failing test**

Create `src/components/shared/__tests__/PageHeader.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PageHeader } from "../PageHeader"

describe("PageHeader", () => {
  it("renders the title", () => {
    render(<PageHeader title="Products" />)
    expect(screen.getByRole("heading", { name: "Products" })).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(<PageHeader title="Products" description="Manage your product catalogue." />)
    expect(screen.getByText("Manage your product catalogue.")).toBeInTheDocument()
  })

  it("does not render description element when omitted", () => {
    render(<PageHeader title="Products" />)
    expect(screen.queryByText("Manage")).not.toBeInTheDocument()
  })

  it("renders action slot content when provided", () => {
    render(<PageHeader title="Products" action={<button>Add Product</button>} />)
    expect(screen.getByRole("button", { name: "Add Product" })).toBeInTheDocument()
  })

  it("does not render action area when action is omitted", () => {
    render(<PageHeader title="Products" />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pnpm test src/components/shared/__tests__/PageHeader.test.tsx
```

Expected: FAIL — `Cannot find module '../PageHeader'`

- [ ] **Step 3: Implement PageHeader**

Create `src/components/shared/PageHeader.tsx`:

```tsx
import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pnpm test src/components/shared/__tests__/PageHeader.test.tsx
```

Expected: 5 passed, 0 failed

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/PageHeader.tsx src/components/shared/__tests__/PageHeader.test.tsx
git commit -m "feat: add PageHeader shared component"
```

---

### Task 6: ConfirmDialog

**Files:**
- Create: `src/components/ui/dialog.tsx` (via shadcn add)
- Create: `src/components/shared/ConfirmDialog.tsx`
- Create: `src/components/shared/__tests__/ConfirmDialog.test.tsx`

> **Before implementing:** Use the shadcn MCP to look up the Dialog component — confirm the sub-component names (`DialogRoot`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`) and their correct import paths.

- [ ] **Step 1: Add shadcn Dialog primitive**

```bash
pnpm dlx shadcn@latest add dialog
```

Verify it created `src/components/ui/dialog.tsx`.

- [ ] **Step 2: Check Dialog sub-component exports from the generated file**

```bash
grep "^export" src/components/ui/dialog.tsx
```

Note the exported names — you'll use them in the implementation. They are typically: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`.

- [ ] **Step 3: Write the failing test**

Create `src/components/shared/__tests__/ConfirmDialog.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ConfirmDialog } from "../ConfirmDialog"

describe("ConfirmDialog", () => {
  it("renders nothing when open is false", () => {
    render(
      <ConfirmDialog
        open={false}
        title="Delete item"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.queryByText("Delete item")).not.toBeInTheDocument()
  })

  it("renders title when open is true", () => {
    render(
      <ConfirmDialog
        open
        title="Delete item"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByText("Delete item")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <ConfirmDialog
        open
        title="Delete item"
        description="This cannot be undone."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument()
  })

  it("renders default confirm label", () => {
    render(
      <ConfirmDialog
        open
        title="Delete item"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument()
  })

  it("renders custom confirm label", () => {
    render(
      <ConfirmDialog
        open
        title="Delete item"
        confirmLabel="Delete"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument()
  })

  it("calls onConfirm when confirm button is clicked", () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        open
        title="Delete item"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        open
        title="Delete item"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 4: Run test — verify it fails**

```bash
pnpm test src/components/shared/__tests__/ConfirmDialog.test.tsx
```

Expected: FAIL — `Cannot find module '../ConfirmDialog'`

- [ ] **Step 5: Implement ConfirmDialog**

Create `src/components/shared/ConfirmDialog.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
pnpm test src/components/shared/__tests__/ConfirmDialog.test.tsx
```

Expected: 7 passed, 0 failed

> If tests fail because Radix Dialog uses portals that aren't rendered in the test DOM, add `vi.mock` stubs or check if `@testing-library/react` renders portals into `document.body` by default (it does in jsdom — this should work without mocking).

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/dialog.tsx src/components/shared/ConfirmDialog.tsx src/components/shared/__tests__/ConfirmDialog.test.tsx
git commit -m "feat: add ConfirmDialog shared component"
```

---

### Task 7: DataTable

**Files:**
- Create: `src/components/ui/table.tsx` (via shadcn add)
- Create: `src/components/ui/input.tsx` (via shadcn add)
- Create: `src/components/ui/skeleton.tsx` (via shadcn add)
- Create: `src/components/shared/DataTable.tsx`
- Create: `src/components/shared/__tests__/DataTable.test.tsx`

> **Before implementing:** Use the shadcn MCP to look up Table, Input, and Skeleton — confirm exported sub-component names for Table (`Table`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell`) and the Input/Skeleton prop signatures.

- [ ] **Step 1: Add shadcn Table, Input, Skeleton primitives**

```bash
pnpm dlx shadcn@latest add table input skeleton
```

Verify these were created:
- `src/components/ui/table.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/skeleton.tsx`

- [ ] **Step 2: Confirm Table sub-component exports**

```bash
grep "^export" src/components/ui/table.tsx
```

Expected exports: `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`, `TableCaption`.

- [ ] **Step 3: Write the failing test**

Create `src/components/shared/__tests__/DataTable.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { ColumnDef } from "../DataTable"
import { DataTable } from "../DataTable"

type Row = { id: string; name: string }

const columns: ColumnDef<Row>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
]

const data: Row[] = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" },
]

describe("DataTable", () => {
  it("renders column headers", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
      />,
    )
    expect(screen.getByText("ID")).toBeInTheDocument()
    expect(screen.getByText("Name")).toBeInTheDocument()
  })

  it("renders row data using default string rendering", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
      />,
    )
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
  })

  it("uses render function when provided", () => {
    const columnsWithRender: ColumnDef<Row>[] = [
      { key: "name", header: "Name", render: (row) => <strong>{row.name.toUpperCase()}</strong> },
    ]
    render(
      <DataTable
        columns={columnsWithRender}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
      />,
    )
    expect(screen.getByText("ALICE")).toBeInTheDocument()
  })

  it("does not render search input when onSearchChange is not provided", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
      />,
    )
    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument()
  })

  it("renders search input when onSearchChange is provided", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
        onSearchChange={vi.fn()}
        searchValue=""
      />,
    )
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument()
  })

  it("calls onSearchChange when typing in search", () => {
    const onSearchChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
        onSearchChange={onSearchChange}
        searchValue=""
      />,
    )
    fireEvent.change(screen.getByPlaceholderText("Search..."), {
      target: { value: "ali" },
    })
    expect(onSearchChange).toHaveBeenCalledWith("ali")
  })

  it("shows page X of Y", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        total={20}
        page={2}
        perPage={10}
        onPageChange={vi.fn()}
      />,
    )
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument()
  })

  it("disables Previous on first page", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        total={20}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
      />,
    )
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled()
  })

  it("disables Next on last page", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        total={10}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
      />,
    )
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled()
  })

  it("calls onPageChange(2) when Next is clicked on page 1", () => {
    const onPageChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={data}
        total={20}
        page={1}
        perPage={10}
        onPageChange={onPageChange}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it("calls onPageChange(1) when Previous is clicked on page 2", () => {
    const onPageChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={data}
        total={20}
        page={2}
        perPage={10}
        onPageChange={onPageChange}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Previous" }))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it("calls onSortChange('name', 'asc') on first click of a sortable header", () => {
    const onSortChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
        onSortChange={onSortChange}
      />,
    )
    fireEvent.click(screen.getByText("Name"))
    expect(onSortChange).toHaveBeenCalledWith("name", "asc")
  })

  it("calls onSortChange with 'desc' when clicking an already-sorted-asc column", () => {
    const onSortChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
        onSortChange={onSortChange}
        sortKey="name"
        sortDir="asc"
      />,
    )
    fireEvent.click(screen.getByText(/Name/))
    expect(onSortChange).toHaveBeenCalledWith("name", "desc")
  })

  it("shows skeleton rows when isLoading is true", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        total={0}
        page={1}
        perPage={3}
        onPageChange={vi.fn()}
        isLoading
      />,
    )
    const cells = document.querySelectorAll("td")
    // 3 skeleton rows × 2 columns = 6 cells
    expect(cells).toHaveLength(6)
  })
})
```

- [ ] **Step 4: Run test — verify it fails**

```bash
pnpm test src/components/shared/__tests__/DataTable.test.tsx
```

Expected: FAIL — `Cannot find module '../DataTable'`

- [ ] **Step 5: Implement DataTable**

Create `src/components/shared/DataTable.tsx`:

```tsx
"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface ColumnDef<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  total: number
  page: number
  perPage: number
  onPageChange: (page: number) => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  sortKey?: string
  sortDir?: "asc" | "desc"
  onSortChange?: (key: string, dir: "asc" | "desc") => void
  isLoading?: boolean
}

export function DataTable<T>({
  columns,
  data,
  total,
  page,
  perPage,
  onPageChange,
  searchValue,
  onSearchChange,
  sortKey,
  sortDir,
  onSortChange,
  isLoading = false,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  function handleSortClick(key: string) {
    if (!onSortChange) return
    if (sortKey === key) {
      onSortChange(key, sortDir === "asc" ? "desc" : "asc")
    } else {
      onSortChange(key, "asc")
    }
  }

  return (
    <div className="space-y-4">
      {onSearchChange && (
        <Input
          placeholder="Search..."
          value={searchValue ?? ""}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  onClick={onSortChange ? () => handleSortClick(col.key) : undefined}
                  className={onSortChange ? "cursor-pointer select-none" : undefined}
                >
                  {col.header}
                  {sortKey === col.key && (
                    <span className="ml-1 text-xs">
                      {sortDir === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: perPage }).map((_, rowIdx) => (
                  <TableRow key={rowIdx}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : data.map((row, rowIdx) => (
                  <TableRow key={rowIdx}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.render
                          ? col.render(row)
                          : String(
                              (row as Record<string, unknown>)[col.key] ?? "",
                            )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
pnpm test src/components/shared/__tests__/DataTable.test.tsx
```

Expected: 14 passed, 0 failed

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/table.tsx src/components/ui/input.tsx src/components/ui/skeleton.tsx \
  src/components/shared/DataTable.tsx src/components/shared/__tests__/DataTable.test.tsx
git commit -m "feat: add DataTable shared component"
```

---

### Task 8: Barrel export and type-check

**Files:**
- Create: `src/components/shared/index.ts`

- [ ] **Step 1: Create the barrel export**

Create `src/components/shared/index.ts`:

```ts
export { ConfirmDialog } from "./ConfirmDialog"
export { DataTable } from "./DataTable"
export type { ColumnDef } from "./DataTable"
export { EmptyState } from "./EmptyState"
export { PageHeader } from "./PageHeader"
export { StatusBadge } from "./StatusBadge"
```

- [ ] **Step 2: Run the full test suite**

```bash
cd /home/matespinetti/projects/boxshot/frontend
pnpm test
```

Expected: All tests pass (existing + new shared component tests). Zero failures.

- [ ] **Step 3: Run TypeScript type check**

```bash
pnpm type-check
```

Expected: No errors. If there are errors, fix them before committing.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/index.ts
git commit -m "feat: barrel export for shared components"
```

---

## Self-Review

**Spec coverage:**
- ✅ `DataTable` with sort, pagination, search — Task 7
- ✅ `EmptyState` — Task 4
- ✅ `PageHeader` — Task 5
- ✅ `ConfirmDialog` — Task 6
- ✅ `StatusBadge` covering all `ImageStatus` and `JobStatus` values with correct colours — Task 3
- ✅ shadcn MCP consulted before each primitive — noted in Tasks 3, 4, 6, 7
- ✅ All components fully typed, no `any` — `DataTable` uses a single type assertion `(row as Record<string, unknown>)[col.key]` in the default-render fallback only, which is acceptable since `render` is the typed path
- ✅ Checkpoint: components render in isolation, no TS errors — Task 8 runs `pnpm test` + `pnpm type-check`

**Placeholder scan:** No TBDs or incomplete steps.

**Type consistency:**
- `ColumnDef<T>` defined and exported in `DataTable.tsx`, imported in `DataTable.test.tsx` as `import type { ColumnDef }` — consistent.
- `StatusBadge` uses `ImageStatus | JobStatus` union — matches `src/constants/status.ts` exports.
- `ConfirmDialog` `onOpenChange` handler passes `onCancel` when dialog closes externally — matches the declarative contract.
