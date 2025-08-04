
import { supabase } from '@/integrations/supabase/client';
import { Contract } from '@/types/contract';
import { 
  transformDatabaseContracts, 
  transformContractToInsert,
  DatabaseContract 
} from '@/utils/contractTransformers';

export interface BackupData {
  version: string;
  timestamp: string;
  contracts: Contract[];
  suppliers: any[];
  users: any[];
}

export class BackupService {
  static async exportData(): Promise<BackupData> {
    try {
      console.log('🔄 Iniciando exportação de dados...');
      
      // Buscar todos os dados
      const [contractsResult, suppliersResult] = await Promise.all([
        supabase.from('contracts').select('*'),
        supabase.from('suppliers').select('*')
      ]);

      if (contractsResult.error) throw contractsResult.error;
      if (suppliersResult.error) throw suppliersResult.error;

      const backupData: BackupData = {
        version: '2.2.0', // Versão atualizada para incluir campos data_inicio e data_termino
        timestamp: new Date().toISOString(),
        contracts: transformDatabaseContracts(contractsResult.data || []),
        suppliers: suppliersResult.data || [],
        users: [] // Por segurança, não incluir dados de usuários
      };

      console.log('✅ Dados exportados com sucesso:', {
        contracts: backupData.contracts.length,
        suppliers: backupData.suppliers.length
      });

      return backupData;
    } catch (error) {
      console.error('❌ Erro ao exportar dados:', error);
      throw error;
    }
  }

