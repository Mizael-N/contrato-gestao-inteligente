import { Contract } from '@/types/contract';
import { 
  detectSpreadsheetType, 
  parseAdvancedDate, 
  findDateColumns, 
  calculateContractPeriod,
  validateDateConsistency,
  extractCellMetadata,
  CellMetadata,
  START_DATE_SYNONYMS,
  END_DATE_SYNONYMS
} from './dateRecognition';
import { format } from 'date-fns';

// Mapeamentos MASSIVAMENTE expandidos para outros campos (não-data)
const FIELD_MAPPINGS = {
  numero: [
    // Português básico
    'numero', 'número', 'contrato', 'processo', 'num', 'nº', 'codigo', 'código',
    'id', 'identificador', 'ref', 'referencia', 'referência', 'registro', 'seq', 'sequencial',
    'ordem', 'protocolo', 'expediente', 'documento',
    // Variações específicas de contratos
    'contrato numero', 'contrato número', 'numero contrato', 'número contrato',
    'numero processo', 'número processo', 'processo numero', 'processo número',
    'contrato nº', 'nº contrato', 'processo nº', 'nº processo',
    // Abreviações
    'cont', 'proc', 'doc', 'reg', 'prot', 'exp',
    // Inglês
    'number', 'contract number', 'process number', 'document', 'reference', 'code'
  ],
  
  objeto: [
    // Português básico
    'objeto', 'descrição', 'descricao', 'servico', 'serviço', 'item', 'especificação',
    'especificacao', 'finalidade', 'escopo', 'atividade', 'natureza', 'tipo',
    // Variações específicas
    'objeto contrato', 'objeto do contrato', 'descrição objeto', 'descrição do objeto',
    'serviço contratado', 'servico contratado', 'atividade contratada', 'trabalho',
    'prestação', 'prestacao', 'prestação serviço', 'prestacao servico',
    'fornecimento', 'aquisição', 'aquisicao', 'compra', 'contratação', 'contratacao',
    // Termos específicos por área
    'obra', 'construção', 'construcao', 'reforma', 'manutenção', 'manutencao',
    'consultoria', 'assessoria', 'treinamento', 'capacitação', 'capacitacao',
    'material', 'equipamento', 'produto', 'bem', 'mercadoria',
    // Abreviações
    'obj', 'desc', 'esp', 'fin', 'esc', 'ativ', 'nat',
    // Inglês
    'description', 'service', 'work', 'activity', 'scope', 'purpose', 'item', 'specification'
  ],
  
  contratante: [
    // Português básico
    'contratante', 'orgao', 'órgão', 'cliente', 'solicitante', 'comprador',
    'adquirente', 'tomador', 'locatário', 'locatario', 'demandante',
    // Entidades públicas
    'prefeitura', 'municipio', 'município', 'estado', 'governo', 'união', 'uniao',
    'secretaria', 'ministério', 'ministerio', 'autarquia', 'fundação', 'fundacao',
    'câmara', 'camara', 'assembleia', 'tribunal', 'defensoria', 'procuradoria',
    'poder público', 'poder publico', 'administração', 'administracao', 'fazenda',
    // Variações específicas
    'orgao contratante', 'órgão contratante', 'entidade contratante', 'cliente contratante',
    'poder concedente', 'ente público', 'ente publico', 'pessoa jurídica', 'pessoa juridica',
    // Abreviações
    'pref', 'gov', 'sec', 'min', 'aut', 'fund', 'cam', 'ass', 'trib', 'def', 'proc',
    // Inglês
    'client', 'customer', 'buyer', 'government', 'municipality', 'agency', 'institution'
  ],
  
  contratada: [
    // Português básico
    'contratada', 'empresa', 'fornecedor', 'prestador', 'vendedor', 'licitante',
    'adjudicatário', 'adjudicataria', 'vencedora', 'participante', 'proponente',
    'executor', 'executora', 'realizador', 'realizadora',
    // Identificação empresarial
    'cnpj', 'razao social', 'razão social', 'nome empresa', 'denominação', 'denominacao',
    'firma', 'companhia', 'corporação', 'corporacao', 'sociedade', 'ltda', 'sa', 's/a',
    'me', 'epp', 'mei', 'eireli',
    // Tipos específicos
    'construtora', 'consultora', 'prestadora', 'fornecedora', 'distribuidora',
    'representante', 'agente', 'intermediário', 'intermediario', 'terceirizada',
    // Variações específicas
    'empresa contratada', 'fornecedor contratado', 'prestador contratado',
    'licitante vencedor', 'empresa vencedora', 'adjudicatária contrato',
    // Abreviações
    'emp', 'forn', 'prest', 'lic', 'adj', 'venc', 'exec', 'real',
    // Inglês
    'contractor', 'supplier', 'vendor', 'company', 'corporation', 'provider', 'seller'
  ],
  
  valor: [
    // Português básico - Valor
    'valor', 'preco', 'preço', 'custo', 'montante', 'quantia', 'importância', 'importancia',
    'soma', 'total', 'monta', 'cifra', 'verba', 'dotação', 'dotacao',
    // Variações específicas de valor
    'valor total', 'valor global', 'valor contratual', 'valor contrato', 'valor estimado',
    'valor máximo', 'valor maximo', 'valor mínimo', 'valor minimo', 'valor inicial',
    'valor final', 'valor líquido', 'valor liquido', 'valor bruto', 'preço total',
    'preço final', 'preco final', 'preço unitário', 'preco unitario',
    // Termos orçamentários
    'orçamento', 'orcamento', 'estimativa', 'previsão', 'previsao', 'alocação', 'alocacao',
    'recursos', 'verba', 'dotação orçamentária', 'dotacao orcamentaria',
    'rubrica', 'conta', 'item orçamentário', 'item orcamentario',
    // Pagamento e financeiro
    'pagamento', 'desembolso', 'repasse', 'transferência', 'transferencia',
    'investimento', 'gasto', 'despesa', 'dispêndio', 'dispendio',
    // Símbolos e moedas
    'r$', 'reais', 'real', 'brl', '$', 'rs', 'mil', 'milhão', 'milhao', 'bilhão', 'bilhao',
    // Abreviações
    'val', 'vlr', 'prc', 'cst', 'mnt', 'tot', 'orc', 'est', 'pag', 'desp',
    // Inglês
    'price', 'cost', 'amount', 'total', 'sum', 'value', 'money', 'payment', 'budget'
  ],
  
  modalidade: [
    // Modalidades básicas
    'modalidade', 'tipo', 'forma', 'método', 'metodo', 'modo', 'meio', 'procedimento',
    'regime', 'categoria', 'classificação', 'classificacao', 'espécie', 'especie',
    // Licitações específicas
    'licitacao', 'licitação', 'pregão', 'pregao', 'concorrência', 'concorrencia',
    'tomada preços', 'tomada de preços', 'tomada precos', 'tomada de precos',
    'convite', 'concurso', 'leilão', 'leilao', 'rdc', 'bec',
    // Variações específicas
    'modalidade licitação', 'modalidade licitacao', 'tipo licitação', 'tipo licitacao',
    'processo licitatório', 'processo licitatorio', 'forma contratação', 'forma contratacao',
    'regime contratação', 'regime contratacao', 'método seleção', 'metodo selecao',
    // Dispensas e inexigibilidades
    'dispensa', 'inexigibilidade', 'contratação direta', 'contratacao direta',
    'emergencial', 'calamidade', 'urgência', 'urgencia',
    // Pregões específicos
    'pregão eletrônico', 'pregao eletronico', 'pregão presencial', 'pregao presencial',
    'pe', 'pp', 'srp', 'sistema registro preços', 'sistema registro precos',
    // Abreviações
    'mod', 'tip', 'for', 'met', 'proc', 'reg', 'cat', 'cla', 'lic',
    // Inglês
    'modality', 'type', 'method', 'form', 'procedure', 'category', 'bidding'
  ],
  
  status: [
    // Estados básicos
    'status', 'situacao', 'situação', 'estado', 'condição', 'condicao', 'fase',
    'etapa', 'posição', 'posicao', 'circunstância', 'circunstancia', 'momento',
    // Status específicos - Vigente
    'vigente', 'ativo', 'ativa', 'válido', 'valido', 'em vigor', 'em andamento',
    'executando', 'execução', 'execucao', 'corrente', 'atual', 'regular',
    // Status específicos - Suspenso
    'suspenso', 'suspensa', 'pausado', 'pausada', 'interrompido', 'interrompida',
    'parado', 'parada', 'standby', 'aguardando', 'pendente',
    // Status específicos - Encerrado
    'encerrado', 'encerrada', 'finalizado', 'finalizada', 'concluído', 'concluida',
    'terminado', 'terminada', 'acabado', 'acabada', 'completo', 'completa',
    'entregue', 'cumprido', 'cumprida', 'quitado', 'quitada',
    // Status específicos - Rescindido
    'rescindido', 'rescindida', 'cancelado', 'cancelada', 'anulado', 'anulada',
    'revogado', 'revogada', 'extinto', 'extinta', 'rompido', 'rompida',
    // Variações específicas
    'situação atual', 'situacao atual', 'status contrato', 'situação contrato', 'situacao contrato',
    'estado contrato', 'condição contrato', 'condicao contrato', 'fase contrato',
    // Abreviações
    'sit', 'est', 'con', 'pos', 'fas', 'eta', 'vig', 'ati', 'val', 'sus', 'pau',
    'enc', 'fin', 'ter', 'res', 'can', 'anu', 'rev',
    // Inglês
    'status', 'state', 'condition', 'phase', 'stage', 'active', 'suspended', 'finished', 'canceled'
  ]
};

