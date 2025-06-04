
export const processImage = async (
  file: File,
  setProgress: (progress: { stage: string; progress: number; message: string }) => void
): Promise<string> => {
  setProgress({ stage: 'ocr', progress: 0, message: 'Iniciando OCR da imagem...' });
  
  try {
    // Use dynamic import to avoid build issues
    const Tesseract = await import('tesseract.js');
    
    const { data: { text } } = await Tesseract.default.recognize(file, 'por', {
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
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Erro ao processar imagem: ' + (error as Error).message);
  }
};
