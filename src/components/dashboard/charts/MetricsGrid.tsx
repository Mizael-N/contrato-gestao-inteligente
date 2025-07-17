import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Contract } from '@/types/contract';

interface MetricsGridProps {
  contracts: Contract[];
}

export default function MetricsGrid({ contracts }: MetricsGridProps) {
  const totalValue = contracts.reduce((sum, c) => sum + (c.valor || 0), 0);
  const averageValue = contracts.length > 0 ? totalValue / contracts.length : 0;
  const orcamentoAnual = 100000000; // R$ 100M
  const orcamentoExecutado = Math.min((totalValue / orcamentoAnual) * 100, 100);
  
  // Contratos por modalidade
  const contractsByModality = contracts.reduce((acc, contract) => {
    acc[contract.modalidade] = (acc[contract.modalidade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Contratos por status
  const contractsByStatus = contracts.reduce((acc, contract) => {
    acc[contract.status] = (acc[contract.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const modalityColors = {
    pregao: 'hsl(var(--dashboard-primary))',
    concorrencia: 'hsl(var(--dashboard-secondary))', 
    tomada_precos: 'hsl(var(--dashboard-accent))',
    convite: 'hsl(var(--dashboard-warning))',
    concurso: 'hsl(var(--dashboard-success))',
    leilao: 'hsl(var(--dashboard-error))'
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Execução Orçamentária */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-6 bg-gradient-primary rounded-full"></div>
            Execução Orçamentária
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Orçamento Executado</span>
              <span className="font-bold text-lg">{orcamentoExecutado.toFixed(1)}%</span>
            </div>
            <Progress 
              value={orcamentoExecutado} 
              className="h-3 bg-muted" 
            />
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Executado:</span>
                <span className="font-medium">R$ {(totalValue / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between">
                <span>Orçamento:</span>
                <span>R$ {(orcamentoAnual / 1000000).toFixed(0)}M</span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Valor Médio por Contrato</span>
              <span className="font-bold">R$ {(averageValue / 1000).toFixed(0)}K</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Baseado em {contracts.length} contratos
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribuição por Modalidade */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-6 bg-gradient-secondary rounded-full"></div>
            Modalidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(contractsByModality)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([modalidade, count]) => {
                const percentage = (count / contracts.length) * 100;
                const color = modalityColors[modalidade as keyof typeof modalityColors] || modalityColors.pregao;
                
                return (
                  <div key={modalidade} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">
                        {modalidade.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{count}</span>
                        <Badge variant="outline" className="text-xs">
                          {percentage.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          background: color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            {Object.keys(contractsByModality).length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status dos Contratos */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-6 bg-gradient-accent rounded-full"></div>
            Status dos Contratos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(contractsByStatus)
              .sort(([,a], [,b]) => b - a)
              .map(([status, count]) => {
                const percentage = (count / contracts.length) * 100;
                
                return (
                  <div key={status} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        status === 'vigente' ? 'bg-emerald-500' :
                        status === 'suspenso' ? 'bg-yellow-500' :
                        status === 'encerrado' ? 'bg-gray-500' :
                        'bg-red-500'
                      }`} />
                      <Badge 
                        variant={
                          status === 'vigente' ? 'default' : 
                          status === 'suspenso' ? 'secondary' : 
                          'destructive'
                        }
                        className="capitalize"
                      >
                        {status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{count}</div>
                      <div className="text-xs text-muted-foreground">
                        {percentage.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            {Object.keys(contractsByStatus).length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}