
import { Contract } from '@/types/contract';

// Mapas de correspondência mais amplos e flexíveis
const FIELD_MAPPINGS = {
  numero: ['numero', 'número', 'contrato', 'processo', 'num', 'nº', 'number', 'código', 'codigo', 'id', 'identificador', 'ref', 'referencia', 'referência'],
  objeto: ['objeto', 'descrição', 'descricao', 'servico', 'serviço', 'description', 'item', 'especificação', 'especificacao', 'finalidade', 'escopo', 'atividade', 'work', 'service'],
  contratante: ['contratante', 'orgao', 'órgão', 'cliente', 'solicitante', 'prefeitura', 'municipio', 'município', 'government', 'secretaria', 'unidade', 'client'],
  contratada: ['contratada', 'empresa', 'fornecedor', 'prestador', 'supplier', 'cnpj', 'razao social', 'razão social', 'licitante', 'vencedora', 'contractor', 'vendor'],
  valor: ['valor', 'preco', 'preço', 'price', 'amount', 'total', 'custo', 'montante', 'quantia', 'valor total', 'valor global', 'valor estimado', 'valor contratado', 'preço final', 'valor final', 'r$', 'reais', 'money', 'cost'],
  dataInicio: ['data inicio', 'data início', 'inicio vigencia', 'início vigência', 'vigencia inicio', 'vigência início', 'data inicial', 'start', 'início execução', 'inicio execucao', 'começo vigência', 'comeco vigencia', 'eficácia', 'eficacia', 'assinatura', 'data assinatura', 'data contrato', 'celebração', 'celebracao', 'data celebração', 'firmado', 'signed', 'begin'],
  dataTermino: ['data fim', 'data final', 'data termino', 'data término', 'fim vigencia', 'fim vigência', 'vigencia fim', 'vigência fim', 'final', 'end', 'término execução', 'termino execucao', 'vencimento', 'expira', 'validade', 'finish'],
  prazoExecucao: ['prazo', 'duracao', 'duração', 'meses', 'dias', 'duration', 'vigencia', 'vigência', 'tempo', 'período', 'periodo', 'tempo execução', 'tempo execucao', 'prazo execução', 'prazo execucao', 'term'],
  modalidade: ['modalidade', 'tipo', 'licitacao', 'licitação', 'modality', 'forma', 'processo', 'categoria', 'tipo licitacao', 'tipo licitação', 'method'],
  status: ['status', 'situacao', 'situação', 'estado', 'state', 'condição', 'condicao', 'situação atual', 'situacao atual', 'condition'],
};

const STATUS_MAPPINGS: Record<string, 'vigente' | 'suspenso' | 'encerrado' | 'rescindido'> = {
  'vigente': 'vigente',
  'ativo': 'vigente',
  'em andamento': 'vigente',
  'ativa': 'vigente',
  'válido': 'vigente',
  'valido': 'vigente',
  'suspenso': 'suspenso',
  'pausado': 'suspenso',
  'interrompido': 'suspenso',
  'encerrado': 'encerrado',
  'finalizado': 'encerrado',
  'concluído': 'encerrado',
  'concluido': 'encerrado',
  'terminado': 'encerrado',
  'rescindido': 'rescindido',
  'cancelado': 'rescindido',
  'anulado': 'rescindido'
};

const MODALIDADE_MAPPINGS: Record<string, 'pregao' | 'concorrencia' | 'tomada_precos' | 'convite' | 'concurso' | 'leilao'> = {
  'pregão': 'pregao',
  'pregao': 'pregao',
  'concorrência': 'concorrencia',
  'concorrencia': 'concorrencia',
  'tomada de preços': 'tomada_precos',
  'tomada de precos': 'tomada_precos',
  'tomada preços': 'tomada_precos',
  'tomada precos': 'tomada_precos',
  'convite': 'convite',
  'concurso': 'concurso',
  'leilão': 'leilao',
  'leilao': 'leilao'
};

