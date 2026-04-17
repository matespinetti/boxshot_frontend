import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

import { MultiSelectCombobox } from "../MultiSelectCombobox"

const options = [
  { value: "uk", label: "UK — United Kingdom" },
  { value: "de", label: "DE — Germany" },
  { value: "fr", label: "FR — France" },
]

describe("MultiSelectCombobox", () => {
  it("shows placeholder when no items are selected", () => {
    render(
      <MultiSelectCombobox
        options={options}
        value={[]}
        onChange={vi.fn()}
        placeholder="Select countries..."
      />,
    )
    expect(screen.getByRole("combobox")).toHaveTextContent(
      "Select countries...",
    )
  })

  it("shows count badge when items are selected", () => {
    render(
      <MultiSelectCombobox
        options={options}
        value={["uk", "de"]}
        onChange={vi.fn()}
        placeholder="Select countries..."
      />,
    )
    expect(screen.getByRole("combobox")).toHaveTextContent("2 selected")
  })

  it("opens the popover when trigger is clicked", async () => {
    render(
      <MultiSelectCombobox
        options={options}
        value={[]}
        onChange={vi.fn()}
        placeholder="Select countries..."
      />,
    )
    await userEvent.click(screen.getByRole("combobox"))
    expect(screen.getByText("UK — United Kingdom")).toBeInTheDocument()
    expect(screen.getByText("DE — Germany")).toBeInTheDocument()
  })

  it("calls onChange with added item when an unselected option is clicked", async () => {
    const onChange = vi.fn()
    render(
      <MultiSelectCombobox
        options={options}
        value={["uk"]}
        onChange={onChange}
        placeholder="Select countries..."
      />,
    )
    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByText("DE — Germany"))
    expect(onChange).toHaveBeenCalledWith(["uk", "de"])
  })

  it("calls onChange with item removed when a selected option is clicked", async () => {
    const onChange = vi.fn()
    render(
      <MultiSelectCombobox
        options={options}
        value={["uk", "de"]}
        onChange={onChange}
        placeholder="Select countries..."
      />,
    )
    await userEvent.click(screen.getByRole("combobox"))
    // Click the command item (last occurrence — badge pill appears first)
    const items = screen.getAllByText("UK — United Kingdom")
    await userEvent.click(items[items.length - 1])
    expect(onChange).toHaveBeenCalledWith(["de"])
  })

  it("renders selected items as badge pills below the trigger", () => {
    render(
      <MultiSelectCombobox
        options={options}
        value={["uk", "de"]}
        onChange={vi.fn()}
        placeholder="Select countries..."
      />,
    )
    expect(screen.getByText("UK — United Kingdom")).toBeInTheDocument()
    expect(screen.getByText("DE — Germany")).toBeInTheDocument()
  })

  it("calls onChange with item removed when badge × button is clicked", async () => {
    const onChange = vi.fn()
    render(
      <MultiSelectCombobox
        options={options}
        value={["uk", "de"]}
        onChange={onChange}
        placeholder="Select countries..."
      />,
    )
    await userEvent.click(
      screen.getByRole("button", { name: /remove UK/i }),
    )
    expect(onChange).toHaveBeenCalledWith(["de"])
  })
})
