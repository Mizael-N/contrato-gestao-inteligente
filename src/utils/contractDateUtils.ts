
export interface ContractDateInfo {
  dataInicio: string;
  dataTermino: string;
  diasRestantes: number;
  status: 'vigente' | 'vencendo' | 'vencido' | 'dados_incompletos';
  hasIncompleteData: boolean;
}

export function calculateContractDates(contract: {
  dataAssinatura: string;
  dataInicio?: string;
  dataTermino?: string;
  prazoExecucao: number;
  prazoUnidade?: string;
}): ContractDateInfo {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Verificar se temos dados incompletos
  const hasIncompleteData = !contract.dataInicio || !contract.dataTermino;

  // A dataInicio é a data de início da vigência
  // Se não informada, usar dataAssinatura como fallback
  let dataInicio = contract.dataInicio || contract.dataAssinatura;
  let dataTermino = contract.dataTermino;

  // Se não temos dataTermino, calcular baseado no prazo a partir da data de início da vigência
  if (!dataTermino && dataInicio) {
    const inicioVigenciaDate = new Date(dataInicio);
    const terminoDate = new Date(inicioVigenciaDate);
    
    const prazoUnidade = contract.prazoUnidade || 'dias';
    
    switch (prazoUnidade.toLowerCase()) {
      case 'meses':
        terminoDate.setMonth(terminoDate.getMonth() + contract.prazoExecucao);
        break;
      case 'anos':
        terminoDate.setFullYear(terminoDate.getFullYear() + contract.prazoExecucao);
        break;
      default: // dias
        terminoDate.setDate(terminoDate.getDate() + contract.prazoExecucao);
    }
    
    dataTermino = terminoDate.toISOString().split('T')[0];
  }

  // Se ainda não temos dataTermino, usar um cálculo baseado na data de assinatura
  if (!dataTermino) {
    const fallbackDate = new Date(contract.dataAssinatura);
    fallbackDate.setFullYear(fallbackDate.getFullYear() + 1); // 1 ano por padrão
    dataTermino = fallbackDate.toISOString().split('T')[0];
  }

  // Calcular dias restantes baseado na data de término da vigência
  const terminoDate = new Date(dataTermino);
  terminoDate.setHours(0, 0, 0, 0);
  
  const diasRestantes = Math.ceil((terminoDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  // Determinar status baseado na vigência
  let status: 'vigente' | 'vencendo' | 'vencido' | 'dados_incompletos';
  
  if (hasIncompleteData) {
    status = 'dados_incompletos';
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
    vencido: 'Vencido',
    dados_incompletos: 'Dados Incompletos'
  };
  
  return labels[status as keyof typeof labels] || 'Desconhecido';
}
