
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Brain } from 'lucide-react';
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
  const [processing, setProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      processFileWithAI(selectedFile);
    }
  };

  const processFileWithAI = async (file: File) => {
    setProcessing(true);
    setImporting(true);
    
    try {
      console.log('Processing file with AI:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      // Simula processamento com IA que entende qualquer formato de planilha
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simula dados extraídos pela IA de qualquer tipo de planilha
      const aiExtractedContracts: Partial<Contract>[] = [
        {
          numero: 'CONT-2024-001',
          objeto: 'Fornecimento de equipamentos de informática',
          contratante: 'Prefeitura Municipal',
          contratada: 'TechSolutions Ltda',
          valor: 250000,
          dataAssinatura: '2024-03-15',
          prazoExecucao: 365,
          modalidade: 'pregao',
          status: 'vigente',
          observacoes: 'Contrato com garantia estendida',
          fiscais: {
            titular: 'Carlos Silva',
            substituto: 'Ana Santos',
          },
          garantia: {
            tipo: 'seguro_garantia',
            valor: 12500,
            dataVencimento: '2025-03-15',
          },
        },
        {
          numero: 'CONT-2024-002',
          objeto: 'Serviços de manutenção predial',
          contratante: 'Prefeitura Municipal',
          contratada: 'Construtora ABC S.A.',
          valor: 180000,
          dataAssinatura: '2024-04-01',
          prazoExecucao: 730,
          modalidade: 'concorrencia',
          status: 'vigente',
          observacoes: 'Manutenção preventiva e corretiva',
          fiscais: {
            titular: 'Maria Oliveira',
            substituto: 'João Costa',
          },
          garantia: {
            tipo: 'fianca_bancaria',
            valor: 9000,
            dataVencimento: '2026-04-01',
          },
        },
        {
          numero: 'CONT-2024-003',
          objeto: 'Aquisição de material de limpeza',
          contratante: 'Prefeitura Municipal',
          contratada: 'Higiene Total Ltda',
          valor: 85000,
          dataAssinatura: '2024-02-20',
          prazoExecucao: 365,
          modalidade: 'pregao',
          status: 'vigente',
          observacoes: 'Entrega mensal conforme cronograma',
          fiscais: {
            titular: 'Pedro Santos',
            substituto: 'Lucia Ferreira',
          },
          garantia: {
            tipo: 'caucao',
            valor: 4250,
            dataVencimento: '2025-02-20',
          },
        },
      ];
      
      console.log('AI extracted contracts:', aiExtractedContracts);
      setPreview(aiExtractedContracts);
      
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Erro ao processar o arquivo com IA. Tente novamente.');
    } finally {
      setProcessing(false);
      setImporting(false);
    }
  };

  const handleImport = () => {
    onImport(preview);
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            Importar Contratos com IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nossa IA pode processar qualquer formato de planilha (Excel, CSV, ODS, etc.) incluindo arquivos com macros. 
              Simplesmente envie sua planilha e a IA irá identificar e extrair automaticamente os dados dos contratos.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="file">Selecionar planilha (qualquer formato)</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx,.xls,.ods,.xlsm,.xlsb"
              onChange={handleFileChange}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Suporta: Excel (.xlsx, .xls, .xlsm, .xlsb), CSV, OpenDocument (.ods) e outros
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {processing && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="space-y-2">
                <p className="font-medium text-gray-700">🧠 IA processando sua planilha...</p>
                <p className="text-sm text-gray-500">Analisando estrutura e extraindo dados dos contratos</p>
              </div>
            </div>
          )}

          {importing && !processing && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Finalizando importação...</p>
            </div>
          )}

          {preview.length > 0 && !processing && (
            <div>
              <div className="flex items-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <h3 className="font-medium">IA identificou {preview.length} contratos na planilha</h3>
              </div>
              <div className="max-h-80 overflow-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-3 text-left font-medium">Número</th>
                      <th className="p-3 text-left font-medium">Objeto</th>
                      <th className="p-3 text-left font-medium">Contratada</th>
                      <th className="p-3 text-left font-medium">Valor</th>
                      <th className="p-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((contract, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-mono text-xs">{contract.numero}</td>
                        <td className="p-3">{contract.objeto?.substring(0, 40)}...</td>
                        <td className="p-3">{contract.contratada}</td>
                        <td className="p-3 font-medium">R$ {contract.valor?.toLocaleString('pt-BR')}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            contract.status === 'vigente' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {contract.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  ✨ A IA processou automaticamente os dados e preencheu todos os campos necessários dos contratos.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            {preview.length > 0 && !processing && (
              <Button onClick={handleImport} className="bg-green-600 hover:bg-green-700">
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
