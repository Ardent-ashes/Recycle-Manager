

import { Calendar, Home, Inbox, Search, Factory, Truck } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Home",
    url: "http://localhost:3000/protected",
    icon: Home,
  },
  {
    title: "Garbage Collection",
    url: "http://localhost:3000/protected/Garbage",
    icon: Inbox,
  },
  {
    title: "Routing Management",
    url: "http://localhost:3000/protected/Vehicle",
    icon: Truck,
  },
  {
    title: "Recycle Process",
    url: "http://localhost:3000/protected/Recycle",
    icon: Factory,
  },
  {
    title: "Reports",
    url: "http://localhost:3000/protected/Report",
    icon: Calendar,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
