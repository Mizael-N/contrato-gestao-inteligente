
import { Contract } from '@/types/contract';

// Função para normalizar texto extraído
export const normalizeExtractedText = (text: string): string => {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\d\.,\-\/\(\)]/g, ' ')
    .trim();
};

// Padrões melhorados para identificar datas e prazos
const getImprovedPatterns = () => ({
  numero: /(?:contrato|processo|n[°º]?|número|numero)\s*:?\s*([a-zA-Z0-9\/\-\.]+)/i,
  valor: /(?:valor|total|importância|importancia|quantia|montante|r\$)\s*:?\s*(?:r\$)?\s*([\d\.,]+)/i,
  contratada: /(?:contratada|empresa|fornecedor|prestador|licitante|vencedor)\s*:?\s*([^;\n]+)/i,
  objeto: /(?:objeto|descrição|descricao|serviços?|servicos?|finalidade|especificação|especificacao)\s*:?\s*([^;\n]{20,})/i,
  
  // Padrões específicos para início da vigência
  dataInicio: /(?:início\s*(?:da\s*)?(?:vigência|vigencia|execução|execucao|contrato)|inicio\s*(?:da\s*)?(?:vigência|vigencia|execução|execucao|contrato)|vigência\s*(?:a\s*partir\s*de|iniciada?\s*em)|vigencia\s*(?:a\s*partir\s*de|iniciada?\s*em)|execução\s*(?:a\s*partir\s*de|iniciada?\s*em)|execucao\s*(?:a\s*partir\s*de|iniciada?\s*em)|prazo\s*iniciado?\s*em|começa\s*em|inicia\s*em|eficácia\s*a\s*partir\s*de|eficacia\s*a\s*partir\s*de|assinatura|assinado|celebração|celebracao|firmado|data\s*do\s*contrato)\s*:?\s*(?:em\s*)?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  
  // Padrões específicos para término da vigência
  dataTermino: /(?:término\s*(?:da\s*)?(?:vigência|vigencia|execução|execucao|contrato)|termino\s*(?:da\s*)?(?:vigência|vigencia|execução|execucao|contrato)|fim\s*(?:da\s*)?(?:vigência|vigencia|execução|execucao|contrato)|vigência\s*(?:até|encerra\s*em|finda\s*em)|vigencia\s*(?:até|encerra\s*em|finda\s*em)|execução\s*(?:até|encerra\s*em|finda\s*em)|execucao\s*(?:até|encerra\s*em|finda\s*em)|prazo\s*(?:final|limite|até)|vence\s*em|expira\s*em|validade\s*até)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  
  // Padrões melhorados para prazo de execução
  prazoExecucao: /(?:prazo\s*(?:de\s*)?(?:execução|execucao|vigência|vigencia|duração|duracao|validade)|duração\s*(?:do\s*)?contrato|duracao\s*(?:do\s*)?contrato|período\s*(?:de\s*)?(?:execução|execucao|vigência|vigencia)|periodo\s*(?:de\s*)?(?:execução|execucao|vigência|vigencia)|tempo\s*(?:de\s*)?(?:execução|execucao|vigência|vigencia)|vigência\s*(?:de\s*)?|vigencia\s*(?:de\s*)?)\s*:?\s*(\d+)\s*(dias?|meses?|anos?|dia|mes|mês|ano)/i,
  
  // Padrões para identificar período total entre datas
  periodoCompleto: /(?:vigência|vigencia|execução|execucao|contrato|prazo)\s*(?:de|do|da|entre|desde)?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*(?:a|até|ao)\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
});

// Função para calcular prazo entre duas datas
function calculatePeriodBetweenDates(startDate: string, endDate: string): { prazo: number; unidade: string } {
  const inicio = new Date(startDate);
  const fim = new Date(endDate);
  
  if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
    return { prazo: 365, unidade: 'dias' };
  }
  
  // Calcular diferença em dias
  const diffTime = fim.getTime() - inicio.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
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

