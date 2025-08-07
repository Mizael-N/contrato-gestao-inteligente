
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
  
  console.log('🚀 PROCESSAMENTO INTELIGENTE MELHORADO iniciado:', {
    nome: file.name,
    tipo: file.type,
    tamanho: `${(file.size / 1024).toFixed(2)} KB`
  });
  
  try {
    setProgress?.({ stage: 'loading', progress: 10, message: 'Carregando arquivo da planilha...' });
    
    // Verificações básicas
    if (file.size === 0) {
      throw new Error('Arquivo está vazio ou corrompido');
    }
    
    if (file.size > 15 * 1024 * 1024) { // 15MB
      throw new Error('Arquivo muito grande. Limite máximo: 15MB');
    }
    
    console.log('📚 Carregando biblioteca XLSX...');
    const XLSX = await import('xlsx');
    console.log('✅ Biblioteca XLSX carregada com sucesso');
    
    setProgress?.({ stage: 'reading', progress: 20, message: 'Lendo dados da planilha...' });
    
    const arrayBuffer = await file.arrayBuffer();
    console.log(`📄 Arquivo lido: ${arrayBuffer.byteLength} bytes`);
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Não foi possível ler o conteúdo do arquivo');
    }
    
    setProgress?.({ stage: 'parsing', progress: 30, message: 'Analisando estrutura da planilha...' });
    
    // Parse com configurações otimizadas para reconhecimento de data E formatação
    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      cellDates: true, // IMPORTANTE: Preservar datas como objetos Date
      cellNF: false,
      cellText: false,
      raw: false, // Usar formatação quando disponível
      dateNF: 'yyyy-mm-dd', // Formato padrão para datas
      cellStyles: true, // NOVO: Preservar informações de estilo
      bookVBA: false // Otimização
    });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Planilha não contém abas válidas');
    }
    
    console.log('📊 Planilha carregada - análise inicial:', {
      abas: workbook.SheetNames,
      totalAbas: workbook.SheetNames.length
    });
    
    setProgress?.({ 
      stage: 'analyzing', 
      progress: 40, 
      message: `🧠 IA analisando formatação de ${workbook.SheetNames.length} aba(s): ${workbook.SheetNames.join(', ')}` 
    });
    
    const allContracts: Partial<Contract>[] = [];
    const totalSheets = workbook.SheetNames.length;
    const processingReport: string[] = [];
    const criticalErrors: string[] = [];
    
    // Processar cada aba com IA MELHORADA
    for (let i = 0; i < workbook.SheetNames.length; i++) {
      const sheetName = workbook.SheetNames[i];
      console.log(`🧠 IA MELHORADA processando aba ${i + 1}/${totalSheets}: "${sheetName}"`);
      
      const progressPercent = 40 + Math.round((i / totalSheets) * 45);
      setProgress?.({ 
        stage: 'extracting', 
        progress: progressPercent, 
        message: `🧠 IA extraindo com análise de formatação da aba "${sheetName}" (${i + 1}/${totalSheets})...` 
      });
      
      try {
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
          console.log(`⚠️ Aba "${sheetName}" está inacessível`);
          processingReport.push(`Aba "${sheetName}": Inacessível`);
          continue;
        }
        
        // Verificar se tem dados mínimos
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        if (range.e.r < 1) {
          console.log(`⚠️ Aba "${sheetName}" tem poucos dados`);
          processingReport.push(`Aba "${sheetName}": Dados insuficientes (${range.e.r + 1} linhas)`);
          continue;
        }
        
        // Converter para matriz preservando tipos de dados
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: null, // Manter valores nulos como null
          raw: false, // Usar valores formatados
          dateNF: 'yyyy-mm-dd'
        }) as any[][];
        
        console.log(`📄 Aba "${sheetName}" convertida: ${jsonData.length} linhas, ${jsonData[0]?.length || 0} colunas`);
        console.log(`🎨 Analisando formatação de células para melhor reconhecimento...`);
        
        if (jsonData.length < 2) {
          console.log(`⚠️ Aba "${sheetName}" sem dados após conversão`);
          processingReport.push(`Aba "${sheetName}": Sem dados após conversão`);
          continue;
        }
        
        // Filtrar linhas vazias mantendo estrutura
        const filteredData = jsonData.filter((row, index) => {
          // Manter cabeçalho sempre
          if (index === 0) return true;
          // Para outras linhas, verificar se tem conteúdo
          return row && row.some(cell => 
            cell !== null && 
            cell !== undefined && 
            String(cell).trim() !== ''
          );
        });
        
        if (filteredData.length < 2) {
          console.log(`⚠️ Aba "${sheetName}" sem linhas válidas após filtro`);
          processingReport.push(`Aba "${sheetName}": Nenhuma linha com dados válidos`);
          continue;
        }
        
        console.log(`🧠 Aba "${sheetName}" preparada para IA MELHORADA: ${filteredData.length} linhas válidas`);
        
        // APLICAR IA MELHORADA PARA EXTRAÇÃO INTELIGENTE COM FORMATAÇÃO
        const contractsFromSheet = extractContractFromSpreadsheetDataIntelligent(
          filteredData, 
          sheetName, 
          file.name,
          worksheet // NOVO: Passar worksheet para análise de formatação
        );
        
        if (contractsFromSheet.length > 0) {
          console.log(`✅ IA MELHORADA extraiu ${contractsFromSheet.length} contrato(s) da aba "${sheetName}"`);
          allContracts.push(...contractsFromSheet);
          processingReport.push(`Aba "${sheetName}": ${contractsFromSheet.length} contrato(s) extraído(s) com análise de formatação`);
        } else {
          console.log(`⚠️ IA MELHORADA não conseguiu extrair contratos da aba "${sheetName}"`);
          processingReport.push(`Aba "${sheetName}": IA não identificou contratos nos dados`);
        }
        
      } catch (sheetError) {
        console.error(`❌ Erro crítico na aba "${sheetName}":`, sheetError);
        criticalErrors.push(`Aba "${sheetName}": ${sheetError instanceof Error ? sheetError.message : 'Erro desconhecido'}`);
      }
    }
    
    setProgress?.({ stage: 'finalizing', progress: 90, message: '🧠 Finalizando análise inteligente melhorada...' });
    
    console.log(`🏁 PROCESSAMENTO MELHORADO CONCLUÍDO:`, {
      totalAbas: workbook.SheetNames.length,
      contratosExtraidos: allContracts.length,
      relatorios: processingReport.length,
      errosCriticos: criticalErrors.length
    });
    
    // Se não encontrou nada, criar exemplo contextual
    if (allContracts.length === 0) {
      console.log('🔄 Nenhum contrato extraído. Criando exemplo com contexto da planilha...');
      
      const hoje = new Date();
      
      const sampleContract: Partial<Contract> = {
        numero: `PLANILHA-${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-001`,
        objeto: `⚠️ EXEMPLO: A IA MELHORADA analisou a planilha "${file.name}" incluindo formatação de células (negrito, cores, mesclagem) mas não conseguiu identificar automaticamente os contratos. Favor revisar e ajustar dados conforme a planilha original.`,
        contratante: 'Órgão Público (verificar na planilha)',
        contratada: 'Empresa Contratada (verificar na planilha)',
        valor: 0,
        dataInicio: '',
        dataTermino: '',
        prazoExecucao: 0,
        prazoUnidade: 'dias',
        modalidade: 'pregao',
        status: 'vigente',
        observacoes: `🤖 ANÁLISE AUTOMÁTICA MELHORADA da planilha "${file.name}": ` +
                    `Foram encontradas ${workbook.SheetNames.length} aba(s): ${workbook.SheetNames.join(', ')}. ` +
                    `A IA analisou formatação (negrito, cores, células mescladas) mas não conseguiu identificar automaticamente os contratos. ` +
                    `Possíveis motivos: (1) Formato não reconhecido, (2) Cabeçalhos em idioma não suportado, (3) Dados em formato não padrão, (4) Estrutura muito complexa. ` +
                    `Relatório: ${processingReport.join('; ')}. ` +
                    (criticalErrors.length > 0 ? `Erros: ${criticalErrors.join('; ')}.` : ''),
        aditivos: [],
        pagamentos: [],
        documentos: []
      };
      
      allContracts.push(sampleContract);
    }
    
    setProgress?.({ 
      stage: 'complete', 
      progress: 100, 
      message: `🧠 IA MELHORADA finalizou! ${allContracts.length} contrato(s) identificado(s)!` 
    });
    
    // Relatório final para o usuário
    if (processingReport.length > 0 || criticalErrors.length > 0) {
      console.log('📋 Relatório detalhado da IA melhorada:', {
        processamento: processingReport,
        erros: criticalErrors
      });
    }
    
    // Delay para mostrar resultado
    setTimeout(() => {
      setPreview(allContracts);
      setImporting(false);
    }, 1500);
    
  } catch (err) {
    console.error('❌ Erro crítico no processamento inteligente melhorado:', err);
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido no processamento';
    
    setError(`Falha na análise inteligente melhorada da planilha "${file.name}": ${errorMessage}. ` +
            `A IA MELHORADA (com análise de formatação) não conseguiu processar o arquivo. Verifique se o arquivo não está corrompido, ` +
            `protegido por senha, ou em formato não suportado. ` +
            `Formatos suportados: .xlsx, .xls, .csv, .ods`);
    
    setProgress?.({ stage: 'error', progress: 0, message: `❌ Erro na IA MELHORADA: ${errorMessage}` });
    setImporting(false);
  }
};
