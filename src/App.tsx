
import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from '@/components/layout/Navbar';
import Dashboard from '@/components/dashboard/Dashboard';
import ContractManagerWrapper from '@/components/contracts/ContractManagerWrapper';

const queryClient = new QueryClient();

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contracts, setContracts] = useState([]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard contracts={contracts} />;
      case 'contracts':
        return <ContractManagerWrapper onContractsChange={setContracts} />;
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
