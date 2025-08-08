import { Contract } from '@/types/contract';
import { 
  parseAdvancedDate, 
  findDateColumns, 
  calculateContractPeriod,
  validateDateConsistency
} from './dateRecognition';
import { detectDateFormat, toYMD } from './dateFormatDetector';
import { format } from 'date-fns';

// Mapeamentos simplificados mas eficientes
const FIELD_MAPPINGS = {
  numero: [
    'numero', 'número', 'contrato', 'processo', 'num', 'nº', 'codigo', 'código',
    'id', 'identificador', 'ref', 'referencia', 'referência',
    'contrato numero', 'numero contrato', 'processo numero', 'numero processo',
    'number', 'contract number', 'process number'
  ],
  
  objeto: [
    'objeto', 'descrição', 'descricao', 'servico', 'serviço', 'item',
    'especificação', 'especificacao', 'finalidade', 'escopo',
    'objeto contrato', 'descrição objeto', 'serviço contratado',
    'description', 'service', 'scope', 'specification'
  ],
  
  contratante: [
    'contratante', 'orgao', 'órgão', 'cliente', 'prefeitura', 'governo',
    'secretaria', 'ministério', 'ministerio', 'poder público', 'poder publico',
    'client', 'government', 'agency'
  ],
  
  contratada: [
    'contratada', 'empresa', 'fornecedor', 'prestador', 'licitante',
    'razao social', 'razão social', 'cnpj', 'firma',
    'contractor', 'supplier', 'company', 'vendor'
  ],
  
  valor: [
    'valor', 'preco', 'preço', 'custo', 'montante', 'total',
    'valor total', 'valor contrato', 'preço total',
    'price', 'cost', 'amount', 'value', 'total'
  ],
  
  modalidade: [
    'modalidade', 'tipo', 'licitacao', 'licitação', 'pregão', 'pregao',
    'concorrência', 'concorrencia', 'tomada preços', 'convite',
    'modality', 'type', 'bidding'
  ],
  
  status: [
    'status', 'situacao', 'situação', 'estado', 'vigente', 'ativo',
    'encerrado', 'suspenso', 'rescindido',
    'status', 'state', 'active'
  ]
};

function normalizeValue(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ');
}

// FUNÇÃO SIMPLIFICADA - Encontrar coluna sem dependência de formatação
function findColumnIndex(headers: string[], fieldMappings: string[]): number {
  console.log(`🔍 Buscando campo: ${fieldMappings[0]}`);
  
  for (let i = 0; i < headers.length; i++) {
    const header = normalizeValue(headers[i]);
    
    for (const mapping of fieldMappings) {
      const normalizedMapping = normalizeValue(mapping);
      
      if (header === normalizedMapping || 
          header.includes(normalizedMapping) || 
          normalizedMapping.includes(header)) {
        console.log(`✅ Campo encontrado: "${headers[i]}" na coluna ${i}`);
        return i;
      }
    }
  }
  
  console.log(`❌ Campo não encontrado: ${fieldMappings[0]}`);
  return -1;
}

