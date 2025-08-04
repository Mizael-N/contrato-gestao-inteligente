
import { Contract } from '@/types/contract';

// Mapas de correspondência melhorados para identificar colunas
const FIELD_MAPPINGS = {
  numero: ['numero', 'número', 'contrato', 'processo', 'num', 'nº', 'number', 'código', 'codigo', 'id', 'identificador'],
  objeto: ['objeto', 'descrição', 'descricao', 'servico', 'serviço', 'description', 'item', 'especificação', 'especificacao', 'finalidade', 'escopo'],
  contratante: ['contratante', 'orgao', 'órgão', 'cliente', 'solicitante', 'prefeitura', 'municipio', 'município', 'government', 'secretaria', 'unidade'],
  contratada: ['contratada', 'empresa', 'fornecedor', 'prestador', 'supplier', 'cnpj', 'razao social', 'razão social', 'licitante', 'vencedora'],
  valor: ['valor', 'preco', 'preço', 'price', 'amount', 'total', 'custo', 'montante', 'quantia', 'valor total', 'valor global', 'valor estimado', 'valor contratado', 'preço final', 'valor final', 'r$', 'reais'],
  dataAssinatura: ['data assinatura', 'data contrato', 'assinatura', 'celebração', 'celebracao', 'data celebração', 'firmado', 'signed'],
  dataInicio: ['data inicio', 'data início', 'inicio vigencia', 'início vigência', 'vigencia inicio', 'vigência início', 'data inicial', 'start', 'início execução', 'inicio execucao', 'começo vigência', 'comeco vigencia', 'eficácia', 'eficacia'],
  dataTermino: ['data fim', 'data final', 'data termino', 'data término', 'fim vigencia', 'fim vigência', 'vigencia fim', 'vigência fim', 'final', 'end', 'término execução', 'termino execucao', 'vencimento', 'expira', 'validade'],
  prazoExecucao: ['prazo', 'duracao', 'duração', 'meses', 'dias', 'duration', 'vigencia', 'vigência', 'tempo', 'período', 'periodo', 'tempo execução', 'tempo execucao', 'prazo execução', 'prazo execucao'],
  modalidade: ['modalidade', 'tipo', 'licitacao', 'licitação', 'modality', 'forma', 'processo', 'categoria', 'tipo licitacao', 'tipo licitação'],
  status: ['status', 'situacao', 'situação', 'estado', 'state', 'condição', 'condicao', 'situação atual', 'situacao atual'],
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
  
  console.log(`📅 Parsing data: "${dateValue}" (tipo: ${typeof dateValue})`);
  
  // Se já está no formato ISO
  if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
    console.log(`📅 Data já em formato ISO: ${dateValue}`);
    return dateValue;
  }
  
  // Se é um número (serial date do Excel)
  if (typeof dateValue === 'number') {
    // Excel serial date - 1 de janeiro de 1900 é 1
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
    if (!isNaN(date.getTime())) {
      const result = date.toISOString().split('T')[0];
      console.log(`📅 Data convertida do Excel serial: ${dateValue} -> ${result}`);
      return result;
    }
  }
  
  // Formato brasileiro DD/MM/YYYY ou DD/MM/YY
  if (typeof dateValue === 'string') {
    const dateParts = dateValue.trim().replace(/\s+/g, '').match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
    if (dateParts) {
      let [, day, month, year] = dateParts;
      
      // Se ano tem 2 dígitos, assumir 20XX
      if (year.length === 2) {
        year = '20' + year;
      }
      
      const result = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log(`📅 Data convertida do formato brasileiro: ${dateValue} -> ${result}`);
      return result;
    }
  }
  
  // Tentar converter formatos padrão
  const date = new Date(dateValue);
  if (!isNaN(date.getTime())) {
    const result = date.toISOString().split('T')[0];
    console.log(`📅 Data convertida pelo Date(): ${dateValue} -> ${result}`);
    return result;
  }
  
  console.log(`⚠️ Não foi possível converter a data: ${dateValue}, usando data atual`);
  return new Date().toISOString().split('T')[0];
}

// Função melhorada para calcular prazo entre duas datas
function calculatePeriodBetweenDates(startDate: string, endDate: string): { prazo: number; unidade: 'dias' | 'meses' | 'anos' } {
  const inicio = new Date(startDate);
  const fim = new Date(endDate);
  
  if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
    return { prazo: 12, unidade: 'meses' };
  }
  
  // Calcular diferença em dias
  const diffTime = fim.getTime() - inicio.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  console.log(`⏱️ Calculando prazo entre ${startDate} e ${endDate}: ${diffDays} dias`);
  
  // Determinar melhor unidade baseada na duração
  if (diffDays <= 90) {
    return { prazo: diffDays, unidade: 'dias' };
  } else if (diffDays <= 730) { // Até 2 anos, mostrar em meses
    const diffMonths = Math.round(diffDays / 30);
    return { prazo: diffMonths, unidade: 'meses' };
  } else {
    const diffYears = Math.round(diffDays / 365);
    return { prazo: diffYears, unidade: 'anos' };
  }
}

