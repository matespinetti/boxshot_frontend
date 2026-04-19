import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"

import { apiClient } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PromptBlockEditor } from "@/features/admin/components"
import {
  overrideFormSchema,
  type OverrideFormValues,
} from "@/features/admin/overrides/schemas/override.schema"

interface OverrideFormProps {
  onSubmit: (values: OverrideFormValues) => void
  isSubmitting?: boolean
}

const DEFAULT_FORM_VALUES: OverrideFormValues = {
  entity_type: "",
  entity_id: "",
  override_key: "",
  override_value: "",
}

// Map entity types to their display names, API endpoints, and available prompt block keys
const ENTITY_CONFIG = {
  products: {
    label: "Product",
    endpoint: "/admin/products",
    keys: ["product_prompt_block"],
  },
  colours: {
    label: "Colour",
    endpoint: "/admin/colours",
    keys: ["finish_prompt_block"],
  },
  countries: {
    label: "Country",
    endpoint: "/admin/countries",
    keys: ["environment_prompt_block"],
  },
  shot_types: {
    label: "Shot Type",
    endpoint: "/admin/shot-types",
    keys: ["framing_prompt_block"],
  },
  installation_types: {
    label: "Installation Type",
    endpoint: "/admin/installation-types",
    keys: ["installation_prompt_block"],
  },
} as const

type EntityType = keyof typeof ENTITY_CONFIG

export function OverrideForm({ onSubmit, isSubmitting }: OverrideFormProps) {
  const form = useForm<OverrideFormValues>({
    resolver: zodResolver(overrideFormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  })

  const selectedEntityType = useWatch({
    control: form.control,
    name: "entity_type",
  }) as EntityType | ""

  // Reset dependent fields when entity_type changes
  useEffect(() => {
    if (selectedEntityType) {
      form.setValue("entity_id", "")
      // If there's only one key, auto-select it
      const keys = ENTITY_CONFIG[selectedEntityType]?.keys
      if (keys?.length === 1) {
        form.setValue("override_key", keys[0])
      } else {
        form.setValue("override_key", "")
      }
    }
  }, [selectedEntityType, form])

  // Generic query to fetch entities based on selected type
  const { data: entities = [], isLoading: isLoadingEntities } = useQuery({
    queryKey: ["admin", "override-entities", selectedEntityType],
    queryFn: async () => {
      if (!selectedEntityType) return []
      const config = ENTITY_CONFIG[selectedEntityType]
      // We assume all entity endpoints return { id: string, name: string } at minimum
      const data = await apiClient.get<Array<{ id: string; name: string }>>(config.endpoint)
      return data
    },
    enabled: !!selectedEntityType,
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Cascade 1: Entity Type */}
        <FormField
          control={form.control}
          name="entity_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entity Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an entity type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(ENTITY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cascade 2: Entity Instance */}
        <FormField
          control={form.control}
          name="entity_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entity</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={!selectedEntityType || isLoadingEntities}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      isLoadingEntities 
                        ? "Loading..." 
                        : selectedEntityType 
                          ? `Select a ${ENTITY_CONFIG[selectedEntityType as EntityType].label}`
                          : "Select an entity type first"
                    } />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {entities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cascade 3: Override Key */}
        <FormField
          control={form.control}
          name="override_key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt Block to Override</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={!selectedEntityType}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a prompt block key" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {selectedEntityType && ENTITY_CONFIG[selectedEntityType as EntityType].keys.map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
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
          name="override_value"
          render={({ field }) => (
            <FormItem>
              <PromptBlockEditor
                label="Override Value"
                placeholder="Enter the new prompt block content..."
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Override"}
        </Button>
      </form>
    </Form>
  )
}