// FUNÇÃO MELHORADA - Parsing de valores monetários
function parseValue(value: any): number {
  if (typeof value === 'number') return Math.max(0, value);
  if (!value) return 0;
  
  const stringValue = String(value).trim().toLowerCase();
  console.log(`💰 Analisando valor: "${stringValue}"`);
  
  if (!stringValue) return 0;
  
  let multiplier = 1;
  if (stringValue.includes('mil') || stringValue.endsWith('k')) {
    multiplier = 1000;
  } else if (stringValue.includes('milhão') || stringValue.includes('milhao') || stringValue.includes('mi')) {
    multiplier = 1000000;
  }
  
  // Limpeza do valor
  let cleanValue = stringValue
    .replace(/[r$\$£€¥]/gi, '')
    .replace(/\b(reais?|real|mil|milhão|milhões)\b/gi, '')
    .replace(/[^\d,.-]/g, '')
    .trim();
  
  if (!cleanValue) return 0;
  
  // Determinar formato
  if (cleanValue.includes(',') && cleanValue.includes('.')) {
    if (cleanValue.lastIndexOf(',') > cleanValue.lastIndexOf('.')) {
      // Formato brasileiro: 1.234.567,89
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato internacional: 1,234,567.89
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
  const result = isNaN(parsed) ? 0 : Math.max(0, parsed);
  
  console.log(`✅ Valor convertido: "${stringValue}" -> ${result}`);
  return result;
}

function parseStatus(status: any): 'vigente' | 'suspenso' | 'encerrado' | 'rescindido' {
  if (!status) return 'vigente';
  
  const normalized = normalizeValue(status);
  
  if (normalized.includes('suspenso') || normalized.includes('pausado')) return 'suspenso';
  if (normalized.includes('encerrado') || normalized.includes('finalizado') || normalized.includes('concluido')) return 'encerrado';
  if (normalized.includes('rescindido') || normalized.includes('cancelado') || normalized.includes('anulado')) return 'rescindido';
  
  return 'vigente';
}

function parseModalidade(modalidade: any): 'pregao' | 'concorrencia' | 'tomada_precos' | 'convite' | 'concurso' | 'leilao' {
  if (!modalidade) return 'pregao';
  
  const normalized = normalizeValue(modalidade);
  
  if (normalized.includes('pregao') || normalized.includes('pregão')) return 'pregao';
  if (normalized.includes('concorrencia') || normalized.includes('concorrência')) return 'concorrencia';
  if (normalized.includes('tomada') && normalized.includes('precos')) return 'tomada_precos';
  if (normalized.includes('convite')) return 'convite';
  if (normalized.includes('concurso')) return 'concurso';
  if (normalized.includes('leilao') || normalized.includes('leilão')) return 'leilao';
  
  return 'pregao';
}

export function extractContractFromSpreadsheetDataIntelligent(
  data: any[][], 
  sheetName: string, 
  fileName: string = '',
  options: { date1904?: boolean } = {}
): Partial<Contract>[] {
  console.log(`🚀 ENHANCED EXTRACTION: Sheet "${sheetName}" with ${data.length} rows`);
  
  if (data.length < 2) {
    console.log(`⚠️ Insufficient data: ${data.length} rows`);
    return [];
  }
  
  // Header analysis
  const headers = data[0].map(h => String(h || '').trim()).filter(h => h);
  console.log(`📋 Headers (${headers.length}):`, headers);
  
  if (headers.length === 0) {
    console.log(`❌ No valid headers`);
    return [];
  }
  
  // Enhanced date column detection with data analysis
  const { startDateColumns, endDateColumns } = findDateColumns(headers, data);
  
  const bestStartColumn = startDateColumns.length > 0 ? startDateColumns[0] : null;
  const bestEndColumn = endDateColumns.length > 0 ? endDateColumns[0] : null;
  
  console.log(`📅 Date columns detected:`);
  console.log(`   Start: ${bestStartColumn ? `"${headers[bestStartColumn.index]}" (confidence: ${bestStartColumn.confidence.toFixed(2)}, format: ${bestStartColumn.strategy.format})` : 'NOT FOUND'}`);
  console.log(`   End: ${bestEndColumn ? `"${headers[bestEndColumn.index]}" (confidence: ${bestEndColumn.confidence.toFixed(2)}, format: ${bestEndColumn.strategy.format})` : 'NOT FOUND'}`);
  
  // Field mapping
  const columnIndexes = {
    numero: findColumnIndex(headers, FIELD_MAPPINGS.numero),
    objeto: findColumnIndex(headers, FIELD_MAPPINGS.objeto),
    contratante: findColumnIndex(headers, FIELD_MAPPINGS.contratante),
    contratada: findColumnIndex(headers, FIELD_MAPPINGS.contratada),
    valor: findColumnIndex(headers, FIELD_MAPPINGS.valor),
    modalidade: findColumnIndex(headers, FIELD_MAPPINGS.modalidade),
    status: findColumnIndex(headers, FIELD_MAPPINGS.status)
  };
  
  console.log(`📊 Field mapping:`, Object.entries(columnIndexes)
    .map(([field, index]) => `${field}: ${index >= 0 ? `column ${index}` : 'not found'}`)
    .join(', '));
  
  const contracts: Partial<Contract>[] = [];
  let successfulContracts = 0;
  let dateSuccesses = 0;
  
  // Process rows with enhanced date parsing
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    if (!row || !row.some(cell => cell && String(cell).trim() !== '')) continue;
    
    console.log(`📝 Processing row ${i}...`);
    
    try {
      // Extract basic data
      const numero = columnIndexes.numero >= 0 ? String(row[columnIndexes.numero] || '').trim() : `${sheetName}-${i}`;
      const objeto = columnIndexes.objeto >= 0 ? String(row[columnIndexes.objeto] || '').trim() : '';
      const contratante = columnIndexes.contratante >= 0 ? String(row[columnIndexes.contratante] || '').trim() || 'Órgão Público' : 'Órgão Público';
      const contratada = columnIndexes.contratada >= 0 ? String(row[columnIndexes.contratada] || '').trim() : '';
      const modalidade = columnIndexes.modalidade >= 0 ? parseModalidade(row[columnIndexes.modalidade]) : 'pregao';
      const status = columnIndexes.status >= 0 ? parseStatus(row[columnIndexes.status]) : 'vigente';
      const valor = columnIndexes.valor >= 0 ? parseValue(row[columnIndexes.valor]) : 0;
      
      // Enhanced date parsing with column-specific strategies
      let dataInicio: Date | null = null;
      let dataTermino: Date | null = null;
      
      if (bestStartColumn) {
        const startStrategy = bestStartColumn.strategy;
        const parseOptions = {
          assume: getAssumeFormat(startStrategy.format),
          isEndColumn: false,
          date1904: options.date1904 || false
        };
        
        dataInicio = parseAdvancedDate(row[bestStartColumn.index], parseOptions);
        if (dataInicio) {
          dateSuccesses++;
          console.log(`✅ Start date parsed: ${toYMD(dataInicio)}`);
        }
      }
      
      if (bestEndColumn) {
        const endStrategy = bestEndColumn.strategy;
        const parseOptions = {
          assume: getAssumeFormat(endStrategy.format),
          isEndColumn: true, // For month/year formats, use last day of month
          date1904: options.date1904 || false
        };
        
        dataTermino = parseAdvancedDate(row[bestEndColumn.index], parseOptions);
        if (dataTermino) {
          dateSuccesses++;
          console.log(`✅ End date parsed: ${toYMD(dataTermino)}`);
        }
      }
      
      // Calculate period
      let prazoExecucao = 0;
      let prazoUnidade: 'dias' | 'meses' | 'anos' = 'dias';
      
      if (dataInicio && dataTermino) {
        const period = calculateContractPeriod(dataInicio, dataTermino);
        prazoExecucao = period.prazo;
        prazoUnidade = period.unidade;
      }
      
      // Create observations
      const dateValidation = validateDateConsistency(dataInicio, dataTermino);
      let observacoes = `Extraído da planilha "${sheetName}" - linha ${i}.`;
      
      if (!dateValidation.isValid) {
        observacoes += ` Avisos: ${dateValidation.warnings.join(', ')}.`;
      }
      
      // Add format information for debugging
      if (bestStartColumn || bestEndColumn) {
        observacoes += ` Formatos detectados: `;
        if (bestStartColumn) observacoes += `início (${bestStartColumn.strategy.format})`;
        if (bestStartColumn && bestEndColumn) observacoes += `, `;
        if (bestEndColumn) observacoes += `fim (${bestEndColumn.strategy.format})`;
        observacoes += `.`;
      }
      
      const contract: Partial<Contract> = {
        numero: numero || `${sheetName}-LINHA-${i}`,
        objeto: objeto || 'Objeto não especificado',
        contratante,
        contratada: contratada || 'Empresa não especificada',
        valor,
        dataInicio: dataInicio ? toYMD(dataInicio) : '',
        dataTermino: dataTermino ? toYMD(dataTermino) : '',
        prazoExecucao,
        prazoUnidade,
        modalidade,
        status,
        observacoes,
        aditivos: [],
        pagamentos: [],
        documentos: []
      };
      
      contracts.push(contract);
      successfulContracts++;
      
      console.log(`✅ Contract created: ${contract.numero} (${contract.dataInicio} to ${contract.dataTermino})`);
      
    } catch (error) {
      console.error(`❌ Error processing row ${i}:`, error);
    }
  }
  
  console.log(`📊 ENHANCED EXTRACTION RESULTS:`);
  console.log(`   Contracts generated: ${successfulContracts}`);
  console.log(`   Dates extracted: ${dateSuccesses}`);
  console.log(`   Date success rate: ${dateSuccesses > 0 ? ((dateSuccesses / (successfulContracts * 2)) * 100).toFixed(1) : 0}%`);
  
  return contracts;
}

function getAssumeFormat(detectedFormat: string): 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'auto' {
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
