
import { useState } from 'react';
import { Contract } from '@/types/contract';
import { useContracts } from './useContracts';
import { useToast } from '@/hooks/use-toast';

interface ImportProgress {
  total: number;
  processed: number;
  current: string;
  errors: string[];
}

export function useContractImport() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const { createContract } = useContracts();
  const { toast } = useToast();

  const importContracts = async (contracts: Partial<Contract>[]) => {
    if (contracts.length === 0) {
      toast({
        title: "Nenhum contrato para importar",
        description: "Selecione pelo menos um contrato para importar.",
        variant: "destructive"
      });
      return false;
    }

    setImporting(true);
    setProgress({
      total: contracts.length,
      processed: 0,
      current: '',
      errors: []
    });

    let successful = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < contracts.length; i++) {
        const contract = contracts[i];
        const currentName = contract.numero || `Contrato ${i + 1}`;
        
        setProgress(prev => prev ? {
          ...prev,
          processed: i,
          current: currentName
        } : null);

        try {
          await createContract(contract);
          successful++;
          
          // Pequena pausa para mostrar o progresso
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Erro ao importar contrato ${currentName}:`, error);
          errors.push(`${currentName}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      // Atualizar progresso final
      setProgress(prev => prev ? {
        ...prev,
        processed: contracts.length,
        current: 'Concluído'
      } : null);

      // Aguardar um momento para mostrar o progresso completo
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mostrar resultado final
      if (errors.length === 0) {
        toast({
          title: "Importação concluída com sucesso!",
          description: `${successful} contrato(s) importado(s) com sucesso.`,
          variant: "default"
        });
      } else if (successful > 0) {
        toast({
          title: "Importação parcialmente bem-sucedida",
          description: `${successful} contrato(s) importado(s), ${errors.length} erro(s).`,
          variant: "default"
        });
      } else {
        toast({
          title: "Falha na importação",
          description: `Nenhum contrato foi importado. ${errors.length} erro(s) encontrado(s).`,
          variant: "destructive"
        });
      }

      return errors.length === 0;

    } catch (error) {
      console.error('Erro geral na importação:', error);
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro inesperado durante a importação.",
        variant: "destructive"
      });
      return false;
    } finally {
      setImporting(false);
      setProgress(null);
    }
  };

  return {
    importing,
    progress,
    importContracts
  };
}
