
import { Contract } from '@/types/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ContractDatesProps {
  contract: Contract;
}

export default function ContractDates({ contract }: ContractDatesProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calculateExpirationDate = () => {
    if (contract.dataTermino) {
      return new Date(contract.dataTermino);
    }
    
    let baseDate: Date;
    if (contract.dataInicio) {
      baseDate = new Date(contract.dataInicio);
    } else {
      baseDate = new Date(contract.dataAssinatura);
    }
    
    const expirationDate = new Date(baseDate);
    
    if (contract.prazoUnidade === 'meses') {
      expirationDate.setMonth(expirationDate.getMonth() + contract.prazoExecucao);
    } else if (contract.prazoUnidade === 'anos') {
      expirationDate.setFullYear(expirationDate.getFullYear() + contract.prazoExecucao);
    } else {
      expirationDate.setDate(expirationDate.getDate() + contract.prazoExecucao);
    }
    
    return expirationDate;
  };

  const getDaysUntilExpiration = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expirationDate = calculateExpirationDate();
    expirationDate.setHours(0, 0, 0, 0);
    
    return Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getExpirationStatus = () => {
    const daysUntilExpiration = getDaysUntilExpiration();
    
    if (daysUntilExpiration < 0) {
      return {
        status: 'expired',
        label: `Vencido há ${Math.abs(daysUntilExpiration)} dias`,
        variant: 'destructive' as const,
        icon: <AlertTriangle className="h-4 w-4" />
      };
    } else if (daysUntilExpiration <= 30) {
      return {
        status: 'expiring',
        label: `Vence em ${daysUntilExpiration} dias`,
        variant: 'secondary' as const,
        icon: <Clock className="h-4 w-4" />
      };
    } else {
      return {
        status: 'active',
        label: `${daysUntilExpiration} dias restantes`,
        variant: 'default' as const,
        icon: <Calendar className="h-4 w-4" />
      };
    }
  };

  const expirationStatus = getExpirationStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Prazos e Vigência
          </span>
          <Badge variant={expirationStatus.variant} className="flex items-center gap-1">
            {expirationStatus.icon}
            {expirationStatus.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Assinatura</label>
            <p className="text-sm font-medium">{formatDate(contract.dataAssinatura)}</p>
          </div>
          
          {contract.dataInicio && (
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Início da Vigência</label>
              <p className="text-sm font-medium">{formatDate(contract.dataInicio)}</p>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Prazo de Execução</label>
            <p className="text-sm font-medium">
              {contract.prazoExecucao} {contract.prazoUnidade || 'dias'}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {contract.dataTermino ? 'Data de Término (Definida)' : 'Data de Término (Calculada)'}
            </label>
            <p className="text-sm font-medium">
              {contract.dataTermino ? formatDate(contract.dataTermino) : calculateExpirationDate().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Status do Contrato:</span>
            <span className={`font-medium ${
              expirationStatus.status === 'expired' ? 'text-red-600 dark:text-red-400' :
              expirationStatus.status === 'expiring' ? 'text-orange-600 dark:text-orange-400' :
              'text-green-600 dark:text-green-400'
            }`}>
              {expirationStatus.label}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
