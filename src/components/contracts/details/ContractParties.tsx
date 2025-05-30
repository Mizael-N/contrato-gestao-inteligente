
import { Contract } from '@/types/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ContractPartiesProps {
  contract: Contract;
}

export default function ContractParties({ contract }: ContractPartiesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Partes Contratantes</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Contratante</label>
          <p className="text-sm">{contract.contratante}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Contratada</label>
          <p className="text-sm">{contract.contratada}</p>
        </div>
      </CardContent>
    </Card>
  );
}
