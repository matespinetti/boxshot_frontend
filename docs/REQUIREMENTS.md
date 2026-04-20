# ParcelFlow Frontend — Requirements

## Users

Small internal team. Non-technical users. Desktop only. No auth in V1.

---

## Surface 1 — Generation Dashboard (Priority 1)

### Input Panel (`/generate`)

User selects:

| Field            | Control                       | Notes                                                    |
| ---------------- | ----------------------------- | -------------------------------------------------------- |
| Product          | Dropdown (single)             | Populated from DB, shows name                            |
| Colour / RAL     | Dropdown (single)             | Shows RAL code + name + colour swatch                    |
| Installation type | Dropdown (single)            | Required, selected explicitly per generation             |
| Surface type     | Dropdown (single)             | Required, selected explicitly per generation             |
| Countries        | Multi-select                  | At least one required                                    |
| Shot types       | Multi-select                  | At least one required                                    |
| Model            | Dropdown (single)             | Required, populated from backend `/models`               |
| Variations       | Segmented control (1 / 3 / 5) | Per combination                                          |
| Reference images | Image picker                  | Shows uploaded photos for selected product, pick up to 9 |

All selections stored in URL via nuqs — survive page refresh and are shareable.

**Total images counter** updates live: `len(countries) × len(shot_types) × variations`

**Actions:**

- **Preview Prompts** — opens modal showing assembled prompts for each combination, no API call to image model
- **Generate** — `POST /jobs`, redirects to `/jobs/[id]`

**Validation:**

- Product required
- Colour required
- Installation type required
- Surface type required
- Model required
- At least one country
- At least one shot type
- At least one reference image selected (warning, not hard block)

---

### Job Results (`/jobs/[id]`)

**Status bar (top)**

- Status badge: idle / generating / complete / failed
- Progress: `X / total images`
- Time elapsed
- "Generating..." animation while in progress

**Image grid**

Each image card shows:

- Image thumbnail (click to view full size)
- Product name + RAL code
- Country code flag + name
- Shot type badge
- Variation number
- Status badge

Per-image actions:

- ✅ **Approve** — marks image approved, card gets green border
- ❌ **Reject** — marks image rejected, card dims
- 🔄 **Regenerate** — fires same prompt, new image appears in grid
- ⬇ **Download** — downloads single image file

**Filters (above grid)**

- Status: All / Pending / Approved / Rejected / Failed
- Country: All / specific country
- Shot type: All / specific shot type

All filters in URL via nuqs.

**Bulk actions**

- Checkbox on each card for selection
- "Approve selected" / "Reject selected" bulk action bar appears when any selected
- "Select all approved" shortcut

**Download section**

- Count of approved images
- "Download approved as ZIP" button → streams ZIP with folder structure

---

## Surface 2 — Admin Panel (Priority 2)

Route prefix: `/admin`

### Admin sidebar nav:

- Products
- Colours / RAL
- Countries
- Shot Types
- Installation Types
- Surface Types
- Prompt Templates
- Prompt Overrides

### Each entity page pattern:

**Table view:**

- All records (including disabled, shown greyed out)
- Columns specific to entity (name, code, status, etc.)
- Search/filter input
- "Add new" button → opens EntitySheet
- Per-row: Edit button → opens EntitySheet, Disable/Enable toggle

**EntitySheet (slide-over):**

- Create or edit form
- React Hook Form + Zod validation
- Submit → mutation → close sheet → table refreshes
- Cancel → close without saving

---

### Products (`/admin/products`)

**Table columns:** Name, Slug, Status, Actions

**Form fields:**

- Name (text)
- Slug (text, auto-generated from name, editable)
- Product Prompt Block (large textarea)
- Reference Images (multi-image upload, shows existing, can add/remove)

---

### Colours (`/admin/colours`)

**Table columns:** RAL Code, Name, Colour Swatch, Status, Actions

**Form fields:**

- RAL Code (text e.g. "RAL7032")
- Name (text e.g. "Pebble Grey")
- Hex Preview (colour picker + hex input)
- Finish Prompt Block (large textarea)

---

### Countries (`/admin/countries`)

**Table columns:** Code, Name, Status, Actions

**Form fields:**

- Code (text e.g. "UK")
- Name (text e.g. "United Kingdom")
- Environment Prompt Block (large textarea)

---

### Shot Types (`/admin/shot-types`)

**Table columns:** Name, Intent, Status, Actions

**Form fields:**

- Name (text e.g. "PDP", "Lifestyle")
- Intent (dropdown: pdp / lifestyle / marketing)
- Framing Prompt Block (large textarea)

---

### Installation Types (`/admin/installation-types`)

**Table columns:** Name, Label, Status, Actions

**Form fields:**

- Name (text e.g. "built_in")
- Label (text e.g. "Built-In (Wall Integrated)")
- Installation Prompt Block (large textarea)

---

### Surface Types (`/admin/surface-types`)

**Table columns:** Name, Label, Status, Actions

**Form fields:**

- Name (text e.g. "brick_wall")
- Label (text e.g. "Brick Wall")
- Surface Prompt Block (large textarea)

---

### Prompt Templates (`/admin/prompt-templates`)

**Table columns:** Name, Version, Default, Created At, Actions

**Rules:**

- Never edit an existing template — create new version only
- "Set as default" toggle per row (only one can be default)
- View full template content in read-only modal

**Form fields (create only):**

- Name (text)
- Base Framework (large textarea)
- Quality Rules (large textarea)

---

### Prompt Overrides (`/admin/overrides`)

**Table columns:** Entity Type, Entity Name, Override Key, Preview (truncated), Actions

**Form fields:**

- Entity Type (dropdown: product / country / shot_type / colour / installation_type)
- Entity (dropdown, populated based on entity type selection)
- Override Key (dropdown: the specific block being overridden)
- Override Value (large textarea)

**Delete only** — no editing. To change, delete and recreate.

---

## Non-Functional Requirements

### Performance

- Image grid must show images as they generate — not wait for full job
- Polling must stop immediately on job completion — no wasted requests
- Admin tables paginated — 25 rows per page default

### UX

- Every action must have loading state — no silent waits
- Every mutation must have success/error toast (sonner)
- Optimistic updates for approve/reject — don't wait for server
- Empty states for every table and grid — with clear call to action
- Confirm dialog for destructive actions (disable product, delete override)

### Consistency

- Status badges consistent across all surfaces — same colours, same labels
- RAL colour swatches shown wherever a colour is referenced
- Country flags shown wherever country is referenced

---

## Out of Scope (V1)

| Feature                    | Target |
| -------------------------- | ------ |
| Authentication             | V2     |
| Dark mode toggle           | V1.1   |
| Mobile responsive          | V2     |
| Drag to reorder images     | V1.1   |
| "More like this" variation | V1.1   |
| Image intent modes         | V1.1   |
| Usage analytics dashboard  | V2     |
