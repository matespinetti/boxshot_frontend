import { Badge } from "@/components/ui/badge"
import { AdminTable } from "@/features/admin/components"
import { type PromptTemplateAdmin } from "@/schemas/entities"

interface PromptTemplatesAdminTableProps {
  data: PromptTemplateAdmin[]
  isLoading?: boolean
  onSetDefault: (template: PromptTemplateAdmin) => void
  onView: (template: PromptTemplateAdmin) => void
}

export function PromptTemplatesAdminTable({
  data,
  isLoading,
  onSetDefault,
  onView,
}: PromptTemplatesAdminTableProps) {
  // Map our PromptTemplateAdmin to include disabled logic for AdminTable row actions
  const tableData = data.map((row) => ({
    ...row,
    // A default template cannot be "disabled" or unset without setting another one, 
    // but we use the AdminTable's onToggleDisabled generic approach to trigger set-default
    // The disable button represents the "Set Default" action in this specific variant.
    disabled: !row.is_default, 
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
          header: "Template Name",
        },
        {
          key: "version",
          header: "Version",
          render: (item) => <span className="text-muted-foreground">v{item.version}</span>,
        },
        {
          key: "created_at",
          header: "Created",
          render: (item) => new Date(item.created_at).toLocaleDateString(),
        },
        {
          key: "is_default",
          header: "Status",
          render: (item) =>
            item.is_default ? (
              <Badge variant="default" className="bg-green-600">Default</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            ),
        },
      ]}
      // We hijack onToggleDisabled to execute "set default" logic since AdminTable
      // is hardcoded for Enable/Disable actions. We'll only allow it on non-default rows.
      onToggleDisabled={onSetDefault}
      onView={onView}
      entityLabel="prompt template"
    />
  )
}
