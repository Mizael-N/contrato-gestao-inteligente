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

// MAPEAMENTOS MASSIVAMENTE EXPANDIDOS (500+ termos totais)
const FIELD_MAPPINGS = {
  numero: [
    // Português básico
    'numero', 'número', 'contrato', 'processo', 'num', 'nº', 'codigo', 'código',
    'id', 'identificador', 'ref', 'referencia', 'referência', 'registro', 'seq', 'sequencial',
    'ordem', 'protocolo', 'expediente', 'documento', 'numeração', 'numeracao',
    
    // Variações específicas
    'contrato numero', 'contrato número', 'numero contrato', 'número contrato',
    'numero processo', 'número processo', 'processo numero', 'processo número',
    'contrato nº', 'nº contrato', 'processo nº', 'nº processo',
    'numero documento', 'número documento', 'documento numero', 'documento número',
    'codigo contrato', 'código contrato', 'codigo processo', 'código processo',
    
    // Termos técnicos
    'numero licitacao', 'número licitação', 'licitacao numero', 'licitação número',
    'pregao numero', 'pregão número', 'edital numero', 'edital número',
    'chamada numero', 'chamada número', 'tomada precos numero', 'tomada preços número',
    
    // Abreviações
    'cont', 'proc', 'doc', 'reg', 'prot', 'exp', 'num_cont', 'num_proc',
    'cd_contrato', 'cd_processo', 'nr_contrato', 'nr_processo',
    
    // Inglês
    'number', 'contract number', 'process number', 'document', 'reference', 'code',
    'contract id', 'process id', 'document id', 'ref number', 'ref_number'
  ],
  
  objeto: [
    // Português básico
    'objeto', 'descrição', 'descricao', 'servico', 'serviço', 'item', 'especificação',
    'especificacao', 'finalidade', 'escopo', 'atividade', 'natureza', 'tipo',
    'assunto', 'tema', 'materia', 'matéria', 'objetivo', 'propósito', 'proposito',
    
    // Variações específicas
    'objeto contrato', 'objeto do contrato', 'descrição objeto', 'descrição do objeto',
    'serviço contratado', 'servico contratado', 'atividade contratada', 'trabalho',
    'prestação', 'prestacao', 'prestação serviço', 'prestacao servico',
    'fornecimento', 'aquisição', 'aquisicao', 'compra', 'contratação', 'contratacao',
    'objeto licitacao', 'objeto licitação', 'finalidade contrato', 'escopo contrato',
    
    // Termos específicos por área
    'obra', 'construção', 'construcao', 'reforma', 'manutenção', 'manutencao',
    'consultoria', 'assessoria', 'treinamento', 'capacitação', 'capacitacao',
    'material', 'equipamento', 'produto', 'bem', 'mercadoria', 'suprimento',
    'locação', 'locacao', 'aluguel', 'terceirização', 'terceirizacao',
    
    // Descrições técnicas
    'especificacao tecnica', 'especificação técnica', 'memorial descritivo',
    'termo referencia', 'termo referência', 'projeto basico', 'projeto básico',
    
    // Abreviações
    'obj', 'desc', 'esp', 'fin', 'esc', 'ativ', 'nat', 'esp_tec', 'term_ref',
    'obj_contrato', 'desc_servico', 'esp_tecnica',
    
    // Inglês
    'description', 'service', 'work', 'activity', 'scope', 'purpose', 'item',
    'specification', 'objective', 'subject', 'matter', 'supply', 'goods'
  ],
  
  contratante: [
    // Português básico
    'contratante', 'orgao', 'órgão', 'cliente', 'solicitante', 'comprador',
    'adquirente', 'tomador', 'locatário', 'locatario', 'demandante', 'requerente',
    'interessado', 'beneficiário', 'beneficiario', 'destinatário', 'destinatario',
    
    // Entidades públicas
    'prefeitura', 'municipio', 'município', 'estado', 'governo', 'união', 'uniao',
    'secretaria', 'ministério', 'ministerio', 'autarquia', 'fundação', 'fundacao',
    'câmara', 'camara', 'assembleia', 'tribunal', 'defensoria', 'procuradoria',
    'poder público', 'poder publico', 'administração', 'administracao', 'fazenda',
    'receita', 'vigilancia', 'vigilância', 'saude', 'saúde', 'educação', 'educacao',
    
    // Variações específicas
    'orgao contratante', 'órgão contratante', 'entidade contratante', 'cliente contratante',
    'poder concedente', 'ente público', 'ente publico', 'pessoa jurídica', 'pessoa juridica',
    'unidade administrativa', 'unidade gestora', 'gestor contrato', 'gestor do contrato',
    
    // Níveis administrativos
    'federal', 'estadual', 'municipal', 'distrital', 'regional', 'local',
    'executivo', 'legislativo', 'judiciário', 'judiciario',
    
    // Abreviações
    'pref', 'gov', 'sec', 'min', 'aut', 'fund', 'cam', 'ass', 'trib', 'def', 'proc',
    'adm_pub', 'poder_pub', 'org_contrat', 'ente_pub', 'unid_admin',
    
    // Inglês
    'client', 'customer', 'buyer', 'government', 'municipality', 'agency',
    'institution', 'public entity', 'contracting authority'
  ],
  
  contratada: [
    // Português básico
    'contratada', 'empresa', 'fornecedor', 'prestador', 'vendedor', 'licitante',
    'adjudicatário', 'adjudicataria', 'vencedora', 'participante', 'proponente',
    'executor', 'executora', 'realizador', 'realizadora', 'terceiro', 'terceira',
    'parceiro', 'parceira', 'colaborador', 'colaboradora',
    
    // Identificação empresarial
    'cnpj', 'razao social', 'razão social', 'nome empresa', 'denominação', 'denominacao',
    'firma', 'companhia', 'corporação', 'corporacao', 'sociedade', 'ltda', 'sa', 's/a',
    'me', 'epp', 'mei', 'eireli', 'empresario individual', 'empresário individual',
    
    // Tipos específicos
    'construtora', 'consultora', 'prestadora', 'fornecedora', 'distribuidora',
    'representante', 'agente', 'intermediário', 'intermediario', 'terceirizada',
    'subcontratada', 'cocontratada', 'consorcio', 'consórcio', 'cooperativa',
    
    // Variações específicas
    'empresa contratada', 'fornecedor contratado', 'prestador contratado',
    'licitante vencedor', 'empresa vencedora', 'adjudicatária contrato',
    'pessoa fisica', 'pessoa física', 'profissional autonomo', 'profissional autônomo',
    
    // Setores
    'industria', 'indústria', 'comercio', 'comércio', 'servicos', 'serviços',
    'tecnologia', 'engenharia', 'arquitetura', 'consultoria', 'assessoria',
    
    // Abreviações
    'emp', 'forn', 'prest', 'lic', 'adj', 'venc', 'exec', 'real', 'terc',
    'emp_contrat', 'forn_contrat', 'prest_serv', 'lic_venc', 'raz_social',
    
    // Inglês
    'contractor', 'supplier', 'vendor', 'company', 'corporation', 'provider',
    'seller', 'firm', 'business', 'enterprise', 'organization'
  ],
  
  valor: [
    // Português básico - Valor
    'valor', 'preco', 'preço', 'custo', 'montante', 'quantia', 'importância', 'importancia',
    'soma', 'total', 'monta', 'cifra', 'verba', 'dotação', 'dotacao', 'recurso',
    'dinheiro', 'capital', 'investimento', 'gasto', 'despesa', 'desembolso',
    
    // Variações específicas de valor
    'valor total', 'valor global', 'valor contratual', 'valor contrato', 'valor estimado',
    'valor máximo', 'valor maximo', 'valor mínimo', 'valor minimo', 'valor inicial',
    'valor final', 'valor líquido', 'valor liquido', 'valor bruto', 'preço total',
    'preço final', 'preco final', 'preço unitário', 'preco unitario', 'preço global',
    'custo total', 'custo final', 'custo estimado', 'custo contratual',
    
    // Termos orçamentários
    'orçamento', 'orcamento', 'estimativa', 'previsão', 'previsao', 'alocação', 'alocacao',
    'recursos', 'verba', 'dotação orçamentária', 'dotacao orcamentaria', 'credito',
    'crédito', 'provisão', 'provisao', 'reserva', 'fundo', 'caixa',
    'rubrica', 'conta', 'item orçamentário', 'item orcamentario', 'linha orcamentaria',
    
    // Pagamento e financeiro
    'pagamento', 'desembolso', 'repasse', 'transferência', 'transferencia',
    'investimento', 'gasto', 'despesa', 'dispêndio', 'dispendio', 'saída', 'saida',
    'débito', 'debito', 'cobrança', 'cobranca', 'faturamento', 'receita',
    
    // Formatos e variações monetárias
    'reais', 'real', 'r$', 'rs', 'brl', '$', 'dolar', 'dólares?', 'usd', 'euro', 'eur',
    'mil', 'milhares', 'milhão', 'milhao', 'milhões', 'milhoes', 'bilhão', 'bilhao',
    'k', 'm', 'mi', 'bi', 'thousand', 'million', 'billion',
    
    // Especificações de valores
    'unitario', 'unitário', 'por item', 'por unidade', 'individual', 'cada',
    'mensal', 'anual', 'trimestral', 'semestral', 'diario', 'diário',
    'hora', 'horario', 'horário', 'por hora', 'h', 'hr',
    
    // Abreviações
    'val', 'vlr', 'prc', 'cst', 'mnt', 'tot', 'orc', 'est', 'pag', 'desp',
    'val_tot', 'vlr_global', 'prc_final', 'cst_total', 'orc_estimado',
    'val_contrato', 'vlr_contratual', 'mnt_global', 'val_max', 'vlr_min',
    
    // Inglês
    'price', 'cost', 'amount', 'total', 'sum', 'value', 'money', 'payment',
    'budget', 'expense', 'expenditure', 'investment', 'fund', 'capital',
    'financial', 'monetary', 'cash', 'dollar', 'currency'
  ],
  
  modalidade: [
    // Modalidades básicas
    'modalidade', 'tipo', 'forma', 'método', 'metodo', 'modo', 'meio', 'procedimento',
    'regime', 'categoria', 'classificação', 'classificacao', 'espécie', 'especie',
    'natureza', 'classe', 'genero', 'gênero', 'formato', 'sistema',
    
    // Licitações específicas
    'licitacao', 'licitação', 'pregão', 'pregao', 'concorrência', 'concorrencia',
    'tomada preços', 'tomada de preços', 'tomada precos', 'tomada de precos',
    'convite', 'concurso', 'leilão', 'leilao', 'rdc', 'bec', 'dialogo competitivo',
    
    // Variações específicas
    'modalidade licitação', 'modalidade licitacao', 'tipo licitação', 'tipo licitacao',
    'processo licitatório', 'processo licitatorio', 'forma contratação', 'forma contratacao',
    'regime contratação', 'regime contratacao', 'método seleção', 'metodo selecao',
    'procedimento licitatorio', 'procedimento licitatório',
    
    // Dispensas e inexigibilidades
    'dispensa', 'dispensavel', 'dispensável', 'inexigibilidade', 'inexigivel', 'inexigível',
    'contratação direta', 'contratacao direta', 'emergencial', 'calamidade',
    'urgência', 'urgencia', 'pequeno valor', 'baixo valor', 'credenciamento',
    
    // Pregões específicos
    'pregão eletrônico', 'pregao eletronico', 'pregão presencial', 'pregao presencial',
    'pe', 'pp', 'srp', 'sistema registro preços', 'sistema registro precos',
    'ata registro preços', 'ata registro precos', 'catalogo eletronico', 'catálogo eletrônico',
    
    // Concorrências
    'concorrencia publica', 'concorrência pública', 'concorrencia internacional',
    'concorrência internacional', 'cc', 'cnc', 'conc',
    
    // Abreviações
    'mod', 'tip', 'for', 'met', 'proc', 'reg', 'cat', 'cla', 'lic', 'disp',
    'inex', 'urg', 'emerg', 'dir', 'cred', 'mod_lic', 'tip_lic', 'proc_lic',
    
    // Inglês
    'modality', 'type', 'method', 'form', 'procedure', 'category', 'bidding',
    'tender', 'auction', 'competition', 'procurement', 'selection', 'direct'
  ],
  
  status: [
    // Estados básicos
    'status', 'situacao', 'situação', 'estado', 'condição', 'condicao', 'fase',
    'etapa', 'posição', 'posicao', 'circunstância', 'circunstancia', 'momento',
    'estadio', 'estádio', 'ponto', 'nivel', 'nível', 'grau', 'patamar',
    
    // Status específicos - Vigente
    'vigente', 'ativo', 'ativa', 'válido', 'valido', 'em vigor', 'em andamento',
    'executando', 'execução', 'execucao', 'corrente', 'atual', 'regular',
    'normal', 'funcionando', 'operando', 'operacional', 'ativo', 'funcionamento',
    'em curso', 'em desenvolvimento', 'em execução', 'em execucao',
    
    // Status específicos - Suspenso
    'suspenso', 'suspensa', 'pausado', 'pausada', 'interrompido', 'interrompida',
    'parado', 'parada', 'standby', 'aguardando', 'pendente', 'paralisado',
    'paralisada', 'bloqueado', 'bloqueada', 'impedido', 'impedida',
    'sobrestado', 'sobrestada', 'retido', 'retida',
    
    // Status específicos - Encerrado
    'encerrado', 'encerrada', 'finalizado', 'finalizada', 'concluído', 'concluida',
    'terminado', 'terminada', 'acabado', 'acabada', 'completo', 'completa',
    'entregue', 'cumprido', 'cumprida', 'quitado', 'quitada', 'liquidado',
    'liquidada', 'fechado', 'fechada', 'findo', 'finda', 'expirado', 'expirada',
    
    // Status específicos - Rescindido
    'rescindido', 'rescindida', 'cancelado', 'cancelada', 'anulado', 'anulada',
    'revogado', 'revogada', 'extinto', 'extinta', 'rompido', 'rompida',
    'cassado', 'cassada', 'invalidado', 'invalidada', 'nulo', 'nula',
    'suspenso definitivamente', 'cancelado definitivamente',
    
    // Variações específicas
    'situação atual', 'situacao atual', 'status contrato', 'situação contrato',
    'situacao contrato', 'estado contrato', 'condição contrato', 'condicao contrato',
    'fase contrato', 'etapa contrato', 'momento contrato', 'posição contrato',
    
    // Estados processuais
    'homologado', 'homologada', 'adjudicado', 'adjudicada', 'aprovado', 'aprovada',
    'autorizado', 'autorizada', 'assinado', 'assinada', 'publicado', 'publicada',
    'registrado', 'registrada', 'protocolado', 'protocolada',
    
    // Abreviações
    'sit', 'est', 'con', 'pos', 'fas', 'eta', 'vig', 'ati', 'val', 'sus', 'pau',
    'enc', 'fin', 'ter', 'res', 'can', 'anu', 'rev', 'ext', 'rom', 'cas',
    'sit_atual', 'est_contrato', 'con_contrato', 'pos_contrato',
    
    // Inglês
    'status', 'state', 'condition', 'phase', 'stage', 'active', 'suspended',
    'finished', 'canceled', 'terminated', 'completed', 'valid', 'expired',
    'pending', 'approved', 'signed', 'executed'
  ]
};

