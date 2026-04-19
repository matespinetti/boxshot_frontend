import { Badge } from "@/components/ui/badge"
import { AdminTable } from "@/features/admin/components"
import { type PromptBlockOverride } from "@/schemas/entities"

interface OverridesAdminTableProps {
  data: PromptBlockOverride[]
  isLoading?: boolean
  onToggleDisabled: (override: PromptBlockOverride) => void
}

export function OverridesAdminTable({
  data,
  isLoading,
  onToggleDisabled,
}: OverridesAdminTableProps) {
  // Map PromptBlockOverride to standard admin row
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
          key: "entity_type",
          header: "Entity Type",
          render: (item) => <Badge variant="outline">{item.entity_type}</Badge>,
        },
        {
          key: "entity_id",
          header: "Entity ID",
          render: (item) => (
            <span className="text-xs text-muted-foreground font-mono">
              {item.entity_id.split("-")[0]}...
            </span>
          ),
        },
        {
          key: "override_key",
          header: "Override Key",
          render: (item) => <span className="font-medium">{item.override_key}</span>,
        },
        {
          key: "active",
          header: "Status",
          render: (item) =>
            item.active ? (
              <Badge variant="default" className="bg-green-600">Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            ),
        },
      ]}
      onToggleDisabled={onToggleDisabled}
      // Implement custom deletion if needed, but for now we map Delete to toggle if needed,
      // actually wait, our AdminTable doesn't have a "Delete" action built-in.
      // We will just use the active toggle. The user can toggle it off.
      // If we need a real delete, we should update AdminTable, but inactive is practically the same.
      entityLabel="override"
    />
  )
}
