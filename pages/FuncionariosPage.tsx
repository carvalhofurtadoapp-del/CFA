import { useState, useEffect } from 'react';
import { useFuncionarios, useCreateFuncionario, useUpdateFuncionario, useDeleteFuncionario, useDiasTrabalhados, useCreateDiaTrabalhado, useAllDiasTrabalhados } from '@/hooks/useFuncionarios';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Trash2, Loader2, Pencil, Calendar, DollarSign, Shield, KeyRound, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const ALL_TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'rebanho', label: 'Rebanho' },
  { key: 'confinamento', label: 'Confinamento' },
  { key: 'nutricao', label: 'Nutrição' },
  { key: 'lavoura', label: 'Lavoura' },
  { key: 'financeiro', label: 'Fluxo de Caixa' },
  { key: 'veterinaria', label: 'Veterinária' },
  { key: 'deposito', label: 'Depósito' },
  { key: 'equipamentos', label: 'Equipamentos' },
  { key: 'relatorios', label: 'Relatórios' },
  { key: 'funcionarios', label: 'Funcionários' },
  { key: 'configuracoes', label: 'Configurações' },
];

interface DBUser {
  id: string;
  nome: string;
  login: string;
  senha: string;
  role: string;
  foto: string | null;
  abas_permitidas: string[];
  status: string;
}

