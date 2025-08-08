
import { detectDateFormat } from './dateFormatDetector';

export interface DateParseOptions {
  assume?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'auto';
  isEndColumn?: boolean;
  date1904?: boolean;
  columnStrategy?: any;
}

// Parser de datas mais determinístico
export function parseEnhancedDate(value: any, options: DateParseOptions = {}): Date | null {
  if (!value) return null;
  
  const { assume = 'auto', isEndColumn = false, date1904 = false, columnStrategy } = options;
  
  console.log(`🗓️ Parsing enhanced date: "${value}" (type: ${typeof value})`);
  console.log(`   Options:`, { assume, isEndColumn, date1904, strategy: columnStrategy?.format });
  
  // Se já é uma data válida
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }
  
  // Números (Excel serial dates)
  if (typeof value === 'number' && value > 0) {
    return parseExcelSerial(value, date1904);
  }
  
  // Strings
  if (typeof value === 'string') {
    const cleanValue = value.trim();
    if (!cleanValue) return null;
    
    return parseStringDateEnhanced(cleanValue, assume, isEndColumn, columnStrategy);
  }
  
  console.log(`❌ Could not parse: "${value}" (type: ${typeof value})`);
  return null;
}

function parseExcelSerial(serial: number, date1904: boolean): Date | null {
  try {
    console.log(`📊 Parsing Excel serial: ${serial} (1904 system: ${date1904})`);
    
    // Base date depends on system
    const baseDate = date1904 ? new Date(1904, 0, 1) : new Date(1899, 11, 30);
    
    // Excel bug: treats 1900 as leap year, so adjust for dates >= 60 in 1900 system
    let adjustedSerial = serial;
    if (!date1904 && serial >= 60) {
      adjustedSerial = serial - 1;
    }
    
    const date = new Date(baseDate.getTime() + adjustedSerial * 24 * 60 * 60 * 1000);
    
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      if (year >= 1900 && year <= 2100) {
        console.log(`✅ Excel serial: ${serial} -> ${formatYMD(date)}`);
        return date;
      }
    }
    
    console.log(`❌ Invalid Excel serial result: ${serial} -> ${date}`);
    return null;
  } catch (error) {
    console.log(`❌ Excel serial error:`, error);
    return null;
  }
}

function parseStringDateEnhanced(
  dateStr: string, 
  assume: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'auto',
  isEndColumn: boolean,
  columnStrategy?: any
): Date | null {
  console.log(`🔤 Parsing string: "${dateStr}" with assumption: ${assume}`);
  
  // ISO format (YYYY-MM-DD or YYYY/MM/DD)
  const isoMatch = dateStr.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return createDateSafe(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Month/Year format (MM/YYYY, MM/YY)
  const monthYearMatch = dateStr.match(/^(\d{1,2})[-\/\.](\d{2,4})$/);
  if (monthYearMatch) {
    const [, month, year] = monthYearMatch;
    const fullYear = year.length === 2 ? get4DigitYear(parseInt(year)) : parseInt(year);
    
    // Para colunas de fim, usar último dia do mês
    const day = isEndColumn ? getLastDayOfMonth(parseInt(month), fullYear) : 1;
    
    return createDateSafe(fullYear, parseInt(month) - 1, day);
  }
  
  // DD/MM/YYYY or MM/DD/YYYY format
  const dateMatch = dateStr.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})$/);
  if (dateMatch) {
    const [, first, second, year] = dateMatch;
    const fullYear = year.length === 2 ? get4DigitYear(parseInt(year)) : parseInt(year);
    
    return parseDayMonthYear(first, second, fullYear, assume, columnStrategy);
  }
  
  console.log(`❌ No pattern matched for: "${dateStr}"`);
  return null;
}

function parseDayMonthYear(
  first: string, 
  second: string, 
  year: number, 
  assume: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'auto',
  columnStrategy?: any
): Date | null {
  const firstNum = parseInt(first);
  const secondNum = parseInt(second);
  
  let day: number, month: number;
  
  // Use column strategy if available
  if (columnStrategy?.format) {
    if (columnStrategy.format.includes('DD/MM')) {
      day = firstNum;
      month = secondNum;
    } else if (columnStrategy.format.includes('MM/DD')) {
      day = secondNum;
      month = firstNum;
    } else {
      // Fallback to assumption
      ({ day, month } = resolveDayMonth(firstNum, secondNum, assume));
    }
  } else {
    ({ day, month } = resolveDayMonth(firstNum, secondNum, assume));
  }
  
  // Validate ranges
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    console.log(`❌ Invalid date components: day=${day}, month=${month}, year=${year}`);
    return null;
  }
  
  return createDateSafe(year, month - 1, day);
}

function resolveDayMonth(firstNum: number, secondNum: number, assume: string): { day: number; month: number } {
  if (assume === 'DD/MM/YYYY') {
    return { day: firstNum, month: secondNum };
  } else if (assume === 'MM/DD/YYYY') {
    return { day: secondNum, month: firstNum };
  } else { // auto
    // If first > 12, it must be day
    if (firstNum > 12) {
      return { day: firstNum, month: secondNum };
    }
    // If second > 12, it must be day
    else if (secondNum > 12) {
      return { day: secondNum, month: firstNum };
    }
    // Ambiguous - prefer DD/MM for Brazilian context
    else {
      return { day: firstNum, month: secondNum };
    }
  }
}

function createDateSafe(year: number, month: number, day: number): Date | null {
  try {
    const date = new Date(year, month, day);
    
    // Validate that JavaScript didn't adjust the date
    if (date.getFullYear() === year && 
        date.getMonth() === month && 
        date.getDate() === day) {
      console.log(`✅ Date created: ${day}/${month + 1}/${year} -> ${formatYMD(date)}`);
      return date;
    } else {
      console.log(`❌ Date adjusted by JS: ${day}/${month + 1}/${year} -> ${date}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Date creation error:`, error);
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

function formatYMD(date: Date): string {
  if (!date || isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
