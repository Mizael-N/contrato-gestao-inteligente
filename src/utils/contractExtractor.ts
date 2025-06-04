
import { Contract } from '@/types/contract';

// Função para normalizar texto extraído
export const normalizeExtractedText = (text: string): string => {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\d\.,\-\/\(\)]/g, ' ')
    .trim();
};

// Função para extrair informações de contrato do texto
export const extractContractInfo = (text: string): Partial<Contract> => {
  const normalizedText = normalizeExtractedText(text.toLowerCase());
  
  // Padrões de regex para extrair informações
  const patterns = {
    numero: /(?:contrato|processo|n[°º]?)\s*:?\s*([a-zA-Z0-9\/\-\.]+)/i,
    valor: /(?:valor|total|r\$)\s*:?\s*(?:r\$)?\s*([\d\.,]+)/i,
    contratada: /(?:contratada|empresa|fornecedor)\s*:?\s*([^;\n]+)/i,
    objeto: /(?:objeto|descrição|serviços?)\s*:?\s*([^;\n]{20,})/i,
    dataAssinatura: /(?:assinatura|data)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    prazo: /(?:prazo|vigência)\s*:?\s*(\d+)\s*(dias?|meses?|anos?)/i,
  };

  const extractedData: Partial<Contract> = {
    contratante: 'Prefeitura Municipal',
    modalidade: 'pregao',
    status: 'vigente',
    prazoUnidade: 'dias',
  };

  // Extrair cada campo usando regex
  Object.entries(patterns).forEach(([key, pattern]) => {
    const match = text.match(pattern);
    if (match) {
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
        case 'dataAssinatura':
          const dateParts = match[1].split(/[\/\-]/);
          if (dateParts.length === 3) {
            const day = dateParts[0].padStart(2, '0');
            const month = dateParts[1].padStart(2, '0');
            const year = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2];
            extractedData.dataAssinatura = `${year}-${month}-${day}`;
          }
          break;
        case 'prazo':
          extractedData.prazoExecucao = parseInt(match[1]);
          const unidade = match[2].toLowerCase();
          if (unidade.includes('mes')) extractedData.prazoUnidade = 'meses';
          else if (unidade.includes('ano')) extractedData.prazoUnidade = 'anos';
          else extractedData.prazoUnidade = 'dias';
          break;
      }
    }
  });

  // Valores padrão se não encontrados
  if (!extractedData.numero) extractedData.numero = `CONTRATO-${Date.now()}`;
  if (!extractedData.objeto) extractedData.objeto = 'Objeto não identificado automaticamente';
  if (!extractedData.contratada) extractedData.contratada = 'Empresa não identificada';
  if (!extractedData.valor) extractedData.valor = 0;
  if (!extractedData.prazoExecucao) extractedData.prazoExecucao = 365;
  if (!extractedData.dataAssinatura) {
    const today = new Date();
    extractedData.dataAssinatura = today.toISOString().split('T')[0];
  }

  // Adicionar campos obrigatórios
  extractedData.fiscais = {
    titular: 'A definir',
    substituto: 'A definir'
  };
  extractedData.garantia = {
    tipo: 'sem_garantia',
    valor: 0,
    dataVencimento: extractedData.dataAssinatura
  };
  extractedData.aditivos = [];
  extractedData.pagamentos = [];
  extractedData.documentos = [];
  extractedData.observacoes = 'Contrato importado via OCR - revisar informações';

  return extractedData;
};
