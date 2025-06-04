
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface FileInputProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string;
}

export default function FileInput({ onFileChange, error }: FileInputProps) {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Sistema Avançado com OCR:</strong> Agora suporta múltiplos formatos de arquivo:
          <br />
          <div className="text-xs bg-gray-100 p-3 rounded mt-2 space-y-1">
            <div><strong>📊 Planilhas:</strong> Excel (.xlsx, .xls), CSV, LibreOffice (.ods)</div>
            <div><strong>📄 Documentos:</strong> PDF, Word (.docx) - com OCR inteligente</div>
            <div><strong>🖼️ Imagens:</strong> PNG, JPG, JPEG - reconhecimento de texto automático</div>
            <div><strong>🤖 IA Avançada:</strong> Extração contextual de dados de contratos brasileiros</div>
          </div>
        </AlertDescription>
      </Alert>

      <div>
        <Label htmlFor="file">Selecionar arquivo de contratos</Label>
        <Input
          id="file"
          type="file"
          accept=".csv,.xlsx,.xls,.ods,.xlsm,.xlsb,.pdf,.docx,.doc,.png,.jpg,.jpeg"
          onChange={onFileChange}
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          <strong>Novos formatos suportados:</strong> PDF, Word (.docx), Imagens (PNG, JPG)
          <br />
          <strong>Planilhas:</strong> Excel (.xlsx, .xls), CSV, LibreOffice (.ods)
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
