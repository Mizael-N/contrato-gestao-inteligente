
// Use dynamic import to avoid top-level await issues
let pdfjsLib: any = null;

const loadPdfJs = async () => {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    // Configure worker with a more compatible approach
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    }
  }
  return pdfjsLib;
};

export const processPDF = async (
  file: File,
  setProgress: (progress: { stage: string; progress: number; message: string }) => void
): Promise<string> => {
  setProgress({ stage: 'pdf', progress: 0, message: 'Carregando PDF...' });
  
  try {
    const pdfLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfLib.getDocument({ data: arrayBuffer }).promise;
    
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
        
        try {
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({ canvasContext: context, viewport }).promise;
          
          // Use dynamic import for Tesseract as well
          const Tesseract = await import('tesseract.js');
          const { data: { text } } = await Tesseract.default.recognize(canvas, 'por', {
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
        } catch (ocrError) {
          console.warn('OCR failed for page', i, ocrError);
        }
      }
    }
    
    return fullText;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error('Erro ao processar PDF: ' + (error as Error).message);
  }
};