// Mapeamentos de valores expandidos
const STATUS_MAPPINGS: Record<string, 'vigente' | 'suspenso' | 'encerrado' | 'rescindido'> = {
  // Vigente
  'vigente': 'vigente', 'ativo': 'vigente', 'ativa': 'vigente', 'válido': 'vigente', 'valido': 'vigente',
  'em vigor': 'vigente', 'em andamento': 'vigente', 'executando': 'vigente', 'execução': 'vigente',
  'execucao': 'vigente', 'corrente': 'vigente', 'atual': 'vigente', 'regular': 'vigente',
  'normal': 'vigente', 'funcionando': 'vigente', 'operando': 'vigente', 'ativo': 'vigente',
  // Suspenso
  'suspenso': 'suspenso', 'suspensa': 'suspenso', 'pausado': 'suspenso', 'pausada': 'suspenso',
  'interrompido': 'suspenso', 'interrompida': 'suspenso', 'parado': 'suspenso', 'parada': 'suspenso',
  'standby': 'suspenso', 'aguardando': 'suspenso', 'pendente': 'suspenso', 'paralisado': 'suspenso',
  // Encerrado
  'encerrado': 'encerrado', 'encerrada': 'encerrado', 'finalizado': 'encerrado', 'finalizada': 'encerrado',
  'concluído': 'encerrado', 'concluida': 'encerrado', 'terminado': 'encerrado', 'terminada': 'encerrado',
  'acabado': 'encerrado', 'acabada': 'encerrado', 'completo': 'encerrado', 'completa': 'encerrado',
  'entregue': 'encerrado', 'cumprido': 'encerrado', 'cumprida': 'encerrado', 'quitado': 'encerrado',
  'quitada': 'encerrado', 'liquidado': 'encerrado', 'liquidada': 'encerrado',
  // Rescindido
  'rescindido': 'rescindido', 'rescindida': 'rescindido', 'cancelado': 'rescindido', 'cancelada': 'rescindido',
  'anulado': 'rescindido', 'anulada': 'rescindido', 'revogado': 'rescindido', 'revogada': 'rescindido',
  'extinto': 'rescindido', 'extinta': 'rescindido', 'rompido': 'rescindido', 'rompida': 'rescindido',
  'suspenso definitivamente': 'rescindido', 'cancelado definitivamente': 'rescindido'
};

