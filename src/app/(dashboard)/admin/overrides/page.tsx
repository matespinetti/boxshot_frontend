"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { EntitySheet } from "@/features/admin/components"
import {
  useAdminOverrides,
  useCreateOverride,
  useUpdateOverride,
} from "@/features/admin/overrides/api/overrides"
import { OverrideForm } from "@/features/admin/overrides/components/OverrideForm"
import { OverridesAdminTable } from "@/features/admin/overrides/components/OverridesAdminTable"
import { type OverrideFormValues } from "@/features/admin/overrides/schemas/override.schema"
import { type PromptBlockOverride } from "@/schemas/entities"

export default function OverridesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const { data: overrides = [], isLoading } = useAdminOverrides()
  const createMutation = useCreateOverride()
  const updateMutation = useUpdateOverride()

  const handleCreate = () => {
    setIsSheetOpen(true)
  }

  const handleToggleDisabled = (override: PromptBlockOverride) => {
    updateMutation.mutate(
      {
        id: override.id,
        payload: { active: !override.active },
      },
      {
        onSuccess: () => {
          toast.success(
            `Override ${override.active ? "deactivated" : "activated"} successfully`
          )
        },
        onError: () => {
          toast.error("Failed to update override status")
        },
      }
    )
  }

  const handleSubmit = (values: OverrideFormValues) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Override created successfully")
        setIsSheetOpen(false)
      },
      onError: () => {
        toast.error("Failed to create override")
      },
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Prompt Overrides" 
          description="Manage prompt block overrides for specific entity instances." 
        />
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Create Override
        </Button>
      </div>

      <OverridesAdminTable
        data={overrides}
        isLoading={isLoading}
        onToggleDisabled={handleToggleDisabled}
      />

      <EntitySheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title="Create Prompt Override"
        description="Select an entity type, instance, and prompt block to override. Overrides cannot be edited once created, only deactivated or deleted."
      >
        <OverrideForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
        />
      </EntitySheet>
    </div>
  )
}
