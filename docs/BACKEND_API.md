# ParcelFlow — Backend API Reference

All routes are prefixed with `/api/v1`. Base URL in development: `http://localhost:8000/api/v1`.

Static files (studio images, generated images) are served at `/static/...`.

---

## Common Conventions

### Pagination

List endpoints that return paginated results accept these query parameters:

| Parameter  | Default | Max | Notes              |
| ---------- | ------- | --- | ------------------ |
| `page`     | 1       | —   | 1-indexed          |
| `per_page` | 20      | 100 | clamped to [1,100] |

Paginated response shape:

```json
{
  "items": [...],
  "total": 42,
  "page": 1,
  "per_page": 20,
  "pages": 3
}
```

### Error Responses

All errors return:

```json
{ "detail": "Human-readable message" }
```

| Status | Meaning                          |
| ------ | -------------------------------- |
| 404    | Resource not found               |
| 409    | Conflict (e.g. duplicate slug)   |
| 422    | Validation error                 |
| 502    | Image generation failed (fal.ai) |

---

## Config Endpoints (read — frontend dropdowns)

### Products

#### `GET /products`

List active products (paginated).

**Query params:** `page`, `per_page`

**Response `200`:**

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Chelsea",
      "slug": "chelsea",
      "installation_type_id": "uuid",
      "active": true
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20,
  "pages": 1
}
```

---

### Colours

#### `GET /colours`

List active colours (paginated).

**Query params:** `page`, `per_page`

**Response `200`:**

```json
{
  "items": [
    {
      "id": "uuid",
      "ral_code": "RAL7032",
      "name": "Pebble Grey",
      "hex_preview": "#b5b0a0",
      "active": true
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20,
  "pages": 1
}
```

---

### Countries

#### `GET /countries`

List active countries (paginated).

**Query params:** `page`, `per_page`

**Response `200`:**

```json
{
  "items": [
    {
      "id": "uuid",
      "code": "UK",
      "name": "United Kingdom",
      "active": true
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20,
  "pages": 1
}
```

---

### Shot Types

#### `GET /shot-types`

List active shot types (paginated).

**Query params:** `page`, `per_page`

**Response `200`:**

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "PDP",
      "intent": "pdp",
      "active": true
    }
  ],
  "total": 2,
  "page": 1,
  "per_page": 20,
  "pages": 1
}
```

`intent` values: `pdp` | `lifestyle` | `marketing`

---

### Installation Types

#### `GET /installation-types`

List active installation types (paginated).

**Query params:** `page`, `per_page`

**Response `200`:**

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "built_in",
      "label": "Built-In (Wall Integrated)",
      "active": true
    }
  ],
  "total": 4,
  "page": 1,
  "per_page": 20,
  "pages": 1
}
```

---

### Prompt Templates

#### `GET /prompt-templates/default`

Get the current default prompt template.

**Response `200`:**

```json
{
  "id": "uuid",
  "name": "Standard v1",
  "base_framework": "Ultra-realistic architectural photograph...",
  "quality_rules": "Highly detailed textures, photorealistic...",
  "version": 1,
  "is_default": true,
  "created_at": "2026-04-15T10:00:00Z"
}
```

---

## Jobs

### `POST /jobs/preview`

Assemble and return prompts for the given selection without triggering generation. Use this for the "Preview Prompts" button.

**Request body:**

```json
{
  "product_id": "uuid",
  "colour_id": "uuid",
  "country_ids": ["uuid", "uuid"],
  "shot_type_ids": ["uuid", "uuid"],
  "prompt_template_id": "uuid"
}
```

`prompt_template_id` is optional — omit to use the current default template.

`country_ids` and `shot_type_ids` require at least one item each.

**Response `200`:**

```json
{
  "prompts": [
    {
      "country_id": "uuid",
      "shot_type_id": "uuid",
      "prompt": "Ultra-realistic architectural photograph of..."
    }
  ]
}
```

Returns one `PreviewItem` per `country × shot_type` combination.

---

### `POST /jobs`

Create a generation job and trigger image generation in the background.

Total images created = `len(country_ids) × len(shot_type_ids) × variations`.

**Request body:**

```json
{
  "product_id": "uuid",
  "colour_id": "uuid",
  "country_ids": ["uuid"],
  "shot_type_ids": ["uuid", "uuid"],
  "variations": 1,
  "prompt_template_id": "uuid",
  "product_image_ids": ["uuid", "uuid"]
}
```

| Field                | Type         | Required | Notes                                                  |
| -------------------- | ------------ | -------- | ------------------------------------------------------ |
| `product_id`         | UUID         | yes      | —                                                      |
| `colour_id`          | UUID         | yes      | —                                                      |
| `country_ids`        | UUID[]       | yes      | min 1                                                  |
| `shot_type_ids`      | UUID[]       | yes      | min 1                                                  |
| `variations`         | int          | no       | default `1`, range `[1, 10]`                           |
| `prompt_template_id` | UUID \| null | no       | defaults to current default template                   |
| `product_image_ids`  | UUID[]       | no       | studio reference images; max 9; omit for text-to-image |

**Response `201`:**

```json
{
  "id": "uuid",
  "status": "idle",
  "total_images": 4,
  "completed_images": 0,
  "images": []
}
```

Job `status` values: `idle` | `generating` | `complete` | `failed`

---

### `GET /jobs/{job_id}`

Get job status and all image records. Poll this every 2–3 seconds during generation.

**Response `200`:**

```json
{
  "id": "uuid",
  "status": "generating",
  "total_images": 4,
  "completed_images": 2,
  "images": [
    {
      "id": "uuid",
      "status": "complete",
      "file_path": "/chelsea/RAL7032/UK/PDP/Chelsea_RAL7032_UK_PDP_V1.png",
      "regeneration_source_id": null
    },
    {
      "id": "uuid",
      "status": "pending",
      "file_path": null,
      "regeneration_source_id": null
    }
  ]
}
```

Image `status` values: `pending` | `generating` | `complete` | `failed` | `approved` | `rejected`

Job is `complete` when all images have a terminal status (`complete`, `failed`, `approved`, or `rejected`). Job is `failed` only if ALL images failed.

---

## Images

### `PATCH /images/{image_id}/status`

Approve or reject an image.

**Request body:**

```json
{ "status": "approved" }
```

`status` must be `"approved"` or `"rejected"`.

**Response `200`** — full image record:

```json
{
  "id": "uuid",
  "job_id": "uuid",
  "product_id": "uuid",
  "colour_id": "uuid",
  "country_id": "uuid",
  "shot_type_id": "uuid",
  "variation_number": 1,
  "prompt_used": "Ultra-realistic architectural photograph of...",
  "file_path": "/chelsea/RAL7032/UK/PDP/Chelsea_RAL7032_UK_PDP_V1.png",
  "status": "approved",
  "model_used": "fal-ai/flux-2-pro",
  "regeneration_source_id": null,
  "created_at": "2026-04-15T10:00:00Z"
}
```

---

### `POST /images/{image_id}/regenerate`

Regenerate a single image using its stored `prompt_used`. Creates a new image record; the original is NOT modified.

**No request body.**

**Response `201`** — new image record (same shape as above):

```json
{
  "id": "uuid",
  "job_id": "uuid",
  "status": "pending",
  "regeneration_source_id": "uuid",
  ...
}
```

`regeneration_source_id` points to the original image.

---

### `GET /jobs/{job_id}/download`

Stream a ZIP archive of all **approved** images for a job.

**Response `200`** — `application/zip` stream

`Content-Disposition: attachment; filename="<job_id>.zip"`

ZIP preserves the directory structure:

```
{product_slug}/{ral_code}/{country_code}/{shot_type_name}/
  Chelsea_RAL7032_UK_PDP_V1.png
```

Only images with `status = approved` are included. Returns `200` with an empty ZIP if none are approved.

---

## Admin Endpoints

All admin routes are prefixed with `/api/v1/admin/`. No authentication in V1.

### Admin — Installation Types

#### `GET /admin/installation-types`

List all installation types (including disabled).

**Response `200`:**

```json
[
  {
    "id": "uuid",
    "name": "built_in",
    "label": "Built-In (Wall Integrated)",
    "installation_prompt_block": "The box is integrated into a brick wall...",
    "active": true,
    "deleted_at": null
  }
]
```

#### `POST /admin/installation-types`

Create an installation type.

**Request body:**

```json
{
  "name": "built_in",
  "label": "Built-In (Wall Integrated)",
  "installation_prompt_block": "The box is integrated into a brick wall..."
}
```

**Response `201`** — same as admin response above.

#### `PATCH /admin/installation-types/{id}`

Update an installation type. All fields optional.

**Request body:**

```json
{
  "name": "built_in",
  "label": "Built-In (Wall Integrated)",
  "installation_prompt_block": "Updated block text...",
  "active": true
}
```

**Response `200`** — updated record.

#### `DELETE /admin/installation-types/{id}`

Soft-disable. Sets `deleted_at`, does NOT hard delete.

**Response `204`** — no body.

---

### Admin — Products

#### `GET /admin/products`

List all products (including disabled).

**Response `200`:**

```json
[
  {
    "id": "uuid",
    "name": "Chelsea",
    "slug": "chelsea",
    "installation_type_id": "uuid",
    "product_prompt_block": "The product is the Chelsea parcel box...",
    "active": true,
    "deleted_at": null
  }
]
```

#### `POST /admin/products`

**Request body:**

```json
{
  "name": "Chelsea",
  "slug": "chelsea",
  "installation_type_id": "uuid",
  "product_prompt_block": "The product is the Chelsea parcel box..."
}
```

**Response `201`** — same as admin response above.

#### `PATCH /admin/products/{id}`

All fields optional.

**Request body:**

```json
{
  "name": "Chelsea",
  "slug": "chelsea",
  "installation_type_id": "uuid",
  "product_prompt_block": "Updated block...",
  "active": true
}
```

**Response `200`** — updated record.

#### `DELETE /admin/products/{id}`

Soft-disable. **Response `204`.**

---

### Admin — Product Images (Studio References)

#### `GET /admin/products/{id}/images`

List all studio reference images for a product.

**Response `200`:**

```json
[
  {
    "id": "uuid",
    "product_id": "uuid",
    "label": "Front view",
    "url": "/static/studio/chelsea/front.jpg",
    "created_at": "2026-04-15T10:00:00Z"
  }
]
```

#### `POST /admin/products/{id}/images`

Add a studio image by URL.

**Request body (JSON):**

```json
{
  "label": "Front view",
  "url": "https://example.com/chelsea-front.jpg"
}
```

**Response `201`** — same as image response above.

#### `POST /admin/products/{id}/images/upload`

Upload a studio image file. Images are stored under `{OUTPUT_DIR}/studio/{product_slug}/` and served at `/static/studio/{slug}/{filename}`.

**Request:** `multipart/form-data`

| Field   | Type   | Notes                            |
| ------- | ------ | -------------------------------- |
| `file`  | file   | image file (PNG, JPG, etc.)      |
| `label` | string | optional label, defaults to `""` |

**Response `201`** — same as image response above.

#### `DELETE /admin/product-images/{image_id}`

Hard-delete a studio image record. Does NOT delete the file from disk.

**Response `204`** — no body.

---

### Admin — Colours

#### `GET /admin/colours`

List all colours (including disabled).

**Response `200`:**

```json
[
  {
    "id": "uuid",
    "ral_code": "RAL7032",
    "name": "Pebble Grey",
    "hex_preview": "#b5b0a0",
    "finish_prompt_block": "Finished in RAL 7032 pebble grey...",
    "active": true,
    "deleted_at": null
  }
]
```

#### `POST /admin/colours`

**Request body:**

```json
{
  "ral_code": "RAL7032",
  "name": "Pebble Grey",
  "hex_preview": "#b5b0a0",
  "finish_prompt_block": "Finished in RAL 7032 pebble grey..."
}
```

`hex_preview` is optional.

**Response `201`** — same as admin response above.

#### `PATCH /admin/colours/{id}`

All fields optional.

**Request body:**

```json
{
  "ral_code": "RAL7032",
  "name": "Pebble Grey",
  "hex_preview": "#b5b0a0",
  "finish_prompt_block": "Updated block...",
  "active": true
}
```

**Response `200`** — updated record.

#### `DELETE /admin/colours/{id}`

Soft-disable. **Response `204`.**

---

### Admin — Countries

#### `GET /admin/countries`

List all countries (including disabled).

**Response `200`:**

```json
[
  {
    "id": "uuid",
    "code": "UK",
    "name": "United Kingdom",
    "environment_prompt_block": "Traditional UK red brick boundary wall...",
    "active": true,
    "deleted_at": null
  }
]
```

#### `POST /admin/countries`

**Request body:**

```json
{
  "code": "UK",
  "name": "United Kingdom",
  "environment_prompt_block": "Traditional UK red brick boundary wall..."
}
```

**Response `201`** — same as admin response above.

#### `PATCH /admin/countries/{id}`

All fields optional.

**Request body:**

```json
{
  "code": "UK",
  "name": "United Kingdom",
  "environment_prompt_block": "Updated block...",
  "active": true
}
```

**Response `200`** — updated record.

#### `DELETE /admin/countries/{id}`

Soft-disable. **Response `204`.**

---

### Admin — Shot Types

#### `GET /admin/shot-types`

List all shot types (including disabled).

**Response `200`:**

```json
[
  {
    "id": "uuid",
    "name": "PDP",
    "intent": "pdp",
    "framing_prompt_block": "Shot at eye level using a 35mm lens...",
    "active": true,
    "deleted_at": null
  }
]
```

#### `POST /admin/shot-types`

**Request body:**

```json
{
  "name": "PDP",
  "intent": "pdp",
  "framing_prompt_block": "Shot at eye level using a 35mm lens..."
}
```

`intent` values: `pdp` | `lifestyle` | `marketing`

**Response `201`** — same as admin response above.

#### `PATCH /admin/shot-types/{id}`

All fields optional.

**Request body:**

```json
{
  "name": "PDP",
  "intent": "pdp",
  "framing_prompt_block": "Updated block...",
  "active": true
}
```

**Response `200`** — updated record.

#### `DELETE /admin/shot-types/{id}`

Soft-disable. **Response `204`.**

---

### Admin — Prompt Templates

Templates are versioned. Never edit existing templates — create new versions instead.

#### `GET /admin/prompt-templates`

List all template versions.

**Response `200`:**

```json
[
  {
    "id": "uuid",
    "name": "Standard v1",
    "base_framework": "Ultra-realistic architectural photograph...",
    "quality_rules": "Highly detailed textures...",
    "version": 1,
    "is_default": true,
    "created_at": "2026-04-15T10:00:00Z"
  }
]
```

#### `POST /admin/prompt-templates`

Create a new template version. The new template is NOT set as default automatically.

**Request body:**

```json
{
  "name": "Standard v2",
  "base_framework": "Ultra-realistic architectural photograph...",
  "quality_rules": "Highly detailed textures, photorealistic..."
}
```

**Response `201`** — full template record.

#### `PATCH /admin/prompt-templates/{id}/default`

Set this template as the system default. Unsets the previous default.

**No request body.**

**Response `200`** — updated template record.

---

### Admin — Prompt Block Overrides

Overrides allow any config entity to replace one of its prompt blocks for specific generation contexts without modifying the entity's main row.

Valid `entity_type` values: `product` | `country` | `shot_type` | `colour` | `installation_type`

Valid `override_key` values match the prompt block field names:

- `product_prompt_block`
- `installation_prompt_block`
- `environment_prompt_block`
- `finish_prompt_block`
- `framing_prompt_block`

#### `GET /admin/overrides`

List all overrides.

**Response `200`:**

```json
[
  {
    "id": "uuid",
    "entity_type": "product",
    "entity_id": "uuid",
    "override_key": "product_prompt_block",
    "override_value": "Custom block text for this entity...",
    "active": true
  }
]
```

#### `POST /admin/overrides`

Create an override.

**Request body:**

```json
{
  "entity_type": "product",
  "entity_id": "uuid",
  "override_key": "product_prompt_block",
  "override_value": "Custom block text for this entity..."
}
```

**Response `201`** — same as override response above.

#### `PATCH /admin/overrides/{id}`

Enable or disable an override.

**Request body:**

```json
{ "active": false }
```

**Response `200`** — updated override record.

#### `DELETE /admin/overrides/{id}`

Hard-delete an override.

**Response `204`** — no body.

---

## Static Files

Studio images uploaded via `POST /admin/products/{id}/images/upload` are served at:

```
GET /static/studio/{product_slug}/{filename}
```

Generated images are served at:

```
GET /static/{product_slug}/{ral_code}/{country_code}/{shot_type_name}/{filename}
```

---

## Quick Reference

```
# Config (frontend dropdowns)
GET  /products                           paginated active products
GET  /colours                            paginated active colours
GET  /countries                          paginated active countries
GET  /shot-types                         paginated active shot types
GET  /installation-types                 paginated active installation types
GET  /prompt-templates/default           current default template

# Jobs & Images
POST /jobs/preview                       preview assembled prompts (no generation)
POST /jobs                               create job + trigger generation
GET  /jobs/{id}                          job status + image list (poll during generation)
GET  /jobs/{id}/download                 stream ZIP of approved images

PATCH /images/{id}/status               approve or reject an image
POST  /images/{id}/regenerate           regenerate a single image

# Admin — CRUD for all config entities
GET    /admin/installation-types
POST   /admin/installation-types
PATCH  /admin/installation-types/{id}
DELETE /admin/installation-types/{id}

GET    /admin/products
POST   /admin/products
PATCH  /admin/products/{id}
DELETE /admin/products/{id}
GET    /admin/products/{id}/images
POST   /admin/products/{id}/images
POST   /admin/products/{id}/images/upload
DELETE /admin/product-images/{id}

GET    /admin/colours
POST   /admin/colours
PATCH  /admin/colours/{id}
DELETE /admin/colours/{id}

GET    /admin/countries
POST   /admin/countries
PATCH  /admin/countries/{id}
DELETE /admin/countries/{id}

GET    /admin/shot-types
POST   /admin/shot-types
PATCH  /admin/shot-types/{id}
DELETE /admin/shot-types/{id}

GET    /admin/prompt-templates
POST   /admin/prompt-templates
PATCH  /admin/prompt-templates/{id}/default

GET    /admin/overrides
POST   /admin/overrides
PATCH  /admin/overrides/{id}
DELETE /admin/overrides/{id}
```
