
import { Eye } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
      case 'loading': return '📄 Carregando arquivo...';
      case 'analyzing': return '🔍 Analisando estrutura...';
      case 'processing': return '⚙️ Processando dados...';
      case 'finalizing': return '🔧 Finalizando extração...';
      case 'complete': return '✅ Processamento concluído!';
      case 'pdf': return '📄 Extraindo texto do PDF...';
      case 'word': return '📝 Processando documento Word...';
      case 'ocr': return '👁️ Aplicando OCR inteligente...';
      case 'extract': return '🔍 Identificando informações do contrato...';
      default: return '🤖 Processando documento...';
    }
  };

  if (!processing && !importing) return null;

  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="space-y-3">
          <p className="font-medium text-gray-700">{getProcessingMessage()}</p>
          <p className="text-sm text-gray-500">{progress?.message || 'Processando arquivo...'}</p>
          
          {progress && (
            <div className="max-w-xs mx-auto space-y-2">
              <Progress value={progress.progress} className="w-full" />
              <p className="text-xs text-gray-400">{progress.progress}% concluído</p>
            </div>
          )}
          
          <div className="text-xs text-gray-400 space-y-1 mt-4">
            {fileType === 'spreadsheet' && (
              <>
                <p>• Carregando e analisando planilha</p>
                <p>• Processando todas as abas encontradas</p>
                <p>• Mapeando colunas automaticamente</p>
                <p>• Normalizando datas e valores</p>
                <p>• Extraindo informações de contratos</p>
              </>
            )}
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