const MODALIDADE_MAPPINGS: Record<string, 'pregao' | 'concorrencia' | 'tomada_precos' | 'convite' | 'concurso' | 'leilao'> = {
  // Pregão
  'pregão': 'pregao', 'pregao': 'pregao', 'pregão eletrônico': 'pregao', 'pregao eletronico': 'pregao',
  'pregão presencial': 'pregao', 'pregao presencial': 'pregao', 'pe': 'pregao', 'pp': 'pregao',
  // Concorrência
  'concorrência': 'concorrencia', 'concorrencia': 'concorrencia', 'concorrência pública': 'concorrencia',
  'concorrencia publica': 'concorrencia', 'cc': 'concorrencia',
  // Tomada de Preços
  'tomada de preços': 'tomada_precos', 'tomada de precos': 'tomada_precos',
  'tomada preços': 'tomada_precos', 'tomada precos': 'tomada_precos', 'tp': 'tomada_precos',
  // Convite
  'convite': 'convite', 'carta convite': 'convite', 'cv': 'convite',
  // Concurso
  'concurso': 'concurso', 'concurso público': 'concurso', 'concurso publico': 'concurso',
  // Leilão
  'leilão': 'leilao', 'leilao': 'leilao', 'leilão público': 'leilao', 'leilao publico': 'leilao'
};

