import { format, parse, isValid, isBefore, isAfter, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';
import { detectDateFormat, toYMD } from './dateFormatDetector';

// Sinônimos de data de início mais focados e eficientes
export const START_DATE_SYNONYMS = [
  // Português - termos mais comuns primeiro
  'inicio', 'início', 'data inicio', 'data início', 'data inicial',
  'assinatura', 'data assinatura', 'vigencia', 'vigência', 'inicio vigencia', 'início vigência',
  'execução', 'execucao', 'inicio execução', 'início execução',
  'começo', 'comeco', 'começar', 'comecar', 'iniciado',
  'dt inicio', 'dt início', 'dt inicial', 'dt assinatura',
  
  // Inglês essencial
  'start', 'start date', 'begin', 'effective date', 'signature'
];

// Sinônimos de data de fim mais focados e eficientes
export const END_DATE_SYNONYMS = [
  // Português - termos mais comuns primeiro
  'fim', 'final', 'término', 'termino', 'vencimento', 'vence',
  'data final', 'data limite', 'prazo', 'prazo final',
  'fim vigencia', 'fim vigência', 'final vigencia', 'final vigência',
  'conclusão', 'conclusao', 'encerramento', 'entrega',
  'dt fim', 'dt final', 'dt término', 'dt vencimento',
  
  // Inglês essencial
  'end', 'end date', 'final', 'finish', 'deadline', 'due date'
];

// Formatos de data essenciais
export const DATE_FORMATS = [
  // Brasileiro
  'dd/MM/yyyy', 'dd/MM/yy', 'd/M/yyyy', 'd/M/yy',
  'dd-MM-yyyy', 'dd-MM-yy', 'd-M-yyyy', 'd-M-yy',
  'dd.MM.yyyy', 'dd.MM.yy', 'd.M.yyyy', 'd.M.yy',
  
  // ISO
  'yyyy-MM-dd', 'yyyy/MM/dd',
  
  // Americano
  'MM/dd/yyyy', 'MM/dd/yy', 'M/d/yyyy', 'M/d/yy'
];

// Enhanced date parsing with strategy detection
export function parseAdvancedDate(
  value: any, 
  options: {
    assume?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'auto';
    isEndColumn?: boolean;
    date1904?: boolean;
  } = {}
): Date | null {
  if (!value) return null;
  
  const { assume = 'auto', isEndColumn = false, date1904 = false } = options;
  
  console.log(`🔍 Parsing date: "${value}" (type: ${typeof value}) with options:`, options);
  
  // If already a valid Date
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }
  
  // Excel serial dates (numbers)
  if (typeof value === 'number' && value > 0) {
    try {
      const baseDate = date1904 ? new Date(1904, 0, 1) : new Date(1899, 11, 30);
      const adjustedValue = date1904 ? value : (value >= 60 ? value - 1 : value);
      const date = new Date(baseDate.getTime() + adjustedValue * 24 * 60 * 60 * 1000);
      
      if (isValid(date)) {
        const year = date.getFullYear();
        if (year >= 1900 && year <= 2100) {
          console.log(`✅ Excel serial converted: ${value} -> ${toYMD(date)}`);
          return date;
        }
      }
    } catch (e) {
      console.log(`❌ Excel serial error: ${e}`);
    }
  }
  
  // String parsing
  if (typeof value === 'string') {
    const cleanValue = value.trim();
    if (!cleanValue) return null;
    
    return parseStringDate(cleanValue, assume, isEndColumn);
  }
  
  console.log(`❌ Could not parse: "${value}"`);
  return null;
}

