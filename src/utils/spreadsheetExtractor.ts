import { Contract } from '@/types/contract';

// Mapas de correspondência para identificar colunas
const FIELD_MAPPINGS = {
  numero: ['numero', 'número', 'contrato', 'processo', 'num', 'nº', 'number', 'código', 'codigo'],
  objeto: ['objeto', 'descrição', 'descricao', 'servico', 'serviço', 'description', 'item', 'especificação', 'especificacao'],
  contratante: ['contratante', 'orgao', 'órgão', 'cliente', 'solicitante', 'prefeitura', 'municipio', 'município', 'government', 'secretaria'],
  contratada: ['contratada', 'empresa', 'fornecedor', 'prestador', 'supplier', 'cnpj', 'razao social', 'razão social'],
  valor: ['valor', 'preco', 'preço', 'price', 'amount', 'total', 'custo', 'montante', 'quantia', 'valor total', 'valor global', 'valor estimado', 'valor contratado', 'preço final', 'valor final'],
  dataAssinatura: ['data', 'assinatura', 'inicio', 'início', 'date', 'signed', 'data inicio', 'data início', 'data assinatura', 'data contrato'],
  prazoExecucao: ['prazo', 'duracao', 'duração', 'meses', 'dias', 'duration', 'vigencia', 'vigência', 'tempo', 'período', 'periodo'],
  modalidade: ['modalidade', 'tipo', 'licitacao', 'licitação', 'modality', 'forma', 'processo', 'categoria'],
  status: ['status', 'situacao', 'situação', 'estado', 'state', 'condição', 'condicao'],
  fiscal: ['fiscal', 'responsavel', 'responsável', 'gestor', 'manager', 'responsável técnico', 'responsavel tecnico'],
  garantia: ['garantia', 'caucao', 'caução', 'seguro', 'guarantee', 'fiança', 'aval']
};

const STATUS_MAPPINGS: Record<string, 'vigente' | 'suspenso' | 'encerrado' | 'rescindido'> = {
  'vigente': 'vigente',
  'ativo': 'vigente',
  'em andamento': 'vigente',
  'suspenso': 'suspenso',
  'pausado': 'suspenso',
  'encerrado': 'encerrado',
  'finalizado': 'encerrado',
  'concluído': 'encerrado',
  'rescindido': 'rescindido',
  'cancelado': 'rescindido'
};

const MODALIDADE_MAPPINGS: Record<string, 'pregao' | 'concorrencia' | 'tomada_precos' | 'convite' | 'concurso' | 'leilao'> = {
  'pregão': 'pregao',
  'pregao': 'pregao',
  'concorrência': 'concorrencia',
  'concorrencia': 'concorrencia',
  'tomada de preços': 'tomada_precos',
  'tomada de precos': 'tomada_precos',
  'convite': 'convite',
  'concurso': 'concurso',
  'leilão': 'leilao',
  'leilao': 'leilao'
};

function normalizeValue(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).toLowerCase().trim();
}

function findColumnIndex(headers: string[], fieldMappings: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const header = normalizeValue(headers[i]);
    if (fieldMappings.some(mapping => header.includes(mapping))) {
      return i;
    }
  }
  return -1;
}

function parseDate(dateValue: any): string {
  if (!dateValue) return new Date().toISOString().split('T')[0];
  
  // Se já está no formato ISO
  if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateValue;
  }
  
  // Tentar converter diferentes formatos
  const date = new Date(dateValue);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  // Formato brasileiro DD/MM/YYYY
  if (typeof dateValue === 'string' && dateValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const [day, month, year] = dateValue.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return new Date().toISOString().split('T')[0];
}

function parseValue(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const stringValue = String(value).trim();
  console.log(`💰 Parsing valor: "${stringValue}"`);
  
  // Detectar abreviações e converter
  let multiplier = 1;
  const lowerValue = stringValue.toLowerCase();
  
  if (lowerValue.includes('mil') || lowerValue.includes('k')) {
    multiplier = 1000;
  } else if (lowerValue.includes('milhão') || lowerValue.includes('milhao') || lowerValue.includes('mi') || lowerValue.includes('m')) {
    multiplier = 1000000;
  } else if (lowerValue.includes('bilhão') || lowerValue.includes('bilhao') || lowerValue.includes('bi') || lowerValue.includes('b')) {
    multiplier = 1000000000;
  }
  
  // Remover texto e símbolos, manter apenas números, vírgulas e pontos
  let cleanValue = stringValue
    .replace(/[^\d,.-]/g, '')
    .trim();
  
  if (!cleanValue) return 0;
  
  // Detectar formato brasileiro vs internacional
  // Formato brasileiro: 1.234.567,89 ou 1234567,89
  // Formato internacional: 1,234,567.89 ou 1234567.89
  
  const commaCount = (cleanValue.match(/,/g) || []).length;
  const dotCount = (cleanValue.match(/\./g) || []).length;
  const lastCommaIndex = cleanValue.lastIndexOf(',');
  const lastDotIndex = cleanValue.lastIndexOf('.');
  
  // Se tem vírgula e ponto, determinar qual é decimal
  if (commaCount > 0 && dotCount > 0) {
    if (lastCommaIndex > lastDotIndex) {
      // Vírgula está depois do ponto: formato brasileiro (1.234.567,89)
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    } else {
      // Ponto está depois da vírgula: formato internacional (1,234,567.89)
      cleanValue = cleanValue.replace(/,/g, '');
    }
  } else if (commaCount > 0) {
    // Só vírgula: verificar se é separador decimal ou de milhares
    const afterComma = cleanValue.substring(lastCommaIndex + 1);
    if (afterComma.length <= 2 && commaCount === 1) {
      // Provavelmente decimal brasileiro
      cleanValue = cleanValue.replace(',', '.');
    } else {
      // Provavelmente separador de milhares
      cleanValue = cleanValue.replace(/,/g, '');
    }
  } else if (dotCount > 1) {
    // Múltiplos pontos: formato brasileiro de milhares (1.234.567)
    cleanValue = cleanValue.replace(/\./g, '');
  }
  // Se só tem um ponto, manter como está (pode ser decimal internacional)
  
  const parsed = parseFloat(cleanValue) * multiplier;
  const result = isNaN(parsed) ? 0 : parsed;
  
  console.log(`💰 Valor parseado: "${stringValue}" -> ${result}`);
  return result;
}

