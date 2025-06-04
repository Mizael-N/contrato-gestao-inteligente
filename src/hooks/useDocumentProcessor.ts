
import { useState } from 'react';
import { Contract } from '@/types/contract';
import { processPDF } from '@/utils/pdfProcessor';
import { processWord } from '@/utils/wordProcessor';
import { processImage } from '@/utils/imageProcessor';
import { extractContractInfo } from '@/utils/contractExtractor';

interface ProcessingProgress {
  stage: string;
  progress: number;
  message: string;
}

export const useDocumentProcessor = () => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);

  // Função principal de processamento
  const processDocument = async (file: File): Promise<Partial<Contract>[]> => {
    setProcessing(true);
    setProgress({ stage: 'start', progress: 0, message: 'Iniciando processamento...' });
    
    try {
      const fileType = file.type;
      const fileName = file.name.toLowerCase();
      
      let extractedText = '';
      
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        extractedText = await processPDF(file, setProgress);
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.endsWith('.docx')
      ) {
        extractedText = await processWord(file, setProgress);
      } else if (fileType.startsWith('image/')) {
        extractedText = await processImage(file, setProgress);
      } else {
        throw new Error('Formato de arquivo não suportado para OCR');
      }
      
      setProgress({ stage: 'extract', progress: 90, message: 'Extraindo informações do contrato...' });
      
      const contractData = extractContractInfo(extractedText);
      const result = [contractData];
      
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
