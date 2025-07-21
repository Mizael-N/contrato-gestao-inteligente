
import { useState, useEffect } from 'react';
import { Contract } from '@/types/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Plus, Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { calculateContractDates, formatDateBR } from '@/utils/contractDateUtils';
import ContractIncompleteDataAlert from './ContractIncompleteDataAlert';

interface ContractAlertsProps {
  contracts: Contract[];
  onCreateAddendum: (contract: Contract) => void;
  onEditContract?: (contract: Contract) => void;
}

export default function ContractAlerts({ 
  contracts, 
  onCreateAddendum, 
  onEditContract 
}: ContractAlertsProps) {
  const [expiringContracts, setExpiringContracts] = useState<Contract[]>([]);
  const [expiredContracts, setExpiredContracts] = useState<Contract[]>([]);

  useEffect(() => {
    const expiring: Contract[] = [];
    const expired: Contract[] = [];

    contracts.forEach(contract => {
      if (contract.status !== 'vigente') return;
      
      const dateInfo = calculateContractDates(contract);
      
      // Só processar contratos com dados completos para alertas de vencimento
      if (!dateInfo.hasIncompleteData) {
        if (dateInfo.status === 'vencido') {
          expired.push(contract);
        } else if (dateInfo.status === 'vencendo') {
          expiring.push(contract);
        }
      }
    });

    console.log(`🚨 Contratos vencidos: ${expired.length}, próximos ao vencimento: ${expiring.length}`);
    setExpiringContracts(expiring);
    setExpiredContracts(expired);
  }, [contracts]);

  const getContractDateInfo = (contract: Contract) => {
    return calculateContractDates(contract);
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Alerta para contratos com dados incompletos */}
      {onEditContract && (
        <ContractIncompleteDataAlert 
          contracts={contracts}
          onEditContract={onEditContract}
        />
      )}

      {/* Contratos vencidos */}
      {expiredContracts.length > 0 && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span className="font-medium text-red-800 dark:text-red-200">
                {expiredContracts.length} contrato(s) vencido(s)
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {expiredContracts.map(contract => {
                const dateInfo = getContractDateInfo(contract);
                const daysOverdue = Math.abs(dateInfo.diasRestantes);
                return (
                  <div key={contract.id} className="flex items-center justify-between bg-white dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                    <div className="flex-1">
                      <p className="font-medium text-sm flex items-center text-red-900 dark:text-red-100">
                        <Clock className="h-4 w-4 mr-2 text-red-500 dark:text-red-400" />
                        {contract.numero} - {contract.objeto}
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Vencido há {daysOverdue} dias (término: {formatDateBR(dateInfo.dataTermino)})
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onCreateAddendum(contract)}
                      className="ml-3 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
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

      {/* Contratos próximos ao vencimento */}
      {expiringContracts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30">
          <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span className="font-medium text-orange-800 dark:text-orange-200">
                {expiringContracts.length} contrato(s) próximo(s) do vencimento
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {expiringContracts.map(contract => {
                const dateInfo = getContractDateInfo(contract);
                return (
                  <div key={contract.id} className="flex items-center justify-between bg-white dark:bg-orange-900/20 p-3 rounded border border-orange-200 dark:border-orange-800">
                    <div className="flex-1">
                      <p className="font-medium text-sm flex items-center text-orange-900 dark:text-orange-100">
                        <Calendar className="h-4 w-4 mr-2 text-orange-500 dark:text-orange-400" />
                        {contract.numero} - {contract.objeto}
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                        Vence em {dateInfo.diasRestantes} dias (término: {formatDateBR(dateInfo.dataTermino)})
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onCreateAddendum(contract)}
                      className="ml-3 bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600 text-white"
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
