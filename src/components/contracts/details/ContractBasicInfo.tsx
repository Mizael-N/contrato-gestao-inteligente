
import { Contract } from '@/types/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

interface ContractBasicInfoProps {
  contract: Contract;
}

export default function ContractBasicInfo({ contract }: ContractBasicInfoProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      vigente: { label: 'Vigente', variant: 'default' as const },
      suspenso: { label: 'Suspenso', variant: 'secondary' as const },
      encerrado: { label: 'Encerrado', variant: 'outline' as const },
      rescindido: { label: 'Rescindido', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Informações Básicas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-500">Número</label>
          <p className="text-sm">{contract.numero}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Modalidade</label>
          <p className="text-sm capitalize">{contract.modalidade.replace('_', ' ')}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Objeto</label>
          <p className="text-sm">{contract.objeto}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Status</label>
          <div className="mt-1">{getStatusBadge(contract.status)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
