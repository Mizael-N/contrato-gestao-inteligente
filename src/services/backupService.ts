
import { supabase } from '@/integrations/supabase/client';
import { Contract } from '@/types/contract';
import { transformDatabaseToContract, transformContractToInsert } from '@/utils/contractTransformers';

export interface BackupData {
  version: string;
  timestamp: string;
  contracts: Contract[];
}

export const createBackup = async (): Promise<string> => {
  try {
    console.log('🔄 Iniciando criação do backup...');
    
    // Buscar todos os contratos do banco
    const { data: contractsData, error: contractsError } = await supabase
      .from('contracts')
      .select('*');

    if (contractsError) {
      console.error('❌ Erro ao buscar contratos:', contractsError);
      throw contractsError;
    }

    console.log(`📊 ${contractsData?.length || 0} contratos encontrados para backup`);

    // Converter para formato Contract
    const contracts = contractsData?.map(transformDatabaseToContract) || [];

    const backupData: BackupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      contracts: contracts
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    
    console.log('✅ Backup criado com sucesso');
    return jsonString;
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    throw error;
  }
};

export const restoreBackup = async (backupJson: string): Promise<void> => {
  try {
    console.log('🔄 Iniciando restauração do backup...');
    
    // Parse do JSON
    let backupData: BackupData;
    try {
      backupData = JSON.parse(backupJson);
      console.log(`📊 Backup parseado: versão ${backupData.version}, timestamp ${backupData.timestamp}`);
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      throw new Error('Arquivo de backup inválido ou corrompido');
    }

    if (!backupData.contracts || !Array.isArray(backupData.contracts)) {
      throw new Error('Estrutura de backup inválida: contratos não encontrados');
    }

    console.log(`📋 ${backupData.contracts.length} contratos encontrados no backup`);

    // Validar cada contrato individualmente
    const validContracts: Contract[] = [];
    const invalidContracts: any[] = [];

    for (let i = 0; i < backupData.contracts.length; i++) {
      const contract = backupData.contracts[i];
      console.log(`🔍 Validando contrato ${i + 1}/${backupData.contracts.length}: ${contract?.numero || 'Sem número'}`);
      
      try {
        // Verificar campos obrigatórios
        if (!contract) {
          throw new Error('Contrato nulo ou indefinido');
        }

        // Limpar e validar contrato
        const cleanedContract = {
          ...contract,
          // Garantir que os campos obrigatórios existem
          numero: contract.numero || `RESTAURADO-${i + 1}`,
          objeto: contract.objeto || 'Objeto não especificado',
          contratante: contract.contratante || 'Não especificado',
          contratada: contract.contratada || 'Não especificado',
          valor: Number(contract.valor) || 0,
          dataInicio: contract.dataInicio || contract.dataAssinatura || new Date().toISOString().split('T')[0],
          dataTermino: contract.dataTermino || (() => {
            const inicio = new Date(contract.dataInicio || contract.dataAssinatura || new Date());
            inicio.setFullYear(inicio.getFullYear() + 1);
            return inicio.toISOString().split('T')[0];
          })(),
          prazoExecucao: Number(contract.prazoExecucao) || 365,
          prazoUnidade: contract.prazoUnidade || 'dias',
          modalidade: contract.modalidade || 'pregao',
          status: contract.status || 'vigente',
          observacoes: contract.observacoes || 'Restaurado do backup',
          aditivos: contract.aditivos || [],
          pagamentos: contract.pagamentos || [],
          documentos: contract.documentos || []
        };

        validContracts.push(cleanedContract);
        console.log(`✅ Contrato ${i + 1} validado: ${cleanedContract.numero}`);
      } catch (validationError) {
        console.error(`❌ Erro na validação do contrato ${i + 1}:`, validationError);
        invalidContracts.push({ index: i + 1, contract, error: validationError });
      }
    }

    console.log(`📊 Validação concluída: ${validContracts.length} válidos, ${invalidContracts.length} inválidos`);

    if (validContracts.length === 0) {
      throw new Error('Nenhum contrato válido encontrado no backup');
    }

    // Limpar tabela de contratos existentes
    console.log('🧹 Limpando tabela de contratos...');
    const { error: deleteError } = await supabase
      .from('contracts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todos

    if (deleteError) {
      console.error('❌ Erro ao limpar tabela:', deleteError);
      throw deleteError;
    }

    // Inserir contratos em lotes menores para evitar timeout
    const batchSize = 10;
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < validContracts.length; i += batchSize) {
      const batch = validContracts.slice(i, i + batchSize);
      console.log(`📤 Inserindo lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(validContracts.length / batchSize)} (${batch.length} contratos)...`);

      try {
        // Transformar para formato de inserção no banco
        const dbContracts = batch.map(contract => {
          try {
            return transformContractToInsert(contract);
          } catch (transformError) {
            console.error(`❌ Erro ao transformar contrato ${contract.numero}:`, transformError);
            throw transformError;
          }
        });

        // Tentar inserção em lote
        const { error: batchError } = await supabase
          .from('contracts')
          .insert(dbContracts);

        if (batchError) {
          console.error(`❌ Erro no lote ${Math.floor(i / batchSize) + 1}:`, batchError);
          
          // Se o lote falhar, tentar inserir individualmente
          console.log('🔄 Tentando inserção individual para o lote que falhou...');
          for (const contract of batch) {
            try {
              const dbContract = transformContractToInsert(contract);
              const { error: individualError } = await supabase
                .from('contracts')
                .insert([dbContract]);

              if (individualError) {
                console.error(`❌ Erro individual no contrato ${contract.numero}:`, individualError);
                errors.push(`${contract.numero}: ${individualError.message}`);
                errorCount++;
              } else {
                console.log(`✅ Contrato ${contract.numero} inserido individualmente`);
                successCount++;
              }
            } catch (individualTransformError) {
              console.error(`❌ Erro de transformação no contrato ${contract.numero}:`, individualTransformError);
              errors.push(`${contract.numero}: Erro de transformação - ${individualTransformError}`);
              errorCount++;
            }
          }
        } else {
          console.log(`✅ Lote ${Math.floor(i / batchSize) + 1} inserido com sucesso`);
          successCount += batch.length;
        }
      } catch (batchError) {
        console.error(`❌ Erro geral no lote ${Math.floor(i / batchSize) + 1}:`, batchError);
        errors.push(`Lote ${Math.floor(i / batchSize) + 1}: ${batchError}`);
        errorCount += batch.length;
      }
    }

    // Relatório final
    console.log(`📊 Restauração concluída:`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log(`🚨 Erros detalhados:`, errors);
      if (successCount === 0) {
        throw new Error(`Falha completa na restauração. Erros: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
      }
    }

    if (successCount > 0) {
      console.log('✅ Backup restaurado com sucesso!');
    } else {
      throw new Error('Nenhum contrato foi restaurado com sucesso');
    }
  } catch (error) {
    console.error('❌ Erro geral na restauração:', error);
    throw error;
  }
};
