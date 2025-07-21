
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
    
    // Criar um evento sintético completo para manter compatibilidade
    if (fileInputRef.current) {
      // Criar uma FileList sintética
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      
      // Disparar o evento change no input
      const event = new Event('change', { bubbles: true });
      Object.defineProperty(event, 'target', {
        writable: false,
        value: fileInputRef.current
      });
      
      onFileChange(event as React.ChangeEvent<HTMLInputElement>);
    }
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
    
    // Ícones específicos por tipo de arquivo
    if (['xlsx', 'xls', 'csv', 'ods'].includes(extension || '')) {
      return <File className="h-8 w-8 text-emerald-500" />;
    }
    if (['pdf'].includes(extension || '')) {
      return <File className="h-8 w-8 text-red-500" />;
    }
    if (['docx', 'doc'].includes(extension || '')) {
      return <File className="h-8 w-8 text-blue-500" />;
    }
    if (['png', 'jpg', 'jpeg'].includes(extension || '')) {
      return <File className="h-8 w-8 text-purple-500" />;
    }
    
    return <File className="h-8 w-8 text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          <strong>Sistema Avançado com OCR:</strong> Agora suporta múltiplos formatos de arquivo:
          <br />
          <div className="text-xs bg-white/70 dark:bg-gray-900/50 p-3 rounded mt-2 space-y-1">
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
            className={`border-2 border-dashed transition-all duration-300 cursor-pointer group ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-[1.02] shadow-lg' 
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:scale-[1.01] hover:shadow-md'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-10 px-6">
              <div className={`p-4 rounded-full mb-4 transition-all duration-300 ${
                isDragOver 
                  ? 'bg-blue-100 dark:bg-blue-900/50' 
                  : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30'
              }`}>
                <Upload className={`h-8 w-8 transition-all duration-300 ${
                  isDragOver 
                    ? 'text-blue-600 dark:text-blue-400 scale-110' 
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-500 group-hover:scale-110'
                }`} />
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {isDragOver ? 'Solte o arquivo aqui' : 'Clique para selecionar ou arraste arquivos aqui'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Suporte: Excel, CSV, PDF, Word, Imagens (PNG, JPG)
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded text-xs font-medium">
                    .xlsx
                  </span>
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-medium">
                    .pdf
                  </span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                    .docx
                  </span>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                    .png
                  </span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className={`mt-4 transition-all duration-300 ${
                  isDragOver 
                    ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20' 
                    : 'hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                }`}
                type="button"
              >
                <Upload className="h-4 w-4 mr-2" />
                Escolher Arquivo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20 animate-in slide-in-from-top-2 duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {getFileTypeIcon(selectedFile.name)}
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-2 w-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-medium">Pronto</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
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
        
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <strong className="text-emerald-600 dark:text-emerald-400">Planilhas:</strong> Excel (.xlsx, .xls), CSV, LibreOffice (.ods)
            </div>
            <div>
              <strong className="text-blue-600 dark:text-blue-400">Documentos:</strong> PDF, Word (.docx) com OCR
            </div>
            <div>
              <strong className="text-purple-600 dark:text-purple-400">Imagens:</strong> PNG, JPG com reconhecimento de texto
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <strong className="text-orange-600 dark:text-orange-400">Tamanho máximo:</strong> 50MB por arquivo
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-in slide-in-from-top-1 duration-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
