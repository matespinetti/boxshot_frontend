"use client"

import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { type Control } from "react-hook-form"
import { getColours } from "@/features/generation/api/getColours"
import { getCountries } from "@/features/generation/api/getCountries"
import { getProducts } from "@/features/generation/api/getProducts"
import { getShotTypes } from "@/features/generation/api/getShotTypes"
import { useGenerationForm } from "@/features/generation/hooks/useGenerationForm"
import { generationQueryKeys } from "@/features/generation/queryKeys"
import type { CreateJobRequest } from "@/features/generation/types"
import { ColourSelector } from "./ColourSelector"
import { CountryMultiSelect } from "./CountryMultiSelect"
import { ProductSelector } from "./ProductSelector"
import { PromptPreviewModal } from "./PromptPreviewModal"
import { ReferenceImageSelector } from "./ReferenceImageSelector"
import { ShotTypeMultiSelect } from "./ShotTypeMultiSelect"
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
            <Button
              type="submit"
              className="w-full"
              disabled={isPreviewing || totalImages === 0}
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
