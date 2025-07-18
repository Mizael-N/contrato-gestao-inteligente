
import { useState, useEffect } from 'react';
import { Contract } from '@/types/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Plus, Clock, AlertCircle } from 'lucide-react';
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
    today.setHours(0, 0, 0, 0); // Zerar horas para comparação precisa
    const alertThreshold = 30; // 30 dias antes do vencimento

    const expiring: Contract[] = [];
    const expired: Contract[] = [];

    contracts.forEach(contract => {
      if (contract.status !== 'vigente') return;
      
      let expirationDate: Date;
      
      // Usar dataTermino se disponível, senão calcular baseado em dataInicio + prazo
      if (contract.dataTermino) {
        expirationDate = new Date(contract.dataTermino);
      } else if (contract.dataInicio) {
        expirationDate = new Date(contract.dataInicio);
        
        // Calcular data de vencimento baseada na unidade
        if (contract.prazoUnidade === 'meses') {
          expirationDate.setMonth(expirationDate.getMonth() + contract.prazoExecucao);
        } else if (contract.prazoUnidade === 'anos') {
          expirationDate.setFullYear(expirationDate.getFullYear() + contract.prazoExecucao);
        } else {
          // padrão: dias
          expirationDate.setDate(expirationDate.getDate() + contract.prazoExecucao);
        }
      } else {
        // Fallback para dataAssinatura se não houver dataInicio
        expirationDate = new Date(contract.dataAssinatura);
        
        if (contract.prazoUnidade === 'meses') {
          expirationDate.setMonth(expirationDate.getMonth() + contract.prazoExecucao);
        } else if (contract.prazoUnidade === 'anos') {
          expirationDate.setFullYear(expirationDate.getFullYear() + contract.prazoExecucao);
        } else {
          expirationDate.setDate(expirationDate.getDate() + contract.prazoExecucao);
        }
      }
      
      expirationDate.setHours(0, 0, 0, 0); // Zerar horas para comparação precisa
      
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`📅 Contrato ${contract.numero}: vence em ${daysUntilExpiration} dias (${expirationDate.toLocaleDateString('pt-BR')})`);
      
      if (daysUntilExpiration < 0) {
        expired.push(contract);
      } else if (daysUntilExpiration <= alertThreshold) {
        expiring.push(contract);
      }
    });

    console.log(`🚨 Contratos vencidos: ${expired.length}, próximos ao vencimento: ${expiring.length}`);
    setExpiringContracts(expiring);
    setExpiredContracts(expired);
  }, [contracts]);

  const formatDate = (contract: Contract) => {
    if (contract.dataTermino) {
      return new Date(contract.dataTermino).toLocaleDateString('pt-BR');
    }
    
    let baseDate: Date;
    if (contract.dataInicio) {
      baseDate = new Date(contract.dataInicio);
    } else {
      baseDate = new Date(contract.dataAssinatura);
    }
    
    const expirationDate = new Date(baseDate);
    
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
    today.setHours(0, 0, 0, 0);
    
    let expirationDate: Date;
    
    if (contract.dataTermino) {
      expirationDate = new Date(contract.dataTermino);
    } else if (contract.dataInicio) {
      expirationDate = new Date(contract.dataInicio);
      
      if (contract.prazoUnidade === 'meses') {
        expirationDate.setMonth(expirationDate.getMonth() + contract.prazoExecucao);
      } else if (contract.prazoUnidade === 'anos') {
        expirationDate.setFullYear(expirationDate.getFullYear() + contract.prazoExecucao);
      } else {
        expirationDate.setDate(expirationDate.getDate() + contract.prazoExecucao);
      }
    } else {
      expirationDate = new Date(contract.dataAssinatura);
      
      if (contract.prazoUnidade === 'meses') {
        expirationDate.setMonth(expirationDate.getMonth() + contract.prazoExecucao);
      } else if (contract.prazoUnidade === 'anos') {
        expirationDate.setFullYear(expirationDate.getFullYear() + contract.prazoExecucao);
      } else {
        expirationDate.setDate(expirationDate.getDate() + contract.prazoExecucao);
      }
    }
    
    expirationDate.setHours(0, 0, 0, 0);
    
    return Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (expiringContracts.length === 0 && expiredContracts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
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
                const daysOverdue = Math.abs(getDaysUntilExpiration(contract));
                return (
                  <div key={contract.id} className="flex items-center justify-between bg-white dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                    <div className="flex-1">
                      <p className="font-medium text-sm flex items-center text-red-900 dark:text-red-100">
                        <Clock className="h-4 w-4 mr-2 text-red-500 dark:text-red-400" />
                        {contract.numero} - {contract.objeto}
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Vencido há {daysOverdue} dias ({formatDate(contract)})
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
                const daysLeft = getDaysUntilExpiration(contract);
                return (
                  <div key={contract.id} className="flex items-center justify-between bg-white dark:bg-orange-900/20 p-3 rounded border border-orange-200 dark:border-orange-800">
                    <div className="flex-1">
                      <p className="font-medium text-sm flex items-center text-orange-900 dark:text-orange-100">
                        <Calendar className="h-4 w-4 mr-2 text-orange-500 dark:text-orange-400" />
                        {contract.numero} - {contract.objeto}
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                        Vence em {daysLeft} dias ({formatDate(contract)})
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