function parseStringDate(
  dateStr: string, 
  assume: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'auto', 
  isEndColumn: boolean
): Date | null {
  console.log(`🔤 Parsing string date: "${dateStr}" with assumption: ${assume}`);
  
  // ISO format (YYYY-MM-DD)
  if (dateStr.match(/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/)) {
    try {
      const date = parse(dateStr, 'yyyy-MM-dd', new Date());
      if (isValid(date)) {
        console.log(`✅ ISO format: "${dateStr}" -> ${toYMD(date)}`);
        return date;
      }
    } catch (e) {
      // Try with slashes
      try {
        const date = parse(dateStr, 'yyyy/MM/dd', new Date());
        if (isValid(date)) {
          console.log(`✅ ISO format with slashes: "${dateStr}" -> ${toYMD(date)}`);
          return date;
        }
      } catch (e2) {
        console.log(`❌ ISO format failed: ${e2}`);
      }
    }
  }
  
  // Month/Year format (MM/YYYY, MM/YY)
  const monthYearMatch = dateStr.match(/^(\d{1,2})[-\/\.](\d{2,4})$/);
  if (monthYearMatch) {
    const [, month, year] = monthYearMatch;
    const fullYear = year.length === 2 ? get4DigitYear(parseInt(year)) : parseInt(year);
    
    // For end columns, assume last day of month
    const day = isEndColumn ? getLastDayOfMonth(parseInt(month), fullYear) : 1;
    
    try {
      const date = new Date(fullYear, parseInt(month) - 1, day);
      if (isValid(date)) {
        console.log(`✅ Month/Year: "${dateStr}" -> ${toYMD(date)} (end column: ${isEndColumn})`);
        return date;
      }
    } catch (e) {
      console.log(`❌ Month/Year error: ${e}`);
    }
  }
  
  // DD/MM/YYYY or MM/DD/YYYY format
  const dateMatch = dateStr.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})$/);
  if (dateMatch) {
    const [, first, second, year] = dateMatch;
    const fullYear = year.length === 2 ? get4DigitYear(parseInt(year)) : parseInt(year);
    
    return parseDayMonthDate(first, second, fullYear, assume);
  }
  
  // Last resort: try native Date parsing
  try {
    const nativeDate = new Date(dateStr);
    if (isValid(nativeDate)) {
      const year = nativeDate.getFullYear();
      if (year >= 1900 && year <= 2100) {
        console.log(`✅ Native parsing: "${dateStr}" -> ${toYMD(nativeDate)}`);
        return nativeDate;
      }
    }
  } catch (e) {
    console.log(`❌ Native parsing failed: ${e}`);
  }
  
  return null;
}

function parseDayMonthDate(
  first: string, 
  second: string, 
  year: number, 
  assume: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'auto'
): Date | null {
  const firstNum = parseInt(first);
  const secondNum = parseInt(second);
  
  // Determine format
  let day: number, month: number;
  
  if (assume === 'DD/MM/YYYY') {
    day = firstNum;
    month = secondNum;
  } else if (assume === 'MM/DD/YYYY') {
    day = secondNum;
    month = firstNum;
  } else { // auto
    // If first > 12, it must be day
    if (firstNum > 12) {
      day = firstNum;
      month = secondNum;
    }
    // If second > 12, it must be day
    else if (secondNum > 12) {
      day = secondNum;
      month = firstNum;
    }
    // Ambiguous - prefer DD/MM for Brazilian context
    else {
      day = firstNum;
      month = secondNum;
    }
  }
  
  // Validate ranges
  if (month < 1 || month > 12) {
    console.log(`❌ Invalid month: ${month}`);
    return null;
  }
  
  if (day < 1 || day > 31) {
    console.log(`❌ Invalid day: ${day}`);
    return null;
  }
  
  try {
    const date = new Date(year, month - 1, day);
    
    // Validate that the date is actually valid (handles cases like Feb 31)
    if (date.getFullYear() === year && 
        date.getMonth() === month - 1 && 
        date.getDate() === day) {
      console.log(`✅ DD/MM format: ${day}/${month}/${year} -> ${toYMD(date)}`);
      return date;
    } else {
      console.log(`❌ Invalid date: ${day}/${month}/${year}`);
      return null;
    }
  } catch (e) {
    console.log(`❌ Date creation error: ${e}`);
    return null;
  }
}

function get4DigitYear(twoDigitYear: number): number {
  const currentYear = new Date().getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  const currentTwoDigit = currentYear % 100;
  
  // If year is more than 20 years in the future, assume previous century
  if (twoDigitYear > currentTwoDigit + 20) {
    return currentCentury - 100 + twoDigitYear;
  } else {
    return currentCentury + twoDigitYear;
  }
}

function getLastDayOfMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

