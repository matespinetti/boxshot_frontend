# Frontend Design — Surface Types + Model Selection Alignment

## Goal

Update the Next.js frontend so it matches the backend changes introduced on April 20, 2026:

- `surface_types` is now a first-class config entity
- `installation_type_id` moved from product-level selection to job-level selection
- generation requests now require both `installation_type_id` and `surface_type_id`
- generation requests can submit an explicit `model`
- the admin UI needs a first-class `Surface Types` page

This is a parity-first frontend update, not a broader UX redesign.

## Scope

### In scope

- Generation page updates
  - add required `installation type`, `surface type`, and `model` selectors
  - submit the new request shape for preview and job creation
  - keep URL state aligned with the new fields
- Admin updates
  - add a full `Surface Types` admin page
  - remove `installation_type_id` from product admin form and table
- Shared frontend contract updates
  - fix stale Zod entity/request schemas
  - add missing types for `SurfaceType` and `Model`
- Frontend tests and docs updates required by the above

### Out of scope

- Jobs/results UX redesign
- Prompt overrides support for `surface_type`
- Broader admin IA redesign
- Backend changes

## Existing Context

The frontend already has the right structural seams:

- generation logic lives under `src/features/generation`
- admin entities follow a repeatable pattern under `src/features/admin/<entity>`
- shared API response validation lives in `src/schemas`
- the admin shell already supports adding one more entity page cleanly

The problem is contract drift. Current frontend code still assumes:

- products expose `installation_type_id`
- generation requests do not require `installation_type_id`
- generation requests do not require `surface_type_id`
- model selection is not user-visible

That drift should be corrected in-place instead of patched around.

## Recommended Approach

Use a parity-first update:

1. keep the current navigation and page structure
2. update shared schemas first so the frontend validates the real backend contract
3. extend the generation feature with three explicit selectors
4. add a new `surface-types` admin module by copying the established `installation-types` pattern
5. remove installation-type references from product admin surfaces

This is lower risk than a redesign and produces a frontend that is internally consistent again.

## Information Architecture

### Generation

The generate page remains a single-screen form with preview-confirm flow.

The form input stack becomes:

1. product
2. colour
3. installation type
4. surface type
5. countries
6. shot types
7. model
8. variations
9. reference images

Rationale:

- `installation type` and `surface type` now describe job context, so they belong with the main generation inputs
- `model` is explicitly user-selectable and should be visible, not hidden behind an advanced panel
- this keeps the current mental model intact while making the new dimensions obvious

### Admin

Add a new top-level admin destination:

- `/admin/surface-types`

It should appear alongside the existing config entities and follow the same CRUD pattern as `installation-types`.

The products page remains in place but loses the installation-type relationship everywhere in the UI.

## Component Design

### Generation feature

#### New data sources

Add three API readers in `src/features/generation/api/`:

- `getInstallationTypes.ts`
- `getSurfaceTypes.ts`
- `getModels.ts`

All should use the existing `apiClient` and validate responses through shared schemas.

#### New selectors

Add three leaf components in `src/features/generation/components/`:

- `InstallationTypeSelector`
- `SurfaceTypeSelector`
- `ModelSelector`

These should follow the same style as `ProductSelector` and `ColourSelector`:

- controlled via RHF
- fed with already-fetched data
- show loading/empty/disabled states clearly

#### Generation form hook

`useGenerationForm` becomes the source of truth for the new fields:

- new form defaults
- new URL state bindings via `nuqs`
- preview payload assembly
- create-job payload assembly
- default model behavior

The existing preview modal flow stays unchanged:

- submit form
- call preview endpoint
- show returned prompts
- confirm creation

### Admin feature

Add a new module:

`src/features/admin/surface-types/`

It should mirror `installation-types`:

- `api/surfaceTypes.ts`
- `components/SurfaceTypeForm.tsx`
- `components/SurfaceTypesAdminTable.tsx`
- `schemas/surface-type.schema.ts`

Also add:

- route file at `src/app/(dashboard)/admin/surface-types/page.tsx`
- sidebar/navigation entry

The page pattern should stay consistent with the rest of admin:

- table view
- create/edit sheet
- disable toggle
- no separate detail page

#### Product admin adjustments

Update the existing products module so:

