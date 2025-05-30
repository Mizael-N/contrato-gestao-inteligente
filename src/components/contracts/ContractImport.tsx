
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { Contract } from '@/types/contract';

interface ContractImportProps {
  onImport: (contracts: Partial<Contract>[]) => void;
  onCancel: () => void;
}

export default function ContractImport({ onImport, onCancel }: ContractImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<Partial<Contract>[]>([]);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
        setError('Por favor, selecione um arquivo CSV ou Excel (.xlsx)');
        return;
      }
      setFile(selectedFile);
      setError('');
      processFile(selectedFile);
    }
  };

  const processFile = async (file: File) => {
    setImporting(true);
    try {
      // Simulação de processamento de arquivo
      // Em uma implementação real, você usaria uma biblioteca como Papa Parse para CSV
      // ou SheetJS para Excel
      
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const contracts: Partial<Contract>[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < headers.length) continue;
        
        const contract: Partial<Contract> = {
          numero: values[0] || '',
          objeto: values[1] || '',
          contratante: values[2] || 'Prefeitura Municipal',
          contratada: values[3] || '',
          valor: parseFloat(values[4]) || 0,
          dataAssinatura: values[5] || '',
          prazoExecucao: parseInt(values[6]) || 365,
          modalidade: (values[7] as any) || 'pregao',
          status: (values[8] as any) || 'vigente',
          observacoes: values[9] || '',
          fiscais: {
            titular: values[10] || '',
            substituto: values[11] || '',
          },
          garantia: {
            tipo: (values[12] as any) || 'caucao',
            valor: parseFloat(values[13]) || 0,
            dataVencimento: values[14] || '',
          },
          aditivos: [],
          pagamentos: [],
          documentos: [],
        };
        
        contracts.push(contract);
      }
      
      setPreview(contracts);
    } catch (err) {
      setError('Erro ao processar o arquivo. Verifique o formato.');
    } finally {
      setImporting(false);
    }
  };

  const handleImport = () => {
    onImport(preview);
  };

  const downloadTemplate = () => {
    const headers = [
      'numero',
      'objeto',
      'contratante',
      'contratada',
      'valor',
      'dataAssinatura',
      'prazoExecucao',
      'modalidade',
      'status',
      'observacoes',
      'fiscalTitular',
      'fiscalSubstituto',
      'garantiaTipo',
      'garantiaValor',
      'garantiaVencimento'
    ];
    
    const example = [
      '001/2024',
      'Fornecimento de material de escritório',
      'Prefeitura Municipal',
      'Empresa ABC Ltda',
      '150000',
      '2024-01-15',
      '365',
      'pregao',
      'vigente',
      'Contrato com renovação automática',
      'João Silva',
      'Maria Santos',
      'seguro_garantia',
      '7500',
      '2025-01-15'
    ];
    
    const csv = [headers.join(','), example.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_contratos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            Importar Contratos via Planilha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Baixe o template para garantir que sua planilha tenha o formato correto.
              <Button variant="link" onClick={downloadTemplate} className="p-0 ml-2 h-auto">
                Baixar template CSV
              </Button>
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="file">Selecionar arquivo (CSV ou Excel)</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {importing && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Processando arquivo...</p>
            </div>
          )}

          {preview.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Prévia dos dados ({preview.length} contratos)</h3>
              <div className="max-h-60 overflow-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Número</th>
                      <th className="p-2 text-left">Objeto</th>
                      <th className="p-2 text-left">Contratada</th>
                      <th className="p-2 text-left">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((contract, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{contract.numero}</td>
                        <td className="p-2">{contract.objeto?.substring(0, 30)}...</td>
                        <td className="p-2">{contract.contratada}</td>
                        <td className="p-2">R$ {contract.valor?.toLocaleString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 5 && (
                  <p className="p-2 text-xs text-gray-500 border-t">
                    ... e mais {preview.length - 5} contratos
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            {preview.length > 0 && (
              <Button onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Importar {preview.length} contratos
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
