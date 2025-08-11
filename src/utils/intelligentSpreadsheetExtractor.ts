
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
  
  // Handle decimal separators
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

// Generate unique key for contract to prevent duplicates
function generateContractKey(contract: Partial<Contract>): string {
  const numero = (contract.numero || '').trim().toLowerCase();
  const objeto = (contract.objeto || '').substring(0, 50).trim().toLowerCase();
  const contratada = (contract.contratada || '').trim().toLowerCase();
  
  return `${numero}_${objeto}_${contratada}`.replace(/[^a-z0-9_]/g, '');
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
  console.log(`🚀 ENHANCED EXTRACTION: Sheet "${sheetName}" with ${data.length} rows`);
  
  if (data.length < 2) {
    console.log(`⚠️ Insufficient data: ${data.length} rows`);
    return {
      contracts: [],
      analysis: [],
      validation: { isValid: false, warnings: ['Dados insuficientes'], suggestions: [], missingFields: [] }
    };
  }
  
  // Step 1: Column analysis
  const headers = data[0].map(h => String(h || '').trim()).filter(h => h);
  console.log(`📋 Headers found: ${headers.length}`, headers);
  
  const columnAnalyses = analyzeColumns(headers, data);
  const validation = validateColumnMapping(columnAnalyses);
  
  console.log(`🔍 Analysis complete:`, {
    columns: columnAnalyses.length,
    mapped: columnAnalyses.filter(a => a.field).length,
    dates: columnAnalyses.filter(a => a.dataType === 'date').length
  });
  
  // Step 2: Field mappings
  const fieldMappings: Record<string, ColumnAnalysis | null> = {};
  
  for (const analysis of columnAnalyses) {
    if (analysis.field && analysis.confidence > 0.5) {
      if (!fieldMappings[analysis.field] || fieldMappings[analysis.field]!.confidence < analysis.confidence) {
        fieldMappings[analysis.field] = analysis;
      }
    }
  }
  
  console.log(`🗺️ Field mappings created:`, Object.keys(fieldMappings));
  
  // Step 3: Process rows (prevent duplicates)
  const contracts: Partial<Contract>[] = [];
  const processedKeys = new Set<string>();
  let successfulContracts = 0;
  let dateExtractions = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Skip empty rows
    if (!row || !row.some(cell => cell && String(cell).trim() !== '')) {
      console.log(`⏭️ Skipping empty row ${i}`);
      continue;
    }
    
    console.log(`📝 Processing row ${i}...`);
    
    try {
      // Extract basic data
      const numero = extractFieldValue(row, fieldMappings.numero) || `${sheetName}-${i}`;
      const objeto = extractFieldValue(row, fieldMappings.objeto) || 'Objeto não especificado';
      const contratante = extractFieldValue(row, fieldMappings.contratante) || 'Órgão Público';
      const contratada = extractFieldValue(row, fieldMappings.contratada) || 'Empresa não especificada';
      const modalidade = parseModalidade(extractFieldValue(row, fieldMappings.modalidade));
      const status = parseStatus(extractFieldValue(row, fieldMappings.status));
      const valor = parseValue(extractFieldValue(row, fieldMappings.valor));
      
      // Enhanced date parsing
      let dataInicio: Date | null = null;
      let dataTermino: Date | null = null;
      
      if (fieldMappings.dataInicio) {
        const startValue = row[fieldMappings.dataInicio.index];
        const parseOptions = {
          assume: getAssumeFormat(fieldMappings.dataInicio.dateStrategy?.format),
          isEndColumn: false,
          date1904: options.date1904 || false,
          columnStrategy: fieldMappings.dataInicio.dateStrategy
        };
        
        dataInicio = parseEnhancedDate(startValue, parseOptions);
        if (dataInicio) {
          dateExtractions++;
          console.log(`✅ Start date extracted: ${toYMD(dataInicio)}`);
        } else {
          console.log(`⚠️ Failed to parse start date: "${startValue}"`);
        }
      }
      
      if (fieldMappings.dataTermino) {
        const endValue = row[fieldMappings.dataTermino.index];
        const parseOptions = {
          assume: getAssumeFormat(fieldMappings.dataTermino.dateStrategy?.format),
          isEndColumn: true,
          date1904: options.date1904 || false,
          columnStrategy: fieldMappings.dataTermino.dateStrategy
        };
        
        dataTermino = parseEnhancedDate(endValue, parseOptions);
        if (dataTermino) {
          dateExtractions++;
          console.log(`✅ End date extracted: ${toYMD(dataTermino)}`);
        } else {
          console.log(`⚠️ Failed to parse end date: "${endValue}"`);
        }
      }
      
      // Calculate period
      let prazoExecucao = 0;
      let prazoUnidade: 'dias' | 'meses' | 'anos' = 'dias';
      
      if (dataInicio && dataTermino) {
        const period = calculatePeriod(dataInicio, dataTermino);
        prazoExecucao = period.prazo;
        prazoUnidade = period.unidade;
      } else {
        prazoExecucao = 365; // Default 1 year
      }
      
      // Create contract
      const contract: Partial<Contract> = {
        numero: String(numero).trim(),
        objeto: String(objeto).trim(),
        contratante: String(contratante).trim(),
        contratada: String(contratada).trim(),
        valor,
        dataInicio: dataInicio ? toYMD(dataInicio) : '',
        dataTermino: dataTermino ? toYMD(dataTermino) : '',
        prazoExecucao,
        prazoUnidade,
        modalidade,
        status,
        observacoes: `Extraído da planilha "${sheetName}" linha ${i}. ` +
                    `${!dataInicio ? 'Data início ausente. ' : ''}` +
                    `${!dataTermino ? 'Data término ausente. ' : ''}` +
                    `${valor === 0 ? 'Valor ausente. ' : ''}` +
                    `Complete os dados faltantes após a importação.`,
        aditivos: [],
        pagamentos: [],
        documentos: []
      };
      
      // Check for duplicates
      const contractKey = generateContractKey(contract);
      if (processedKeys.has(contractKey)) {
        console.log(`⚠️ Duplicate contract skipped: ${contract.numero}`);
        continue;
      }
      
      processedKeys.add(contractKey);
      contracts.push(contract);
      successfulContracts++;
      
      console.log(`✅ Contract created: ${contract.numero}`);
      
    } catch (error) {
      console.error(`❌ Error processing row ${i}:`, error);
    }
  }
  
  console.log(`📊 EXTRACTION RESULTS:`);
  console.log(`   Contracts: ${successfulContracts}`);
  console.log(`   Date extractions: ${dateExtractions}`);
  console.log(`   Success rate: ${successfulContracts > 0 ? ((dateExtractions / (successfulContracts * 2)) * 100).toFixed(1) : 0}%`);
  
  return {
    contracts,
    analysis: columnAnalyses,
    validation
  };
}
