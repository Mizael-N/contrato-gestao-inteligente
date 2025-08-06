
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Contract } from '@/types/contract';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface DashboardStatsProps {
  contracts: Contract[];
  stats: {
    total: number;
    totalValue: number;
    active: number;
    expiringSoon: number;
    averageValue: number;
  };
}

export default function DashboardStats({ contracts, stats }: DashboardStatsProps) {
  const orcamentoAnual = 100000000; // R$ 100M
  const orcamentoExecutado = Math.min((stats.totalValue / orcamentoAnual) * 100, 100);

  // Contratos por modalidade
  const modalityData = Object.entries(
    contracts.reduce((acc, contract) => {
      const modalidade = contract.modalidade || 'outros';
      acc[modalidade] = (acc[modalidade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: name.replace('_', ' ').charAt(0).toUpperCase() + name.replace('_', ' ').slice(1),
    value,
    color: getModalityColor(name)
  }));

  // Contratos por mês
  const monthlyData = Object.entries(
    contracts
      .filter(contract => contract.dataInicio)
      .reduce((acc, contract) => {
        try {
          const month = new Date(contract.dataInicio).toLocaleDateString('pt-BR', { 
            month: 'short', 
            year: 'numeric' 
          });
          acc[month] = (acc[month] || 0) + 1;
        } catch (error) {
          console.warn('Invalid date:', contract.dataInicio);
        }
        return acc;
      }, {} as Record<string, number>)
  )
  .sort(([a], [b]) => {
    try {
      return new Date(a).getTime() - new Date(b).getTime();
    } catch {
      return 0;
    }
  })
  .slice(-6)
  .map(([month, contratos]) => ({ month, contratos }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Execução Orçamentária */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
            Execução Orçamentária
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                Orçamento Executado
              </span>
              <span className="text-2xl font-bold text-foreground">
                {orcamentoExecutado.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={orcamentoExecutado} 
              className="h-4 bg-muted" 
            />
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="font-bold text-lg text-foreground">
                  R$ {(stats.totalValue / 1000000).toFixed(1)}M
                </div>
                <div className="text-muted-foreground">Executado</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="font-bold text-lg text-foreground">
                  R$ {(orcamentoAnual / 1000000).toFixed(0)}M
                </div>
                <div className="text-muted-foreground">Orçamento</div>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                Valor Médio por Contrato
              </span>
              <span className="text-lg font-bold text-foreground">
                R$ {(stats.averageValue / 1000).toFixed(0)}K
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Modalidades */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-green-400 rounded-full"></div>
            Distribuição por Modalidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          {modalityData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modalityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {modalityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} contratos`, 'Quantidade']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Contratos por Mês */}
      <Card className="dashboard-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-400 rounded-full"></div>
            Contratos por Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value} contratos`, 'Quantidade']}
                  />
                  <Bar 
                    dataKey="contratos" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getModalityColor(modalidade: string): string {
  const colors: Record<string, string> = {
    pregao: 'hsl(217.2 91.2% 59.8%)',
    concorrencia: 'hsl(142.1 76.2% 36.3%)', 
    tomada_precos: 'hsl(38.4 94.4% 59.6%)',
    convite: 'hsl(25.0 95.0% 53.0%)',
    concurso: 'hsl(142.1 70.6% 45.3%)',
    leilao: 'hsl(0 84.2% 60.2%)'
  };
  return colors[modalidade] || colors.pregao;
}
