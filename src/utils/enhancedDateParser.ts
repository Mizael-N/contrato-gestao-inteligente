
import { detectDateFormat } from './dateFormatDetector';

export interface DateParseOptions {
  assume?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'auto';
  isEndColumn?: boolean;
  date1904?: boolean;
  columnStrategy?: any;
}

export function parseEnhancedDate(value: any, options: DateParseOptions = {}): Date | null {
  if (!value) return null;
  
  const { assume = 'auto', isEndColumn = false, date1904 = false, columnStrategy } = options;
  
  console.log(`🗓️ Enhanced parsing: "${value}" (${typeof value})`);
  
  // Already a valid Date
  if (value instanceof Date && !isNaN(value.getTime())) {
    console.log(`✅ Already valid date: ${formatYMD(value)}`);
    return value;
  }
  
  // Excel serial numbers
  if (typeof value === 'number' && value > 0 && value < 100000) {
    return parseExcelSerial(value, date1904);
  }
  
  // String parsing
  if (typeof value === 'string') {
    const cleanValue = value.trim();
    if (!cleanValue) return null;
    
    return parseStringDateRobust(cleanValue, assume, isEndColumn, columnStrategy);
  }
  
  // Try to convert other types to string
  try {
    const stringValue = String(value).trim();
    if (stringValue && stringValue !== 'null' && stringValue !== 'undefined') {
      return parseStringDateRobust(stringValue, assume, isEndColumn, columnStrategy);
    }
  } catch (e) {
    console.log(`❌ Could not convert to string: ${e}`);
  }
  
  console.log(`❌ Parse failed: "${value}"`);
  return null;
}

function parseExcelSerial(serial: number, date1904: boolean): Date | null {
  try {
    console.log(`📊 Excel serial: ${serial} (1904: ${date1904})`);
    
    const baseDate = date1904 ? new Date(1904, 0, 1) : new Date(1899, 11, 30);
    let adjustedSerial = serial;
    
    // Excel leap year bug adjustment
    if (!date1904 && serial >= 60) {
      adjustedSerial = serial - 1;
    }
    
    const date = new Date(baseDate.getTime() + adjustedSerial * 24 * 60 * 60 * 1000);
    
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      if (year >= 1900 && year <= 2100) {
        console.log(`✅ Excel: ${serial} → ${formatYMD(date)}`);
        return date;
      }
    }
    
    console.log(`❌ Invalid Excel result: ${serial} → ${date}`);
    return null;
  } catch (error) {
    console.log(`❌ Excel parsing error:`, error);
    return null;
  }
}

function parseStringDateRobust(
  dateStr: string, 
  assume: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'auto',
  isEndColumn: boolean,
  columnStrategy?: any
): Date | null {
  console.log(`🔤 String parsing: "${dateStr}" (assume: ${assume})`);
  
  // Remove common prefixes/suffixes
  let cleanStr = dateStr
    .replace(/^(data|dt|date)[\s:]/i, '')
    .replace(/[()]/g, '')
    .trim();
  
  // ISO format (YYYY-MM-DD, YYYY/MM/DD)
  const isoMatch = cleanStr.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = createSafeDate(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (date) {
      console.log(`✅ ISO: "${dateStr}" → ${formatYMD(date)}`);
      return date;
    }
  }
  
  // Month/Year format (MM/YYYY, MM/YY)
  const monthYearMatch = cleanStr.match(/^(\d{1,2})[-\/\.](\d{2,4})$/);
  if (monthYearMatch) {
    const [, month, year] = monthYearMatch;
    const fullYear = year.length === 2 ? expandYear(parseInt(year)) : parseInt(year);
    const day = isEndColumn ? getLastDayOfMonth(parseInt(month), fullYear) : 1;
    
    const date = createSafeDate(fullYear, parseInt(month) - 1, day);
    if (date) {
      console.log(`✅ Month/Year: "${dateStr}" → ${formatYMD(date)}`);
      return date;
    }
  }
  
  // DD/MM/YYYY or MM/DD/YYYY format
  const standardMatch = cleanStr.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})$/);
  if (standardMatch) {
    const [, first, second, year] = standardMatch;
    const fullYear = year.length === 2 ? expandYear(parseInt(year)) : parseInt(year);
    
    return parseDayMonth(first, second, fullYear, assume, columnStrategy);
  }
  
  // Try native Date parsing as last resort
  try {
    const nativeDate = new Date(cleanStr);
    if (!isNaN(nativeDate.getTime())) {
      const year = nativeDate.getFullYear();
      if (year >= 1900 && year <= 2100) {
        console.log(`✅ Native: "${dateStr}" → ${formatYMD(nativeDate)}`);
        return nativeDate;
      }
    }
  } catch (e) {
    // Silent fail
  }
  
  console.log(`❌ No pattern matched: "${dateStr}"`);
  return null;
}

function parseDayMonth(
  first: string, 
  second: string, 
  year: number, 
  assume: string,
  columnStrategy?: any
): Date | null {
  const firstNum = parseInt(first);
  const secondNum = parseInt(second);
  
  let day: number, month: number;
  
  // Use column strategy if available and reliable
  if (columnStrategy?.format && columnStrategy.confidence > 0.8) {
    if (columnStrategy.format.includes('DD/MM')) {
      day = firstNum;
      month = secondNum;
    } else if (columnStrategy.format.includes('MM/DD')) {
      day = secondNum;
      month = firstNum;
    } else {
      ({ day, month } = determineDayMonth(firstNum, secondNum, assume));
    }
  } else {
    ({ day, month } = determineDayMonth(firstNum, secondNum, assume));
  }
  
  return createSafeDate(year, month - 1, day);
}

function determineDayMonth(firstNum: number, secondNum: number, assume: string): { day: number; month: number } {
  if (assume === 'DD/MM/YYYY') {
    return { day: firstNum, month: secondNum };
  } else if (assume === 'MM/DD/YYYY') {
    return { day: secondNum, month: firstNum };
  } else { // auto
    // Unambiguous cases
    if (firstNum > 12 && secondNum <= 12) {
      return { day: firstNum, month: secondNum };
    } else if (secondNum > 12 && firstNum <= 12) {
      return { day: secondNum, month: firstNum };
    } else {
      // Ambiguous - prefer Brazilian format (DD/MM)
      return { day: firstNum, month: secondNum };
    }
  }
}

function createSafeDate(year: number, month: number, day: number): Date | null {
  // Validate ranges
  if (year < 1900 || year > 2100 || month < 0 || month > 11 || day < 1 || day > 31) {
    console.log(`❌ Invalid ranges: ${day}/${month + 1}/${year}`);
    return null;
  }
  
  try {
    const date = new Date(year, month, day);
    
    // Verify JavaScript didn't adjust the date
    if (date.getFullYear() === year && 
        date.getMonth() === month && 
        date.getDate() === day) {
      return date;
    } else {
      console.log(`❌ Date adjusted: ${day}/${month + 1}/${year} → ${date}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Date creation error:`, error);
    return null;
  }
}

function expandYear(twoDigitYear: number): number {
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
