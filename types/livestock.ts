export type UserRole = 'colaborador' | 'veterinaria' | 'gestor';

export interface Animal {
  id: string;
  brinco: string;
  nome?: string;
  raca: string;
  data_nascimento: string;
  pai?: string;
  mae?: string;
  foto?: string;
  sexo: 'macho' | 'femea';
  status: 'ativo' | 'vendido' | 'morto';
}

export interface Pesagem {
  id: string;
  animal_id: string;
  peso: number;
  data: string;
  gmd?: number;
}

export interface Gasto {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  tipo: 'entrada' | 'saida';
}

export interface Vacina {
  id: string;
  animal_id: string;
  nome: string;
  data_aplicacao: string;
  data_proxima?: string;
  status: 'pendente' | 'concluida';
}

export interface Insumo {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  codigo_barras?: string;
  codigo_ean?: string;
  minimo: number;
}

export interface MovimentacaoEstoque {
  id: string;
  insumo_id: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  data: string;
  observacao?: string;
}

export interface HistoricoEntry {
  id: string;
  tipo: 'criacao' | 'edicao' | 'exclusao' | 'pesagem' | 'movimentacao' | 'financeiro';
  entidade: string;
  entidade_id: string;
  descricao: string;
  data: string;
  detalhes?: string;
}
