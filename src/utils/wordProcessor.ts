
export const processWord = async (
  file: File,
  setProgress: (progress: { stage: string; progress: number; message: string }) => void
): Promise<string> => {
  setProgress({ stage: 'word', progress: 0, message: 'Processando documento Word...' });
  
  try {
    // Use dynamic import to avoid build issues
    const mammoth = await import('mammoth');
    
    const arrayBuffer = await file.arrayBuffer();
    
    setProgress({ stage: 'word', progress: 50, message: 'Extraindo texto do documento...' });
    
    const result = await mammoth.default.extractRawText({ arrayBuffer });
    
    setProgress({ stage: 'word', progress: 100, message: 'Texto extraído com sucesso!' });
    
    return result.value;
  } catch (error) {
    console.error('Error processing Word document:', error);
    throw new Error('Erro ao processar documento Word: ' + (error as Error).message);
  }
};