function parseStatus(status: any): 'vigente' | 'suspenso' | 'encerrado' | 'rescindido' {
  const normalized = normalizeValue(status);
  
  for (const [key, value] of Object.entries(STATUS_MAPPINGS)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return 'vigente';
}

function parseModalidade(modalidade: any): 'pregao' | 'concorrencia' | 'tomada_precos' | 'convite' | 'concurso' | 'leilao' {
  const normalized = normalizeValue(modalidade);
  
  for (const [key, value] of Object.entries(MODALIDADE_MAPPINGS)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return 'pregao';
}

export function extractContractFromSpreadsheetData(data: any[][], sheetName: string): Partial<Contract>[] {
  if (data.length < 2) {
    console.log(`⚠️ Aba "${sheetName}" possui poucos dados (${data.length} linhas)`);
    return [];
  }
  
  // Primeira linha como cabeçalho
  const headers = data[0].map(h => String(h || ''));
  console.log(`🔍 Cabeçalhos da aba "${sheetName}":`, headers);
  
  // Encontrar índices das colunas
  const columnIndexes = {
    numero: findColumnIndex(headers, FIELD_MAPPINGS.numero),
    objeto: findColumnIndex(headers, FIELD_MAPPINGS.objeto),
    contratante: findColumnIndex(headers, FIELD_MAPPINGS.contratante),
    contratada: findColumnIndex(headers, FIELD_MAPPINGS.contratada),
    valor: findColumnIndex(headers, FIELD_MAPPINGS.valor),
    dataAssinatura: findColumnIndex(headers, FIELD_MAPPINGS.dataAssinatura),
    prazoExecucao: findColumnIndex(headers, FIELD_MAPPINGS.prazoExecucao),
    modalidade: findColumnIndex(headers, FIELD_MAPPINGS.modalidade),
    status: findColumnIndex(headers, FIELD_MAPPINGS.status),
    fiscal: findColumnIndex(headers, FIELD_MAPPINGS.fiscal),
    garantia: findColumnIndex(headers, FIELD_MAPPINGS.garantia)
  };
  
  console.log(`📊 Mapeamento de colunas para aba "${sheetName}":`, columnIndexes);
  
  const contracts: Partial<Contract>[] = [];
  
  // Processar linhas de dados (pular cabeçalho)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Verificar se a linha tem dados suficientes
    if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) {
      continue;
    }
    
    // Extrair dados da linha
    const numero = columnIndexes.numero >= 0 ? String(row[columnIndexes.numero] || '') : `${sheetName}-${i}`;
    const objeto = columnIndexes.objeto >= 0 ? String(row[columnIndexes.objeto] || '') : 'Objeto não identificado';
    
    // Só processar se tiver pelo menos número ou objeto
    if (!numero.trim() && !objeto.trim()) {
      continue;
    }
    
    const contract: Partial<Contract> = {
      numero: numero || `${sheetName}-LINHA-${i}`,
      objeto: objeto || 'Objeto a ser definido com base nos dados da planilha',
      contratante: columnIndexes.contratante >= 0 ? String(row[columnIndexes.contratante] || 'Órgão Público') : 'Órgão Público',
      contratada: columnIndexes.contratada >= 0 ? String(row[columnIndexes.contratada] || 'Empresa a definir') : 'Empresa a definir',
      valor: columnIndexes.valor >= 0 ? parseValue(row[columnIndexes.valor]) : 0,
      dataAssinatura: columnIndexes.dataAssinatura >= 0 ? parseDate(row[columnIndexes.dataAssinatura]) : new Date().toISOString().split('T')[0],
      prazoExecucao: columnIndexes.prazoExecucao >= 0 ? parseValue(row[columnIndexes.prazoExecucao]) || 12 : 12,
      prazoUnidade: 'meses',
      modalidade: columnIndexes.modalidade >= 0 ? parseModalidade(row[columnIndexes.modalidade]) : 'pregao',
      status: columnIndexes.status >= 0 ? parseStatus(row[columnIndexes.status]) : 'vigente',
      observacoes: `Extraído da aba "${sheetName}" - linha ${i}. Revisar dados conforme necessário.`,
      fiscais: {
        titular: columnIndexes.fiscal >= 0 ? String(row[columnIndexes.fiscal] || 'A definir') : 'A definir',
        substituto: 'A definir'
      },
      garantia: {
        tipo: 'sem_garantia',
        valor: 0,
        dataVencimento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      aditivos: [],
      pagamentos: [],
      documentos: []
    };
    
    contracts.push(contract);
  }
  
  console.log(`✅ Extraídos ${contracts.length} contratos da aba "${sheetName}"`);
  return contracts;
}
