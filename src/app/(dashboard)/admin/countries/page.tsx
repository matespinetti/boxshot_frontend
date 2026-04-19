"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared"
import { EntitySheet } from "@/features/admin/components"
import {
  useAdminCountries,
  useCreateCountry,
  useUpdateCountry,
} from "@/features/admin/countries/api/countries"
import { CountriesAdminTable } from "@/features/admin/countries/components/CountriesAdminTable"
import { CountryForm } from "@/features/admin/countries/components/CountryForm"
import { type CountryFormValues } from "@/features/admin/countries/schemas/country.schema"
import { type CountryAdmin } from "@/schemas/entities"

export default function CountriesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<CountryAdmin | null>(null)

  const { data: countries = [], isLoading } = useAdminCountries()
  const createMutation = useCreateCountry()
  const updateMutation = useUpdateCountry()

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const handleCreate = () => {
    setSelectedCountry(null)
    setIsSheetOpen(true)
  }

  const handleEdit = (country: CountryAdmin) => {
    setSelectedCountry(country)
    setIsSheetOpen(true)
  }

  const handleToggleDisabled = (country: CountryAdmin) => {
    updateMutation.mutate(
      {
        id: country.id,
        payload: { active: !country.active },
      },
      {
        onSuccess: () => {
          toast.success(
            `Country ${country.active ? "disabled" : "enabled"} successfully`
          )
        },
        onError: () => {
          toast.error("Failed to update country status")
        },
      }
    )
  }

  const handleSubmit = (values: CountryFormValues) => {
    if (selectedCountry) {
      updateMutation.mutate(
        {
          id: selectedCountry.id,
          payload: values,
        },
        {
          onSuccess: () => {
            toast.success("Country updated successfully")
            setIsSheetOpen(false)
          },
          onError: () => {
            toast.error("Failed to update country")
          },
        }
      )
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success("Country created successfully")
          setIsSheetOpen(false)
        },
        onError: () => {
          toast.error("Failed to create country")
        },
      })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Countries" 
          description="Manage supported countries and their environment prompts." 
        />
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Add Country
        </Button>
      </div>

      <CountriesAdminTable
        data={countries}
        isLoading={isLoading}
        onEdit={handleEdit}
        onToggleDisabled={handleToggleDisabled}
      />

      <EntitySheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title={selectedCountry ? "Edit Country" : "Add Country"}
        description={
          selectedCountry
            ? "Update the country details and environment prompt."
            : "Add a new country for environment generation."
        }
      >
        <CountryForm
          defaultValues={selectedCountry || undefined}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </EntitySheet>
    </div>
  )
}
