
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Building, FileText, Users, Settings } from "lucide-react";

export function AppSidebar({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) {
  const items = [
    { id: "dashboard", title: "Dashboard", icon: Building },
    { id: "contracts", title: "Contratos", icon: FileText },
    { id: "suppliers", title: "Fornecedores", icon: Users },
    { id: "settings", title: "Configurações", icon: Settings },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>SGL</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild>
                    <button
                      className={`w-full flex items-center gap-2 py-2 px-2 rounded hover:bg-muted transition ${
                        activeTab === item.id ? "bg-muted font-semibold" : ""
                      }`}
                      onClick={() => onTabChange(item.id)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