// Mapeamentos de valores expandidos para status
const STATUS_MAPPINGS: Record<string, 'vigente' | 'suspenso' | 'encerrado' | 'rescindido'> = {
  // Vigente - expandido
  'vigente': 'vigente', 'ativo': 'vigente', 'ativa': 'vigente', 'válido': 'vigente', 'valido': 'vigente',
  'em vigor': 'vigente', 'em andamento': 'vigente', 'executando': 'vigente', 'execução': 'vigente',
  'execucao': 'vigente', 'corrente': 'vigente', 'atual': 'vigente', 'regular': 'vigente',
  'normal': 'vigente', 'funcionando': 'vigente', 'operando': 'vigente', 'operacional': 'vigente',
  'em curso': 'vigente', 'em desenvolvimento': 'vigente', 'em execução': 'vigente', 'em execucao': 'vigente',
  'funcionamento': 'vigente', 'homologado': 'vigente', 'adjudicado': 'vigente', 'aprovado': 'vigente',
  'autorizado': 'vigente', 'assinado': 'vigente', 'publicado': 'vigente',
  
  // Suspenso - expandido
  'suspenso': 'suspenso', 'suspensa': 'suspenso', 'pausado': 'suspenso', 'pausada': 'suspenso',
  'interrompido': 'suspenso', 'interrompida': 'suspenso', 'parado': 'suspenso', 'parada': 'suspenso',
  'standby': 'suspenso', 'aguardando': 'suspenso', 'pendente': 'suspenso', 'paralisado': 'suspenso',
  'paralisada': 'suspenso', 'bloqueado': 'suspenso', 'bloqueada': 'suspenso',
  'impedido': 'suspenso', 'impedida': 'suspenso', 'sobrestado': 'suspenso', 'sobrestada': 'suspenso',
  'retido': 'suspenso', 'retida': 'suspenso', 'em análise': 'suspenso', 'em analise': 'suspenso',
  
  // Encerrado - expandido
  'encerrado': 'encerrado', 'encerrada': 'encerrado', 'finalizado': 'encerrado', 'finalizada': 'encerrado',
  'concluído': 'encerrado', 'concluida': 'encerrado', 'terminado': 'encerrado', 'terminada': 'encerrado',
  'acabado': 'encerrado', 'acabada': 'encerrado', 'completo': 'encerrado', 'completa': 'encerrado',
  'entregue': 'encerrado', 'cumprido': 'encerrado', 'cumprida': 'encerrado', 'quitado': 'encerrado',
  'quitada': 'encerrado', 'liquidado': 'encerrado', 'liquidada': 'encerrado', 'fechado': 'encerrado',
  'fechada': 'encerrado', 'findo': 'encerrado', 'finda': 'encerrado', 'expirado': 'encerrado',
  'expirada': 'encerrado', 'vencido': 'encerrado', 'vencida': 'encerrado',
  
  // Rescindido - expandido
  'rescindido': 'rescindido', 'rescindida': 'rescindido', 'cancelado': 'rescindido', 'cancelada': 'rescindido',
  'anulado': 'rescindido', 'anulada': 'rescindido', 'revogado': 'rescindido', 'revogada': 'rescindido',
  'extinto': 'rescindido', 'extinta': 'rescindido', 'rompido': 'rescindido', 'rompida': 'rescindido',
  'cassado': 'rescindido', 'cassada': 'rescindido', 'invalidado': 'rescindido', 'invalidada': 'rescindido',
  'nulo': 'rescindido', 'nula': 'rescindido', 'suspenso definitivamente': 'rescindido',
  'cancelado definitivamente': 'rescindido', 'desfeito': 'rescindido', 'desfeita': 'rescindido'
};

