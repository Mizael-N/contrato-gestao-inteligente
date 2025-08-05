
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Contract } from '@/types/contract';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';

interface InteractiveChartsProps {
  contracts: Contract[];
}

export default function InteractiveCharts({ contracts }: InteractiveChartsProps) {
  // Calcular data de vencimento
  const getContractExpirationDate = (contract: Contract): Date => {
    const startDate = new Date(contract.dataInicio);
    const expirationDate = new Date(startDate);
    
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

  // Dados para gráfico de pizza - Modalidades
  const modalityData = Object.entries(
    contracts.reduce((acc, contract) => {
      acc[contract.modalidade] = (acc[contract.modalidade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: name.replace('_', ' ').charAt(0).toUpperCase() + name.replace('_', ' ').slice(1),
    value,
    originalName: name
  }));

  const modalityColors = {
    pregao: 'hsl(217.2 91.2% 59.8%)',
    concorrencia: 'hsl(142.1 76.2% 36.3%)', 
    tomada_precos: 'hsl(38.4 94.4% 59.6%)',
    convite: 'hsl(25.0 95.0% 53.0%)',
    concurso: 'hsl(142.1 70.6% 45.3%)',
    leilao: 'hsl(0 84.2% 60.2%)'
  };

  // Dados para gráfico de barras - Contratos por mês
  const contractsByMonth = contracts.reduce((acc, contract) => {
    const month = new Date(contract.dataInicio).toLocaleDateString('pt-BR', { 
      month: 'short', 
      year: 'numeric' 
    });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyData = Object.entries(contractsByMonth)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .slice(-6) // Últimos 6 meses
    .map(([month, count]) => ({
      month,
      contratos: count,
      valor: contracts
        .filter(c => new Date(c.dataInicio).toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: 'numeric' 
        }) === month)
        .reduce((sum, c) => sum + c.valor, 0) / 1000000 // Em milhões
    }));

  // Contratos próximos do vencimento
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const expiringContracts = contracts
    .filter(contract => {
      if (contract.status !== 'vigente') return false;
      const expirationDate = getContractExpirationDate(contract);
      return expirationDate <= thirtyDaysFromNow && expirationDate > today;
    })
    .sort((a, b) => {
      const dateA = getContractExpirationDate(a);
      const dateB = getContractExpirationDate(b);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 5);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Gráfico de Pizza - Modalidades */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-6 bg-gradient-primary rounded-full"></div>
            Distribuição por Modalidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          {modalityData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modalityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {modalityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={modalityColors[entry.originalName as keyof typeof modalityColors] || modalityColors.pregao}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} contratos`, 'Quantidade']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Barras - Contratos por Mês */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-6 bg-gradient-secondary rounded-full"></div>
            Contratos por Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <div className="h-80">
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
                    formatter={(value: number, name: string) => [
                      name === 'contratos' ? `${value} contratos` : `R$ ${value.toFixed(1)}M`,
                      name === 'contratos' ? 'Quantidade' : 'Valor'
                    ]}
                  />
                  <Legend />
                  <Bar 
                    dataKey="contratos" 
                    fill="hsl(217.2 91.2% 59.8%)" 
                    name="Contratos"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="valor" 
                    fill="hsl(142.1 76.2% 36.3%)" 
                    name="Valor (R$ Mi)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas de Vencimento */}
      <Card className="dashboard-card md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-6 bg-gradient-accent rounded-full"></div>
            Contratos Próximos do Vencimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expiringContracts.length > 0 ? (
            <div className="space-y-3">
              {expiringContracts.map((contract, index) => {
                const expirationDate = getContractExpirationDate(contract);
                const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-card/50 hover:bg-card transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full ${
                        daysUntilExpiration <= 7 ? 'bg-red-500' :
                        daysUntilExpiration <= 15 ? 'bg-yellow-500' :
                        'bg-orange-500'
                      }`} />
                      <div>
                        <p className="font-medium">{contract.numero}</p>
                        <p className="text-sm text-muted-foreground">
                          {contract.objeto.length > 60 ? contract.objeto.substring(0, 60) + '...' : contract.objeto}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge 
                        variant={
                          daysUntilExpiration <= 7 ? 'destructive' :
                          daysUntilExpiration <= 15 ? 'secondary' :
                          'outline'
                        }
                      >
                        {daysUntilExpiration} dias
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Vence: {expirationDate.toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-sm font-medium">
                        R$ {contract.valor.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum contrato vence nos próximos 30 dias</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
