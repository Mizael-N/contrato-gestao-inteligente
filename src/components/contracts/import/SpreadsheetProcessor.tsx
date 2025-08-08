
import { Contract } from '@/types/contract';
import { extractContractFromSpreadsheetDataIntelligent } from '@/utils/intelligentSpreadsheetExtractor';

export const processSpreadsheet = async (
  file: File,
  setImporting: (importing: boolean) => void,
  setPreview: (preview: Partial<Contract>[]) => void,
  setError: (error: string) => void,
  setProgress?: (progress: { stage: string; progress: number; message: string }) => void
) => {
  setImporting(true);
  setError('');
  
  console.log('🚀 PROCESSAMENTO OTIMIZADO iniciado:', {
    nome: file.name,
    tipo: file.type,
    tamanho: `${(file.size / 1024).toFixed(2)} KB`
  });
  
  try {
    setProgress?.({ stage: 'loading', progress: 10, message: '📄 Carregando arquivo...' });
    
    // Verificações básicas
    if (file.size === 0) {
      throw new Error('Arquivo está vazio');
    }
    
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('Arquivo muito grande. Limite: 20MB');
    }
    
    console.log('📚 Carregando biblioteca XLSX...');
    const XLSX = await import('xlsx');
    console.log('✅ XLSX carregado');
    
    setProgress?.({ stage: 'reading', progress: 20, message: '📖 Lendo dados...' });
    
    const arrayBuffer = await file.arrayBuffer();
    console.log(`📄 Arquivo lido: ${arrayBuffer.byteLength} bytes`);
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Não foi possível ler o arquivo');
    }
    
    setProgress?.({ stage: 'parsing', progress: 30, message: '🧠 Analisando estrutura...' });
    
    // Configuração OTIMIZADA para máxima precisão
    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false,
      raw: false,
      dateNF: 'yyyy-mm-dd',
      cellStyles: true,
      cellHTML: false,
      sheetStubs: false
    });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Planilha não contém abas válidas');
    }
    
    console.log('📊 Workbook carregado:', {
      abas: workbook.SheetNames,
      totalAbas: workbook.SheetNames.length
    });
    
    setProgress?.({ 
      stage: 'analyzing', 
      progress: 40, 
      message: `🧠 Processando ${workbook.SheetNames.length} aba(s): ${workbook.SheetNames.join(', ')}` 
    });
    
    const allContracts: Partial<Contract>[] = [];
    const totalSheets = workbook.SheetNames.length;
    
    // Processamento OTIMIZADO de cada aba
    for (let i = 0; i < workbook.SheetNames.length; i++) {
      const sheetName = workbook.SheetNames[i];
      console.log(`🧠 Processando aba ${i + 1}/${totalSheets}: "${sheetName}"`);
      
      const progressPercent = 40 + Math.round((i / totalSheets) * 45);
      setProgress?.({ 
        stage: 'extracting', 
        progress: progressPercent, 
        message: `🧠 Extraindo aba "${sheetName}" (${i + 1}/${totalSheets})...` 
      });
      
      try {
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet || !worksheet['!ref']) {
          console.log(`⚠️ Aba "${sheetName}" vazia ou inacessível`);
          continue;
        }
        
        // Conversão OTIMIZADA
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: null,
          raw: false,
          dateNF: 'yyyy-mm-dd',
          blankrows: false
        }) as any[][];
        
        console.log(`📄 Aba "${sheetName}" convertida: ${jsonData.length} linhas`);
        
        // Filtrar linhas vazias
        const filteredData = jsonData.filter((row, index) => {
          if (index === 0) return true; // Manter cabeçalho
          return row && row.some(cell => 
            cell !== null && 
            cell !== undefined && 
            String(cell).trim() !== ''
          );
        });
        
        if (filteredData.length < 2) {
          console.log(`⚠️ Aba "${sheetName}" sem dados úteis`);
          continue;
        }
        
        console.log(`🎯 Aba "${sheetName}" preparada: ${filteredData.length} linhas`);
        
        // Aplicar extração OTIMIZADA
        const contractsFromSheet = extractContractFromSpreadsheetDataIntelligent(
          filteredData, 
          sheetName, 
          file.name
        );
        
        if (contractsFromSheet.length > 0) {
          console.log(`✅ Extraído ${contractsFromSheet.length} contrato(s) da aba "${sheetName}"`);
          allContracts.push(...contractsFromSheet);
        } else {
          console.log(`⚠️ Nenhum contrato identificado na aba "${sheetName}"`);
        }
        
      } catch (sheetError) {
        console.error(`❌ Erro na aba "${sheetName}":`, sheetError);
      }
    }
    
    setProgress?.({ stage: 'finalizing', progress: 90, message: '🎯 Finalizando...' });
    
    console.log(`🏁 PROCESSAMENTO CONCLUÍDO: ${allContracts.length} contratos`);
    
    // Se nenhum contrato foi extraído, criar exemplo
    if (allContracts.length === 0) {
      console.log('🔄 Criando exemplo...');
      
      const sampleContract: Partial<Contract> = {
        numero: `EXEMPLO-${new Date().getFullYear()}-001`,
        objeto: `Análise da planilha "${file.name}": Não foram identificados contratos automaticamente. ` +
               `Verifique se os cabeçalhos estão em português/inglês e se há dados em formato tabular.`,
        contratante: 'Órgão Público (revisar planilha)',
        contratada: 'Empresa Contratada (revisar planilha)',
        valor: 0,
        dataInicio: '',
        dataTermino: '',
        prazoExecucao: 0,
        prazoUnidade: 'dias',
        modalidade: 'pregao',
        status: 'vigente',
        observacoes: `Arquivo "${file.name}" processado. ${workbook.SheetNames.length} aba(s): ${workbook.SheetNames.join(', ')}. ` +
                    `Sistema não conseguiu identificar contratos automaticamente. ` +
                    `Verifique se os dados estão em formato tabular com cabeçalhos apropriados.`,
        aditivos: [],
        pagamentos: [],
        documentos: []
      };
      
      allContracts.push(sampleContract);
    }
    
    setProgress?.({ 
      stage: 'complete', 
      progress: 100, 
      message: `✅ Processamento concluído! ${allContracts.length} contrato(s)` 
    });
    
    console.log('📋 RELATÓRIO FINAL:', {
      arquivo: file.name,
      abas: workbook.SheetNames.length,
      contratos: allContracts.length
    });
    
    // Delay para mostrar resultado
    setTimeout(() => {
      setPreview(allContracts);
      setImporting(false);
    }, 1000);
    
  } catch (err) {
    console.error('❌ Erro no processamento:', err);
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    
    setError(`Falha ao processar "${file.name}": ${errorMessage}. ` +
            `Verifique se o arquivo não está corrompido ou protegido por senha. ` +
            `Formatos suportados: .xlsx, .xls, .csv, .ods.`);
    
    setProgress?.({ stage: 'error', progress: 0, message: `❌ Erro: ${errorMessage}` });
    setImporting(false);
  }
};
