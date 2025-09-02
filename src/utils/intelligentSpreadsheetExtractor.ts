
import { Contract } from '@/types/contract';
import { analyzeColumns, validateColumnMapping, ColumnAnalysis } from './columnAnalyzer';
import { parseEnhancedDate } from './enhancedDateParser';
import { differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';

function parseValue(value: any): number {
  if (typeof value === 'number') return Math.max(0, value);
  if (!value) return 0;
  
  const stringValue = String(value).trim().toLowerCase();
  if (!stringValue) return 0;
  
  let multiplier = 1;
  if (stringValue.includes('mil') || stringValue.endsWith('k')) {
    multiplier = 1000;
  } else if (stringValue.includes('milhão') || stringValue.includes('milhao') || stringValue.includes('mi')) {
    multiplier = 1000000;
  }
  
  let cleanValue = stringValue
    .replace(/[r$\$£€¥]/gi, '')
    .replace(/\b(reais?|real|mil|milhão|milhões)\b/gi, '')
    .replace(/[^\d,.-]/g, '')
    .trim();
  
  if (!cleanValue) return 0;
  
  // Lidar com separadores decimais
  if (cleanValue.includes(',') && cleanValue.includes('.')) {
    if (cleanValue.lastIndexOf(',') > cleanValue.lastIndexOf('.')) {
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    } else {
      cleanValue = cleanValue.replace(/,/g, '');
    }
  } else if (cleanValue.includes(',')) {
    const afterComma = cleanValue.substring(cleanValue.lastIndexOf(',') + 1);
    if (afterComma.length <= 2 && cleanValue.split(',').length === 2) {
      cleanValue = cleanValue.replace(',', '.');
    } else {
      cleanValue = cleanValue.replace(/,/g, '');
    }
  }
  
  const parsed = parseFloat(cleanValue) * multiplier;
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

function parseStatus(status: any): 'vigente' | 'suspenso' | 'encerrado' | 'rescindido' {
  if (!status) return 'vigente';
  
  const normalized = String(status).toLowerCase().trim();
  
  if (normalized.includes('suspenso') || normalized.includes('pausado')) return 'suspenso';
  if (normalized.includes('encerrado') || normalized.includes('finalizado') || normalized.includes('concluido')) return 'encerrado';
  if (normalized.includes('rescindido') || normalized.includes('cancelado') || normalized.includes('anulado')) return 'rescindido';
  
  return 'vigente';
}

function parseModalidade(modalidade: any): 'pregao' | 'concorrencia' | 'tomada_precos' | 'convite' | 'concurso' | 'leilao' {
  if (!modalidade) return 'pregao';
  
  const normalized = String(modalidade).toLowerCase().trim();
  
  if (normalized.includes('pregao') || normalized.includes('pregão')) return 'pregao';
  if (normalized.includes('concorrencia') || normalized.includes('concorrência')) return 'concorrencia';
  if (normalized.includes('tomada') && normalized.includes('precos')) return 'tomada_precos';
  if (normalized.includes('convite')) return 'convite';
  if (normalized.includes('concurso')) return 'concurso';
  if (normalized.includes('leilao') || normalized.includes('leilão')) return 'leilao';
  
  return 'pregao';
}

function calculatePeriod(startDate: Date, endDate: Date): { 
  prazo: number; 
  unidade: 'dias' | 'meses' | 'anos';
} {
  const totalDays = differenceInDays(endDate, startDate);
  
  if (totalDays <= 90) {
    return { prazo: Math.max(1, totalDays), unidade: 'dias' };
  } else if (totalDays <= 730) {
    const months = differenceInMonths(endDate, startDate);
    return { prazo: Math.max(1, months), unidade: 'meses' };
  } else {
    const years = differenceInYears(endDate, startDate);
    return { prazo: Math.max(1, years), unidade: 'anos' };
  }
}

function toYMD(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

function extractFieldValue(row: any[], columnAnalysis: ColumnAnalysis | null): any {
  if (!columnAnalysis) return null;
  
  const value = row[columnAnalysis.index];
  
  if (value === null || value === undefined) return null;
  
  const stringValue = String(value).trim();
  if (stringValue === '') return null;
  
  return value;
}

function getAssumeFormat(detectedFormat?: string): 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'auto' {
  if (!detectedFormat) return 'auto';
  
  switch (detectedFormat) {
    case 'DD/MM/YYYY':
    case 'DD/MM/YY':
      return 'DD/MM/YYYY';
    case 'MM/DD/YYYY':
    case 'MM/DD/YY':
      return 'MM/DD/YYYY';
    default:
      return 'auto';
  }
}

// Gerar chave única RIGOROSA para prevenir duplicatas
function generateContractKey(contract: Partial<Contract>): string {
  const numero = (contract.numero || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const objeto = (contract.objeto || '').substring(0, 50).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const contratada = (contract.contratada || '').substring(0, 30).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const valor = contract.valor || 0;
  const dataInicio = (contract.dataInicio || '').replace(/-/g, '');
  
  // Incluir mais campos para maior unicidade
  const key = `${numero}|${objeto}|${contratada}|${valor}|${dataInicio}`;
  
  console.log(`🔑 Chave gerada: ${key.substring(0, 60)}...`);
  return key;
}

// Validar se linha tem dados suficientes para ser um contrato
function isValidContractRow(row: any[], fieldMappings: Record<string, ColumnAnalysis | null>): boolean {
  // Verificar se tem pelo menos número OU objeto OU contratada
  const hasNumero = fieldMappings.numero && extractFieldValue(row, fieldMappings.numero);
  const hasObjeto = fieldMappings.objeto && extractFieldValue(row, fieldMappings.objeto);
  const hasContratada = fieldMappings.contratada && extractFieldValue(row, fieldMappings.contratada);
  
  const hasMinimumData = hasNumero || hasObjeto || hasContratada;
  
  // Verificar se não é linha totalmente vazia
  const hasAnyData = row.some(cell => cell && String(cell).trim() !== '');
  
  return hasMinimumData && hasAnyData;
}

export function extractContractFromSpreadsheetDataIntelligent(
  data: any[][], 
  sheetName: string, 
  fileName: string = '',
  options: { date1904?: boolean } = {}
): {
  contracts: Partial<Contract>[];
  analysis: ColumnAnalysis[];
  validation: ReturnType<typeof validateColumnMapping>;
} {
  console.log(`🚀 EXTRAÇÃO RIGOROSA: Planilha "${sheetName}" com ${data.length} linhas`);
  
  if (data.length < 2) {
    console.log(`⚠️ Dados insuficientes: ${data.length} linhas`);
    return {
      contracts: [],
      analysis: [],
      validation: { isValid: false, warnings: ['Dados insuficientes'], suggestions: [], missingFields: [] }
    };
  }
  
  // Passo 1: Análise de colunas
  const headers = data[0].map(h => String(h || '').trim()).filter(h => h);
  console.log(`📋 Cabeçalhos encontrados: ${headers.length}`, headers);
  
  const columnAnalyses = analyzeColumns(headers, data);
  const validation = validateColumnMapping(columnAnalyses);
  
  console.log(`🔍 Análise completa:`, {
    colunas: columnAnalyses.length,
    mapeadas: columnAnalyses.filter(a => a.field).length,
    datas: columnAnalyses.filter(a => a.dataType === 'date').length
  });
  
  // Passo 2: Mapeamentos de campos (SÓ aceitar alta confiança)
  const fieldMappings: Record<string, ColumnAnalysis | null> = {};
  
  for (const analysis of columnAnalyses) {
    if (analysis.field && analysis.confidence > 0.7) { // Aumentei de 0.5 para 0.7
      if (!fieldMappings[analysis.field] || fieldMappings[analysis.field]!.confidence < analysis.confidence) {
        fieldMappings[analysis.field] = analysis;
      }
    }
  }
  
  console.log(`🗺️ Mapeamentos de campo criados:`, Object.keys(fieldMappings));
  
  // Passo 3: Processar linhas (prevenir duplicatas de forma rigorosa)
  const contracts: Partial<Contract>[] = [];
  const processedKeys = new Set<string>();
  let contractsProcessed = 0;
  let dateParseAttempts = 0;
  let successfulDates = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Pular linhas vazias ou inválidas
    if (!row || !isValidContractRow(row, fieldMappings)) {
      console.log(`⏭️ Pulando linha ${i}: dados insuficientes`);
      continue;
    }
    
    console.log(`📝 Processando linha ${i}...`);
    contractsProcessed++;
    
    try {
      // Extrair dados básicos
      const numero = extractFieldValue(row, fieldMappings.numero) || `${sheetName}-${i}`;
      const objeto = extractFieldValue(row, fieldMappings.objeto) || 'Objeto não especificado';
      const contratante = extractFieldValue(row, fieldMappings.contratante) || 'Órgão Público';
      const contratada = extractFieldValue(row, fieldMappings.contratada) || 'Empresa não especificada';
      const modalidade = parseModalidade(extractFieldValue(row, fieldMappings.modalidade));
      const status = parseStatus(extractFieldValue(row, fieldMappings.status));
      const valor = parseValue(extractFieldValue(row, fieldMappings.valor));
      
      // Parsing RIGOROSO de datas - SÓ tentar se coluna foi identificada com ALTA confiança
      let dataInicio: Date | null = null;
      let dataTermino: Date | null = null;
      
      // Data de início - SÓ tentar se mapeamento tem alta confiança
      if (fieldMappings.dataInicio && fieldMappings.dataInicio.confidence > 0.8) {
        dateParseAttempts++;
        const startValue = row[fieldMappings.dataInicio.index];
        
        // NÃO tentar parsear se valor estiver vazio ou for obviamente inválido
        if (startValue !== null && startValue !== undefined && String(startValue).trim() !== '') {
          const parseOptions = {
            assume: getAssumeFormat(fieldMappings.dataInicio.dateStrategy?.format),
            isEndColumn: false,
            date1904: options.date1904 || false,
            columnStrategy: fieldMappings.dataInicio.dateStrategy
          };
          
          dataInicio = parseEnhancedDate(startValue, parseOptions);
          if (dataInicio) {
            successfulDates++;
            console.log(`✅ Data início extraída: ${toYMD(dataInicio)} (valor original: "${startValue}")`);
          } else {
            console.log(`❌ Falha RIGOROSA ao analisar data início: "${startValue}" (não será preenchida)`);
          }
        } else {
          console.log(`⚠️ Valor vazio/inválido para data início: "${startValue}"`);
        }
      } else if (fieldMappings.dataInicio) {
        console.log(`⚠️ Coluna data início tem confiança baixa (${fieldMappings.dataInicio.confidence}) - ignorando`);
      }
      
      // Data de término - SÓ tentar se mapeamento tem alta confiança
      if (fieldMappings.dataTermino && fieldMappings.dataTermino.confidence > 0.8) {
        dateParseAttempts++;
        const endValue = row[fieldMappings.dataTermino.index];
        
        // NÃO tentar parsear se valor estiver vazio ou for obviamente inválido
        if (endValue !== null && endValue !== undefined && String(endValue).trim() !== '') {
          const parseOptions = {
            assume: getAssumeFormat(fieldMappings.dataTermino.dateStrategy?.format),
            isEndColumn: true,
            date1904: options.date1904 || false,
            columnStrategy: fieldMappings.dataTermino.dateStrategy
          };
          
          dataTermino = parseEnhancedDate(endValue, parseOptions);
          if (dataTermino) {
            successfulDates++;
            console.log(`✅ Data término extraída: ${toYMD(dataTermino)} (valor original: "${endValue}")`);
          } else {
            console.log(`❌ Falha RIGOROSA ao analisar data término: "${endValue}" (não será preenchida)`);
          }
        } else {
          console.log(`⚠️ Valor vazio/inválido para data término: "${endValue}"`);
        }
      } else if (fieldMappings.dataTermino) {
        console.log(`⚠️ Coluna data término tem confiança baixa (${fieldMappings.dataTermino.confidence}) - ignorando`);
      }
      
      // Calcular prazo SÓ se ambas as datas existem
      let prazoExecucao = 0;
      let prazoUnidade: 'dias' | 'meses' | 'anos' = 'dias';
      
      if (dataInicio && dataTermino) {
        const period = calculatePeriod(dataInicio, dataTermino);
        prazoExecucao = period.prazo;
        prazoUnidade = period.unidade;
      }
      // NÃO definir prazo padrão - deixar 0 se não conseguir calcular
      
      // Criar contrato
      const contract: Partial<Contract> = {
        numero: String(numero).trim(),
        objeto: String(objeto).trim(),
        contratante: String(contratante).trim(),
        contratada: String(contratada).trim(),
        valor,
        dataInicio: dataInicio ? toYMD(dataInicio) : '', // Vazio se não conseguir extrair
        dataTermino: dataTermino ? toYMD(dataTermino) : '', // Vazio se não conseguir extrair
        prazoExecucao,
        prazoUnidade,
        modalidade,
        status,
        observacoes: `Importado da planilha "${sheetName}" linha ${i}. ` +
                    `${!dataInicio ? 'ATENÇÃO: Data de início não foi reconhecida - complete manualmente. ' : ''}` +
                    `${!dataTermino ? 'ATENÇÃO: Data de término não foi reconhecida - complete manualmente. ' : ''}` +
                    `${valor === 0 ? 'ATENÇÃO: Valor não foi reconhecido - complete manualmente. ' : ''}` +
                    `Sistema de parsing rigoroso aplicado para evitar dados incorretos.`,
        aditivos: [],
        pagamentos: [],
        documentos: []
      };
      
      // Verificação rigorosa de duplicatas
      const contractKey = generateContractKey(contract);
      if (processedKeys.has(contractKey)) {
        console.log(`⚠️ Contrato duplicado ignorado: ${contract.numero} (chave: ${contractKey})`);
        continue;
      }
      
      processedKeys.add(contractKey);
      contracts.push(contract);
      
      console.log(`✅ Contrato criado: ${contract.numero}`);
      
    } catch (error) {
      console.error(`❌ Erro processando linha ${i}:`, error);
    }
  }
  
  const dateSuccessRate = dateParseAttempts > 0 ? (successfulDates / dateParseAttempts) * 100 : 0;
  
  console.log(`📊 RESULTADOS DA EXTRAÇÃO RIGOROSA:`);
  console.log(`   Linhas processadas: ${contractsProcessed}`);
  console.log(`   Contratos únicos: ${contracts.length}`);
  console.log(`   Tentativas de parsing de data: ${dateParseAttempts}`);
  console.log(`   Datas extraídas com sucesso: ${successfulDates}`);
  console.log(`   Taxa de sucesso de datas: ${dateSuccessRate.toFixed(1)}%`);
  
  return {
    contracts,
    analysis: columnAnalyses,
    validation
  };
}
