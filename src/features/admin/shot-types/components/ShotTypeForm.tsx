import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

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
import {
  shotTypeFormSchema,
  type ShotTypeFormValues,
} from "@/features/admin/shot-types/schemas/shot-type.schema"

interface ShotTypeFormProps {
  defaultValues?: Partial<ShotTypeFormValues>
  onSubmit: (values: ShotTypeFormValues) => void
  isSubmitting?: boolean
}

const DEFAULT_FORM_VALUES: ShotTypeFormValues = {
  name: "",
  intent: "pdp", // Defaulting to one of the valid enum options
  framing_prompt_block: "",
}

export function ShotTypeForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: ShotTypeFormProps) {
  const form = useForm<ShotTypeFormValues>({
    resolver: zodResolver(shotTypeFormSchema),
    defaultValues: defaultValues ?? DEFAULT_FORM_VALUES,
  })

  // Reset form when defaultValues changes (e.g., when switching between Edit and Create in the same sheet)
  useEffect(() => {
    form.reset(defaultValues ?? DEFAULT_FORM_VALUES)
  }, [defaultValues, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shot Type Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Front Angle" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="intent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intent</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select intent" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pdp">PDP</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="framing_prompt_block"
          render={({ field }) => (
            <FormItem>
              <PromptBlockEditor
                label="Framing Prompt Block"
                placeholder="e.g. The camera is positioned directly in front of the object..."
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Shot Type"}
        </Button>
      </form>
    </Form>
  )
}
