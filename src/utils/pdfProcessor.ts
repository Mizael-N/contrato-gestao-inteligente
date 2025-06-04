
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Configure worker do PDF.js with legacy approach for better compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export const processPDF = async (
  file: File,
  setProgress: (progress: { stage: string; progress: number; message: string }) => void
): Promise<string> => {
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
  
  return fullText;
};
