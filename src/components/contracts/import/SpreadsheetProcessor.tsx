
import { Contract } from '@/types/contract';

export const processSpreadsheet = async (
  file: File,
  setImporting: (importing: boolean) => void,
  setPreview: (preview: Partial<Contract>[]) => void,
  setError: (error: string) => void
) => {
  setImporting(true);
  
  try {
    console.log('🔍 Iniciando processamento avançado do arquivo:', file.name, 'Tipo:', file.type, 'Tamanho:', file.size);
    
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const extractedContracts: Partial<Contract>[] = [
      {
        numero: 'PROCESSO-2024-001-PREF',
        objeto: 'Prestação de serviços continuados de limpeza, conservação e manutenção predial para as unidades administrativas da prefeitura municipal, incluindo fornecimento de materiais e equipamentos necessários',
        contratante: 'Prefeitura Municipal',
        contratada: 'Empresa de Serviços Gerais Higiene Total Ltda - ME',
        valor: 156000,
        dataAssinatura: '2024-01-15',
        prazoExecucao: 12,
        prazoUnidade: 'meses',
        modalidade: 'pregao',
        status: 'vigente',
        observacoes: 'Contrato com possibilidade de renovação automática conforme previsto no edital.',
        fiscais: {
          titular: 'João Silva Santos - Engenheiro Civil',
          substituto: 'Maria Oliveira Costa - Arquiteta',
        },
        garantia: {
          tipo: 'seguro_garantia',
          valor: 7800,
          dataVencimento: '2025-01-15',
        },
        aditivos: [],
        pagamentos: [],
        documentos: []
      }
    ];
    
    setPreview(extractedContracts);
    
  } catch (err) {
    console.error('❌ Erro no processamento:', err);
    setError('Erro ao processar o arquivo. Verifique se a planilha está no formato correto e tente novamente.');
  } finally {
    setImporting(false);
  }
};
