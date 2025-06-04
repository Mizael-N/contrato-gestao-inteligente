
import mammoth from 'mammoth';

export const processWord = async (
  file: File,
  setProgress: (progress: { stage: string; progress: number; message: string }) => void
): Promise<string> => {
  setProgress({ stage: 'word', progress: 0, message: 'Processando documento Word...' });
  
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  
  setProgress({ stage: 'word', progress: 100, message: 'Texto extraído do Word!' });
  
  return result.value;
};
