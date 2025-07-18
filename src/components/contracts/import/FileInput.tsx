
import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Upload, File, CheckCircle2, X } from 'lucide-react';

interface FileInputProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string;
}

export default function FileInput({ onFileChange, error }: FileInputProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // Criar um evento sintético para manter compatibilidade
    const syntheticEvent = {
      target: {
        files: [file]
      }
    } as React.ChangeEvent<HTMLInputElement>;
    onFileChange(syntheticEvent);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
    onFileChange(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return <File className="h-8 w-8 text-blue-500" />;
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Sistema Avançado com OCR:</strong> Agora suporta múltiplos formatos de arquivo:
          <br />
          <div className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded mt-2 space-y-1">
            <div><strong>📊 Planilhas:</strong> Excel (.xlsx, .xls), CSV, LibreOffice (.ods)</div>
            <div><strong>📄 Documentos:</strong> PDF, Word (.docx) - com OCR inteligente</div>
            <div><strong>🖼️ Imagens:</strong> PNG, JPG, JPEG - reconhecimento de texto automático</div>
            <div><strong>🤖 IA Avançada:</strong> Extração contextual de dados de contratos brasileiros</div>
          </div>
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <Label htmlFor="file" className="text-sm font-medium">
          Selecionar arquivo de contratos
        </Label>
        
        {!selectedFile ? (
          <Card
            className={`border-2 border-dashed transition-all duration-200 cursor-pointer hover:border-blue-400 ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-8 px-6">
              <Upload className={`h-12 w-12 mb-3 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Clique para selecionar ou arraste arquivos aqui
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Suporte: Excel, CSV, PDF, Word, Imagens (PNG, JPG)
                </p>
              </div>
              <Button variant="outline" size="sm" className="mt-3" type="button">
                <Upload className="h-4 w-4 mr-2" />
                Escolher Arquivo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getFileTypeIcon(selectedFile.name)}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Input
          ref={fileInputRef}
          id="file"
          type="file"
          accept=".csv,.xlsx,.xls,.ods,.xlsm,.xlsb,.pdf,.docx,.doc,.png,.jpg,.jpeg"
          onChange={handleInputChange}
          className="hidden"
        />
        
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <strong>Novos formatos suportados:</strong> PDF, Word (.docx), Imagens (PNG, JPG)
          <br />
          <strong>Planilhas:</strong> Excel (.xlsx, .xls), CSV, LibreOffice (.ods)
          <br />
          <strong>Tamanho máximo:</strong> 50MB por arquivo
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
