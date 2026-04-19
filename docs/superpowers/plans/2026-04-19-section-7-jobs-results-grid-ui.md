# Section 7 — Jobs Results Grid UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the jobs history page and the jobs review workspace end-to-end by adding a backend `GET /jobs` endpoint, expanding job detail payloads, and replacing the `/jobs/[id]` stub with a live polling review UI.

**Architecture:** Implement the backend contract first so the frontend can rely on a stable paginated jobs list and a richer job detail payload. On the frontend, keep `/jobs` lightweight and paginated, and make `/jobs/[id]` the dedicated review workspace that polls the existing detail endpoint, filters in-memory images via nuqs, and manages bulk selection with a tiny Zustand store.

**Tech Stack:** FastAPI, SQLAlchemy async, Pydantic v2, pytest/httpx, Next.js App Router, TanStack Query v5, nuqs v2, Zustand, Vitest, Testing Library, shadcn/ui

---

## File Map

| Action | Path |
| --- | --- |
| Modify | `backend/app/modules/jobs/schemas.py` |
| Modify | `backend/app/modules/jobs/repository.py` |
| Modify | `backend/app/modules/jobs/service.py` |
| Modify | `backend/app/modules/jobs/router.py` |
| Modify | `backend/tests/test_router_jobs.py` |
| Modify | `backend/tests/test_service_jobs_create.py` |
| Create | `backend/tests/test_jobs_repository.py` |
| Modify | `src/schemas/jobs.ts` |
| Modify | `src/features/jobs/queryKeys.ts` |
| Create | `src/features/jobs/api/getJobs.ts` |
| Create | `src/features/jobs/api/updateImageStatus.ts` |
| Create | `src/features/jobs/api/__tests__/getJobs.test.ts` |
| Create | `src/features/jobs/api/__tests__/updateImageStatus.test.ts` |
| Modify | `src/features/jobs/api/__tests__/getJob.test.ts` |
| Modify | `src/components/layout/AppSidebar.tsx` |
| Modify | `src/components/layout/__tests__/AppSidebar.test.tsx` |
| Create | `src/app/(dashboard)/jobs/page.tsx` |
| Create | `src/app/(dashboard)/jobs/[id]/loading.tsx` |
| Create | `src/app/(dashboard)/jobs/[id]/error.tsx` |
| Modify | `src/app/(dashboard)/jobs/[id]/page.tsx` |
| Create | `src/features/jobs/components/JobsTable.tsx` |
| Create | `src/features/jobs/components/GridFilters.tsx` |
| Create | `src/features/jobs/components/JobStatusBar.tsx` |
| Create | `src/features/jobs/components/ImageGrid.tsx` |
| Create | `src/features/jobs/components/BulkActions.tsx` |
| Create | `src/features/jobs/components/DownloadButton.tsx` |
| Create | `src/features/jobs/components/JobResultsView.tsx` |
| Create | `src/features/jobs/components/__tests__/JobsTable.test.tsx` |
| Create | `src/features/jobs/components/__tests__/GridFilters.test.tsx` |
| Create | `src/features/jobs/components/__tests__/JobStatusBar.test.tsx` |
| Create | `src/features/jobs/components/__tests__/ImageGrid.test.tsx` |
| Create | `src/features/jobs/components/__tests__/BulkActions.test.tsx` |
| Create | `src/features/jobs/components/__tests__/JobResultsView.test.tsx` |
| Create | `src/features/jobs/stores/useImageSelectionStore.ts` |
| Create | `src/features/jobs/stores/__tests__/useImageSelectionStore.test.ts` |

---

### Task 1: Backend Schemas for Jobs List + Rich Job Detail

**Files:**
- Modify: `backend/app/modules/jobs/schemas.py`
- Test: `backend/tests/test_router_jobs.py`
- Test: `backend/tests/test_service_jobs_create.py`

- [ ] **Step 1: Write the failing router test for `GET /jobs`**

Append to `backend/tests/test_router_jobs.py`:

```python
async def test_list_jobs_returns_paginated_response() -> None:
    mock_response = {
        "items": [
            {
                "id": str(uuid.uuid4()),
                "status": "generating",
                "total_images": 12,
                "completed_images": 4,
                "created_at": "2026-04-19T12:00:00Z",
            }
        ],
        "total": 1,
        "page": 1,
        "per_page": 20,
        "pages": 1,
    }
    with patch("app.modules.jobs.router.service") as mock_svc:
        mock_svc.list_jobs = AsyncMock(return_value=mock_response)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(JOBS_URL)

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["status"] == "generating"
```

- [ ] **Step 2: Write the failing service test for rich image detail fields**

Append to `backend/tests/test_service_jobs_create.py`:

```python
async def test_get_job_returns_rich_image_details() -> None:
    session = AsyncMock()
    image_id = uuid.uuid4()
    job = SimpleNamespace(
        id=uuid.uuid4(),
        status=JobStatus.GENERATING,
        total_images=2,
        completed_images=1,
        created_at=datetime.fromisoformat("2026-04-19T12:00:00+00:00"),
        images=[
            SimpleNamespace(
                id=image_id,
                status=ImageStatus.COMPLETE,
                file_path="/output/a.png",
                regeneration_source_id=None,
                product_id=uuid.uuid4(),
                colour_id=uuid.uuid4(),
                country_id=uuid.uuid4(),
                shot_type_id=uuid.uuid4(),
                variation_number=1,
                created_at=datetime.fromisoformat("2026-04-19T12:00:10+00:00"),
                product_name="Chelsea",
                ral_code="RAL7032",
                country_code="UK",
                country_name="United Kingdom",
                shot_type_name="PDP",
            )
        ],
    )

    with patch("app.modules.jobs.service.jobs_repo") as mock_jobs_repo:
        mock_jobs_repo.get_by_id = AsyncMock(return_value=job)

        result = await service.get_job(session, job.id)

    assert result.created_at == job.created_at
    assert result.images[0].product_name == "Chelsea"
    assert result.images[0].shot_type_name == "PDP"
```

