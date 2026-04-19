import { AdminTable } from "@/features/admin/components"
import { StatusBadge } from "@/components/shared"
import { type CountryAdmin } from "@/schemas/entities"

interface CountriesAdminTableProps {
  data: CountryAdmin[]
  isLoading?: boolean
  onEdit: (country: CountryAdmin) => void
  onToggleDisabled: (country: CountryAdmin) => void
}

export function CountriesAdminTable({
  data,
  isLoading,
  onEdit,
  onToggleDisabled,
}: CountriesAdminTableProps) {
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
          key: "code",
          header: "Code",
          render: (item) => (
            <span 
              className="font-mono text-sm cursor-pointer hover:underline text-primary"
              onClick={() => onEdit(item)}
            >
              {item.code}
            </span>
          ),
        },
        {
          key: "name",
          header: "Name",
        },
        {
          key: "active",
          header: "Status",
          render: (item) => <StatusBadge status={item.active ? "complete" : "failed"} />,
        },
      ]}
      onToggleDisabled={onToggleDisabled}
      onEdit={onEdit}
      entityLabel="country"
    />
  )
}
