"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { EntitySheet } from "@/features/admin/components"
import {
  useAdminSurfaceTypes,
  useCreateSurfaceType,
  useUpdateSurfaceType,
} from "@/features/admin/surface-types/api/surfaceTypes"
import { SurfaceTypeForm } from "@/features/admin/surface-types/components/SurfaceTypeForm"
import { SurfaceTypesAdminTable } from "@/features/admin/surface-types/components/SurfaceTypesAdminTable"
import { type SurfaceTypeFormValues } from "@/features/admin/surface-types/schemas/surface-type.schema"
import { type SurfaceTypeAdmin } from "@/schemas/entities"

export default function SurfaceTypesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [selectedSurfaceType, setSelectedSurfaceType] =
    useState<SurfaceTypeAdmin | null>(null)

  const { data: surfaceTypes = [], isLoading } = useAdminSurfaceTypes()
  const createMutation = useCreateSurfaceType()
  const updateMutation = useUpdateSurfaceType()

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const handleCreate = () => {
    setSelectedSurfaceType(null)
    setIsSheetOpen(true)
  }

  const handleEdit = (surfaceType: SurfaceTypeAdmin) => {
    setSelectedSurfaceType(surfaceType)
    setIsSheetOpen(true)
  }

  const handleToggleDisabled = (surfaceType: SurfaceTypeAdmin) => {
    updateMutation.mutate(
      {
        id: surfaceType.id,
        payload: { active: !surfaceType.active },
      },
      {
        onSuccess: () => {
          toast.success(
            `Surface type ${surfaceType.active ? "disabled" : "enabled"} successfully`,
          )
        },
        onError: () => {
          toast.error("Failed to update surface type status")
        },
      },
    )
  }

  const handleSubmit = (values: SurfaceTypeFormValues) => {
    if (selectedSurfaceType) {
      updateMutation.mutate(
        {
          id: selectedSurfaceType.id,
          payload: values,
        },
        {
          onSuccess: () => {
            toast.success("Surface type updated successfully")
            setIsSheetOpen(false)
          },
          onError: () => {
            toast.error("Failed to update surface type")
          },
        },
      )
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success("Surface type created successfully")
          setIsSheetOpen(false)
        },
        onError: () => {
          toast.error("Failed to create surface type")
        },
      })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Surface Types"
          description="Manage supported surface context prompt blocks."
        />
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Add Surface Type
        </Button>
      </div>

      <SurfaceTypesAdminTable
        data={surfaceTypes}
        isLoading={isLoading}
        onEdit={handleEdit}
        onToggleDisabled={handleToggleDisabled}
      />

      <EntitySheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title={selectedSurfaceType ? "Edit Surface Type" : "Add Surface Type"}
        description={
          selectedSurfaceType
            ? "Update the surface type details and prompt block."
            : "Add a new surface type for generation context."
        }
      >
        <SurfaceTypeForm
          defaultValues={selectedSurfaceType || undefined}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </EntitySheet>
    </div>
  )
}
