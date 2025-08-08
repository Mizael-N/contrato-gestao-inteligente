
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

// Mapeamentos de campos mais específicos
const FIELD_PATTERNS = {
  numero: {
    keywords: ['numero', 'número', 'contrato', 'processo', 'num', 'nº', 'codigo', 'código', 'id', 'identificador'],
    priority: 1
  },
  objeto: {
    keywords: ['objeto', 'descrição', 'descricao', 'servico', 'serviço', 'item', 'especificação'],
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
    keywords: ['inicio', 'início', 'data inicio', 'assinatura', 'vigencia', 'start', 'begin'],
    priority: 2
  },
  dataTermino: {
    keywords: ['fim', 'final', 'término', 'termino', 'vencimento', 'prazo', 'end', 'finish'],
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

  // Análise de datas
  const dateStrategy = detectDateFormat(nonEmptyValues);
  if (dateStrategy.confidence > 0.7) {
    return { type: 'date', dateStrategy, pattern: dateStrategy.format };
  }

  // Análise de números
  const numberCount = nonEmptyValues.filter(v => {
    if (typeof v === 'number') return true;
    const str = String(v).trim();
    return /^[\d.,\-+R$\s]+$/.test(str) && str.length > 0;
  }).length;

  if (numberCount > nonEmptyValues.length * 0.8) {
    return { type: 'number', pattern: 'numeric' };
  }

  // Análise de texto
  const textCount = nonEmptyValues.filter(v => {
    const str = String(v).trim();
    return str.length > 0 && !/^[\d.,\-+R$\s]+$/.test(str);
  }).length;

  if (textCount > nonEmptyValues.length * 0.6) {
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
      
      // Correspondência exata
      if (normalizedHeader === normalizedKeyword) {
        confidence = 0.95;
      }
      // Contém a palavra-chave
      else if (normalizedHeader.includes(normalizedKeyword)) {
        confidence = 0.85;
      }
      // Palavra-chave contém o cabeçalho (para abreviações)
      else if (normalizedKeyword.includes(normalizedHeader) && normalizedHeader.length >= 3) {
        confidence = 0.75;
      }
      
      // Aplicar prioridade do campo
      confidence *= (config.priority === 1 ? 1.0 : 0.9);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { field: fieldName, confidence };
      }
    }
  }
  
  return bestMatch;
}

export function analyzeColumns(headers: string[], data: any[][]): ColumnAnalysis[] {
  console.log('🔍 Iniciando análise detalhada de colunas:', headers.length);
  
  const analyses: ColumnAnalysis[] = [];
  
  for (let colIndex = 0; colIndex < headers.length; colIndex++) {
    const header = String(headers[colIndex] || '').trim();
    
    if (!header) {
      console.log(`⚠️ Coluna ${colIndex}: cabeçalho vazio, ignorando`);
      continue;
    }
    
    console.log(`📊 Analisando coluna ${colIndex}: "${header}"`);
    
    // Extrair dados da coluna (excluindo cabeçalho)
    const columnData = data.slice(1).map(row => row[colIndex]);
    const nonEmptyData = columnData.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
    
    console.log(`  📈 Dados: ${columnData.length} total, ${nonEmptyData.length} não vazios, ${columnData.length - nonEmptyData.length} vazios`);
    
    // Análise do tipo de dados
    const dataAnalysis = analyzeDataType(columnData);
    
    // Detecção do campo
    const fieldDetection = detectFieldType(header);
    
    // Amostras para debug
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
    
    console.log(`  ✅ Campo: ${analysis.field || 'não identificado'} (${(analysis.confidence * 100).toFixed(0)}%)`);
    console.log(`  📊 Tipo: ${analysis.dataType} ${analysis.pattern ? `(${analysis.pattern})` : ''}`);
    console.log(`  📝 Amostras:`, samples);
    
    if (analysis.emptyCount > 0) {
      console.log(`  ⚠️ ${analysis.emptyCount} células vazias de ${analysis.totalCount} total`);
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
  
  // Campos obrigatórios
  const requiredFields = ['numero', 'objeto', 'contratante', 'contratada'];
  const recommendedFields = ['dataInicio', 'dataTermino', 'valor'];
  
  const mappedFields = new Set(analyses.filter(a => a.field).map(a => a.field));
  
  // Verificar campos obrigatórios
  for (const field of requiredFields) {
    if (!mappedFields.has(field)) {
      missingFields.push(field);
      warnings.push(`Campo obrigatório não encontrado: ${field}`);
    }
  }
  
  // Verificar campos recomendados
  for (const field of recommendedFields) {
    if (!mappedFields.has(field)) {
      suggestions.push(`Campo recomendado não encontrado: ${field}`);
    }
  }
  
  // Verificar colunas com muitos dados vazios
  for (const analysis of analyses) {
    if (analysis.field && analysis.emptyCount > analysis.totalCount * 0.5) {
      warnings.push(`Coluna "${analysis.header}" tem ${analysis.emptyCount} de ${analysis.totalCount} células vazias`);
    }
  }
  
  // Verificar datas sem estratégia clara
  const dateColumns = analyses.filter(a => a.dataType === 'date');
  for (const dateCol of dateColumns) {
    if (dateCol.dateStrategy && dateCol.dateStrategy.confidence < 0.8) {
      warnings.push(`Formato de data na coluna "${dateCol.header}" pode estar incorreto (confiança: ${(dateCol.dateStrategy.confidence * 100).toFixed(0)}%)`);
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    warnings,
    suggestions,
    missingFields
  };
}
