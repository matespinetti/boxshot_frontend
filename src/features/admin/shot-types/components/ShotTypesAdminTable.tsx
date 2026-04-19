import { StatusBadge } from "@/components/shared"
import { AdminTable } from "@/features/admin/components"
import { type ShotTypeAdmin } from "@/schemas/entities"

interface ShotTypesAdminTableProps {
  data: ShotTypeAdmin[]
  isLoading?: boolean
  onEdit: (shotType: ShotTypeAdmin) => void
  onToggleDisabled: (shotType: ShotTypeAdmin) => void
}

export function ShotTypesAdminTable({
  data,
  isLoading,
  onEdit,
  onToggleDisabled,
}: ShotTypesAdminTableProps) {
  const tableData = data.map((row) => ({
    ...row,
    disabled: !row.active,
  }))

  return (
    <AdminTable
      data={tableData}
      total={tableData.length}
      page={1}
      perPage={tableData.length > 0 ? tableData.length : 10}
      onPageChange={() => {}}
      isLoading={isLoading}
      columns={[
        {
          key: "name",
          header: "Name",
          render: (item) => (
            <span
              className="font-medium text-primary cursor-pointer hover:underline"
              onClick={() => onEdit(item)}
            >
              {item.name}
            </span>
          ),
        },
        {
          key: "intent",
          header: "Intent",
          render: (item) => (
            <span className="capitalize">{item.intent}</span>
          ),
        },
        {
          key: "active",
          header: "Status",
          render: (item) => <StatusBadge status={item.active ? "complete" : "failed"} />,
        },
      ]}
      onToggleDisabled={onToggleDisabled}
      entityLabel="shot type"
    />
  )
}
