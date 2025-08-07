
import { format, parse, isValid, isBefore, isAfter, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';

// Sinônimos massivamente expandidos para datas de início
export const START_DATE_SYNONYMS = [
  // Português - Início da vigência
  'inicio', 'início', 'inicio vigencia', 'início vigência', 'inicio da vigencia', 'início da vigência',
  'vigencia inicio', 'vigência início', 'vigencia inicial', 'vigência inicial',
  'data inicio', 'data início', 'data de inicio', 'data de início',
  'data inicial', 'data inicio vigencia', 'data início vigência',
  
  // Português - Assinatura
  'assinatura', 'data assinatura', 'data da assinatura', 'assinado', 'assinado em',
  'celebração', 'celebracao', 'data celebração', 'data celebracao', 'celebrado',
  'firmado', 'firmado em', 'data firmado', 'contrato firmado',
  
  // Português - Execução/Eficácia
  'execução', 'execucao', 'inicio execução', 'início execução', 'inicio execucao', 'início execucao',
  'eficácia', 'eficacia', 'eficaz', 'data eficácia', 'data eficacia',
  'validade', 'válido', 'valido', 'válido a partir', 'valido a partir',
  
  // Português - Termos gerais
  'começo', 'comeco', 'começar', 'comecar', 'iniciado', 'iniciado em',
  'abertura', 'abertura em', 'partida', 'início contrato', 'inicio contrato',
  
  // Abreviações
  'dt inicio', 'dt início', 'dt inicial', 'dt assinatura', 'dt celebração', 'dt celebracao',
  'dt vigencia', 'dt vigência', 'dt execução', 'dt execucao', 'dt eficácia', 'dt eficacia',
  
  // Inglês
  'start', 'start date', 'begin', 'begin date', 'beginning', 'commenced', 'effective',
  'effective date', 'signature', 'signed', 'signed date', 'execution', 'contract start'
];

// Sinônimos massivamente expandidos para datas de término
export const END_DATE_SYNONYMS = [
  // Português - Fim da vigência
  'fim', 'final', 'término', 'termino', 'fim vigencia', 'fim vigência',
  'final vigencia', 'final vigência', 'término vigencia', 'término vigência',
  'termino vigencia', 'termino vigência', 'vigencia fim', 'vigência fim',
  'vigencia final', 'vigência final', 'vigencia término', 'vigência término',
  
  // Português - Vencimento
  'vencimento', 'vence', 'vence em', 'data vencimento', 'data de vencimento',
  'prazo', 'prazo final', 'prazo limite', 'limite', 'até', 'validade até',
  'válido até', 'valido até', 'expira', 'expira em', 'expiração', 'expiracao',
  
  // Português - Encerramento
  'encerramento', 'encerra', 'encerra em', 'finalização', 'finalizacao',
  'conclusão', 'conclusao', 'conclui', 'conclui em', 'acabar', 'acaba em',
  'cessar', 'cessa em', 'cessação', 'cessacao',
  
  // Português - Execução/Entrega
  'entrega', 'entrega final', 'data entrega', 'prazo entrega',
  'fim execução', 'fim execucao', 'término execução', 'término execucao',
  'termino execução', 'termino execucao',
  
  // Abreviações
  'dt fim', 'dt final', 'dt término', 'dt termino', 'dt vencimento',
  'dt limite', 'dt prazo', 'dt entrega', 'dt conclusão', 'dt conclusao',
  'dt vigencia fim', 'dt vigência fim', 'dt execução fim', 'dt execucao fim',
  
  // Inglês
  'end', 'end date', 'final', 'final date', 'finish', 'finish date',
  'completion', 'complete', 'expiry', 'expires', 'due', 'due date',
  'deadline', 'contract end', 'term end', 'closing'
];

// Formatos de data conhecidos para parsing
export const DATE_FORMATS = [
  // Formato brasileiro
  'dd/MM/yyyy', 'dd/MM/yy', 'dd-MM-yyyy', 'dd-MM-yy', 'dd.MM.yyyy', 'dd.MM.yy',
  'd/M/yyyy', 'd/M/yy', 'd-M-yyyy', 'd-M-yy', 'd.M.yyyy', 'd.M.yy',
  
  // Formato americano
  'MM/dd/yyyy', 'MM/dd/yy', 'MM-dd-yyyy', 'MM-dd-yy', 'MM.dd.yyyy', 'MM.dd.yy',
  'M/d/yyyy', 'M/d/yy', 'M-d-yyyy', 'M-d-yy', 'M.d.yyyy', 'M.d.yy',
  
  // Formato ISO
  'yyyy-MM-dd', 'yyyy/MM/dd', 'yyyy.MM.dd',
  'yy-MM-dd', 'yy/MM/dd', 'yy.MM.dd',
  
  // Formatos por extenso (parcial)
  'dd \'de\' MMMM \'de\' yyyy', 'dd \'de\' MMM \'de\' yyyy',
  'dd MMMM yyyy', 'dd MMM yyyy',
  'MMMM dd, yyyy', 'MMM dd, yyyy'
];

// Interface para metadados de célula (formatação)
export interface CellMetadata {
  isBold?: boolean;
  hasColor?: boolean;
  backgroundColor?: string;
  fontSize?: number;
  isMerged?: boolean;
  mergeRange?: string;
  isHighlighted?: boolean;
}

// Função para normalizar texto de busca
function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ') // Remove pontuação
    .replace(/\s+/g, ' '); // Normaliza espaços
}

