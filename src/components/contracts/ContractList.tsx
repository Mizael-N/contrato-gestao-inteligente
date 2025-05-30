import { useState } from 'react';
import { Contract, LicitationFilter } from '@/types/contract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Eye, Plus, Upload, Search } from 'lucide-react';

interface ContractListProps {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
  onView: (contract: Contract) => void;
  onNew: () => void;
  onImport: () => void;
}

export default function ContractList({ contracts, onEdit, onDelete, onView, onNew, onImport }: ContractListProps) {
  const [filters, setFilters] = useState<LicitationFilter>({});
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      vigente: { label: 'Vigente', variant: 'default' as const },
      suspenso: { label: 'Suspenso', variant: 'secondary' as const },
      encerrado: { label: 'Encerrado', variant: 'outline' as const },
      rescindido: { label: 'Rescindido', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const applyFilters = () => {
    return contracts.filter(contract => {
      if (filters.modalidade && contract.modalidade !== filters.modalidade) {
        return false;
      }
      if (filters.status && contract.status !== filters.status) {
        return false;
      }
      if (filters.dataInicio && filters.dataFim) {
        const startDate = new Date(filters.dataInicio);
        const endDate = new Date(filters.dataFim);
        const contractDate = new Date(contract.dataAssinatura);
        if (contractDate < startDate || contractDate > endDate) {
          return false;
        }
      }
      if (filters.valorMinimo && contract.valor < filters.valorMinimo) {
        return false;
      }
      if (filters.valorMaximo && contract.valor > filters.valorMaximo) {
        return false;
      }
      if (searchTerm && !contract.numero.toLowerCase().includes(searchTerm.toLowerCase()) && !contract.objeto.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
  };

  const filteredContracts = applyFilters();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestão de Contratos</h1>
        <div className="flex space-x-2">
          <Button onClick={onImport} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar Planilha
          </Button>
          <Button onClick={onNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Contrato
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="modalidade" className="block text-sm font-medium text-gray-700">Modalidade</label>
              <Select onValueChange={(value) => setFilters({ ...filters, modalidade: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="pregao">Pregão</SelectItem>
                  <SelectItem value="concorrencia">Concorrência</SelectItem>
                  <SelectItem value="tomada_precos">Tomada de Preços</SelectItem>
                  <SelectItem value="convite">Convite</SelectItem>
                  <SelectItem value="concurso">Concurso</SelectItem>
                  <SelectItem value="leilao">Leilão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <Select onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="vigente">Vigente</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                  <SelectItem value="rescindido">Rescindido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="periodo" className="block text-sm font-medium text-gray-700">Período</label>
              <div className="flex space-x-2">
                <Input
                  type="date"
                  onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                />
                <Input
                  type="date"
                  onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="valorMinimo" className="block text-sm font-medium text-gray-700">Valor Mínimo</label>
              <Input
                type="number"
                placeholder="R$"
                onChange={(e) => setFilters({ ...filters, valorMinimo: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label htmlFor="valorMaximo" className="block text-sm font-medium text-gray-700">Valor Máximo</label>
              <Input
                type="number"
                placeholder="R$"
                onChange={(e) => setFilters({ ...filters, valorMaximo: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">Pesquisar</label>
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Número ou objeto do contrato"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Contratos ({filteredContracts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Objeto</TableHead>
                <TableHead>Contratada</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Assinatura</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>{contract.numero}</TableCell>
                  <TableCell>{contract.objeto}</TableCell>
                  <TableCell>{contract.contratada}</TableCell>
                  <TableCell>{formatCurrency(contract.valor)}</TableCell>
                  <TableCell>{formatDate(contract.dataAssinatura)}</TableCell>
                  <TableCell>
                    {getStatusBadge(contract.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => onView(contract)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => onEdit(contract)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => onDelete(contract.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredContracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    Nenhum contrato encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