// Enhanced column detection with format analysis
export function findDateColumns(headers: string[], data: any[][] = []): {
  startDateColumns: { index: number; confidence: number; strategy: any }[];
  endDateColumns: { index: number; confidence: number; strategy: any }[];
} {
  const startDateColumns: { index: number; confidence: number; strategy: any }[] = [];
  const endDateColumns: { index: number; confidence: number; strategy: any }[] = [];
  
  console.log('🔍 Enhanced date column detection:', headers);
  
  headers.forEach((header, index) => {
    const normalizedHeader = normalizeSearchText(String(header || ''));
    
    // Get column data for format analysis
    const columnData = data.slice(1).map(row => row[index]).filter(v => v != null);
    const strategy = detectDateFormat(columnData);
    
    // Check for start date patterns
    for (const synonym of START_DATE_SYNONYMS) {
      const normalizedSynonym = normalizeSearchText(synonym);
      
      let confidence = 0;
      if (normalizedHeader === normalizedSynonym) {
        confidence = 0.95;
      } else if (normalizedHeader.includes(normalizedSynonym)) {
        confidence = 0.85;
      } else if (normalizedSynonym.includes(normalizedHeader) && normalizedHeader.length >= 3) {
        confidence = 0.75;
      }
      
      // Boost confidence if data looks like dates
      if (confidence > 0 && strategy.confidence > 0.5) {
        confidence = Math.min(0.98, confidence + 0.1);
      }
      
      if (confidence > 0) {
        startDateColumns.push({ index, confidence, strategy });
        console.log(`✅ Start column: "${header}" (${index}) - ${confidence.toFixed(2)} - Format: ${strategy.format}`);
        break;
      }
    }
    
    // Check for end date patterns
    for (const synonym of END_DATE_SYNONYMS) {
      const normalizedSynonym = normalizeSearchText(synonym);
      
      let confidence = 0;
      if (normalizedHeader === normalizedSynonym) {
        confidence = 0.95;
      } else if (normalizedHeader.includes(normalizedSynonym)) {
        confidence = 0.85;
      } else if (normalizedSynonym.includes(normalizedHeader) && normalizedHeader.length >= 3) {
        confidence = 0.75;
      }
      
      // Boost confidence if data looks like dates
      if (confidence > 0 && strategy.confidence > 0.5) {
        confidence = Math.min(0.98, confidence + 0.1);
      }
      
      if (confidence > 0) {
        endDateColumns.push({ index, confidence, strategy });
        console.log(`✅ End column: "${header}" (${index}) - ${confidence.toFixed(2)} - Format: ${strategy.format}`);
        break;
      }
    }
  });
  
  // Sort by confidence
  startDateColumns.sort((a, b) => b.confidence - a.confidence);
  endDateColumns.sort((a, b) => b.confidence - a.confidence);
  
  return { startDateColumns, endDateColumns };
}

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

// Função para calcular prazo entre duas datas
export function calculateContractPeriod(startDate: Date, endDate: Date): { 
  prazo: number; 
  unidade: 'dias' | 'meses' | 'anos';
} {
  const totalDays = differenceInDays(endDate, startDate);
  
  if (totalDays <= 90) {
    return { prazo: totalDays, unidade: 'dias' };
  } else if (totalDays <= 730) {
    const months = differenceInMonths(endDate, startDate);
    return { prazo: months, unidade: 'meses' };
  } else {
    const years = differenceInYears(endDate, startDate);
    return { prazo: years > 0 ? years : 1, unidade: 'anos' };
  }
}

// Função para validar consistência de datas
export function validateDateConsistency(startDate: Date | null, endDate: Date | null): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  if (!startDate && !endDate) {
    warnings.push('Nenhuma data encontrada');
    return { isValid: false, warnings };
  }
  
  if (!startDate) {
    warnings.push('Data de início não encontrada');
  }
  
  if (!endDate) {
    warnings.push('Data de término não encontrada');
  }
  
  if (startDate && endDate && isAfter(startDate, endDate)) {
    warnings.push('Data de início é posterior à data de término');
    return { isValid: false, warnings };
  }
  
  return { isValid: true, warnings };
}
