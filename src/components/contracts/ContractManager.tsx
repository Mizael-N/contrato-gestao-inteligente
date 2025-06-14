
import { useState } from 'react';
import { Contract, Aditivo } from '@/types/contract';
import { useContracts } from '@/hooks/useContracts';
import ContractGrid from './ContractGrid';
import ContractForm from './ContractForm';
import ContractDetails from './ContractDetails';
import AddendumForm from './AddendumForm';
import ContractImport from './ContractImport';
import ContractAlerts from './ContractAlerts';

interface ContractManagerProps {
  contracts: Contract[];
  onContractsChange: (contracts: Contract[]) => void;
}

export default function ContractManager({ contracts: propContracts, onContractsChange }: ContractManagerProps) {
  const [currentView, setCurrentView] = useState<'grid' | 'form' | 'details' | 'addendum' | 'import'>('grid');
  const [selectedContract, setSelectedContract] = useState<Contract | undefined>();
  
  // Usar o hook personalizado para contratos do Supabase
  const { 
    contracts: dbContracts, 
    loading, 
    createContract, 
    updateContract, 
    deleteContract, 
    createAddendum 
  } = useContracts();

  // Usar contratos do banco de dados se disponível, senão usar os props
  const contracts = dbContracts.length > 0 ? dbContracts : propContracts;

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

  const handleDelete = async (contractId: string) => {
    try {
      await deleteContract(contractId);
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
    }
  };

  const handleCreateAddendum = (contract: Contract) => {
    setSelectedContract(contract);
    setCurrentView('addendum');
  };

  const handleAddendumSubmit = async (addendumData: Omit<Aditivo, 'id'>) => {
    if (selectedContract) {
      try {
        await createAddendum(selectedContract.id, addendumData);
        setCurrentView('grid');
        setSelectedContract(undefined);
      } catch (error) {
        console.error('Erro ao criar aditivo:', error);
      }
    }
  };

  const handleImport = () => {
    setCurrentView('import');
  };

  const handleImportSubmit = async (importedContracts: Partial<Contract>[]) => {
    try {
      // Criar contratos um por um
      for (const contractData of importedContracts) {
        await createContract(contractData);
      }
      setCurrentView('grid');
    } catch (error) {
      console.error('Erro ao importar contratos:', error);
    }
  };

  const handleSubmit = async (contractData: Partial<Contract>) => {
    try {
      if (selectedContract) {
        // Atualizar contrato existente
        await updateContract(selectedContract.id, contractData);
        
        // Se há dados de aditivo, criar um novo aditivo
        if (contractData.tipoAditivo && contractData.dataAditivo) {
          const newAddendum: Omit<Aditivo, 'id'> = {
            numero: `Aditivo ${selectedContract.aditivos.length + 1}`,
            tipo: contractData.tipoAditivo as any,
            justificativa: contractData.justificativaAditivo || 'Aditivo adicionado via edição do contrato',
            dataAssinatura: contractData.dataAditivo,
            valorAnterior: contractData.tipoAditivo === 'valor' ? selectedContract.valor : undefined,
            valorNovo: contractData.tipoAditivo === 'valor' ? contractData.valor : undefined,
            prazoAnterior: contractData.tipoAditivo === 'prazo' ? selectedContract.prazoExecucao : undefined,
            prazoNovo: contractData.tipoAditivo === 'prazo' ? contractData.prazoExecucao : undefined,
          };
          
          await createAddendum(selectedContract.id, newAddendum);
        }
      } else {
        // Criar novo contrato
        await createContract(contractData);
      }
      setCurrentView('grid');
      setSelectedContract(undefined);
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
    }
  };

  const handleCancel = () => {
    setCurrentView('grid');
    setSelectedContract(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando contratos...</div>
      </div>
    );
  }

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
      <ContractGrid
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
