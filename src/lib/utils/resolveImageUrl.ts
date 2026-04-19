import { env } from "@/lib/env"

export function resolveImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl
  }
  return `${new URL(env.NEXT_PUBLIC_API_URL).origin}${imageUrl}`
}
