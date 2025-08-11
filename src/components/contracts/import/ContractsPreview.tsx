
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, FileSpreadsheet, AlertTriangle, Info, Calendar, DollarSign } from 'lucide-react';
import { Contract } from '@/types/contract';
import { useContractImport } from '@/hooks/useContractImport';
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ContractsPreviewProps {
  preview: {
    contracts: Partial<Contract>[];
    analysis: any[];
    validation: any;
  } | null;
  fileType: 'spreadsheet';
  importing: boolean;
  onImport: (contracts: Partial<Contract>[]) => void;
}

export default function ContractsPreview({ preview, fileType, importing, onImport }: ContractsPreviewProps) {
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const { importing: importingContracts, progress, importContracts } = useContractImport();

  const contracts = preview?.contracts || [];
  const analysis = preview?.analysis || [];
  const validation = preview?.validation || null;

  useEffect(() => {
    if (contracts.length > 0) {
      setSelectedContracts(contracts.map((_, index) => index.toString()));
    }
  }, [contracts]);

  const handleSelectAll = () => {
    if (selectedContracts.length === contracts.length) {
      setSelectedContracts([]);
    } else {
      setSelectedContracts(contracts.map((_, index) => index.toString()));
    }
  };

  const handleContractSelect = (index: string) => {
    setSelectedContracts(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleImport = async () => {
    const contractsToImport = selectedContracts.map(index => contracts[parseInt(index)]);
    const success = await importContracts(contractsToImport);
    if (success) {
      onImport(contractsToImport);
    }
  };

  const getStatusBadge = (contract: Partial<Contract>) => {
    const issues = [];
    
    if (!contract.dataInicio) issues.push('Data Início');
    if (!contract.dataTermino) issues.push('Data Término'); 
    if (!contract.valor || contract.valor === 0) issues.push('Valor');
    
    if (issues.length === 0) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Completo</Badge>;
    }
    
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
        Revisar: {issues.join(', ')}
      </Badge>
    );
  };

  const countMissingDates = () => {
    return contracts.filter(c => !c.dataInicio || !c.dataTermino).length;
  };

  const countMissingValues = () => {
    return contracts.filter(c => !c.valor || c.valor === 0).length;
  };

  if (importing) {
    return null;
  }

  if (contracts.length === 0) {
    return null;
  }

  const missingDates = countMissingDates();
  const missingValues = countMissingValues();

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            Contratos Encontrados ({contracts.length})
          </CardTitle>
          
          {/* Resumo dos dados extraídos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-semibold text-blue-900">{contracts.length}</div>
                <div className="text-sm text-blue-700">Contratos encontrados</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-amber-50 rounded-lg">
              <Calendar className="h-5 w-5 text-amber-600" />
              <div>
                <div className="font-semibold text-amber-900">{missingDates}</div>
                <div className="text-sm text-amber-700">Sem datas reconhecidas</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-semibold text-red-900">{missingValues}</div>
                <div className="text-sm text-red-700">Sem valores reconhecidos</div>
              </div>
            </div>
          </div>

          {/* Avisos importantes */}
          {missingDates > 0 && (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertTitle>Datas não reconhecidas automaticamente</AlertTitle>
              <AlertDescription>
                {missingDates} contrato(s) não tiveram suas datas de início e/ou término reconhecidas. 
                Você precisará inserir essas informações manualmente após a importação.
              </AlertDescription>
            </Alert>
          )}

          {missingValues > 0 && (
            <Alert>
              <DollarSign className="h-4 w-4" />
              <AlertTitle>Valores não reconhecidos automaticamente</AlertTitle>
              <AlertDescription>
                {missingValues} contrato(s) não tiveram seus valores reconhecidos. 
                Verifique se os valores estão em formato numérico ou de moeda na planilha.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Avisos da validação */}
          {validation && validation.warnings && validation.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Avisos da Análise</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validation.warnings.slice(0, 3).map((warning: string, index: number) => (
                    <li key={index} className="text-sm">{warning}</li>
                  ))}
                  {validation.warnings.length > 3 && (
                    <li className="text-sm text-muted-foreground">
                      ... e mais {validation.warnings.length - 3} avisos
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Mapeamento de colunas */}
          {analysis.length > 0 && (
            <div className="bg-muted p-3 rounded-md">
              <h4 className="text-sm font-medium mb-2">Mapeamento de Colunas Detectado</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                {analysis.slice(0, 9).map((col: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="truncate font-medium">{col.header}</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      col.field ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {col.field || 'não reconhecido'}
                    </span>
                  </div>
                ))}
                {analysis.length > 9 && (
                  <div className="text-muted-foreground text-center col-span-full">
                    ... e mais {analysis.length - 9} colunas
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedContracts.length === contracts.length}
                onCheckedChange={handleSelectAll}
              />
              <label className="text-sm font-medium">
                Selecionar todos ({selectedContracts.length} de {contracts.length})
              </label>
            </div>
            
            {selectedContracts.length > 0 && (
              <Button 
                onClick={handleImport}
                disabled={importingContracts}
                className="flex items-center"
              >
                {importingContracts ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Importar {selectedContracts.length} Contrato(s)
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Progresso da importação */}
          {progress && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>{progress.current}</span>
                <span>{progress.processed} de {progress.total}</span>
              </div>
              <Progress value={(progress.processed / progress.total) * 100} />
              {progress.errors.length > 0 && (
                <div className="text-sm text-red-600 max-h-20 overflow-y-auto">
                  {progress.errors.slice(0, 3).map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tabela de contratos */}
          <div className="border rounded-md max-h-96 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedContracts.length === contracts.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Objeto</TableHead>
                  <TableHead>Contratada</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Data Término</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedContracts.includes(index.toString())}
                        onCheckedChange={() => handleContractSelect(index.toString())}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {contract.numero}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={contract.objeto}>
                        {contract.objeto}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={contract.contratada}>
                        {contract.contratada}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contract.valor && contract.valor > 0 ? (
                        `R$ ${contract.valor.toLocaleString('pt-BR')}`
                      ) : (
                        <span className="text-amber-600 text-xs flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Não reconhecido
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contract.dataInicio ? (
                        new Date(contract.dataInicio).toLocaleDateString('pt-BR')
                      ) : (
                        <span className="text-amber-600 text-xs flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Não reconhecida
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contract.dataTermino ? (
                        new Date(contract.dataTermino).toLocaleDateString('pt-BR')
                      ) : (
                        <span className="text-amber-600 text-xs flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Não reconhecida
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(contract)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