- `ProductForm` removes the installation type field entirely
- `ProductsAdminTable` removes the installation type column
- product admin schema no longer requires `installation_type_id`

Reference image upload behavior remains unchanged.

## Data Contract Changes

### Shared schemas

Update `src/schemas/entities.ts`:

- remove `installation_type_id` from `ProductSchema`
- add `SurfaceTypeSchema`
- add `SurfaceTypeAdminSchema`
- add `ModelSchema`

Expected shapes:

- `Product`: `id`, `name`, `slug`, `active`
- `SurfaceType`: `id`, `name`, `label`, `active`
- `SurfaceTypeAdmin`: `id`, `name`, `label`, `surface_prompt_block`, `active`, `deleted_at`
- `Model`: `id`, `label`

### Generation request schemas

Update `src/features/generation/schemas/generation.schema.ts`:

- `PreviewPromptsRequestSchema` requires:
  - `product_id`
  - `colour_id`
  - `installation_type_id`
  - `surface_type_id`
  - `country_ids`
  - `shot_type_ids`
  - optional `prompt_template_id`
- `CreateJobRequestSchema` requires all of the above plus:
  - `variations`
  - optional `product_image_ids`
  - required `model`

### API usage

Preview should call:

- `POST /jobs/preview`

with the new required installation/surface fields.

Create job should call:

- `POST /jobs`

with installation type, surface type, and model.

Models should come from:

- `GET /models`

No frontend fallback model constant should be introduced.

## State and Interaction Rules

### URL state

Store the following in URL state:

- `product_id`
- `colour_id`
- `installation_type_id`
- `surface_type_id`
- `country_ids`
- `shot_type_ids`
- `model`
- `variations`
- `product_image_ids`

This keeps the page refresh-safe and shareable under the existing app conventions.

### Reset rules

When `product_id` changes:

- clear `colour_id`
- clear `product_image_ids`

Do not clear:

- `installation_type_id`
- `surface_type_id`
- `model`

Reason: these are now job-level choices, not product-derived choices.

### Model defaulting

The generation page should set the default model from the first item returned by `/models`.

If `/models` returns an empty array:

- show a visible error/empty state in the form area
- disable preview and generate actions
- do not guess a fallback model in the client

## Error Handling

### Generation

Handle these states explicitly:

- config query loading
- config query failure
- empty model list
- preview mutation failure
- create-job mutation failure

User-facing behavior:

- toast on preview/create failure
- disabled controls where a required dataset is missing
- clear placeholder text while config lists load

### Admin

Surface Types page should match current admin behavior:

- loading state for table
- empty state when no rows exist
- success/error toast on create/update/disable
- sheet closes only on successful mutation

## Testing Strategy

### Update existing tests

- generation request schema tests
- generation form tests if present
- products admin form/table tests
- shared entity schema tests

### Add new tests

- `SurfaceType` shared schema validation
- generation schema requires `installation_type_id`
- generation schema requires `surface_type_id`
- generation schema requires `model`
- `SurfaceTypeForm` component tests
- `SurfaceTypesAdminTable` component tests

### Regression checks

Specifically verify:

- product parsing works without `installation_type_id`
- preview payload includes installation/surface fields
- create payload includes installation/surface/model
- product admin can create/update without installation type

## Docs Updates

Update stale frontend documentation that still describes the old contract:

- `frontend/docs/BACKEND_API.md`
- `frontend/docs/REQUIREMENTS.md`
- any local comments/examples tied to product-level installation type

Key doc corrections:

- products no longer own `installation_type_id`
- generation preview/create now require both installation and surface type
- generate page includes explicit model selection
- admin includes a `Surface Types` page

## Implementation Boundaries

This design intentionally avoids:

- changing jobs/results pages
- changing prompt override entity support
- redesigning the dashboard shell
- introducing new state-management patterns

The work should follow existing frontend conventions and stay isolated to:

- generation feature
- surface-types admin module
- product admin cleanup
- shared schema/doc/test alignment

## Success Criteria

The frontend is complete when:

1. the generate page can preview and create jobs against the new backend contract
2. users can explicitly choose installation type, surface type, and model
3. products admin no longer references installation type
4. admin has a working `Surface Types` CRUD page
5. frontend shared schemas, docs, and tests no longer reflect the old backend shape