function normalizeValue(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function findColumnIndex(headers: string[], fieldMappings: string[]): number {
  console.log(`🔍 Procurando coluna para: ${fieldMappings[0]}`);
  
  for (let i = 0; i < headers.length; i++) {
    const header = normalizeValue(headers[i]);
    console.log(`   - Testando header[${i}]: "${header}"`);
    
    for (const mapping of fieldMappings) {
      const normalizedMapping = normalizeValue(mapping);
      if (header.includes(normalizedMapping) || normalizedMapping.includes(header)) {
        console.log(`   ✅ Match encontrado: "${header}" <-> "${normalizedMapping}"`);
        return i;
      }
    }
  }
  
  console.log(`   ❌ Nenhuma coluna encontrada para: ${fieldMappings[0]}`);
  return -1;
}

function parseDate(dateValue: any): string {
  if (!dateValue) return '';
  
  console.log(`📅 Parsing data: "${dateValue}" (tipo: ${typeof dateValue})`);
  
  // Se já está no formato ISO
  if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
    console.log(`📅 Data já em formato ISO: ${dateValue}`);
    return dateValue;
  }
  
  // Se é um número (serial date do Excel)
  if (typeof dateValue === 'number' && dateValue > 0) {
    try {
      // Excel serial date - 1 de janeiro de 1900 é 1
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
      if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
        const result = date.toISOString().split('T')[0];
        console.log(`📅 Data convertida do Excel serial: ${dateValue} -> ${result}`);
        return result;
      }
    } catch (e) {
      console.log(`⚠️ Erro ao converter serial date: ${e}`);
    }
  }
  
  // Formato brasileiro DD/MM/YYYY ou DD/MM/YY
  if (typeof dateValue === 'string') {
    const cleaned = dateValue.trim().replace(/\s+/g, '');
    const dateParts = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
    if (dateParts) {
      let [, day, month, year] = dateParts;
      
      // Se ano tem 2 dígitos, assumir 20XX se < 50, senão 19XX
      if (year.length === 2) {
        const yearNum = parseInt(year);
        year = yearNum < 50 ? '20' + year : '19' + year;
      }
      
      const result = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log(`📅 Data convertida do formato brasileiro: ${dateValue} -> ${result}`);
      return result;
    }
  }
  
  // Tentar converter formatos padrão
  try {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
      const result = date.toISOString().split('T')[0];
      console.log(`📅 Data convertida pelo Date(): ${dateValue} -> ${result}`);
      return result;
    }
  } catch (e) {
    console.log(`⚠️ Erro ao converter data padrão: ${e}`);
  }
  
  console.log(`⚠️ Não foi possível converter a data: ${dateValue}`);
  return '';
}

function validateAndFixDates(dataInicio: string, dataTermino: string): { dataInicio: string; dataTermino: string } {
  const hoje = new Date();
  const hojeFmt = hoje.toISOString().split('T')[0];
  
  // Se ambas as datas estão vazias, usar vigência padrão de 1 ano
  if (!dataInicio && !dataTermino) {
    const fimVigencia = new Date(hoje);
    fimVigencia.setFullYear(fimVigencia.getFullYear() + 1);
    
    return {
      dataInicio: hojeFmt,
      dataTermino: fimVigencia.toISOString().split('T')[0]
    };
  }
  
  // Se só uma data existe, calcular a outra baseada em 1 ano de vigência
  if (!dataInicio && dataTermino) {
    const termino = new Date(dataTermino);
    const inicio = new Date(termino);
    inicio.setFullYear(inicio.getFullYear() - 1);
    return {
      dataInicio: inicio.toISOString().split('T')[0],
      dataTermino: dataTermino
    };
  }
  
  if (dataInicio && !dataTermino) {
    const inicio = new Date(dataInicio);
    const termino = new Date(inicio);
    termino.setFullYear(termino.getFullYear() + 1);
    return {
      dataInicio: dataInicio,
      dataTermino: termino.toISOString().split('T')[0]
    };
  }
  
  // Se ambas existem, verificar se estão na ordem correta
  const inicioDate = new Date(dataInicio);
  const terminoDate = new Date(dataTermino);
  
  if (inicioDate > terminoDate) {
    console.log(`⚠️ Datas invertidas detectadas! Corrigindo: ${dataInicio} <-> ${dataTermino}`);
    return {
      dataInicio: dataTermino,
      dataTermino: dataInicio
    };
  }
  
  return { dataInicio, dataTermino };
}