  static async downloadBackup(data: BackupData, filename?: string): Promise<void> {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `backup-sgl-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      console.log('✅ Backup baixado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao baixar backup:', error);
      throw error;
    }
  }

  static async restoreData(backupData: BackupData): Promise<void> {
    try {
      console.log('🔄 Iniciando restauração de dados...');
      console.log('📋 Versão do backup:', backupData.version);
      console.log('📊 Dados a restaurar:', {
        contratos: backupData.contracts?.length || 0,
        fornecedores: backupData.suppliers?.length || 0
      });
      
      // Validar estrutura do backup
      if (!backupData.version || !backupData.contracts) {
        throw new Error('Arquivo de backup inválido: estrutura básica ausente');
      }

      // Restaurar contratos
      if (backupData.contracts.length > 0) {
        console.log(`📄 Iniciando restauração de ${backupData.contracts.length} contratos...`);
        
        // Validar e converter contratos um por um
        const validContracts: any[] = [];
        const invalidContracts: string[] = [];
        
        for (let i = 0; i < backupData.contracts.length; i++) {
          const contract = backupData.contracts[i];
          const contractNumber = i + 1;
          
          try {
            console.log(`🔍 Validando contrato ${contractNumber}/${backupData.contracts.length}: "${contract.numero}"`);
            
            // Validações básicas
            if (!contract.numero) {
              throw new Error('Número do contrato não informado');
            }
            if (!contract.objeto) {
              throw new Error('Objeto do contrato não informado');
            }
            if (!contract.contratante) {
              throw new Error('Contratante não informado');
            }
            if (!contract.contratada) {
              throw new Error('Contratada não informada');
            }
            
            // Limpar campos antigos e converter
            const cleanedContract = {
              numero: contract.numero,
              objeto: contract.objeto,
              contratante: contract.contratante,
              contratada: contract.contratada,
              valor: contract.valor || 0,
              dataAssinatura: contract.dataAssinatura || new Date().toISOString().split('T')[0],
              dataInicio: contract.dataInicio || contract.dataAssinatura || new Date().toISOString().split('T')[0],
              dataTermino: contract.dataTermino,
              prazoExecucao: contract.prazoExecucao || 365,
              prazoUnidade: contract.prazoUnidade || 'dias',
              modalidade: contract.modalidade || 'pregao',
              status: contract.status || 'vigente',
              observacoes: contract.observacoes || ''
            };
            
            const insertData = transformContractToInsert(cleanedContract);
            validContracts.push(insertData);
            
            console.log(`✅ Contrato "${contract.numero}" validado com sucesso`);
            
          } catch (contractError) {
            const errorMsg = `Contrato ${contractNumber} ("${contract.numero || 'sem número'}"): ${contractError instanceof Error ? contractError.message : 'Erro desconhecido'}`;
            console.error(`❌ ${errorMsg}`);
            invalidContracts.push(errorMsg);
          }
        }
        
        // Reportar contratos inválidos
        if (invalidContracts.length > 0) {
          console.warn(`⚠️ ${invalidContracts.length} contratos inválidos encontrados:`, invalidContracts);
        }
        
        console.log(`📊 Resumo da validação: ${validContracts.length} válidos, ${invalidContracts.length} inválidos`);
        
        // Inserir contratos válidos em lotes pequenos
        if (validContracts.length > 0) {
          const batchSize = 10; // Reduzido ainda mais para evitar problemas
          let insertedCount = 0;
          
          for (let i = 0; i < validContracts.length; i += batchSize) {
            const batch = validContracts.slice(i, i + batchSize);
            const batchNumber = Math.floor(i/batchSize) + 1;
            const totalBatches = Math.ceil(validContracts.length/batchSize);
            
            console.log(`🔄 Inserindo lote ${batchNumber}/${totalBatches} (${batch.length} contratos)...`);
            
            try {
              // Log detalhado do primeiro contrato do lote para debug
              if (batch.length > 0) {
                console.log('📋 Exemplo de dados sendo inseridos:', JSON.stringify(batch[0], null, 2));
              }
              
              const { error: contractsError, data, count } = await supabase
                .from('contracts')
                .upsert(batch, { 
                  onConflict: 'numero',
                  ignoreDuplicates: false 
                })
                .select('numero, id');
              
              if (contractsError) {
                console.error('❌ Erro detalhado do Supabase:', {
                  message: contractsError.message,
                  details: contractsError.details,
                  hint: contractsError.hint,
                  code: contractsError.code
                });
                throw contractsError;
              }
              
              const actualInserted = data?.length || batch.length;
              insertedCount += actualInserted;
              
              console.log(`✅ Lote ${batchNumber} inserido com sucesso (${actualInserted} contratos)`);
              
              // Aguardar um pouco entre lotes para evitar sobrecarga
              if (i + batchSize < validContracts.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
              
            } catch (batchError) {
              console.error(`❌ Erro ao inserir lote ${batchNumber}:`, batchError);
              
              // Tentar inserir contratos individualmente neste lote
              console.log(`🔄 Tentando inserir contratos do lote ${batchNumber} individualmente...`);
              for (const contract of batch) {
                try {
                  const { error: singleError } = await supabase
                    .from('contracts')
                    .upsert([contract], { onConflict: 'numero', ignoreDuplicates: false });
                  
                  if (singleError) {
                    console.error(`❌ Erro ao inserir contrato "${contract.numero}":`, singleError);
                  } else {
                    insertedCount++;
                    console.log(`✅ Contrato "${contract.numero}" inserido individualmente`);
                  }
                } catch (singleContractError) {
                  console.error(`❌ Erro crítico ao inserir contrato "${contract.numero}":`, singleContractError);
                }
              }
            }
          }
          
          console.log(`📊 Resumo da inserção: ${insertedCount}/${validContracts.length} contratos inseridos com sucesso`);
        }
      }

      // Restaurar fornecedores
      if (backupData.suppliers?.length > 0) {
        console.log(`🏢 Restaurando ${backupData.suppliers.length} fornecedores...`);
        
        try {
          const { error: suppliersError } = await supabase
            .from('suppliers')
            .upsert(backupData.suppliers, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });
          
          if (suppliersError) {
            console.error('❌ Erro ao restaurar fornecedores:', suppliersError);
            throw suppliersError;
          }
          
          console.log('✅ Fornecedores restaurados com sucesso');
        } catch (suppliersError) {
          console.error('❌ Erro ao restaurar fornecedores:', suppliersError);
          console.warn('⚠️ Continuando sem restaurar fornecedores...');
        }
      }

      console.log('🎉 Restauração concluída!');
    } catch (error) {
      console.error('❌ Erro geral na restauração:', error);
      throw error;
    }
  }

  static validateBackupFile(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          
          console.log('📂 Lendo conteúdo do arquivo...');
          
          if (!content || content.trim().length === 0) {
            throw new Error('Arquivo vazio ou ilegível');
          }
          
          let data: BackupData;
          try {
            data = JSON.parse(content) as BackupData;
          } catch (parseError) {
            throw new Error('Arquivo não é um JSON válido');
          }
          
          console.log('📋 Estrutura do arquivo:', {
            version: data.version,
            timestamp: data.timestamp,
            hasContracts: !!data.contracts,
            contractsLength: data.contracts?.length || 0,
            hasSuppliers: !!data.suppliers,
            suppliersLength: data.suppliers?.length || 0
          });
          
          // Validações básicas
          if (!data.version) {
            throw new Error('Arquivo de backup inválido: versão não encontrada');
          }
          
          if (!data.timestamp) {
            throw new Error('Arquivo de backup inválido: timestamp não encontrado');
          }
          
          if (!Array.isArray(data.contracts)) {
            throw new Error('Arquivo de backup inválido: contratos devem ser um array');
          }

          // Validar amostra de contratos
          const sampleSize = Math.min(5, data.contracts.length);
          for (let i = 0; i < sampleSize; i++) {
            const contract = data.contracts[i];
            if (!contract.numero) {
              throw new Error(`Amostra - Contrato ${i + 1} não possui número`);
            }
            if (!contract.objeto) {
              throw new Error(`Amostra - Contrato ${contract.numero} não possui objeto`);
            }
          }
          
          console.log(`📂 Arquivo de backup validado com sucesso`);
          
          resolve(data);
        } catch (error) {
          const errorMsg = `Erro ao ler arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
          console.error('❌', errorMsg);
          reject(new Error(errorMsg));
        }
      };
      
      reader.onerror = () => {
        const errorMsg = 'Erro ao ler arquivo do disco';
        console.error('❌', errorMsg);
        reject(new Error(errorMsg));
      };
      
      reader.readAsText(file);
    });
  }
}
