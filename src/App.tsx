
import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from '@/components/layout/Navbar';
import Dashboard from '@/components/dashboard/Dashboard';
import ContractManager from '@/components/contracts/ContractManager';
import { Contract } from '@/types/contract';

const queryClient = new QueryClient();

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contracts, setContracts] = useState<Contract[]>([]);

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
        return <div className="p-8 text-center text-gray-500">Módulo de Configurações em desenvolvimento</div>;
      default:
        return <Dashboard contracts={contracts} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {renderContent()}
          </main>
        </div>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
