
import { Contract } from '@/types/contract';
import { 
  detectSpreadsheetType, 
  parseAdvancedDate, 
  findDateColumns, 
  calculateContractPeriod,
  validateDateConsistency,
  START_DATE_SYNONYMS,
  END_DATE_SYNONYMS
} from './dateRecognition';
import { format } from 'date-fns';

// Mapeamentos expandidos para outros campos (não-data)
const FIELD_MAPPINGS = {
  numero: [
    'numero', 'número', 'contrato', 'processo', 'num', 'nº', 'number', 
    'código', 'codigo', 'id', 'identificador', 'ref', 'referencia', 
    'referência', 'registro', 'seq', 'sequencial', 'ordem'
  ],
  objeto: [
    'objeto', 'descrição', 'descricao', 'servico', 'serviço', 'description', 
    'item', 'especificação', 'especificacao', 'finalidade', 'escopo', 
    'atividade', 'work', 'service', 'ação', 'acao', 'natureza', 'tipo servico',
    'tipo serviço', 'classificação', 'classificacao', 'categoria'
  ],
  contratante: [
    'contratante', 'orgao', 'órgão', 'cliente', 'solicitante', 'prefeitura', 
    'municipio', 'município', 'government', 'secretaria', 'unidade', 'client',
    'poder público', 'poder publico', 'administração', 'administracao',
    'entidade', 'instituição', 'instituicao'
  ],
  contratada: [
    'contratada', 'empresa', 'fornecedor', 'prestador', 'supplier', 'cnpj', 
    'razao social', 'razão social', 'licitante', 'vencedora', 'contractor', 
    'vendor', 'participante', 'proponente', 'adjudicatária', 'adjudicataria',
    'firma', 'companhia', 'corporação', 'corporacao'
  ],
  valor: [
    'valor', 'preco', 'preço', 'price', 'amount', 'total', 'custo', 'montante', 
    'quantia', 'valor total', 'valor global', 'valor estimado', 'valor contratado', 
    'preço final', 'valor final', 'r$', 'reais', 'money', 'cost', 'importância',
    'importancia', 'soma', 'monta', 'orçamento', 'orcamento'
  ],
  modalidade: [
    'modalidade', 'tipo', 'licitacao', 'licitação', 'modality', 'forma', 
    'processo', 'categoria', 'tipo licitacao', 'tipo licitação', 'method',
    'regime', 'procedimento', 'meio', 'modo'
  ],
  status: [
    'status', 'situacao', 'situação', 'estado', 'state', 'condição', 'condicao', 
    'situação atual', 'situacao atual', 'condition', 'fase', 'etapa',
    'posição', 'posicao', 'circunstância', 'circunstancia'
  ]
};

// Mapeamentos de valores
const STATUS_MAPPINGS: Record<string, 'vigente' | 'suspenso' | 'encerrado' | 'rescindido'> = {
  'vigente': 'vigente', 'ativo': 'vigente', 'em andamento': 'vigente', 'ativa': 'vigente', 
  'válido': 'vigente', 'valido': 'vigente', 'executando': 'vigente', 'andamento': 'vigente',
  'suspenso': 'suspenso', 'pausado': 'suspenso', 'interrompido': 'suspenso', 'parado': 'suspenso',
  'encerrado': 'encerrado', 'finalizado': 'encerrado', 'concluído': 'encerrado', 
  'concluido': 'encerrado', 'terminado': 'encerrado', 'acabado': 'encerrado',
  'rescindido': 'rescindido', 'cancelado': 'rescindido', 'anulado': 'rescindido', 'revogado': 'rescindido'
};

const MODALIDADE_MAPPINGS: Record<string, 'pregao' | 'concorrencia' | 'tomada_precos' | 'convite' | 'concurso' | 'leilao'> = {
  'pregão': 'pregao', 'pregao': 'pregao',
  'concorrência': 'concorrencia', 'concorrencia': 'concorrencia',
  'tomada de preços': 'tomada_precos', 'tomada de precos': 'tomada_precos', 
  'tomada preços': 'tomada_precos', 'tomada precos': 'tomada_precos',
  'convite': 'convite', 'concurso': 'concurso',
  'leilão': 'leilao', 'leilao': 'leilao'
};

