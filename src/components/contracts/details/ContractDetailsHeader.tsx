
import { Contract } from '@/types/contract';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit } from 'lucide-react';

interface ContractDetailsHeaderProps {
  contract: Contract;
  onEdit: (contract: Contract) => void;
  onBack: () => void;
}

export default function ContractDetailsHeader({ contract, onEdit, onBack }: ContractDetailsHeaderProps) {
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
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Contrato {contract.numero}</h1>
          {getStatusBadge(contract.status)}
        </div>
      </div>
      <Button onClick={() => onEdit(contract)}>
        <Edit className="h-4 w-4 mr-2" />
        Editar
      </Button>
    </div>
  );
}