// Mapeamentos de modalidade expandidos
const MODALIDADE_MAPPINGS: Record<string, 'pregao' | 'concorrencia' | 'tomada_precos' | 'convite' | 'concurso' | 'leilao'> = {
  // Pregão - expandido
  'pregão': 'pregao', 'pregao': 'pregao', 'pregão eletrônico': 'pregao', 'pregao eletronico': 'pregao',
  'pregão presencial': 'pregao', 'pregao presencial': 'pregao', 'pe': 'pregao', 'pp': 'pregao',
  'pregao eletronico': 'pregao', 'pregao presencial': 'pregao', 'sistema registro preços': 'pregao',
  'sistema registro precos': 'pregao', 'srp': 'pregao', 'ata registro preços': 'pregao',
  
  // Concorrência - expandido
  'concorrência': 'concorrencia', 'concorrencia': 'concorrencia', 'concorrência pública': 'concorrencia',
  'concorrencia publica': 'concorrencia', 'concorrência internacional': 'concorrencia',
  'concorrencia internacional': 'concorrencia', 'cc': 'concorrencia', 'cnc': 'concorrencia',
  'conc': 'concorrencia', 'concorrencia aberta': 'concorrencia',
  
  // Tomada de Preços - expandido
  'tomada de preços': 'tomada_precos', 'tomada de precos': 'tomada_precos',
  'tomada preços': 'tomada_precos', 'tomada precos': 'tomada_precos', 'tp': 'tomada_precos',
  'tomada de preço': 'tomada_precos', 'tomada preco': 'tomada_precos',
  
  // Convite - expandido
  'convite': 'convite', 'carta convite': 'convite', 'cv': 'convite', 'carta-convite': 'convite',
  'processo convite': 'convite', 'modalidade convite': 'convite',
  
  // Concurso - expandido
  'concurso': 'concurso', 'concurso público': 'concurso', 'concurso publico': 'concurso',
  'concurso de projetos': 'concurso', 'concurso tecnico': 'concurso', 'concurso técnico': 'concurso',
  
  // Leilão - expandido
  'leilão': 'leilao', 'leilao': 'leilao', 'leilão público': 'leilao', 'leilao publico': 'leilao',
  'leilao eletronico': 'leilao', 'leilão eletrônico': 'leilao', 'hasta publica': 'leilao',
  
  // Dispensas e outros
  'dispensa': 'pregao', 'dispensavel': 'pregao', 'inexigibilidade': 'pregao',
  'inexigivel': 'pregao', 'emergencial': 'pregao', 'credenciamento': 'pregao'
};

