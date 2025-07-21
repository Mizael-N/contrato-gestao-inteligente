
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
    
    if (fileInputRef.current) {
      // Criar uma FileList sintética
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      
      // Chamar onFileChange diretamente com o input atual
      const syntheticEvent = {
        target: fileInputRef.current,
        currentTarget: fileInputRef.current
      } as React.ChangeEvent<HTMLInputElement>;
      
      onFileChange(syntheticEvent);
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
    <div className="space-y-6">
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

      <div className="space-y-4">
        <Label htmlFor="file" className="text-sm font-medium">
          Selecionar arquivo de contratos
        </Label>
        
        {!selectedFile ? (
          <Card
            className={`border-2 border-dashed transition-all duration-500 cursor-pointer group relative overflow-hidden ${
              isDragOver 
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 scale-[1.02] shadow-xl shadow-blue-100 dark:shadow-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-800/50 dark:hover:to-blue-950/20 hover:scale-[1.01] hover:shadow-lg'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-12 px-8 relative">
              {/* Background Animation */}
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/20 to-transparent translate-x-[-100%] transition-transform duration-1000 ${
                isDragOver ? 'translate-x-[100%]' : ''
              }`} />
              
              <div className={`p-6 rounded-full mb-6 transition-all duration-500 relative ${
                isDragOver 
                  ? 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/60 dark:to-indigo-900/60 scale-110 shadow-lg' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 group-hover:from-blue-50 group-hover:to-indigo-50 dark:group-hover:from-blue-950/40 dark:group-hover:to-indigo-950/40 group-hover:scale-105'
              }`}>
                <Upload className={`h-10 w-10 transition-all duration-500 ${
                  isDragOver 
                    ? 'text-blue-600 dark:text-blue-400 scale-110 animate-bounce' 
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-500 group-hover:scale-110'
                }`} />
              </div>
              
              <div className="text-center space-y-3 relative z-10">
                <h3 className={`text-lg font-semibold transition-all duration-300 ${
                  isDragOver 
                    ? 'text-blue-700 dark:text-blue-300 scale-105' 
                    : 'text-gray-900 dark:text-gray-100 group-hover:text-blue-600'
                }`}>
                  {isDragOver ? '🎯 Solte o arquivo aqui!' : '📁 Selecione ou arraste seu arquivo'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                  Suporte completo para Excel, CSV, PDF, Word e Imagens com tecnologia OCR avançada
                </p>
                
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {[
                    { ext: '.xlsx', color: 'emerald', label: 'Excel' },
                    { ext: '.pdf', color: 'red', label: 'PDF' },
                    { ext: '.docx', color: 'blue', label: 'Word' },
                    { ext: '.png', color: 'purple', label: 'Image' }
                  ].map(({ ext, color, label }) => (
                    <span 
                      key={ext}
                      className={`px-3 py-1 bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105 hover:shadow-md`}
                    >
                      {ext}
                    </span>
                  ))}
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="lg"
                className={`mt-6 transition-all duration-500 border-2 relative overflow-hidden ${
                  isDragOver 
                    ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20 scale-105 shadow-lg' 
                    : 'hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:scale-105 hover:shadow-md'
                }`}
                type="button"
              >
                <Upload className="h-5 w-5 mr-2" />
                <span className="font-medium">Escolher Arquivo</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 dark:border-emerald-800 dark:from-emerald-950/20 dark:to-green-950/20 animate-in slide-in-from-top-2 duration-500 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                      {getFileTypeIcon(selectedFile.name)}
                    </div>
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 max-w-[250px] truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Arquivo carregado</span>
                      </div>
                      <div className="h-1 w-16 bg-emerald-200 dark:bg-emerald-800 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-emerald-500 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300 hover:scale-110"
                >
                  <X className="h-5 w-5" />
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
        
        <div className="text-xs text-gray-600 dark:text-gray-400 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-950/20 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                <strong className="text-emerald-600 dark:text-emerald-400">Planilhas</strong>
              </div>
              <p>Excel (.xlsx, .xls), CSV, LibreOffice (.ods)</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <strong className="text-blue-600 dark:text-blue-400">Documentos</strong>
              </div>
              <p>PDF, Word (.docx) com OCR inteligente</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                <strong className="text-purple-600 dark:text-purple-400">Imagens</strong>
              </div>
              <p>PNG, JPG com reconhecimento automático</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
              <strong className="text-orange-600 dark:text-orange-400">Limite:</strong>
              <span>50MB por arquivo • Processamento inteligente com IA</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-in slide-in-from-top-1 duration-300 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
