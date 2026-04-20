export const generationQueryKeys = {
  products: () => ["generation", "products"] as const,
  colours: () => ["generation", "colours"] as const,
  countries: () => ["generation", "countries"] as const,
  shotTypes: () => ["generation", "shotTypes"] as const,
  installationTypes: () => ["generation", "installationTypes"] as const,
  surfaceTypes: () => ["generation", "surfaceTypes"] as const,
  models: () => ["generation", "models"] as const,
} as const
