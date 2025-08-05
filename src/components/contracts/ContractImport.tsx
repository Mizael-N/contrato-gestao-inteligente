
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, FileText, Image, Brain } from 'lucide-react';
import { Contract } from '@/types/contract';
import { useDocumentProcessor } from '@/hooks/useDocumentProcessor';
import FileInput from './import/FileInput';
import ImportProgress from './import/ImportProgress';
import ContractsPreview from './import/ContractsPreview';
import { processSpreadsheet } from './import/SpreadsheetProcessor';

interface ContractImportProps {
  onImport: (contracts: Partial<Contract>[]) => void;
  onCancel: () => void;
}

export default function ContractImport({ onImport, onCancel }: ContractImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<Partial<Contract>[]>([]);
  const [error, setError] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [fileType, setFileType] = useState<'spreadsheet' | 'document' | 'image' | null>(null);
  const [importProgress, setImportProgress] = useState<{ stage: string; progress: number; message: string } | null>(null);
  
  const { processDocument, processing, progress } = useDocumentProcessor();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setExtractedText('');
      setPreview([]);
      setImportProgress(null);
      
      const fileName = selectedFile.name.toLowerCase();
      const fileTypeCheck = selectedFile.type;
      
      // Determinar tipo de arquivo
      if (fileName.includes('.xlsx') || fileName.includes('.xls') || fileName.includes('.csv') || fileName.includes('.ods')) {
        setFileType('spreadsheet');
        processSpreadsheet(selectedFile, setImporting, setPreview, setError, setImportProgress);
      } else if (fileName.includes('.pdf') || fileName.includes('.docx') || fileName.includes('.doc')) {
        setFileType('document');
        processDocumentFile(selectedFile);
      } else if (fileTypeCheck.startsWith('image/')) {
        setFileType('image');
        processDocumentFile(selectedFile);
      } else {
        setError('Formato de arquivo não suportado. Use planilhas (Excel, CSV), documentos (PDF, Word) ou imagens.');
        setFileType(null);
      }
    }
  };

  const processDocumentFile = async (file: File) => {
    try {
      setImporting(true);
      const result = await processDocument(file);
      setPreview(result);
      
      // Simular texto extraído para demonstração
      if (result.length > 0) {
        const contract = result[0];
        setExtractedText(`
CONTRATO: ${contract.numero}
OBJETO: ${contract.objeto}
CONTRATADA: ${contract.contratada}
VALOR: R$ ${contract.valor?.toLocaleString('pt-BR')}
DATA INÍCIO: ${contract.dataInicio}
PRAZO: ${contract.prazoExecucao} ${contract.prazoUnidade}
        `.trim());
      }
    } catch (err) {
      console.error('Erro no processamento:', err);
      setError('Erro ao processar o documento. Verifique se o arquivo está legível e tente novamente.');
    } finally {
      setImporting(false);
    }
  };

  const handleImport = () => {
    onImport(preview);
  };

  const getFileIcon = () => {
    switch (fileType) {
      case 'spreadsheet': return <FileSpreadsheet className="h-5 w-5" />;
      case 'document': return <FileText className="h-5 w-5" />;
      case 'image': return <Image className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            {getFileIcon()}
            <span className="ml-2">Importação Inteligente com OCR</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileInput onFileChange={handleFileChange} error={error} />

          <ImportProgress
            processing={processing}
            importing={importing}
            progress={importProgress || progress}
            fileType={fileType}
            extractedText={extractedText}
          />

          <ContractsPreview
            preview={preview}
            fileType={fileType}
            processing={processing}
            importing={importing}
            onImport={handleImport}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
