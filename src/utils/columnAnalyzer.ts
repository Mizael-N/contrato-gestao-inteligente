
import { detectDateFormat, DateFormatStrategy } from './dateFormatDetector';

export interface ColumnAnalysis {
  index: number;
  header: string;
  dataType: 'date' | 'text' | 'number' | 'mixed' | 'empty';
  field: string | null;
  confidence: number;
  samples: any[];
  emptyCount: number;
  totalCount: number;
  dateStrategy?: DateFormatStrategy;
  pattern?: string;
}

// Enhanced field patterns with better date detection
const FIELD_PATTERNS = {
  numero: {
    keywords: ['numero', 'número', 'contrato', 'processo', 'num', 'nº', 'codigo', 'código', 'id', 'identificador'],
    priority: 1
  },
  objeto: {
    keywords: ['objeto', 'descrição', 'descricao', 'servico', 'serviço', 'item', 'especificação', 'descricão'],
    priority: 1
  },
  contratante: {
    keywords: ['contratante', 'orgao', 'órgão', 'cliente', 'prefeitura', 'governo', 'secretaria'],
    priority: 1
  },
  contratada: {
    keywords: ['contratada', 'empresa', 'fornecedor', 'prestador', 'razao social', 'cnpj'],
    priority: 1
  },
  valor: {
    keywords: ['valor', 'preco', 'preço', 'custo', 'montante', 'total', 'price', 'cost'],
    priority: 1
  },
  dataInicio: {
    keywords: ['inicio', 'início', 'data inicio', 'data início', 'assinatura', 'vigencia', 'vigência', 'start', 'begin', 'dt inicio', 'dt início'],
    priority: 2
  },
  dataTermino: {
    keywords: ['fim', 'final', 'término', 'termino', 'vencimento', 'prazo', 'end', 'finish', 'dt fim', 'dt final'],
    priority: 2
  },
  modalidade: {
    keywords: ['modalidade', 'tipo', 'licitacao', 'licitação', 'pregão', 'modality'],
    priority: 1
  },
  status: {
    keywords: ['status', 'situacao', 'situação', 'estado', 'vigente', 'ativo'],
    priority: 1
  }
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

function analyzeDataType(values: any[]): {
  type: 'date' | 'text' | 'number' | 'mixed' | 'empty';
  pattern?: string;
  dateStrategy?: DateFormatStrategy;
} {
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
  
  if (nonEmptyValues.length === 0) {
    return { type: 'empty' };
  }

  // Enhanced date analysis
  const dateStrategy = detectDateFormat(nonEmptyValues);
  if (dateStrategy.confidence > 0.6) { // Lower threshold for better detection
    console.log(`📅 Date pattern detected with confidence: ${dateStrategy.confidence}`);
    return { type: 'date', dateStrategy, pattern: dateStrategy.format };
  }

  // Enhanced number analysis
  const numberCount = nonEmptyValues.filter(v => {
    if (typeof v === 'number') return true;
    const str = String(v).trim();
    // Better number pattern including currency
    return /^[\d.,\-+R$\s€£¥]+$/.test(str) && str.length > 0;
  }).length;

  if (numberCount > nonEmptyValues.length * 0.7) { // Lower threshold
    return { type: 'number', pattern: 'numeric' };
  }

  // Text analysis
  const textCount = nonEmptyValues.filter(v => {
    const str = String(v).trim();
    return str.length > 0 && !/^[\d.,\-+R$\s€£¥]+$/.test(str);
  }).length;

  if (textCount > nonEmptyValues.length * 0.5) { // Lower threshold
    return { type: 'text', pattern: 'textual' };
  }

  return { type: 'mixed', pattern: 'mixed_content' };
}

function detectFieldType(header: string): { field: string | null; confidence: number } {
  const normalizedHeader = normalizeText(header);
  
  let bestMatch = { field: null as string | null, confidence: 0 };
  
  for (const [fieldName, config] of Object.entries(FIELD_PATTERNS)) {
    for (const keyword of config.keywords) {
      const normalizedKeyword = normalizeText(keyword);
      
      let confidence = 0;
      
      // Exact match
      if (normalizedHeader === normalizedKeyword) {
        confidence = 0.98;
      }
      // Contains keyword
      else if (normalizedHeader.includes(normalizedKeyword)) {
        confidence = 0.88;
      }
      // Keyword contains header (abbreviations)
      else if (normalizedKeyword.includes(normalizedHeader) && normalizedHeader.length >= 3) {
        confidence = 0.78;
      }
      // Partial match for dates
      else if (fieldName.includes('data') && (normalizedHeader.includes('data') || normalizedHeader.includes('dt'))) {
        confidence = 0.65;
      }
      
      // Apply field priority
      confidence *= (config.priority === 1 ? 1.0 : 0.95);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { field: fieldName, confidence };
      }
    }
  }
  
  return bestMatch;
}

