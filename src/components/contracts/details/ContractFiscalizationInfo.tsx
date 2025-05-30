
import { Contract } from '@/types/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

interface ContractFiscalizationInfoProps {
  contract: Contract;
}

export default function ContractFiscalizationInfo({ contract }: ContractFiscalizationInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          Fiscalização do Contrato
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Fiscal Titular</label>
          <p className="text-sm">{contract.fiscais.titular}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Fiscal Substituto</label>
          <p className="text-sm">{contract.fiscais.substituto}</p>
        </div>
      </CardContent>
    </Card>
  );
}
