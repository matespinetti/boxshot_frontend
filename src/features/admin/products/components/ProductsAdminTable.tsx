import { StatusBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { AdminTable } from "@/features/admin/components"
import { type ProductAdmin } from "@/schemas/entities"

interface ProductsAdminTableProps {
  data: ProductAdmin[]
  isLoading?: boolean
  onEdit: (product: ProductAdmin) => void
  onToggleDisabled: (product: ProductAdmin) => void
}

export function ProductsAdminTable({
  data,
  isLoading,
  onEdit,
  onToggleDisabled,
}: ProductsAdminTableProps) {
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
          key: "slug",
          header: "Slug",
          render: (item) => <span className="text-muted-foreground">{item.slug}</span>,
        },
        {
          key: "installation_type_id",
          header: "Installation Type ID",
          render: (item) => (
            <Badge variant="outline" className="font-mono text-xs">
              {item.installation_type_id.split("-")[0]}...
            </Badge>
          ),
        },
        {
          key: "active",
          header: "Status",
          render: (item) => <StatusBadge status={item.active ? "complete" : "failed"} />,
        },
      ]}
      onToggleDisabled={onToggleDisabled}
      onEdit={onEdit}
      entityLabel="product"
    />
  )
}