// Função para calcular data de término baseada no prazo
function calculateEndDateFromPeriod(startDate: string, prazo: number, unidade: string): string {
  const inicio = new Date(startDate);
  if (isNaN(inicio.getTime())) return startDate;
  
  const fim = new Date(inicio);
  
  switch (unidade.toLowerCase()) {
    case 'dias':
    case 'dia':
      fim.setDate(fim.getDate() + prazo);
      break;
    case 'meses':
    case 'mes':
    case 'mês':
      fim.setMonth(fim.getMonth() + prazo);
      break;
    case 'anos':
    case 'ano':
      fim.setFullYear(fim.getFullYear() + prazo);
      break;
    default:
      fim.setDate(fim.getDate() + prazo);
  }
  
  return fim.toISOString().split('T')[0];
}

// Função para extrair informações de contrato do texto
export const extractContractInfo = (text: string): Partial<Contract> => {
  const normalizedText = normalizeExtractedText(text.toLowerCase());
  const patterns = getImprovedPatterns();
  
  const extractedData: Partial<Contract> = {
    contratante: 'Prefeitura Municipal',
    modalidade: 'pregao',
    status: 'vigente',
    prazoUnidade: 'dias',
  };

  console.log('🔍 Texto para análise:', normalizedText.substring(0, 500));

  // Extrair cada campo usando regex melhorados
  Object.entries(patterns).forEach(([key, pattern]) => {
    const match = text.match(pattern);
    if (match) {
      console.log(`✅ Campo "${key}" encontrado:`, match[0]);
      
      switch (key) {
        case 'numero':
          extractedData.numero = match[1].trim();
          break;
        case 'valor':
          const valorStr = match[1].replace(/[^\d,]/g, '').replace(',', '.');
          extractedData.valor = parseFloat(valorStr) || 0;
          break;
        case 'contratada':
          extractedData.contratada = match[1].trim();
          break;
        case 'objeto':
          extractedData.objeto = match[1].trim();
          break;
        case 'dataInicio':
          const inicioDataParts = match[1].split(/[\/\-]/);
          if (inicioDataParts.length === 3) {
            const day = inicioDataParts[0].padStart(2, '0');
            const month = inicioDataParts[1].padStart(2, '0');
            const year = inicioDataParts[2].length === 2 ? `20${inicioDataParts[2]}` : inicioDataParts[2];
            extractedData.dataInicio = `${year}-${month}-${day}`;
          }
          break;
        case 'dataTermino':
          const terminoDataParts = match[1].split(/[\/\-]/);
          if (terminoDataParts.length === 3) {
            const day = terminoDataParts[0].padStart(2, '0');
            const month = terminoDataParts[1].padStart(2, '0');
            const year = terminoDataParts[2].length === 2 ? `20${terminoDataParts[2]}` : terminoDataParts[2];
            extractedData.dataTermino = `${year}-${month}-${day}`;
          }
          break;
        case 'prazoExecucao':
          extractedData.prazoExecucao = parseInt(match[1]);
          const unidade = match[2].toLowerCase();
          if (unidade.includes('mes')) extractedData.prazoUnidade = 'meses';
          else if (unidade.includes('ano')) extractedData.prazoUnidade = 'anos';
          else extractedData.prazoUnidade = 'dias';
          break;
        case 'periodoCompleto':
          // Extrair período completo com data início e fim
          const inicioCompletoParts = match[1].split(/[\/\-]/);
          const fimCompletoParts = match[2].split(/[\/\-]/);
          
          if (inicioCompletoParts.length === 3 && fimCompletoParts.length === 3) {
            const inicioDay = inicioCompletoParts[0].padStart(2, '0');
            const inicioMonth = inicioCompletoParts[1].padStart(2, '0');
            const inicioYear = inicioCompletoParts[2].length === 2 ? `20${inicioCompletoParts[2]}` : inicioCompletoParts[2];
            
            const fimDay = fimCompletoParts[0].padStart(2, '0');
            const fimMonth = fimCompletoParts[1].padStart(2, '0');
            const fimYear = fimCompletoParts[2].length === 2 ? `20${fimCompletoParts[2]}` : fimCompletoParts[2];
            
            extractedData.dataInicio = `${inicioYear}-${inicioMonth}-${inicioDay}`;
            extractedData.dataTermino = `${fimYear}-${fimMonth}-${fimDay}`;
            
            console.log('📅 Período completo identificado:', {
              inicio: extractedData.dataInicio,
              termino: extractedData.dataTermino
            });
          }
          break;
      }
    }
  });

  // Lógica inteligente para completar dados em falta
  
  // Se não temos data de início, usar data atual
  if (!extractedData.dataInicio) {
    extractedData.dataInicio = new Date().toISOString().split('T')[0];
  }
  
  // Se temos data início e término, calcular prazo real
  if (extractedData.dataInicio && extractedData.dataTermino) {
    const periodoCalculado = calculatePeriodBetweenDates(extractedData.dataInicio, extractedData.dataTermino);
    extractedData.prazoExecucao = periodoCalculado.prazo;
    extractedData.prazoUnidade = periodoCalculado.unidade;
    
    console.log('🎯 Prazo calculado baseado nas datas:', {
      inicio: extractedData.dataInicio,
      termino: extractedData.dataTermino,
      prazo: periodoCalculado.prazo,
      unidade: periodoCalculado.unidade
    });
  }
  // Se temos data início e prazo, calcular data término
  else if (extractedData.dataInicio && extractedData.prazoExecucao) {
    extractedData.dataTermino = calculateEndDateFromPeriod(
      extractedData.dataInicio, 
      extractedData.prazoExecucao, 
      extractedData.prazoUnidade || 'dias'
    );
    
    console.log('📅 Data término calculada baseada no prazo:', {
      inicio: extractedData.dataInicio,
      prazo: extractedData.prazoExecucao,
      unidade: extractedData.prazoUnidade,
      termino: extractedData.dataTermino
    });
  }
  // Se só temos prazo, calcular data término baseada na data de início
  else if (extractedData.prazoExecucao) {
    extractedData.dataTermino = calculateEndDateFromPeriod(
      extractedData.dataInicio,
      extractedData.prazoExecucao,
      extractedData.prazoUnidade || 'dias'
    );
  }

  // Valores padrão se não encontrados
  if (!extractedData.numero) extractedData.numero = `CONTRATO-${Date.now()}`;
  if (!extractedData.objeto) extractedData.objeto = 'Objeto não identificado automaticamente';
  if (!extractedData.contratada) extractedData.contratada = 'Empresa não identificada';
  if (!extractedData.valor) extractedData.valor = 0;
  if (!extractedData.prazoExecucao) extractedData.prazoExecucao = 365;

  // Se ainda não temos data de término, calcular com prazo de 1 ano por padrão
  if (!extractedData.dataTermino) {
    extractedData.dataTermino = calculateEndDateFromPeriod(
      extractedData.dataInicio,
      12, // 12 meses = 1 ano
      'meses'
    );
  }

  // Adicionar campos obrigatórios
  extractedData.aditivos = [];
  extractedData.pagamentos = [];
  extractedData.documentos = [];
  extractedData.observacoes = 'Contrato importado via OCR - revisar informações. Datas e prazos calculados automaticamente com vigência padrão de 1 ano.';

  console.log('📋 Dados finais extraídos:', {
    numero: extractedData.numero,
    dataInicio: extractedData.dataInicio,
    dataTermino: extractedData.dataTermino,
    prazoExecucao: extractedData.prazoExecucao,
    prazoUnidade: extractedData.prazoUnidade
  });

  return extractedData;
};
