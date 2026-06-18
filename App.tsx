import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import RebanhoPage from "./pages/RebanhoPage";
import AnimalDetailPage from "./pages/AnimalDetailPage";
import FinanceiroPage from "./pages/FinanceiroPage";
import VeterinariaPage from "./pages/VeterinariaPage";
import DepositoPage from "./pages/DepositoPage";
import ConfinamentoPage from "./pages/ConfinamentoPage";
import NutricaoPage from "./pages/NutricaoPage";
import LavouraPage from "./pages/LavouraPage";
import EquipamentosPage from "./pages/EquipamentosPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import FuncionariosPage from "./pages/FuncionariosPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, hasTabAccess } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  // Determine first allowed tab for redirect
  const tabRouteMap: Record<string, string> = {
    dashboard: '/dashboard',
    rebanho: '/rebanho',
    confinamento: '/confinamento',
    nutricao: '/nutricao',
    lavoura: '/lavoura',
    financeiro: '/financeiro',
    veterinaria: '/veterinaria',
    deposito: '/deposito',
    equipamentos: '/equipamentos',
    relatorios: '/relatorios',
    funcionarios: '/funcionarios',
    configuracoes: '/configuracoes',
  };

  const firstAllowedRoute = (user.abas_permitidas || [])
    .map(tab => tabRouteMap[tab])
    .find(Boolean) || '/dashboard';

  return (
    <Routes>
      <Route path="/" element={<Navigate to={firstAllowedRoute} replace />} />
      <Route element={<AppLayout />}>
        {hasTabAccess('dashboard') && <Route path="/dashboard" element={<DashboardPage />} />}
        {hasTabAccess('rebanho') && <Route path="/rebanho" element={<RebanhoPage />} />}
        {hasTabAccess('rebanho') && <Route path="/rebanho/:id" element={<AnimalDetailPage />} />}
        {hasTabAccess('financeiro') && <Route path="/financeiro" element={<FinanceiroPage />} />}
        {hasTabAccess('veterinaria') && <Route path="/veterinaria" element={<VeterinariaPage />} />}
        {hasTabAccess('deposito') && <Route path="/deposito" element={<DepositoPage />} />}
        {hasTabAccess('confinamento') && <Route path="/confinamento" element={<ConfinamentoPage />} />}
        {hasTabAccess('nutricao') && <Route path="/nutricao" element={<NutricaoPage />} />}
        {hasTabAccess('lavoura') && <Route path="/lavoura" element={<LavouraPage />} />}
        {hasTabAccess('equipamentos') && <Route path="/equipamentos" element={<EquipamentosPage />} />}
        {hasTabAccess('relatorios') && <Route path="/relatorios" element={<RelatoriosPage />} />}
        {hasTabAccess('funcionarios') && <Route path="/funcionarios" element={<FuncionariosPage />} />}
        {hasTabAccess('configuracoes') && <Route path="/configuracoes" element={<ConfiguracoesPage />} />}
      </Route>
      <Route path="*" element={<Navigate to={firstAllowedRoute} replace />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
