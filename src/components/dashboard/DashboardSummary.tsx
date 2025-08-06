
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Contract } from '@/types/contract';
import { Activity, FileText, DollarSign } from 'lucide-react';

interface DashboardSummaryProps {
  contracts: Contract[];
  stats: {
    total: number;
    totalValue: number;
    active: number;
    expiringSoon: number;
    averageValue: number;
  };
}

export default function DashboardSummary({ contracts, stats }: DashboardSummaryProps) {
  // Status distribution
  const statusData = [
    { status: 'vigente', label: 'Vigente', color: 'bg-green-500', count: 0 },
    { status: 'suspenso', label: 'Suspenso', color: 'bg-yellow-500', count: 0 },
    { status: 'encerrado', label: 'Encerrado', color: 'bg-gray-500', count: 0 },
    { status: 'rescindido', label: 'Rescindido', color: 'bg-red-500', count: 0 }
  ].map(item => ({
    ...item,
    count: contracts.filter(c => c && c.status === item.status).length
  }));

  // Recent activity (simulation)
  const recentActivities = contracts
    .filter(contract => contract.dataInicio)
    .sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-primary" />
            Status dos Contratos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusData.map(({ status, label, color, count }) => {
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
            
            return (
              <div key={status} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${color}`}></div>
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{count}</div>
                  <div className="text-xs text-muted-foreground">
                    {percentage.toFixed(0)}%
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-800 mb-1">
                R$ {(stats.totalValue / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-green-600">Valor Total em Contratos</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-800">{stats.active}</div>
              <div className="text-xs text-blue-600">Ativos</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-800">{stats.expiringSoon}</div>
              <div className="text-xs text-orange-600">Vencendo</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-blue-600" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((contract, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {contract.numero}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Iniciado em {new Date(contract.dataInicio).toLocaleDateString('pt-BR')}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {contract.modalidade}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
