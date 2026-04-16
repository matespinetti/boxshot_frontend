export const ROUTES = {
  generate: "/generate",
  job: (id: string) => `/jobs/${id}`,
  admin: {
    root: "/admin",
    products: "/admin/products",
    colours: "/admin/colours",
    countries: "/admin/countries",
    shotTypes: "/admin/shot-types",
    installationTypes: "/admin/installation-types",
    promptTemplates: "/admin/prompt-templates",
    overrides: "/admin/overrides",
  },
} as const
