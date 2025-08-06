
import { useMemo } from 'react';
import { Contract } from '@/types/contract';
import DashboardStats from './DashboardStats';
import DashboardCharts from './DashboardCharts';
import DashboardSummary from './DashboardSummary';
import DashboardHeader from './DashboardHeader';

interface DashboardProps {
  contracts: Contract[];
  loading?: boolean;
}

export default function Dashboard({ contracts, loading }: DashboardProps) {
  const stats = useMemo(() => {
    const validContracts = contracts.filter(contract => 
      contract && 
      contract.dataInicio && 
      typeof contract.valor === 'number' && 
      contract.status
    );

    if (!validContracts.length) {
      return {
        total: 0,
        totalValue: 0,
        active: 0,
        expiringSoon: 0,
        averageValue: 0
      };
    }

    const total = validContracts.length;
    const totalValue = validContracts.reduce((sum, contract) => sum + (contract.valor || 0), 0);
    const active = validContracts.filter(contract => contract.status === 'vigente').length;
    const averageValue = total > 0 ? totalValue / total : 0;
    
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const expiringSoon = validContracts.filter(contract => {
      if (contract.status !== 'vigente') return false;
      
      try {
        let endDate: Date;
        if (contract.dataTermino) {
          endDate = new Date(contract.dataTermino);
        } else if (contract.dataInicio && contract.prazoExecucao) {
          endDate = new Date(contract.dataInicio);
          const prazo = contract.prazoExecucao || 0;
          const unidade = contract.prazoUnidade || 'dias';
          
          if (unidade === 'anos') {
            endDate.setFullYear(endDate.getFullYear() + prazo);
          } else if (unidade === 'meses') {
            endDate.setMonth(endDate.getMonth() + prazo);
          } else {
            endDate.setDate(endDate.getDate() + prazo);
          }
        } else {
          return false;
        }
        
        if (isNaN(endDate.getTime())) return false;
        return endDate <= thirtyDaysFromNow && endDate > today;
      } catch (error) {
        console.warn('Error calculating contract expiration:', error);
        return false;
      }
    }).length;

    return { total, totalValue, active, expiringSoon, averageValue };
  }, [contracts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-lg font-medium text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <DashboardHeader stats={stats} />
      
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-8">
          <DashboardStats contracts={contracts} stats={stats} />
          <DashboardCharts contracts={contracts} />
        </div>
        
        {/* Sidebar */}
        <div className="xl:col-span-1">
          <DashboardSummary contracts={contracts} stats={stats} />
        </div>
      </div>
    </div>
  );
}
