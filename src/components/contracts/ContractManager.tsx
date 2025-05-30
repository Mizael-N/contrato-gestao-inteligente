
import { useState } from 'react';
import { Contract } from '@/types/contract';
import ContractList from './ContractList';
import ContractForm from './ContractForm';
import ContractDetails from './ContractDetails';
import { useToast } from '@/hooks/use-toast';

// Dados mockados para demonstração
const mockContracts: Contract[] = [
  {
    id: '1',
    numero: '001/2024',
    objeto: 'Fornecimento de material de escritório para todas as unidades administrativas',
    contratante: 'Prefeitura Municipal',
    contratada: 'Empresa ABC Ltda',
    valor: 150000,
    dataAssinatura: '2024-01-15',
    prazoExecucao: 365,
    modalidade: 'pregao',
    status: 'vigente',
    garantia: {
      tipo: 'seguro_garantia',
      valor: 7500,
      dataVencimento: '2025-01-15'
    },
    fiscais: {
      titular: 'João Silva',
      substituto: 'Maria Santos'
    },
    aditivos: [],
    pagamentos: [],
    observacoes: 'Contrato com renovação automática por igual período',
    documentos: []
  },
  {
    id: '2',
    numero: '002/2024',
    objeto: 'Prestação de serviços de limpeza e conservação',
    contratante: 'Prefeitura Municipal',
    contratada: 'Limpeza Moderna S.A.',
    valor: 280000,
    dataAssinatura: '2024-02-01',
    prazoExecucao: 730,
    modalidade: 'concorrencia',
    status: 'vigente',
    garantia: {
      tipo: 'fianca_bancaria',
      valor: 14000,
      dataVencimento: '2026-02-01'
    },
    fiscais: {
      titular: 'Carlos Oliveira',
      substituto: 'Ana Costa'
    },
    aditivos: [],
    pagamentos: [],
    observacoes: '',
    documentos: []
  }
];

export default function ContractManager() {
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [currentView, setCurrentView] = useState<'list' | 'form' | 'details'>('list');
  const [selectedContract, setSelectedContract] = useState<Contract | undefined>();
  const { toast } = useToast();

  const handleNew = () => {
    setSelectedContract(undefined);
    setCurrentView('form');
  };

  const handleEdit = (contract: Contract) => {
    setSelectedContract(contract);
    setCurrentView('form');
  };

  const handleView = (contract: Contract) => {
    setSelectedContract(contract);
    setCurrentView('details');
  };

  const handleDelete = (contractId: string) => {
    setContracts(contracts.filter(c => c.id !== contractId));
    toast({
      title: 'Contrato excluído',
      description: 'O contrato foi excluído com sucesso.',
    });
  };

  const handleSubmit = (contractData: Partial<Contract>) => {
    if (selectedContract) {
      // Atualizar contrato existente
      setContracts(contracts.map(c => 
        c.id === selectedContract.id 
          ? { ...selectedContract, ...contractData }
          : c
      ));
      toast({
        title: 'Contrato atualizado',
        description: 'O contrato foi atualizado com sucesso.',
      });
    } else {
      // Criar novo contrato
      const newContract: Contract = {
        id: Date.now().toString(),
        aditivos: [],
        pagamentos: [],
        documentos: [],
        ...contractData
      } as Contract;
      setContracts([...contracts, newContract]);
      toast({
        title: 'Contrato criado',
        description: 'O novo contrato foi criado com sucesso.',
      });
    }
    setCurrentView('list');
  };

  const handleCancel = () => {
    setCurrentView('list');
    setSelectedContract(undefined);
  };

  if (currentView === 'form') {
    return (
      <ContractForm
        contract={selectedContract}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    );
  }

  if (currentView === 'details' && selectedContract) {
    return (
      <ContractDetails
        contract={selectedContract}
        onEdit={handleEdit}
        onBack={handleCancel}
      />
    );
  }

  return (
    <ContractList
      contracts={contracts}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
      onNew={handleNew}
    />
  );
}
