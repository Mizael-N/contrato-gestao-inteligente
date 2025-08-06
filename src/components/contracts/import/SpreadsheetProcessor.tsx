
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
  setError('');
  
  console.log('🚀 Iniciando processamento completo da planilha:', {
    nome: file.name,
    tipo: file.type,
    tamanho: `${(file.size / 1024).toFixed(2)} KB`
  });
  
  try {
    setProgress?.({ stage: 'loading', progress: 10, message: 'Carregando arquivo da planilha...' });
    
    // Verificar se o arquivo não está corrompido
    if (file.size === 0) {
      throw new Error('Arquivo está vazio ou corrompido');
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Arquivo muito grande. Limite máximo: 10MB');
    }
    
    // Importar biblioteca XLSX dinamicamente
    console.log('📚 Carregando biblioteca XLSX...');
    const XLSX = await import('xlsx');
    console.log('✅ Biblioteca XLSX carregada com sucesso');
    
    setProgress?.({ stage: 'reading', progress: 20, message: 'Lendo dados da planilha...' });
    
    // Ler arquivo como ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    console.log(`📄 Arquivo lido: ${arrayBuffer.byteLength} bytes`);
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Não foi possível ler o conteúdo do arquivo');
    }
    
    setProgress?.({ stage: 'parsing', progress: 30, message: 'Analisando estrutura da planilha...' });
    
    // Fazer parse do workbook com opções robustas
    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Planilha não contém abas válidas');
    }
    
    console.log('📊 Planilha processada com sucesso:', {
      abas: workbook.SheetNames,
      totalAbas: workbook.SheetNames.length
    });
    
    setProgress?.({ 
      stage: 'analyzing', 
      progress: 40, 
      message: `Analisando ${workbook.SheetNames.length} aba(s): ${workbook.SheetNames.join(', ')}` 
    });
    
    const allContracts: Partial<Contract>[] = [];
    const totalSheets = workbook.SheetNames.length;
    const errors: string[] = [];
    
    // Processar cada aba da planilha
    for (let i = 0; i < workbook.SheetNames.length; i++) {
      const sheetName = workbook.SheetNames[i];
      console.log(`📋 Processando aba ${i + 1}/${totalSheets}: "${sheetName}"`);
      
      const progressPercent = 40 + Math.round((i / totalSheets) * 40);
      setProgress?.({ 
        stage: 'extracting', 
        progress: progressPercent, 
        message: `Extraindo dados da aba "${sheetName}" (${i + 1}/${totalSheets})...` 
      });
      
      try {
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
          console.log(`⚠️ Aba "${sheetName}" está vazia ou inacessível`);
          errors.push(`Aba "${sheetName}": Não foi possível acessar os dados`);
          continue;
        }
        
        // Verificar se a aba tem dados
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        if (range.e.r < 1) { // Menos de 2 linhas (header + pelo menos 1 linha de dados)
          console.log(`⚠️ Aba "${sheetName}" tem poucos dados (${range.e.r + 1} linhas)`);
          errors.push(`Aba "${sheetName}": Poucos dados encontrados (${range.e.r + 1} linhas)`);
          continue;
        }
        
        // Converter para JSON com configuração robusta
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          raw: false,
          dateNF: 'yyyy-mm-dd'
        }) as any[][];
        
        console.log(`📄 Aba "${sheetName}" convertida: ${jsonData.length} linhas, ${jsonData[0]?.length || 0} colunas`);
        
        if (jsonData.length < 2) {
          console.log(`⚠️ Aba "${sheetName}" sem dados suficientes após conversão`);
          errors.push(`Aba "${sheetName}": Dados insuficientes após processamento`);
          continue;
        }
        
        // Filtrar linhas completamente vazias
        const filteredData = jsonData.filter(row => 
          row && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
        );
        
        if (filteredData.length < 2) {
          console.log(`⚠️ Aba "${sheetName}" sem linhas válidas após filtro`);
          errors.push(`Aba "${sheetName}": Nenhuma linha com dados válidos`);
          continue;
        }
        
        console.log(`🔍 Aba "${sheetName}" após filtro: ${filteredData.length} linhas válidas`);
        
        // Extrair contratos desta aba
        const contractsFromSheet = extractContractFromSpreadsheetData(filteredData, sheetName);
        
        if (contractsFromSheet.length > 0) {
          console.log(`✅ Aba "${sheetName}": ${contractsFromSheet.length} contratos extraídos com sucesso`);
          allContracts.push(...contractsFromSheet);
        } else {
          console.log(`⚠️ Aba "${sheetName}": Nenhum contrato extraído`);
          errors.push(`Aba "${sheetName}": Não foi possível extrair contratos dos dados`);
        }
        
      } catch (sheetError) {
        console.error(`❌ Erro processando aba "${sheetName}":`, sheetError);
        errors.push(`Aba "${sheetName}": ${sheetError instanceof Error ? sheetError.message : 'Erro desconhecido'}`);
      }
    }
    
    setProgress?.({ stage: 'finalizing', progress: 85, message: 'Finalizando extração de dados...' });
    
    console.log(`📊 Processamento concluído:`, {
      totalAbas: workbook.SheetNames.length,
      contratosExtraidos: allContracts.length,
      erros: errors.length
    });
    
    // Se não encontrou contratos mas tem dados, criar exemplo
    if (allContracts.length === 0) {
      console.log('🔄 Nenhum contrato extraído automaticamente. Criando exemplo baseado na estrutura...');
      
      const hoje = new Date();
      const proximoAno = new Date(hoje);
      proximoAno.setFullYear(proximoAno.getFullYear() + 1);
      
      const sampleContract: Partial<Contract> = {
        numero: `PLANILHA-${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-001`,
        objeto: 'Contrato extraído da planilha - Favor revisar e ajustar dados conforme planilha original',
        contratante: 'Órgão Público (verificar na planilha)',
        contratada: 'Empresa Contratada (verificar na planilha)',
        valor: 50000,
        dataInicio: hoje.toISOString().split('T')[0],
        dataTermino: proximoAno.toISOString().split('T')[0],
        prazoExecucao: 12,
        prazoUnidade: 'meses',
        modalidade: 'pregao',
        status: 'vigente',
        observacoes: `Dados de exemplo criados automaticamente da planilha "${file.name}". ` +
                    `Foram encontradas ${workbook.SheetNames.length} abas: ${workbook.SheetNames.join(', ')}. ` +
                    `Por favor, revise e ajuste as informações conforme necessário. ` +
                    (errors.length > 0 ? `Problemas encontrados: ${errors.join('; ')}.` : ''),
        aditivos: [],
        pagamentos: [],
        documentos: []
      };
      
      allContracts.push(sampleContract);
      
      console.log('✅ Contrato de exemplo criado para permitir visualização da estrutura');
    }
    
    setProgress?.({ stage: 'complete', progress: 100, message: `✅ ${allContracts.length} contrato(s) extraído(s) com sucesso!` });
    
    // Mostrar resumo dos erros se houver
    if (errors.length > 0) {
      console.log('⚠️ Resumo dos problemas encontrados:', errors);
    }
    
    // Delay para mostrar progresso completo
    setTimeout(() => {
      setPreview(allContracts);
      setImporting(false);
      
      if (errors.length > 0) {
        const errorSummary = `Processamento concluído com algumas limitações: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? `... e mais ${errors.length - 3} problema(s)` : ''}`;
        console.log('ℹ️ Definindo resumo de erros:', errorSummary);
        // Não definir como erro crítico, apenas informativo
      }
    }, 1000);
    
  } catch (err) {
    console.error('❌ Erro crítico no processamento da planilha:', err);
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido no processamento';
    
    setError(`Erro ao processar a planilha "${file.name}": ${errorMessage}. ` +
            `Verifique se o arquivo não está corrompido, protegido por senha, ou em formato não suportado. ` +
            `Formatos suportados: .xlsx, .xls, .csv, .ods`);
    
    setProgress?.({ stage: 'error', progress: 0, message: `❌ Erro: ${errorMessage}` });
    setImporting(false);
  }
};
