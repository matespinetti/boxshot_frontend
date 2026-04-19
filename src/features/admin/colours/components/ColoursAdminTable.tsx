"use client"

import type { ColourAdmin } from "@/schemas/entities"
import type { ColumnDef } from "@/components/shared"
import { AdminTable } from "@/features/admin/components"
import { StatusBadge } from "@/components/shared"

interface ColoursAdminTableProps {
  data: ColourAdmin[]
  onToggleDisabled: (row: ColourAdmin) => void
  onEdit: (row: ColourAdmin) => void
}

export function ColoursAdminTable({
  data,
  onToggleDisabled,
  onEdit,
}: ColoursAdminTableProps) {
  const columns: ColumnDef<ColourAdmin>[] = [
    {
      key: "ral_code",
      header: "RAL Code",
      render: (row) => (
        <span
          className="cursor-pointer hover:underline text-primary"
          onClick={() => onEdit(row)}
        >
          {row.ral_code}
        </span>
      ),
    },
    { key: "name", header: "Name" },
    {
      key: "hex_preview",
      header: "Preview",
      render: (row) =>
        row.hex_preview ? (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md border"
              style={{ backgroundColor: row.hex_preview }}
              title={row.hex_preview}
            />
            <span className="font-mono text-xs text-muted-foreground uppercase">
              {row.hex_preview}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground italic text-xs">None</span>
        ),
    },
    {
      key: "finish_prompt_block",
      header: "Prompt block",
      render: (row) => (
        <span
          className="truncate max-w-[200px] inline-block"
          title={row.finish_prompt_block}
        >
          {row.finish_prompt_block}
        </span>
      ),
    },
    {
      key: "active",
      header: "Status",
      render: (row) => (
        <StatusBadge status={row.active ? "complete" : "failed"} />
      ),
    },
  ]

  // Add disabled mapping to work with AdminTable
  const tableData = data.map((row) => ({
    ...row,
    disabled: !row.active,
  }))

  return (
    <AdminTable
      columns={columns}
      data={tableData}
      total={tableData.length}
      page={1}
      perPage={tableData.length > 0 ? tableData.length : 10}
      onPageChange={() => {}}
      onToggleDisabled={onToggleDisabled}
      entityLabel="colour"
    />
  )
}
