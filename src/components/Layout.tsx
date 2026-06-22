import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Grid, 
  PlusCircle, 
  User, 
  Bell, 
  ShoppingCart, 
  Store,
  Settings,
  MessageCircle,
  Menu,
  X,
  Ticket,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { cn, getInitials } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { notificationService, events } from '../services/mockFirebase';
import { AppNotification } from '../types';

function formatRelativeTime(milli: number): string {
  const diff = Date.now() - milli;
  if (diff < 60000) return 'Agora mesmo';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h atrás`;
  const days = Math.floor(hours / 24);
  return `${days} d atrás`;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);

  React.useEffect(() => {
    // Initial fetch
    notificationService.getAll().then(setNotifications);

    // Subscribe to event updates
    const unsubscribe = events.subscribe('notifications_updated', (updated: AppNotification[]) => {
      setNotifications([...updated].sort((a, b) => b.createdAt - a.createdAt));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
  };

  const handleNotificationClick = async (notifId: string) => {
    await notificationService.markAsRead(notifId);
  };

  const navItems = [
    { icon: Home, label: 'Feed Principal', path: '/' },
    { icon: Grid, label: 'Canais', path: '/categorias' },
    { icon: Search, label: 'Busca', path: '/busca' },
    { icon: Ticket, label: 'Lista de Cupons', path: '/cupons' },
    { icon: PlusCircle, label: 'Quero Anunciar', path: '/anunciar', highlight: true },
  ];

  return (
    <div className="flex min-h-screen bg-surface-deep text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-surface-panel border-r border-white/10 z-40 p-4">
        <div className="mb-10 px-3 flex items-center gap-2">
          <Link to="/" className="flex flex-col group">
            <span className="text-[2.75rem] font-black tracking-[-0.08em] leading-[0.7] text-white italic transition-all group-hover:text-white/90">
              VAPT
            </span>
            <span className="text-[0.75rem] font-black tracking-[0.43em] leading-none text-brand-orange text-center mt-2 pl-0.5">
              MARKET
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-4 px-3">Navegação</p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all font-semibold text-sm",
                isActive 
                  ? "sidebar-active-gradient text-brand-blue shadow-sm" 
                  : item.highlight
                    ? "text-brand-blue bg-brand-blue/5 border border-brand-blue/10 hover:border-brand-blue/20 hover:bg-brand-blue/10"
                    : "text-white/60 hover:text-white hover:bg-white/5",
              )}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
          
          <div className="pt-8 mt-4 space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-4 px-3">Minha Conta</p>
            <NavLink to="/perfil" className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-white/60 hover:text-white font-semibold text-sm hover:bg-white/5 transition-colors">
              <MessageCircle size={18} />
              Minhas Conversas
            </NavLink>
            <NavLink to="/empresa/c1" className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-white/60 hover:text-white font-semibold text-sm hover:bg-white/5 transition-colors">
              <Store size={18} />
              Gestão da Empresa
            </NavLink>
            <NavLink to="/perfil" className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-white/60 hover:text-white font-semibold text-sm hover:bg-white/5 transition-colors">
              <Settings size={18} />
              Privacidade
            </NavLink>
          </div>
        </nav>

        <div className="mt-auto px-2 pb-4">
          <div className="p-4 bg-surface-item rounded-xl border border-white/5 mb-4">
             <p className="text-xs text-white/40 leading-relaxed font-medium">Logado como <span className="text-white">São Paulo, SP</span></p>
             <button className="mt-2 text-brand-blue text-[10px] font-bold uppercase tracking-widest hover:underline">Alterar Localização</button>
          </div>
          <Link to="/admin" className="block w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-center text-[10px] font-bold text-white/40 uppercase tracking-widest transition-all">
            Painel Admin
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 bg-surface-panel/80 backdrop-blur-md sticky top-0 z-30 border-b border-white/10 w-full overflow-hidden">
          <div className="flex items-center gap-3 md:hidden">
            <Link to="/" className="flex flex-col group scale-90 md:scale-100 -ml-1">
              <span className="text-2xl md:text-[2.75rem] font-black tracking-[-0.08em] leading-[0.7] text-white italic">
                VAPT
              </span>
              <span className="text-[0.6rem] md:text-[0.75rem] font-black tracking-[0.43em] leading-none text-brand-orange text-center mt-1.5 md:mt-2 pl-0.5">
                MARKET
              </span>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl mx-8">
             <div className="relative w-full group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-blue transition-colors" />
                <input 
                  type="text" 
                  placeholder="Buscar produtos, serviços ou empresas..." 
                  className="w-full bg-surface-item/50 hover:bg-surface-item border border-white/5 rounded-2xl py-2.5 pl-12 pr-6 text-white text-sm focus:outline-none focus:border-brand-blue/30 transition-all font-medium"
                />
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/anunciar" className="hidden lg:block bg-brand-blue hover:bg-brand-blue/90 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-blue/20">
              Quero Anunciar
            </Link>
            <div className="flex items-center gap-2 md:gap-4 border-l border-white/10 pl-2 md:pl-4">
               <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={cn(
                      "p-2 text-white/40 hover:text-white relative transition-colors rounded-lg hover:bg-white/5",
                      showNotifications && "text-white bg-white/5"
                    )}
                  >
                    <Bell size={18} className="md:w-5 md:h-5" />
                    {notifications.some(n => n.unread) && (
                      <span className="absolute top-2 right-2 md:top-2.5 md:right-2.5 w-1.5 h-1.5 bg-brand-orange rounded-full"></span>
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {showNotifications && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowNotifications(false)}
                      />
                      <div className="absolute right-0 mt-3 w-80 bg-surface-panel border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                          <h3 className="text-xs font-black uppercase tracking-widest italic text-white/60">Notificações</h3>
                          <button 
                            onClick={handleMarkAllAsRead}
                            className="text-[9px] font-bold text-brand-blue uppercase tracking-widest hover:underline"
                          >
                            Marcar todas como lidas
                          </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto no-scrollbar">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-xs text-white/40 font-medium">
                              Nenhuma notificação por enquanto.
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div 
                                key={notif.id} 
                                onClick={() => handleNotificationClick(notif.id)}
                                className={cn(
                                  "p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer relative text-left",
                                  notif.unread && "bg-brand-blue/5"
                                )}
                              >
                                {notif.unread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-blue" />}
                                <div className="flex gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-surface-item flex items-center justify-center shrink-0">
                                    {notif.type === 'coupon' ? <Ticket size={14} className="text-brand-orange" /> : 
                                     notif.type === 'approval' ? <CheckCircle2 size={14} className="text-brand-green" /> : 
                                     <MessageCircle size={14} className="text-brand-blue" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white mb-0.5 truncate">{notif.title}</p>
                                    <p className="text-[10px] text-white/40 leading-tight mb-2 line-clamp-2">{notif.message}</p>
                                    <div className="flex items-center gap-1 text-[8px] font-bold text-black/40 uppercase tracking-widest text-white/20">
                                      <Clock size={8} /> {formatRelativeTime(notif.createdAt)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <Link 
                          to="/perfil" 
                          onClick={() => setShowNotifications(false)}
                          className="block p-3 text-center text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors border-t border-white/10 bg-white/5"
                        >
                          Ver todas as atividades
                        </Link>
                      </div>
                    </>
                  )}
               </div>

               <button className="p-2 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                 <ShoppingCart size={18} className="md:w-5 md:h-5" />
               </button>

               <Link to="/perfil" className="ml-1 w-8 h-8 rounded-full bg-gradient-to-br from-brand-orange to-orange-600 border border-white/20 flex items-center justify-center text-[10px] font-black text-white shadow-lg shrink-0 overflow-hidden">
                {user ? (
                  user.photoURL ? <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" /> : getInitials(user.displayName)
                ) : '??'}
               </Link>
            </div>
          </div>
        </header>

        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-4 md:pt-10 pb-20 md:pb-12">
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-surface-panel/90 backdrop-blur-xl border border-white/10 z-50 flex items-center justify-around px-2 rounded-3xl shadow-2xl shadow-black/50 overflow-visible">
          <NavLink to="/" className={({ isActive }) => cn("flex flex-col items-center gap-1 flex-1 py-1 transition-all", isActive ? "text-brand-blue scale-110" : "text-white/40")}>
            <Home size={20} />
            <span className="text-[7px] font-black uppercase tracking-widest">Feed</span>
          </NavLink>
          <NavLink to="/categorias" className={({ isActive }) => cn("flex flex-col items-center gap-1 flex-1 py-1 transition-all", isActive ? "text-brand-blue scale-110" : "text-white/40")}>
            <Grid size={20} />
            <span className="text-[7px] font-black uppercase tracking-widest">Canais</span>
          </NavLink>
          <div className="relative flex-1 flex justify-center -top-4">
            <Link to="/cupons" className="w-14 h-14 bg-brand-orange rounded-full flex items-center justify-center border-4 border-surface-deep shadow-xl transition-transform active:scale-95">
              <Ticket size={28} className="text-white" />
            </Link>
          </div>
          <NavLink to="/busca" className={({ isActive }) => cn("flex flex-col items-center gap-1 flex-1 py-1 transition-all", isActive ? "text-brand-blue scale-110" : "text-white/40")}>
            <Search size={20} />
            <span className="text-[7px] font-black uppercase tracking-widest">Busca</span>
          </NavLink>
          <NavLink to="/perfil" className={({ isActive }) => cn("flex flex-col items-center gap-1 flex-1 py-1 transition-all", isActive ? "text-brand-blue scale-110" : "text-white/40")}>
            <User size={20} />
            <span className="text-[7px] font-black uppercase tracking-widest">Perfil</span>
          </NavLink>
        </nav>

        {/* Status Bar Footer */}
        <footer className="hidden md:flex h-8 bg-black border-t border-white/5 items-center justify-between px-8 text-[9px] font-bold text-white/20 uppercase tracking-widest shrink-0">
          <div className="flex items-center gap-4">
             <span className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"></span>
               1,402 usuários online agora
             </span>
          </div>
          <p>Vapt Market © 2024 • Termos de Uso</p>
        </footer>
      </main>
    </div>
  );
}