// Função para normalizar texto de busca
function normalizeValue(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Função para encontrar coluna por mapeamento com suporte a formatação
function findColumnIndex(headers: string[], fieldMappings: string[], cellMetadata?: CellMetadata[][]): number {
  console.log(`🔍 Procurando coluna para: ${fieldMappings[0]}`);
  
  const candidates: { index: number; confidence: number }[] = [];
  
  for (let i = 0; i < headers.length; i++) {
    const header = normalizeValue(headers[i]);
    console.log(`   - Testando header[${i}]: "${header}"`);
    
    // Bonus de confiança se a célula está formatada
    let formattingBonus = 0;
    if (cellMetadata && cellMetadata[0] && cellMetadata[0][i]) {
      const metadata = cellMetadata[0][i];
      if (metadata.isBold) formattingBonus += 0.2;
      if (metadata.hasColor) formattingBonus += 0.15;
      if (metadata.isHighlighted) formattingBonus += 0.25;
      if (metadata.isMerged) formattingBonus += 0.1;
    }
    
    for (const mapping of fieldMappings) {
      const normalizedMapping = normalizeValue(mapping);
      let confidence = 0;
      
      if (header === normalizedMapping) {
        confidence = 1.0;
      } else if (header.includes(normalizedMapping)) {
        confidence = 0.8;
      } else if (normalizedMapping.includes(header) && header.length > 2) {
        confidence = 0.6;
      }
      
      if (confidence > 0) {
        const finalConfidence = Math.min(1.0, confidence + formattingBonus);
        candidates.push({ index: i, confidence: finalConfidence });
        
        console.log(`   ✅ Match encontrado: "${header}" <-> "${normalizedMapping}" (confiança: ${finalConfidence}, formatação: +${formattingBonus})`);
        break;
      }
    }
  }
  
  // Retornar o candidato com maior confiança
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.confidence - a.confidence);
    const best = candidates[0];
    console.log(`   🏆 Melhor candidato: índice ${best.index} (confiança: ${best.confidence})`);
    return best.index;
  }
  
  console.log(`   ❌ Nenhuma coluna encontrada para: ${fieldMappings[0]}`);
  return -1;
}

