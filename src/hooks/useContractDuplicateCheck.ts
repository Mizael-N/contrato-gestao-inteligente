import { useState } from 'react';
import { Contract } from '@/types/contract';
import { supabase } from '@/integrations/supabase/client';

export function useContractDuplicateCheck() {
  const [checking, setChecking] = useState(false);

  const checkForDuplicates = async (contracts: Partial<Contract>[]) => {
    setChecking(true);
    const duplicates: { contract: Partial<Contract>; existing: any[] }[] = [];

    try {
      for (const contract of contracts) {
        if (!contract.numero) continue;

        // Buscar contratos existentes com o mesmo número
        const { data: existingContracts } = await supabase
          .from('contracts')
          .select('id, numero, objeto, contratada, valor')
          .ilike('numero', `%${contract.numero.trim()}%`);

        if (existingContracts && existingContracts.length > 0) {
          // Verificar duplicatas mais rigorosamente
          const potentialDuplicates = existingContracts.filter(existing => {
            const numeroMatch = existing.numero?.toLowerCase().includes(contract.numero?.toLowerCase() || '');
            const objetoSimilar = existing.objeto?.toLowerCase().includes(contract.objeto?.substring(0, 20).toLowerCase() || '');
            const contratadaSimilar = existing.contratada?.toLowerCase().includes(contract.contratada?.toLowerCase() || '');
            
            return numeroMatch && (objetoSimilar || contratadaSimilar);
          });

          if (potentialDuplicates.length > 0) {
            duplicates.push({
              contract,
              existing: potentialDuplicates
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
    } finally {
      setChecking(false);
    }

    return duplicates;
  };

  return {
    checking,
    checkForDuplicates
  };
}