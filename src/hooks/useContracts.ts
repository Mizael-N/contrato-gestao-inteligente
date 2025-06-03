
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contract, Aditivo, Pagamento, Documento } from '@/types/contract';
import { useToast } from '@/hooks/use-toast';

export const useContracts = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Converter dados do banco para o formato da aplicação
  const mapDatabaseToContract = (dbContract: any, addendums: any[] = [], payments: any[] = [], documents: any[] = []): Contract => {
    return {
      id: dbContract.id,
      numero: dbContract.numero,
      objeto: dbContract.objeto,
      contratante: dbContract.contratante,
      contratada: dbContract.contratada,
      valor: parseFloat(dbContract.valor),
      dataAssinatura: dbContract.data_assinatura,
      prazoExecucao: dbContract.prazo_execucao,
      prazoUnidade: dbContract.prazo_unidade,
      modalidade: dbContract.modalidade,
      status: dbContract.status,
      observacoes: dbContract.observacoes || '',
      fiscais: {
        titular: dbContract.fiscal_titular || '',
        substituto: dbContract.fiscal_substituto || ''
      },
      garantia: {
        tipo: dbContract.garantia_tipo,
        valor: parseFloat(dbContract.garantia_valor),
        dataVencimento: dbContract.garantia_vencimento || ''
      },
      aditivos: addendums.map(mapDatabaseToAddendum),
      pagamentos: payments.map(mapDatabaseToPayment),
      documentos: documents.map(mapDatabaseToDocument)
    };
  };

  const mapDatabaseToAddendum = (dbAddendum: any): Aditivo => ({
    id: dbAddendum.id,
    numero: dbAddendum.numero,
    tipo: dbAddendum.tipo,
    justificativa: dbAddendum.justificativa,
    valorAnterior: dbAddendum.valor_anterior ? parseFloat(dbAddendum.valor_anterior) : undefined,
    valorNovo: dbAddendum.valor_novo ? parseFloat(dbAddendum.valor_novo) : undefined,
    prazoAnterior: dbAddendum.prazo_anterior || undefined,
    prazoNovo: dbAddendum.prazo_novo || undefined,
    dataAssinatura: dbAddendum.data_assinatura
  });

  const mapDatabaseToPayment = (dbPayment: any): Pagamento => ({
    id: dbPayment.id,
    numero: dbPayment.numero,
    valor: parseFloat(dbPayment.valor),
    dataVencimento: dbPayment.data_vencimento,
    dataPagamento: dbPayment.data_pagamento || undefined,
    status: dbPayment.status,
    observacoes: dbPayment.observacoes || ''
  });

  const mapDatabaseToDocument = (dbDocument: any): Documento => ({
    id: dbDocument.id,
    nome: dbDocument.nome,
    tipo: dbDocument.tipo,
    dataUpload: dbDocument.data_upload,
    url: dbDocument.url
  });

  // Converter dados da aplicação para o formato do banco
  const mapContractToDatabase = (contract: Partial<Contract>) => ({
    numero: contract.numero,
    objeto: contract.objeto,
    contratante: contract.contratante,
    contratada: contract.contratada,
    valor: contract.valor,
    data_assinatura: contract.dataAssinatura,
    prazo_execucao: contract.prazoExecucao,
    prazo_unidade: contract.prazoUnidade,
    modalidade: contract.modalidade,
    status: contract.status,
    observacoes: contract.observacoes,
    fiscal_titular: contract.fiscais?.titular,
    fiscal_substituto: contract.fiscais?.substituto,
    garantia_tipo: contract.garantia?.tipo,
    garantia_valor: contract.garantia?.valor,
    garantia_vencimento: contract.garantia?.dataVencimento
  });

  // Buscar todos os contratos
  const fetchContracts = async () => {
    try {
      setLoading(true);
      
      // Buscar contratos
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contractsError) throw contractsError;

      // Buscar dados relacionados para cada contrato
      const contractsWithRelations = await Promise.all(
        (contractsData || []).map(async (contract) => {
          const [addendums, payments, documents] = await Promise.all([
            supabase.from('addendums').select('*').eq('contract_id', contract.id),
            supabase.from('payments').select('*').eq('contract_id', contract.id),
            supabase.from('documents').select('*').eq('contract_id', contract.id)
          ]);

          return mapDatabaseToContract(
            contract,
            addendums.data || [],
            payments.data || [],
            documents.data || []
          );
        })
      );

      setContracts(contractsWithRelations);
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os contratos.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar contrato
  const createContract = async (contractData: Partial<Contract>) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .insert([mapContractToDatabase(contractData)])
        .select()
        .single();

      if (error) throw error;

      const newContract = mapDatabaseToContract(data);
      setContracts(prev => [newContract, ...prev]);
      
      toast({
        title: 'Sucesso',
        description: 'Contrato criado com sucesso!'
      });

      return newContract;
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o contrato.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Atualizar contrato
  const updateContract = async (id: string, contractData: Partial<Contract>) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .update(mapContractToDatabase(contractData))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchContracts(); // Recarregar para pegar dados atualizados com relações
      
      toast({
        title: 'Sucesso',
        description: 'Contrato atualizado com sucesso!'
      });

      return data;
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o contrato.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Deletar contrato
  const deleteContract = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContracts(prev => prev.filter(contract => contract.id !== id));
      
      toast({
        title: 'Sucesso',
        description: 'Contrato excluído com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao deletar contrato:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o contrato.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Criar aditivo
  const createAddendum = async (contractId: string, addendumData: Omit<Aditivo, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('addendums')
        .insert([{
          contract_id: contractId,
          numero: addendumData.numero,
          tipo: addendumData.tipo,
          justificativa: addendumData.justificativa,
          valor_anterior: addendumData.valorAnterior,
          valor_novo: addendumData.valorNovo,
          prazo_anterior: addendumData.prazoAnterior,
          prazo_novo: addendumData.prazoNovo,
          data_assinatura: addendumData.dataAssinatura
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar valores do contrato principal se necessário
      if (addendumData.tipo === 'valor' && addendumData.valorNovo) {
        await updateContract(contractId, { valor: addendumData.valorNovo });
      }
      if (addendumData.tipo === 'prazo' && addendumData.prazoNovo) {
        await updateContract(contractId, { prazoExecucao: addendumData.prazoNovo });
      }

      await fetchContracts(); // Recarregar contratos
      
      toast({
        title: 'Sucesso',
        description: 'Termo aditivo criado com sucesso!'
      });

      return data;
    } catch (error) {
      console.error('Erro ao criar aditivo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o termo aditivo.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  return {
    contracts,
    loading,
    createContract,
    updateContract,
    deleteContract,
    createAddendum,
    refetch: fetchContracts
  };
};
