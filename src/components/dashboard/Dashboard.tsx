
import { FileText, DollarSign, Clock, AlertTriangle, TrendingUp, Users, Award, Calendar } from 'lucide-react';
import StatCard from './StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
      color: 'text-blue-600',
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Valor Total',
      value: totalValue > 1000000 ? `R$ ${(totalValue / 1000000).toFixed(1)}M` : `R$ ${(totalValue / 1000).toFixed(0)}K`,
      icon: DollarSign,
      color: 'text-green-600',
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Vencendo em 30 dias',
      value: expiringContracts,
      icon: Clock,
      color: 'text-yellow-600',
      trend: { value: 3, isPositive: false }
    },
    {
      title: 'Alertas Críticos',
      value: alertsPendentes,
      icon: AlertTriangle,
      color: 'text-red-600',
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
    <div className="space-y-6">
      {/* Cards de Estatísticas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Métricas Secundárias */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">Por contrato</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contratos</CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts.length}</div>
            <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modalidade Preferida</CardTitle>
            <Award className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {Object.entries(contractsByModality).sort(([,a], [,b]) => b - a)[0]?.[0]?.replace('_', ' ') || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.entries(contractsByModality).sort(([,a], [,b]) => b - a)[0]?.[1] || 0} contratos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredContracts}</div>
            <p className="text-xs text-muted-foreground">Precisam de atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Gráficos e Análises */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Execução Orçamentária</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Orçamento Executado</span>
                <span className="font-medium">{orcamentoExecutado.toFixed(1)}%</span>
              </div>
              <Progress value={orcamentoExecutado} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">
                R$ {totalValue.toLocaleString('pt-BR')} de R$ {orcamentoAnual.toLocaleString('pt-BR')}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Contratos Vigentes</span>
                <span className="font-medium">{contratosVigentesPercent.toFixed(0)}%</span>
              </div>
              <Progress value={contratosVigentesPercent} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {activeContracts} de {contracts.length} contratos
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Modalidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(contractsByModality)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([modalidade, count]) => (
                <div key={modalidade} className="flex justify-between items-center">
                  <span className="text-sm capitalize font-medium">
                    {modalidade.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{count}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(count / contracts.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(contractsByModality).length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status dos Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(contractsByStatus)
                .sort(([,a], [,b]) => b - a)
                .map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        status === 'vigente' ? 'default' : 
                        status === 'suspenso' ? 'secondary' : 
                        'destructive'
                      }
                      className="text-xs"
                    >
                      {status}
                    </Badge>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
              {Object.keys(contractsByStatus).length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Contratos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contratos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentContracts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum contrato cadastrado ainda</p>
            ) : (
              <div className="space-y-3">
                {recentContracts.map((contract, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{contract.numero}</p>
                      <p className="text-xs text-gray-600 mb-1">{contract.objeto}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {contract.modalidade.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Vence: {contract.vencimento}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        R$ {contract.valor.toLocaleString('pt-BR')}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
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
                        {contract.diasVencimento <= 30 && contract.diasVencimento > 0 && (
                          <Badge variant="outline" className="text-xs text-orange-600">
                            {contract.diasVencimento}d
                          </Badge>
                        )}
                        {contract.diasVencimento <= 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Vencido
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maiores Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            {topValueContracts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum contrato cadastrado ainda</p>
            ) : (
              <div className="space-y-3">
                {topValueContracts.map((contract, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{contract.numero}</p>
                        <p className="text-xs text-gray-600">
                          {contract.objeto.length > 40 ? contract.objeto.substring(0, 40) + '...' : contract.objeto}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">
                        R$ {contract.valor.toLocaleString('pt-BR')}
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
