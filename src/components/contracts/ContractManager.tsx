import { useState } from 'react';
import { Contract, Aditivo } from '@/types/contract';
import ContractList from './ContractList';
import ContractForm from './ContractForm';
import ContractDetails from './ContractDetails';
import AddendumForm from './AddendumForm';
import ContractImport from './ContractImport';
import ContractAlerts from './ContractAlerts';
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
  const [currentView, setCurrentView] = useState<'list' | 'form' | 'details' | 'addendum' | 'import'>('list');
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

  const handleCreateAddendum = (contract: Contract) => {
    setSelectedContract(contract);
    setCurrentView('addendum');
  };

  const handleAddendumSubmit = (addendumData: Omit<Aditivo, 'id'>) => {
    if (selectedContract) {
      const newAddendum: Aditivo = {
        id: Date.now().toString(),
        ...addendumData
      };

      const updatedContract = {
        ...selectedContract,
        aditivos: [...selectedContract.aditivos, newAddendum],
        // Atualiza valores do contrato se for aditivo de prazo ou valor
        ...(addendumData.tipo === 'prazo' && addendumData.prazoNovo ? 
          { prazoExecucao: addendumData.prazoNovo } : {}),
        ...(addendumData.tipo === 'valor' && addendumData.valorNovo ? 
          { valor: addendumData.valorNovo } : {}),
      };

      setContracts(contracts.map(c => 
        c.id === selectedContract.id ? updatedContract : c
      ));

      toast({
        title: 'Termo aditivo criado',
        description: 'O termo aditivo foi adicionado ao contrato com sucesso.',
      });
      
      setCurrentView('details');
      setSelectedContract(updatedContract);
    }
  };

  const handleImport = () => {
    setCurrentView('import');
  };

  const handleImportSubmit = (importedContracts: Partial<Contract>[]) => {
    const newContracts: Contract[] = importedContracts.map(contractData => ({
      id: Date.now().toString() + Math.random(),
      aditivos: [],
      pagamentos: [],
      documentos: [],
      ...contractData
    } as Contract));

    setContracts([...contracts, ...newContracts]);
    
    toast({
      title: 'Contratos importados',
      description: `${newContracts.length} contratos foram importados com sucesso.`,
    });
    
    setCurrentView('list');
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

  if (currentView === 'addendum' && selectedContract) {
    return (
      <AddendumForm
        contract={selectedContract}
        onSubmit={handleAddendumSubmit}
        onCancel={handleCancel}
      />
    );
  }

  if (currentView === 'import') {
    return (
      <ContractImport
        onImport={handleImportSubmit}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div>
      <ContractAlerts 
        contracts={contracts}
        onCreateAddendum={handleCreateAddendum}
      />
      <ContractList
        contracts={contracts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onNew={handleNew}
        onImport={handleImport}
      />
    </div>
  );
}
