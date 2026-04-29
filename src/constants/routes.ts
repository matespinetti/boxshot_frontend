export const ROUTES = {
  login: "/login",
  generate: "/generate",
  jobs: "/jobs",
  job: (id: string) => `/jobs/${id}`,
  admin: {
    root: "/admin",
    products: "/admin/products",
    colours: "/admin/colours",
    countries: "/admin/countries",
    shotTypes: "/admin/shot-types",
    installationTypes: "/admin/installation-types",
    surfaceTypes: "/admin/surface-types",
    promptTemplates: "/admin/prompt-templates",
    overrides: "/admin/overrides",
  },
} as const
