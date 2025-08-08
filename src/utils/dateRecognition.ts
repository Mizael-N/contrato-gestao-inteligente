
import { format, parse, isValid, isBefore, isAfter, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';

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

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

// FUNÇÃO SIMPLIFICADA - Parsing de datas com alta precisão
export function parseAdvancedDate(value: any): Date | null {
  if (!value) return null;
  
  console.log(`🔍 Analisando data: "${value}" (tipo: ${typeof value})`);
  
  // Se já é uma data válida
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }
  
  // Números (serial date do Excel)
  if (typeof value === 'number' && value > 0) {
    try {
      // Excel: Sistema 1900
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + (value >= 60 ? value - 1 : value) * 24 * 60 * 60 * 1000);
      
      if (isValid(date)) {
        const year = date.getFullYear();
        if (year >= 1900 && year <= 2100) {
          console.log(`✅ Data serial convertida: ${value} -> ${format(date, 'yyyy-MM-dd')}`);
          return date;
        }
      }
    } catch (e) {
      console.log(`❌ Erro na conversão serial: ${e}`);
    }
  }
  
  // Strings
  if (typeof value === 'string') {
    const cleanValue = value.trim();
    if (!cleanValue) return null;
    
    // Tentar cada formato
    for (const dateFormat of DATE_FORMATS) {
      try {
        const parsedDate = parse(cleanValue, dateFormat, new Date());
        if (isValid(parsedDate)) {
          let finalDate = parsedDate;
          
          // Correção de anos de 2 dígitos
          if (cleanValue.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2}$/)) {
            const currentYear = new Date().getFullYear();
            const yearTwoDigit = parsedDate.getFullYear() % 100;
            
            if (yearTwoDigit > (currentYear % 100) + 20) {
              finalDate.setFullYear(Math.floor(currentYear / 100) * 100 - 100 + yearTwoDigit);
            } else {
              finalDate.setFullYear(Math.floor(currentYear / 100) * 100 + yearTwoDigit);
            }
          }
          
          const year = finalDate.getFullYear();
          if (year >= 1900 && year <= 2100) {
            console.log(`✅ Data string convertida: "${cleanValue}" -> ${format(finalDate, 'yyyy-MM-dd')}`);
            return finalDate;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    // Último recurso: parsing nativo
    try {
      const nativeDate = new Date(cleanValue);
      if (isValid(nativeDate)) {
        const year = nativeDate.getFullYear();
        if (year >= 1900 && year <= 2100) {
          console.log(`✅ Data nativa convertida: "${cleanValue}" -> ${format(nativeDate, 'yyyy-MM-dd')}`);
          return nativeDate;
        }
      }
    } catch (e) {
      // Falhou completamente
    }
  }
  
  console.log(`❌ Falha na conversão: "${value}"`);
  return null;
}

// FUNÇÃO SIMPLIFICADA - Buscar colunas de data com menos restrições
export function findDateColumns(headers: string[]): {
  startDateColumns: { index: number; confidence: number }[];
  endDateColumns: { index: number; confidence: number }[];
} {
  const startDateColumns: { index: number; confidence: number }[] = [];
  const endDateColumns: { index: number; confidence: number }[] = [];
  
  console.log('🔍 Buscando colunas de data:', headers);
  
  headers.forEach((header, index) => {
    const normalizedHeader = normalizeSearchText(String(header || ''));
    
    // Buscar datas de início
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
      
      if (confidence > 0) {
        startDateColumns.push({ index, confidence });
        console.log(`✅ Coluna início: "${header}" (${index}) - ${confidence.toFixed(2)}`);
        break;
      }
    }
    
    // Buscar datas de fim
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
      
      if (confidence > 0) {
        endDateColumns.push({ index, confidence });
        console.log(`✅ Coluna fim: "${header}" (${index}) - ${confidence.toFixed(2)}`);
        break;
      }
    }
  });
  
  // Ordenar por confiança
  startDateColumns.sort((a, b) => b.confidence - a.confidence);
  endDateColumns.sort((a, b) => b.confidence - a.confidence);
  
  return { startDateColumns, endDateColumns };
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
