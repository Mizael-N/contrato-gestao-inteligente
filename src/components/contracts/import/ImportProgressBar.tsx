
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ImportProgressBarProps {
  total: number;
  processed: number;
  current: string;
  errors: string[];
}

export default function ImportProgressBar({ total, processed, current, errors }: ImportProgressBarProps) {
  const progressPercent = Math.round((processed / total) * 100);
  const isComplete = processed === total;
  const hasErrors = errors.length > 0;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isComplete ? (
                hasErrors ? (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )
              ) : (
                <Clock className="h-5 w-5 text-blue-500" />
              )}
              <span className="font-medium">
                {isComplete ? 'Importação Concluída' : 'Importando Contratos'}
              </span>
            </div>
            <span className="text-sm font-bold text-gray-600">
              {processed}/{total} ({progressPercent}%)
            </span>
          </div>

          <Progress value={progressPercent} className="w-full h-3" />

          <div className="space-y-2">
            {!isComplete && (
              <p className="text-sm text-gray-600">
                Processando: <span className="font-medium">{current}</span>
              </p>
            )}
            
            {isComplete && (
              <div className="text-sm">
                <p className="text-green-600 font-medium">
                  ✅ {total - errors.length} contrato(s) importado(s) com sucesso
                </p>
                {hasErrors && (
                  <p className="text-orange-600 font-medium">
                    ⚠️ {errors.length} erro(s) encontrado(s)
                  </p>
                )}
              </div>
            )}
          </div>

          {!isComplete && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
