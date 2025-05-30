
import { Contract } from '@/types/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

interface ContractFinancialInfoProps {
  contract: Contract;
}

export default function ContractFinancialInfo({ contract }: ContractFinancialInfoProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Informações Financeiras
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Valor do Contrato</label>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(contract.valor)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Valor da Garantia</label>
            <p className="text-lg font-semibold">{formatCurrency(contract.garantia.valor)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Tipo de Garantia</label>
            <p className="text-sm capitalize">{contract.garantia.tipo.replace('_', ' ')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
