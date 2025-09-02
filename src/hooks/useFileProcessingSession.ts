import { useState, useRef } from 'react';

export function useFileProcessingSession() {
  const [isProcessing, setIsProcessing] = useState(false);
  const currentSessionRef = useRef<string | null>(null);
  const processedFilesRef = useRef<Set<string>>(new Set());

  const startSession = (fileName: string, fileSize: number, lastModified: number): boolean => {
    const fileKey = `${fileName}_${fileSize}_${lastModified}`;
    
    // Verificar se este arquivo já foi processado nesta sessão
    if (processedFilesRef.current.has(fileKey)) {
      console.log(`⚠️ Arquivo já processado nesta sessão: ${fileName}`);
      return false;
    }
    
    // Verificar se já existe um processamento em andamento
    if (isProcessing && currentSessionRef.current) {
      console.log(`⚠️ Processamento já em andamento: ${currentSessionRef.current}`);
      return false;
    }
    
    console.log(`🚀 Iniciando nova sessão de processamento: ${fileKey}`);
    setIsProcessing(true);
    currentSessionRef.current = fileKey;
    
    return true;
  };

  const endSession = (success: boolean = true) => {
    if (currentSessionRef.current) {
      if (success) {
        processedFilesRef.current.add(currentSessionRef.current);
        console.log(`✅ Sessão concluída com sucesso: ${currentSessionRef.current}`);
      } else {
        console.log(`❌ Sessão finalizada com erro: ${currentSessionRef.current}`);
      }
      
      currentSessionRef.current = null;
      setIsProcessing(false);
    }
  };

  const clearProcessedFiles = () => {
    processedFilesRef.current.clear();
    console.log('🧹 Cache de arquivos processados limpo');
  };

  return {
    isProcessing,
    startSession,
    endSession,
    clearProcessedFiles,
    currentSession: currentSessionRef.current
  };
}