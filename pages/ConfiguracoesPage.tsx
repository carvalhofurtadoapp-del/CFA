import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { User, Palette, Camera, Save } from 'lucide-react';

const THEMES = [
  {
    name: 'Bronze',
    desc: 'Tom rústico (padrão)',
    colors: {
      '--primary': '28 45% 32%',
      '--accent': '28 50% 42%',
      '--sidebar-background': '25 28% 15%',
      '--sidebar-accent': '25 22% 22%',
      '--sidebar-border': '25 18% 20%',
      '--sidebar-primary': '28 50% 48%',
      '--ring': '28 45% 32%',
    },
    swatch: '#6b4a2e',
  },
  {
    name: 'Cerrado',
    desc: 'Tons terrosos claros',
    colors: {
      '--primary': '32 40% 36%',
      '--accent': '32 48% 46%',
      '--sidebar-background': '30 25% 16%',
      '--sidebar-accent': '30 20% 23%',
      '--sidebar-border': '30 18% 20%',
      '--sidebar-primary': '32 48% 46%',
      '--ring': '32 40% 36%',
    },
    swatch: '#8c6e3a',
  },
  {
    name: 'Floresta',
    desc: 'Verde pasture',
    colors: {
      '--primary': '142 40% 35%',
      '--accent': '142 50% 45%',
      '--sidebar-background': '142 30% 18%',
      '--sidebar-accent': '142 25% 24%',
      '--sidebar-border': '142 20% 22%',
      '--sidebar-primary': '142 50% 45%',
      '--ring': '142 40% 35%',
    },
    swatch: '#3d7a4a',
  },
  {
    name: 'Noite',
    desc: 'Escuro sofisticado',
    colors: {
      '--primary': '20 35% 28%',
      '--accent': '20 42% 38%',
      '--sidebar-background': '20 20% 12%',
      '--sidebar-accent': '20 18% 18%',
      '--sidebar-border': '20 15% 16%',
      '--sidebar-primary': '28 45% 45%',
      '--ring': '20 35% 28%',
    },
    swatch: '#5c3d26',
  },
];

const FONTS = [
  { name: 'DM Sans (padrão)', body: "'DM Sans', sans-serif", display: "'DM Serif Display', serif" },
  { name: 'Inter', body: "'Inter', sans-serif", display: "'Inter', sans-serif" },
  { name: 'Sistema', body: "system-ui, sans-serif", display: "system-ui, sans-serif" },
];

