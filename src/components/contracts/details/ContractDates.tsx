
import { Contract } from '@/types/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface ContractDatesProps {
  contract: Contract;
}

export default function ContractDates({ contract }: ContractDatesProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Prazos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-500">Data de Assinatura</label>
          <p className="text-sm">{formatDate(contract.dataAssinatura)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Prazo de Execução</label>
          <p className="text-sm">{contract.prazoExecucao} dias</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Data de Vencimento</label>
          <p className="text-sm">
            {formatDate(
              new Date(
                new Date(contract.dataAssinatura).getTime() + 
                contract.prazoExecucao * 24 * 60 * 60 * 1000
              ).toISOString().split('T')[0]
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