- [ ] **Step 3: Run the backend tests to verify they fail**

Run:

```bash
cd /home/matespinetti/projects/boxshot/backend && uv run pytest tests/test_router_jobs.py tests/test_service_jobs_create.py -q
```

Expected:

- FAIL because `list_jobs` route/service/schema do not exist yet
- FAIL because `JobResponse` / `JobImageSummary` do not expose the new fields

- [ ] **Step 4: Expand jobs schemas with list item and rich image detail response models**

Replace the existing response models in `backend/app/modules/jobs/schemas.py` with:

```python
import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.shared.schemas import PaginatedResponse


class PreviewRequest(BaseModel):
    product_id: uuid.UUID
    colour_id: uuid.UUID
    country_ids: list[uuid.UUID] = Field(min_length=1)
    shot_type_ids: list[uuid.UUID] = Field(min_length=1)
    prompt_template_id: uuid.UUID | None = None


class PreviewItem(BaseModel):
    country_id: uuid.UUID
    shot_type_id: uuid.UUID
    prompt: str


class PreviewResponse(BaseModel):
    prompts: list[PreviewItem]


class JobCreate(BaseModel):
    product_id: uuid.UUID
    colour_id: uuid.UUID
    country_ids: list[uuid.UUID] = Field(min_length=1)
    shot_type_ids: list[uuid.UUID] = Field(min_length=1)
    variations: int = Field(default=1, ge=1, le=10)
    prompt_template_id: uuid.UUID | None = None
    product_image_ids: list[uuid.UUID] = Field(default_factory=list)


class JobListItem(BaseModel):
    id: uuid.UUID
    status: str
    total_images: int
    completed_images: int
    created_at: datetime


class JobImageDetail(BaseModel):
    id: uuid.UUID
    status: str
    file_path: str | None
    regeneration_source_id: uuid.UUID | None
    product_id: uuid.UUID
    colour_id: uuid.UUID
    country_id: uuid.UUID
    shot_type_id: uuid.UUID
    variation_number: int
    created_at: datetime
    product_name: str
    ral_code: str
    country_code: str
    country_name: str
    shot_type_name: str


class JobResponse(BaseModel):
    id: uuid.UUID
    status: str
    total_images: int
    completed_images: int
    created_at: datetime
    images: list[JobImageDetail] = Field(default_factory=list)


class JobsListResponse(PaginatedResponse[JobListItem]):
    pass
```

- [ ] **Step 5: Update existing backend tests to use the new response types**

Update `backend/tests/test_router_jobs.py` imports and fixtures:

```python
from datetime import datetime, timezone

from app.modules.jobs.schemas import JobImageDetail, JobListItem, JobResponse, JobsListResponse
```

And update `test_get_job_returns_200` to construct:

```python
mock_response = JobResponse(
    id=job_id,
    status=JobStatus.GENERATING,
    total_images=4,
    completed_images=2,
    created_at=datetime.now(timezone.utc),
    images=[
        JobImageDetail(
            id=uuid.uuid4(),
            status=ImageStatus.COMPLETE,
            file_path="/output/job/image.png",
            regeneration_source_id=None,
            product_id=uuid.uuid4(),
            colour_id=uuid.uuid4(),
            country_id=uuid.uuid4(),
            shot_type_id=uuid.uuid4(),
            variation_number=1,
            created_at=datetime.now(timezone.utc),
            product_name="Chelsea",
            ral_code="RAL7032",
            country_code="UK",
            country_name="United Kingdom",
            shot_type_name="PDP",
        )
    ],
)
```

- [ ] **Step 6: Run the backend tests to verify the schema changes are green**

Run:

```bash
cd /home/matespinetti/projects/boxshot/backend && uv run pytest tests/test_router_jobs.py tests/test_service_jobs_create.py -q
```

Expected:

- Router tests still fail only on missing `GET /jobs`
- Rich detail mapping test now points at service/repository gaps rather than schema shape

- [ ] **Step 7: Commit**

```bash
cd /home/matespinetti/projects/boxshot/backend
git add app/modules/jobs/schemas.py tests/test_router_jobs.py tests/test_service_jobs_create.py
git commit -m "feat: define jobs list and rich job detail schemas"
```

---

### Task 2: Backend Repository + Service + Router for `GET /jobs` and Expanded `GET /jobs/{id}`

**Files:**
- Modify: `backend/app/modules/jobs/repository.py`
- Modify: `backend/app/modules/jobs/service.py`
- Modify: `backend/app/modules/jobs/router.py`
- Create: `backend/tests/test_jobs_repository.py`
- Modify: `backend/tests/test_router_jobs.py`
- Modify: `backend/tests/test_service_jobs_create.py`

- [ ] **Step 1: Write the failing repository tests**

Create `backend/tests/test_jobs_repository.py`:

```python
import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.modules.jobs import repository
from app.shared.enums import JobStatus


@pytest.mark.asyncio
async def test_list_paginated_builds_offset_from_page_and_per_page() -> None:
    session = AsyncMock()
    session.execute = AsyncMock()

    await repository.list_paginated(session, page=3, per_page=10, status=None)

    assert session.execute.await_count == 2


@pytest.mark.asyncio
async def test_list_paginated_accepts_status_filter() -> None:
    session = AsyncMock()
    session.execute = AsyncMock()

    await repository.list_paginated(
        session,
        page=1,
        per_page=20,
        status=JobStatus.GENERATING,
    )

    assert session.execute.await_count == 2
```

