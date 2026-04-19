# ParcelFlow Frontend — Claude Instructions

See @docs/ARCHITECTURE.md for system design and component conventions.
See @docs/REQUIREMENTS.md for feature specs and UI requirements.
See @docs/BACKEND_API.md for all available endpoints and request/response shapes.

## MCP Servers (ALWAYS use before implementing)

- Use **shadcn MCP** to look up shadcn/ui component docs before using any shadcn component
- Use **context7 MCP** to look up current docs for Next.js, TanStack Query, Zod, React Hook Form before implementing
- Never guess API or component signatures — look them up first

## Stack

- **Next.js 15** App Router — TypeScript, strict mode
- **shadcn/ui** — component library (Radix UI primitives + Tailwind)
- **Tailwind CSS v4** — styling
- **TanStack Query v5** — server state, polling, mutations
- **React Hook Form + Zod** — forms and validation
- **Zustand** — minimal client-only UI state (modals, selections, filters)
- **nuqs** — URL search params as state (filters, pagination)

## Dev Commands

```bash
pnpm dev                    # start dev server
pnpm build                  # production build
pnpm lint                   # eslint
pnpm type-check             # tsc --noEmit
pnpm shadcn add <component> # add shadcn component
```

## Project Structure

```
src/
  app/
    layout.tsx                    # root layout, providers
    page.tsx                      # redirects to /generate
    (dashboard)/
      generate/page.tsx           # main generation dashboard
      jobs/[id]/page.tsx          # job results grid
      admin/
        page.tsx                  # admin home
        products/page.tsx
        colours/page.tsx
        countries/page.tsx
        shot-types/page.tsx
        installation-types/page.tsx
        prompt-templates/page.tsx
        overrides/page.tsx
    api/                          # route handlers (BFF proxy to FastAPI)
  components/
    ui/                           # shadcn primitives (auto-generated, don't edit)
    shared/                       # reusable cross-feature components
  features/
    generation/                   # main dashboard — product selection + generate
    jobs/                         # job status + results grid
    images/                       # image cards, approve/reject/regenerate
    admin/                        # all admin CRUD modules
  lib/
    api/                          # base fetch client
    utils/                        # formatters, helpers
    env/                          # validated env vars
  hooks/                          # generic hooks (useDebounce, usePolling)
  types/                          # shared TypeScript types
  constants/                      # routes, config keys
```

## Layer Rules (STRICT)

- **Default: Server Component.** Only add `"use client"` when component needs interactivity, browser APIs, or TanStack Query
- **Never `"use client"` on entire pages.** Push boundary down to smallest interactive leaf
- **Data fetching hierarchy:**
  - Initial page data → Server Component async/await
  - Polling / real-time (job status) → TanStack Query in Client Component
  - Mutations → TanStack Query `useMutation` + Server Actions for simple cases
- **fetch() only in `lib/api/fetcher.ts`** — never inline in components or hooks
- **Feature API functions in `features/<feature>/api/`** — never call apiClient from components directly
- **Zustand for UI state only** — not for server data (that's TanStack Query)
- **nuqs for URL state** — filters, pagination, selected tab — always in URL, never useState

## API Communication

- All backend calls go through `lib/api/client.ts`
- Backend base URL: `NEXT_PUBLIC_API_URL` env var (FastAPI at localhost:8000 in dev)
- All responses validated with Zod at the feature API function level
- Error shape from backend is always `{ detail: string }` — map to `ApiError`
- For file uploads (product reference images) use multipart/form-data via dedicated upload function in `lib/api/`

## TanStack Query Conventions

- Query keys follow `[entity, id?, filters?]` pattern e.g. `["jobs", jobId]`, `["products"]`
- Polling for job status: `refetchInterval: 2000` while `job.status === "generating"`, stop when terminal
- Invalidate related queries after mutations: after approving image, invalidate `["jobs", jobId, "images"]`
- Always define query keys in `features/<feature>/queryKeys.ts` — never inline strings

## Forms

- All forms use React Hook Form + Zod
- Zod schemas in `features/<feature>/schemas/`
- Use shadcn Form components — always check shadcn MCP for correct usage
- Never use uncontrolled inputs outside of RHF

## Styling

- Tailwind only — no inline styles, no CSS modules
- Use shadcn/ui components as base — extend with Tailwind classes via `cn()`
- `cn()` from `lib/utils.ts` (clsx + tailwind-merge) for conditional classes
- Dark mode supported via shadcn's built-in theming

## State Management

- **Server state** → TanStack Query (jobs, images, products, etc.)
- **URL state** → nuqs (filters, pagination, selected country/shot type)
- **UI state** → Zustand (open modals, selected images for bulk actions, sidebar state)
- **Form state** → React Hook Form
- Never use useState for data that belongs in the URL or server cache

## Key Features — Implementation Notes

### Generation Dashboard (priority 1)

- Multi-select countries + shot types → stored in URL via nuqs
- "Preview Prompts" → modal showing assembled prompts before generating
- "Generate" → POST /jobs → redirect to /jobs/[id]
- Reference image selector per generation → up to 9 images from product's uploaded photos

### Job Results Grid (priority 2)

- Poll GET /jobs/[id] every 2s while generating — stop when complete/failed
- Images load progressively as they complete — don't wait for full job
- Each image card: approve / reject / regenerate / download actions
- Bulk approve/reject selection → Zustand for selected image IDs
- Filter by status, country, shot type → nuqs URL params
- Download approved ZIP → trigger GET /jobs/[id]/download as file download

### Admin (priority 3)

- One page per entity — products, colours, countries, shot_types, installation_types, prompt_templates, overrides
- DataTable with inline edit/disable per row
- Create/edit via sheet (slide-over panel) — not separate pages
- Prompt template: create new version only, never edit existing, set default toggle
- Product page: image upload for reference photos (multiple)

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1   # FastAPI backend
```

## Testing

- Component tests: Vitest + Testing Library
- Focus tests on: PromptPreview assembled output, job polling logic, image status transitions
- IMPORTANT: test the generation flow end-to-end before shipping to Dan

## IMPORTANT Rules

- Never hardcode API URLs — always use `lib/env/`
- Always handle loading and error states — never leave components without feedback
- Job polling MUST stop when status is terminal (complete/failed) — don't leave intervals running
- Image approve/reject must optimistically update the UI before server confirms
- Always use nuqs for filters — never useState for anything that should survive a page refresh
- Prompt preview must show the exact assembled prompt returned from the API — never reconstruct it client-side

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