// Função para parsear valores monetários - MELHORADA
function parseValue(value: any): number {
  if (typeof value === 'number') return Math.max(0, value);
  if (!value) return 0;
  
  const stringValue = String(value).trim();
  console.log(`💰 Parsing valor MELHORADO: "${stringValue}"`);
  
  if (!stringValue) return 0;
  
  // Detectar abreviações e converter com mais variações
  let multiplier = 1;
  const lowerValue = stringValue.toLowerCase();
  
  // Detectar milhares
  if (lowerValue.includes('mil') || lowerValue.endsWith('k') || 
      lowerValue.includes('thousand') || lowerValue.includes('1000')) {
    multiplier = 1000;
  }
  // Detectar milhões
  else if (lowerValue.includes('milhão') || lowerValue.includes('milhao') || 
           lowerValue.includes('mi') || lowerValue.endsWith('m') ||
           lowerValue.includes('million') || lowerValue.includes('1000000')) {
    multiplier = 1000000;
  }
  // Detectar bilhões
  else if (lowerValue.includes('bilhão') || lowerValue.includes('bilhao') || 
           lowerValue.includes('bi') || lowerValue.endsWith('b') ||
           lowerValue.includes('billion') || lowerValue.includes('1000000000')) {
    multiplier = 1000000000;
  }
  
  // Limpar valor removendo mais símbolos
  let cleanValue = stringValue
    .replace(/[^\d,.-]/g, '')
    .replace(/^[,.-]+|[,.-]+$/g, '')
    .trim();
  
  if (!cleanValue) return 0;
  
  // Detectar formato brasileiro vs internacional com mais precisão
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
    const parts = cleanValue.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length <= 2) {
      // Último é decimal
      const decimalPart = parts.pop();
      cleanValue = parts.join('') + '.' + decimalPart;
    } else {
      // Todos são separadores de milhares
      cleanValue = cleanValue.replace(/\./g, '');
    }
  }
  
  const parsed = parseFloat(cleanValue) * multiplier;
  const result = isNaN(parsed) ? 0 : Math.max(0, parsed);
  
  console.log(`💰 Valor parseado MELHORADO: "${stringValue}" -> ${result}`);
  return result;
}

