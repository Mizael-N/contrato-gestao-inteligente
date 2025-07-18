
import { useState } from 'react';
import { Contract } from '@/types/contract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, Plus, Upload, Search, DollarSign, Calendar, Building } from 'lucide-react';

interface ContractGridProps {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
  onView: (contract: Contract) => void;
  onNew: () => void;
  onImport: () => void;
}

export default function ContractGrid({ contracts, onEdit, onDelete, onView, onNew, onImport }: ContractGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalidadeFilter, setModalidadeFilter] = useState('');

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
      vigente: { 
        label: 'Vigente', 
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
      },
      suspenso: { 
        label: 'Suspenso', 
        variant: 'secondary' as const,
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
      },
      encerrado: { 
        label: 'Encerrado', 
        variant: 'outline' as const,
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700' 
      },
      rescindido: { 
        label: 'Rescindido', 
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300' 
      },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.vigente;
    return (
      <Badge 
        variant={config.variant} 
        className={config.className}
      >
        {config.label}
      </Badge>
    );
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = searchTerm === '' || 
      contract.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.objeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contratada.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || contract.status === statusFilter;
    const matchesModalidade = modalidadeFilter === '' || contract.modalidade === modalidadeFilter;
    
    return matchesSearch && matchesStatus && matchesModalidade;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Contratos</h1>
          <p className="text-gray-600 dark:text-gray-300">{filteredContracts.length} contratos encontrados</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onImport} variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button onClick={onNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Contrato
          </Button>
        </div>
      </div>

      {/* Filtros Compactos */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Buscar contratos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="vigente">Vigente</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
                <SelectItem value="encerrado">Encerrado</SelectItem>
                <SelectItem value="rescindido">Rescindido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={modalidadeFilter} onValueChange={setModalidadeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas modalidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas modalidades</SelectItem>
                <SelectItem value="pregao">Pregão</SelectItem>
                <SelectItem value="concorrencia">Concorrência</SelectItem>
                <SelectItem value="tomada_precos">Tomada de Preços</SelectItem>
                <SelectItem value="convite">Convite</SelectItem>
                <SelectItem value="concurso">Concurso</SelectItem>
                <SelectItem value="leilao">Leilão</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setModalidadeFilter('');
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Contratos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContracts.map((contract) => (
          <Card key={contract.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">{contract.numero}</CardTitle>
                  {getStatusBadge(contract.status)}
                </div>
                <div className="flex gap-1">
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
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{contract.objeto}</p>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Building className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-300 truncate">{contract.contratada}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                  <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(contract.valor)}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-300">{formatDate(contract.dataAssinatura)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="capitalize">{contract.modalidade.replace('_', ' ')}</span>
                  <span>{contract.aditivos.length} aditivos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContracts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Search className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">Nenhum contrato encontrado</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Tente ajustar os filtros ou criar um novo contrato</p>
            </div>
            <Button onClick={onNew}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Contrato
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
