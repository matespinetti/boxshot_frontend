import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { ColumnDef } from "@/components/shared"

import { AdminTable } from "../AdminTable"

type Item = { id: string; name: string; disabled?: boolean }

const columns: ColumnDef<Item>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
]

const data: Item[] = [
  { id: "1", name: "Alpha", disabled: false },
  { id: "2", name: "Beta", disabled: true },
]

describe("AdminTable", () => {
  it("renders column headers", () => {
    render(
      <AdminTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
      />,
    )
    expect(screen.getByText("ID")).toBeInTheDocument()
    expect(screen.getByText("Name")).toBeInTheDocument()
  })

  it("renders row data", () => {
    render(
      <AdminTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
      />,
    )
    expect(screen.getByText("Alpha")).toBeInTheDocument()
    expect(screen.getByText("Beta")).toBeInTheDocument()
  })

  it("does not render Actions column when onToggleDisabled is not provided", () => {
    render(
      <AdminTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
      />,
    )
    expect(screen.queryByText("Actions")).not.toBeInTheDocument()
  })

  it("renders Actions column when onToggleDisabled is provided", () => {
    render(
      <AdminTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
        onToggleDisabled={vi.fn()}
      />,
    )
    expect(screen.getByText("Actions")).toBeInTheDocument()
  })

  it("renders Disable button for active rows and Enable for disabled rows", () => {
    render(
      <AdminTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
        onToggleDisabled={vi.fn()}
      />,
    )
    expect(screen.getByRole("button", { name: "Disable" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Enable" })).toBeInTheDocument()
  })

  it("opens confirm dialog when Disable is clicked", () => {
    render(
      <AdminTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
        onToggleDisabled={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Disable" }))
    expect(screen.getByText(/Disable this item/i)).toBeInTheDocument()
  })

  it("calls onToggleDisabled with the correct row on confirm", () => {
    const onToggleDisabled = vi.fn()
    render(
      <AdminTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
        onToggleDisabled={onToggleDisabled}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Disable" }))
    // Confirm button inside the dialog
    fireEvent.click(screen.getByRole("button", { name: "Disable" }))
    expect(onToggleDisabled).toHaveBeenCalledWith(data[0])
  })
})
