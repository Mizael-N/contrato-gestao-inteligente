
import { useContracts } from '@/hooks/useContracts';
import Dashboard from '@/components/dashboard/Dashboard';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { contracts, loading: contractsLoading } = useContracts();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral dos contratos e métricas importantes
        </p>
      </div>
      
      <Dashboard 
        contracts={contracts || []} 
        loading={contractsLoading} 
      />
    </div>
  );
};

export default Index;