// Função para detectar tipo de planilha
export function detectSpreadsheetType(data: any[][], fileName: string): 'excel' | 'google' | 'libreoffice' | 'csv' | 'unknown' {
  const fileExt = fileName.toLowerCase();
  
  if (fileExt.includes('.xlsx') || fileExt.includes('.xls')) {
    return 'excel';
  }
  if (fileExt.includes('.csv')) {
    return 'csv';
  }
  if (fileExt.includes('.ods')) {
    return 'libreoffice';
  }
  
  // Detectar por características dos dados
  if (data.length > 0) {
    const firstRow = data[0];
    // Google Sheets às vezes tem características específicas
    const hasGooglePatterns = firstRow.some(cell => 
      typeof cell === 'string' && cell.includes('sheets.google.com')
    );
    if (hasGooglePatterns) return 'google';
  }
  
  return 'unknown';
}

// Função avançada para parsing de datas - CORRIGIDA para resolver problema de -1 dia
export function parseAdvancedDate(value: any, spreadsheetType: string = 'unknown'): Date | null {
  if (!value) return null;
  
  console.log(`🔍 Analisando data: "${value}" (tipo: ${typeof value}, planilha: ${spreadsheetType})`);
  
  // Se já é uma data válida
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }
  
  // Se é número (serial date do Excel/LibreOffice) - CORREÇÃO PRINCIPAL
  if (typeof value === 'number' && value > 0) {
    try {
      let date: Date;
      
      if (spreadsheetType === 'excel') {
        // Excel: 1 = 1 de janeiro de 1900 (mas Excel conta erradamente 1900 como bissexto)
        // CORREÇÃO: Ajustar corretamente para o epoch do Excel
        if (value > 59) {
          // Para datas após 28/02/1900, compensar o erro do Excel
          const excelEpoch = new Date(1899, 11, 30); // 30 de dezembro de 1899
          date = new Date(excelEpoch.getTime() + (value - 1) * 24 * 60 * 60 * 1000);
        } else {
          // Para datas antes, usar diretamente
          const excelEpoch = new Date(1899, 11, 30);
          date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
        }
      } else if (spreadsheetType === 'libreoffice') {
        // LibreOffice: 1 = 30 de dezembro de 1899
        const libreEpoch = new Date(1899, 11, 30);
        date = new Date(libreEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      } else {
        // Tentar Excel por padrão com correção
        if (value > 59) {
          const excelEpoch = new Date(1899, 11, 30);
          date = new Date(excelEpoch.getTime() + (value - 1) * 24 * 60 * 60 * 1000);
        } else {
          const excelEpoch = new Date(1899, 11, 30);
          date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
        }
      }
      
      if (isValid(date) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
        console.log(`📅 Data serial convertida: ${value} -> ${format(date, 'yyyy-MM-dd')}`);
        return date;
      }
    } catch (e) {
      console.log(`⚠️ Erro ao converter data serial: ${e}`);
    }
  }
  
  // Se é string, tentar vários formatos
  if (typeof value === 'string') {
    const cleanValue = value.trim();
    
    if (!cleanValue) return null;
    
    // Tentar formatos conhecidos
    for (const dateFormat of DATE_FORMATS) {
      try {
        const parsedDate = parse(cleanValue, dateFormat, new Date());
        if (isValid(parsedDate)) {
          // Validar se a data faz sentido
          const year = parsedDate.getFullYear();
          if (year >= 1900 && year <= 2100) {
            // Verificar se não é muito no futuro (mais de 20 anos)
            const maxFuture = new Date();
            maxFuture.setFullYear(maxFuture.getFullYear() + 20);
            
            if (parsedDate <= maxFuture) {
              console.log(`📅 Data parseada com formato "${dateFormat}": "${cleanValue}" -> ${format(parsedDate, 'yyyy-MM-dd')}`);
              return parsedDate;
            }
          }
        }
      } catch (e) {
        // Continuar tentando outros formatos
      }
    }
    
    // Tentar parsing nativo do JavaScript como último recurso
    try {
      const nativeDate = new Date(cleanValue);
      if (isValid(nativeDate) && nativeDate.getFullYear() > 1900 && nativeDate.getFullYear() < 2100) {
        const maxFuture = new Date();
        maxFuture.setFullYear(maxFuture.getFullYear() + 20);
        
        if (nativeDate <= maxFuture) {
          console.log(`📅 Data parseada nativamente: "${cleanValue}" -> ${format(nativeDate, 'yyyy-MM-dd')}`);
          return nativeDate;
        }
      }
    } catch (e) {
      // Falhou em todas as tentativas
    }
  }
  
  console.log(`❌ Não foi possível converter a data: "${value}"`);
  return null;
}

