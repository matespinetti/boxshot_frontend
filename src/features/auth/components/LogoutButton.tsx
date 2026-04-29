"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { ROUTES } from "@/constants/routes"
import { logout } from "@/features/auth/api/auth"

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.replace(ROUTES.login)
    router.refresh()
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton className="h-9 rounded-lg" onClick={handleLogout}>
        <LogOut className="size-4" />
        <span>Log out</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
