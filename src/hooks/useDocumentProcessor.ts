
import { useState } from 'react';
import Tesseract from 'tesseract.js';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { Contract } from '@/types/contract';

// Configurar worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;

interface ProcessingProgress {
  stage: string;
  progress: number;
  message: string;
}

export const useDocumentProcessor = () => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);

  // Função para normalizar texto extraído
  const normalizeExtractedText = (text: string): string => {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\d\.,\-\/\(\)]/g, ' ')
      .trim();
  };

  // Função para extrair informações de contrato do texto
  const extractContractInfo = (text: string): Partial<Contract> => {
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

  // Processar arquivo PDF
  const processPDF = async (file: File): Promise<Partial<Contract>[]> => {
    setProgress({ stage: 'pdf', progress: 0, message: 'Carregando PDF...' });
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      setProgress({ 
        stage: 'pdf', 
        progress: (i / pdf.numPages) * 50, 
        message: `Extraindo texto da página ${i}/${pdf.numPages}...` 
      });
      
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
      
      // Se não conseguiu extrair texto suficiente, usar OCR
      if (pageText.length < 50 && i <= 3) {
        setProgress({ 
          stage: 'ocr', 
          progress: 50 + (i / pdf.numPages) * 40, 
          message: `Aplicando OCR na página ${i}...` 
        });
        
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: context, viewport }).promise;
        
        const { data: { text } } = await Tesseract.recognize(canvas, 'por', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress({ 
                stage: 'ocr', 
                progress: 50 + (m.progress * 40), 
                message: `OCR: ${Math.round(m.progress * 100)}%` 
              });
            }
          }
        });
        
        fullText += text + '\n';
      }
    }
    
    setProgress({ stage: 'extract', progress: 90, message: 'Extraindo informações do contrato...' });
    
    const contractData = extractContractInfo(fullText);
    return [contractData];
  };

  // Processar arquivo Word
  const processWord = async (file: File): Promise<Partial<Contract>[]> => {
    setProgress({ stage: 'word', progress: 0, message: 'Processando documento Word...' });
    
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    setProgress({ stage: 'extract', progress: 70, message: 'Extraindo informações do contrato...' });
    
    const contractData = extractContractInfo(result.value);
    return [contractData];
  };

  // Processar imagem com OCR
  const processImage = async (file: File): Promise<Partial<Contract>[]> => {
    setProgress({ stage: 'ocr', progress: 0, message: 'Iniciando OCR da imagem...' });
    
    const { data: { text } } = await Tesseract.recognize(file, 'por', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setProgress({ 
            stage: 'ocr', 
            progress: m.progress * 80, 
            message: `OCR: ${Math.round(m.progress * 100)}%` 
          });
        }
      }
    });
    
    setProgress({ stage: 'extract', progress: 90, message: 'Extraindo informações do contrato...' });
    
    const contractData = extractContractInfo(text);
    return [contractData];
  };

  // Função principal de processamento
  const processDocument = async (file: File): Promise<Partial<Contract>[]> => {
    setProcessing(true);
    setProgress({ stage: 'start', progress: 0, message: 'Iniciando processamento...' });
    
    try {
      const fileType = file.type;
      const fileName = file.name.toLowerCase();
      
      let result: Partial<Contract>[] = [];
      
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        result = await processPDF(file);
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.endsWith('.docx')
      ) {
        result = await processWord(file);
      } else if (fileType.startsWith('image/')) {
        result = await processImage(file);
      } else {
        throw new Error('Formato de arquivo não suportado para OCR');
      }
      
      setProgress({ stage: 'complete', progress: 100, message: 'Processamento concluído!' });
      
      return result;
    } catch (error) {
      console.error('Erro no processamento:', error);
      throw error;
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(null), 2000);
    }
  };

  return {
    processDocument,
    processing,
    progress
  };
};
