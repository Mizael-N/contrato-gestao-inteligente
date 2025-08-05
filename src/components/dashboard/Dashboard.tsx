
import { useMemo } from 'react';
import StatCard from './StatCard';
import MetricsGrid from './charts/MetricsGrid';
import InteractiveCharts from './charts/InteractiveCharts';
import { Contract } from '@/types/contract';
import { FileText, DollarSign, Clock, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  contracts: Contract[];
  loading?: boolean;
}

export default function Dashboard({ contracts, loading }: DashboardProps) {
  const stats = useMemo(() => {
    if (!contracts.length) {
      return {
        total: 0,
        totalValue: 0,
        active: 0,
        expiringSoon: 0
      };
    }

    const total = contracts.length;
    const totalValue = contracts.reduce((sum, contract) => sum + contract.valor, 0);
    const active = contracts.filter(contract => contract.status === 'vigente').length;
    
    // Calcular contratos que vencem em 30 dias
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const expiringSoon = contracts.filter(contract => {
      if (contract.status !== 'vigente') return false;
      
      // Calcular data de vencimento baseada na data de início + prazo
      const endDate = new Date(contract.dataInicio);
      if (contract.prazoUnidade === 'anos') {
        endDate.setFullYear(endDate.getFullYear() + contract.prazoExecucao);
      } else if (contract.prazoUnidade === 'meses') {
        endDate.setMonth(endDate.getMonth() + contract.prazoExecucao);
      } else {
        endDate.setDate(endDate.getDate() + contract.prazoExecucao);
      }
      
      return endDate <= thirtyDaysFromNow && endDate > today;
    }).length;

    return { total, totalValue, active, expiringSoon };
  }, [contracts]);

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Contratos"
          value={stats.total.toString()}
          icon={FileText}
          trend={{ value: 12, isPositive: true }}
          color="text-blue-600"
          gradient="bg-blue-100"
          loading={loading}
        />
        <StatCard
          title="Valor Total"
          value={`R$ ${(stats.totalValue / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          trend={{ value: 8, isPositive: true }}
          color="text-green-600"
          gradient="bg-green-100"
          loading={loading}
        />
        <StatCard
          title="Contratos Ativos"
          value={stats.active.toString()}
          icon={Clock}
          trend={{ value: Math.round((stats.active / Math.max(stats.total, 1)) * 100), isPositive: true }}
          color="text-orange-600"
          gradient="bg-orange-100"
          loading={loading}
        />
        <StatCard
          title="Vencendo em 30 dias"
          value={stats.expiringSoon.toString()}
          icon={AlertTriangle}
          trend={{ value: stats.expiringSoon, isPositive: false }}
          color={stats.expiringSoon > 0 ? "text-red-600" : "text-gray-600"}
          gradient={stats.expiringSoon > 0 ? "bg-red-100" : "bg-gray-100"}
          loading={loading}
        />
      </div>

      {/* Métricas e Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MetricsGrid contracts={contracts} />
        </div>
        <div className="space-y-6">
          {/* Resumo por Status */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">Status dos Contratos</h3>
            <div className="space-y-3">
              {[
                { status: 'vigente', label: 'Vigente', color: 'bg-green-500' },
                { status: 'suspenso', label: 'Suspenso', color: 'bg-yellow-500' },
                { status: 'encerrado', label: 'Encerrado', color: 'bg-gray-500' },
                { status: 'rescindido', label: 'Rescindido', color: 'bg-red-500' }
              ].map(({ status, label, color }) => {
                const count = contracts.filter(c => c.status === status).length;
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${color}`}></div>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {count} ({percentage.toFixed(0)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contratos por Modalidade */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">Por Modalidade</h3>
            <div className="space-y-3">
              {Object.entries(
                contracts.reduce((acc, contract) => {
                  acc[contract.modalidade] = (acc[contract.modalidade] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([modalidade, count]) => {
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                const label = modalidade.replace('_', ' ').charAt(0).toUpperCase() + 
                             modalidade.replace('_', ' ').slice(1);
                
                return (
                  <div key={modalidade} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    <div className="text-sm text-gray-500">
                      {count} ({percentage.toFixed(0)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Valor por Mês */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">Contratos por Mês</h3>
            <div className="space-y-3">
              {Object.entries(
                contracts.reduce((acc, contract) => {
                  const month = new Date(contract.dataInicio).toLocaleDateString('pt-BR', { 
                    month: 'short', 
                    year: 'numeric' 
                  });
                  acc[month] = (acc[month] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              )
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .slice(-6)
              .map(([month, count]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{month}</span>
                  <span className="text-sm text-gray-500">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos Interativos */}
      <InteractiveCharts contracts={contracts} />
    </div>
  );
}
