
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Contract } from '@/types/contract';
import { AlertTriangle, Calendar, TrendingUp } from 'lucide-react';

interface DashboardChartsProps {
  contracts: Contract[];
}

export default function DashboardCharts({ contracts }: DashboardChartsProps) {
  const getContractExpirationDate = (contract: Contract): Date => {
    if (contract.dataTermino) {
      return new Date(contract.dataTermino);
    }
    
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

  // Contratos próximos do vencimento
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const expiringContracts = contracts
    .filter(contract => {
      if (contract.status !== 'vigente') return false;
      try {
        const expirationDate = getContractExpirationDate(contract);
        return expirationDate <= thirtyDaysFromNow && expirationDate > today;
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      const dateA = getContractExpirationDate(a);
      const dateB = getContractExpirationDate(b);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 8);

  // Maiores contratos
  const topContracts = contracts
    .filter(contract => contract.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Contratos Próximos do Vencimento */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full"></div>
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Próximos Vencimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expiringContracts.length > 0 ? (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {expiringContracts.map((contract, index) => {
                const expirationDate = getContractExpirationDate(contract);
                const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={index} className="flex items-start justify-between p-4 border border-border/50 rounded-xl bg-card/50 hover:bg-card/80 transition-colors">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                        daysUntilExpiration <= 7 ? 'bg-red-500' :
                        daysUntilExpiration <= 15 ? 'bg-yellow-500' :
                        'bg-orange-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {contract.numero}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {contract.objeto}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <Badge 
                        variant={
                          daysUntilExpiration <= 7 ? 'destructive' :
                          daysUntilExpiration <= 15 ? 'secondary' :
                          'outline'
                        }
                        className="text-xs"
                      >
                        {daysUntilExpiration} dias
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {expirationDate.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum contrato vence nos próximos 30 dias</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maiores Contratos */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-purple-400 rounded-full"></div>
            <TrendingUp className="w-5 h-5 text-purple-500" />
            Maiores Contratos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topContracts.length > 0 ? (
            <div className="space-y-4">
              {topContracts.map((contract, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-card/50 hover:bg-card/80 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">#{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {contract.numero}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {contract.contratada}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className="font-bold text-sm text-foreground">
                      R$ {contract.valor.toLocaleString('pt-BR')}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {contract.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum contrato encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
