import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"

import { AppSidebar } from "../AppSidebar"

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import { usePathname } from "next/navigation"

const mockUsePathname = vi.mocked(usePathname)

function renderSidebar() {
  return render(
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>,
  )
}

describe("AppSidebar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/generate")
  })

  it("renders the balanced brand block and one icon per destination", () => {
    const { container } = renderSidebar()

    expect(screen.getByText("ParcelFlow")).toBeInTheDocument()
    expect(screen.getByText("Image operations")).toBeInTheDocument()
    expect(container.querySelectorAll("svg.lucide").length).toBe(12)
  })

  it("renders all navigation links with correct hrefs", () => {
    renderSidebar()

    expect(screen.getByRole("link", { name: "Generate" })).toHaveAttribute(
      "href",
      "/generate",
    )
    expect(screen.getByRole("link", { name: "Jobs" })).toHaveAttribute(
      "href",
      "/jobs",
    )
    expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute(
      "href",
      "/admin/products",
    )
    expect(screen.getByRole("link", { name: "Colours / RAL" })).toHaveAttribute(
      "href",
      "/admin/colours",
    )
    expect(screen.getByRole("link", { name: "Countries" })).toHaveAttribute(
      "href",
      "/admin/countries",
    )
    expect(screen.getByRole("link", { name: "Shot Types" })).toHaveAttribute(
      "href",
      "/admin/shot-types",
    )
    expect(
      screen.getByRole("link", { name: "Installation Types" }),
    ).toHaveAttribute("href", "/admin/installation-types")
    expect(screen.getByRole("link", { name: "Surface Types" })).toHaveAttribute(
      "href",
      "/admin/surface-types",
    )
    expect(
      screen.getByRole("link", { name: "Prompt Templates" }),
    ).toHaveAttribute("href", "/admin/prompt-templates")
    expect(
      screen.getByRole("link", { name: "Prompt Overrides" }),
    ).toHaveAttribute("href", "/admin/overrides")
  })

  it("marks Generate as active on /generate", () => {
    mockUsePathname.mockReturnValue("/generate")

    renderSidebar()

    expect(screen.getByRole("link", { name: "Generate" })).toHaveAttribute(
      "data-active",
      "true",
    )
  })

  it("does not mark Generate as active on an admin page", () => {
    mockUsePathname.mockReturnValue("/admin/products")

    renderSidebar()

    expect(
      screen.getByRole("link", { name: "Generate" }),
    ).not.toHaveAttribute("data-active", "true")
  })

  it("marks Jobs as active on /jobs", () => {
    mockUsePathname.mockReturnValue("/jobs")

    renderSidebar()

    expect(screen.getByRole("link", { name: "Jobs" })).toHaveAttribute(
      "data-active",
      "true",
    )
  })

  it("marks Products as active on /admin/products", () => {
    mockUsePathname.mockReturnValue("/admin/products")

    renderSidebar()

    expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute(
      "data-active",
      "true",
    )
  })

  it("marks Shot Types as active on /admin/shot-types", () => {
    mockUsePathname.mockReturnValue("/admin/shot-types")

    renderSidebar()

    expect(screen.getByRole("link", { name: "Shot Types" })).toHaveAttribute(
      "data-active",
      "true",
    )
  })
})
