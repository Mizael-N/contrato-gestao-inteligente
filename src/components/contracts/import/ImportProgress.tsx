
import { Eye, FileSpreadsheet, FileText, Image, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

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

  if (!processing && !importing && !progress) return null;

  const getFileIcon = () => {
    switch (fileType) {
      case 'spreadsheet': return <FileSpreadsheet className="h-5 w-5" />;
      case 'document': return <FileText className="h-5 w-5" />;
      case 'image': return <Image className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getProgressColor = () => {
    if (progress?.stage === 'error') return 'bg-red-500';
    if (progress?.stage === 'complete') return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getProgressIcon = () => {
    if (progress?.stage === 'error') return <AlertCircle className="h-5 w-5 text-red-500" />;
    if (progress?.stage === 'complete') return <CheckCircle className="h-5 w-5 text-green-500" />;
    return getFileIcon();
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Barra de Progresso Melhorada */}
          {progress && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getProgressIcon()}
                  <span className="ml-2 font-medium text-sm">{progress.message}</span>
                </div>
                <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                  {progress.progress}%
                </span>
              </div>
              
              <Progress 
                value={progress.progress} 
                className="w-full h-2"
              />
              
              {progress.stage !== 'error' && progress.stage !== 'complete' && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
              
              {/* Detalhes do processo */}
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-4">
                {fileType === 'spreadsheet' && progress.stage !== 'complete' && progress.stage !== 'error' && (
                  <>
                    <p>• Carregando e analisando planilha</p>
                    <p>• Processando todas as abas encontradas</p>
                    <p>• Mapeando colunas automaticamente</p>
                    <p>• Normalizando datas e valores monetários</p>
                    <p>• Detectando status por vigência</p>
                    <p>• Calculando datas de início e término</p>
                  </>
                )}
                {fileType === 'document' && progress.stage !== 'complete' && progress.stage !== 'error' && (
                  <>
                    <p>• Extraindo texto do documento</p>
                    <p>• Aplicando OCR se necessário</p>
                    <p>• Identificando campos de contrato</p>
                    <p>• Normalizando dados extraídos</p>
                  </>
                )}
                {fileType === 'image' && progress.stage !== 'complete' && progress.stage !== 'error' && (
                  <>
                    <p>• Aplicando reconhecimento ótico (OCR)</p>
                    <p>• Corrigindo erros de reconhecimento</p>
                    <p>• Extraindo informações estruturadas</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Texto Extraído (apenas para documentos/imagens) */}
          {extractedText && fileType !== 'spreadsheet' && (
            <div className="mt-4">
              <h4 className="font-medium mb-2 text-sm flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                Texto Extraído
              </h4>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm whitespace-pre-line max-h-32 overflow-y-auto border">
                {extractedText}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
