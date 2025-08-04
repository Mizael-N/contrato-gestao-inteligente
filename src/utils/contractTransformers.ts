
import { Contract, Aditivo, Pagamento, Documento } from '@/types/contract';

// Tipo que representa a estrutura do banco Supabase
export interface DatabaseContract {
  id: string;
  numero: string;
  objeto: string;
  contratante: string;
  contratada: string;
  valor: number;
  data_assinatura: string;
  data_inicio: string | null;
  data_termino: string | null;
  prazo_execucao: number;
  prazo_unidade: string;
  modalidade: string;
  status: string;
  observacoes: string | null;
  // Campos opcionais mantidos para compatibilidade
  fiscal_titular?: string | null;
  fiscal_substituto?: string | null;
  garantia_tipo?: string;
  garantia_valor?: number;
  garantia_vencimento?: string | null;
  created_at: string;
  updated_at: string;
}

// Tipo para inserção
export interface DatabaseContractInsert {
  numero: string;
  objeto: string;
  contratante: string;
  contratada: string;
  valor: number;
  data_assinatura: string;
  data_inicio: string;
  data_termino: string;
  prazo_execucao: number;
  prazo_unidade: string;
  modalidade: string;
  status: string;
  observacoes?: string | null;
}

// Tipo para atualização
export interface DatabaseContractUpdate {
  numero?: string;
  objeto?: string;
  contratante?: string;
  contratada?: string;
  valor?: number;
  data_assinatura?: string;
  data_inicio?: string;
  data_termino?: string;
  prazo_execucao?: number;
  prazo_unidade?: string;
  modalidade?: string;
  status?: string;
  observacoes?: string | null;
}

// Transformar dados do banco para a interface Contract
export function transformDatabaseToContract(dbContract: DatabaseContract): Contract {
  // data_inicio é obrigatória - usar data_assinatura como fallback
  const dataInicio = dbContract.data_inicio || dbContract.data_assinatura;
  
  // Calcular data_termino se não existir (1 ano de vigência por padrão)
  let dataTermino = dbContract.data_termino;
  if (!dataTermino) {
    const inicioDate = new Date(dataInicio);
    const terminoDate = new Date(inicioDate);
    terminoDate.setFullYear(terminoDate.getFullYear() + 1);
    dataTermino = terminoDate.toISOString().split('T')[0];
  }

  return {
    id: dbContract.id,
    numero: dbContract.numero,
    objeto: dbContract.objeto,
    contratante: dbContract.contratante,
    contratada: dbContract.contratada,
    valor: dbContract.valor,
    dataAssinatura: dbContract.data_assinatura,
    dataInicio: dataInicio,
    dataTermino: dataTermino,
    prazoExecucao: dbContract.prazo_execucao,
    prazoUnidade: dbContract.prazo_unidade as 'dias' | 'meses' | 'anos',
    modalidade: dbContract.modalidade as Contract['modalidade'],
    status: dbContract.status as Contract['status'],
    observacoes: dbContract.observacoes || '',
    aditivos: [], // Será preenchido separadamente se necessário
    pagamentos: [], // Será preenchido separadamente se necessário
    documentos: [], // Será preenchido separadamente se necessário
  };
}

// Transformar Contract para formato de inserção no banco
export function transformContractToInsert(contract: Partial<Contract>): DatabaseContractInsert {
  // data_inicio = data_assinatura por padrão
  const dataInicio = contract.dataInicio || contract.dataAssinatura || new Date().toISOString().split('T')[0];
  
  // Calcular data_termino se não informada (1 ano por padrão)
  let dataTermino = contract.dataTermino;
  if (!dataTermino) {
    const inicioDate = new Date(dataInicio);
    const terminoDate = new Date(inicioDate);
    terminoDate.setFullYear(terminoDate.getFullYear() + 1);
    dataTermino = terminoDate.toISOString().split('T')[0];
  }

  return {
    numero: contract.numero || '',
    objeto: contract.objeto || '',
    contratante: contract.contratante || '',
    contratada: contract.contratada || '',
    valor: contract.valor || 0,
    data_assinatura: contract.dataAssinatura || new Date().toISOString().split('T')[0],
    data_inicio: dataInicio,
    data_termino: dataTermino,
    prazo_execucao: contract.prazoExecucao || 365,
    prazo_unidade: contract.prazoUnidade || 'dias',
    modalidade: contract.modalidade || 'pregao',
    status: contract.status || 'vigente',
    observacoes: contract.observacoes || null,
  };
}

// Transformar Contract para formato de atualização no banco
export function transformContractToUpdate(contract: Partial<Contract>): DatabaseContractUpdate {
  const updateData: DatabaseContractUpdate = {};
  
  if (contract.numero !== undefined) updateData.numero = contract.numero;
  if (contract.objeto !== undefined) updateData.objeto = contract.objeto;
  if (contract.contratante !== undefined) updateData.contratante = contract.contratante;
  if (contract.contratada !== undefined) updateData.contratada = contract.contratada;
  if (contract.valor !== undefined) updateData.valor = contract.valor;
  if (contract.dataAssinatura !== undefined) updateData.data_assinatura = contract.dataAssinatura;
  if (contract.dataInicio !== undefined) updateData.data_inicio = contract.dataInicio;
  if (contract.dataTermino !== undefined) updateData.data_termino = contract.dataTermino;
  if (contract.prazoExecucao !== undefined) updateData.prazo_execucao = contract.prazoExecucao;
  if (contract.prazoUnidade !== undefined) updateData.prazo_unidade = contract.prazoUnidade;
  if (contract.modalidade !== undefined) updateData.modalidade = contract.modalidade;
  if (contract.status !== undefined) updateData.status = contract.status;
  if (contract.observacoes !== undefined) updateData.observacoes = contract.observacoes;

  return updateData;
}

// Transformar array de contratos do banco
export function transformDatabaseContracts(dbContracts: DatabaseContract[]): Contract[] {
  return dbContracts.map(transformDatabaseToContract);
}
