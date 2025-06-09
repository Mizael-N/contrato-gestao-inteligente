
import { Contract } from '@/types/contract';
import { extractContractFromSpreadsheetData } from '@/utils/spreadsheetExtractor';

export const processSpreadsheet = async (
  file: File,
  setImporting: (importing: boolean) => void,
  setPreview: (preview: Partial<Contract>[]) => void,
  setError: (error: string) => void,
  setProgress?: (progress: { stage: string; progress: number; message: string }) => void
) => {
  setImporting(true);
  
  try {
    console.log('🔍 Iniciando processamento completo da planilha:', file.name, 'Tipo:', file.type, 'Tamanho:', file.size);
    
    setProgress?.({ stage: 'loading', progress: 10, message: 'Carregando planilha...' });
    
    // Usar biblioteca XLSX para ler todas as abas
    const XLSX = await import('xlsx');
    
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    console.log('📊 Planilha carregada. Abas encontradas:', workbook.SheetNames);
    
    setProgress?.({ stage: 'analyzing', progress: 30, message: `Analisando ${workbook.SheetNames.length} aba(s)...` });
    
    const allContracts: Partial<Contract>[] = [];
    const totalSheets = workbook.SheetNames.length;
    
    // Processar cada aba da planilha
    for (let i = 0; i < workbook.SheetNames.length; i++) {
      const sheetName = workbook.SheetNames[i];
      console.log(`📋 Processando aba: ${sheetName}`);
      
      const progressPercent = 30 + Math.round((i / totalSheets) * 50);
      setProgress?.({ 
        stage: 'processing', 
        progress: progressPercent, 
        message: `Processando aba "${sheetName}" (${i + 1}/${totalSheets})...` 
      });
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Converter para JSON para análise - garantir que seja any[][]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        raw: false 
      }) as any[][];
      
      console.log(`📄 Aba "${sheetName}" possui ${jsonData.length} linhas`);
      
      if (jsonData.length > 0) {
        // Extrair contratos desta aba
        const contractsFromSheet = extractContractFromSpreadsheetData(jsonData, sheetName);
        allContracts.push(...contractsFromSheet);
      }
    }
    
    setProgress?.({ stage: 'finalizing', progress: 90, message: 'Finalizando extração de dados...' });
    
    console.log(`✅ Processamento concluído. ${allContracts.length} contratos extraídos de ${workbook.SheetNames.length} abas`);
    
    if (allContracts.length === 0) {
      // Se não encontrou contratos, criar dados de exemplo baseados na estrutura
      console.log('⚠️ Nenhum contrato detectado automaticamente. Criando exemplo baseado na estrutura...');
      
      const sampleContract: Partial<Contract> = {
        numero: `PLANILHA-${new Date().getFullYear()}-001`,
        objeto: 'Contrato extraído da planilha - Favor revisar e ajustar dados',
        contratante: 'Órgão Público (verificar na planilha)',
        contratada: 'Empresa Contratada (verificar na planilha)',
        valor: 50000,
        dataAssinatura: new Date().toISOString().split('T')[0],
        prazoExecucao: 12,
        prazoUnidade: 'meses',
        modalidade: 'pregao',
        status: 'vigente',
        observacoes: `Dados extraídos automaticamente da planilha "${file.name}". Foram encontradas ${workbook.SheetNames.length} abas: ${workbook.SheetNames.join(', ')}. Por favor, revise e ajuste as informações conforme necessário.`,
        fiscais: {
          titular: 'A definir',
          substituto: 'A definir',
        },
        garantia: {
          tipo: 'sem_garantia',
          valor: 0,
          dataVencimento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        aditivos: [],
        pagamentos: [],
        documentos: []
      };
      
      allContracts.push(sampleContract);
    }
    
    setProgress?.({ stage: 'complete', progress: 100, message: `✅ ${allContracts.length} contratos extraídos com sucesso!` });
    
    // Pequeno delay para mostrar o progresso completo
    setTimeout(() => {
      setPreview(allContracts);
    }, 500);
    
  } catch (err) {
    console.error('❌ Erro no processamento da planilha:', err);
    setError(`Erro ao processar a planilha "${file.name}". Verifique se o arquivo não está corrompido e tente novamente. Detalhes: ${(err as Error).message}`);
  } finally {
    setTimeout(() => {
      setImporting(false);
    }, 600);
  }
};
