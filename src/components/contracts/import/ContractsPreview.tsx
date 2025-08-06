
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileSpreadsheet, FileText, Image, CheckCircle, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { Contract } from '@/types/contract';
import { useContractImport } from '@/hooks/useContractImport';
import ImportProgressBar from './ImportProgressBar';

interface ContractsPreviewProps {
  preview: Partial<Contract>[];
  fileType: 'spreadsheet' | 'document' | 'image' | null;
  processing: boolean;
  importing: boolean;
  onImport: (contracts: Partial<Contract>[]) => void;
}

export default function ContractsPreview({ preview, fileType, processing, importing, onImport }: ContractsPreviewProps) {
  const { importing: importingContracts, progress, importContracts } = useContractImport();

  const handleImport = async () => {
    const success = await importContracts(preview);
    if (success) {
      onImport(preview);
    }
  };

  const getFileIcon = () => {
    switch (fileType) {
      case 'spreadsheet': return <FileSpreadsheet className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vigente': return 'bg-green-100 text-green-800 border-green-200';
      case 'suspenso': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'encerrado': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rescindido': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const checkMissingFields = (contract: Partial<Contract>) => {
    const missing: string[] = [];
    if (!contract.dataInicio) missing.push('Data de Início');
    if (!contract.dataTermino) missing.push('Data de Término');
    if (!contract.prazoExecucao || contract.prazoExecucao === 0) missing.push('Prazo');
    return missing;
  };

  const contractsWithMissingData = preview.filter(contract => checkMissingFields(contract).length > 0);

  if (processing || importing) return null;

  if (preview.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Alerta para contratos com dados faltantes */}
      {contractsWithMissingData.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{contractsWithMissingData.length}</strong> contrato(s) precisam de preenchimento manual das datas e/ou prazos. 
            Revise os dados antes de importar e complete as informações faltantes após a importação.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              {getFileIcon()}
              <span className="ml-2">Pré-visualização dos Contratos</span>
              <Badge variant="secondary" className="ml-2">
                {preview.length} contrato{preview.length !== 1 ? 's' : ''}
              </Badge>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Barra de progresso da importação */}
          {importingContracts && progress && (
            <div className="mb-6">
              <ImportProgressBar progress={progress} />
            </div>
          )}

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {preview.map((contract, index) => {
              const missingFields = checkMissingFields(contract);
              const hasMissingData = missingFields.length > 0;

              return (
                <div 
                  key={index} 
                  className={`p-4 border rounded-lg ${hasMissingData ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{contract.numero}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{contract.objeto}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasMissingData && (
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Revisar
                        </Badge>
                      )}
                      <Badge className={getStatusColor(contract.status || 'vigente')}>
                        {contract.status || 'vigente'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Contratada:</span>
                      <p className="truncate">{contract.contratada}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Valor:</span>
                      <p className="font-mono">R$ {contract.valor?.toLocaleString('pt-BR') || '0,00'}</p>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                      <span className="font-medium text-gray-700 mr-2">Início:</span>
                      {contract.dataInicio ? (
                        <p>{new Date(contract.dataInicio).toLocaleDateString('pt-BR')}</p>
                      ) : (
                        <p className="text-orange-600 font-medium">Não informado</p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                      <span className="font-medium text-gray-700 mr-2">Término:</span>
                      {contract.dataTermino ? (
                        <p>{new Date(contract.dataTermino).toLocaleDateString('pt-BR')}</p>
                      ) : (
                        <p className="text-orange-600 font-medium">Não informado</p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-gray-500" />
                      <span className="font-medium text-gray-700 mr-2">Prazo:</span>
                      {contract.prazoExecucao && contract.prazoExecucao > 0 ? (
                        <p>{contract.prazoExecucao} {contract.prazoUnidade}</p>
                      ) : (
                        <p className="text-orange-600 font-medium">Não informado</p>
                      )}
                    </div>
                  </div>

                  {/* Mostrar campos faltantes */}
                  {hasMissingData && (
                    <div className="mt-3 p-2 bg-orange-100 border border-orange-200 rounded text-sm">
                      <span className="font-medium text-orange-800">Campos para preencher: </span>
                      <span className="text-orange-700">{missingFields.join(', ')}</span>
                    </div>
                  )}

                  {contract.observacoes && (
                    <div className="mt-3 text-xs text-gray-500 bg-gray-100 p-2 rounded">
                      {contract.observacoes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleImport} 
              disabled={importingContracts}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {importingContracts ? 'Importando...' : `Importar ${preview.length} Contrato${preview.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
