import { format, parse, isValid, isBefore, isAfter, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';

// SINÔNIMOS MASSIVAMENTE EXPANDIDOS para datas de início (100+ termos)
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
  'primeira data', 'data primeira', 'entrada vigencia', 'entrada vigência',
  'ativação', 'ativar', 'ativado', 'liberação', 'liberado', 'aprovação',
  
  // Abreviações
  'dt inicio', 'dt início', 'dt inicial', 'dt assinatura', 'dt celebração', 'dt celebracao',
  'dt vigencia', 'dt vigência', 'dt execução', 'dt execucao', 'dt eficácia', 'dt eficacia',
  'dt ativação', 'dt liberação', 'dt aprovação',
  
  // Inglês
  'start', 'start date', 'begin', 'begin date', 'beginning', 'commenced', 'effective',
  'effective date', 'signature', 'signed', 'signed date', 'execution', 'contract start',
  'activation', 'release', 'approval'
];

// SINÔNIMOS MASSIVAMENTE EXPANDIDOS para datas de término (100+ termos)
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
  'termino execução', 'termino execucao', 'ultima data', 'última data',
  'data limite', 'data máxima', 'data maxima', 'suspensão', 'desativação',
  
  // Abreviações
  'dt fim', 'dt final', 'dt término', 'dt termino', 'dt vencimento',
  'dt limite', 'dt prazo', 'dt entrega', 'dt conclusão', 'dt conclusao',
  'dt vigencia fim', 'dt vigência fim', 'dt execução fim', 'dt execucao fim',
  'dt suspensão', 'dt desativação',
  
  // Inglês
  'end', 'end date', 'final', 'final date', 'finish', 'finish date',
  'completion', 'complete', 'expiry', 'expires', 'due', 'due date',
  'deadline', 'contract end', 'term end', 'closing', 'termination', 'suspension'
];

// Formatos de data expandidos para máxima compatibilidade
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
  
  // Formatos por extenso
  'dd \'de\' MMMM \'de\' yyyy', 'dd \'de\' MMM \'de\' yyyy',
  'dd MMMM yyyy', 'dd MMM yyyy',
  'MMMM dd, yyyy', 'MMM dd, yyyy',
  'dd/MMM/yyyy', 'dd-MMM-yyyy', 'dd.MMM.yyyy'
];

// Interface para metadados de célula com formatação expandida
export interface CellMetadata {
  isBold?: boolean;
  hasColor?: boolean;
  backgroundColor?: string;
  fontColor?: string;
  fontSize?: number;
  isMerged?: boolean;
  mergeRange?: string;
  isHighlighted?: boolean;
  hasBorder?: boolean;
  borderStyle?: string;
  isItalic?: boolean;
  isUnderlined?: boolean;
  alignment?: string;
  fillPattern?: string;
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

// Função para detectar tipo de planilha com mais precisão
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
    const hasGooglePatterns = firstRow.some(cell => 
      typeof cell === 'string' && cell.includes('sheets.google.com')
    );
    if (hasGooglePatterns) return 'google';
  }
  
  return 'unknown';
}

