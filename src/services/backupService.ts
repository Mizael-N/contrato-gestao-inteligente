
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
        version: '2.1.0', // Versão atualizada para incluir correções de vigência
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
      
      // Validar estrutura do backup
      if (!backupData.version || !backupData.contracts) {
        throw new Error('Arquivo de backup inválido');
      }

      // Restaurar contratos
      if (backupData.contracts.length > 0) {
        console.log(`📄 Restaurando ${backupData.contracts.length} contratos...`);
        
        // Converter contratos para formato do banco, limpando campos antigos
        const dbContracts = backupData.contracts.map((contract, index) => {
          try {
            console.log(`🔄 Processando contrato ${index + 1}/${backupData.contracts.length}: ${contract.numero}`);
            
            // Limpar dados antigos que podem estar presentes em backups antigos
            const cleanedContract = {
              ...contract,
              // Remover campos que não existem mais
              fiscais: undefined,
              garantia: undefined,
              fiscalTitular: undefined,
              fiscalSubstituto: undefined,
              garantiaTipo: undefined,
              garantiaValor: undefined,
              garantiaVencimento: undefined
            };
            
            const insertData = transformContractToInsert(cleanedContract);
            console.log(`✅ Contrato ${contract.numero} processado com sucesso`);
            return insertData;
          } catch (error) {
            console.error(`❌ Erro ao processar contrato ${contract.numero}:`, error);
            throw new Error(`Erro ao processar contrato ${contract.numero}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
        });
        
        // Inserir em lotes menores para melhor controle
        const batchSize = 25; // Reduzido para evitar timeouts
        for (let i = 0; i < dbContracts.length; i += batchSize) {
          const batch = dbContracts.slice(i, i + batchSize);
          const batchNumber = Math.floor(i/batchSize) + 1;
          const totalBatches = Math.ceil(dbContracts.length/batchSize);
          
          console.log(`🔄 Inserindo lote ${batchNumber}/${totalBatches} (${batch.length} contratos)...`);
          
          try {
            const { error: contractsError, data } = await supabase
              .from('contracts')
              .upsert(batch, { 
                onConflict: 'numero',
                ignoreDuplicates: false 
              })
              .select('numero');
            
            if (contractsError) {
              console.error('❌ Erro detalhado do Supabase:', contractsError);
              throw contractsError;
            }
            
            console.log(`✅ Lote ${batchNumber} inserido com sucesso (${data?.length || batch.length} contratos)`);
          } catch (batchError) {
            console.error(`❌ Erro ao inserir lote ${batchNumber}:`, batchError);
            throw new Error(`Erro no lote ${batchNumber}: ${batchError instanceof Error ? batchError.message : 'Erro desconhecido'}`);
          }
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
          throw new Error(`Erro ao restaurar fornecedores: ${suppliersError instanceof Error ? suppliersError.message : 'Erro desconhecido'}`);
        }
      }

      console.log('🎉 Dados restaurados com sucesso!');
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
          const data = JSON.parse(content) as BackupData;
          
          // Validações básicas
          if (!data.version || !data.timestamp) {
            throw new Error('Arquivo de backup inválido: campos obrigatórios ausentes');
          }
          
          if (!Array.isArray(data.contracts)) {
            throw new Error('Arquivo de backup inválido: contratos devem ser um array');
          }

          // Validar cada contrato
          data.contracts.forEach((contract, index) => {
            if (!contract.numero) {
              throw new Error(`Contrato ${index + 1} não possui número`);
            }
            if (!contract.objeto) {
              throw new Error(`Contrato ${contract.numero} não possui objeto`);
            }
          });
          
          console.log(`📂 Arquivo de backup validado:`, {
            versao: data.version,
            contratos: data.contracts.length,
            fornecedores: data.suppliers?.length || 0,
            timestamp: data.timestamp
          });
          
          resolve(data);
        } catch (error) {
          reject(new Error(`Erro ao ler arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  }
}
