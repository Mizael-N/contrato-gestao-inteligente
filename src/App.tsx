
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useContracts } from '@/hooks/useContracts';
import Navbar from '@/components/layout/Navbar';
import Dashboard from '@/components/dashboard/Dashboard';
import ContractManager from '@/components/contracts/ContractManager';
import UserManagement from '@/components/users/UserManagement';
import Settings from '@/components/settings/Settings';
import Auth from '@/pages/Auth';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient();

function ProtectedApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const contractsHook = useContracts();

  console.log('🏠 ProtectedApp - Render state:', { 
    hasUser: !!user, 
    loading, 
    activeTab,
    contractsCount: contractsHook.contracts.length,
    contractsLoading: contractsHook.loading,
    timestamp: new Date().toISOString()
  });

  const renderContent = () => {
    console.log('🎨 ProtectedApp - Rendering content for tab:', activeTab);
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard contracts={contractsHook.contracts} loading={contractsHook.loading} />;
      case 'contracts':
        return <ContractManager contracts={contractsHook.contracts} onContractsChange={contractsHook.refetch} />;
      case 'suppliers':
        return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Módulo de Fornecedores em desenvolvimento</div>;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard contracts={contractsHook.contracts} loading={contractsHook.loading} />;
    }
  };

  if (loading) {
    console.log('⏳ ProtectedApp - Showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600 dark:text-gray-300 text-lg">Carregando sistema...</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🚪 ProtectedApp - No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('✅ ProtectedApp - Rendering main app interface');
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
}

const App = () => {
  console.log('🎬 App component initializing at:', new Date().toISOString());
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedApp />} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
            <Toaster />
            <Sonner />
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
