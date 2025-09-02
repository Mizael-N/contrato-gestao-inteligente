
export interface DateParseOptions {
  assume?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'auto';
  isEndColumn?: boolean;
  date1904?: boolean;
  columnStrategy?: any;
}

export function parseEnhancedDate(value: any, options: DateParseOptions = {}): Date | null {
  if (!value) return null;
  
  const { assume = 'auto', isEndColumn = false, date1904 = false, columnStrategy } = options;
  
  console.log(`🗓️ Tentando analisar data: "${value}" (tipo: ${typeof value})`);
  
  // Se já é uma Date válida
  if (value instanceof Date && !isNaN(value.getTime())) {
    const year = value.getFullYear();
    if (year >= 1900 && year <= 2100) {
      console.log(`✅ Data já válida: ${formatYMD(value)}`);
      return value;
    } else {
      console.log(`❌ Ano inválido: ${year}`);
      return null;
    }
  }
  
  // Números seriais do Excel - SÓ se for realmente uma coluna de data identificada
  if (typeof value === 'number' && columnStrategy && 
      columnStrategy.confidence > 0.8 && 
      value > 25569 && value < 73050) { // Entre 1970 e 2100 aprox.
    console.log(`🔍 Tentativa de parsing serial Excel: ${value} (coluna com confiança ${columnStrategy.confidence})`);
    return parseExcelSerial(value, date1904);
  }
  
  // Parsing de strings
  if (typeof value === 'string') {
    const cleanValue = value.trim();
    if (!cleanValue) return null;
    
    return parseStringDateStrict(cleanValue, assume, isEndColumn, columnStrategy);
  }
  
  // NÃO tentar converter outros tipos - ser rigoroso
  console.log(`❌ Tipo não suportado para data: ${typeof value} - valor: ${value}`);
  return null;
}

function parseExcelSerial(serial: number, date1904: boolean): Date | null {
  try {
    console.log(`📊 Número serial Excel: ${serial} (sistema 1904: ${date1904})`);
    
    const baseDate = date1904 ? new Date(1904, 0, 1) : new Date(1899, 11, 30);
    let adjustedSerial = serial;
    
    // Ajuste para bug do ano bissexto do Excel
    if (!date1904 && serial >= 60) {
      adjustedSerial = serial - 1;
    }
    
    const date = new Date(baseDate.getTime() + adjustedSerial * 24 * 60 * 60 * 1000);
    
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      if (year >= 1900 && year <= 2100) {
        console.log(`✅ Serial Excel convertido: ${serial} → ${formatYMD(date)}`);
        return date;
      } else {
        console.log(`❌ Ano inválido do serial: ${year}`);
      }
    }
    
    console.log(`❌ Resultado inválido do serial: ${serial} → ${date}`);
    return null;
  } catch (error) {
    console.log(`❌ Erro no parsing serial Excel:`, error);
    return null;
  }
}

function parseStringDateStrict(
  dateStr: string, 
  assume: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'auto', 
  isEndColumn: boolean,
  columnStrategy?: any
): Date | null {
  console.log(`🔤 Parsing rigoroso de string: "${dateStr}" (assumir: ${assume})`);
  
  // Remover prefixos/sufixos comuns
  let cleanStr = dateStr
    .replace(/^(data|dt|date)[\s:]/i, '')
    .replace(/[()]/g, '')
    .trim();
  
  // Formato ISO (YYYY-MM-DD, YYYY/MM/DD) - mais confiável
  const isoMatch = cleanStr.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = createSafeDate(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (date) {
      console.log(`✅ Formato ISO: "${dateStr}" → ${formatYMD(date)}`);
      return date;
    }
  }
  
  // Formato Mês/Ano (MM/YYYY, MM/YY) - SÓ se estratégia da coluna suporta
  const monthYearMatch = cleanStr.match(/^(\d{1,2})[-\/\.](\d{2,4})$/);
  if (monthYearMatch && columnStrategy?.format?.includes('MM/YYYY')) {
    const [, month, year] = monthYearMatch;
    const fullYear = year.length === 2 ? expandYear(parseInt(year)) : parseInt(year);
    
    // Para colunas de fim, assumir último dia do mês; para início, primeiro dia
    const day = isEndColumn ? getLastDayOfMonth(parseInt(month), fullYear) : 1;
    
    const date = createSafeDate(fullYear, parseInt(month) - 1, day);
    if (date) {
      console.log(`✅ Mês/Ano: "${dateStr}" → ${formatYMD(date)} (coluna fim: ${isEndColumn})`);
      return date;
    }
  }
  
  // Formato DD/MM/YYYY ou MM/DD/YYYY
  const standardMatch = cleanStr.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})$/);
  if (standardMatch) {
    const [, first, second, year] = standardMatch;
    const fullYear = year.length === 2 ? expandYear(parseInt(year)) : parseInt(year);
    
    return parseDayMonthStrict(first, second, fullYear, assume, columnStrategy);
  }
  
  // NÃO usar parsing nativo como fallback - ser rigoroso
  console.log(`❌ Nenhum padrão correspondeu: "${dateStr}"`);
  return null;
}

function parseDayMonthStrict(
  first: string, 
  second: string, 
  year: number, 
  assume: string,
  columnStrategy?: any
): Date | null {
  const firstNum = parseInt(first);
  const secondNum = parseInt(second);
  
  let day: number, month: number;
  
  // Usar estratégia da coluna se disponível e confiável
  if (columnStrategy?.format && columnStrategy.confidence > 0.7) {
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
    // Casos não ambíguos
    if (firstNum > 12 && secondNum <= 12) {
      return { day: firstNum, month: secondNum };
    } else if (secondNum > 12 && firstNum <= 12) {
      return { day: secondNum, month: firstNum };
    } else {
      // Ambíguo - preferir formato brasileiro (DD/MM)
      return { day: firstNum, month: secondNum };
    }
  }
}

function createSafeDate(year: number, month: number, day: number): Date | null {
  // Validar intervalos
  if (year < 1900 || year > 2100 || month < 0 || month > 11 || day < 1 || day > 31) {
    console.log(`❌ Intervalos inválidos: ${day}/${month + 1}/${year}`);
    return null;
  }
  
  try {
    const date = new Date(year, month, day);
    
    // Verificar que o JavaScript não ajustou a data
    if (date.getFullYear() === year && 
        date.getMonth() === month && 
        date.getDate() === day) {
      return date;
    } else {
      console.log(`❌ Data ajustada pelo JS: ${day}/${month + 1}/${year} → ${date}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Erro na criação da data:`, error);
    return null;
  }
}

function expandYear(twoDigitYear: number): number {
  const currentYear = new Date().getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  const currentTwoDigit = currentYear % 100;
  
  // Se o ano está mais de 20 anos no futuro, assumir século anterior
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
