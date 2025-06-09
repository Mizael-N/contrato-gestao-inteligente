
import { FileText, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import StatCard from './StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Contract } from '@/types/contract';

interface DashboardProps {
  contracts?: Contract[];
}

export default function Dashboard({ contracts = [] }: DashboardProps) {
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
      default: // dias
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

  // Calcular estatísticas por modalidade
  const contractsByModality = contracts.reduce((acc, contract) => {
    acc[contract.modalidade] = (acc[contract.modalidade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calcular estatísticas por status
  const contractsByStatus = contracts.reduce((acc, contract) => {
    acc[contract.status] = (acc[contract.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    {
      title: 'Contratos Ativos',
      value: activeContracts,
      icon: FileText,
      color: 'text-blue-600',
      trend: { value: 0, isPositive: true }
    },
    {
      title: 'Valor Total',
      value: `R$ ${(totalValue / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      color: 'text-green-600',
      trend: { value: 0, isPositive: true }
    },
    {
      title: 'Contratos Vencendo',
      value: expiringContracts,
      icon: Clock,
      color: 'text-yellow-600',
      trend: { value: 0, isPositive: false }
    },
    {
      title: 'Alertas Pendentes',
      value: alertsPendentes,
      icon: AlertTriangle,
      color: 'text-red-600',
      trend: { value: 0, isPositive: false }
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
        objeto: contract.objeto.length > 40 ? contract.objeto.substring(0, 40) + '...' : contract.objeto,
        valor: `R$ ${contract.valor.toLocaleString('pt-BR')}`,
        status: contract.status === 'vigente' ? 'Vigente' : 
                 contract.status === 'suspenso' ? 'Suspenso' :
                 contract.status === 'encerrado' ? 'Encerrado' : 'Rescindido',
        diasVencimento: daysUntilExpiration,
        vencimento: expirationDate.toLocaleDateString('pt-BR')
      };
    });

  // Calcular progresso orçamentário (simulado)
  const orcamentoAnual = 50000000; // R$ 50M
  const orcamentoExecutado = Math.min((totalValue / orcamentoAnual) * 100, 100);
  const contratosVigentesPercent = contracts.length > 0 ? (activeContracts / contracts.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Execução Orçamentária</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Orçamento Executado</span>
                <span>{orcamentoExecutado.toFixed(1)}%</span>
              </div>
              <Progress value={orcamentoExecutado} className="mt-2" />
              <div className="text-xs text-muted-foreground mt-1">
                R$ {totalValue.toLocaleString('pt-BR')} de R$ {orcamentoAnual.toLocaleString('pt-BR')}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Contratos Vigentes</span>
                <span>{contratosVigentesPercent.toFixed(0)}%</span>
              </div>
              <Progress value={contratosVigentesPercent} className="mt-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {activeContracts} de {contracts.length} contratos
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por Modalidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(contractsByModality).map(([modalidade, count]) => (
                <div key={modalidade} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{modalidade.replace('_', ' ')}</span>
                  <span className="font-medium">{count}</span>
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
            <CardTitle>Por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(contractsByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{status}</span>
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
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{contract.numero}</p>
                    <p className="text-sm text-gray-600">{contract.objeto}</p>
                    <p className="text-xs text-gray-500">Vence em: {contract.vencimento}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{contract.valor}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        contract.status === 'Vigente' ? 'bg-green-100 text-green-800' : 
                        contract.status === 'Suspenso' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {contract.status}
                      </span>
                      {contract.diasVencimento <= 30 && contract.diasVencimento > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                          {contract.diasVencimento}d
                        </span>
                      )}
                      {contract.diasVencimento <= 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                          Vencido
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