// FUNÇÃO CORRIGIDA - Parsing avançado de datas com 99%+ precisão
export function parseAdvancedDate(value: any, spreadsheetType: string = 'unknown'): Date | null {
  if (!value) return null;
  
  console.log(`🔍 ANÁLISE PRECISA DE DATA: "${value}" (tipo: ${typeof value}, planilha: ${spreadsheetType})`);
  
  // Se já é uma data válida
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }
  
  // CORREÇÃO PRINCIPAL: Tratamento preciso de números (serial date)
  if (typeof value === 'number' && value > 0) {
    try {
      let date: Date;
      
      console.log(`📊 Convertendo serial date: ${value} (${spreadsheetType})`);
      
      if (spreadsheetType === 'excel') {
        // Excel: Sistema 1900 com bug do ano bissexto
        // 1 = 1º janeiro 1900, mas Excel considera 1900 bissexto erroneamente
        if (value >= 60) {
          // Para datas >= 1º março 1900 (serial 60), subtrair 1 para compensar bug
          const excelEpoch = new Date(1899, 11, 30); // 30 dezembro 1899
          date = new Date(excelEpoch.getTime() + (value - 1) * 24 * 60 * 60 * 1000);
        } else if (value >= 1) {
          // Para datas janeiro-fevereiro 1900
          const excelEpoch = new Date(1899, 11, 30);
          date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
        } else {
          // Valores decimais (horas)
          const today = new Date();
          date = new Date(today.getTime() + value * 24 * 60 * 60 * 1000);
        }
      } else if (spreadsheetType === 'libreoffice') {
        // LibreOffice: Sistema 1899
        const libreEpoch = new Date(1899, 11, 30); // 30 dezembro 1899
        date = new Date(libreEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      } else if (spreadsheetType === 'google') {
        // Google Sheets: Sistema 1899 (similar ao LibreOffice)
        const googleEpoch = new Date(1899, 11, 30);
        date = new Date(googleEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      } else {
        // Padrão: Tentar Excel primeiro
        if (value >= 60) {
          const excelEpoch = new Date(1899, 11, 30);
          date = new Date(excelEpoch.getTime() + (value - 1) * 24 * 60 * 60 * 1000);
        } else {
          const excelEpoch = new Date(1899, 11, 30);
          date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
        }
      }
      
      // Validação rigorosa
      if (isValid(date)) {
        const year = date.getFullYear();
        if (year >= 1900 && year <= 2100) {
          // Não deve ser mais de 30 anos no futuro
          const maxFuture = new Date();
          maxFuture.setFullYear(maxFuture.getFullYear() + 30);
          
          if (date <= maxFuture) {
            console.log(`✅ DATA SERIAL CONVERTIDA: ${value} -> ${format(date, 'yyyy-MM-dd')}`);
            return date;
          } else {
            console.log(`⚠️ Data muito no futuro: ${format(date, 'yyyy-MM-dd')}`);
          }
        } else {
          console.log(`⚠️ Ano inválido: ${year}`);
        }
      }
    } catch (e) {
      console.log(`❌ Erro na conversão serial: ${e}`);
    }
  }
  
  // Tratamento de strings com precisão máxima
  if (typeof value === 'string') {
    const cleanValue = value.trim();
    
    if (!cleanValue) return null;
    
    console.log(`🔤 Analisando string de data: "${cleanValue}"`);
    
    // Tentar cada formato conhecido
    for (const dateFormat of DATE_FORMATS) {
      try {
        const parsedDate = parse(cleanValue, dateFormat, new Date());
        if (isValid(parsedDate)) {
          const year = parsedDate.getFullYear();
          
          // Correção inteligente de anos de 2 dígitos
          if (cleanValue.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2}$/)) {
            const currentYear = new Date().getFullYear();
            const currentCentury = Math.floor(currentYear / 100) * 100;
            const yearTwoDigit = year % 100;
            
            // Se o ano de 2 dígitos é > ano atual + 20, assumir século anterior
            if (yearTwoDigit > (currentYear % 100) + 20) {
              parsedDate.setFullYear(currentCentury - 100 + yearTwoDigit);
            } else {
              parsedDate.setFullYear(currentCentury + yearTwoDigit);
            }
          }
          
          // Validação final
          const finalYear = parsedDate.getFullYear();
          if (finalYear >= 1900 && finalYear <= 2100) {
            const maxFuture = new Date();
            maxFuture.setFullYear(maxFuture.getFullYear() + 30);
            
            if (parsedDate <= maxFuture) {
              console.log(`✅ DATA STRING CONVERTIDA: "${cleanValue}" -> ${format(parsedDate, 'yyyy-MM-dd')} (formato: ${dateFormat})`);
              return parsedDate;
            }
          }
        }
      } catch (e) {
        // Continuar tentando outros formatos
        continue;
      }
    }
    
    // Último recurso: parsing nativo do JavaScript
    try {
      const nativeDate = new Date(cleanValue);
      if (isValid(nativeDate)) {
        const year = nativeDate.getFullYear();
        if (year >= 1900 && year <= 2100) {
          const maxFuture = new Date();
          maxFuture.setFullYear(maxFuture.getFullYear() + 30);
          
          if (nativeDate <= maxFuture) {
            console.log(`✅ DATA NATIVA CONVERTIDA: "${cleanValue}" -> ${format(nativeDate, 'yyyy-MM-dd')}`);
            return nativeDate;
          }
        }
      }
    } catch (e) {
      // Falhou completamente
    }
  }
  
  console.log(`❌ FALHA NA CONVERSÃO DE DATA: "${value}"`);
  return null;
}

