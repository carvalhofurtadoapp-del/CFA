import { Animal, Pesagem, Gasto, Vacina, Insumo, MovimentacaoEstoque, HistoricoEntry } from '@/types/livestock';

export const mockAnimals: Animal[] = [
  { id: '1', brinco: 'BR-001', nome: 'Estrela', raca: 'Nelore', data_nascimento: '2022-03-15', pai: 'Touro Rex', mae: 'Vaca Luna', sexo: 'femea', status: 'ativo' },
  { id: '2', brinco: 'BR-002', nome: 'Trovão', raca: 'Angus', data_nascimento: '2021-08-20', pai: 'Touro Black', mae: 'Vaca Rosa', sexo: 'macho', status: 'ativo' },
  { id: '3', brinco: 'BR-003', nome: 'Mimosa', raca: 'Brahman', data_nascimento: '2023-01-10', sexo: 'femea', status: 'ativo' },
  { id: '4', brinco: 'BR-004', nome: 'Bravo', raca: 'Nelore', data_nascimento: '2022-06-05', pai: 'Touro Rex', sexo: 'macho', status: 'ativo' },
  { id: '5', brinco: 'BR-005', nome: 'Princesa', raca: 'Hereford', data_nascimento: '2023-04-22', mae: 'Vaca Bela', sexo: 'femea', status: 'ativo' },
  { id: '6', brinco: 'BR-006', nome: 'Valente', raca: 'Nelore', data_nascimento: '2021-11-30', sexo: 'macho', status: 'vendido' },
];

export const mockPesagens: Pesagem[] = [
  { id: '1', animal_id: '1', peso: 180, data: '2024-01-15' },
  { id: '2', animal_id: '1', peso: 210, data: '2024-02-15', gmd: 1.0 },
  { id: '3', animal_id: '1', peso: 245, data: '2024-03-15', gmd: 1.17 },
  { id: '4', animal_id: '2', peso: 320, data: '2024-01-10' },
  { id: '5', animal_id: '2', peso: 355, data: '2024-02-10', gmd: 1.13 },
  { id: '6', animal_id: '3', peso: 150, data: '2024-01-20' },
  { id: '7', animal_id: '3', peso: 178, data: '2024-02-20', gmd: 0.9 },
  { id: '8', animal_id: '4', peso: 280, data: '2024-02-01' },
  { id: '9', animal_id: '5', peso: 160, data: '2024-02-05' },
];

export const mockGastos: Gasto[] = [
  { id: '1', descricao: 'Óleo Diesel - Trator', categoria: 'Óleo Diesel', valor: 1500, data: '2024-03-01', tipo: 'saida' },
  { id: '2', descricao: 'Ração Boi Gordo 40kg', categoria: 'Ração', valor: 2800, data: '2024-03-05', tipo: 'saida' },
  { id: '3', descricao: 'Venda - 2 Bezerros', categoria: 'Venda de Gado', valor: 8500, data: '2024-03-10', tipo: 'entrada' },
  { id: '4', descricao: 'Vacinas Aftosa', categoria: 'Medicamentos', valor: 650, data: '2024-03-12', tipo: 'saida' },
  { id: '5', descricao: 'Sal Mineral', categoria: 'Ração', valor: 420, data: '2024-03-15', tipo: 'saida' },
];

export const mockVacinas: Vacina[] = [
  { id: '1', animal_id: '1', nome: 'Aftosa', data_aplicacao: '2024-01-10', data_proxima: '2024-07-10', status: 'concluida' },
  { id: '2', animal_id: '1', nome: 'Brucelose', data_aplicacao: '2024-02-15', status: 'concluida' },
  { id: '3', animal_id: '2', nome: 'Aftosa', data_aplicacao: '2024-01-10', data_proxima: '2024-07-10', status: 'concluida' },
  { id: '4', animal_id: '3', nome: 'Aftosa', data_aplicacao: '', data_proxima: '2024-04-10', status: 'pendente' },
  { id: '5', animal_id: '4', nome: 'Raiva', data_aplicacao: '', data_proxima: '2024-04-20', status: 'pendente' },
];

export const mockInsumos: Insumo[] = [
  { id: '1', nome: 'Ração Boi Gordo', quantidade: 120, unidade: 'kg', minimo: 50, codigo_ean: '7891234567890' },
  { id: '2', nome: 'Sal Mineral', quantidade: 30, unidade: 'kg', minimo: 20, codigo_ean: '7891234567891' },
  { id: '3', nome: 'Óleo Diesel', quantidade: 200, unidade: 'litros', minimo: 100, codigo_ean: '7891234567892' },
  { id: '4', nome: 'Ivermectina', quantidade: 8, unidade: 'frascos', minimo: 5, codigo_ean: '7891234567893' },
  { id: '5', nome: 'Arame Farpado', quantidade: 3, unidade: 'rolos', minimo: 2, codigo_ean: '7891234567894' },
];

export const mockMovimentacoes: MovimentacaoEstoque[] = [
  { id: '1', insumo_id: '1', tipo: 'entrada', quantidade: 200, data: '2024-03-01', observacao: 'Compra mensal' },
  { id: '2', insumo_id: '1', tipo: 'saida', quantidade: 80, data: '2024-03-15', observacao: 'Uso diário' },
  { id: '3', insumo_id: '3', tipo: 'entrada', quantidade: 300, data: '2024-03-05' },
  { id: '4', insumo_id: '3', tipo: 'saida', quantidade: 100, data: '2024-03-20' },
];

export const categoriasGasto = [
  { nome: 'Óleo Diesel', icone: '⛽' },
  { nome: 'Ração', icone: '🌾' },
  { nome: 'Medicamentos', icone: '💊' },
  { nome: 'Manutenção', icone: '🔧' },
  { nome: 'Mão de Obra', icone: '👷' },
  { nome: 'Venda de Gado', icone: '🐄' },
  { nome: 'Outros', icone: '📦' },
];

export const mockHistorico: HistoricoEntry[] = [
  { id: '1', tipo: 'criacao', entidade: 'animal', entidade_id: '1', descricao: 'Animal Estrela (BR-001) cadastrado', data: '2024-01-01' },
  { id: '2', tipo: 'pesagem', entidade: 'pesagem', entidade_id: '1', descricao: 'Pesagem registrada: Estrela - 180kg', data: '2024-01-15' },
  { id: '3', tipo: 'financeiro', entidade: 'gasto', entidade_id: '1', descricao: 'Saída: Óleo Diesel - Trator R$1.500', data: '2024-03-01' },
  { id: '4', tipo: 'movimentacao', entidade: 'insumo', entidade_id: '1', descricao: 'Entrada: 200kg Ração Boi Gordo', data: '2024-03-01' },
];
