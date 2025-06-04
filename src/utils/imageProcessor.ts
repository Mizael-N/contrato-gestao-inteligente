
import Tesseract from 'tesseract.js';

export const processImage = async (
  file: File,
  setProgress: (progress: { stage: string; progress: number; message: string }) => void
): Promise<string> => {
  setProgress({ stage: 'ocr', progress: 0, message: 'Iniciando OCR da imagem...' });
  
  const { data: { text } } = await Tesseract.recognize(file, 'por', {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        setProgress({ 
          stage: 'ocr', 
          progress: m.progress * 100, 
          message: `OCR: ${Math.round(m.progress * 100)}%` 
        });
      }
    }
  });
  
  return text;
};
