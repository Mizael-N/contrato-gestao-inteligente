
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Menu, FileText, Home, Settings, Users, Shield, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import UserMenu from '@/components/layout/UserMenu';
import ThemeToggle from '@/components/layout/ThemeToggle';
import NotificationCenter from '@/components/notifications/NotificationCenter';

interface MobileNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MobileNavbar({ activeTab, onTabChange }: MobileNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  if (!user) return null;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'contracts', label: 'Contratos', icon: FileText },
    { id: 'suppliers', label: 'Fornecedores', icon: Users },
    ...(isAdmin ? [{ id: 'users', label: 'Usuários', icon: Shield }] : []),
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Header fixo no mobile */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b md:hidden">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="flex flex-col h-full">
                  {/* Header do menu */}
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        SGL
                        {isAdmin && (
                          <Badge variant="secondary" className="text-xs">
                            ADMIN
                          </Badge>
                        )}
                      </h2>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="flex-1 py-4">
                    <nav className="space-y-1 px-3">
                      {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <Button
                            key={tab.id}
                            variant={isActive ? "secondary" : "ghost"}
                            className="w-full justify-start gap-3 h-12"
                            onClick={() => handleTabChange(tab.id)}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{tab.label}</span>
                          </Button>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Footer com informações do usuário */}
                  <div className="border-t p-4">
                    <div className="text-sm text-muted-foreground">
                      Logado como:
                    </div>
                    <div className="font-medium truncate">
                      {user.email}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="text-lg font-bold">
              {tabs.find(t => t.id === activeTab)?.label || 'SGL'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <NotificationCenter />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Spacer para compensar o header fixo */}
      <div className="h-14 md:hidden" />
    </>
  );
}
