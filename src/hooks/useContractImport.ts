
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
    const warnings: string[] = [];

    console.log('📦 Iniciando importação inteligente de', contracts.length, 'contratos');

    try {
      for (let i = 0; i < contracts.length; i++) {
        const contract = contracts[i];
        const currentName = contract.numero || `Contrato ${i + 1}`;
        
        setProgress(prev => prev ? {
          ...prev,
          processed: i,
          current: currentName
        } : null);

        console.log(`📝 Importando contrato ${i + 1}/${contracts.length}: ${currentName}`);

        try {
          // Validar dados críticos antes da importação
          const validationIssues: string[] = [];
          
          if (!contract.dataInicio) validationIssues.push('data de início');
          if (!contract.dataTermino) validationIssues.push('data de término');
          if (!contract.prazoExecucao || contract.prazoExecucao === 0) validationIssues.push('prazo de execução');
          
          if (validationIssues.length > 0) {
            warnings.push(`${currentName}: Campos precisam ser revisados - ${validationIssues.join(', ')}`);
            console.log(`⚠️ Contrato ${currentName} importado com avisos:`, validationIssues);
          }

          await createContract(contract);
          successful++;
          
          // Pequena pausa para mostrar o progresso
          await new Promise(resolve => setTimeout(resolve, 150));
          
        } catch (error) {
          console.error(`❌ Erro ao importar contrato ${currentName}:`, error);
          errors.push(`${currentName}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      // Atualizar progresso final
      setProgress(prev => prev ? {
        ...prev,
        processed: contracts.length,
        current: 'Concluído',
        errors: [...errors, ...warnings]
      } : null);

      console.log('✅ Importação concluída:', {
        total: contracts.length,
        sucessos: successful,
        erros: errors.length,
        avisos: warnings.length
      });

      // Aguardar um momento para mostrar o progresso completo
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mostrar resultado final com detalhes da IA
      if (errors.length === 0 && warnings.length === 0) {
        toast({
          title: "🧠 Importação inteligente concluída!",
          description: `${successful} contrato(s) importado(s) com sucesso usando IA.`,
          variant: "default"
        });
      } else if (successful > 0) {
        toast({
          title: "🧠 Importação inteligente parcialmente bem-sucedida",
          description: `${successful} contrato(s) importado(s). ${warnings.length} aviso(s), ${errors.length} erro(s). Verifique os detalhes.`,
          variant: "default"
        });
      } else {
        toast({
          title: "❌ Falha na importação",
          description: `Nenhum contrato foi importado. ${errors.length} erro(s) encontrado(s).`,
          variant: "destructive"
        });
      }

      return errors.length === 0;

    } catch (error) {
      console.error('❌ Erro geral na importação inteligente:', error);
      toast({
        title: "❌ Erro na importação inteligente",
        description: "Ocorreu um erro inesperado durante a importação com IA.",
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
