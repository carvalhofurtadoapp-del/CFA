import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Outlet, useNavigate } from 'react-router-dom';
import { DesmamaNotifications } from '@/components/DesmamaNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut } from 'lucide-react';
import logoCfa from '@/assets/logo-cfa.png';

export default function AppLayout() {
  const { user, logout, hasTabAccess } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border bg-card px-4 shrink-0">
            <SidebarTrigger className="mr-3" />
            <img src={logoCfa} alt="CFA" className="w-8 h-8 rounded-lg object-cover mr-2" />
            <h2 className="font-display text-card-foreground text-lg hidden sm:block">Carvalho Furtado Agropecuária</h2>

            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-muted rounded-lg px-2 py-1.5 transition-colors outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.foto || ''} />
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                      {user?.nome?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-card-foreground hidden md:block">{user?.nome}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {hasTabAccess('configuracoes') && (
                    <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                      <Settings className="mr-2 h-4 w-4" /> Configurações
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <DesmamaNotifications />
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
