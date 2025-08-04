
export interface ContractDateInfo {
  dataInicio: string;
  dataTermino: string;
  diasRestantes: number;
  status: 'vigente' | 'vencendo' | 'vencido';
  hasIncompleteData: boolean;
}

export function calculateContractDates(contract: {
  dataAssinatura: string;
  dataInicio: string;
  dataTermino: string;
  prazoExecucao: number;
  prazoUnidade?: string;
}): ContractDateInfo {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Usar dados diretamente do contrato - não calcular automaticamente
  const dataInicio = contract.dataInicio;
  const dataTermino = contract.dataTermino;

  // Verificar se há dados incompletos (não deveria mais acontecer com as novas regras)
  const hasIncompleteData = !dataInicio || !dataTermino;

  // Calcular dias restantes baseado na data de término da vigência
  const terminoDate = new Date(dataTermino);
  terminoDate.setHours(0, 0, 0, 0);
  
  const diasRestantes = Math.ceil((terminoDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  // Determinar status baseado na vigência
  let status: 'vigente' | 'vencendo' | 'vencido';
  
  if (hasIncompleteData) {
    // Fallback - não deveria acontecer mais
    status = 'vigente';
  } else if (diasRestantes < 0) {
    status = 'vencido';
  } else if (diasRestantes <= 30) {
    status = 'vencendo';
  } else {
    status = 'vigente';
  }

  return {
    dataInicio,
    dataTermino,
    diasRestantes,
    status,
    hasIncompleteData
  };
}

export function formatDateBR(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

export function getStatusLabel(status: string): string {
  const labels = {
    vigente: 'Vigente',
    vencendo: 'Vencendo',
    vencido: 'Vencido'
  };
  
  return labels[status as keyof typeof labels] || 'Desconhecido';
}
