
import { useState, useEffect } from 'react';
import { Contract, Aditivo } from '@/types/contract';
import ContractList from './ContractList';
import ContractForm from './ContractForm';
import ContractDetails from './ContractDetails';
import AddendumForm from './AddendumForm';
import ContractImport from './ContractImport';
import ContractAlerts from './ContractAlerts';
import { useToast } from '@/hooks/use-toast';

interface ContractManagerProps {
  contracts: Contract[];
  onContractsChange: (contracts: Contract[]) => void;
}

export default function ContractManager({ contracts, onContractsChange }: ContractManagerProps) {
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
    const updatedContracts = contracts.filter(c => c.id !== contractId);
    onContractsChange(updatedContracts);
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

      const updatedContracts = contracts.map(c => 
        c.id === selectedContract.id ? updatedContract : c
      );
      onContractsChange(updatedContracts);

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

    onContractsChange([...contracts, ...newContracts]);
    
    toast({
      title: 'Contratos importados',
      description: `${newContracts.length} contratos foram importados com sucesso.`,
    });
    
    setCurrentView('list');
  };

  const handleSubmit = (contractData: Partial<Contract>) => {
    if (selectedContract) {
      // Atualizar contrato existente
      const updatedContract = { ...selectedContract, ...contractData };
      
      // Se há dados de aditivo, criar um novo aditivo
      if (contractData.tipoAditivo && contractData.dataAditivo) {
        const newAddendum: Aditivo = {
          id: Date.now().toString(),
          numero: `Aditivo ${selectedContract.aditivos.length + 1}`,
          tipo: contractData.tipoAditivo as any,
          justificativa: contractData.justificativaAditivo || 'Aditivo adicionado via edição do contrato',
          dataAssinatura: contractData.dataAditivo,
          valorAnterior: contractData.tipoAditivo === 'valor' ? selectedContract.valor : undefined,
          valorNovo: contractData.tipoAditivo === 'valor' ? contractData.valor : undefined,
          prazoAnterior: contractData.tipoAditivo === 'prazo' ? selectedContract.prazoExecucao : undefined,
          prazoNovo: contractData.tipoAditivo === 'prazo' ? contractData.prazoExecucao : undefined,
        };
        
        updatedContract.aditivos = [...selectedContract.aditivos, newAddendum];
      }
      
      const updatedContracts = contracts.map(c => 
        c.id === selectedContract.id ? updatedContract : c
      );
      onContractsChange(updatedContracts);
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
      onContractsChange([...contracts, newContract]);
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
