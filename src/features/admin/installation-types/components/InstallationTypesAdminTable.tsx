import { StatusBadge } from "@/components/shared"
import { AdminTable } from "@/features/admin/components"
import { type InstallationTypeAdmin } from "@/schemas/entities"

interface InstallationTypesAdminTableProps {
  data: InstallationTypeAdmin[]
  isLoading?: boolean
  onEdit: (installationType: InstallationTypeAdmin) => void
  onToggleDisabled: (installationType: InstallationTypeAdmin) => void
}

export function InstallationTypesAdminTable({
  data,
  isLoading,
  onEdit,
  onToggleDisabled,
}: InstallationTypesAdminTableProps) {
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
        },
        {
          key: "label",
          header: "Label",
        },
        {
          key: "active",
          header: "Status",
          render: (item) => <StatusBadge status={item.active ? "complete" : "failed"} />,
        },
      ]}
      onToggleDisabled={onToggleDisabled}
      onEdit={onEdit}
      entityLabel="installation type"
    />
  )
}
