"use client"

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

const adminLinks = [
  { label: "Products", href: ROUTES.admin.products },
  { label: "Colours / RAL", href: ROUTES.admin.colours },
  { label: "Countries", href: ROUTES.admin.countries },
  { label: "Shot Types", href: ROUTES.admin.shotTypes },
  { label: "Installation Types", href: ROUTES.admin.installationTypes },
  { label: "Prompt Templates", href: ROUTES.admin.promptTemplates },
  { label: "Prompt Overrides", href: ROUTES.admin.overrides },
] as const

function getActiveProps(isActive: boolean) {
  return isActive ? { "data-active": "true" } : {}
}

export function AppSidebar() {
  const pathname = usePathname()
  const isGenerateActive = pathname === ROUTES.generate

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-2 py-3">
            <span className="text-sm font-semibold tracking-tight">
              ParcelFlow
            </span>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isGenerateActive}
                render={<Link href={ROUTES.generate} {...getActiveProps(isGenerateActive)} />}
              >
                Generate
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarMenu>
            {adminLinks.map((link) => {
              const isActive = pathname.startsWith(link.href)

              return (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton
                    isActive={isActive}
                    render={
                      <Link href={link.href} {...getActiveProps(isActive)} />
                    }
                  >
                    {link.label}
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