- [ ] **Step 2: Extend router/service tests for `GET /jobs` query handling**

Append to `backend/tests/test_router_jobs.py`:

```python
async def test_list_jobs_passes_status_and_pagination() -> None:
    captured = {}

    async def fake_list_jobs(session, page, per_page, status):
        captured["page"] = page
        captured["per_page"] = per_page
        captured["status"] = status
        return {"items": [], "total": 0, "page": 2, "per_page": 5, "pages": 0}

    with patch("app.modules.jobs.router.service.list_jobs", new=fake_list_jobs):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(f"{JOBS_URL}?page=2&per_page=5&status=generating")

    assert response.status_code == 200
    assert captured == {"page": 2, "per_page": 5, "status": "generating"}
```

Append to `backend/tests/test_service_jobs_create.py`:

```python
async def test_list_jobs_returns_paginated_response() -> None:
    session = AsyncMock()
    rows = [
        SimpleNamespace(
            id=uuid.uuid4(),
            status=JobStatus.GENERATING,
            total_images=12,
            completed_images=4,
            created_at=datetime.fromisoformat("2026-04-19T12:00:00+00:00"),
        )
    ]

    with patch("app.modules.jobs.service.jobs_repo") as mock_jobs_repo:
        mock_jobs_repo.list_paginated = AsyncMock(return_value=(rows, 1))

        result = await service.list_jobs(session, page=1, per_page=20, status=None)

    assert result.total == 1
    assert result.items[0].completed_images == 4
```

- [ ] **Step 3: Run the backend tests to verify they fail**

Run:

```bash
cd /home/matespinetti/projects/boxshot/backend && uv run pytest tests/test_jobs_repository.py tests/test_router_jobs.py tests/test_service_jobs_create.py -q
```

Expected:

- FAIL because `repository.list_paginated()` and `service.list_jobs()` do not exist
- FAIL because router has no `GET /jobs` endpoint

- [ ] **Step 4: Implement repository list query and richer detail loading**

Update `backend/app/modules/jobs/repository.py`:

```python
import uuid

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.modules.jobs.models import Job
from app.shared.enums import JobStatus


async def list_paginated(
    session: AsyncSession,
    page: int,
    per_page: int,
    status: JobStatus | None,
) -> tuple[list[Job], int]:
    offset = (page - 1) * per_page

    stmt = select(Job)
    count_stmt = select(func.count()).select_from(Job)

    if status is not None:
      stmt = stmt.where(Job.status == status)
      count_stmt = count_stmt.where(Job.status == status)

    stmt = stmt.order_by(Job.created_at.desc()).offset(offset).limit(per_page)

    rows = (await session.execute(stmt)).scalars().all()
    total = int((await session.execute(count_stmt)).scalar_one())
    return rows, total


async def get_by_id(session: AsyncSession, job_id: uuid.UUID) -> Job | None:
    stmt = (
        select(Job)
        .where(Job.id == job_id)
        .options(
            joinedload(Job.images).joinedload("product"),
            joinedload(Job.images).joinedload("colour"),
            joinedload(Job.images).joinedload("country"),
            joinedload(Job.images).joinedload("shot_type"),
        )
    )
    result = await session.execute(stmt)
    return result.unique().scalar_one_or_none()
```

- [ ] **Step 5: Implement `service.list_jobs()` and expand `service.get_job()`**

Update `backend/app/modules/jobs/service.py`:

```python
import math
from app.modules.jobs.schemas import JobImageDetail, JobListItem, JobResponse, JobsListResponse
from app.shared.enums import JobStatus


async def list_jobs(
    session: AsyncSession,
    page: int,
    per_page: int,
    status: str | None,
) -> JobsListResponse:
    status_enum = JobStatus(status) if status is not None else None
    rows, total = await jobs_repo.list_paginated(session, page=page, per_page=per_page, status=status_enum)
    pages = math.ceil(total / per_page) if total > 0 else 0

    return JobsListResponse(
        items=[
            JobListItem(
                id=row.id,
                status=row.status,
                total_images=row.total_images,
                completed_images=row.completed_images,
                created_at=row.created_at,
            )
            for row in rows
        ],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
    )
```

And update the image mapping inside `get_job()`:

```python
    return JobResponse(
        id=job.id,
        status=job.status,
        total_images=job.total_images,
        completed_images=job.completed_images,
        created_at=job.created_at,
        images=[
            JobImageDetail(
                id=image.id,
                status=image.status,
                file_path=image.file_path,
                regeneration_source_id=image.regeneration_source_id,
                product_id=image.product_id,
                colour_id=image.colour_id,
                country_id=image.country_id,
                shot_type_id=image.shot_type_id,
                variation_number=image.variation_number,
                created_at=image.created_at,
                product_name=image.product.name,
                ral_code=image.colour.ral_code,
                country_code=image.country.code,
                country_name=image.country.name,
                shot_type_name=image.shot_type.name,
            )
            for image in job.images
        ],
    )
```

- [ ] **Step 6: Add router `GET /jobs`**

Update `backend/app/modules/jobs/router.py`:

```python
@router.get("/jobs", response_model=JobsListResponse)
async def list_jobs(
    session: Annotated[AsyncSession, Depends(get_db)],
    page: int = 1,
    per_page: int = 20,
    status: str | None = None,
) -> JobsListResponse:
    return await service.list_jobs(session, page=page, per_page=per_page, status=status)
```

Also update imports:

```python
from app.modules.jobs.schemas import JobCreate, JobResponse, JobsListResponse, PreviewRequest, PreviewResponse
```

- [ ] **Step 7: Run the backend tests to verify they pass**

Run:

```bash
cd /home/matespinetti/projects/boxshot/backend && uv run pytest tests/test_jobs_repository.py tests/test_router_jobs.py tests/test_service_jobs_create.py -q
```

Expected:

- PASS

- [ ] **Step 8: Commit**

```bash
cd /home/matespinetti/projects/boxshot/backend
git add app/modules/jobs/repository.py app/modules/jobs/service.py app/modules/jobs/router.py tests/test_jobs_repository.py tests/test_router_jobs.py tests/test_service_jobs_create.py
git commit -m "feat: add jobs list endpoint and rich job detail payload"
```

---

### Task 3: Frontend Jobs Schemas and API Client Functions

**Files:**
- Modify: `src/schemas/jobs.ts`
- Modify: `src/features/jobs/queryKeys.ts`
- Create: `src/features/jobs/api/getJobs.ts`
- Create: `src/features/jobs/api/updateImageStatus.ts`
- Create: `src/features/jobs/api/__tests__/getJobs.test.ts`
- Create: `src/features/jobs/api/__tests__/updateImageStatus.test.ts`
- Modify: `src/features/jobs/api/__tests__/getJob.test.ts`

- [ ] **Step 1: Write the failing API tests**

Create `src/features/jobs/api/__tests__/getJobs.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

vi.mock("@/lib/api/client", () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from "@/lib/api/client"
import { getJobs } from "../getJobs"

describe("getJobs", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      per_page: 20,
      pages: 0,
    })
  })

  it("calls /jobs with page and per_page", async () => {
    await getJobs({ page: 2, perPage: 10 })
    expect(apiClient.get).toHaveBeenCalledWith("/jobs?page=2&per_page=10")
  })

  it("appends status when provided", async () => {
    await getJobs({ page: 1, perPage: 20, status: "generating" })
    expect(apiClient.get).toHaveBeenCalledWith("/jobs?page=1&per_page=20&status=generating")
  })
})
```

Create `src/features/jobs/api/__tests__/updateImageStatus.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

vi.mock("@/lib/api/client", () => ({
  apiClient: { patch: vi.fn() },
}))

import { apiClient } from "@/lib/api/client"
import { updateImageStatus } from "../updateImageStatus"

it("patches /images/{id}/status with the provided status", async () => {
  vi.mocked(apiClient.patch).mockResolvedValue({})
  await updateImageStatus("11111111-1111-4111-8111-111111111111", "approved")
  expect(apiClient.patch).toHaveBeenCalledWith(
    "/images/11111111-1111-4111-8111-111111111111/status",
    { status: "approved" },
  )
})
```

- [ ] **Step 2: Extend the existing `getJob` test with rich detail fields**

Update `src/features/jobs/api/__tests__/getJob.test.ts` fixture to include:

```ts
  created_at: "2026-04-19T12:00:00Z",
  images: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      status: "complete",
      file_path: "/chelsea/RAL7032/UK/PDP/img.png",
      regeneration_source_id: null,
      product_id: "44444444-4444-4444-8444-444444444444",
      colour_id: "55555555-5555-4555-8555-555555555555",
      country_id: "66666666-6666-4666-8666-666666666666",
      shot_type_id: "77777777-7777-4777-8777-777777777777",
      variation_number: 1,
      created_at: "2026-04-19T12:00:10Z",
      product_name: "Chelsea",
      ral_code: "RAL7032",
      country_code: "UK",
      country_name: "United Kingdom",
      shot_type_name: "PDP",
    },
  ],
```

And assert:

```ts
expect(result.images[0].product_name).toBe("Chelsea")
expect(result.images[0].country_code).toBe("UK")
```

- [ ] **Step 3: Run the frontend API tests to verify they fail**

Run:

```bash
cd /home/matespinetti/projects/boxshot/frontend && pnpm test --run src/features/jobs/api/__tests__/getJob.test.ts src/features/jobs/api/__tests__/getJobs.test.ts src/features/jobs/api/__tests__/updateImageStatus.test.ts
```

Expected:

- FAIL because `getJobs.ts` and `updateImageStatus.ts` do not exist
- FAIL because current schemas reject the richer `getJob` payload

- [ ] **Step 4: Expand frontend job schemas and query keys**

Update `src/schemas/jobs.ts`:

```ts
export const JobImageSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "pending",
    "generating",
    "complete",
    "failed",
    "approved",
    "rejected",
  ]),
  file_path: z.string().nullable(),
  regeneration_source_id: z.string().uuid().nullable(),
  product_id: z.string().uuid(),
  colour_id: z.string().uuid(),
  country_id: z.string().uuid(),
  shot_type_id: z.string().uuid(),
  variation_number: z.number(),
  created_at: z.string(),
  product_name: z.string(),
  ral_code: z.string(),
  country_code: z.string(),
  country_name: z.string(),
  shot_type_name: z.string(),
})

export const JobSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["idle", "generating", "complete", "failed"]),
  total_images: z.number(),
  completed_images: z.number(),
  created_at: z.string(),
  images: z.array(JobImageSchema),
})

export const JobListItemSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["idle", "generating", "complete", "failed"]),
  total_images: z.number(),
  completed_images: z.number(),
  created_at: z.string(),
})

export const JobsListResponseSchema = z.object({
  items: z.array(JobListItemSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  pages: z.number(),
})
```

Update `src/features/jobs/queryKeys.ts`:

```ts
export const jobsQueryKeys = {
  list: (params: { page: number; perPage: number; status?: string }) =>
    ["jobs", "list", params] as const,
  detail: (id: string) => ["jobs", id] as const,
}
```

- [ ] **Step 5: Implement the missing API functions**

Create `src/features/jobs/api/getJobs.ts`:

```ts
import { apiClient } from "@/lib/api/client"
import { JobsListResponseSchema } from "@/schemas/jobs"

interface GetJobsParams {
  page: number
  perPage: number
  status?: string
}

export async function getJobs({
  page,
  perPage,
  status,
}: GetJobsParams) {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  })

  if (status) query.set("status", status)

  const data = await apiClient.get<unknown>(`/jobs?${query.toString()}`)
  return JobsListResponseSchema.parse(data)
}
```

Create `src/features/jobs/api/updateImageStatus.ts`:

```ts
import { apiClient } from "@/lib/api/client"

export async function updateImageStatus(
  imageId: string,
  status: "approved" | "rejected",
): Promise<void> {
  await apiClient.patch(`/images/${imageId}/status`, { status })
}
```

- [ ] **Step 6: Run the frontend API tests to verify they pass**

Run:

```bash
cd /home/matespinetti/projects/boxshot/frontend && pnpm test --run src/features/jobs/api/__tests__/getJob.test.ts src/features/jobs/api/__tests__/getJobs.test.ts src/features/jobs/api/__tests__/updateImageStatus.test.ts
```

Expected:

- PASS

- [ ] **Step 7: Commit**

```bash
cd /home/matespinetti/projects/boxshot/frontend
git add src/schemas/jobs.ts src/features/jobs/queryKeys.ts src/features/jobs/api/getJobs.ts src/features/jobs/api/updateImageStatus.ts src/features/jobs/api/__tests__/getJob.test.ts src/features/jobs/api/__tests__/getJobs.test.ts src/features/jobs/api/__tests__/updateImageStatus.test.ts
git commit -m "feat: add jobs list and rich job frontend APIs"
```

---

### Task 4: Sidebar + `/jobs` History Page

**Files:**
- Modify: `src/components/layout/AppSidebar.tsx`
- Modify: `src/components/layout/__tests__/AppSidebar.test.tsx`
- Create: `src/app/(dashboard)/jobs/page.tsx`
- Create: `src/features/jobs/components/JobsTable.tsx`
- Create: `src/features/jobs/components/__tests__/JobsTable.test.tsx`

- [ ] **Step 1: Write the failing sidebar and history-page tests**

Update `src/components/layout/__tests__/AppSidebar.test.tsx` with:

```ts
it("renders a Jobs navigation link", () => {
  renderSidebar()

  expect(screen.getByRole("link", { name: "Jobs" })).toHaveAttribute(
    "href",
    "/jobs",
  )
})
```

Create `src/features/jobs/components/__tests__/JobsTable.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { JobsTable } from "../JobsTable"

describe("JobsTable", () => {
  it("renders job rows and progress", () => {
    render(
      <JobsTable
        jobs={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            status: "generating",
            total_images: 12,
            completed_images: 4,
            created_at: "2026-04-19T12:00:00Z",
          },
        ]}
      />,
    )

    expect(screen.getByText("11111111-1111-4111-8111-111111111111")).toBeInTheDocument()
    expect(screen.getByText("4 / 12")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
cd /home/matespinetti/projects/boxshot/frontend && pnpm test --run src/components/layout/__tests__/AppSidebar.test.tsx src/features/jobs/components/__tests__/JobsTable.test.tsx
```

Expected:

- FAIL because no `Jobs` nav item exists
- FAIL because `JobsTable.tsx` does not exist

- [ ] **Step 3: Add the sidebar entry and build the jobs history UI**

Update `src/components/layout/AppSidebar.tsx` nav definitions:

```ts
import { History, Sparkles, ... } from "lucide-react"

const primaryLinks: NavLink[] = [
  { label: "Generate", href: ROUTES.generate, icon: Sparkles },
  { label: "Jobs", href: "/jobs", icon: History },
]
```

Render them as a list instead of hard-coding only `Generate`.

Create `src/features/jobs/components/JobsTable.tsx`:

```tsx
import Link from "next/link"

import { EmptyState } from "@/components/shared"

interface JobsTableProps {
  jobs: Array<{
    id: string
    status: string
    total_images: number
    completed_images: number
    created_at: string
  }>
}

export function JobsTable({ jobs }: JobsTableProps) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No jobs yet"
        description="Generated jobs will appear here once you start creating them."
      />
    )
  }

  return (
    <div className="rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-4">Job</th>
            <th className="p-4">Status</th>
            <th className="p-4">Progress</th>
            <th className="p-4">Created</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b last:border-0">
              <td className="p-4">
                <Link className="font-medium underline-offset-4 hover:underline" href={`/jobs/${job.id}`}>
                  {job.id}
                </Link>
              </td>
              <td className="p-4 capitalize">{job.status}</td>
              <td className="p-4">{job.completed_images} / {job.total_images}</td>
              <td className="p-4">{new Date(job.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

Create `src/app/(dashboard)/jobs/page.tsx`:

```tsx
import { PageHeader } from "@/components/shared"
import { JobsTable } from "@/features/jobs/components/JobsTable"
import { getJobs } from "@/features/jobs/api/getJobs"