function calculatePeriodBetweenDates(startDate: string, endDate: string): { prazo: number; unidade: 'dias' | 'meses' | 'anos' } {
  const inicio = new Date(startDate);
  const fim = new Date(endDate);
  
  if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
    return { prazo: 12, unidade: 'meses' };
  }
  
  const diffTime = fim.getTime() - inicio.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  console.log(`⏱️ Calculando prazo entre ${startDate} e ${endDate}: ${diffDays} dias`);
  
  if (diffDays <= 90) {
    return { prazo: diffDays, unidade: 'dias' };
  } else if (diffDays <= 730) {
    const diffMonths = Math.round(diffDays / 30);
    return { prazo: diffMonths, unidade: 'meses' };
  } else {
    const diffYears = Math.round(diffDays / 365);
    return { prazo: diffYears, unidade: 'anos' };
  }
}

function parseValue(value: any): number {
  if (typeof value === 'number') return Math.max(0, value);
  if (!value) return 0;
  
  const stringValue = String(value).trim();
  console.log(`💰 Parsing valor: "${stringValue}"`);
  
  if (!stringValue) return 0;
  
  // Detectar abreviações e converter
  let multiplier = 1;
  const lowerValue = stringValue.toLowerCase();
  
  if (lowerValue.includes('mil') || lowerValue.endsWith('k')) {
    multiplier = 1000;
  } else if (lowerValue.includes('milhão') || lowerValue.includes('milhao') || lowerValue.includes('mi') || lowerValue.endsWith('m')) {
    multiplier = 1000000;
  } else if (lowerValue.includes('bilhão') || lowerValue.includes('bilhao') || lowerValue.includes('bi') || lowerValue.endsWith('b')) {
    multiplier = 1000000000;
  }
  
  // Remover texto e símbolos, manter apenas números, vírgulas e pontos
  let cleanValue = stringValue
    .replace(/[^\d,.-]/g, '')
    .replace(/^[,.-]+|[,.-]+$/g, '') // Remove vírgulas/pontos no início/fim
    .trim();
  
  if (!cleanValue) return 0;
  
  // Detectar formato brasileiro vs internacional
  const commaCount = (cleanValue.match(/,/g) || []).length;
  const dotCount = (cleanValue.match(/\./g) || []).length;
  const lastCommaIndex = cleanValue.lastIndexOf(',');
  const lastDotIndex = cleanValue.lastIndexOf('.');
  
  if (commaCount > 0 && dotCount > 0) {
    if (lastCommaIndex > lastDotIndex) {
      // Formato brasileiro (1.234.567,89)
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato internacional (1,234,567.89)
      cleanValue = cleanValue.replace(/,/g, '');
    }
  } else if (commaCount > 0) {
    const afterComma = cleanValue.substring(lastCommaIndex + 1);
    if (afterComma.length <= 2 && commaCount === 1) {
      // Decimal brasileiro
      cleanValue = cleanValue.replace(',', '.');
    } else {
      // Separador de milhares
      cleanValue = cleanValue.replace(/,/g, '');
    }
  } else if (dotCount > 1) {
    // Múltiplos pontos: formato brasileiro de milhares
    const lastDotPos = cleanValue.lastIndexOf('.');
    const afterLastDot = cleanValue.substring(lastDotPos + 1);
    if (afterLastDot.length <= 2) {
      // Último ponto é decimal
      cleanValue = cleanValue.substring(0, lastDotPos).replace(/\./g, '') + '.' + afterLastDot;
    } else {
      // Todos são separadores de milhares
      cleanValue = cleanValue.replace(/\./g, '');
    }
  }
  
  const parsed = parseFloat(cleanValue) * multiplier;
  const result = isNaN(parsed) ? 0 : Math.max(0, parsed);
  
  console.log(`💰 Valor parseado: "${stringValue}" -> ${result}`);
  return result;
}

