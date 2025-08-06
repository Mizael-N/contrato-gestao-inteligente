
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardHeaderProps {
  stats: {
    total: number;
    totalValue: number;
    active: number;
    expiringSoon: number;
    averageValue: number;
  };
}

export default function DashboardHeader({ stats }: DashboardHeaderProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  const activePercentage = stats.total > 0 ? (stats.active / stats.total) * 100 : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 p-8">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Dashboard de Contratos
            </h1>
            <p className="text-lg text-muted-foreground">
              Visão geral completa do seu portfólio de contratos
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-foreground mb-1">
              {formatCurrency(stats.totalValue)}
            </div>
            <div className="text-sm text-muted-foreground">Valor Total</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 bg-primary rounded-full"></div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total de Contratos</div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.active}</div>
              <div className="text-sm text-muted-foreground">
                Ativos ({activePercentage.toFixed(0)}%)
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.expiringSoon}</div>
              <div className="text-sm text-muted-foreground">Vencendo em 30 dias</div>
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full transform translate-x-32 -translate-y-32"></div>
    </div>
  );
}
