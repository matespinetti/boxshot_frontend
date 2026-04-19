import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PromptBlockEditor } from "@/features/admin/components"
import { useAdminInstallationTypes } from "@/features/admin/installation-types/api/installationTypes"
import { ReferenceImageUpload } from "@/features/admin/products/components/ReferenceImageUpload"
import {
  productFormSchema,
  type ProductFormValues,
} from "@/features/admin/products/schemas/product.schema"

interface ProductFormProps {
  defaultValues?: Partial<ProductFormValues> & { id?: string }
  onSubmit: (values: ProductFormValues) => void
  isSubmitting?: boolean
}

export function ProductForm({ defaultValues, onSubmit, isSubmitting }: ProductFormProps) {
  const { data: installationTypes = [], isLoading: isLoadingInstallationTypes } = useAdminInstallationTypes()

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      slug: defaultValues?.slug ?? "",
      installation_type_id: defaultValues?.installation_type_id ?? "",
      product_prompt_block: defaultValues?.product_prompt_block ?? "",
    },
  })

  // Reset form when defaultValues changes
  useEffect(() => {
    form.reset({
      name: defaultValues?.name ?? "",
      slug: defaultValues?.slug ?? "",
      installation_type_id: defaultValues?.installation_type_id ?? "",
      product_prompt_block: defaultValues?.product_prompt_block ?? "",
    })
  }, [defaultValues, form])

  // Optional: Auto-generate slug from name if creating
  const nameValue = useWatch({ control: form.control, name: "name" })
  useEffect(() => {
    if (!defaultValues?.id && nameValue && !form.formState.dirtyFields.slug) {
      const generatedSlug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
      form.setValue("slug", generatedSlug, { shouldValidate: true })
    }
  }, [nameValue, defaultValues?.id, form])

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Classic Mug" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. classic-mug" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="installation_type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Installation Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoadingInstallationTypes}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        isLoadingInstallationTypes
                          ? "Loading types..."
                          : "Select an installation type"
                      }>
                        {installationTypes.find((t) => t.id === field.value)?.label}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {installationTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="product_prompt_block"
            render={({ field }) => (
              <FormItem>
                <PromptBlockEditor
                  label="Product Prompt Block"
                  placeholder="Describe the physical characteristics of this product..."
                  value={field.value}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : defaultValues?.id ? "Update Product" : "Create Product"}
          </Button>
        </form>
      </Form>

      {/* Conditionally render Image Upload if it's an existing product */}
      {defaultValues?.id && (
        <ReferenceImageUpload productId={defaultValues.id} />
      )}
    </div>
  )
}
