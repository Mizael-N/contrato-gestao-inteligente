
import { supabase } from '@/integrations/supabase/client';
import { Contract } from '@/types/contract';

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
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        contracts: contractsResult.data || [],
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
      
      // Validar estrutura do backup
      if (!backupData.version || !backupData.contracts) {
        throw new Error('Arquivo de backup inválido');
      }

      // Limpar dados existentes (apenas se confirmado pelo usuário)
      // Esta operação deve ser feita com muito cuidado
      
      // Restaurar contratos
      if (backupData.contracts.length > 0) {
        const { error: contractsError } = await supabase
          .from('contracts')
          .upsert(backupData.contracts, { onConflict: 'id' });
        
        if (contractsError) throw contractsError;
      }

      // Restaurar fornecedores
      if (backupData.suppliers?.length > 0) {
        const { error: suppliersError } = await supabase
          .from('suppliers')
          .upsert(backupData.suppliers, { onConflict: 'id' });
        
        if (suppliersError) throw suppliersError;
      }

      console.log('✅ Dados restaurados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao restaurar dados:', error);
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
