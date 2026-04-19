"use client"

import React from "react"
import { cn } from "@/lib/utils/cn"
import { Textarea } from "@/components/ui/textarea"

export interface PromptBlockEditorProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  maxLength?: number
}

export const PromptBlockEditor = React.forwardRef<
  HTMLTextAreaElement,
  PromptBlockEditorProps
>(
  (
    {
      id,
      label,
      value,
      onChange,
      placeholder = "Enter prompt text…",
      maxLength,
      rows = 6,
      className,
      ...props
    },
    ref,
  ) => {
  const count = String(value ?? "").length
  const isOver = maxLength !== undefined && count > maxLength

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium leading-none"
        >
          {label}
        </label>
      )}

      <Textarea
        ref={ref}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={isOver || undefined}
        className="resize-y"
        {...props}
      />

      <p
        className={cn(
          "text-right text-xs tabular-nums",
          isOver ? "text-destructive font-medium" : "text-muted-foreground",
        )}
      >
        {count}
        {maxLength !== undefined && ` / ${maxLength}`}
      </p>
    </div>
  )
})
PromptBlockEditor.displayName = "PromptBlockEditor"
