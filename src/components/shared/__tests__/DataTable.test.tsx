import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { ColumnDef } from "../DataTable"
import { DataTable } from "../DataTable"

type Row = { id: string; name: string }

const columns: ColumnDef<Row>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
]

const data: Row[] = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" },
]

describe("DataTable", () => {
  it("renders column headers", () => {
    render(
      <DataTable
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

  it("renders row data using default string rendering", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
  })

  it("uses render function when provided", () => {
    const columnsWithRender: ColumnDef<Row>[] = [
      {
        key: "name",
        header: "Name",
        render: (row) => <strong>{row.name.toUpperCase()}</strong>,
      },
    ]

    render(
      <DataTable
        columns={columnsWithRender}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
      />,
    )

    expect(screen.getByText("ALICE")).toBeInTheDocument()
  })

  it("does not render search input when onSearchChange is not provided", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
      />,
    )

    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument()
  })

  it("renders search input when onSearchChange is provided", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
        onSearchChange={vi.fn()}
        searchValue=""
      />,
    )

    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument()
  })

  it("calls onSearchChange when typing in search", () => {
    const onSearchChange = vi.fn()

    render(
      <DataTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
        onSearchChange={onSearchChange}
        searchValue=""
      />,
    )

    fireEvent.change(screen.getByPlaceholderText("Search..."), {
      target: { value: "ali" },
    })

    expect(onSearchChange).toHaveBeenCalledWith("ali")
  })

  it("shows page X of Y", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        total={20}
        page={2}
        perPage={10}
        onPageChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument()
  })

  it("disables Previous on first page", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        total={20}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled()
  })

  it("disables Next on last page", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        total={10}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled()
  })

  it("calls onPageChange(2) when Next is clicked on page 1", () => {
    const onPageChange = vi.fn()

    render(
      <DataTable
        columns={columns}
        data={data}
        total={20}
        page={1}
        perPage={10}
        onPageChange={onPageChange}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it("calls onPageChange(1) when Previous is clicked on page 2", () => {
    const onPageChange = vi.fn()

    render(
      <DataTable
        columns={columns}
        data={data}
        total={20}
        page={2}
        perPage={10}
        onPageChange={onPageChange}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Previous" }))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it("calls onSortChange('name', 'asc') on first click of a sortable header", () => {
    const onSortChange = vi.fn()

    render(
      <DataTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
        onSortChange={onSortChange}
      />,
    )

    fireEvent.click(screen.getByText("Name"))
    expect(onSortChange).toHaveBeenCalledWith("name", "asc")
  })

  it("calls onSortChange with 'desc' when clicking an already-sorted-asc column", () => {
    const onSortChange = vi.fn()

    render(
      <DataTable
        columns={columns}
        data={data}
        total={2}
        page={1}
        perPage={10}
        onPageChange={vi.fn()}
        onSortChange={onSortChange}
        sortKey="name"
        sortDir="asc"
      />,
    )

    fireEvent.click(screen.getByText(/Name/))
    expect(onSortChange).toHaveBeenCalledWith("name", "desc")
  })

  it("shows skeleton rows when isLoading is true", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        total={0}
        page={1}
        perPage={3}
        onPageChange={vi.fn()}
        isLoading
      />,
    )

    const cells = document.querySelectorAll("td")

    expect(cells).toHaveLength(6)
  })
})
