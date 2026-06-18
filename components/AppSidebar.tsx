import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { PushNotificationButton } from '@/components/PushNotificationButton';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Beef, DollarSign, Stethoscope, Package, LogOut, Fence, Apple, Sprout, Tractor, BarChart3, Users, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import logoCfa from '@/assets/logo-cfa.png';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, tab: 'dashboard' },
  { title: 'Rebanho', url: '/rebanho', icon: Beef, tab: 'rebanho' },
  { title: 'Confinamento', url: '/confinamento', icon: Fence, tab: 'confinamento' },
  { title: 'Nutrição', url: '/nutricao', icon: Apple, tab: 'nutricao' },
  { title: 'Lavoura', url: '/lavoura', icon: Sprout, tab: 'lavoura' },
  { title: 'Fluxo de Caixa', url: '/financeiro', icon: DollarSign, tab: 'financeiro' },
  { title: 'Veterinária', url: '/veterinaria', icon: Stethoscope, tab: 'veterinaria' },
  { title: 'Depósito', url: '/deposito', icon: Package, tab: 'deposito' },
  { title: 'Equipamentos', url: '/equipamentos', icon: Tractor, tab: 'equipamentos' },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3, tab: 'relatorios' },
  { title: 'Funcionários', url: '/funcionarios', icon: Users, tab: 'funcionarios' },
  { title: 'Configurações', url: '/configuracoes', icon: Settings, tab: 'configuracoes' },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, hasTabAccess, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  const filteredItems = menuItems.filter((item) => hasTabAccess(item.tab));

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-4 flex items-center gap-3">
          <img src={logoCfa} alt="CFA Logo" className="w-10 h-10 rounded-xl object-cover shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display font-bold text-sidebar-foreground text-sm truncate">CFA</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url} className="min-h-[44px] text-base md:text-sm md:min-h-[36px]">
                    <NavLink to={item.url} end activeClassName="bg-sidebar-accent text-sidebar-primary" onClick={() => { if (isMobile) setOpenMobile(false); }}>
                      <item.icon className="mr-2 h-5 w-5 md:h-4 md:w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-3 space-y-2">
          <div className="flex items-center justify-center">
            <PushNotificationButton usuarioId={user?.id} />
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-3 md:py-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-base md:text-sm min-h-[44px] md:min-h-0"
          >
            <LogOut className="h-5 w-5 md:h-4 md:w-4" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
