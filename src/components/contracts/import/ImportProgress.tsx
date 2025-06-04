
import { Eye } from 'lucide-react';

interface ImportProgressProps {
  processing: boolean;
  importing: boolean;
  progress: { stage: string; progress: number; message: string } | null;
  fileType: 'spreadsheet' | 'document' | 'image' | null;
  extractedText: string;
}

export default function ImportProgress({ processing, importing, progress, fileType, extractedText }: ImportProgressProps) {
  const getProcessingMessage = () => {
    if (!progress) return '';
    
    switch (progress.stage) {
      case 'pdf': return '📄 Extraindo texto do PDF...';
      case 'word': return '📝 Processando documento Word...';
      case 'ocr': return '👁️ Aplicando OCR inteligente...';
      case 'extract': return '🔍 Identificando informações do contrato...';
      case 'complete': return '✅ Processamento concluído!';
      default: return '🤖 Processando documento...';
    }
  };

  if (!processing && !importing) return null;

  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="space-y-2">
          <p className="font-medium text-gray-700">{getProcessingMessage()}</p>
          <p className="text-sm text-gray-500">{progress?.message || 'Processando arquivo...'}</p>
          {progress && (
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          )}
          <div className="text-xs text-gray-400 space-y-1 mt-4">
            {fileType === 'document' && (
              <>
                <p>• Extraindo texto do documento</p>
                <p>• Aplicando OCR se necessário</p>
                <p>• Identificando campos de contrato</p>
                <p>• Normalizando dados extraídos</p>
              </>
            )}
            {fileType === 'image' && (
              <>
                <p>• Aplicando reconhecimento ótico (OCR)</p>
                <p>• Corrigindo erros de reconhecimento</p>
                <p>• Extraindo informações estruturadas</p>
              </>
            )}
            {fileType === 'spreadsheet' && (
              <>
                <p>• Mapeando colunas automaticamente</p>
                <p>• Normalizando datas e valores</p>
                <p>• Extraindo informações de TAs</p>
              </>
            )}
          </div>
        </div>
      </div>

      {extractedText && (
        <div className="space-y-3">
          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-2" />
            <h4 className="font-medium">Texto Extraído</h4>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg max-h-40 overflow-auto">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">{extractedText}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