function calculateEndDate(startDate: string, prazo: number, unidade: string = 'meses'): string {
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return startDate;
  
  switch (unidade.toLowerCase()) {
    case 'dias':
    case 'dia':
      start.setDate(start.getDate() + prazo);
      break;
    case 'meses':
    case 'mes':
    case 'mês':
      start.setMonth(start.getMonth() + prazo);
      break;
    case 'anos':
    case 'ano':
      start.setFullYear(start.getFullYear() + prazo);
      break;
    default:
      start.setMonth(start.getMonth() + prazo); // padrão é meses
  }
  
  return start.toISOString().split('T')[0];
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

function detectarUnidadePrazo(prazoText: string): 'dias' | 'meses' | 'anos' {
  const texto = normalizeValue(prazoText);
  
  if (texto.includes('dia') || texto.includes('day')) return 'dias';
  if (texto.includes('ano') || texto.includes('year')) return 'anos';
  return 'meses'; // padrão
}

function detectarStatusPorData(dataTermino: string): 'vigente' | 'suspenso' | 'encerrado' | 'rescindido' {
  const hoje = new Date();
  const termino = new Date(dataTermino);
  
  if (isNaN(termino.getTime())) return 'vigente';
  
  if (termino < hoje) {
    return 'encerrado';
  }
  
  return 'vigente';
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
    dataInicio: findColumnIndex(headers, FIELD_MAPPINGS.dataInicio),
    dataTermino: findColumnIndex(headers, FIELD_MAPPINGS.dataTermino),
    prazoExecucao: findColumnIndex(headers, FIELD_MAPPINGS.prazoExecucao),
    modalidade: findColumnIndex(headers, FIELD_MAPPINGS.modalidade),
    status: findColumnIndex(headers, FIELD_MAPPINGS.status),
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
    
    // Extrair datas
    let dataAssinatura = columnIndexes.dataAssinatura >= 0 ? parseDate(row[columnIndexes.dataAssinatura]) : new Date().toISOString().split('T')[0];
    let dataInicio = columnIndexes.dataInicio >= 0 ? parseDate(row[columnIndexes.dataInicio]) : '';
    let dataTermino = columnIndexes.dataTermino >= 0 ? parseDate(row[columnIndexes.dataTermino]) : '';
    
    // Se não temos data de início, usar data de assinatura
    if (!dataInicio) {
      dataInicio = dataAssinatura;
    }
    
    // Extrair prazo da planilha
    const prazoValue = columnIndexes.prazoExecucao >= 0 ? parseValue(row[columnIndexes.prazoExecucao]) || 12 : 12;
    const prazoUnidadeDetectada = detectarUnidadePrazo(columnIndexes.prazoExecucao >= 0 ? String(row[columnIndexes.prazoExecucao] || '') : '');
    
    // Lógica inteligente para determinar prazo e datas
    let finalPrazo = prazoValue;
    let finalUnidade: 'dias' | 'meses' | 'anos' = prazoUnidadeDetectada;
    
    // Se temos ambas as datas, calcular prazo real baseado nas datas
    if (dataInicio && dataTermino) {
      const periodoCalculado = calculatePeriodBetweenDates(dataInicio, dataTermino);
      finalPrazo = periodoCalculado.prazo;
      finalUnidade = periodoCalculado.unidade;
      
      console.log(`🎯 Linha ${i}: Prazo calculado baseado nas datas: ${finalPrazo} ${finalUnidade}`);
    }
    // Se só temos data início e não temos data término, usar vigência padrão de 1 ano
    else if (dataInicio && !dataTermino) {
      finalPrazo = 12; // 12 meses = 1 ano
      finalUnidade = 'meses';
      dataTermino = calculateEndDate(dataInicio, finalPrazo, finalUnidade);
      console.log(`📅 Linha ${i}: Data término calculada com vigência padrão de 1 ano: ${dataTermino}`);
    }
    // Se só temos data término, calcular data início baseada no prazo padrão de 1 ano
    else if (!dataInicio && dataTermino) {
      finalPrazo = 12; // 12 meses = 1 ano
      finalUnidade = 'meses';
      // Calcular data início subtraindo o prazo da data término
      const inicioCalculado = new Date(dataTermino);
      inicioCalculado.setMonth(inicioCalculado.getMonth() - finalPrazo);
      dataInicio = inicioCalculado.toISOString().split('T')[0];
      console.log(`📅 Linha ${i}: Data início calculada com vigência padrão: ${dataInicio}`);
    }
    // Se não temos nenhuma das duas, usar vigência padrão de 1 ano
    else if (!dataTermino) {
      finalPrazo = 12; // 12 meses = 1 ano
      finalUnidade = 'meses';
      dataTermino = calculateEndDate(dataInicio, finalPrazo, finalUnidade);
      console.log(`📅 Linha ${i}: Data término calculada com vigência padrão de 1 ano: ${dataTermino}`);
    }

    const contract: Partial<Contract> = {
      numero: numero || `${sheetName}-LINHA-${i}`,
      objeto: objeto || 'Objeto a ser definido com base nos dados da planilha',
      contratante: columnIndexes.contratante >= 0 ? String(row[columnIndexes.contratante] || 'Órgão Público') : 'Órgão Público',
      contratada: columnIndexes.contratada >= 0 ? String(row[columnIndexes.contratada] || 'Empresa a definir') : 'Empresa a definir',
      valor: columnIndexes.valor >= 0 ? parseValue(row[columnIndexes.valor]) : 0,
      dataAssinatura,
      dataInicio,
      dataTermino,
      prazoExecucao: finalPrazo,
      prazoUnidade: finalUnidade,
      modalidade: columnIndexes.modalidade >= 0 ? parseModalidade(row[columnIndexes.modalidade]) : 'pregao',
      status: detectarStatusPorData(dataTermino),
      observacoes: `Extraído da aba "${sheetName}" - linha ${i}. Data início: ${dataInicio}, Data término: ${dataTermino}, Prazo: ${finalPrazo} ${finalUnidade}. Vigência padrão aplicada conforme necessário.`,
      aditivos: [],
      pagamentos: [],
      documentos: []
    };
    
    contracts.push(contract);
  }
  
  console.log(`✅ Extraídos ${contracts.length} contratos da aba "${sheetName}"`);
  return contracts;
}
