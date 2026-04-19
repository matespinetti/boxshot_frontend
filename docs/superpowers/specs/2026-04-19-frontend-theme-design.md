# Frontend Theme Design — Indigo

**Date:** 2026-04-19  
**Scope:** Full design pass — color system, sidebar, component polish  
**Approach:** C (CSS variables + sidebar + component review)

---

## Problem

The app renders with no colors and a broken font because of two bugs in `globals.css`:

1. **Circular font reference** — `--font-sans: var(--font-geist-sans)` was written as `--font-sans: var(--font-sans)`, so Geist never loads; the browser falls back to system sans-serif.
2. **Zero-chroma color palette** — all OKLCH values have `0` chroma (second parameter), making the entire theme pure grayscale with no brand color.

---

## Design Decisions

- **Color direction:** Indigo/Violet — modern, premium, used by Linear/Vercel/Figma. Fits an AI creative tool.
- **Sidebar style:** Light — indigo-tinted background (`--sidebar` var), white main content area.
- **Font:** Keep Geist Sans — fix the reference, do not change the typeface.
- **Dark mode:** CSS vars for `.dark` are preserved as-is; no dark mode toggle in scope.
- **Semantic status colors:** `STATUS_COLORS` in `constants/status.ts` uses raw Tailwind classes intentionally (green=approved, red=failed). These are NOT changed to follow the brand palette.

---

## Section 1 — Color System (`globals.css`)

### Bug fix

```css
/* Before (broken) */
--font-sans: var(--font-sans);

/* After (fixed) */
--font-sans: var(--font-geist-sans);
```

### Primary color tokens (`:root`)

| Token | Value | Role |
|-------|-------|------|
| `--primary` | `oklch(0.511 0.262 276.966)` | Indigo-600 — buttons, active states |
| `--primary-foreground` | `oklch(0.985 0 0)` | White text on primary |
| `--ring` | `oklch(0.673 0.182 276.935)` | Indigo-400 — focus rings |

All other semantic tokens (background, card, muted, border, destructive) remain near-neutral — they should not carry brand color.

### Sidebar CSS variables (`:root`)

| Token | Value | Role |
|-------|-------|------|
| `--sidebar` | `oklch(0.968 0.016 277)` | Very light indigo tint — sidebar background |
| `--sidebar-primary` | `oklch(0.511 0.262 276.966)` | Active nav item background |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` | White text on active item |
| `--sidebar-accent` | `oklch(0.938 0.034 280)` | Hover state background |
| `--sidebar-accent-foreground` | `oklch(0.511 0.262 276.966)` | Indigo text on hover |
| `--sidebar-foreground` | `oklch(0.205 0 0)` | Default nav text (dark) |
| `--sidebar-border` | `oklch(0.91 0.03 278)` | Subtle indigo-tinted border |
| `--sidebar-ring` | `oklch(0.673 0.182 276.935)` | Focus ring inside sidebar |

---

## Section 2 — Sidebar (`AppSidebar.tsx`)

Single change: swap the brand icon from `PanelsTopLeft` to `Box` (lucide-react). The box icon fits the product image generation context better.

No structural, layout, or class changes. The sidebar already uses `isActive` / `data-active` props correctly — active state styling flows from `--sidebar-primary` automatically.

---

## Section 3 — Component Polish

### `GenerationPanel.tsx` — counter card

```tsx
// Before
<div className="rounded-lg border p-4 text-center">

// After
<div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
```

This gives the image count card a light indigo tint matching the mockup.

### Everything else

| Component | Change |
|-----------|--------|
| `Input` | None — focus ring inherits `--ring` automatically |
| `Select` triggers | None — same |
| `Button` (primary variant) | None — inherits `--primary` automatically |
| `StatusBadge` | None — uses semantic raw Tailwind classes intentionally |
| `EmptyState` | None — uses `bg-muted`, stays neutral |
| `PageHeader` | None — already correct |
| `DataTable` | None |
| `Dialog` / `ConfirmDialog` | None |

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/globals.css` | Fix font ref; update `--primary`, `--ring`, all `--sidebar-*` vars |
| `src/components/layout/AppSidebar.tsx` | Swap `PanelsTopLeft` → `Box` icon |
| `src/features/generation/components/GenerationPanel.tsx` | Counter card: add `border-primary/20 bg-primary/5` |

---

## Out of Scope

- Dark mode toggle / wiring
- Additional pages (jobs, admin) — they inherit the theme automatically
- Animation or transition changes
- New UI components
