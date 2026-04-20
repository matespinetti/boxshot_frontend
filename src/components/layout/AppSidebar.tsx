"use client"

import type { LucideIcon } from "lucide-react"
import {
  Box,
  Camera,
  FileText,
  Globe,
  Images,
  Package,
  Palette,
  SlidersHorizontal,
  Sparkles,
  Wrench,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ROUTES } from "@/constants/routes"

interface NavLink {
  label: string
  href: string
  icon: LucideIcon
}

const generateLink: NavLink = {
  label: "Generate",
  href: ROUTES.generate,
  icon: Sparkles,
}

const jobsLink: NavLink = {
  label: "Jobs",
  href: ROUTES.jobs,
  icon: Images,
}

const adminLinks: NavLink[] = [
  { label: "Products", href: ROUTES.admin.products, icon: Package },
  { label: "Colours / RAL", href: ROUTES.admin.colours, icon: Palette },
  { label: "Countries", href: ROUTES.admin.countries, icon: Globe },
  { label: "Shot Types", href: ROUTES.admin.shotTypes, icon: Camera },
  {
    label: "Installation Types",
    href: ROUTES.admin.installationTypes,
    icon: Wrench,
  },
  {
    label: "Surface Types",
    href: ROUTES.admin.surfaceTypes,
    icon: Wrench,
  },
  {
    label: "Prompt Templates",
    href: ROUTES.admin.promptTemplates,
    icon: FileText,
  },
  {
    label: "Prompt Overrides",
    href: ROUTES.admin.overrides,
    icon: SlidersHorizontal,
  },
]

function getActiveProps(isActive: boolean) {
  return isActive ? { "data-active": "true" } : {}
}

export function AppSidebar() {
  const pathname = usePathname()
  const isGenerateActive = pathname === generateLink.href
  const isJobsActive =
    pathname === jobsLink.href || pathname.startsWith(`${jobsLink.href}/`)
  const GenerateIcon = generateLink.icon
  const JobsIcon = jobsLink.icon

  return (
    <Sidebar>
      <SidebarContent className="gap-4 p-3">
        <SidebarGroup className="gap-3 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/20 p-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-sidebar-primary/10 p-2 text-sidebar-primary">
              <Box className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight">ParcelFlow</p>
              <p className="text-xs text-muted-foreground">Image operations</p>
            </div>
          </div>

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isGenerateActive}
                className="h-9 rounded-lg"
                render={
                  <Link
                    href={generateLink.href}
                    {...getActiveProps(isGenerateActive)}
                  />
                }
              >
                <GenerateIcon className="size-4" />
                <span>{generateLink.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isJobsActive}
                className="h-9 rounded-lg"
                render={
                  <Link href={jobsLink.href} {...getActiveProps(isJobsActive)} />
                }
              >
                <JobsIcon className="size-4" />
                <span>{jobsLink.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="gap-2">
          <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground/90">
            Admin
          </SidebarGroupLabel>
          <SidebarMenu>
            {adminLinks.map((link) => {
              const isActive = pathname.startsWith(link.href)
              const Icon = link.icon

              return (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton
                    isActive={isActive}
                    className="h-9 rounded-lg"
                    render={
                      <Link href={link.href} {...getActiveProps(isActive)} />
                    }
                  >
                    <Icon className="size-4" />
                    <span>{link.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
