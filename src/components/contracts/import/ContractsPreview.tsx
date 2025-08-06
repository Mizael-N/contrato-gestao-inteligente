
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, FileText, Image, CheckCircle2, AlertCircle } from 'lucide-react';
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

export default function ContractsPreview({ 
  preview, 
  fileType, 
  processing, 
  importing: externalImporting,
  onImport 
}: ContractsPreviewProps) {
  const [selectedContracts, setSelectedContracts] = useState<Set<number>>(new Set());
  const { importing, progress, importContracts } = useContractImport();

  if (processing || externalImporting) return null;
  if (preview.length === 0) return null;

  const toggleContract = (index: number) => {
    const newSelected = new Set(selectedContracts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedContracts(newSelected);
  };

  const toggleAll = () => {
    if (selectedContracts.size === preview.length) {
      setSelectedContracts(new Set());
    } else {
      setSelectedContracts(new Set(preview.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    const contractsToImport = preview.filter((_, index) => selectedContracts.has(index));
    const success = await importContracts(contractsToImport);
    
    if (success) {
      // Limpar seleção após importação bem-sucedida
      setSelectedContracts(new Set());
      onImport(contractsToImport);
    }
  };

  const getFileIcon = () => {
    switch (fileType) {
      case 'spreadsheet': return <FileSpreadsheet className="h-5 w-5" />;
      case 'document': return <FileText className="h-5 w-5" />;
      case 'image': return <Image className="h-5 w-5" />;
      default: return null;
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status?: string) => {
    const statusMap = {
      'vigente': { label: 'Vigente', variant: 'default' as const },
      'suspenso': { label: 'Suspenso', variant: 'secondary' as const },
      'encerrado': { label: 'Encerrado', variant: 'outline' as const },
      'rescindido': { label: 'Rescindido', variant: 'destructive' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.vigente;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  // Se está importando, mostrar apenas a barra de progresso
  if (importing && progress) {
    return <ImportProgressBar {...progress} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            {getFileIcon()}
            <span className="ml-2">
              Pré-visualização ({preview.length} contrato{preview.length !== 1 ? 's' : ''} encontrado{preview.length !== 1 ? 's' : ''})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAll}
            >
              {selectedContracts.size === preview.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </Button>
            <Button
              onClick={handleImport}
              disabled={selectedContracts.size === 0}
              className="min-w-[120px]"
            >
              {selectedContracts.size === 0 
                ? 'Selecione contratos'
                : `Importar ${selectedContracts.size} contrato${selectedContracts.size !== 1 ? 's' : ''}`
              }
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedContracts.size === preview.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Objeto</TableHead>
                <TableHead>Contratada</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Término</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.map((contract, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedContracts.has(index)}
                      onChange={() => toggleContract(index)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{contract.numero}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={contract.objeto}>
                    {contract.objeto}
                  </TableCell>
                  <TableCell>{contract.contratada}</TableCell>
                  <TableCell>{formatCurrency(contract.valor)}</TableCell>
                  <TableCell>{contract.dataInicio}</TableCell>
                  <TableCell>{contract.dataTermino}</TableCell>
                  <TableCell>{getStatusBadge(contract.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
