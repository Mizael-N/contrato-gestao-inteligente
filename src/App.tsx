
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { useContracts } from '@/hooks/useContracts';
import { useResponsive } from '@/hooks/useResponsive';
import Navbar from '@/components/layout/Navbar';
import MobileNavbar from '@/components/mobile/MobileNavbar';
import Dashboard from '@/components/dashboard/Dashboard';
import ContractManager from '@/components/contracts/ContractManager';
import UserManagement from '@/components/users/UserManagement';
import Settings from '@/components/settings/Settings';
import Auth from '@/pages/Auth';
import { Loader2 } from 'lucide-react';
import SupplierManager from '@/components/suppliers/SupplierManager';

// Configurar React Query com cache persistente
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedApp() {
  const { user, loading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isMobile } = useResponsive();
  
  const contractsHook = useContracts();

  console.log('🏠 ProtectedApp - Render state:', { 
    hasUser: !!user, 
    loading, 
    activeTab,
    contractsCount: contractsHook.contracts.length,
    contractsLoading: contractsHook.loading,
    isMobile,
    timestamp: new Date().toISOString()
  });

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

  // Se não há usuário autenticado, redirecionar para login
  if (!user) {
    console.log('🚪 ProtectedApp - No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  const renderContent = () => {
    console.log('🎨 ProtectedApp - Rendering content for tab:', activeTab);
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard contracts={contractsHook.contracts} loading={contractsHook.loading} />;
      case 'contracts':
        return <ContractManager contracts={contractsHook.contracts} onContractsChange={contractsHook.refetch} />;
      case 'suppliers':
        return <SupplierManager />;
      case 'users':
        return isAdmin ? <UserManagement /> : <Dashboard contracts={contractsHook.contracts} loading={contractsHook.loading} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard contracts={contractsHook.contracts} loading={contractsHook.loading} />;
    }
  };

  console.log('✅ ProtectedApp - Rendering main app interface');
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar responsiva */}
      {isMobile ? (
        <MobileNavbar activeTab={activeTab} onTabChange={setActiveTab} />
      ) : (
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      )}
      
      {/* Conteúdo principal */}
      <main className={`
        max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8
        ${isMobile ? 'pb-20' : ''}
      `}>
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
          <NotificationProvider>
            <Router>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<ProtectedApp />} />
                <Route path="*" element={<Navigate to="/auth" replace />} />
              </Routes>
              <Toaster />
              <Sonner />
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
