
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet } from 'lucide-react';
import { Contract } from '@/types/contract';
import FileInput from './import/FileInput';
import ImportProgress from './import/ImportProgress';
import ContractsPreview from './import/ContractsPreview';
import { processSpreadsheet } from './import/SpreadsheetProcessor';

interface ContractImportProps {
  onImport: (contracts: Partial<Contract>[]) => void;
  onCancel: () => void;
}

export default function ContractImport({ onImport, onCancel }: ContractImportProps) {
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [importProgress, setImportProgress] = useState<{ stage: string; progress: number; message: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setError('');
      setPreview(null);
      setImportProgress(null);
      
      const fileName = selectedFile.name.toLowerCase();
      
      // Only accept spreadsheet files
      if (fileName.includes('.xlsx') || fileName.includes('.xls') || fileName.includes('.csv') || fileName.includes('.ods')) {
        processSpreadsheet(selectedFile, setImporting, setPreview, setError, setImportProgress);
      } else {
        setError('Formato de arquivo não suportado. Use apenas planilhas (Excel, CSV, ODS).');
      }
    }
  };

  const handleImportComplete = (contracts: Partial<Contract>[]) => {
    if (contracts.length > 0) {
      onImport(contracts);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            Importação de Planilhas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileInput onFileChange={handleFileChange} error={error} />

          <ImportProgress
            importing={importing}
            progress={importProgress}
            fileType="spreadsheet"
          />

          <ContractsPreview
            preview={preview}
            fileType="spreadsheet"
            importing={importing}
            onImport={handleImportComplete}
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