export default async function JobsPage() {
  const jobs = await getJobs({ page: 1, perPage: 20 })

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Jobs" description="Browse and revisit generated jobs." />
      <JobsTable jobs={jobs.items} />
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
cd /home/matespinetti/projects/boxshot/frontend && pnpm test --run src/components/layout/__tests__/AppSidebar.test.tsx src/features/jobs/components/__tests__/JobsTable.test.tsx
```

Expected:

- PASS

- [ ] **Step 5: Commit**

```bash
cd /home/matespinetti/projects/boxshot/frontend
git add src/components/layout/AppSidebar.tsx src/components/layout/__tests__/AppSidebar.test.tsx src/app/(dashboard)/jobs/page.tsx src/features/jobs/components/JobsTable.tsx src/features/jobs/components/__tests__/JobsTable.test.tsx
git commit -m "feat: add jobs history page and sidebar navigation"
```

---

### Task 5: Detail Route States, Filters, and Status Bar

**Files:**
- Modify: `src/app/(dashboard)/jobs/[id]/page.tsx`
- Create: `src/app/(dashboard)/jobs/[id]/loading.tsx`
- Create: `src/app/(dashboard)/jobs/[id]/error.tsx`
- Create: `src/features/jobs/components/GridFilters.tsx`
- Create: `src/features/jobs/components/JobStatusBar.tsx`
- Create: `src/features/jobs/components/DownloadButton.tsx`
- Create: `src/features/jobs/components/JobResultsView.tsx`
- Create: `src/features/jobs/components/__tests__/GridFilters.test.tsx`
- Create: `src/features/jobs/components/__tests__/JobStatusBar.test.tsx`
- Create: `src/features/jobs/components/__tests__/JobResultsView.test.tsx`

- [ ] **Step 1: Write the failing component tests**

Create `src/features/jobs/components/__tests__/JobStatusBar.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { JobStatusBar } from "../JobStatusBar"

it("renders status and progress", () => {
  render(
    <JobStatusBar
      status="generating"
      completedImages={4}
      totalImages={12}
      createdAt="2026-04-19T12:00:00Z"
    />,
  )

  expect(screen.getByText("generating")).toBeInTheDocument()
  expect(screen.getByText("4 / 12 complete")).toBeInTheDocument()
})
```

Create `src/features/jobs/components/__tests__/GridFilters.test.tsx`:

```tsx
import { renderHook, act } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { NuqsTestingAdapter } from "nuqs/adapters/testing"
import type { ReactNode } from "react"

import { useImageFilters } from "@/features/jobs/hooks/useImageFilters"

function wrapper({ children }: { children: ReactNode }) {
  return <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
}

it("stores status in the URL state", async () => {
  const { result } = renderHook(() => useImageFilters(), { wrapper })

  await act(async () => {
    await result.current.setFilters({ status: "approved" })
  })

  expect(result.current.filters.status).toBe("approved")
})
```

Create `src/features/jobs/components/__tests__/JobResultsView.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { JobResultsView } from "../JobResultsView"

it("renders a waiting state when there are no images yet", () => {
  render(
    <JobResultsView
      job={{
        id: "11111111-1111-4111-8111-111111111111",
        status: "generating",
        total_images: 12,
        completed_images: 0,
        created_at: "2026-04-19T12:00:00Z",
        images: [],
      }}
    />,
  )

  expect(screen.getByText("Generation in progress")).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
cd /home/matespinetti/projects/boxshot/frontend && pnpm test --run src/features/jobs/components/__tests__/JobStatusBar.test.tsx src/features/jobs/components/__tests__/GridFilters.test.tsx src/features/jobs/components/__tests__/JobResultsView.test.tsx
```

Expected:

- FAIL because these components do not exist

- [ ] **Step 3: Implement route-level states and detail page shell**

Create `src/app/(dashboard)/jobs/[id]/loading.tsx`:

```tsx
export default function LoadingJobPage() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
```

Create `src/app/(dashboard)/jobs/[id]/error.tsx`:

```tsx
"use client"

import { EmptyState } from "@/components/shared"

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      title="Failed to load job"
      description="The job review workspace could not be loaded."
      action={{ label: "Retry", onClick: reset }}
    />
  )
}
```

Create `src/features/jobs/components/JobStatusBar.tsx`, `DownloadButton.tsx`, and `JobResultsView.tsx` with the props used in the tests and wire `page.tsx` to render `PageHeader` + `JobResultsView`.

- [ ] **Step 4: Implement the components**

Use:

```tsx
// src/features/jobs/components/JobStatusBar.tsx
export function JobStatusBar({
  status,
  completedImages,
  totalImages,
  createdAt,
}: {
  status: string
  completedImages: number
  totalImages: number
  createdAt: string
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
          {status}
        </span>
        <span className="text-sm text-muted-foreground">
          {new Date(createdAt).toLocaleString()}
        </span>
      </div>
      <p className="mt-3 text-sm font-medium">
        {completedImages} / {totalImages} complete
      </p>
    </div>
  )
}
```

```tsx
// src/features/jobs/components/DownloadButton.tsx
"use client"

import { Button } from "@/components/ui/button"
import { downloadApproved } from "@/features/jobs/api/downloadApproved"

export function DownloadButton({ jobId }: { jobId: string }) {
  return (
    <Button variant="outline" onClick={() => downloadApproved(jobId)}>
      Download approved ZIP
    </Button>
  )
}
```

```tsx
// src/features/jobs/components/JobResultsView.tsx
import { EmptyState } from "@/components/shared"
import { GridFilters } from "./GridFilters"
import { JobStatusBar } from "./JobStatusBar"
import { DownloadButton } from "./DownloadButton"

export function JobResultsView({ job }: { job: Job }) {
  if (job.images.length === 0) {
    return (
      <div className="space-y-6">
        <JobStatusBar
          status={job.status}
          completedImages={job.completed_images}
          totalImages={job.total_images}
          createdAt={job.created_at}
        />
        <EmptyState
          title="Generation in progress"
          description="Images will appear here as they are generated."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <JobStatusBar
          status={job.status}
          completedImages={job.completed_images}
          totalImages={job.total_images}
          createdAt={job.created_at}
        />
        <DownloadButton jobId={job.id} />
      </div>
      <GridFilters />
    </div>
  )
}
```

- [ ] **Step 5: Run the component tests to verify they pass**

Run:

```bash
cd /home/matespinetti/projects/boxshot/frontend && pnpm test --run src/features/jobs/components/__tests__/JobStatusBar.test.tsx src/features/jobs/components/__tests__/GridFilters.test.tsx src/features/jobs/components/__tests__/JobResultsView.test.tsx
```

Expected:

- PASS

- [ ] **Step 6: Commit**

```bash
cd /home/matespinetti/projects/boxshot/frontend
git add src/app/(dashboard)/jobs/[id]/page.tsx src/app/(dashboard)/jobs/[id]/loading.tsx src/app/(dashboard)/jobs/[id]/error.tsx src/features/jobs/components/JobStatusBar.tsx src/features/jobs/components/GridFilters.tsx src/features/jobs/components/DownloadButton.tsx src/features/jobs/components/JobResultsView.tsx src/features/jobs/components/__tests__/JobStatusBar.test.tsx src/features/jobs/components/__tests__/GridFilters.test.tsx src/features/jobs/components/__tests__/JobResultsView.test.tsx
git commit -m "feat: add jobs detail route states and status UI"
```

---

### Task 6: Selection Store, Bulk Actions, and Image Grid

**Files:**
- Create: `src/features/jobs/stores/useImageSelectionStore.ts`
- Create: `src/features/jobs/stores/__tests__/useImageSelectionStore.test.ts`
- Create: `src/features/jobs/components/ImageGrid.tsx`
- Create: `src/features/jobs/components/BulkActions.tsx`
- Create: `src/features/jobs/components/__tests__/ImageGrid.test.tsx`
- Create: `src/features/jobs/components/__tests__/BulkActions.test.tsx`
- Modify: `src/features/jobs/components/JobResultsView.tsx`

- [ ] **Step 1: Write the failing store and component tests**

Create `src/features/jobs/stores/__tests__/useImageSelectionStore.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { useImageSelectionStore } from "../useImageSelectionStore"

it("selects and clears ids", () => {
  useImageSelectionStore.getState().reset()
  useImageSelectionStore.getState().toggle("a")
  expect(useImageSelectionStore.getState().selectedIds.has("a")).toBe(true)
  useImageSelectionStore.getState().clear()
  expect(useImageSelectionStore.getState().selectedIds.size).toBe(0)
})
```

Create `src/features/jobs/components/__tests__/ImageGrid.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ImageGrid } from "../ImageGrid"

it("renders image metadata cards", () => {
  render(
    <ImageGrid
      images={[
        {
          id: "22222222-2222-4222-8222-222222222222",
          status: "complete",
          file_path: "/img.png",
          regeneration_source_id: null,
          product_id: "44444444-4444-4444-8444-444444444444",
          colour_id: "55555555-5555-4555-8555-555555555555",
          country_id: "66666666-6666-4666-8666-666666666666",
          shot_type_id: "77777777-7777-4777-8777-777777777777",
          variation_number: 1,
          created_at: "2026-04-19T12:00:10Z",
          product_name: "Chelsea",
          ral_code: "RAL7032",
          country_code: "UK",
          country_name: "United Kingdom",
          shot_type_name: "PDP",
        },
      ]}
    />,
  )

  expect(screen.getByText("Chelsea")).toBeInTheDocument()
  expect(screen.getByText("RAL7032")).toBeInTheDocument()
  expect(screen.getByText("UK")).toBeInTheDocument()
})
```

Create `src/features/jobs/components/__tests__/BulkActions.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { BulkActions } from "../BulkActions"

it("calls bulk approve with visible ids", async () => {
  const onApprove = vi.fn().mockResolvedValue(undefined)

  render(
    <BulkActions
      visibleIds={["a", "b"]}
      selectedIds={new Set(["a"])}
      onApprove={onApprove}
      onReject={vi.fn()}
      onSelectAllVisible={vi.fn()}
      onClear={vi.fn()}
    />,
  )

  fireEvent.click(screen.getByRole("button", { name: "Approve selected" }))

  expect(onApprove).toHaveBeenCalledWith(["a"])
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
cd /home/matespinetti/projects/boxshot/frontend && pnpm test --run src/features/jobs/stores/__tests__/useImageSelectionStore.test.ts src/features/jobs/components/__tests__/ImageGrid.test.tsx src/features/jobs/components/__tests__/BulkActions.test.tsx
```

Expected:

- FAIL because these files do not exist

- [ ] **Step 3: Implement the Zustand store**

Create `src/features/jobs/stores/useImageSelectionStore.ts`:

```ts
import { create } from "zustand"

interface ImageSelectionState {
  selectedIds: Set<string>
  toggle: (id: string) => void
  selectMany: (ids: string[]) => void
  clear: () => void
  reset: () => void
}

export const useImageSelectionStore = create<ImageSelectionState>((set) => ({
  selectedIds: new Set(),
  toggle: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selectedIds: next }
    }),
  selectMany: (ids) => set(() => ({ selectedIds: new Set(ids) })),
  clear: () => set(() => ({ selectedIds: new Set() })),
  reset: () => set(() => ({ selectedIds: new Set() })),
}))
```

- [ ] **Step 4: Implement `ImageGrid` and `BulkActions`**

Create `src/features/jobs/components/ImageGrid.tsx`:

```tsx
"use client"