export default function FuncionariosPage() {
  const { role } = useAuth();
  const { data: funcionarios = [], isLoading } = useFuncionarios();
  const { data: allDias = [] } = useAllDiasTrabalhados();
  const createFunc = useCreateFuncionario();
  const updateFunc = useUpdateFuncionario();
  const deleteFunc = useDeleteFuncionario();
  const createDia = useCreateDiaTrabalhado();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: '', funcao: '', data_inicio: '', forma_pagamento: 'mensal', valor_pagamento: '', observacao: '' });

  const [showDia, setShowDia] = useState(false);
  const [selectedFunc, setSelectedFunc] = useState<string | null>(null);
  const [diaForm, setDiaForm] = useState({ data: new Date().toISOString().split('T')[0], horas: '8', observacao: '' });
  const { data: diasFunc = [] } = useDiasTrabalhados(selectedFunc || undefined);

  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Vale state
  const [showVale, setShowVale] = useState(false);
  const [valeFunc, setValeFunc] = useState<{ id: string; nome: string } | null>(null);
  const [valeForm, setValeForm] = useState({ valor: '', descontar: true, data: new Date().toISOString().split('T')[0], observacao: '' });

  // App access state
  const [showAccess, setShowAccess] = useState(false);
  const [accessFuncId, setAccessFuncId] = useState<string | null>(null);
  const [accessFuncName, setAccessFuncName] = useState('');
  const [appUsers, setAppUsers] = useState<DBUser[]>([]);
  const [accessForm, setAccessForm] = useState({ login: '', senha: '', role: 'colaborador', abas_permitidas: ['dashboard', 'rebanho'] as string[] });
  const [existingUserId, setExistingUserId] = useState<string | null>(null);

  const fetchAppUsers = async () => {
    const { data } = await (supabase as any).from('app_usuarios').select('*').order('nome');
    if (data) setAppUsers(data);
  };

  useEffect(() => { fetchAppUsers(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({ nome: '', funcao: '', data_inicio: '', forma_pagamento: 'mensal', valor_pagamento: '', observacao: '' });
  };

  const openEdit = (f: typeof funcionarios[0]) => {
    setEditingId(f.id);
    setForm({
      nome: f.nome,
      funcao: f.funcao,
      data_inicio: f.data_inicio,
      forma_pagamento: f.forma_pagamento,
      valor_pagamento: String(f.valor_pagamento),
      observacao: f.observacao || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim() || !form.valor_pagamento) { toast.error('Preencha nome e valor'); return; }
    const payload = {
      nome: form.nome.trim(),
      funcao: form.funcao.trim() || 'geral',
      data_inicio: form.data_inicio || new Date().toISOString().split('T')[0],
      forma_pagamento: form.forma_pagamento,
      valor_pagamento: parseFloat(form.valor_pagamento),
      status: 'ativo' as string,
      observacao: form.observacao.trim() || null,
    };
    if (editingId) {
      await updateFunc.mutateAsync({ id: editingId, ...payload });
    } else {
      await createFunc.mutateAsync(payload);
    }
    setShowForm(false);
    resetForm();
  };

  const handleAddDia = async () => {
    if (!selectedFunc) return;
    await createDia.mutateAsync({
      funcionario_id: selectedFunc,
      data: diaForm.data,
      horas: parseFloat(diaForm.horas) || 8,
      observacao: diaForm.observacao.trim() || null,
    });
    setShowDia(false);
    setDiaForm({ data: new Date().toISOString().split('T')[0], horas: '8', observacao: '' });
  };

  // Open Vale dialog
  const openVale = (id: string, nome: string) => {
    setValeFunc({ id, nome });
    setValeForm({ valor: '', descontar: true, data: new Date().toISOString().split('T')[0], observacao: '' });
    setShowVale(true);
  };

  const handleSaveVale = async () => {
    if (!valeFunc) return;
    const valor = parseFloat(valeForm.valor);
    if (!valor || valor <= 0) { toast.error('Informe um valor válido'); return; }
    const desc = valeForm.descontar
      ? `Vale (descontar do salário) - ${valeFunc.nome}`
      : `Vale - ${valeFunc.nome}`;
    const obsParts = [valeForm.descontar ? 'Será descontado do salário' : 'Não descontar do salário'];
    if (valeForm.observacao.trim()) obsParts.push(valeForm.observacao.trim());
    const { error } = await supabase.from('gastos').insert({
      descricao: desc,
      categoria: 'Mão de Obra',
      valor,
      tipo: 'saida',
      data: valeForm.data,
      fornecedor: valeFunc.nome,
    });
    if (error) { toast.error('Erro ao registrar vale'); return; }
    qc.invalidateQueries({ queryKey: ['gastos'] });
    toast.success(valeForm.descontar ? 'Vale registrado e será descontado do salário' : 'Vale registrado');
    setShowVale(false);
  };

  // Open access config for a funcionário
  const openAccessConfig = (funcName: string, funcId: string) => {
    setAccessFuncId(funcId);
    setAccessFuncName(funcName);
    // Find existing app_usuario matching this name
    const existing = appUsers.find(u => u.nome.toLowerCase().trim() === funcName.toLowerCase().trim());
    if (existing) {
      setExistingUserId(existing.id);
      setAccessForm({ login: existing.login, senha: '', role: existing.role, abas_permitidas: [...existing.abas_permitidas] });
    } else {
      setExistingUserId(null);
      const loginSuggestion = funcName.toLowerCase().replace(/\s+/g, '.').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      setAccessForm({ login: loginSuggestion, senha: '', role: 'colaborador', abas_permitidas: ['dashboard', 'rebanho'] });
    }
    setShowAccess(true);
  };

  const toggleTab = (tab: string) => {
    setAccessForm(prev => ({
      ...prev,
      abas_permitidas: prev.abas_permitidas.includes(tab)
        ? prev.abas_permitidas.filter(t => t !== tab)
        : [...prev.abas_permitidas, tab],
    }));
  };

  const handleSaveAccess = async () => {
    if (!accessForm.login.trim()) { toast.error('Informe o login'); return; }

    if (existingUserId) {
      const updateData: any = { nome: accessFuncName, login: accessForm.login, role: accessForm.role, abas_permitidas: accessForm.abas_permitidas };
      if (accessForm.senha.trim()) updateData.senha = accessForm.senha;
      await (supabase as any).from('app_usuarios').update(updateData).eq('id', existingUserId);
      toast.success('Acesso atualizado!');
    } else {
      if (!accessForm.senha.trim()) { toast.error('Informe uma senha para o novo acesso'); return; }
      await (supabase as any).from('app_usuarios').insert({
        nome: accessFuncName, login: accessForm.login, senha: accessForm.senha, role: accessForm.role, abas_permitidas: accessForm.abas_permitidas,
      });
      toast.success('Acesso criado!');
    }
    setShowAccess(false);
    fetchAppUsers();
  };

  const handleRemoveAccess = async () => {
    if (!existingUserId) return;
    if (!confirm('Remover o acesso ao app deste funcionário?')) return;
    await (supabase as any).from('app_usuarios').delete().eq('id', existingUserId);
    toast.success('Acesso removido');
    setShowAccess(false);
    fetchAppUsers();
  };

  // Cálculos
  const mesAtual = new Date().toISOString().substring(0, 7);
  const ativos = funcionarios.filter(f => f.status === 'ativo');

  const custoMensal = ativos.reduce((sum, f) => {
    if (f.forma_pagamento === 'mensal') return sum + Number(f.valor_pagamento);
    if (f.forma_pagamento === 'quinzenal') return sum + Number(f.valor_pagamento) * 2;
    const diasMes = allDias.filter(d => d.funcionario_id === f.id && d.data.startsWith(mesAtual));
    return sum + diasMes.length * Number(f.valor_pagamento);
  }, 0);

  const formaLabel = (fp: string) => fp === 'mensal' ? 'Mensal' : fp === 'quinzenal' ? 'Quinzenal' : 'Diária';

  // Check if a funcionário has app access
  const hasAppAccess = (nome: string) => appUsers.some(u => u.nome.toLowerCase().trim() === nome.toLowerCase().trim() && u.status === 'ativo');

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">Funcionários</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão de mão de obra, custos e acessos ao app</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto min-h-[44px]">
          <Plus className="w-4 h-4" /> Novo Funcionário
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-primary/5 rounded-2xl p-4 border border-border/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-foreground mt-1">{funcionarios.length}</p>
        </div>
        <div className="bg-success/5 rounded-2xl p-4 border border-border/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Ativos</p>
          <p className="text-2xl font-bold text-success mt-1">{ativos.length}</p>
        </div>
        <div className="bg-warning/5 rounded-2xl p-4 border border-border/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Custo mensal est.</p>
          <p className="text-xl font-bold text-warning mt-1 leading-tight">R$ {custoMensal.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-info/5 rounded-2xl p-4 border border-border/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Acesso ao app</p>
          <p className="text-2xl font-bold text-foreground mt-1">{appUsers.filter(u => u.status === 'ativo').length}</p>
        </div>
      </div>

      {funcionarios.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum funcionário cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <>
        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {funcionarios.map(f => {
            const access = hasAppAccess(f.nome);
            return (
              <div key={f.id} className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-card-foreground truncate">{f.nome}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{f.funcao}</p>
                  </div>
                  {access ? (
                    <Badge className="bg-success/10 text-success border-0 gap-1 shrink-0"><Shield className="w-3 h-3" /> Com acesso</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 text-muted-foreground shrink-0">Sem acesso</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-xl bg-muted/30 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pagamento</p>
                    <p className="text-sm font-medium text-card-foreground capitalize">{formaLabel(f.forma_pagamento)}</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Valor</p>
                    <p className="text-sm font-bold text-card-foreground">R$ {Number(f.valor_pagamento).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl min-h-[44px] gap-1.5" onClick={() => openEdit(f)}>
                    <Pencil className="w-4 h-4" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl min-h-[44px] gap-1.5" onClick={() => { setSelectedFunc(f.id); setShowDetails(f.id); }}>
                    <DollarSign className="w-4 h-4" /> Pagamentos
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl min-h-[44px] gap-1.5" onClick={() => openVale(f.id, f.nome)}>
                    <Wallet className="w-4 h-4" /> Vale
                  </Button>
                  {f.forma_pagamento === 'diaria' ? (
                    <Button variant="outline" size="sm" className="rounded-xl min-h-[44px] gap-1.5" onClick={() => { setSelectedFunc(f.id); setShowDia(true); }}>
                      <Calendar className="w-4 h-4" /> Diária
                    </Button>
                  ) : role === 'gestor' ? (
                    <Button variant="outline" size="sm" className="rounded-xl min-h-[44px] gap-1.5" onClick={() => openAccessConfig(f.nome, f.id)}>
                      <KeyRound className="w-4 h-4" /> Acesso
                    </Button>
                  ) : (
                    <span />
                  )}
                  {f.forma_pagamento === 'diaria' && role === 'gestor' && (
                    <Button variant="outline" size="sm" className="rounded-xl min-h-[44px] gap-1.5 col-span-2" onClick={() => openAccessConfig(f.nome, f.id)}>
                      <KeyRound className="w-4 h-4" /> Configurar acesso
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="rounded-xl min-h-[44px] gap-1.5 col-span-2 border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => { if (confirm(`Excluir ${f.nome}?`)) deleteFunc.mutate(f.id); }}>
                    <Trash2 className="w-4 h-4" /> Excluir funcionário
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Função</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Pagamento</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Valor</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Acesso</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {funcionarios.map(f => (
                  <tr key={f.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-card-foreground">{f.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{f.funcao}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell capitalize">{formaLabel(f.forma_pagamento)}</td>
                    <td className="px-4 py-3 text-card-foreground font-medium">R$ {Number(f.valor_pagamento).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      {hasAppAccess(f.nome) ? (
                        <Badge className="bg-success/10 text-success border-0 gap-1"><Shield className="w-3 h-3" /> Sim</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 text-muted-foreground">Sem acesso</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {role === 'gestor' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Configurar acesso ao app" onClick={() => openAccessConfig(f.nome, f.id)}>
                            <KeyRound className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {f.forma_pagamento === 'diaria' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Registrar diária" onClick={() => { setSelectedFunc(f.id); setShowDia(true); }}>
                            <Calendar className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Histórico de pagamentos" onClick={() => { setSelectedFunc(f.id); setShowDetails(f.id); }}>
                          <DollarSign className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Vale funcionário" onClick={() => openVale(f.id, f.nome)}>
                          <Wallet className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => openEdit(f)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Excluir" onClick={() => deleteFunc.mutate(f.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-xl">{editingId ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome *</Label>
              <Input placeholder="Nome completo" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Função</Label>
                <Input placeholder="Ex: vaqueiro, tratorista" value={form.funcao} onChange={e => setForm({ ...form, funcao: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Data Início</Label>
                <Input type="date" value={form.data_inicio} onChange={e => setForm({ ...form, data_inicio: e.target.value })} className="text-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Forma de Pagamento</Label>
                <Select value={form.forma_pagamento} onValueChange={v => setForm({ ...form, forma_pagamento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="diaria">Diária</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Valor (R$) *</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={form.valor_pagamento} onChange={e => setForm({ ...form, valor_pagamento: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Observação</Label>
              <Input placeholder="Observação (opcional)" value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave} disabled={createFunc.isPending || updateFunc.isPending}>
                {editingId ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Day Dialog */}
      <Dialog open={showDia} onOpenChange={setShowDia}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display text-xl">Registrar Dia Trabalhado</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{funcionarios.find(f => f.id === selectedFunc)?.nome}</p>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data</Label>
              <Input type="date" value={diaForm.data} onChange={e => setDiaForm({ ...diaForm, data: e.target.value })} className="text-foreground" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Horas</Label>
              <Input type="number" value={diaForm.horas} onChange={e => setDiaForm({ ...diaForm, horas: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Observação</Label>
              <Input placeholder="Opcional" value={diaForm.observacao} onChange={e => setDiaForm({ ...diaForm, observacao: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowDia(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleAddDia} disabled={createDia.isPending}>Registrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={!!showDetails} onOpenChange={(open) => { if (!open) { setShowDetails(null); setSelectedFunc(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-xl">Histórico de Pagamentos</DialogTitle></DialogHeader>
          {(() => {
            const func = funcionarios.find(f => f.id === showDetails);
            if (!func) return null;
            const diasDoFunc = allDias.filter(d => d.funcionario_id === func.id);
            const diasMesAtual = diasDoFunc.filter(d => d.data.startsWith(mesAtual));
            const custoMes = func.forma_pagamento === 'mensal'
              ? Number(func.valor_pagamento)
              : func.forma_pagamento === 'quinzenal'
                ? Number(func.valor_pagamento) * 2
                : diasMesAtual.length * Number(func.valor_pagamento);

            return (
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">Custo Este Mês</p>
                    <p className="text-lg font-bold text-foreground">R$ {custoMes.toLocaleString('pt-BR')}</p>
                  </div>
                  {func.forma_pagamento === 'diaria' && (
                    <div className="bg-muted/30 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground">Dias no Mês</p>
                      <p className="text-lg font-bold text-foreground">{diasMesAtual.length}</p>
                    </div>
                  )}
                </div>
                {func.forma_pagamento === 'diaria' && diasDoFunc.length > 0 && (
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Data</th>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Horas</th>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Obs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {diasDoFunc.slice(0, 30).map(d => (
                          <tr key={d.id}>
                            <td className="px-3 py-2 text-card-foreground">{new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                            <td className="px-3 py-2 text-muted-foreground">{Number(d.horas)}h</td>
                            <td className="px-3 py-2 text-muted-foreground text-xs">{d.observacao || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Access Config Dialog */}
      <Dialog open={showAccess} onOpenChange={setShowAccess}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-accent" />
              Acesso ao App — {accessFuncName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {existingUserId && (
              <div className="bg-success/10 rounded-xl p-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-success" />
                <span className="text-sm text-success font-medium">Este funcionário já possui acesso ao app</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Login *</Label>
                <Input placeholder="ex: joao.silva" value={accessForm.login} onChange={e => setAccessForm({ ...accessForm, login: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{existingUserId ? 'Nova Senha (vazio = manter)' : 'Senha *'}</Label>
                <Input type="password" placeholder="••••••" value={accessForm.senha} onChange={e => setAccessForm({ ...accessForm, senha: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Perfil</Label>
              <Select value={accessForm.role} onValueChange={v => setAccessForm({ ...accessForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                  <SelectItem value="veterinaria">Veterinária</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Abas Permitidas</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_TABS.map(tab => (
                  <label key={tab.key} className="flex items-center gap-2 cursor-pointer rounded-xl border border-border p-2.5 hover:bg-muted/30 transition-colors">
                    <Checkbox
                      checked={accessForm.abas_permitidas.includes(tab.key)}
                      onCheckedChange={() => toggleTab(tab.key)}
                    />
                    <span className="text-sm text-foreground">{tab.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {existingUserId && (
                <Button variant="destructive" className="rounded-xl" onClick={handleRemoveAccess}>
                  <Trash2 className="w-4 h-4 mr-1" /> Remover Acesso
                </Button>
              )}
              <div className="flex-1" />
              <Button variant="outline" className="rounded-xl" onClick={() => setShowAccess(false)}>Cancelar</Button>
              <Button className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSaveAccess}>
                {existingUserId ? 'Atualizar' : 'Criar Acesso'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vale Dialog */}
      <Dialog open={showVale} onOpenChange={setShowVale}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Wallet className="w-5 h-5 text-accent" /> Vale Funcionário
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{valeFunc?.nome}</p>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Valor (R$) *</Label>
                <Input type="number" step="0.01" placeholder="0,00" value={valeForm.valor} onChange={e => setValeForm({ ...valeForm, valor: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Data</Label>
                <Input type="date" value={valeForm.data} onChange={e => setValeForm({ ...valeForm, data: e.target.value })} className="text-foreground" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Descontar do salário?</Label>
              <Select value={valeForm.descontar ? 'sim' : 'nao'} onValueChange={v => setValeForm({ ...valeForm, descontar: v === 'sim' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim — descontar do próximo pagamento</SelectItem>
                  <SelectItem value="nao">Não — adiantamento sem desconto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Observação</Label>
              <Input placeholder="Opcional" value={valeForm.observacao} onChange={e => setValeForm({ ...valeForm, observacao: e.target.value })} />
            </div>
            <div className="bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground">
              💡 Será registrado como saída no fluxo de caixa na categoria <strong>Mão de Obra</strong>.
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowVale(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSaveVale}>Registrar Vale</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