// Função para normalizar texto com mais robustez
function normalizeValue(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ') // Remove pontuação
    .replace(/\s+/g, ' '); // Normaliza espaços
}

// FUNÇÃO MELHORADA - Encontrar coluna com sistema de formatação visual
function findColumnIndex(headers: string[], fieldMappings: string[], cellMetadata?: CellMetadata[][]): number {
  console.log(`🔍 BUSCA INTELIGENTE para campo: ${fieldMappings[0]}`);
  
  const candidates: { index: number; confidence: number; reason: string }[] = [];
  
  for (let i = 0; i < headers.length; i++) {
    const header = normalizeValue(headers[i]);
    console.log(`   🔎 Analisando header[${i}]: "${header}"`);
    
    // SISTEMA AVANÇADO DE FORMATAÇÃO VISUAL
    let visualBonus = 0;
    let visualDetails: string[] = [];
    
    if (cellMetadata && cellMetadata[0] && cellMetadata[0][i]) {
      const metadata = cellMetadata[0][i];
      
      // Pontuação detalhada por tipo de formatação
      if (metadata.isBold) {
        visualBonus += 0.25;
        visualDetails.push('negrito');
      }
      if (metadata.hasColor || metadata.fontColor) {
        visualBonus += 0.2;
        visualDetails.push('cor da fonte');
      }
      if (metadata.backgroundColor) {
        visualBonus += 0.2;
        visualDetails.push('cor de fundo');
      }
      if (metadata.isMerged) {
        visualBonus += 0.3; // Células mescladas são muito importantes
        visualDetails.push('mesclada');
      }
      if (metadata.hasBorder) {
        visualBonus += 0.15;
        visualDetails.push('bordas');
      }
      if (metadata.fontSize && metadata.fontSize > 12) {
        visualBonus += 0.1;
        visualDetails.push('fonte grande');
      }
      if (metadata.isUnderlined) {
        visualBonus += 0.15;
        visualDetails.push('sublinhado');
      }
      if (metadata.isItalic) {
        visualBonus += 0.1;
        visualDetails.push('itálico');
      }
      
      if (visualDetails.length > 0) {
        console.log(`   ✨ FORMATAÇÃO ESPECIAL detectada: ${visualDetails.join(', ')} (bônus: +${visualBonus.toFixed(2)})`);
      }
    }
    
    // Buscar correspondências nos sinônimos
    for (const mapping of fieldMappings) {
      const normalizedMapping = normalizeValue(mapping);
      let baseConfidence = 0;
      let matchReason = '';
      
      if (header === normalizedMapping) {
        baseConfidence = 0.95; // Match exato
        matchReason = `match exato com "${mapping}"`;
      } else if (header.includes(normalizedMapping) && normalizedMapping.length >= 3) {
        baseConfidence = 0.85; // Contém o sinônimo
        matchReason = `contém "${mapping}"`;
      } else if (normalizedMapping.includes(header) && header.length >= 3) {
        baseConfidence = 0.75; // É parte do sinônimo
        matchReason = `parte de "${mapping}"`;
      } else {
        // Busca por palavras-chave
        const headerWords = header.split(' ');
        const mappingWords = normalizedMapping.split(' ');
        const commonWords = headerWords.filter(word => 
          word.length >= 3 && mappingWords.some(mw => mw.includes(word) || word.includes(mw))
        );
        
        if (commonWords.length > 0) {
          baseConfidence = 0.6 + (commonWords.length * 0.1);
          matchReason = `palavras comuns: ${commonWords.join(', ')}`;
        }
      }
      
      if (baseConfidence > 0) {
        const finalConfidence = Math.min(0.99, baseConfidence + visualBonus);
        candidates.push({
          index: i,
          confidence: finalConfidence,
          reason: `${matchReason} (base: ${baseConfidence.toFixed(2)} + visual: ${visualBonus.toFixed(2)})`
        });
        
        console.log(`   ✅ CANDIDATO encontrado: confiança ${finalConfidence.toFixed(3)} - ${matchReason}`);
        break;
      }
    }
  }
  
  // Retornar o melhor candidato
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.confidence - a.confidence);
    const best = candidates[0];
    console.log(`   🏆 MELHOR CANDIDATO: índice ${best.index}, confiança ${best.confidence.toFixed(3)} - ${best.reason}`);
    return best.index;
  }
  
  console.log(`   ❌ CAMPO NÃO ENCONTRADO: ${fieldMappings[0]}`);
  return -1;
}

