"use client"

import { useEffect } from "react"

import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { type Control } from "react-hook-form"
import { getColours } from "@/features/generation/api/getColours"
import { getCountries } from "@/features/generation/api/getCountries"
import { getInstallationTypes } from "@/features/generation/api/getInstallationTypes"
import { getModels } from "@/features/generation/api/getModels"
import { getProducts } from "@/features/generation/api/getProducts"
import { getShotTypes } from "@/features/generation/api/getShotTypes"
import { getSurfaceTypes } from "@/features/generation/api/getSurfaceTypes"
import { useGenerationForm } from "@/features/generation/hooks/useGenerationForm"
import { generationQueryKeys } from "@/features/generation/queryKeys"
import type { CreateJobRequest } from "@/features/generation/types"
import { ColourSelector } from "./ColourSelector"
import { CountryMultiSelect } from "./CountryMultiSelect"
import { InstallationTypeSelector } from "./InstallationTypeSelector"
import { ModelSelector } from "./ModelSelector"
import { ProductSelector } from "./ProductSelector"
import { PromptPreviewModal } from "./PromptPreviewModal"
import { ReferenceImageSelector } from "./ReferenceImageSelector"
import { ShotTypeMultiSelect } from "./ShotTypeMultiSelect"
import { SurfaceTypeSelector } from "./SurfaceTypeSelector"
import { VariationSelector } from "./VariationSelector"

export function GenerationPanel() {
  const {
    form,
    totalImages,
    previewData,
    isPreviewing,
    isCreating,
    onSubmit,
    handleConfirm,
    handleCloseModal,
  } = useGenerationForm()

  const productId = form.watch("product_id")
  // Cast because form uses z.input type (variations?: number) but selectors are typed
  // against CreateJobRequest output type (variations: number). Functionally identical.
  const control = form.control as unknown as Control<CreateJobRequest>

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: generationQueryKeys.products(),
    queryFn: getProducts,
  })
  const { data: colours, isLoading: coloursLoading } = useQuery({
    queryKey: generationQueryKeys.colours(),
    queryFn: getColours,
  })
  const { data: countries, isLoading: countriesLoading } = useQuery({
    queryKey: generationQueryKeys.countries(),
    queryFn: getCountries,
  })
  const { data: shotTypes, isLoading: shotTypesLoading } = useQuery({
    queryKey: generationQueryKeys.shotTypes(),
    queryFn: getShotTypes,
  })
  const { data: installationTypes, isLoading: installationTypesLoading } =
    useQuery({
      queryKey: generationQueryKeys.installationTypes(),
      queryFn: getInstallationTypes,
    })
  const { data: surfaceTypes, isLoading: surfaceTypesLoading } = useQuery({
    queryKey: generationQueryKeys.surfaceTypes(),
    queryFn: getSurfaceTypes,
  })
  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: generationQueryKeys.models(),
    queryFn: getModels,
  })

  const hasModels = (models?.length ?? 0) > 0

  useEffect(() => {
    if (!form.getValues("model") && models?.[0]?.id) {
      form.setValue("model", models[0].id, { shouldValidate: true })
    }
  }, [form, models])

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]"
        >
          <div className="space-y-6">
            <ProductSelector
              control={control}
              products={products?.items ?? []}
              isLoading={productsLoading}
            />
            <ColourSelector
              control={control}
              colours={colours?.items ?? []}
              isLoading={coloursLoading}
              disabled={!productId}
            />
            <InstallationTypeSelector
              control={control}
              installationTypes={installationTypes?.items ?? []}
              isLoading={installationTypesLoading}
            />
            <SurfaceTypeSelector
              control={control}
              surfaceTypes={surfaceTypes?.items ?? []}
              isLoading={surfaceTypesLoading}
            />
            <CountryMultiSelect
              control={control}
              countries={countries?.items ?? []}
              isLoading={countriesLoading}
            />
            <ShotTypeMultiSelect
              control={control}
              shotTypes={shotTypes?.items ?? []}
              isLoading={shotTypesLoading}
            />
            <ModelSelector
              control={control}
              models={models ?? []}
              isLoading={modelsLoading}
            />
            <VariationSelector control={control} />
            <ReferenceImageSelector
              productId={productId ?? ""}
              value={form.watch("product_image_ids") ?? []}
              onChange={(ids) => form.setValue("product_image_ids", ids)}
            />
          </div>

          <div className="space-y-4 lg:sticky lg:top-6">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
              <p className="text-3xl font-bold">{totalImages}</p>
              <p className="text-sm text-muted-foreground">
                images to generate
              </p>
            </div>
            {!modelsLoading && !hasModels ? (
              <p className="text-sm text-destructive">
                No generation models are available. Preview and generate are
                disabled.
              </p>
            ) : null}
            <Button
              type="submit"
              className="w-full"
              disabled={isPreviewing || totalImages === 0 || !hasModels}
            >
              {isPreviewing ? "Loading preview..." : "Generate"}
            </Button>
          </div>
        </form>
      </Form>

      {previewData && (
        <PromptPreviewModal
          open={true}
          prompts={previewData.prompts}
          isConfirming={isCreating}
          onClose={handleCloseModal}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}