function parseStatus(status: any): 'vigente' | 'suspenso' | 'encerrado' | 'rescindido' {
  if (!status) return 'vigente';
  
  const normalized = normalizeValue(status);
  
  for (const [key, value] of Object.entries(STATUS_MAPPINGS)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return 'vigente';
}

function parseModalidade(modalidade: any): 'pregao' | 'concorrencia' | 'tomada_precos' | 'convite' | 'concurso' | 'leilao' {
  if (!modalidade) return 'pregao';
  
  const normalized = normalizeValue(modalidade);
  
  for (const [key, value] of Object.entries(MODALIDADE_MAPPINGS)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return 'pregao';
}

function detectarStatusPorData(dataTermino: string): 'vigente' | 'suspenso' | 'encerrado' | 'rescindido' {
  if (!dataTermino) return 'vigente';
  
  const hoje = new Date();
  const termino = new Date(dataTermino);
  
  if (isNaN(termino.getTime())) return 'vigente';
  
  if (termino < hoje) {
    return 'encerrado';
  }
  
  return 'vigente';
}

export function extractContractFromSpreadsheetData(data: any[][], sheetName: string): Partial<Contract>[] {
  console.log(`📊 Iniciando extração da aba "${sheetName}" com ${data.length} linhas`);
  
  if (data.length < 2) {
    console.log(`⚠️ Aba "${sheetName}" possui poucos dados (${data.length} linhas)`);
    return [];
  }
  
  // Primeira linha como cabeçalho
  const headers = data[0].map(h => String(h || '').trim()).filter(h => h);
  console.log(`🔍 Cabeçalhos da aba "${sheetName}":`, headers);
  
  if (headers.length === 0) {
    console.log(`❌ Nenhum cabeçalho válido encontrado na aba "${sheetName}"`);
    return [];
  }
  
  // Encontrar índices das colunas
  const columnIndexes = {
    numero: findColumnIndex(headers, FIELD_MAPPINGS.numero),
    objeto: findColumnIndex(headers, FIELD_MAPPINGS.objeto),
    contratante: findColumnIndex(headers, FIELD_MAPPINGS.contratante),
    contratada: findColumnIndex(headers, FIELD_MAPPINGS.contratada),
    valor: findColumnIndex(headers, FIELD_MAPPINGS.valor),
    dataInicio: findColumnIndex(headers, FIELD_MAPPINGS.dataInicio),
    dataTermino: findColumnIndex(headers, FIELD_MAPPINGS.dataTermino),
    prazoExecucao: findColumnIndex(headers, FIELD_MAPPINGS.prazoExecucao),
    modalidade: findColumnIndex(headers, FIELD_MAPPINGS.modalidade),
    status: findColumnIndex(headers, FIELD_MAPPINGS.status),
  };
  
  console.log(`📊 Mapeamento de colunas para aba "${sheetName}":`, columnIndexes);
  
  // Verificar se pelo menos algumas colunas essenciais foram encontradas
  const essentialColumns = ['numero', 'objeto', 'contratada', 'valor'];
  const foundEssential = essentialColumns.filter(col => columnIndexes[col as keyof typeof columnIndexes] >= 0);
  
  if (foundEssential.length === 0) {
    console.log(`⚠️ Nenhuma coluna essencial encontrada na aba "${sheetName}". Tentando extração flexível...`);
    // Tentar extração mais flexível usando posições fixas
    return extractWithFlexibleMapping(data, sheetName);
  }
  
  const contracts: Partial<Contract>[] = [];
  
  // Processar linhas de dados (pular cabeçalho)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    if (!row || row.length === 0) {
      console.log(`⚠️ Linha ${i} está vazia, pulando`);
      continue;
    }
    
    // Verificar se a linha tem conteúdo útil
    const hasContent = row.some(cell => cell && String(cell).trim() !== '');
    if (!hasContent) {
      console.log(`⚠️ Linha ${i} não tem conteúdo, pulando`);
      continue;
    }
    
    console.log(`📝 Processando linha ${i}:`, row.slice(0, 5)); // Log primeiros 5 valores
    
    try {
      // Extrair dados da linha
      const numero = columnIndexes.numero >= 0 ? String(row[columnIndexes.numero] || '').trim() : `${sheetName}-${i}`;
      const objeto = columnIndexes.objeto >= 0 ? String(row[columnIndexes.objeto] || '').trim() : '';
      const contratada = columnIndexes.contratada >= 0 ? String(row[columnIndexes.contratada] || '').trim() : '';
      const valor = columnIndexes.valor >= 0 ? parseValue(row[columnIndexes.valor]) : 0;
      
      // Se não tem nem número nem objeto nem contratada, pular
      if (!numero && !objeto && !contratada) {
        console.log(`⚠️ Linha ${i}: Sem dados essenciais, pulando`);
        continue;
      }
      
      // Extrair e validar datas
      let dataInicioRaw = columnIndexes.dataInicio >= 0 ? parseDate(row[columnIndexes.dataInicio]) : '';
      let dataTerminoRaw = columnIndexes.dataTermino >= 0 ? parseDate(row[columnIndexes.dataTermino]) : '';
      
      const { dataInicio, dataTermino } = validateAndFixDates(dataInicioRaw, dataTerminoRaw);
      const periodoCalculado = calculatePeriodBetweenDates(dataInicio, dataTermino);
      
      const contract: Partial<Contract> = {
        numero: numero || `${sheetName}-LINHA-${i}`,
        objeto: objeto || 'Objeto não especificado',
        contratante: columnIndexes.contratante >= 0 ? String(row[columnIndexes.contratante] || '').trim() || 'Órgão Público' : 'Órgão Público',
        contratada: contratada || 'Empresa não especificada',
        valor: valor,
        dataInicio,
        dataTermino,
        prazoExecucao: periodoCalculado.prazo,
        prazoUnidade: periodoCalculado.unidade,
        modalidade: columnIndexes.modalidade >= 0 ? parseModalidade(row[columnIndexes.modalidade]) : 'pregao',
        status: columnIndexes.status >= 0 ? parseStatus(row[columnIndexes.status]) : detectarStatusPorData(dataTermino),
        observacoes: `Extraído da planilha "${sheetName}" - linha ${i}. Prazo calculado: ${periodoCalculado.prazo} ${periodoCalculado.unidade}.`,
        aditivos: [],
        pagamentos: [],
        documentos: []
      };
      
      contracts.push(contract);
      console.log(`✅ Linha ${i}: Contrato extraído - ${contract.numero}`);
      
    } catch (error) {
      console.error(`❌ Erro ao processar linha ${i}:`, error);
      continue;
    }
  }
  
  console.log(`✅ Extraídos ${contracts.length} contratos da aba "${sheetName}"`);
  return contracts;
}