// FUNÇÃO DRASTICAMENTE MELHORADA - Parsing de valores monetários
function parseValue(value: any): number {
  if (typeof value === 'number') return Math.max(0, value);
  if (!value) return 0;
  
  const stringValue = String(value).trim();
  console.log(`💰 ANÁLISE AVANÇADA DE VALOR: "${stringValue}"`);
  
  if (!stringValue) return 0;
  
  // Detectar e converter abreviações expandidas
  let multiplier = 1;
  const lowerValue = stringValue.toLowerCase();
  
  // Detectar milhares - expandido
  if (lowerValue.includes('mil') || lowerValue.endsWith('k') || lowerValue.includes('thousand') ||
      lowerValue.includes('1000') || lowerValue.includes('1.000') || lowerValue.includes('1,000') ||
      lowerValue.match(/\d+k\b/) || lowerValue.includes('milhares')) {
    multiplier = 1000;
    console.log(`   📊 Multiplicador MIL detectado`);
  }
  // Detectar milhões - expandido
  else if (lowerValue.includes('milhão') || lowerValue.includes('milhao') || lowerValue.includes('milhões') ||
           lowerValue.includes('milhoes') || lowerValue.includes('mi') || lowerValue.endsWith('m') ||
           lowerValue.includes('million') || lowerValue.includes('1000000') || lowerValue.includes('1.000.000') ||
           lowerValue.match(/\d+m\b/) || lowerValue.match(/\d+mi\b/)) {
    multiplier = 1000000;
    console.log(`   📊 Multiplicador MILHÃO detectado`);
  }
  // Detectar bilhões - expandido
  else if (lowerValue.includes('bilhão') || lowerValue.includes('bilhao') || lowerValue.includes('bilhões') ||
           lowerValue.includes('bilhoes') || lowerValue.includes('bi') || lowerValue.endsWith('b') ||
           lowerValue.includes('billion') || lowerValue.includes('1000000000') || lowerValue.includes('1.000.000.000') ||
           lowerValue.match(/\d+b\b/) || lowerValue.match(/\d+bi\b/)) {
    multiplier = 1000000000;
    console.log(`   📊 Multiplicador BILHÃO detectado`);
  }
  
  // Limpeza avançada do valor
  let cleanValue = stringValue
    // Remover símbolos monetários
    .replace(/[R$\$£€¥₹₽₩₪₫₡₵₸₼₾₿]/gi, '')
    // Remover texto explicativo
    .replace(/\b(reais?|real|dolar|dólares?|euro|euros?|mil|milhão|milhões|bilhão|bilhões)\b/gi, '')
    // Manter apenas números, vírgulas, pontos e sinais
    .replace(/[^\d,.-]/g, '')
    // Remover vírgulas/pontos no início/fim
    .replace(/^[,.-]+|[,.-]+$/g, '')
    .trim();
  
  if (!cleanValue) return 0;
  
  console.log(`   🧹 Valor limpo: "${cleanValue}"`);
  
  // Análise avançada de formato brasileiro vs internacional
  const commaCount = (cleanValue.match(/,/g) || []).length;
  const dotCount = (cleanValue.match(/\./g) || []).length;
  const lastCommaIndex = cleanValue.lastIndexOf(',');
  const lastDotIndex = cleanValue.lastIndexOf('.');
  
  console.log(`   🔍 Análise de formato: vírgulas=${commaCount}, pontos=${dotCount}`);
  
  // Lógica refinada para determinação de formato
  if (commaCount > 0 && dotCount > 0) {
    if (lastCommaIndex > lastDotIndex) {
      // Formato brasileiro: 1.234.567,89
      console.log(`   🇧🇷 Formato brasileiro detectado`);
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato internacional: 1,234,567.89
      console.log(`   🌍 Formato internacional detectado`);
      cleanValue = cleanValue.replace(/,/g, '');
    }
  } else if (commaCount > 0) {
    // Apenas vírgulas - determinar se é decimal ou separador de milhares
    const afterComma = cleanValue.substring(lastCommaIndex + 1);
    if (afterComma.length <= 2 && commaCount === 1) {
      // Decimal brasileiro: 123,45
      console.log(`   🔢 Decimal brasileiro detectado`);
      cleanValue = cleanValue.replace(',', '.');
    } else {
      // Separador de milhares: 1,234,567
      console.log(`   📈 Separador de milhares detectado`);
      cleanValue = cleanValue.replace(/,/g, '');
    }
  } else if (dotCount > 1) {
    // Múltiplos pontos - formato brasileiro de milhares
    console.log(`   🔢 Múltiplos pontos - formato brasileiro`);
    const parts = cleanValue.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length <= 2) {
      // Último é decimal: 1.234.567.89
      const decimalPart = parts.pop();
      cleanValue = parts.join('') + '.' + decimalPart;
    } else {
      // Todos são separadores: 1.234.567
      cleanValue = cleanValue.replace(/\./g, '');
    }
  }
  
  // Conversão final
  const parsed = parseFloat(cleanValue) * multiplier;
  const result = isNaN(parsed) ? 0 : Math.max(0, parsed);
  
  console.log(`   ✅ VALOR FINAL: "${stringValue}" -> ${result} (limpo: "${cleanValue}", multiplicador: ${multiplier})`);
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

