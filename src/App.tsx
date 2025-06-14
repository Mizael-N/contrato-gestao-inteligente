import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from '@/components/layout/Navbar';
import Dashboard from '@/components/dashboard/Dashboard';
import ContractManager from '@/components/contracts/ContractManager';
import Settings from '@/components/settings/Settings';
import { Contract } from '@/types/contract';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

// LOG para debug de atualização do App
console.log("[App] Component file loaded");

const queryClient = new QueryClient();

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    console.log("[App] Mounted. activeTab:", activeTab, "contracts.length:", contracts.length);
    // Verifica se root existe
    const rootDiv = document.getElementById("root");
    if (!rootDiv) {
      console.error("[App] Elemento 'root' NÃO encontrado no DOM!");
    } else {
      console.log("[App] Elemento 'root' encontrado. App montando normalmente.");
    }
  }, [activeTab, contracts]);

  const handleContractsChange = (newContracts: Contract[]) => {
    console.log('Contracts updated in App:', newContracts);
    setContracts(newContracts);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard contracts={contracts} />;
      case 'contracts':
        return <ContractManager contracts={contracts} onContractsChange={handleContractsChange} />;
      case 'suppliers':
        return <div className="p-8 text-center text-gray-500">Módulo de Fornecedores em desenvolvimento</div>;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard contracts={contracts} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1 flex flex-col">
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 w-full">
              {renderContent() || (
                <div className="text-center text-gray-400">
                  Nenhum conteúdo para mostrar no momento.
                </div>
              )}
            </main>
          </div>
          <Toaster />
          <Sonner />
        </div>
      </SidebarProvider>
    </QueryClientProvider>
  );
};

export default App;