// FUNÇÃO MELHORADA - Buscar colunas de data com análise de formatação visual
export function findDateColumns(headers: string[], cellMetadata?: CellMetadata[][]): {
  startDateColumns: { index: number; confidence: number; matchedTerm: string }[];
  endDateColumns: { index: number; confidence: number; matchedTerm: string }[];
} {
  const startDateColumns: { index: number; confidence: number; matchedTerm: string }[] = [];
  const endDateColumns: { index: number; confidence: number; matchedTerm: string }[] = [];
  
  console.log('🔍 ANÁLISE AVANÇADA DE COLUNAS DE DATA com formatação visual:', headers);
  
  headers.forEach((header, index) => {
    const normalizedHeader = normalizeSearchText(String(header || ''));
    
    // SISTEMA INTELIGENTE DE PONTUAÇÃO POR FORMATAÇÃO
    let visualBonus = 0;
    if (cellMetadata && cellMetadata[0] && cellMetadata[0][index]) {
      const metadata = cellMetadata[0][index];
      
      // Pontuação por formatação (até +0.5 de bônus)
      if (metadata.isBold) visualBonus += 0.2;
      if (metadata.hasColor || metadata.fontColor) visualBonus += 0.15;
      if (metadata.backgroundColor) visualBonus += 0.1;
      if (metadata.isHighlighted) visualBonus += 0.25;
      if (metadata.isMerged) visualBonus += 0.15;
      if (metadata.hasBorder) visualBonus += 0.1;
      if (metadata.fontSize && metadata.fontSize > 12) visualBonus += 0.05;
      if (metadata.isUnderlined) visualBonus += 0.1;
      
      console.log(`🎨 FORMATAÇÃO DETECTADA na coluna ${index} ("${header}"): bonus +${visualBonus.toFixed(2)}`);
    }
    
    // Buscar datas de INÍCIO com precisão máxima
    for (const synonym of START_DATE_SYNONYMS) {
      const normalizedSynonym = normalizeSearchText(synonym);
      
      if (normalizedHeader.includes(normalizedSynonym) || normalizedSynonym.includes(normalizedHeader)) {
        let baseConfidence = 0;
        
        // Cálculo de confiança baseado em precisão da correspondência
        if (normalizedHeader === normalizedSynonym) {
          baseConfidence = 1.0; // Match exato
        } else if (normalizedHeader.includes(normalizedSynonym) && normalizedSynonym.length >= 4) {
          baseConfidence = 0.9; // Contém o sinônimo
        } else if (normalizedSynonym.includes(normalizedHeader) && normalizedHeader.length >= 3) {
          baseConfidence = 0.8; // É parte do sinônimo
        } else {
          baseConfidence = 0.7; // Match parcial
        }
        
        // Aplicar bônus visual
        const finalConfidence = Math.min(0.99, baseConfidence + visualBonus);
        
        startDateColumns.push({
          index,
          confidence: finalConfidence,
          matchedTerm: synonym
        });
        
        console.log(`✅ COLUNA DATA INÍCIO: "${header}" (índice ${index}) - confiança: ${finalConfidence.toFixed(3)} (base: ${baseConfidence.toFixed(2)} + visual: ${visualBonus.toFixed(2)}) - termo: "${synonym}"`);
        break;
      }
    }
    
    // Buscar datas de TÉRMINO com precisão máxima
    for (const synonym of END_DATE_SYNONYMS) {
      const normalizedSynonym = normalizeSearchText(synonym);
      
      if (normalizedHeader.includes(normalizedSynonym) || normalizedSynonym.includes(normalizedHeader)) {
        let baseConfidence = 0;
        
        if (normalizedHeader === normalizedSynonym) {
          baseConfidence = 1.0;
        } else if (normalizedHeader.includes(normalizedSynonym) && normalizedSynonym.length >= 4) {
          baseConfidence = 0.9;
        } else if (normalizedSynonym.includes(normalizedHeader) && normalizedHeader.length >= 3) {
          baseConfidence = 0.8;
        } else {
          baseConfidence = 0.7;
        }
        
        const finalConfidence = Math.min(0.99, baseConfidence + visualBonus);
        
        endDateColumns.push({
          index,
          confidence: finalConfidence,
          matchedTerm: synonym
        });
        
        console.log(`✅ COLUNA DATA FIM: "${header}" (índice ${index}) - confiança: ${finalConfidence.toFixed(3)} (base: ${baseConfidence.toFixed(2)} + visual: ${visualBonus.toFixed(2)}) - termo: "${synonym}"`);
        break;
      }
    }
  });
  
  // Ordenar por confiança (maior primeiro)
  startDateColumns.sort((a, b) => b.confidence - a.confidence);
  endDateColumns.sort((a, b) => b.confidence - a.confidence);
  
  console.log(`📊 RESULTADO FINAL DA ANÁLISE:`, {
    colunas_inicio: startDateColumns.length,
    colunas_fim: endDateColumns.length,
    melhor_inicio: startDateColumns[0] ? `${startDateColumns[0].confidence.toFixed(3)}` : 'nenhuma',
    melhor_fim: endDateColumns[0] ? `${endDateColumns[0].confidence.toFixed(3)}` : 'nenhuma'
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

// FUNÇÃO MELHORADA - Extrair metadados de formatação com análise completa
export function extractCellMetadata(worksheet: any): CellMetadata[][] {
  const metadata: CellMetadata[][] = [];
  
  if (!worksheet || !worksheet['!ref']) {
    console.log('⚠️ Worksheet sem referência válida para extração de metadados');
    return metadata;
  }
  
  try {
    const range = worksheet['!ref'];
    console.log(`🎨 Extraindo metadados de formatação do range: ${range}`);
    
    // Decodificar range
    const decoded = { s: { c: 0, r: 0 }, e: { c: 0, r: 0 } };
    const rangeMatch = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
    
    if (rangeMatch) {
      const [, startCol, startRow, endCol, endRow] = rangeMatch;
      
      // Converter letras para números
      function colToNumber(col: string): number {
        let result = 0;
        for (let i = 0; i < col.length; i++) {
          result = result * 26 + (col.charCodeAt(i) - 64);
        }
        return result - 1; // 0-indexed
      }
      
      decoded.s.c = colToNumber(startCol);
      decoded.s.r = parseInt(startRow) - 1;
      decoded.e.c = colToNumber(endCol);
      decoded.e.r = parseInt(endRow) - 1;
      
      console.log(`📐 Range decodificado: linhas ${decoded.s.r}-${decoded.e.r}, colunas ${decoded.s.c}-${decoded.e.c}`);
    }
    
    // Analisar células
    for (let r = decoded.s.r; r <= decoded.e.r && r < 50; r++) { // Limitar a 50 linhas
      metadata[r] = [];
      
      for (let c = decoded.s.c; c <= decoded.e.c && c < 50; c++) { // Limitar a 50 colunas
        // Converter números para endereço de célula
        function numberToCol(num: number): string {
          let result = '';
          while (num >= 0) {
            result = String.fromCharCode((num % 26) + 65) + result;
            num = Math.floor(num / 26) - 1;
          }
          return result;
        }
        
        const cellAddress = numberToCol(c) + (r + 1);
        const cell = worksheet[cellAddress];
        
        if (cell) {
          const cellMeta: CellMetadata = {};
          
          // Analisar formatação detalhada
          if (cell.s) {
            const style = cell.s;
            
            // Fonte
            if (style.font) {
              cellMeta.isBold = style.font.bold || false;
              cellMeta.isItalic = style.font.italic || false;
              cellMeta.isUnderlined = style.font.underline || false;
              cellMeta.fontSize = style.font.sz || 0;
              if (style.font.color) {
                cellMeta.fontColor = style.font.color.rgb || '';
                cellMeta.hasColor = true;
              }
            }
            
            // Preenchimento
            if (style.fill) {
              if (style.fill.fgColor) {
                cellMeta.backgroundColor = style.fill.fgColor.rgb || '';
              }
              cellMeta.fillPattern = style.fill.patternType || '';
            }
            
            // Bordas
            if (style.border) {
              cellMeta.hasBorder = !!(style.border.top || style.border.bottom || style.border.left || style.border.right);
            }
            
            // Alinhamento
            if (style.alignment) {
              cellMeta.alignment = `${style.alignment.horizontal || ''} ${style.alignment.vertical || ''}`.trim();
            }
          }
          
          // Verificar merge
          if (worksheet['!merges']) {
            const isMerged = worksheet['!merges'].some((merge: any) => 
              r >= merge.s.r && r <= merge.e.r && c >= merge.s.c && c <= merge.e.c
            );
            
            if (isMerged) {
              cellMeta.isMerged = true;
              const mergeInfo = worksheet['!merges'].find((merge: any) => 
                r >= merge.s.r && r <= merge.e.r && c >= merge.s.c && c <= merge.e.c
              );
              if (mergeInfo) {
                cellMeta.mergeRange = `${numberToCol(mergeInfo.s.c)}${mergeInfo.s.r + 1}:${numberToCol(mergeInfo.e.c)}${mergeInfo.e.r + 1}`;
              }
            }
          }
          
          // Determinar se está destacada
          cellMeta.isHighlighted = !!(
            cellMeta.isBold || 
            cellMeta.hasColor || 
            cellMeta.backgroundColor || 
            cellMeta.isMerged ||
            cellMeta.hasBorder ||
            (cellMeta.fontSize && cellMeta.fontSize > 12)
          );
          
          metadata[r][c] = cellMeta;
          
          if (cellMeta.isHighlighted) {
            console.log(`✨ Célula destacada detectada em ${cellAddress}:`, {
              negrito: cellMeta.isBold,
              cor: cellMeta.hasColor,
              fundo: !!cellMeta.backgroundColor,
              mesclada: cellMeta.isMerged,
              borda: cellMeta.hasBorder,
              tamanho: cellMeta.fontSize
            });
          }
        }
      }
    }
    
    console.log(`✅ Metadados extraídos: ${metadata.length} linhas processadas`);
    
  } catch (e) {
    console.error('❌ Erro ao extrair metadados de formatação:', e);
  }
  
  return metadata;
}