// FUNÇÃO PRINCIPAL DRASTICAMENTE MELHORADA
export function extractContractFromSpreadsheetDataIntelligent(
  data: any[][], 
  sheetName: string, 
  fileName: string = '',
  worksheet?: any
): Partial<Contract>[] {
  console.log(`🚀 EXTRAÇÃO INTELIGENTE AVANÇADA: Aba "${sheetName}" com ${data.length} linhas`);
  
  if (data.length < 2) {
    console.log(`⚠️ Aba "${sheetName}" com dados insuficientes (${data.length} linhas)`);
    return [];
  }
  
  // FASE 1: ANÁLISE AVANÇADA DE CONTEXTO
  const spreadsheetType = detectSpreadsheetType(data, fileName);
  console.log(`🔍 TIPO DE PLANILHA: ${spreadsheetType}`);
  
  // FASE 2: EXTRAÇÃO COMPLETA DE METADADOS VISUAIS
  let cellMetadata: CellMetadata[][] = [];
  if (worksheet) {
    cellMetadata = extractCellMetadata(worksheet);
    console.log(`🎨 METADADOS VISUAIS: ${cellMetadata.length} linhas analisadas`);
    
    // Log de células destacadas encontradas
    let highlightedCells = 0;
    for (let r = 0; r < Math.min(cellMetadata.length, 5); r++) {
      for (let c = 0; c < Math.min(cellMetadata[r]?.length || 0, 20); c++) {
        if (cellMetadata[r] && cellMetadata[r][c] && cellMetadata[r][c].isHighlighted) {
          highlightedCells++;
        }
      }
    }
    console.log(`✨ CÉLULAS DESTACADAS encontradas: ${highlightedCells}`);
  }
  
  // FASE 3: ANÁLISE INTELIGENTE DE CABEÇALHOS
  const headers = data[0].map(h => String(h || '').trim()).filter(h => h);
  console.log(`📋 CABEÇALHOS (${headers.length}):`, headers.slice(0, 10));
  
  if (headers.length === 0) {
    console.log(`❌ Nenhum cabeçalho válido`);
    return [];
  }
  
  // FASE 4: BUSCA INTELIGENTE DE DATAS COM MÁXIMA PRECISÃO
  console.log(`🎯 FASE 4: Busca avançada de colunas de data...`);
  const { startDateColumns, endDateColumns } = findDateColumns(headers, cellMetadata);
  
  const bestStartColumn = startDateColumns.length > 0 ? startDateColumns[0] : null;
  const bestEndColumn = endDateColumns.length > 0 ? endDateColumns[0] : null;
  
  console.log(`📅 COLUNAS DE DATA SELECIONADAS:`);
  console.log(`   Início: ${bestStartColumn ? `"${headers[bestStartColumn.index]}" (confiança: ${bestStartColumn.confidence.toFixed(3)})` : 'NÃO ENCONTRADA'}`);
  console.log(`   Fim: ${bestEndColumn ? `"${headers[bestEndColumn.index]}" (confiança: ${bestEndColumn.confidence.toFixed(3)})` : 'NÃO ENCONTRADA'}`);
  
  // FASE 5: MAPEAMENTO COMPLETO DE CAMPOS COM FORMATAÇÃO
  console.log(`🎯 FASE 5: Mapeamento inteligente de campos...`);
  const columnIndexes = {
    numero: findColumnIndex(headers, FIELD_MAPPINGS.numero, cellMetadata),
    objeto: findColumnIndex(headers, FIELD_MAPPINGS.objeto, cellMetadata),
    contratante: findColumnIndex(headers, FIELD_MAPPINGS.contratante, cellMetadata),
    contratada: findColumnIndex(headers, FIELD_MAPPINGS.contratada, cellMetadata),
    valor: findColumnIndex(headers, FIELD_MAPPINGS.valor, cellMetadata),
    modalidade: findColumnIndex(headers, FIELD_MAPPINGS.modalidade, cellMetadata),
    status: findColumnIndex(headers, FIELD_MAPPINGS.status, cellMetadata)
  };
  
  console.log(`📊 MAPEAMENTO FINAL:`, Object.entries(columnIndexes)
    .map(([field, index]) => `${field}: ${index >= 0 ? `coluna ${index} ("${headers[index]}")` : 'não encontrado'}`)
    .join(', '));
  
  // FASE 6: VALIDAÇÃO E PROCESSAMENTO DE DADOS
  const essentialFound = columnIndexes.numero >= 0 || columnIndexes.objeto >= 0 || 
                        columnIndexes.contratada >= 0 || columnIndexes.valor >= 0 ||
                        bestStartColumn || bestEndColumn;
  
  if (!essentialFound) {
    console.log(`⚠️ NENHUM CAMPO ESSENCIAL ENCONTRADO`);
    return [];
  }
  
  const contracts: Partial<Contract>[] = [];
  const stats = {
    totalRows: data.length - 1,
    processedRows: 0,
    successfulContracts: 0,
    dateParsingSuccess: 0,
    dateParsingFailed: 0,
    valueParsingSuccess: 0,
    warnings: [] as string[]
  };
  
  // FASE 7: PROCESSAMENTO AVANÇADO DE LINHAS
  console.log(`🎯 FASE 7: Processamento avançado de ${stats.totalRows} linhas...`);
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    if (!row || row.length === 0) continue;
    
    const hasContent = row.some(cell => cell && String(cell).trim() !== '');
    if (!hasContent) continue;
    
    console.log(`📝 PROCESSANDO LINHA ${i}...`);
    stats.processedRows++;
    
    try {
      // Extração básica de dados
      const numero = columnIndexes.numero >= 0 ? String(row[columnIndexes.numero] || '').trim() : `${sheetName}-${i}`;
      const objeto = columnIndexes.objeto >= 0 ? String(row[columnIndexes.objeto] || '').trim() : '';
      const contratante = columnIndexes.contratante >= 0 ? String(row[columnIndexes.contratante] || '').trim() || 'Órgão Público' : 'Órgão Público';
      const contratada = columnIndexes.contratada >= 0 ? String(row[columnIndexes.contratada] || '').trim() : '';
      const modalidade = columnIndexes.modalidade >= 0 ? parseModalidade(row[columnIndexes.modalidade]) : 'pregao';
      const status = columnIndexes.status >= 0 ? parseStatus(row[columnIndexes.status]) : 'vigente';
      
      // PARSING AVANÇADO DE VALOR
      let valor = 0;
      if (columnIndexes.valor >= 0) {
        valor = parseValue(row[columnIndexes.valor]);
        if (valor > 0) {
          stats.valueParsingSuccess++;
          console.log(`   💰 VALOR EXTRAÍDO: ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        }
      }
      
      // PARSING ULTRA-PRECISO DE DATAS
      let dataInicio: Date | null = null;
      let dataTermino: Date | null = null;
      
      if (bestStartColumn) {
        const rawStartDate = row[bestStartColumn.index];
        dataInicio = parseAdvancedDate(rawStartDate, spreadsheetType);
        
        if (dataInicio) {
          stats.dateParsingSuccess++;
          console.log(`   📅 DATA INÍCIO EXTRAÍDA: ${format(dataInicio, 'dd/MM/yyyy')} (original: "${rawStartDate}")`);
        } else {
          stats.dateParsingFailed++;
          console.log(`   ❌ FALHA DATA INÍCIO: "${rawStartDate}"`);
        }
      }
      
      if (bestEndColumn) {
        const rawEndDate = row[bestEndColumn.index];
        dataTermino = parseAdvancedDate(rawEndDate, spreadsheetType);
        
        if (dataTermino) {
          stats.dateParsingSuccess++;
          console.log(`   📅 DATA FIM EXTRAÍDA: ${format(dataTermino, 'dd/MM/yyyy')} (original: "${rawEndDate}")`);
        } else {
          stats.dateParsingFailed++;
          console.log(`   ❌ FALHA DATA FIM: "${rawEndDate}"`);
        }
      }
      
      // Validação de consistência
      const dateValidation = validateDateConsistency(dataInicio, dataTermino);
      
      // Cálculo automático de prazo
      let prazoExecucao = 0;
      let prazoUnidade: 'dias' | 'meses' | 'anos' = 'dias';
      
      if (dataInicio && dataTermino && dateValidation.isValid) {
        const period = calculateContractPeriod(dataInicio, dataTermino);
        prazoExecucao = period.prazo;
        prazoUnidade = period.unidade;
        console.log(`   ⏱️ PRAZO CALCULADO: ${prazoExecucao} ${prazoUnidade}`);
      }
      
      // Observações detalhadas
      let observacoes = `✅ Extraído com IA AVANÇADA da planilha "${sheetName}" (${spreadsheetType}) - linha ${i}.`;
      
      if (bestStartColumn) {
        observacoes += ` Data início: coluna "${headers[bestStartColumn.index]}" (confiança: ${bestStartColumn.confidence.toFixed(2)}).`;
      }
      if (bestEndColumn) {
        observacoes += ` Data fim: coluna "${headers[bestEndColumn.index]}" (confiança: ${bestEndColumn.confidence.toFixed(2)}).`;
      }
      
      if (!dateValidation.isValid) {
        observacoes += ` ⚠️ PROBLEMAS: ${dateValidation.warnings.join(', ')}.`;
        stats.warnings.push(`Linha ${i}: ${dateValidation.warnings.join(', ')}`);
      }
      
      if (dateValidation.suggestions.length > 0) {
        observacoes += ` 💡 Sugestões: ${dateValidation.suggestions.join(', ')}.`;
      }
      
      // Montar contrato
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
      stats.successfulContracts++;
      
      console.log(`   ✅ CONTRATO CRIADO: ${contract.numero}`);
      
    } catch (error) {
      console.error(`   ❌ ERRO na linha ${i}:`, error);
      stats.warnings.push(`Linha ${i}: Erro no processamento - ${error}`);
    }
  }
  
  // RELATÓRIO FINAL DETALHADO
  console.log(`📊 RELATÓRIO FINAL DETALHADO:`);
  console.log(`   📄 Aba: "${sheetName}"`);
  console.log(`   📁 Arquivo: "${fileName}"`);
  console.log(`   📊 Tipo: ${spreadsheetType}`);
  console.log(`   📋 Linhas totais: ${stats.totalRows}`);
  console.log(`   ✅ Linhas processadas: ${stats.processedRows}`);
  console.log(`   📝 Contratos gerados: ${stats.successfulContracts}`);
  console.log(`   📅 Datas extraídas com sucesso: ${stats.dateParsingSuccess}`);
  console.log(`   ❌ Falhas em datas: ${stats.dateParsingFailed}`);
  console.log(`   💰 Valores extraídos: ${stats.valueParsingSuccess}`);
  console.log(`   ⚠️ Avisos: ${stats.warnings.length}`);
  
  if (stats.warnings.length > 0) {
    console.log(`📋 AVISOS DETALHADOS:`, stats.warnings);
  }
  
  return contracts;
}
