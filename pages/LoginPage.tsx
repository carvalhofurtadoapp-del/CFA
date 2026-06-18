import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, LogIn, Loader2 } from 'lucide-react';
import logoCfa from '@/assets/logo-cfa.png';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Informe o login.');
      return;
    }
    setLoading(true);
    setError('');
    const err = await login(username.trim(), password);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-forest flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-10">
          <img src={logoCfa} alt="CFA - Carvalho Furtado Agropecuária" className="w-24 h-24 rounded-2xl object-cover mx-auto mb-4 shadow-premium" />
          <h1 className="text-3xl font-display text-primary-foreground">CFA</h1>
          <p className="mt-2 text-primary-foreground/60 text-sm">Carvalho Furtado Agropecuária</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-primary-foreground/70 mb-1 block">Login</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              placeholder="Seu login"
              className="w-full px-4 py-3 rounded-xl bg-card/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-primary-foreground/70 mb-1 block">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Sua senha"
              className="w-full px-4 py-3 rounded-xl bg-card/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {error && (
            <p className="text-destructive-foreground bg-destructive/80 rounded-lg px-3 py-2 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl gradient-gold text-accent-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
