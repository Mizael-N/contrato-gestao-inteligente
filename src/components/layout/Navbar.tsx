
import { Button } from '@/components/ui/button';
import { FileText, Home, Settings, Users, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const { user, isAdmin } = useAuth();

  console.log('🔍 Navbar - User info:', { 
    hasUser: !!user, 
    isAdmin, 
    email: user?.email,
    timestamp: new Date().toISOString()
  });

  if (!user) return null;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'contracts', label: 'Contratos', icon: FileText },
    { id: 'suppliers', label: 'Fornecedores', icon: Users },
    ...(isAdmin ? [{ id: 'users', label: 'Usuários', icon: Shield }] : []),
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  console.log('🎯 Navbar - Tabs available:', tabs.map(t => t.id), 'isAdmin:', isAdmin);

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                SGL
                {isAdmin && (
                  <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-medium">
                    ADMIN
                  </span>
                )}
              </h1>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    onClick={() => onTabChange(tab.id)}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
