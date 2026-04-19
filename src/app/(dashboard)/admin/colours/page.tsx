"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { PageHeader, EmptyState } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { EntitySheet } from "@/features/admin/components"
import { adminColoursQueryKeys } from "@/features/admin/colours/queryKeys"
import { getAdminColours } from "@/features/admin/colours/api/getAdminColours"
import { createColour } from "@/features/admin/colours/api/createColour"
import { updateColour } from "@/features/admin/colours/api/updateColour"
import { ColoursAdminTable } from "@/features/admin/colours/components/ColoursAdminTable"
import { ColourForm } from "@/features/admin/colours/components/ColourForm"
import type { ColourFormValues } from "@/features/admin/colours/schemas/colour.schema"
import type { ColourAdmin } from "@/schemas/entities"

export default function ColoursPage() {
  const queryClient = useQueryClient()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [selectedColour, setSelectedColour] = useState<ColourAdmin | undefined>(undefined)

  const { data: colours, isLoading, isError, refetch } = useQuery({
    queryKey: adminColoursQueryKeys.all,
    queryFn: getAdminColours,
  })

  const createMutation = useMutation({
    mutationFn: createColour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminColoursQueryKeys.all })
      toast.success("Colour created successfully")
      setIsSheetOpen(false)
    },
    onError: () => {
      toast.error("Failed to create colour")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ColourAdmin> }) =>
      updateColour(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminColoursQueryKeys.all })
      toast.success("Colour updated successfully")
      setIsSheetOpen(false)
    },
    onError: () => {
      toast.error("Failed to update colour")
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ColourAdmin> }) =>
      updateColour(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminColoursQueryKeys.all })
    },
    onError: () => {
      toast.error("Failed to update status")
    },
  })

  function handleCreate() {
    setSelectedColour(undefined)
    setIsSheetOpen(true)
  }

  function handleEdit(colour: ColourAdmin) {
    setSelectedColour(colour)
    setIsSheetOpen(true)
  }

  function handleToggleDisabled(colour: ColourAdmin) {
    toggleStatusMutation.mutate({
      id: colour.id,
      data: { active: !colour.active },
    })
  }

  function onSubmit(values: ColourFormValues) {
    if (selectedColour) {
      updateMutation.mutate({
        id: selectedColour.id,
        data: values,
      })
    } else {
      createMutation.mutate(values)
    }
  }

  function handleOpenChange(open: boolean) {
    setIsSheetOpen(open)
    if (!open) {
      // give sheet time to slide out before resetting selected colour
      setTimeout(() => setSelectedColour(undefined), 300)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Colours / RAL" description="Manage RAL colours." />
        <Button onClick={handleCreate}>Add Colour</Button>
      </div>

      {isError ? (
        <EmptyState
          title="Failed to load colours"
          action={{ label: "Retry", onClick: () => refetch() }}
        />
      ) : (
        <ColoursAdminTable
          data={colours ?? []}
          onToggleDisabled={handleToggleDisabled}
          onEdit={handleEdit}
        />
      )}

      <EntitySheet
        open={isSheetOpen}
        onOpenChange={handleOpenChange}
        title={selectedColour ? "Edit Colour" : "New Colour"}
      >
        <ColourForm
          defaultValues={selectedColour}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </EntitySheet>
    </div>
  )
}

