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
import { Download, FileSpreadsheet, AlertTriangle, Info } from 'lucide-react';
import { Contract } from '@/types/contract';
import { useContractImport } from '@/hooks/useContractImport';
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ContractsPreviewProps {
  preview: {
    contracts: Partial<Contract>[];
    analysis: any[];
    validation: any;
  } | Partial<Contract>[];
  fileType: 'spreadsheet' | 'document' | 'image' | null;
  processing: boolean;
  importing: boolean;
  onImport: (contracts: Partial<Contract>[]) => void;
}

export default function ContractsPreview({ preview, fileType, processing, importing, onImport }: ContractsPreviewProps) {
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const { importing: importingContracts, progress, importContracts } = useContractImport();

  // Handle preview data structure (enhanced vs legacy)
  const contracts = preview?.contracts || preview || [];
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
    const missingData = [];
    if (!contract.dataInicio) missingData.push('Data Início');
    if (!contract.dataTermino) missingData.push('Data Término');
    if (!contract.valor || contract.valor === 0) missingData.push('Valor');
    
    if (missingData.length === 0) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Completo</Badge>;
    }
    
    return <Badge variant="destructive">Faltam: {missingData.join(', ')}</Badge>;
  };

  if (processing || importing) {
    return null;
  }

  if (contracts.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            Preview dos Contratos ({contracts.length})
          </CardTitle>
          
          {/* Enhanced Analysis Summary */}
          {validation && (
            <div className="space-y-2">
              {validation.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Avisos de Análise</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {validation.warnings.slice(0, 5).map((warning, index) => (
                        <li key={index} className="text-sm">{warning}</li>
                      ))}
                      {validation.warnings.length > 5 && (
                        <li className="text-sm text-muted-foreground">
                          ... e mais {validation.warnings.length - 5} avisos
                        </li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              {validation.suggestions.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Sugestões</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {validation.suggestions.slice(0, 3).map((suggestion, index) => (
                        <li key={index} className="text-sm">{suggestion}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          {/* Column Analysis (if available) */}
          {analysis.length > 0 && (
            <div className="bg-muted p-3 rounded-md">
              <h4 className="text-sm font-medium mb-2">Análise de Colunas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                {analysis.slice(0, 9).map((col, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="truncate">{col.header}</span>
                    <span className={`ml-2 ${col.field ? 'text-green-600' : 'text-gray-400'}`}>
                      {col.field || 'não mapeado'}
                    </span>
                  </div>
                ))}
                {analysis.length > 9 && (
                  <div className="text-muted-foreground">
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
                    Importar Selecionados
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Import Progress */}
          {progress && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>{progress.current}</span>
                <span>{progress.processed} de {progress.total}</span>
              </div>
              <Progress value={(progress.processed / progress.total) * 100} />
              {progress.errors.length > 0 && (
                <div className="text-sm text-red-600">
                  {progress.errors.slice(0, 3).map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contracts Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
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
                  <TableRow key={index}>
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
                      {contract.valor ? `R$ ${contract.valor.toLocaleString('pt-BR')}` : '-'}
                    </TableCell>
                    <TableCell>
                      {contract.dataInicio || (
                        <span className="text-orange-600 text-xs">⚠️ Faltando</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contract.dataTermino || (
                        <span className="text-orange-600 text-xs">⚠️ Faltando</span>
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
