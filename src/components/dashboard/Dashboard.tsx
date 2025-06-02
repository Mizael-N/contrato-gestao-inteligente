
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
  
  // Calcular contratos vencendo em 30 dias
  const today = new Date();
  const expiringContracts = contracts.filter(contract => {
    if (contract.status !== 'vigente') return false;
    
    const signatureDate = new Date(contract.dataAssinatura);
    const expirationDate = new Date(signatureDate);
    
    // Calcular data de vencimento baseada na unidade
    if (contract.prazoUnidade === 'meses') {
      expirationDate.setMonth(expirationDate.getMonth() + contract.prazoExecucao);
    } else if (contract.prazoUnidade === 'anos') {
      expirationDate.setFullYear(expirationDate.getFullYear() + contract.prazoExecucao);
    } else {
      expirationDate.setDate(expirationDate.getDate() + contract.prazoExecucao);
    }
    
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 30 && daysUntilExpiration > 0;
  }).length;

  // Calcular alertas pendentes (contratos vencidos + vencendo)
  const expiredContracts = contracts.filter(contract => {
    if (contract.status !== 'vigente') return false;
    
    const signatureDate = new Date(contract.dataAssinatura);
    const expirationDate = new Date(signatureDate);
    
    if (contract.prazoUnidade === 'meses') {
      expirationDate.setMonth(expirationDate.getMonth() + contract.prazoExecucao);
    } else if (contract.prazoUnidade === 'anos') {
      expirationDate.setFullYear(expirationDate.getFullYear() + contract.prazoExecucao);
    } else {
      expirationDate.setDate(expirationDate.getDate() + contract.prazoExecucao);
    }
    
    return expirationDate < today;
  }).length;

  const alertsPendentes = expiringContracts + expiredContracts;

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
    .slice(0, 3)
    .map(contract => ({
      numero: contract.numero,
      objeto: contract.objeto.length > 40 ? contract.objeto.substring(0, 40) + '...' : contract.objeto,
      valor: `R$ ${contract.valor.toLocaleString('pt-BR')}`,
      status: contract.status === 'vigente' ? 'Vigente' : 
               contract.status === 'suspenso' ? 'Suspenso' :
               contract.status === 'encerrado' ? 'Encerrado' : 'Rescindido'
    }));

  // Calcular progresso orçamentário (simulado)
  const orcamentoExecutado = Math.min((totalValue / 50000000) * 100, 100); // Base de 50M
  const contratosVigentesPercent = contracts.length > 0 ? (activeContracts / contracts.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Execução Orçamentária</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Orçamento Executado</span>
                <span>{orcamentoExecutado.toFixed(0)}%</span>
              </div>
              <Progress value={orcamentoExecutado} className="mt-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Contratos Vigentes</span>
                <span>{contratosVigentesPercent.toFixed(0)}%</span>
              </div>
              <Progress value={contratosVigentesPercent} className="mt-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Metas de Economia</span>
                <span>42%</span>
              </div>
              <Progress value={42} className="mt-2" />
            </div>
          </CardContent>
        </Card>

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
                    <div>
                      <p className="font-medium">{contract.numero}</p>
                      <p className="text-sm text-gray-600">{contract.objeto}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{contract.valor}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        contract.status === 'Vigente' ? 'bg-green-100 text-green-800' : 
                        contract.status === 'Suspenso' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {contract.status}
                      </span>
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
