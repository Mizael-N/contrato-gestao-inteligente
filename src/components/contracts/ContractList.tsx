
import { useState } from 'react';
import { Contract } from '@/types/contract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Plus, Search } from 'lucide-react';

interface ContractListProps {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
  onView: (contract: Contract) => void;
  onNew: () => void;
}

export default function ContractList({ contracts, onEdit, onDelete, onView, onNew }: ContractListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalidadeFilter, setModalidadeFilter] = useState('all');

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.objeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.contratada.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    const matchesModalidade = modalidadeFilter === 'all' || contract.modalidade === modalidadeFilter;
    
    return matchesSearch && matchesStatus && matchesModalidade;
  });

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Contratos</CardTitle>
          <Button onClick={onNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Contrato
          </Button>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar contratos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="vigente">Vigente</SelectItem>
              <SelectItem value="suspenso">Suspenso</SelectItem>
              <SelectItem value="encerrado">Encerrado</SelectItem>
              <SelectItem value="rescindido">Rescindido</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={modalidadeFilter} onValueChange={setModalidadeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Modalidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="pregao">Pregão</SelectItem>
              <SelectItem value="concorrencia">Concorrência</SelectItem>
              <SelectItem value="tomada_precos">Tomada de Preços</SelectItem>
              <SelectItem value="convite">Convite</SelectItem>
              <SelectItem value="concurso">Concurso</SelectItem>
              <SelectItem value="leilao">Leilão</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Objeto</TableHead>
              <TableHead>Contratada</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="font-medium">{contract.numero}</TableCell>
                <TableCell className="max-w-xs truncate">{contract.objeto}</TableCell>
                <TableCell>{contract.contratada}</TableCell>
                <TableCell>{formatCurrency(contract.valor)}</TableCell>
                <TableCell>{getStatusBadge(contract.status)}</TableCell>
                <TableCell className="capitalize">{contract.modalidade.replace('_', ' ')}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onView(contract)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onEdit(contract)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDelete(contract.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredContracts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum contrato encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
