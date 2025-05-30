
import { Contract } from '@/types/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ContractAddendumsProps {
  contract: Contract;
}

export default function ContractAddendums({ contract }: ContractAddendumsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Termos Aditivos</CardTitle>
      </CardHeader>
      <CardContent>
        {contract.aditivos.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhum termo aditivo cadastrado</p>
        ) : (
          <div className="space-y-2">
            {contract.aditivos.map((aditivo) => (
              <div key={aditivo.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{aditivo.numero}</h4>
                    <p className="text-sm text-gray-600">{aditivo.justificativa}</p>
                  </div>
                  <Badge variant="outline">{aditivo.tipo}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