// Função para buscar colunas de data com score de confiança - EXPANDIDA
export function findDateColumns(headers: string[], cellMetadata?: CellMetadata[][]): {
  startDateColumns: { index: number; confidence: number; matchedTerm: string }[];
  endDateColumns: { index: number; confidence: number; matchedTerm: string }[];
} {
  const startDateColumns: { index: number; confidence: number; matchedTerm: string }[] = [];
  const endDateColumns: { index: number; confidence: number; matchedTerm: string }[] = [];
  
  console.log('🔍 Analisando cabeçalhos para encontrar colunas de data:', headers);
  
  headers.forEach((header, index) => {
    const normalizedHeader = normalizeSearchText(String(header || ''));
    
    // Bonus de confiança se a célula está formatada (negrito, cor, etc)
    let formattingBonus = 0;
    if (cellMetadata && cellMetadata[0] && cellMetadata[0][index]) {
      const metadata = cellMetadata[0][index];
      if (metadata.isBold) formattingBonus += 0.1;
      if (metadata.hasColor) formattingBonus += 0.1;
      if (metadata.isHighlighted) formattingBonus += 0.15;
      if (metadata.isMerged) formattingBonus += 0.05;
    }
    
    // Buscar datas de início
    for (const synonym of START_DATE_SYNONYMS) {
      const normalizedSynonym = normalizeSearchText(synonym);
      
      if (normalizedHeader.includes(normalizedSynonym) || normalizedSynonym.includes(normalizedHeader)) {
        let confidence = normalizedHeader === normalizedSynonym ? 1.0 : 
                        normalizedHeader.includes(normalizedSynonym) ? 0.8 : 0.6;
        
        confidence = Math.min(1.0, confidence + formattingBonus);
        
        startDateColumns.push({
          index,
          confidence,
          matchedTerm: synonym
        });
        
        console.log(`✅ Coluna de data INÍCIO encontrada: "${header}" (índice ${index}, confiança ${confidence}, formatação +${formattingBonus}) - termo: "${synonym}"`);
        break;
      }
    }
    
    // Buscar datas de término
    for (const synonym of END_DATE_SYNONYMS) {
      const normalizedSynonym = normalizeSearchText(synonym);
      
      if (normalizedHeader.includes(normalizedSynonym) || normalizedSynonym.includes(normalizedHeader)) {
        let confidence = normalizedHeader === normalizedSynonym ? 1.0 : 
                        normalizedHeader.includes(normalizedSynonym) ? 0.8 : 0.6;
        
        confidence = Math.min(1.0, confidence + formattingBonus);
        
        endDateColumns.push({
          index,
          confidence,
          matchedTerm: synonym
        });
        
        console.log(`✅ Coluna de data FIM encontrada: "${header}" (índice ${index}, confiança ${confidence}, formatação +${formattingBonus}) - termo: "${synonym}"`);
        break;
      }
    }
  });
  
  // Ordenar por confiança (maior primeiro)
  startDateColumns.sort((a, b) => b.confidence - a.confidence);
  endDateColumns.sort((a, b) => b.confidence - a.confidence);
  
  console.log(`📊 Resultado da busca:`, {
    inicio: startDateColumns.length,
    fim: endDateColumns.length
  });
  
  return { startDateColumns, endDateColumns };
}

