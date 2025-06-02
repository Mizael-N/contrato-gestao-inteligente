
import { useState, useEffect } from 'react';
import { Contract } from '@/types/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Plus, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ContractAlertsProps {
  contracts: Contract[];
  onCreateAddendum: (contract: Contract) => void;
}

export default function ContractAlerts({ contracts, onCreateAddendum }: ContractAlertsProps) {
  const [expiringContracts, setExpiringContracts] = useState<Contract[]>([]);
  const [expiredContracts, setExpiredContracts] = useState<Contract[]>([]);

  useEffect(() => {
    const today = new Date();
    const alertThreshold = 30; // 30 dias antes do vencimento

    const expiring: Contract[] = [];
    const expired: Contract[] = [];

    contracts.forEach(contract => {
      if (contract.status !== 'vigente') return;
      
      const signatureDate = new Date(contract.dataAssinatura);
      const expirationDate = new Date(signatureDate);
      
      // Calcular data de vencimento baseada na unidade
      if (contract.prazoUnidade === 'meses') {
        expirationDate.setMonth(expirationDate.getMonth() + contract.prazoExecucao);
      } else if (contract.prazoUnidade === 'anos') {
        expirationDate.setFullYear(expirationDate.getFullYear() + contract.prazoExecucao);
      } else {
        // padrão: dias
        expirationDate.setDate(expirationDate.getDate() + contract.prazoExecucao);
      }
      
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiration < 0) {
        expired.push(contract);
      } else if (daysUntilExpiration <= alertThreshold) {
        expiring.push(contract);
      }
    });

    setExpiringContracts(expiring);
    setExpiredContracts(expired);
  }, [contracts]);

  const formatDate = (contract: Contract) => {
    const signatureDate = new Date(contract.dataAssinatura);
    const expirationDate = new Date(signatureDate);
    
    if (contract.prazoUnidade === 'meses') {
      expirationDate.setMonth(expirationDate.getMonth() + contract.prazoExecucao);
    } else if (contract.prazoUnidade === 'anos') {
      expirationDate.setFullYear(expirationDate.getFullYear() + contract.prazoExecucao);
    } else {
      expirationDate.setDate(expirationDate.getDate() + contract.prazoExecucao);
    }
    
    return expirationDate.toLocaleDateString('pt-BR');
  };

  const getDaysUntilExpiration = (contract: Contract) => {
    const today = new Date();
    const signatureDate = new Date(contract.dataAssinatura);
    const expirationDate = new Date(signatureDate);
    
    if (contract.prazoUnidade === 'meses') {
      expirationDate.setMonth(expirationDate.getMonth() + contract.prazoExecucao);
    } else if (contract.prazoUnidade === 'anos') {
      expirationDate.setFullYear(expirationDate.getFullYear() + contract.prazoExecucao);
    } else {
      expirationDate.setDate(expirationDate.getDate() + contract.prazoExecucao);
    }
    
    return Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (expiringContracts.length === 0 && expiredContracts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {expiredContracts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span className="font-medium text-red-800">
                {expiredContracts.length} contrato(s) vencido(s)
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {expiredContracts.map(contract => {
                const daysOverdue = Math.abs(getDaysUntilExpiration(contract));
                return (
                  <div key={contract.id} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div className="flex-1">
                      <p className="font-medium text-sm flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-red-500" />
                        {contract.numero} - {contract.objeto}
                      </p>
                      <p className="text-xs text-gray-600">
                        Vencido há {daysOverdue} dias ({formatDate(contract)})
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onCreateAddendum(contract)}
                      className="ml-3"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Prorrogar
                    </Button>
                  </div>
                );
              })}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {expiringContracts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span className="font-medium text-orange-800">
                {expiringContracts.length} contrato(s) próximo(s) do vencimento
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {expiringContracts.map(contract => {
                const daysLeft = getDaysUntilExpiration(contract);
                return (
                  <div key={contract.id} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div className="flex-1">
                      <p className="font-medium text-sm flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-orange-500" />
                        {contract.numero} - {contract.objeto}
                      </p>
                      <p className="text-xs text-gray-600">
                        Vence em {daysLeft} dias ({formatDate(contract)})
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
      )}
    </div>
  );
}
