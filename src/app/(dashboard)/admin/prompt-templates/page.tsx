"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { EntitySheet } from "@/features/admin/components"
import {
  useAdminPromptTemplates,
  useCreatePromptTemplate,
  useSetDefaultPromptTemplate,
} from "@/features/admin/prompt-templates/api/promptTemplates"
import { PromptTemplateForm } from "@/features/admin/prompt-templates/components/PromptTemplateForm"
import { PromptTemplatesAdminTable } from "@/features/admin/prompt-templates/components/PromptTemplatesAdminTable"
import { type PromptTemplateFormValues } from "@/features/admin/prompt-templates/schemas/prompt-template.schema"
import { type PromptTemplateAdmin } from "@/schemas/entities"

export default function PromptTemplatesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const { data: promptTemplates = [], isLoading } = useAdminPromptTemplates()
  const createMutation = useCreatePromptTemplate()
  const setDefaultMutation = useSetDefaultPromptTemplate()

  const handleCreate = () => {
    setIsSheetOpen(true)
  }

  const handleSetDefault = (template: PromptTemplateAdmin) => {
    // Prevent unsetting the current default
    if (template.is_default) {
      toast.info("This is already the default template.")
      return
    }

    setDefaultMutation.mutate(template.id, {
      onSuccess: () => {
        toast.success(`Template version v${template.version} set as default successfully.`)
      },
      onError: () => {
        toast.error("Failed to set template as default.")
      },
    })
  }

  const handleSubmit = (values: PromptTemplateFormValues) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success("New template version created successfully")
        setIsSheetOpen(false)
      },
      onError: () => {
        toast.error("Failed to create template version")
      },
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Prompt Templates" 
          description="Manage global system prompt versions and configuration." 
        />
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Create New Version
        </Button>
      </div>

      <PromptTemplatesAdminTable
        data={promptTemplates}
        isLoading={isLoading}
        onSetDefault={handleSetDefault}
      />

      <EntitySheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title="Create Template Version"
        description="Create a new version of the global prompt template. It will not be active until you set it as default."
      >
        <PromptTemplateForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
        />
      </EntitySheet>
    </div>
  )
}
