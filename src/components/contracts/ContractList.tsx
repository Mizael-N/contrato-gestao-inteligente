
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Contract } from '@/types/contract';
import { Search, Calendar, DollarSign, Building2, FileText, Eye, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ContractListProps {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onView: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
  loading?: boolean;
}

export default function ContractList({ contracts, onEdit, onView, onDelete, loading }: ContractListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const matchesSearch = 
        contract.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.objeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.contratada.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchTerm, statusFilter]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'vigente': return 'default';
      case 'suspenso': return 'secondary';
      case 'encerrado': return 'outline';
      case 'rescindido': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vigente': return 'text-green-600';
      case 'suspenso': return 'text-yellow-600';
      case 'encerrado': return 'text-gray-600';
      case 'rescindido': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const calculateTimeRemaining = (contract: Contract) => {
    if (contract.status !== 'vigente') return null;
    
    const endDate = new Date(contract.dataInicio);
    if (contract.prazoUnidade === 'anos') {
      endDate.setFullYear(endDate.getFullYear() + contract.prazoExecucao);
    } else if (contract.prazoUnidade === 'meses') {
      endDate.setMonth(endDate.getMonth() + contract.prazoExecucao);
    } else {
      endDate.setDate(endDate.getDate() + contract.prazoExecucao);
    }
    
    const today = new Date();
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return { days: Math.abs(daysDiff), status: 'expired' };
    if (daysDiff <= 30) return { days: daysDiff, status: 'warning' };
    if (daysDiff <= 90) return { days: daysDiff, status: 'attention' };
    return { days: daysDiff, status: 'normal' };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros de Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por número, objeto ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="md:w-48">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os Status</option>
                <option value="vigente">Vigente</option>
                <option value="suspenso">Suspenso</option>
                <option value="encerrado">Encerrado</option>
                <option value="rescindido">Rescindido</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredContracts.length} contrato{filteredContracts.length !== 1 ? 's' : ''} encontrado{filteredContracts.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contratos */}
      <div className="space-y-4">
        {filteredContracts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum contrato encontrado
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de pesquisa.'
                  : 'Comece adicionando um novo contrato.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredContracts.map((contract) => {
            const timeRemaining = calculateTimeRemaining(contract);
            
            return (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {contract.numero}
                        </h3>
                        <Badge variant={getStatusVariant(contract.status)}>
                          {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                        </Badge>
                        {timeRemaining && timeRemaining.status === 'expired' && (
                          <Badge variant="destructive">
                            Vencido há {timeRemaining.days} dias
                          </Badge>
                        )}
                        {timeRemaining && timeRemaining.status === 'warning' && (
                          <Badge variant="destructive">
                            Vence em {timeRemaining.days} dias
                          </Badge>
                        )}
                        {timeRemaining && timeRemaining.status === 'attention' && (
                          <Badge variant="secondary">
                            Vence em {timeRemaining.days} dias
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {contract.objeto}
                      </p>
                      
                      {/* Informações principais */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-gray-500">Contratada</div>
                            <div className="font-medium">{contract.contratada}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-gray-500">Valor</div>
                            <div className="font-medium">
                              R$ {contract.valor.toLocaleString('pt-BR')}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-gray-500">Início</div>
                            <div className="font-medium">
                              {new Date(contract.dataInicio).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-gray-500">Término</div>
                            <div className="font-medium">
                              {new Date(contract.dataTermino).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Ações */}
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(contract)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(contract)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o contrato "{contract.numero}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => onDelete(contract.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