function applyTheme(colors: Record<string, string>) {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

function applyFont(body: string, display: string) {
  document.body.style.fontFamily = body;
  document.querySelectorAll('h1, h2, h3').forEach(el => {
    (el as HTMLElement).style.fontFamily = display;
  });
  localStorage.setItem('cfa_font_body', body);
  localStorage.setItem('cfa_font_display', display);
}

const savedTheme = localStorage.getItem('cfa_theme');
if (savedTheme) {
  try { applyTheme(JSON.parse(savedTheme)); } catch {}
}

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display text-foreground">Configurações</h1>
      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil" className="gap-2"><User className="h-4 w-4" /> Meu Perfil</TabsTrigger>
          <TabsTrigger value="aparencia" className="gap-2"><Palette className="h-4 w-4" /> Aparência</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil"><ProfileTab /></TabsContent>
        <TabsContent value="aparencia"><AppearanceTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ==================== PROFILE TAB ==================== */
function ProfileTab() {
  const { user, updateUser } = useAuth();
  const [nome, setNome] = useState(user?.nome || '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSaveName = async () => {
    if (!user || !nome.trim()) return;
    await (supabase as any).from('app_usuarios').update({ nome: nome.trim() }).eq('id', user.id);
    updateUser({ nome: nome.trim() });
    toast({ title: 'Nome atualizado!' });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    const ext = file.name.split('.').pop();
    const filePath = `perfil/${user.id}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('fotosgadofurtado')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: 'Erro ao enviar foto', variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('fotosgadofurtado')
      .getPublicUrl(filePath);

    await (supabase as any).from('app_usuarios').update({ foto: publicUrl }).eq('id', user.id);
    updateUser({ foto: publicUrl });
    toast({ title: 'Foto atualizada!' });
    setUploading(false);
  };

  const handleChangePassword = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('app_usuarios')
      .select('id')
      .eq('id', user.id)
      .eq('senha', senhaAtual)
      .single();

    if (!data) {
      toast({ title: 'Senha atual incorreta', variant: 'destructive' });
      return;
    }
    if (!senhaNova.trim()) {
      toast({ title: 'Informe a nova senha', variant: 'destructive' });
      return;
    }
    await (supabase as any).from('app_usuarios').update({ senha: senhaNova }).eq('id', user.id);
    setSenhaAtual('');
    setSenhaNova('');
    toast({ title: 'Senha alterada com sucesso!' });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 mt-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">Foto de Perfil</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user?.foto || ''} />
            <AvatarFallback className="bg-accent text-accent-foreground text-2xl">
              {user?.nome?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            <Button variant="outline" asChild disabled={uploading}>
              <span><Camera className="h-4 w-4 mr-2" />{uploading ? 'Enviando...' : 'Trocar Foto'}</span>
            </Button>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Dados Pessoais</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome</Label>
            <div className="flex gap-2">
              <Input value={nome} onChange={e => setNome(e.target.value)} />
              <Button onClick={handleSaveName} size="icon"><Save className="h-4 w-4" /></Button>
            </div>
          </div>
          <div>
            <Label>Login</Label>
            <Input value={user?.login || ''} disabled />
          </div>
          <div>
            <Label>Perfil</Label>
            <Input value={user?.role || ''} disabled className="capitalize" />
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader><CardTitle className="text-lg">Alterar Senha</CardTitle></CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label>Senha Atual</Label>
            <Input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} />
          </div>
          <div className="flex-1">
            <Label>Nova Senha</Label>
            <Input type="password" value={senhaNova} onChange={e => setSenhaNova(e.target.value)} />
          </div>
          <Button onClick={handleChangePassword} className="self-end">Alterar Senha</Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ==================== APPEARANCE TAB ==================== */
function AppearanceTab() {
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('cfa_theme_name') || 'Floresta');
  const [activeFont, setActiveFont] = useState(() => localStorage.getItem('cfa_font_name') || 'DM Sans (padrão)');

  const handleThemeSelect = (theme: typeof THEMES[0]) => {
    applyTheme(theme.colors);
    setActiveTheme(theme.name);
    localStorage.setItem('cfa_theme', JSON.stringify(theme.colors));
    localStorage.setItem('cfa_theme_name', theme.name);
    toast({ title: `Tema "${theme.name}" aplicado!` });
  };

  const handleFontSelect = (font: typeof FONTS[0]) => {
    applyFont(font.body, font.display);
    setActiveFont(font.name);
    localStorage.setItem('cfa_font_name', font.name);
    toast({ title: `Fonte "${font.name}" aplicada!` });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 mt-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">Tema</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {THEMES.map(theme => (
            <button
              key={theme.name}
              onClick={() => handleThemeSelect(theme)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${activeTheme === theme.name ? 'border-accent ring-2 ring-accent/30' : 'border-border hover:border-accent/40'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.swatch }} />
                <span className="font-medium text-sm text-foreground">{theme.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{theme.desc}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Fonte</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {FONTS.map(font => (
            <button
              key={font.name}
              onClick={() => handleFontSelect(font)}
              className={`w-full rounded-xl border-2 p-4 text-left transition-all ${activeFont === font.name ? 'border-accent ring-2 ring-accent/30' : 'border-border hover:border-accent/40'}`}
            >
              <span className="font-medium text-sm text-foreground" style={{ fontFamily: font.body }}>{font.name}</span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
