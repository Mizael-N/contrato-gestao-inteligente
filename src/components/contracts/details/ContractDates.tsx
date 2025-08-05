
import { Contract } from '@/types/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { calculateContractDates, formatDateBR, getStatusLabel } from '@/utils/contractDateUtils';

interface ContractDatesProps {
  contract: Contract;
}

export default function ContractDates({ contract }: ContractDatesProps) {
  const dateInfo = calculateContractDates(contract);

  const getExpirationStatus = () => {
    switch (dateInfo.status) {
      case 'vencido':
        return {
          status: 'expired',
          label: `Vencido há ${Math.abs(dateInfo.diasRestantes)} dias`,
          variant: 'destructive' as const,
          icon: <AlertTriangle className="h-4 w-4" />
        };
      case 'vencendo':
        return {
          status: 'expiring',
          label: `Vence em ${dateInfo.diasRestantes} dias`,
          variant: 'secondary' as const,
          icon: <Clock className="h-4 w-4" />
        };
      default:
        return {
          status: 'active',
          label: `${dateInfo.diasRestantes} dias restantes`,
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
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Início da Vigência</label>
            <p className="text-sm font-medium">{formatDateBR(dateInfo.dataInicio)}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Término da Vigência</label>
            <p className="text-sm font-medium">{formatDateBR(dateInfo.dataTermino)}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Prazo de Execução</label>
            <p className="text-sm font-medium">
              {contract.prazoExecucao} {contract.prazoUnidade}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Duração Total</label>
            <p className="text-sm font-medium">
              {Math.ceil((new Date(dateInfo.dataTermino).getTime() - new Date(dateInfo.dataInicio).getTime()) / (1000 * 60 * 60 * 24))} dias
            </p>
          </div>
        </div>
        
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Status do Contrato:</span>
            <span className={`font-medium ${
              dateInfo.status === 'vencido' ? 'text-red-600 dark:text-red-400' :
              dateInfo.status === 'vencendo' ? 'text-orange-600 dark:text-orange-400' :
              'text-green-600 dark:text-green-400'
            }`}>
              {getStatusLabel(dateInfo.status)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
