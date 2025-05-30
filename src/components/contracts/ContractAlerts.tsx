
import { useState, useEffect } from 'react';
import { Contract } from '@/types/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ContractAlertsProps {
  contracts: Contract[];
  onCreateAddendum: (contract: Contract) => void;
}

export default function ContractAlerts({ contracts, onCreateAddendum }: ContractAlertsProps) {
  const [expiringContracts, setExpiringContracts] = useState<Contract[]>([]);

  useEffect(() => {
    const today = new Date();
    const alertThreshold = 30; // 30 dias antes do vencimento

    const expiring = contracts.filter(contract => {
      if (contract.status !== 'vigente') return false;
      
      const signatureDate = new Date(contract.dataAssinatura);
      const expirationDate = new Date(signatureDate.getTime() + contract.prazoExecucao * 24 * 60 * 60 * 1000);
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysUntilExpiration <= alertThreshold && daysUntilExpiration > 0;
    });

    setExpiringContracts(expiring);
  }, [contracts]);

  if (expiringContracts.length === 0) {
    return null;
  }

  const formatDate = (dateString: string, days: number) => {
    const date = new Date(dateString);
    const expirationDate = new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
    return expirationDate.toLocaleDateString('pt-BR');
  };

  const getDaysUntilExpiration = (dateString: string, days: number) => {
    const today = new Date();
    const signatureDate = new Date(dateString);
    const expirationDate = new Date(signatureDate.getTime() + days * 24 * 60 * 60 * 1000);
    return Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <Alert className="mb-6 border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <span className="font-medium text-orange-800">
            {expiringContracts.length} contrato(s) próximo(s) do vencimento
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {expiringContracts.map(contract => {
            const daysLeft = getDaysUntilExpiration(contract.dataAssinatura, contract.prazoExecucao);
            return (
              <div key={contract.id} className="flex items-center justify-between bg-white p-3 rounded border">
                <div className="flex-1">
                  <p className="font-medium text-sm">{contract.numero} - {contract.objeto}</p>
                  <p className="text-xs text-gray-600">
                    Vence em {daysLeft} dias ({formatDate(contract.dataAssinatura, contract.prazoExecucao)})
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => onCreateAddendum(contract)}
                  className="ml-3"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Termo Aditivo
                </Button>
              </div>
            );
          })}
        </div>
      </AlertDescription>
    </Alert>
  );
}