// Função principal de extração inteligente - MELHORADA
export function extractContractFromSpreadsheetDataIntelligent(
  data: any[][], 
  sheetName: string, 
  fileName: string = '',
  worksheet?: any
): Partial<Contract>[] {
  console.log(`🚀 EXTRAÇÃO INTELIGENTE MELHORADA: Aba "${sheetName}" com ${data.length} linhas`);
  
  if (data.length < 2) {
    console.log(`⚠️ Aba "${sheetName}" possui poucos dados (${data.length} linhas)`);
    return [];
  }
  
  // Detectar tipo de planilha
  const spreadsheetType = detectSpreadsheetType(data, fileName);
  console.log(`📊 Tipo de planilha detectado: ${spreadsheetType}`);
  
  // Extrair metadados de formatação se disponível
  let cellMetadata: CellMetadata[][] = [];
  if (worksheet) {
    cellMetadata = extractCellMetadata(worksheet);
    console.log(`🎨 Metadados de formatação extraídos: ${cellMetadata.length} linhas`);
  }
  
  // Primeira linha como cabeçalho
  const headers = data[0].map(h => String(h || '').trim()).filter(h => h);
  console.log(`📋 Cabeçalhos encontrados:`, headers);
  
  if (headers.length === 0) {
    console.log(`❌ Nenhum cabeçalho válido encontrado na aba "${sheetName}"`);
    return [];
  }
  
  // FASE 1: BUSCAR COLUNAS DE DATA PRIMEIRO (PRIORIDADE MÁXIMA) - COM FORMATAÇÃO
  console.log(`🎯 FASE 1: Buscando colunas de data com análise de formatação...`);
  const { startDateColumns, endDateColumns } = findDateColumns(headers, cellMetadata);
  
  // Selecionar as melhores colunas de data
  const bestStartColumn = startDateColumns.length > 0 ? startDateColumns[0] : null;
  const bestEndColumn = endDateColumns.length > 0 ? endDateColumns[0] : null;
  
  console.log(`📅 Colunas de data selecionadas:`, {
    inicio: bestStartColumn ? `${headers[bestStartColumn.index]} (${bestStartColumn.confidence})` : 'Não encontrada',
    fim: bestEndColumn ? `${headers[bestEndColumn.index]} (${bestEndColumn.confidence})` : 'Não encontrada'
  });
  
  // FASE 2: BUSCAR OUTRAS COLUNAS COM FORMATAÇÃO
  console.log(`🎯 FASE 2: Buscando outras colunas com análise de formatação...`);
  const columnIndexes = {
    numero: findColumnIndex(headers, FIELD_MAPPINGS.numero, cellMetadata),
    objeto: findColumnIndex(headers, FIELD_MAPPINGS.objeto, cellMetadata),
    contratante: findColumnIndex(headers, FIELD_MAPPINGS.contratante, cellMetadata),
    contratada: findColumnIndex(headers, FIELD_MAPPINGS.contratada, cellMetadata),
    valor: findColumnIndex(headers, FIELD_MAPPINGS.valor, cellMetadata),
    modalidade: findColumnIndex(headers, FIELD_MAPPINGS.modalidade, cellMetadata),
    status: findColumnIndex(headers, FIELD_MAPPINGS.status, cellMetadata),
    dataInicio: bestStartColumn?.index ?? -1,
    dataTermino: bestEndColumn?.index ?? -1
  };
  
  console.log(`📊 Mapeamento final de colunas:`, columnIndexes);
  
  // Verificar se encontrou dados essenciais
  const essentialFound = columnIndexes.numero >= 0 || columnIndexes.objeto >= 0 || 
                        columnIndexes.contratada >= 0 || columnIndexes.valor >= 0 ||
                        columnIndexes.dataInicio >= 0 || columnIndexes.dataTermino >= 0;
  
  if (!essentialFound) {
    console.log(`⚠️ Nenhum campo essencial encontrado na aba "${sheetName}"`);
    return [];
  }
  
  const contracts: Partial<Contract>[] = [];
  const processingStats = {
    totalRows: data.length - 1,
    processedRows: 0,
    successfulDates: 0,
    failedDates: 0,
    warnings: [] as string[]
  };
  
  // FASE 3: PROCESSAR LINHAS DE DADOS
  console.log(`🎯 FASE 3: Processando ${processingStats.totalRows} linhas de dados...`);
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    if (!row || row.length === 0) {
      console.log(`⚠️ Linha ${i} está vazia, pulando`);
      continue;
    }
    
    const hasContent = row.some(cell => cell && String(cell).trim() !== '');
    if (!hasContent) {
      console.log(`⚠️ Linha ${i} não tem conteúdo, pulando`);
      continue;
    }
    
    console.log(`📝 Processando linha ${i}...`);
    processingStats.processedRows++;
    
    try {
      // Extrair dados básicos com parsing melhorado
      const numero = columnIndexes.numero >= 0 ? String(row[columnIndexes.numero] || '').trim() : `${sheetName}-${i}`;
      const objeto = columnIndexes.objeto >= 0 ? String(row[columnIndexes.objeto] || '').trim() : '';
      const contratada = columnIndexes.contratada >= 0 ? String(row[columnIndexes.contratada] || '').trim() : '';
      const valor = columnIndexes.valor >= 0 ? parseValue(row[columnIndexes.valor]) : 0;
      const contratante = columnIndexes.contratante >= 0 ? String(row[columnIndexes.contratante] || '').trim() || 'Órgão Público' : 'Órgão Público';
      const modalidade = columnIndexes.modalidade >= 0 ? parseModalidade(row[columnIndexes.modalidade]) : 'pregao';
      const status = columnIndexes.status >= 0 ? parseStatus(row[columnIndexes.status]) : 'vigente';
      
      // FOCO PRINCIPAL: EXTRAIR DATAS COM MÁXIMA PRECISÃO - CORRIGIDO
      let dataInicio: Date | null = null;
      let dataTermino: Date | null = null;
      
      if (columnIndexes.dataInicio >= 0) {
        const rawStartDate = row[columnIndexes.dataInicio];
        dataInicio = parseAdvancedDate(rawStartDate, spreadsheetType);
        console.log(`📅 Data início linha ${i}: "${rawStartDate}" -> ${dataInicio ? format(dataInicio, 'yyyy-MM-dd') : 'null'}`);
      }
      
      if (columnIndexes.dataTermino >= 0) {
        const rawEndDate = row[columnIndexes.dataTermino];
        dataTermino = parseAdvancedDate(rawEndDate, spreadsheetType);
        console.log(`📅 Data término linha ${i}: "${rawEndDate}" -> ${dataTermino ? format(dataTermino, 'yyyy-MM-dd') : 'null'}`);
      }
      
      // Validar consistência das datas
      const dateValidation = validateDateConsistency(dataInicio, dataTermino);
      
      if (!dateValidation.isValid) {
        console.log(`⚠️ Linha ${i}: Problema nas datas:`, dateValidation.warnings);
        processingStats.warnings.push(`Linha ${i}: ${dateValidation.warnings.join(', ')}`);
        processingStats.failedDates++;
      } else {
        processingStats.successfulDates++;
      }
      
      // Calcular prazo automaticamente se ambas as datas estão disponíveis
      let prazoExecucao = 0;
      let prazoUnidade: 'dias' | 'meses' | 'anos' = 'dias';
      
      if (dataInicio && dataTermino && dateValidation.isValid) {
        const period = calculateContractPeriod(dataInicio, dataTermino);
        prazoExecucao = period.prazo;
        prazoUnidade = period.unidade;
        
        console.log(`⏱️ Prazo calculado linha ${i}: ${prazoExecucao} ${prazoUnidade} (${period.totalDays} dias totais)`);
      }
      
      // Montar observações detalhadas
      let observacoes = `Extraído da planilha "${sheetName}" (${spreadsheetType}) - linha ${i}.`;
      
      if (bestStartColumn) {
        observacoes += ` Data início: coluna "${headers[bestStartColumn.index]}" (confiança ${bestStartColumn.confidence}).`;
      }
      if (bestEndColumn) {
        observacoes += ` Data término: coluna "${headers[bestEndColumn.index]}" (confiança ${bestEndColumn.confidence}).`;
      }
      
      if (dateValidation.warnings.length > 0) {
        observacoes += ` ⚠️ ATENÇÃO: ${dateValidation.warnings.join(', ')}.`;
      }
      
      if (dateValidation.suggestions.length > 0) {
        observacoes += ` Sugestões: ${dateValidation.suggestions.join(', ')}.`;
      }
      
      if (dataInicio && dataTermino && prazoExecucao > 0) {
        observacoes += ` Prazo calculado automaticamente: ${prazoExecucao} ${prazoUnidade}.`;
      }
      
      // Criar contrato
      const contract: Partial<Contract> = {
        numero: numero || `${sheetName}-LINHA-${i}`,
        objeto: objeto || 'Objeto não especificado na planilha',
        contratante,
        contratada: contratada || 'Empresa não especificada',
        valor,
        dataInicio: dataInicio ? format(dataInicio, 'yyyy-MM-dd') : '',
        dataTermino: dataTermino ? format(dataTermino, 'yyyy-MM-dd') : '',
        prazoExecucao,
        prazoUnidade,
        modalidade,
        status,
        observacoes,
        aditivos: [],
        pagamentos: [],
        documentos: []
      };
      
      contracts.push(contract);
      console.log(`✅ Linha ${i}: Contrato criado - ${contract.numero} (${contract.dataInicio} até ${contract.dataTermino})`);
      
    } catch (error) {
      console.error(`❌ Erro ao processar linha ${i}:`, error);
      processingStats.warnings.push(`Linha ${i}: Erro no processamento - ${error}`);
      continue;
    }
  }
  
  // Relatório final
  console.log(`📊 RELATÓRIO FINAL da aba "${sheetName}":`, {
    totalLinhas: processingStats.totalRows,
    linhasProcessadas: processingStats.processedRows,
    contratosGerados: contracts.length,
    datasComSucesso: processingStats.successfulDates,
    datasComProblema: processingStats.failedDates,
    avisos: processingStats.warnings.length
  });
  
  return contracts;
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
