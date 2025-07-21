
import { Contract } from '@/types/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Edit, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { calculateContractDates, formatDateBR } from '@/utils/contractDateUtils';

interface ContractIncompleteDataAlertProps {
  contracts: Contract[];
  onEditContract: (contract: Contract) => void;
}

export default function ContractIncompleteDataAlert({ 
  contracts, 
  onEditContract 
}: ContractIncompleteDataAlertProps) {
  const contractsWithIncompleteData = contracts.filter(contract => {
    const dateInfo = calculateContractDates(contract);
    return dateInfo.hasIncompleteData;
  });

  if (contractsWithIncompleteData.length === 0) {
    return null;
  }

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 mb-6">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <span className="font-medium text-amber-800 dark:text-amber-200">
            {contractsWithIncompleteData.length} contrato(s) com dados de vigência incompletos
          </span>
        </div>
        <p className="text-sm text-amber-700 dark:text-amber-300 mt-2 mb-3">
          Os contratos abaixo precisam ter as datas de início e término da vigência definidas para cálculos precisos:
        </p>
        <div className="space-y-2">
          {contractsWithIncompleteData.map(contract => {
            const dateInfo = calculateContractDates(contract);
            const missingFields: string[] = [];
            
            if (!contract.dataInicio) missingFields.push('Data de Início');
            if (!contract.dataTermino) missingFields.push('Data de Término');
            
            return (
              <div key={contract.id} className="flex items-center justify-between bg-white dark:bg-amber-900/20 p-3 rounded border border-amber-200 dark:border-amber-800">
                <div className="flex-1">
                  <p className="font-medium text-sm flex items-center text-amber-900 dark:text-amber-100">
                    <Calendar className="h-4 w-4 mr-2 text-amber-500 dark:text-amber-400" />
                    {contract.numero} - {contract.objeto}
                  </p>
                  <div className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                    <p>Campos em falta: {missingFields.join(', ')}</p>
                    <p>
                      Data atual de vigência: {formatDateBR(dateInfo.dataInicio)} até {formatDateBR(dateInfo.dataTermino)}
                      <span className="text-amber-600 dark:text-amber-400 ml-1">(calculada automaticamente)</span>
                    </p>
                  </div>
                </div>
                <div className="ml-3 flex items-center gap-2">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700">
                    Dados Incompletos
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => onEditContract(contract)}
                    className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 text-white"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Completar Dados
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </AlertDescription>
    </Alert>
  );
}