export function analyzeColumns(headers: string[], data: any[][]): ColumnAnalysis[] {
  console.log('🔍 Enhanced column analysis starting:', headers.length);
  
  const analyses: ColumnAnalysis[] = [];
  
  for (let colIndex = 0; colIndex < headers.length; colIndex++) {
    const header = String(headers[colIndex] || '').trim();
    
    if (!header) {
      console.log(`⚠️ Column ${colIndex}: empty header, skipping`);
      continue;
    }
    
    console.log(`📊 Analyzing column ${colIndex}: "${header}"`);
    
    // Extract column data (excluding header row)
    const columnData = data.slice(1).map(row => row[colIndex]);
    const nonEmptyData = columnData.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
    
    console.log(`  📈 Data: ${columnData.length} total, ${nonEmptyData.length} non-empty`);
    
    // Data type analysis
    const dataAnalysis = analyzeDataType(columnData);
    
    // Field detection
    const fieldDetection = detectFieldType(header);
    
    // Boost confidence if data type matches expected field type
    if (fieldDetection.field && fieldDetection.field.includes('data') && dataAnalysis.type === 'date') {
      fieldDetection.confidence = Math.min(0.99, fieldDetection.confidence + 0.15);
      console.log(`🚀 Date field confidence boosted: ${fieldDetection.confidence}`);
    }
    
    const samples = nonEmptyData.slice(0, 5);
    
    const analysis: ColumnAnalysis = {
      index: colIndex,
      header,
      dataType: dataAnalysis.type,
      field: fieldDetection.field,
      confidence: fieldDetection.confidence,
      samples,
      emptyCount: columnData.length - nonEmptyData.length,
      totalCount: columnData.length,
      dateStrategy: dataAnalysis.dateStrategy,
      pattern: dataAnalysis.pattern
    };
    
    analyses.push(analysis);
    
    console.log(`  ✅ Field: ${analysis.field || 'unmapped'} (${(analysis.confidence * 100).toFixed(0)}%)`);
    console.log(`  📊 Type: ${analysis.dataType} ${analysis.pattern ? `(${analysis.pattern})` : ''}`);
    if (analysis.dateStrategy) {
      console.log(`  📅 Date strategy: ${analysis.dateStrategy.format} (${(analysis.dateStrategy.confidence * 100).toFixed(0)}%)`);
    }
  }
  
  return analyses;
}

export function validateColumnMapping(analyses: ColumnAnalysis[]): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
  missingFields: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const missingFields: string[] = [];
  
  const requiredFields = ['numero', 'objeto', 'contratante', 'contratada'];
  const recommendedFields = ['dataInicio', 'dataTermino', 'valor'];
  
  const mappedFields = new Set(analyses.filter(a => a.field && a.confidence > 0.6).map(a => a.field));
  
  // Check required fields
  for (const field of requiredFields) {
    if (!mappedFields.has(field)) {
      missingFields.push(field);
      warnings.push(`Campo obrigatório não encontrado: ${field}`);
    }
  }
  
  // Check recommended fields
  for (const field of recommendedFields) {
    if (!mappedFields.has(field)) {
      suggestions.push(`Campo recomendado não encontrado: ${field}`);
    }
  }
  
  // Check columns with too much empty data
  for (const analysis of analyses) {
    if (analysis.field && analysis.emptyCount > analysis.totalCount * 0.7) {
      warnings.push(`Coluna "${analysis.header}" tem muitos dados vazios (${analysis.emptyCount}/${analysis.totalCount})`);
    }
  }
  
  // Check date columns with low confidence
  const dateColumns = analyses.filter(a => a.dataType === 'date');
  for (const dateCol of dateColumns) {
    if (dateCol.dateStrategy && dateCol.dateStrategy.confidence < 0.7) {
      warnings.push(`Formato de data incerto na coluna "${dateCol.header}" (${(dateCol.dateStrategy.confidence * 100).toFixed(0)}%)`);
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    warnings,
    suggestions,
    missingFields
  };
}
