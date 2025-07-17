
import { FileText, DollarSign, Clock, AlertTriangle, TrendingUp, Users, Award, Calendar } from 'lucide-react';
import StatCard from './StatCard';
import MetricsGrid from './charts/MetricsGrid';
import InteractiveCharts from './charts/InteractiveCharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Contract } from '@/types/contract';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardProps {
  contracts?: Contract[];
  loading?: boolean;
}

export default function Dashboard({ contracts = [], loading = false }: DashboardProps) {
  console.log('📊 Dashboard - Rendering with contracts:', contracts.length, 'loading:', loading);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px] mb-2" />
                <Skeleton className="h-3 w-[120px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-[100px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Calcular estatísticas baseadas nos contratos reais
  const activeContracts = contracts.filter(c => c.status === 'vigente').length;
  const totalValue = contracts.reduce((sum, c) => sum + (c.valor || 0), 0);
  
  // Função para calcular data de vencimento de um contrato
  const getContractExpirationDate = (contract: Contract): Date => {
    const signatureDate = new Date(contract.dataAssinatura);
    const expirationDate = new Date(signatureDate);
    
    const prazo = contract.prazoExecucao || 0;
    const unidade = contract.prazoUnidade || 'dias';
    
    switch (unidade) {
      case 'anos':
        expirationDate.setFullYear(expirationDate.getFullYear() + prazo);
        break;
      case 'meses':
        expirationDate.setMonth(expirationDate.getMonth() + prazo);
        break;
      default: 
        expirationDate.setDate(expirationDate.getDate() + prazo);
        break;
    }
    
    return expirationDate;
  };
  
  // Calcular contratos vencendo em 30 dias
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  const expiringContracts = contracts.filter(contract => {
    if (contract.status !== 'vigente') return false;
    
    const expirationDate = getContractExpirationDate(contract);
    return expirationDate <= thirtyDaysFromNow && expirationDate > today;
  }).length;

  // Calcular contratos vencidos
  const expiredContracts = contracts.filter(contract => {
    if (contract.status !== 'vigente') return false;
    
    const expirationDate = getContractExpirationDate(contract);
    return expirationDate <= today;
  }).length;

  const alertsPendentes = expiringContracts + expiredContracts;

  // Calcular valor médio dos contratos
  const averageValue = contracts.length > 0 ? totalValue / contracts.length : 0;

  // Calcular contratos por modalidade
  const contractsByModality = contracts.reduce((acc, contract) => {
    acc[contract.modalidade] = (acc[contract.modalidade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calcular contratos por status
  const contractsByStatus = contracts.reduce((acc, contract) => {
    acc[contract.status] = (acc[contract.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Contratos com maior valor
  const topValueContracts = [...contracts]
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  const stats = [
    {
      title: 'Contratos Ativos',
      value: activeContracts,
      icon: FileText,
      color: 'text-white',
      gradient: 'bg-gradient-primary',
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Valor Total',
      value: totalValue > 1000000 ? `R$ ${(totalValue / 1000000).toFixed(1)}M` : `R$ ${(totalValue / 1000).toFixed(0)}K`,
      icon: DollarSign,
      color: 'text-white',
      gradient: 'bg-gradient-secondary',
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Vencendo em 30 dias',
      value: expiringContracts,
      icon: Clock,
      color: 'text-white',
      gradient: 'bg-gradient-accent',
      trend: { value: 3, isPositive: false }
    },
    {
      title: 'Alertas Críticos',
      value: alertsPendentes,
      icon: AlertTriangle,
      color: 'text-white',
      gradient: 'bg-red-500',
      trend: { value: 15, isPositive: false }
    }
  ];

  // Últimos contratos cadastrados
  const recentContracts = contracts
    .sort((a, b) => new Date(b.dataAssinatura).getTime() - new Date(a.dataAssinatura).getTime())
    .slice(0, 5)
    .map(contract => {
      const expirationDate = getContractExpirationDate(contract);
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        numero: contract.numero,
        objeto: contract.objeto.length > 50 ? contract.objeto.substring(0, 50) + '...' : contract.objeto,
        valor: contract.valor,
        status: contract.status,
        diasVencimento: daysUntilExpiration,
        vencimento: expirationDate.toLocaleDateString('pt-BR'),
        modalidade: contract.modalidade
      };
    });

  // Calcular progresso orçamentário 
  const orcamentoAnual = 100000000; // R$ 100M
  const orcamentoExecutado = Math.min((totalValue / orcamentoAnual) * 100, 100);
  const contratosVigentesPercent = contracts.length > 0 ? (activeContracts / contracts.length) * 100 : 0;

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-background to-muted/30 min-h-screen">
      {/* Header com gradiente */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Dashboard de Contratos
        </h1>
        <p className="text-muted-foreground text-lg">
          Visão geral e análise dos seus contratos públicos
        </p>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Métricas Secundárias Modernas */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Médio</CardTitle>
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              R$ {averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Por contrato</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Contratos</CardTitle>
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{contracts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Modalidade Preferida</CardTitle>
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <Award className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize tracking-tight">
              {Object.entries(contractsByModality).sort(([,a], [,b]) => b - a)[0]?.[0]?.replace('_', ' ') || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Object.entries(contractsByModality).sort(([,a], [,b]) => b - a)[0]?.[1] || 0} contratos
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vencidos</CardTitle>
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
              <Calendar className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 tracking-tight">{expiredContracts}</div>
            <p className="text-xs text-muted-foreground mt-1">Precisam de atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Grid */}
      <MetricsGrid contracts={contracts} />

      {/* Gráficos Interativos */}
      <InteractiveCharts contracts={contracts} />

      {/* Seção de Contratos Compacta */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-6 bg-gradient-primary rounded-full"></div>
              Contratos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentContracts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum contrato cadastrado ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentContracts.slice(0, 3).map((contract, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-card/50 hover:bg-card transition-all duration-200 hover:shadow-md">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{contract.numero}</p>
                      <p className="text-xs text-muted-foreground mb-2">{contract.objeto}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {contract.modalidade.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">
                        R$ {(contract.valor / 1000).toFixed(0)}K
                      </p>
                      <Badge 
                        variant={
                          contract.status === 'vigente' ? 'default' : 
                          contract.status === 'suspenso' ? 'secondary' : 
                          'destructive'
                        }
                        className="text-xs mt-1"
                      >
                        {contract.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-6 bg-gradient-secondary rounded-full"></div>
              Maiores Contratos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topValueContracts.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum contrato cadastrado ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topValueContracts.slice(0, 3).map((contract, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-card/50 hover:bg-card transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{contract.numero}</p>
                        <p className="text-xs text-muted-foreground">
                          {contract.objeto.length > 30 ? contract.objeto.substring(0, 30) + '...' : contract.objeto}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        R$ {(contract.valor / 1000000).toFixed(1)}M
                      </p>
                      <Badge 
                        variant={
                          contract.status === 'vigente' ? 'default' : 
                          contract.status === 'suspenso' ? 'secondary' : 
                          'destructive'
                        }
                        className="text-xs"
                      >
                        {contract.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