// Função de extração mais flexível para quando não encontra colunas
function extractWithFlexibleMapping(data: any[][], sheetName: string): Partial<Contract>[] {
  console.log(`🔄 Tentando extração flexível para aba "${sheetName}"`);
  
  const contracts: Partial<Contract>[] = [];
  const headers = data[0] || [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    // Tentar usar as primeiras colunas como dados essenciais
    const possibleData = row.filter(cell => cell && String(cell).trim() !== '');
    
    if (possibleData.length >= 2) {
      const hoje = new Date();
      const proximoAno = new Date(hoje);
      proximoAno.setFullYear(proximoAno.getFullYear() + 1);
      
      const contract: Partial<Contract> = {
        numero: String(possibleData[0] || `${sheetName}-${i}`).trim(),
        objeto: String(possibleData[1] || 'Objeto extraído da planilha').trim(),
        contratante: 'Órgão Público',
        contratada: String(possibleData[2] || 'Empresa da planilha').trim(),
        valor: possibleData.length > 3 ? parseValue(possibleData[3]) : 50000,
        dataInicio: hoje.toISOString().split('T')[0],
        dataTermino: proximoAno.toISOString().split('T')[0],
        prazoExecucao: 12,
        prazoUnidade: 'meses',
        modalidade: 'pregao',
        status: 'vigente',
        observacoes: `Extraído da planilha "${sheetName}" usando mapeamento flexível - linha ${i}. Favor revisar os dados.`,
        aditivos: [],
        pagamentos: [],
        documentos: []
      };
      
      contracts.push(contract);
      console.log(`✅ Extração flexível linha ${i}: ${contract.numero}`);
    }
  }
  
  console.log(`✅ Extração flexível: ${contracts.length} contratos da aba "${sheetName}"`);
  return contracts;
}
