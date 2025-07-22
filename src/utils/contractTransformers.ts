
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
  prazo_execucao: number;
  prazo_unidade: string;
  modalidade: string;
  status: string;
  observacoes: string | null;
  fiscal_titular: string | null;
  fiscal_substituto: string | null;
  garantia_tipo: string;
  garantia_valor: number;
  garantia_vencimento: string | null;
  created_at: string;
  updated_at: string;
}

// Transformar dados do banco para a interface Contract
export function transformDatabaseToContract(dbContract: DatabaseContract): Contract {
  return {
    id: dbContract.id,
    numero: dbContract.numero,
    objeto: dbContract.objeto,
    contratante: dbContract.contratante,
    contratada: dbContract.contratada,
    valor: dbContract.valor,
    dataAssinatura: dbContract.data_assinatura,
    prazoExecucao: dbContract.prazo_execucao,
    prazoUnidade: dbContract.prazo_unidade as 'dias' | 'meses' | 'anos',
    modalidade: dbContract.modalidade as Contract['modalidade'],
    status: dbContract.status as Contract['status'],
    observacoes: dbContract.observacoes || '',
    fiscais: {
      titular: dbContract.fiscal_titular || '',
      substituto: dbContract.fiscal_substituto || '',
    },
    garantia: {
      tipo: dbContract.garantia_tipo as Contract['garantia']['tipo'],
      valor: dbContract.garantia_valor,
      dataVencimento: dbContract.garantia_vencimento || '',
    },
    aditivos: [], // Será preenchido separadamente se necessário
    pagamentos: [], // Será preenchido separadamente se necessário
    documentos: [], // Será preenchido separadamente se necessário
  };
}

// Transformar Contract para formato do banco
export function transformContractToDatabase(contract: Partial<Contract>): Partial<DatabaseContract> {
  return {
    id: contract.id,
    numero: contract.numero,
    objeto: contract.objeto,
    contratante: contract.contratante,
    contratada: contract.contratada,
    valor: contract.valor,
    data_assinatura: contract.dataAssinatura,
    prazo_execucao: contract.prazoExecucao,
    prazo_unidade: contract.prazoUnidade,
    modalidade: contract.modalidade,
    status: contract.status,
    observacoes: contract.observacoes,
    fiscal_titular: contract.fiscais?.titular,
    fiscal_substituto: contract.fiscais?.substituto,
    garantia_tipo: contract.garantia?.tipo,
    garantia_valor: contract.garantia?.valor,
    garantia_vencimento: contract.garantia?.dataVencimento,
  };
}

// Transformar array de contratos do banco
export function transformDatabaseContracts(dbContracts: DatabaseContract[]): Contract[] {
  return dbContracts.map(transformDatabaseToContract);
}