// Função para calcular prazo entre duas datas
export function calculateContractPeriod(startDate: Date, endDate: Date): { 
  prazo: number; 
  unidade: 'dias' | 'meses' | 'anos';
  totalDays: number;
} {
  const totalDays = differenceInDays(endDate, startDate);
  
  console.log(`⏱️ Calculando prazo: ${format(startDate, 'dd/MM/yyyy')} até ${format(endDate, 'dd/MM/yyyy')} = ${totalDays} dias`);
  
  if (totalDays <= 90) {
    return { prazo: totalDays, unidade: 'dias', totalDays };
  } else if (totalDays <= 730) { // Até 2 anos
    const months = differenceInMonths(endDate, startDate);
    return { prazo: months, unidade: 'meses', totalDays };
  } else {
    const years = differenceInYears(endDate, startDate);
    return { prazo: years > 0 ? years : 1, unidade: 'anos', totalDays };
  }
}

// Função para validar consistência de datas
export function validateDateConsistency(startDate: Date | null, endDate: Date | null): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  if (!startDate && !endDate) {
    warnings.push('Nenhuma data encontrada');
    suggestions.push('Verifique se as colunas de data estão nomeadas corretamente');
    return { isValid: false, warnings, suggestions };
  }
  
  if (!startDate) {
    warnings.push('Data de início não encontrada');
    suggestions.push('Procure por colunas com nomes como "início", "assinatura", "data inicial"');
  }
  
  if (!endDate) {
    warnings.push('Data de término não encontrada');
    suggestions.push('Procure por colunas com nomes como "fim", "vencimento", "data final"');
  }
  
  if (startDate && endDate) {
    if (isAfter(startDate, endDate)) {
      warnings.push('Data de início é posterior à data de término');
      suggestions.push('Verifique se as datas não estão invertidas nas colunas');
      return { isValid: false, warnings, suggestions };
    }
    
    const daysDiff = differenceInDays(endDate, startDate);
    if (daysDiff === 0) {
      warnings.push('Contrato com duração zero');
      suggestions.push('Verifique se as datas estão corretas');
    } else if (daysDiff > 3650) { // Mais de 10 anos
      warnings.push('Contrato com duração muito longa (mais de 10 anos)');
      suggestions.push('Confirme se as datas estão no formato correto');
    }
  }
  
  return { 
    isValid: warnings.length === 0 || (startDate && endDate && !isAfter(startDate, endDate)), 
    warnings, 
    suggestions 
  };
}

// Função para extrair metadados de célula do XLSX (formatação)
export function extractCellMetadata(worksheet: any): CellMetadata[][] {
  const metadata: CellMetadata[][] = [];
  
  if (!worksheet || !worksheet['!ref']) {
    return metadata;
  }
  
  try {
    const range = worksheet['!ref'];
    const decoded = { s: { c: 0, r: 0 }, e: { c: 0, r: 0 } };
    
    // Tentar decodificar range manualmente se necessário
    const rangeMatch = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
    if (rangeMatch) {
      const [, startCol, startRow, endCol, endRow] = rangeMatch;
      decoded.s.c = startCol.charCodeAt(0) - 65; // A=0, B=1, etc
      decoded.s.r = parseInt(startRow) - 1;
      decoded.e.c = endCol.charCodeAt(0) - 65;
      decoded.e.r = parseInt(endRow) - 1;
    }
    
    for (let r = decoded.s.r; r <= decoded.e.r; r++) {
      metadata[r] = [];
      for (let c = decoded.s.c; c <= decoded.e.c; c++) {
        const cellAddress = String.fromCharCode(65 + c) + (r + 1);
        const cell = worksheet[cellAddress];
        
        if (cell) {
          const cellMeta: CellMetadata = {};
          
          // Verificar formatação se disponível
          if (cell.s) {
            cellMeta.isBold = cell.s.font?.bold || false;
            cellMeta.hasColor = !!(cell.s.font?.color || cell.s.fill?.fgColor);
            cellMeta.backgroundColor = cell.s.fill?.fgColor?.rgb;
            cellMeta.fontSize = cell.s.font?.sz;
          }
          
          // Verificar merge
          if (worksheet['!merges']) {
            cellMeta.isMerged = worksheet['!merges'].some((merge: any) => 
              r >= merge.s.r && r <= merge.e.r && c >= merge.s.c && c <= merge.e.c
            );
          }
          
          // Considerar célula destacada se tem formatação especial
          cellMeta.isHighlighted = cellMeta.isBold || cellMeta.hasColor || cellMeta.isMerged;
          
          metadata[r][c] = cellMeta;
        }
      }
    }
  } catch (e) {
    console.log('⚠️ Erro ao extrair metadados de formatação:', e);
  }
  
  return metadata;
}
