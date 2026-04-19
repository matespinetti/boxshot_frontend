"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { EntitySheet } from "@/features/admin/components"
import {
  useAdminShotTypes,
  useCreateShotType,
  useUpdateShotType,
} from "@/features/admin/shot-types/api/shotTypes"
import { ShotTypeForm } from "@/features/admin/shot-types/components/ShotTypeForm"
import { ShotTypesAdminTable } from "@/features/admin/shot-types/components/ShotTypesAdminTable"
import { type ShotTypeFormValues } from "@/features/admin/shot-types/schemas/shot-type.schema"
import { type ShotTypeAdmin } from "@/schemas/entities"

export default function ShotTypesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [selectedShotType, setSelectedShotType] = useState<ShotTypeAdmin | null>(null)

  const { data: shotTypes = [], isLoading } = useAdminShotTypes()
  const createMutation = useCreateShotType()
  const updateMutation = useUpdateShotType()

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const handleCreate = () => {
    setSelectedShotType(null)
    setIsSheetOpen(true)
  }

  const handleEdit = (shotType: ShotTypeAdmin) => {
    setSelectedShotType(shotType)
    setIsSheetOpen(true)
  }

  const handleToggleDisabled = (shotType: ShotTypeAdmin) => {
    updateMutation.mutate(
      {
        id: shotType.id,
        payload: { active: !shotType.active },
      },
      {
        onSuccess: () => {
          toast.success(
            `Shot type ${shotType.active ? "disabled" : "enabled"} successfully`
          )
        },
        onError: () => {
          toast.error("Failed to update shot type status")
        },
      }
    )
  }

  const handleSubmit = (values: ShotTypeFormValues) => {
    if (selectedShotType) {
      updateMutation.mutate(
        {
          id: selectedShotType.id,
          payload: values,
        },
        {
          onSuccess: () => {
            toast.success("Shot type updated successfully")
            setIsSheetOpen(false)
          },
          onError: () => {
            toast.error("Failed to update shot type")
          },
        }
      )
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success("Shot type created successfully")
          setIsSheetOpen(false)
        },
        onError: () => {
          toast.error("Failed to create shot type")
        },
      })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Shot Types" 
          description="Manage supported camera angles and product framing intents." 
        />
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Add Shot Type
        </Button>
      </div>

      <ShotTypesAdminTable
        data={shotTypes}
        isLoading={isLoading}
        onEdit={handleEdit}
        onToggleDisabled={handleToggleDisabled}
      />

      <EntitySheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title={selectedShotType ? "Edit Shot Type" : "Add Shot Type"}
        description={
          selectedShotType
            ? "Update the shot type details and framing prompt block."
            : "Add a new shot type for product framing."
        }
      >
        <ShotTypeForm
          defaultValues={selectedShotType || undefined}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </EntitySheet>
    </div>
  )
}
