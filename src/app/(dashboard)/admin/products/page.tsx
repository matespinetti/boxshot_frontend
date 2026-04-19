"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { EntitySheet } from "@/features/admin/components"
import {
  useAdminProducts,
  useCreateProduct,
  useUpdateProduct,
} from "@/features/admin/products/api/products"
import { ProductForm } from "@/features/admin/products/components/ProductForm"
import { ProductsAdminTable } from "@/features/admin/products/components/ProductsAdminTable"
import { type ProductFormValues } from "@/features/admin/products/schemas/product.schema"
import { type ProductAdmin } from "@/schemas/entities"

export default function ProductsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductAdmin | null>(null)

  const { data: products = [], isLoading } = useAdminProducts()
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()

  const handleCreate = () => {
    setSelectedProduct(null)
    setIsSheetOpen(true)
  }

  const handleEdit = (product: ProductAdmin) => {
    setSelectedProduct(product)
    setIsSheetOpen(true)
  }

  const handleToggleDisabled = (product: ProductAdmin) => {
    updateMutation.mutate(
      {
        id: product.id,
        payload: { active: !product.active },
      },
      {
        onSuccess: () => {
          toast.success(`Product ${product.active ? "disabled" : "enabled"} successfully`)
        },
        onError: () => {
          toast.error("Failed to update product status")
        },
      }
    )
  }

  const handleSubmit = (values: ProductFormValues) => {
    if (selectedProduct) {
      updateMutation.mutate(
        {
          id: selectedProduct.id,
          payload: values,
        },
        {
          onSuccess: () => {
            toast.success("Product updated successfully")
            setIsSheetOpen(false)
          },
          onError: () => {
            toast.error("Failed to update product")
          },
        }
      )
    } else {
      createMutation.mutate(values, {
        onSuccess: (newProduct) => {
          toast.success("Product created successfully! You can now upload reference images.")
          // Instead of closing the sheet immediately, we transition it into "Edit" mode
          // so the user can immediately upload images in the ReferenceImageUpload block.
          setSelectedProduct(newProduct)
        },
        onError: () => {
          toast.error("Failed to create product")
        },
      })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Products" 
          description="Manage products, their base configurations, and upload reference studio images." 
        />
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Create Product
        </Button>
      </div>

      <ProductsAdminTable
        data={products}
        isLoading={isLoading}
        onEdit={handleEdit}
        onToggleDisabled={handleToggleDisabled}
      />

      <EntitySheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title={selectedProduct ? "Edit Product" : "Create Product"}
        description={
          selectedProduct
            ? "Update product details and manage reference studio images below."
            : "Create a new product. Once created, you will be able to upload reference images."
        }
      >
        <ProductForm
          defaultValues={selectedProduct || undefined}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </EntitySheet>
    </div>
  )
}