// Função para normalizar texto de busca
function normalizeValue(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Função para encontrar coluna por mapeamento
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

// Função para parsear valores monetários
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
  } else if (lowerValue.includes('milhão') || lowerValue.includes('milhao') || 
             lowerValue.includes('mi') || lowerValue.endsWith('m')) {
    multiplier = 1000000;
  }
  
  // Limpar valor
  let cleanValue = stringValue
    .replace(/[^\d,.-]/g, '')
    .replace(/^[,.-]+|[,.-]+$/g, '')
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
      cleanValue = cleanValue.replace(',', '.');
    } else {
      cleanValue = cleanValue.replace(/,/g, '');
    }
  }
  
  const parsed = parseFloat(cleanValue) * multiplier;
  const result = isNaN(parsed) ? 0 : Math.max(0, parsed);
  
  console.log(`💰 Valor parseado: "${stringValue}" -> ${result}`);
  return result;
}

// Função para parsear status
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

// Função para parsear modalidade
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

// Função principal de extração inteligente
export function extractContractFromSpreadsheetDataIntelligent(
  data: any[][], 
  sheetName: string, 
  fileName: string = ''
): Partial<Contract>[] {
  console.log(`🚀 EXTRAÇÃO INTELIGENTE: Aba "${sheetName}" com ${data.length} linhas`);
  
  if (data.length < 2) {
    console.log(`⚠️ Aba "${sheetName}" possui poucos dados (${data.length} linhas)`);
    return [];
  }
  
  // Detectar tipo de planilha
  const spreadsheetType = detectSpreadsheetType(data, fileName);
  console.log(`📊 Tipo de planilha detectado: ${spreadsheetType}`);
  
  // Primeira linha como cabeçalho
  const headers = data[0].map(h => String(h || '').trim()).filter(h => h);
  console.log(`📋 Cabeçalhos encontrados:`, headers);
  
  if (headers.length === 0) {
    console.log(`❌ Nenhum cabeçalho válido encontrado na aba "${sheetName}"`);
    return [];
  }
  
  // FASE 1: BUSCAR COLUNAS DE DATA PRIMEIRO (PRIORIDADE MÁXIMA)
  console.log(`🎯 FASE 1: Buscando colunas de data...`);
  const { startDateColumns, endDateColumns } = findDateColumns(headers);
  
  // Selecionar as melhores colunas de data
  const bestStartColumn = startDateColumns.length > 0 ? startDateColumns[0] : null;
  const bestEndColumn = endDateColumns.length > 0 ? endDateColumns[0] : null;
  
  console.log(`📅 Colunas de data selecionadas:`, {
    inicio: bestStartColumn ? `${headers[bestStartColumn.index]} (${bestStartColumn.confidence})` : 'Não encontrada',
    fim: bestEndColumn ? `${headers[bestEndColumn.index]} (${bestEndColumn.confidence})` : 'Não encontrada'
  });
  
  // FASE 2: BUSCAR OUTRAS COLUNAS
  console.log(`🎯 FASE 2: Buscando outras colunas...`);
  const columnIndexes = {
    numero: findColumnIndex(headers, FIELD_MAPPINGS.numero),
    objeto: findColumnIndex(headers, FIELD_MAPPINGS.objeto),
    contratante: findColumnIndex(headers, FIELD_MAPPINGS.contratante),
    contratada: findColumnIndex(headers, FIELD_MAPPINGS.contratada),
    valor: findColumnIndex(headers, FIELD_MAPPINGS.valor),
    modalidade: findColumnIndex(headers, FIELD_MAPPINGS.modalidade),
    status: findColumnIndex(headers, FIELD_MAPPINGS.status),
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
      // Extrair dados básicos
      const numero = columnIndexes.numero >= 0 ? String(row[columnIndexes.numero] || '').trim() : `${sheetName}-${i}`;
      const objeto = columnIndexes.objeto >= 0 ? String(row[columnIndexes.objeto] || '').trim() : '';
      const contratada = columnIndexes.contratada >= 0 ? String(row[columnIndexes.contratada] || '').trim() : '';
      const valor = columnIndexes.valor >= 0 ? parseValue(row[columnIndexes.valor]) : 0;
      const contratante = columnIndexes.contratante >= 0 ? String(row[columnIndexes.contratante] || '').trim() || 'Órgão Público' : 'Órgão Público';
      const modalidade = columnIndexes.modalidade >= 0 ? parseModalidade(row[columnIndexes.modalidade]) : 'pregao';
      const status = columnIndexes.status >= 0 ? parseStatus(row[columnIndexes.status]) : 'vigente';
      
      // FOCO PRINCIPAL: EXTRAIR DATAS COM MÁXIMA PRECISÃO
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
        dataInicio: dataInicio ? format(dataInicio, 'yyyy-MM-dd') : '', // Pode ficar vazio
        dataTermino: dataTermino ? format(dataTermino, 'yyyy-MM-dd') : '', // Pode ficar vazio
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
