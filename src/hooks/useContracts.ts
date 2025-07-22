
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Contract, Aditivo } from '@/types/contract';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/contexts/NotificationContext';

const CONTRACTS_QUERY_KEY = ['contracts'];

export function useContracts() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotifications();

  // Query principal para buscar contratos com cache
  const {
    data: contracts = [],
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: CONTRACTS_QUERY_KEY,
    queryFn: async () => {
      console.log('🔄 Buscando contratos do Supabase...');
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar contratos:', error);
        throw error;
      }

      console.log('✅ Contratos carregados:', data?.length || 0);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  // Mutation para criar contrato
  const createContractMutation = useMutation({
    mutationFn: async (contractData: Partial<Contract>) => {
      console.log('📝 Criando novo contrato:', contractData);
      const { data, error } = await supabase
        .from('contracts')
        .insert([contractData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newContract) => {
      // Atualizar cache imediatamente
      queryClient.setQueryData(CONTRACTS_QUERY_KEY, (old: Contract[] = []) => [
        newContract,
        ...old
      ]);
      showNotification('Sucesso', 'Contrato criado com sucesso!', 'success');
    },
    onError: (error) => {
      console.error('❌ Erro ao criar contrato:', error);
      showNotification('Erro', 'Falha ao criar contrato.', 'error');
    }
  });

  // Mutation para atualizar contrato
  const updateContractMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Contract> }) => {
      console.log('📝 Atualizando contrato:', id, data);
      const { data: updatedData, error } = await supabase
        .from('contracts')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedData;
    },
    onSuccess: (updatedContract) => {
      // Atualizar cache imediatamente
      queryClient.setQueryData(CONTRACTS_QUERY_KEY, (old: Contract[] = []) =>
        old.map(contract => 
          contract.id === updatedContract.id ? updatedContract : contract
        )
      );
      showNotification('Sucesso', 'Contrato atualizado com sucesso!', 'success');
    },
    onError: (error) => {
      console.error('❌ Erro ao atualizar contrato:', error);
      showNotification('Erro', 'Falha ao atualizar contrato.', 'error');
    }
  });

  // Mutation para deletar contrato
  const deleteContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      console.log('🗑️ Deletando contrato:', contractId);
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractId);

      if (error) throw error;
      return contractId;
    },
    onSuccess: (deletedId) => {
      // Remover do cache imediatamente
      queryClient.setQueryData(CONTRACTS_QUERY_KEY, (old: Contract[] = []) =>
        old.filter(contract => contract.id !== deletedId)
      );
      showNotification('Sucesso', 'Contrato removido com sucesso!', 'success');
    },
    onError: (error) => {
      console.error('❌ Erro ao deletar contrato:', error);
      showNotification('Erro', 'Falha ao remover contrato.', 'error');
    }
  });

  // Mutation para criar aditivo
  const createAddendumMutation = useMutation({
    mutationFn: async ({ contractId, addendumData }: { contractId: string; addendumData: Omit<Aditivo, 'id'> }) => {
      console.log('📝 Criando aditivo para contrato:', contractId, addendumData);
      
      // Buscar contrato atual
      const { data: contract, error: fetchError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (fetchError) throw fetchError;

      // Adicionar novo aditivo
      const newAddendum = {
        ...addendumData,
        id: crypto.randomUUID(),
      };

      const updatedAddendums = [...(contract.aditivos || []), newAddendum];

      // Atualizar contrato com novo aditivo
      const { data: updatedContract, error: updateError } = await supabase
        .from('contracts')
        .update({ aditivos: updatedAddendums })
        .eq('id', contractId)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedContract;
    },
    onSuccess: (updatedContract) => {
      // Atualizar cache
      queryClient.setQueryData(CONTRACTS_QUERY_KEY, (old: Contract[] = []) =>
        old.map(contract => 
          contract.id === updatedContract.id ? updatedContract : contract
        )
      );
      showNotification('Sucesso', 'Aditivo criado com sucesso!', 'success');
    },
    onError: (error) => {
      console.error('❌ Erro ao criar aditivo:', error);
      showNotification('Erro', 'Falha ao criar aditivo.', 'error');
    }
  });

  // Funções expostas
  const createContract = useCallback((contractData: Partial<Contract>) => {
    return createContractMutation.mutateAsync(contractData);
  }, [createContractMutation]);

  const updateContract = useCallback((id: string, data: Partial<Contract>) => {
    return updateContractMutation.mutateAsync({ id, data });
  }, [updateContractMutation]);

  const deleteContract = useCallback((contractId: string) => {
    return deleteContractMutation.mutateAsync(contractId);
  }, [deleteContractMutation]);

  const createAddendum = useCallback((contractId: string, addendumData: Omit<Aditivo, 'id'>) => {
    return createAddendumMutation.mutateAsync({ contractId, addendumData });
  }, [createAddendumMutation]);

  return {
    contracts,
    loading,
    error,
    refetch,
    createContract,
    updateContract,
    deleteContract,
    createAddendum,
    isCreating: createContractMutation.isPending,
    isUpdating: updateContractMutation.isPending,
    isDeleting: deleteContractMutation.isPending,
  };
}
