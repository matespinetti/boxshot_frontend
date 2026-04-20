import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { GenerationPanel } from "../GenerationPanel"

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({
    data: { items: [] },
    isLoading: false,
  })),
}))

vi.mock("@/features/generation/api/getProducts", () => ({
  getProducts: vi.fn(),
}))

vi.mock("@/features/generation/api/getColours", () => ({
  getColours: vi.fn(),
}))

vi.mock("@/features/generation/api/getCountries", () => ({
  getCountries: vi.fn(),
}))

vi.mock("@/features/generation/api/getShotTypes", () => ({
  getShotTypes: vi.fn(),
}))

vi.mock("@/features/generation/api/getInstallationTypes", () => ({
  getInstallationTypes: vi.fn(),
}))

vi.mock("@/features/generation/api/getSurfaceTypes", () => ({
  getSurfaceTypes: vi.fn(),
}))

vi.mock("@/features/generation/api/getModels", () => ({
  getModels: vi.fn(),
}))

vi.mock("@/components/ui/form", () => ({
  Form: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/features/generation/hooks/useGenerationForm", () => ({
  useGenerationForm: () => ({
    form: {
      watch: vi.fn(() => ""),
      control: {},
      getValues: vi.fn(() => ""),
      setValue: vi.fn(),
    },
    totalImages: 0,
    previewData: null,
    isPreviewing: false,
    isCreating: false,
    onSubmit: vi.fn(),
    handleConfirm: vi.fn(),
    handleCloseModal: vi.fn(),
  }),
}))

vi.mock("../ProductSelector", () => ({
  ProductSelector: () => <div>Product Selector</div>,
}))

vi.mock("../ColourSelector", () => ({
  ColourSelector: () => <div>Colour Selector</div>,
}))

vi.mock("../CountryMultiSelect", () => ({
  CountryMultiSelect: () => <div>Country Multi Select</div>,
}))

vi.mock("../ShotTypeMultiSelect", () => ({
  ShotTypeMultiSelect: () => <div>Shot Type Multi Select</div>,
}))

vi.mock("../VariationSelector", () => ({
  VariationSelector: () => <div>Variation Selector</div>,
}))

vi.mock("../ReferenceImageSelector", () => ({
  ReferenceImageSelector: () => <div>Reference Image Selector</div>,
}))

vi.mock("../PromptPreviewModal", () => ({
  PromptPreviewModal: () => <div>Prompt Preview Modal</div>,
}))

vi.mock("../InstallationTypeSelector", () => ({
  InstallationTypeSelector: () => <div>Installation Type</div>,
}))

vi.mock("../SurfaceTypeSelector", () => ({
  SurfaceTypeSelector: () => <div>Surface Type</div>,
}))

vi.mock("../ModelSelector", () => ({
  ModelSelector: () => <div>Model</div>,
}))

describe("GenerationPanel", () => {
  it("renders installation type, surface type, and model selectors", async () => {
    render(<GenerationPanel />)

    expect(screen.getByText("Installation Type")).toBeInTheDocument()
    expect(screen.getByText("Surface Type")).toBeInTheDocument()
    expect(screen.getByText("Model")).toBeInTheDocument()
  })
})
