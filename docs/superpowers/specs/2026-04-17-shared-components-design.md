---
title: Section 2 — Shared Components Design
date: 2026-04-17
status: approved
---

# Shared Components Design

## Overview

Five shared components live in `src/components/shared/`. They are consumed by all admin list pages and the generate/job pages. shadcn/ui primitives (installed into `src/components/ui/`) provide the base UI; shared components wrap them with project-specific logic and types.

## Setup

shadcn/ui is not yet in `package.json` — install it via CLI as the first step of this section. Primitives land in `src/components/ui/` — these are generated files, not hand-edited. Each shadcn component is added individually using the shadcn MCP to confirm correct usage before installation.

## File Layout

```
src/
  components/
    ui/                  ← shadcn primitives (generated)
    shared/
      DataTable.tsx
      EmptyState.tsx
      PageHeader.tsx
      ConfirmDialog.tsx
      StatusBadge.tsx
      index.ts           ← barrel export for all shared components
```

## Component Interfaces

### StatusBadge

Server component. Reads `STATUS_COLORS` and `STATUS_LABELS` from `@/constants/status` — no local colour definitions.

```ts
interface StatusBadgeProps {
  status: ImageStatus | JobStatus
}
```

Renders a shadcn `Badge` with the Tailwind classes from `STATUS_COLORS[status]`. Falls back gracefully if an unknown status is passed (renders the raw value with neutral styling).

### EmptyState

Client component (`"use client"`). Used when a list has zero items or a search returns no results. Must be a client component because `action.onClick` is a function — Next.js App Router does not allow passing functions as props from Server to Client components.

```ts
interface EmptyStateProps {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}
```

Renders a centred block with an icon placeholder, title, optional description, and optional action button (shadcn `Button`).

### PageHeader

Server component. Sits at the top of every admin page and the generate page.

```ts
interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}
```

`action` accepts any ReactNode (typically a Button or Link). No opinion on what goes there — the page owns that.

### ConfirmDialog

Client component. Declarative: parent controls `open` and handles both outcomes.

```ts
interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string   // default: "Confirm"
  onConfirm: () => void
  onCancel: () => void
}
```

Built on shadcn `Dialog`. Renders two buttons: a destructive-variant confirm and a cancel. Does not manage its own open state.

### DataTable\<T\>

Client component. Server-driven: the parent owns the query and passes current page state down; the component fires callbacks when the user interacts.

```ts
interface ColumnDef<T> {
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
  sortDir?: 'asc' | 'desc'
  onSortChange?: (key: string, dir: 'asc' | 'desc') => void
  isLoading?: boolean
}
```

- **Search**: Input only renders when `onSearchChange` is provided.
- **Sort**: Column header becomes a clickable sort toggle only when `onSortChange` is provided. Clicking a sorted column toggles `asc`/`desc`; clicking an unsorted column sets it to `asc`.
- **Pagination**: Always rendered. Previous/next buttons disabled at boundaries. Shows "Page X of Y" derived from `total / perPage`.
- **Loading**: When `isLoading` is true, table rows are replaced with a skeleton.
- Built on shadcn `Table`. No TanStack Table dependency — columns are mapped directly.

## Barrel Export

`src/components/shared/index.ts` re-exports all five components and the `ColumnDef` type so consumers have a single import path.

## Error Handling

No network calls inside shared components — all data flows in via props. Invalid/unknown status values in `StatusBadge` render with neutral styling rather than throwing.

## Testing

Checkpoint: all five components render in isolation with no TypeScript errors. Verified via `tsc --noEmit` and Vitest smoke tests (render without crashing). No integration tests required at this stage.
