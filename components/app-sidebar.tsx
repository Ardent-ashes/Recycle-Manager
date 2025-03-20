

import { Calendar, Home, Inbox, Search, Factory, Truck, Contact } from "lucide-react"

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
    title: "Details Info",
    url: "http://localhost:3000/protected/Info",
    icon: Search,
  },
  {
    title: "Garbage Collection",
    url: "http://localhost:3000/protected/Garbage",
    icon: Inbox,
  },
  {
    title: "Transportation Management",
    url: "http://localhost:3000/protected/Vehicle",
    icon: Truck,
  },
  {
    title: "Recycle Process",
    url: "http://localhost:3000/protected/Recycle",
    icon: Factory,
  },
  {
    title: "Summary Reports",
    url: "http://localhost:3000/protected/Report",
    icon: Calendar,
  },
  {
    title: "Contact Us",
    url: "http://localhost:3000/protected/ContactUs",
    icon: Contact,
  },
  
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
        <SidebarGroupLabel 
            style={{ 
              color: '#006400',
              fontSize: '28px',  // Increased font size
              fontWeight: 'bold', // Made text bold
              padding: '20px',    // Added some padding
              letterSpacing: '1px' // Optional: adds some spacing between letters
            }}
          >
            ReSync
          </SidebarGroupLabel>
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
