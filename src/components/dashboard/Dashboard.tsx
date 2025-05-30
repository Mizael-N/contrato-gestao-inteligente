
import { FileText, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import StatCard from './StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function Dashboard() {
  const stats = [
    {
      title: 'Contratos Ativos',
      value: 156,
      icon: FileText,
      color: 'text-blue-600',
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Valor Total',
      value: 'R$ 45.2M',
      icon: DollarSign,
      color: 'text-green-600',
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Contratos Vencendo',
      value: 23,
      icon: Clock,
      color: 'text-yellow-600',
      trend: { value: 5, isPositive: false }
    },
    {
      title: 'Alertas Pendentes',
      value: 7,
      icon: AlertTriangle,
      color: 'text-red-600',
      trend: { value: 2, isPositive: false }
    }
  ];

  const recentContracts = [
    { numero: '001/2024', objeto: 'Fornecimento de Material de Escritório', valor: 'R$ 150.000', status: 'Vigente' },
    { numero: '002/2024', objeto: 'Serviços de Limpeza', valor: 'R$ 280.000', status: 'Vigente' },
    { numero: '003/2024', objeto: 'Manutenção de Equipamentos', valor: 'R$ 95.000', status: 'Assinado' },
  ];

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
                <span>68%</span>
              </div>
              <Progress value={68} className="mt-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Contratos Vigentes</span>
                <span>85%</span>
              </div>
              <Progress value={85} className="mt-2" />
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
                      contract.status === 'Vigente' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {contract.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
