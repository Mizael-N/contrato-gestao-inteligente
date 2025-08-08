
import { Contract } from '@/types/contract';
import { extractContractFromSpreadsheetDataIntelligent } from '@/utils/intelligentSpreadsheetExtractor';

export const processSpreadsheet = async (
  file: File,
  setImporting: (importing: boolean) => void,
  setPreview: (preview: { contracts: Partial<Contract>[]; analysis: any; validation: any }) => void,
  setError: (error: string) => void,
  setProgress?: (progress: { stage: string; progress: number; message: string }) => void
) => {
  setImporting(true);
  setError('');
  
  console.log('🚀 ENHANCED COLUMN-BY-COLUMN SPREADSHEET PROCESSING:', {
    nome: file.name,
    tipo: file.type,
    tamanho: `${(file.size / 1024).toFixed(2)} KB`
  });
  
  try {
    setProgress?.({ stage: 'loading', progress: 10, message: '📄 Carregando arquivo...' });
    
    // Validações básicas
    if (file.size === 0) {
      throw new Error('Arquivo vazio');
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
    
    // Configuração aprimorada para melhor tratamento de datas
    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      cellDates: false, // Vamos tratar as datas nós mesmos
      cellNF: false,
      cellText: false,
      raw: true, // Manter valores brutos para melhor detecção de datas
      dateNF: 'yyyy-mm-dd',
      cellStyles: false,
      cellHTML: false,
      sheetStubs: false
    });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Planilha não contém abas válidas');
    }
    
    console.log('📊 Planilha carregada:', {
      abas: workbook.SheetNames,
      totalAbas: workbook.SheetNames.length
    });
    
    // Detectar sistema de data 1904 (Mac Excel)
    const date1904 = workbook.Workbook?.WBProps?.date1904 || false;
    if (date1904) {
      console.log('📅 Sistema de data 1904 detectado (Mac Excel)');
    }
    
    setProgress?.({ 
      stage: 'analyzing', 
      progress: 40, 
      message: `🧠 Processando ${workbook.SheetNames.length} aba(s): ${workbook.SheetNames.join(', ')}` 
    });
    
    const allResults: any = {
      contracts: [],
      analysis: [],
      validation: { isValid: false, warnings: [], suggestions: [], missingFields: [] }
    };
    
    const totalSheets = workbook.SheetNames.length;
    
    // Processar cada aba com extração aprimorada
    for (let i = 0; i < workbook.SheetNames.length; i++) {
      const sheetName = workbook.SheetNames[i];
      console.log(`🧠 Processando aba ${i + 1}/${totalSheets}: "${sheetName}"`);
      
      const progressPercent = 40 + Math.round((i / totalSheets) * 45);
      setProgress?.({ 
        stage: 'extracting', 
        progress: progressPercent, 
        message: `🧠 Analisando aba "${sheetName}" coluna por coluna (${i + 1}/${totalSheets})...` 
      });
      
      try {
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet || !worksheet['!ref']) {
          console.log(`⚠️ Aba "${sheetName}" vazia ou inacessível`);
          continue;
        }
        
        // Converter para JSON com valores brutos para melhor tratamento de datas
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: null,
          raw: true, // Crucial para detecção de datas
          dateNF: 'yyyy-mm-dd',
          blankrows: false
        }) as any[][];
        
        console.log(`📄 Aba "${sheetName}" convertida: ${jsonData.length} linhas`);
        
        // Filtrar linhas vazias mas manter cabeçalhos
        const filteredData = jsonData.filter((row, index) => {
          if (index === 0) return true; // Manter cabeçalhos
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
        
        // Aplicar extração aprimorada com informações do sistema de data
        const result = extractContractFromSpreadsheetDataIntelligent(
          filteredData, 
          sheetName, 
          file.name,
          { date1904 }
        );
        
        if (result.contracts.length > 0) {
          console.log(`✅ Extraídos ${result.contracts.length} contrato(s) da aba "${sheetName}"`);
          allResults.contracts.push(...result.contracts);
          allResults.analysis.push(...result.analysis);
          
          // Merge validation results
          allResults.validation.warnings.push(...result.validation.warnings);
          allResults.validation.suggestions.push(...result.validation.suggestions);
          allResults.validation.missingFields.push(...result.validation.missingFields);
          allResults.validation.isValid = allResults.validation.isValid || result.validation.isValid;
        } else {
          console.log(`⚠️ Nenhum contrato identificado na aba "${sheetName}"`);
        }
        
      } catch (sheetError) {
        console.error(`❌ Erro na aba "${sheetName}":`, sheetError);
      }
    }
    
    setProgress?.({ stage: 'finalizing', progress: 90, message: '🎯 Finalizando análise...' });
    
    console.log(`🏁 PROCESSAMENTO APRIMORADO COMPLETO: ${allResults.contracts.length} contratos`);
    
    // Criar amostra se nenhum contrato foi encontrado
    if (allResults.contracts.length === 0) {
      console.log('🔄 Criando amostra...');
      
      const sampleContract: Partial<Contract> = {
        numero: `AMOSTRA-${new Date().getFullYear()}-001`,
        objeto: `Análise da planilha "${file.name}": Nenhum contrato foi identificado automaticamente. ` +
               `Por favor, verifique se os cabeçalhos estão em português/inglês e os dados estão em formato tabular.`,
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
                    `Verifique se os dados estão em formato tabular com cabeçalhos apropriados. ` +
                    `Sistema de data: ${date1904 ? '1904 (Mac)' : '1900 (Windows)'}.`,
        aditivos: [],
        pagamentos: [],
        documentos: []
      };
      
      allResults.contracts.push(sampleContract);
    }
    
    setProgress?.({ 
      stage: 'complete', 
      progress: 100, 
      message: `✅ Análise coluna por coluna completa! ${allResults.contracts.length} contrato(s)` 
    });
    
    console.log('📋 RELATÓRIO DE PROCESSAMENTO APRIMORADO:', {
      arquivo: file.name,
      abas: workbook.SheetNames.length,
      contratos: allResults.contracts.length,
      date1904: date1904,
      validation: allResults.validation
    });
    
    // Atraso para mostrar resultado
    setTimeout(() => {
      setPreview(allResults);
      setImporting(false);
    }, 1000);
    
  } catch (err) {
    console.error('❌ Erro no processamento aprimorado:', err);
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    
    setError(`Falha ao processar "${file.name}": ${errorMessage}. ` +
            `Verifique se o arquivo não está corrompido ou protegido por senha. ` +
            `Formatos suportados: .xlsx, .xls, .csv, .ods.`);
    
    setProgress?.({ stage: 'error', progress: 0, message: `❌ Erro: ${errorMessage}` });
    setImporting(false);
  }
};
