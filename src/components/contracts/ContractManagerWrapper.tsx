
import { useState, useEffect } from 'react';
import { Contract } from '@/types/contract';
import ContractManager from './ContractManager';

interface ContractManagerWrapperProps {
  onContractsChange: (contracts: Contract[]) => void;
}

export default function ContractManagerWrapper({ onContractsChange }: ContractManagerWrapperProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    onContractsChange(contracts);
  }, [contracts, onContractsChange]);

  return <ContractManager contracts={contracts} onContractsChange={setContracts} />;
}
