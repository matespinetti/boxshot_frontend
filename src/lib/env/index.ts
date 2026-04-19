import { z } from "zod"

const schema = z.object({
  NEXT_PUBLIC_API_URL: z.string().min(1, "NEXT_PUBLIC_API_URL is required"),
})

export const env = schema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
})
