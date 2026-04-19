"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { EntitySheet } from "@/features/admin/components"
import {
  useAdminInstallationTypes,
  useCreateInstallationType,
  useUpdateInstallationType,
} from "@/features/admin/installation-types/api/installationTypes"
import { InstallationTypeForm } from "@/features/admin/installation-types/components/InstallationTypeForm"
import { InstallationTypesAdminTable } from "@/features/admin/installation-types/components/InstallationTypesAdminTable"
import { type InstallationTypeFormValues } from "@/features/admin/installation-types/schemas/installation-type.schema"
import { type InstallationTypeAdmin } from "@/schemas/entities"

export default function InstallationTypesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [selectedInstallationType, setSelectedInstallationType] = useState<InstallationTypeAdmin | null>(null)

  const { data: installationTypes = [], isLoading } = useAdminInstallationTypes()
  const createMutation = useCreateInstallationType()
  const updateMutation = useUpdateInstallationType()

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const handleCreate = () => {
    setSelectedInstallationType(null)
    setIsSheetOpen(true)
  }

  const handleEdit = (installationType: InstallationTypeAdmin) => {
    setSelectedInstallationType(installationType)
    setIsSheetOpen(true)
  }

  const handleToggleDisabled = (installationType: InstallationTypeAdmin) => {
    updateMutation.mutate(
      {
        id: installationType.id,
        payload: { active: !installationType.active },
      },
      {
        onSuccess: () => {
          toast.success(
            `Installation type ${installationType.active ? "disabled" : "enabled"} successfully`
          )
        },
        onError: () => {
          toast.error("Failed to update installation type status")
        },
      }
    )
  }

  const handleSubmit = (values: InstallationTypeFormValues) => {
    if (selectedInstallationType) {
      updateMutation.mutate(
        {
          id: selectedInstallationType.id,
          payload: values,
        },
        {
          onSuccess: () => {
            toast.success("Installation type updated successfully")
            setIsSheetOpen(false)
          },
          onError: () => {
            toast.error("Failed to update installation type")
          },
        }
      )
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success("Installation type created successfully")
          setIsSheetOpen(false)
        },
        onError: () => {
          toast.error("Failed to create installation type")
        },
      })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Installation Types" 
          description="Manage supported product installation configurations." 
        />
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Add Installation Type
        </Button>
      </div>

      <InstallationTypesAdminTable
        data={installationTypes}
        isLoading={isLoading}
        onEdit={handleEdit}
        onToggleDisabled={handleToggleDisabled}
      />

      <EntitySheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title={selectedInstallationType ? "Edit Installation Type" : "Add Installation Type"}
        description={
          selectedInstallationType
            ? "Update the installation type details and prompt block."
            : "Add a new installation type for products."
        }
      >
        <InstallationTypeForm
          defaultValues={selectedInstallationType || undefined}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </EntitySheet>
    </div>
  )
}
