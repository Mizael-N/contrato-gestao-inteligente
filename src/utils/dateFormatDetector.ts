
// Focused utility for detecting date formats and strategies
export interface DateFormatStrategy {
  format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'MM/YYYY' | 'DD/MM/YY' | 'MM/DD/YY' | 'EXCEL_SERIAL';
  confidence: number;
  samples: any[];
}

export function detectDateFormat(values: any[]): DateFormatStrategy {
  const nonEmptyValues = values.filter(v => 
    v !== null && 
    v !== undefined && 
    String(v).trim() !== ''
  ).slice(0, 10); // Analyze first 10 non-empty values

  console.log('🔍 Detectando formato de data para valores:', nonEmptyValues);

  if (nonEmptyValues.length === 0) {
    return { format: 'DD/MM/YYYY', confidence: 0, samples: [] };
  }

  // Check for Excel serial dates (numbers > 1 and < 100000)
  const serialDates = nonEmptyValues.filter(v => 
    typeof v === 'number' && v > 1 && v < 100000
  );

  if (serialDates.length > nonEmptyValues.length * 0.5) {
    console.log('✅ Formato detectado: EXCEL_SERIAL');
    return { format: 'EXCEL_SERIAL', confidence: 0.9, samples: serialDates };
  }

  // Analyze string patterns
  const stringValues = nonEmptyValues
    .map(v => String(v).trim())
    .filter(s => s.length > 0);

  if (stringValues.length === 0) {
    return { format: 'DD/MM/YYYY', confidence: 0, samples: [] };
  }

  // Pattern analysis
  let ddmmPatternCount = 0;
  let mmddPatternCount = 0;
  let isoPatternCount = 0;
  let monthYearCount = 0;
  let twoDigitYearCount = 0;

  for (const value of stringValues) {
    // ISO format YYYY-MM-DD
    if (value.match(/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/)) {
      isoPatternCount++;
      continue;
    }

    // Month/Year format (MM/YYYY or MM/YY)
    if (value.match(/^\d{1,2}[-\/]\d{4}$/) || value.match(/^\d{1,2}[-\/]\d{2}$/)) {
      monthYearCount++;
      continue;
    }

    // DD/MM/YYYY or MM/DD/YYYY pattern
    const match = value.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})$/);
    if (match) {
      const [, first, second, year] = match;
      const firstNum = parseInt(first);
      const secondNum = parseInt(second);

      if (year.length === 2) {
        twoDigitYearCount++;
      }

      // If first part > 12, it must be day (DD/MM format)
      if (firstNum > 12) {
        ddmmPatternCount++;
      }
      // If second part > 12, it must be day (MM/DD format)  
      else if (secondNum > 12) {
        mmddPatternCount++;
      }
      // Ambiguous case - use other heuristics
      else {
        // In Brazil, DD/MM is more common
        ddmmPatternCount += 0.7;
        mmddPatternCount += 0.3;
      }
    }
  }

  console.log('📊 Análise de padrões:', {
    iso: isoPatternCount,
    ddmm: ddmmPatternCount,
    mmdd: mmddPatternCount,
    monthYear: monthYearCount,
    twoDigitYear: twoDigitYearCount
  });

  // Determine best format
  if (isoPatternCount > stringValues.length * 0.5) {
    return { format: 'YYYY-MM-DD', confidence: 0.95, samples: stringValues };
  }

  if (monthYearCount > stringValues.length * 0.5) {
    return { format: 'MM/YYYY', confidence: 0.9, samples: stringValues };
  }

  if (twoDigitYearCount > stringValues.length * 0.7) {
    if (ddmmPatternCount >= mmddPatternCount) {
      return { format: 'DD/MM/YY', confidence: 0.85, samples: stringValues };
    } else {
      return { format: 'MM/DD/YY', confidence: 0.85, samples: stringValues };
    }
  }

  // Four-digit years
  if (ddmmPatternCount >= mmddPatternCount) {
    return { format: 'DD/MM/YYYY', confidence: 0.8, samples: stringValues };
  } else {
    return { format: 'MM/DD/YYYY', confidence: 0.8, samples: stringValues };
  }
}

export function toYMD(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
