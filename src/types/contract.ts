export interface Contract {
  id: string;
  numero: string;
  objeto: string;
  contratante: string;
  contratada: string;
  valor: number;
  dataInicio: string; // Data de início da vigência (obrigatório)
  dataTermino: string; // Data de término da vigência (obrigatório)
  prazoExecucao: number;
  prazoUnidade: string;
  modalidade: 'pregao' | 'concorrencia' | 'tomada_precos' | 'convite' | 'concurso' | 'leilao';
  status: 'vigente' | 'suspenso' | 'encerrado' | 'rescindido';
  aditivos: Aditivo[];
  pagamentos: Pagamento[];
  observacoes: string;
  documentos: Documento[];
  // Campos opcionais para aditivos durante edição
  tipoAditivo?: string;
  dataAditivo?: string;
  justificativaAditivo?: string;
}

export interface Aditivo {
  id: string;
  numero: string;
  tipo: 'prazo' | 'valor' | 'qualitativo' | 'reequilibrio' | 'localizacao' | 'responsabilidade';
  justificativa: string;
  valorAnterior?: number;
  valorNovo?: number;
  prazoAnterior?: number;
  prazoNovo?: number;
  prazoUnidade?: 'dias' | 'meses' | 'anos';
  dataAssinatura: string;
  documentos?: Documento[]; // Para upload de documentos por aditivo
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
  aditivoId?: string; // Para vincular documento a um aditivo específico
}

export interface LicitationFilter {
  modalidade?: string;
  status?: string;
  dataInicio?: string;
  dataFim?: string;
  valorMinimo?: number;
  valorMaximo?: number;
}
