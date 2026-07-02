import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
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
  CheckCircle2,
  MapPin,
  Compass,
  Loader2,
  ChevronRight,
  Download,
  Plus
} from 'lucide-react';
import { cn, getInitials } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { notificationService, events, companyService } from '../services/mockFirebase';
import { AppNotification } from '../types';
import toast from 'react-hot-toast';
import { getCurrentPosition, getCityFromCoords, fetchAddressByCep, CAPITAL_COORDS } from '../lib/geo';

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
  const { user, updateProfile } = useAuth();
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  
  // Location detection states
  const [activeLocationName, setActiveLocationName] = React.useState('São Paulo, SP');
  const [activeCep, setActiveCep] = React.useState('');
  const [showLocationModal, setShowLocationModal] = React.useState(false);
  const [inputCep, setInputCep] = React.useState('');
  const [isDetecting, setIsDetecting] = React.useState(false);
  const [hasCompany, setHasCompany] = React.useState(false);
  const [userCompanyId, setUserCompanyId] = React.useState('c1');

  // PWA states
  const [showInstallBtn, setShowInstallBtn] = React.useState(false);
  const [showIOSGuide, setShowIOSGuide] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const deferredPromptRef = React.useRef<any>(null);

  React.useEffect(() => {
    // Check if running in standalone (PWA install) mode
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsStandalone(!!isStandaloneMode);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.userAgent.includes("Mac") && "ontouchend" in document);

    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) {
      toast.error('Instalação direta não disponível. Você pode adicionar à tela de início no menu do seu navegador.');
      return;
    }

    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    console.log(`Response to installation: ${outcome}`);
    deferredPromptRef.current = null;
    setShowInstallBtn(false);
  };

  // Load and listen to user company status to show/hide "Gestão da Empresa"
  React.useEffect(() => {
    const checkUserCompany = async () => {
      if (user?.uid) {
        try {
          const comp = await companyService.getByUserId(user.uid);
          if (comp) {
            setHasCompany(true);
            setUserCompanyId(comp.id);
          } else {
            setHasCompany(false);
          }
        } catch (err) {
          console.error("Erro ao carregar empresa:", err);
          setHasCompany(false);
        }
      } else {
        setHasCompany(false);
      }
    };

    checkUserCompany();

    window.addEventListener('vapt_company_updated', checkUserCompany);
    window.addEventListener('vapt_location_updated', checkUserCompany);

    return () => {
      window.removeEventListener('vapt_company_updated', checkUserCompany);
      window.removeEventListener('vapt_location_updated', checkUserCompany);
    };
  }, [user]);

  // Sync / Load location based on profile or local storage
  React.useEffect(() => {
    if (user && (user.city || user.cep)) {
      const cityState = user.city ? `${user.city}, ${user.state || 'SP'}` : '';
      if (cityState) {
        setActiveLocationName(cityState);
        if (user.cep) setActiveCep(user.cep);
        
        localStorage.setItem('vapt_user_location_name', cityState);
        if (user.cep) localStorage.setItem('vapt_user_cep', user.cep);
        
        const savedCoords = localStorage.getItem('vapt_user_coords');
        if (!savedCoords && user.state) {
          const capCoords = CAPITAL_COORDS[user.state.toUpperCase()];
          if (capCoords) {
            localStorage.setItem('vapt_user_coords', JSON.stringify(capCoords));
          }
        }
        return;
      }
    }

    const savedLocation = localStorage.getItem('vapt_user_location_name');
    const savedCep = localStorage.getItem('vapt_user_cep');
    if (savedLocation) {
      setActiveLocationName(savedLocation);
      if (savedCep) setActiveCep(savedCep);
    } else {
      setActiveLocationName('São Paulo, SP');
      localStorage.setItem('vapt_user_location_name', 'São Paulo, SP');
    }
  }, [user]);

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    const loadToast = toast.loading('Buscando localização do dispositivo...');
    try {
      const position = await getCurrentPosition();
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      localStorage.setItem('vapt_user_coords', JSON.stringify(coords));
      
      const geoData = await getCityFromCoords(coords.lat, coords.lng);
      if (geoData) {
        const locName = `${geoData.city}, ${geoData.state}`;
        setActiveLocationName(locName);
        setActiveCep('');
        localStorage.setItem('vapt_user_location_name', locName);
        localStorage.removeItem('vapt_user_cep');
        
        if (user) {
          await updateProfile({
            city: geoData.city,
            state: geoData.state,
            cep: ''
          });
        }
        
        toast.success(`Localização definida para: ${locName}`, { id: loadToast });
        setShowLocationModal(false);
        window.dispatchEvent(new Event('vapt_location_updated'));
      } else {
        toast.error('Não foi possível identificar o nome da cidade pelas coordenadas.', { id: loadToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao acessar geolocalização. Por favor, digite o CEP.', { id: loadToast });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCepSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCep.replace(/\D/g, '');
    if (clean.length !== 8) {
      toast.error('Por favor, informe um CEP válido com 8 dígitos.');
      return;
    }
    
    setIsDetecting(true);
    const loadToast = toast.loading('Consultando CEP...');
    try {
      const address = await fetchAddressByCep(clean);
      if (address) {
        const locName = `${address.city}, ${address.state}`;
        setActiveLocationName(locName);
        setActiveCep(clean);
        localStorage.setItem('vapt_user_location_name', locName);
        localStorage.setItem('vapt_user_cep', clean);
        
        const stateCapitalCoords = CAPITAL_COORDS[address.state.toUpperCase()] || { lat: -23.550, lng: -46.633 };
        localStorage.setItem('vapt_user_coords', JSON.stringify(stateCapitalCoords));
        
        if (user) {
          await updateProfile({
            cep: clean,
            city: address.city,
            state: address.state
          });
        }
        
        toast.success(`Localização definida pelo CEP: ${locName}`, { id: loadToast });
        setShowLocationModal(false);
        setInputCep('');
        window.dispatchEvent(new Event('vapt_location_updated'));
      } else {
        toast.error('CEP não encontrado.', { id: loadToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de rede ao consultar o CEP.', { id: loadToast });
    } finally {
      setIsDetecting(false);
    }
  };

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
      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
            />
            {/* Sidebar Content */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden flex flex-col fixed left-0 top-0 h-full w-72 bg-surface-panel border-r border-white/10 z-[101] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 group">
                  <svg viewBox="0 0 140 45" className="h-9 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g fill="#69bd60">
                      <circle cx="14" cy="22.5" r="10" />
                      <circle cx="28" cy="14.5" r="10" />
                      <circle cx="28" cy="30.5" r="10" />
                    </g>
                    <text 
                      x="46" 
                      y="21" 
                      fontFamily="'Montserrat', sans-serif" 
                      fontWeight="900" 
                      fontSize="22" 
                      fill="#FFFFFF"
                      letterSpacing="-0.5"
                    >
                      Vapt
                    </text>
                    <text 
                      x="46" 
                      y="38" 
                      fontFamily="'Montserrat', sans-serif" 
                      fontWeight="800" 
                      fontSize="15" 
                      fill="#69bd60"
                      fontStyle="italic"
                    >
                      Market
                    </text>
                  </svg>
                </Link>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-4 px-3">Navegação</p>
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
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
                  {hasCompany && (
                    <NavLink to={`/empresa/${userCompanyId}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-white/60 hover:text-white font-semibold text-sm hover:bg-white/5 transition-colors">
                      <Store size={18} />
                      Gestão da Empresa
                    </NavLink>
                  )}
                  <NavLink to="/perfil" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-white/60 hover:text-white font-semibold text-sm hover:bg-white/5 transition-colors">
                    <Settings size={18} />
                    Perfil & Ajustes
                  </NavLink>
                </div>
              </nav>

              <div className="mt-auto pt-6">
                {!isStandalone && (
                  <div className="p-4 bg-gradient-to-br from-brand-blue to-brand-blue/80 rounded-2xl border border-white/10 mb-4 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                    <button 
                      onClick={handleInstallClick}
                      className="w-full py-2 bg-white text-brand-blue font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/95 active:scale-95 transition-all shadow-md cursor-pointer"
                    >
                      Instalar Aplicativo
                    </button>
                  </div>
                )}

                <div className="p-4 bg-surface-item rounded-xl border border-white/5 mb-4">
                  <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1.5 flex items-center gap-1.5">
                    <MapPin size={10} className="text-brand-blue animate-pulse" />
                    Minha Região
                  </p>
                  <p className="text-xs text-white/80 leading-relaxed font-bold truncate">
                    {activeLocationName}
                  </p>
                  {activeCep && (
                    <p className="text-[10px] text-white/40 font-semibold tracking-wider font-mono">
                      CEP: {activeCep.replace(/^(\d{5})(\d{3})$/, '$1-$2')}
                    </p>
                  )}
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowLocationModal(true);
                    }}
                    className="mt-2.5 text-brand-blue hover:text-brand-blue/80 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1 transition-colors"
                  >
                    Alterar Localização
                  </button>
                </div>
                {user && user.role === 'admin' && (
                  <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-center text-[10px] font-bold text-white/40 uppercase tracking-widest transition-all">
                    Painel Admin
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-surface-panel border-r border-white/10 z-40 p-4">
        <div className="mb-10 px-3 flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 group">
            <svg viewBox="0 0 140 45" className="h-10 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g fill="#69bd60">
                <circle cx="14" cy="22.5" r="10" />
                <circle cx="28" cy="14.5" r="10" />
                <circle cx="28" cy="30.5" r="10" />
              </g>
              <text 
                x="46" 
                y="21" 
                fontFamily="'Montserrat', sans-serif" 
                fontWeight="900" 
                fontSize="22" 
                fill="#FFFFFF"
                letterSpacing="-0.5"
              >
                Vapt
              </text>
              <text 
                x="46" 
                y="38" 
                fontFamily="'Montserrat', sans-serif" 
                fontWeight="800" 
                fontSize="15" 
                fill="#69bd60"
                fontStyle="italic"
              >
                Market
              </text>
            </svg>
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
            {hasCompany && (
              <NavLink to={`/empresa/${userCompanyId}`} className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-white/60 hover:text-white font-semibold text-sm hover:bg-white/5 transition-colors">
                <Store size={18} />
                Gestão da Empresa
              </NavLink>
            )}
            <NavLink to="/perfil" className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-white/60 hover:text-white font-semibold text-sm hover:bg-white/5 transition-colors">
              <Settings size={18} />
              Perfil
            </NavLink>
          </div>
        </nav>

        <div className="mt-auto px-2 pb-4">
          {!isStandalone && (
            <div className="p-4 bg-gradient-to-br from-brand-blue to-brand-blue/80 rounded-2xl border border-white/10 mb-4 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
              <button 
                onClick={handleInstallClick}
                className="w-full py-2 bg-white text-brand-blue font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/95 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                Instalar Grátis
              </button>
            </div>
          )}

          <div className="p-4 bg-surface-item rounded-xl border border-white/5 mb-4">
             <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1.5 flex items-center gap-1.5">
               <MapPin size={10} className="text-brand-blue animate-pulse" />
               Minha Região
             </p>
             <p className="text-xs text-white/80 leading-relaxed font-bold truncate">
               {activeLocationName}
             </p>
             {activeCep && (
               <p className="text-[10px] text-white/40 font-semibold tracking-wider font-mono">
                 CEP: {activeCep.replace(/^(\d{5})(\d{3})$/, '$1-$2')}
               </p>
             )}
             <button 
               onClick={() => setShowLocationModal(true)}
               className="mt-2.5 text-brand-blue hover:text-brand-blue/80 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1 transition-colors"
               id="change_location_trigger"
             >
               Alterar Localização
             </button>
          </div>
          {user && user.role === 'admin' && (
            <Link to="/admin" className="block w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-center text-[10px] font-bold text-white/40 uppercase tracking-widest transition-all">
              Painel Admin
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 bg-surface-panel/80 backdrop-blur-md sticky top-0 z-30 border-b border-white/10 w-full">
          <div className="flex items-center gap-3 md:hidden">
            <Link to="/" className="flex items-center gap-1 group scale-90 -ml-1">
              <svg viewBox="0 0 140 45" className="h-9 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g fill="#69bd60">
                  <circle cx="14" cy="22.5" r="10" />
                  <circle cx="28" cy="14.5" r="10" />
                  <circle cx="28" cy="30.5" r="10" />
                </g>
                <text 
                  x="46" 
                  y="21" 
                  fontFamily="'Montserrat', sans-serif" 
                  fontWeight="900" 
                  fontSize="22" 
                  fill="#FFFFFF"
                  letterSpacing="-0.5"
                >
                  Vapt
                </text>
                <text 
                  x="46" 
                  y="38" 
                  fontFamily="'Montserrat', sans-serif" 
                  fontWeight="800" 
                  fontSize="15" 
                  fill="#69bd60"
                  fontStyle="italic"
                >
                  Market
                </text>
              </svg>
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
                      <div className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 top-[72px] md:top-auto md:mt-3 w-auto md:w-80 max-w-[calc(100vw-2rem)] md:max-w-none bg-surface-panel border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
                          to="/perfil?tab=notifications" 
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
          <Link 
            to="#" 
            onClick={(e) => {
              e.preventDefault();
              setIsMobileMenuOpen(true);
            }} 
            className={cn("flex flex-col items-center gap-1 flex-1 py-1 transition-all", isMobileMenuOpen ? "text-brand-blue scale-110" : "text-white/40")}
          >
            <Settings size={20} />
            <span className="text-[7px] font-black uppercase tracking-widest">Mais</span>
          </Link>
        </nav>

        {/* Status Bar Footer */}
        <footer className="hidden md:flex h-8 bg-black border-t border-white/5 items-center justify-between px-8 text-[9px] font-bold text-white/20 uppercase tracking-widest shrink-0">
          <div className="flex items-center gap-4">
             <span className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"></span>
               1,402 usuários online agora
             </span>
          </div>
          <p>Vapt Market © 2026 • <Link to="/termos" className="hover:text-white/60 transition-colors underline">Termos & Privacidade</Link></p>
        </footer>
      </main>

      {/* Location Selection Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setShowLocationModal(false)}
            id="location_modal_overlay"
          />
          <div className="bg-surface-panel border border-white/10 rounded-[2.5rem] w-full max-w-md p-8 relative z-10 shadow-2xl overflow-hidden font-sans">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-full -mr-16 -mt-16 blur-xl pointer-events-none" />
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest">Localização</span>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mt-1">
                  Definir Região
                </h3>
              </div>
              <button 
                onClick={() => setShowLocationModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"
                id="close_location_modal"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-white/50 text-xs font-semibold mb-6 leading-relaxed">
              Filtre e ordene as melhores ofertas, vídeos e cupons com base na sua localização atual. Escolha um método de detecção abaixo:
            </p>

            <div className="space-y-6">
              {/* Method 1: GPS Device Geolocation */}
              <button
                type="button"
                disabled={isDetecting}
                onClick={handleAutoDetect}
                className="w-full flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 hover:border-brand-blue/30 hover:bg-white/5 rounded-2xl text-left group transition-all disabled:opacity-50"
                id="detect_gps_button"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {isDetecting ? (
                      <Loader2 size={18} className="text-brand-blue animate-spin" />
                    ) : (
                      <Compass size={18} className="text-brand-blue" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Dispositivo (GPS)</h4>
                    <p className="text-[10px] text-white/40 font-medium mt-0.5">Detectar automaticamente pelo navegador</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-[9px] font-black text-white/20 uppercase tracking-widest">Ou Digite o CEP</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              {/* Method 2: CEP / Postal Code Lookup */}
              <form onSubmit={handleCepSearch} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 pl-1">
                    CEP de Vitória, São Paulo, ou sua região
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={inputCep}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '');
                        if (clean.length <= 5) setInputCep(clean);
                        else setInputCep(`${clean.slice(0, 5)}-${clean.slice(5, 8)}`);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-24 py-3.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                      placeholder="00000-000"
                      maxLength={9}
                      disabled={isDetecting}
                      required
                      id="location_cep_input"
                    />
                    <button
                      type="submit"
                      disabled={isDetecting || inputCep.replace(/\D/g, '').length !== 8}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-brand-blue text-[10px] font-black uppercase tracking-widest text-white rounded-lg hover:bg-brand-blue/80 transition-all disabled:opacity-50 disabled:hover:bg-brand-blue"
                      id="location_cep_submit"
                    >
                      Buscar
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {user && (user.city || user.cep) && (
              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2">Localização do seu Perfil:</p>
                <div className="flex items-center justify-between p-3.5 bg-white/[0.01] border border-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-brand-orange" />
                    <span className="text-xs font-bold text-white/70">
                      {user.city ? `${user.city}, ${user.state || 'SP'}` : 'CEP Cadastrado'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (user.city) {
                        const locName = `${user.city}, ${user.state || 'SP'}`;
                        setActiveLocationName(locName);
                        localStorage.setItem('vapt_user_location_name', locName);
                        if (user.cep) {
                          setActiveCep(user.cep);
                          localStorage.setItem('vapt_user_cep', user.cep);
                        }
                        const stateCapitalCoords = CAPITAL_COORDS[(user.state || 'SP').toUpperCase()] || { lat: -23.550, lng: -46.633 };
                        localStorage.setItem('vapt_user_coords', JSON.stringify(stateCapitalCoords));
                        toast.success(`Usando localização do seu perfil: ${locName}`);
                        setShowLocationModal(false);
                        window.dispatchEvent(new Event('vapt_location_updated'));
                      }
                    }}
                    className="text-[9px] font-black text-brand-orange hover:underline uppercase tracking-wider"
                    id="use_profile_location_button"
                  >
                    Usar Esta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* iOS PWA Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowIOSGuide(false)}
            id="ios_guide_overlay"
          />
          <div className="bg-surface-panel border border-white/10 rounded-[2.5rem] w-full max-w-md p-8 relative z-10 shadow-2xl overflow-hidden font-sans text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-full -mr-16 -mt-16 blur-xl pointer-events-none" />
            
            <div className="flex justify-end">
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"
                id="close_ios_guide"
              >
                <X size={16} />
              </button>
            </div>

            <div className="w-16 h-16 bg-brand-blue/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-brand-blue/20">
              <Download size={28} className="text-brand-blue animate-bounce" />
            </div>

            <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest block mb-1">Instalação iOS (iPhone / iPad)</span>
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-4">
              Vapt Market no Safari
            </h3>

            <p className="text-white/50 text-xs font-semibold mb-6 leading-relaxed">
              Adicione o Vapt Market à sua tela de início para usá-lo como um aplicativo nativo e obter a melhor experiência.
            </p>

            <div className="space-y-4 text-left">
              <div className="flex gap-4 items-start p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-brand-blue/20 text-brand-blue flex items-center justify-center text-xs font-black shrink-0">1</span>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Clique no botão de Compartilhar</h4>
                  <p className="text-[10px] text-white/40 font-medium mt-0.5">
                    Toque no botão de compartilhar localizado na barra inferior do Safari (ícone de um quadrado com uma seta para cima).
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-brand-blue/20 text-brand-blue flex items-center justify-center text-xs font-black shrink-0">2</span>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Selecione "Adicionar à Tela de Início"</h4>
                  <p className="text-[10px] text-white/40 font-medium mt-0.5">
                    Role a lista de opções para baixo e clique no item <strong className="text-white/80">"Adicionar à Tela de Início"</strong> (ícone de um quadrado com um sinal de mais <Plus size={10} className="inline-block" />).
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-brand-blue/20 text-brand-blue flex items-center justify-center text-xs font-black shrink-0">3</span>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Confirme e Toque em "Adicionar"</h4>
                  <p className="text-[10px] text-white/40 font-medium mt-0.5">
                    No canto superior direito, toque no botão <strong className="text-white/80">"Adicionar"</strong> para finalizar. O aplicativo será instalado na sua tela inicial!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-8 py-3.5 bg-brand-blue text-[10px] font-black uppercase tracking-widest text-white rounded-xl hover:bg-brand-blue/80 transition-all cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