import { useImageSelectionStore } from "@/features/jobs/stores/useImageSelectionStore"

export function ImageGrid({ images }: { images: Job["images"] }) {
  const selectedIds = useImageSelectionStore((state) => state.selectedIds)
  const toggle = useImageSelectionStore((state) => state.toggle)

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {images.map((image) => (
        <button
          key={image.id}
          type="button"
          onClick={() => toggle(image.id)}
          className="rounded-xl border p-4 text-left"
          data-selected={selectedIds.has(image.id)}
        >
          <div className="mb-3 aspect-square rounded-lg bg-muted" />
          <div className="space-y-1">
            <p className="font-medium">{image.product_name}</p>
            <p className="text-sm text-muted-foreground">{image.ral_code}</p>
            <p className="text-sm text-muted-foreground">{image.country_code}</p>
            <p className="text-sm text-muted-foreground">{image.shot_type_name}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
```

Create `src/features/jobs/components/BulkActions.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"

interface BulkActionsProps {
  visibleIds: string[]
  selectedIds: Set<string>
  onApprove: (ids: string[]) => Promise<void>
  onReject: (ids: string[]) => Promise<void>
  onSelectAllVisible: () => void
  onClear: () => void
}

export function BulkActions({
  visibleIds,
  selectedIds,
  onApprove,
  onReject,
  onSelectAllVisible,
  onClear,
}: BulkActionsProps) {
  if (visibleIds.length === 0) return null

  const ids = visibleIds.filter((id) => selectedIds.has(id))

  return (
    <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-3">
      <Button variant="outline" onClick={onSelectAllVisible}>Select all visible</Button>
      <Button variant="outline" onClick={onClear}>Clear</Button>
      <Button onClick={() => void onApprove(ids)} disabled={ids.length === 0}>Approve selected</Button>
      <Button variant="destructive" onClick={() => void onReject(ids)} disabled={ids.length === 0}>
        Reject selected
      </Button>
    </div>
  )
}
```

- [ ] **Step 5: Wire the store and grid into `JobResultsView`**

Update `src/features/jobs/components/JobResultsView.tsx` so that after filters are applied it renders:

```tsx
const filteredImages = filterImages(job.images)
const visibleIds = filteredImages.map((image) => image.id)
const selectedIds = useImageSelectionStore((state) => state.selectedIds)
const selectMany = useImageSelectionStore((state) => state.selectMany)
const clear = useImageSelectionStore((state) => state.clear)

async function handleApprove(ids: string[]) {
  await Promise.all(ids.map((id) => updateImageStatus(id, "approved")))
  clear()
}

async function handleReject(ids: string[]) {
  await Promise.all(ids.map((id) => updateImageStatus(id, "rejected")))
  clear()
}
```

And render:

```tsx
<BulkActions
  visibleIds={visibleIds}
  selectedIds={selectedIds}
  onApprove={handleApprove}
  onReject={handleReject}
  onSelectAllVisible={() => selectMany(visibleIds)}
  onClear={clear}
/>
<ImageGrid images={filteredImages} />
```

- [ ] **Step 6: Run the tests to verify they pass**

Run:

```bash
cd /home/matespinetti/projects/boxshot/frontend && pnpm test --run src/features/jobs/stores/__tests__/useImageSelectionStore.test.ts src/features/jobs/components/__tests__/ImageGrid.test.tsx src/features/jobs/components/__tests__/BulkActions.test.tsx
```

Expected:

- PASS

- [ ] **Step 7: Commit**

```bash
cd /home/matespinetti/projects/boxshot/frontend
git add src/features/jobs/stores/useImageSelectionStore.ts src/features/jobs/stores/__tests__/useImageSelectionStore.test.ts src/features/jobs/components/ImageGrid.tsx src/features/jobs/components/BulkActions.tsx src/features/jobs/components/__tests__/ImageGrid.test.tsx src/features/jobs/components/__tests__/BulkActions.test.tsx src/features/jobs/components/JobResultsView.tsx
git commit -m "feat: add jobs grid selection and bulk actions"
```

---

### Task 7: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run backend jobs tests**

```bash
cd /home/matespinetti/projects/boxshot/backend && uv run pytest tests/test_jobs_repository.py tests/test_router_jobs.py tests/test_service_jobs_create.py -q
```

Expected:

- PASS

- [ ] **Step 2: Run frontend jobs-focused tests**

```bash
cd /home/matespinetti/projects/boxshot/frontend && pnpm test --run src/components/layout/__tests__/AppSidebar.test.tsx src/features/jobs/api/__tests__/getJob.test.ts src/features/jobs/api/__tests__/getJobs.test.ts src/features/jobs/api/__tests__/updateImageStatus.test.ts src/features/jobs/components/__tests__/JobsTable.test.tsx src/features/jobs/components/__tests__/GridFilters.test.tsx src/features/jobs/components/__tests__/JobStatusBar.test.tsx src/features/jobs/components/__tests__/ImageGrid.test.tsx src/features/jobs/components/__tests__/BulkActions.test.tsx src/features/jobs/components/__tests__/JobResultsView.test.tsx src/features/jobs/stores/__tests__/useImageSelectionStore.test.ts
```

Expected:

- PASS

- [ ] **Step 3: Run frontend type-check**

```bash
cd /home/matespinetti/projects/boxshot/frontend && pnpm type-check
```

Expected:

- PASS

- [ ] **Step 4: Run the full frontend test suite**

```bash
cd /home/matespinetti/projects/boxshot/frontend && pnpm test --run
```

Expected:

- PASS

- [ ] **Step 5: Commit any verification fixes if needed**

```bash
cd /home/matespinetti/projects/boxshot
git add -p
git commit -m "fix: resolve section 7 verification issues"
```

---

## Self-Review

- **Spec coverage:** The plan covers backend `GET /jobs`, expanded `GET /jobs/{id}` payloads, frontend jobs history page, sidebar entry, detail route states, filters, bulk actions, and ZIP download.
- **Placeholder scan:** No `TBD`, `TODO`, or cross-task “similar to” shortcuts remain. Every code-writing step includes explicit code.
- **Type consistency:** The plan consistently uses `created_at`, `per_page`, `JobImageDetail`, and the richer frontend `JobImage` shape across backend and frontend tasks.
