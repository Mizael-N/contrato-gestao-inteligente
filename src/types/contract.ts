
export interface Contract {
  id: string;
  numero: string;
  objeto: string;
  contratante: string;
  contratada: string;
  valor: number;
  dataAssinatura: string;
  prazoExecucao: number; // em dias
  modalidade: 'pregao' | 'concorrencia' | 'tomada_precos' | 'convite' | 'concurso' | 'leilao';
  status: 'vigente' | 'suspenso' | 'encerrado' | 'rescindido';
  garantia: {
    tipo: 'caucao' | 'seguro_garantia' | 'fianca_bancaria';
    valor: number;
    dataVencimento: string;
  };
  fiscais: {
    titular: string;
    substituto: string;
  };
  aditivos: Aditivo[];
  pagamentos: Pagamento[];
  observacoes: string;
  documentos: Documento[];
}

export interface Aditivo {
  id: string;
  numero: string;
  tipo: 'prazo' | 'valor' | 'qualitativo';
  justificativa: string;
  valorAnterior?: number;
  valorNovo?: number;
  prazoAnterior?: number;
  prazoNovo?: number;
  dataAssinatura: string;
}

export interface Pagamento {
  id: string;
  numero: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pendente' | 'pago' | 'atrasado';
  observacoes: string;
}

export interface Documento {
  id: string;
  nome: string;
  tipo: string;
  dataUpload: string;
  url: string;
}

export interface LicitationFilter {
  modalidade?: string;
  status?: string;
  dataInicio?: string;
  dataFim?: string;
  valorMinimo?: number;
  valorMaximo?: number;
}
