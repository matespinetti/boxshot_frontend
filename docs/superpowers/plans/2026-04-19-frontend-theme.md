# Frontend Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the indigo/violet theme to ParcelFlow — fix two CSS bugs causing no color/broken font, and add light indigo tint to the sidebar and counter card.

**Architecture:** Three isolated file edits, all CSS-variable-driven. No logic changes, no new files. Components inherit the new theme automatically via Tailwind's CSS variable bridge in `@theme inline`.

**Tech Stack:** Tailwind CSS v4 (OKLCH color space), Next.js 15, lucide-react icons.

---

### Task 1: Fix globals.css — font reference and color tokens

**Files:**
- Modify: `src/app/globals.css`

These are two independent bugs in the same file; fix them together.

- [ ] **Step 1: Fix the circular font reference**

In `src/app/globals.css`, line 10, change:

```css
/* Before */
--font-sans: var(--font-sans);

/* After */
--font-sans: var(--font-geist-sans);
```

- [ ] **Step 2: Update primary and ring tokens in `:root`**

Replace these three lines in the `:root` block (lines 58, 59, 69):

```css
/* Before */
--primary: oklch(0.205 0 0);
--primary-foreground: oklch(0.985 0 0);
...
--ring: oklch(0.708 0 0);

/* After */
--primary: oklch(0.511 0.262 276.966);
--primary-foreground: oklch(0.985 0 0);
...
--ring: oklch(0.673 0.182 276.935);
```

`--primary-foreground` value is unchanged — keep it as is.

- [ ] **Step 3: Update all sidebar tokens in `:root`**

Replace the sidebar block (lines 76–83) with:

```css
--sidebar: oklch(0.968 0.016 277);
--sidebar-foreground: oklch(0.205 0 0);
--sidebar-primary: oklch(0.511 0.262 276.966);
--sidebar-primary-foreground: oklch(0.985 0 0);
--sidebar-accent: oklch(0.938 0.034 280);
--sidebar-accent-foreground: oklch(0.511 0.262 276.966);
--sidebar-border: oklch(0.91 0.03 278);
--sidebar-ring: oklch(0.673 0.182 276.935);
```

- [ ] **Step 4: Verify existing tests pass (regression check)**

Run:
```bash
cd /home/matespinetti/projects/boxshot/frontend && pnpm test --run
```
Expected: all tests pass. CSS changes do not affect component logic tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "fix: apply indigo theme — fix font reference and color tokens"
```

---

### Task 2: Swap brand icon in AppSidebar

**Files:**
- Modify: `src/components/layout/AppSidebar.tsx`

- [ ] **Step 1: Update the lucide-react import**

In `src/components/layout/AppSidebar.tsx`, find the import block that includes `PanelsTopLeft`:

```ts
// Before
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

// After
import {
  Box,
  Camera,
  FileText,
  Globe,
  Package,
  Palette,
  SlidersHorizontal,
  Sparkles,
  Wrench,
} from "lucide-react"
```

- [ ] **Step 2: Replace the icon in the JSX**

In the same file, find the brand card JSX that renders `<PanelsTopLeft className="size-4" />` and replace:

```tsx
// Before
<PanelsTopLeft className="size-4" />

// After
<Box className="size-4" />
```

- [ ] **Step 3: Verify type-check passes**

```bash
cd /home/matespinetti/projects/boxshot/frontend && pnpm type-check
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/AppSidebar.tsx
git commit -m "feat: swap brand icon to Box in sidebar"
```

---

### Task 3: Add indigo tint to the counter card in GenerationPanel

**Files:**
- Modify: `src/features/generation/components/GenerationPanel.tsx`

- [ ] **Step 1: Update the counter card classes**

In `src/features/generation/components/GenerationPanel.tsx`, find the counter card div (currently around line 94):

```tsx
// Before
<div className="rounded-lg border p-4 text-center">

// After
<div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
```

`border-primary/20` gives it a faint indigo border; `bg-primary/5` gives a very light indigo fill — both use the `--primary` token from Task 1.

- [ ] **Step 2: Verify existing tests still pass**

```bash
cd /home/matespinetti/projects/boxshot/frontend && pnpm test --run
```
Expected: all tests pass. The class change does not affect component behavior or test assertions.

- [ ] **Step 3: Commit**

```bash
git add src/features/generation/components/GenerationPanel.tsx
git commit -m "feat: add indigo tint to image counter card"
```

---

### Task 4: Visual verification

No code changes — confirm the theme looks correct in the browser.

- [ ] **Step 1: Start the dev server (if not already running)**

```bash
cd /home/matespinetti/projects/boxshot/frontend && pnpm dev
```

- [ ] **Step 2: Open the app and verify each item**

Open `http://localhost:3000/generate` and check:

| What to look for | Expected |
|-----------------|----------|
| Font | Geist Sans — clean, geometric (not system Arial/sans-serif) |
| Sidebar background | Very light lavender/indigo tint (not pure white) |
| Active nav item ("Generate") | Solid indigo background, white text |
| Inactive nav items (hover) | Light indigo tint on hover |
| "Generate" button | Indigo-filled, white text |
| Input focus ring | Indigo ring when you click into a field |
| Counter card | Light indigo tint background with faint indigo border |
| Select dropdown trigger | Indigo focus ring when focused |
