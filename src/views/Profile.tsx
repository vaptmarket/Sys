import React from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  MapPin, 
  Heart, 
  Bookmark, 
  Ticket, 
  Settings, 
  Bell, 
  Shield, 
  ChevronRight,
  FileText,
  LogOut,
  Camera,
  LogIn,
  Lock,
  Award,
  History,
  BarChart3,
  Store,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  PiggyBank,
  Percent,
  Plus,
  MessageSquare,
  Globe,
  Instagram,
  Clock,
  QrCode,
  Copy,
  ExternalLink,
  Share2,
  DollarSign,
  Users
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { adService, couponService, companyService, categoryService, salesService, events, withdrawService, notificationService } from '../services/mockFirebase';
import { Ad, UserCoupon, Company, Sale, WithdrawRequest, AppNotification } from '../types';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { safeFormatDate } from '../utils/date';
import { cn, getInitials, formatNumber } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

import QrCodeModal from '../components/QrCodeModal';

export default function Profile() {
  const { user, isAuthenticated, loading, login, logout, updateProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = React.useState<'saved' | 'coupons' | 'company' | 'statistics' | 'history' | 'affiliate' | 'notifications'>('saved');

  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'notifications') {
      setActiveTab('notifications');
      // Clear tab from query parameters to not get stuck on refresh
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [savedAds, setSavedAds] = React.useState<Ad[]>([]);
  const [userCoupons, setUserCoupons] = React.useState<UserCoupon[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [engagementMetric, setEngagementMetric] = React.useState<number>(0);
  const [userCompany, setUserCompany] = React.useState<Company | null>(null);
  const [companyAds, setCompanyAds] = React.useState<Ad[]>([]);
  const [viewHistory, setViewHistory] = React.useState<Ad[]>([]);
  const [availableCats, setAvailableCats] = React.useState<any[]>([]);
  const [referredCompanies, setReferredCompanies] = React.useState<Company[]>([]);
  const [referredUsers, setReferredUsers] = React.useState<any[]>([]);
  const [affiliateSales, setAffiliateSales] = React.useState<Sale[]>([]);
  const [pixKeyInput, setPixKeyInput] = React.useState('');
  const [withdrawRequests, setWithdrawRequests] = React.useState<WithdrawRequest[]>([]);
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [withdrawAmountInput, setWithdrawAmountInput] = React.useState('');
  const [isSavingPix, setIsSavingPix] = React.useState(false);
  const [isRequestingWithdraw, setIsRequestingWithdraw] = React.useState(false);
  const [filterType, setFilterType] = React.useState<'all' | 'unread' | 'coupon' | 'approval' | 'chat'>('all');

  React.useEffect(() => {
    if (user?.pixKey) {
      setPixKeyInput(user.pixKey);
    }
  }, [user?.pixKey]);

  const [selectedCoupon, setSelectedCoupon] = React.useState<{
    code: string;
    discountValue: string;
    description: string;
    companyName: string;
  } | null>(null);

  const [compName, setCompName] = React.useState('');
  const [compCategory, setCompCategory] = React.useState('');
  const [compPhone, setCompPhone] = React.useState('');
  const [compAddress, setCompAddress] = React.useState('');
  const [compDesc, setCompDesc] = React.useState('');
  const [isRegisteringCompany, setIsRegisteringCompany] = React.useState(false);

  // Expanded complete company registration state variables
  const [compCnpj, setCompCnpj] = React.useState('');
  const [compEmail, setCompEmail] = React.useState('');
  const [compInstagram, setCompInstagram] = React.useState('');
  const [compWebsite, setCompWebsite] = React.useState('');
  const [compHours, setCompHours] = React.useState('');
  const [compCep, setCompCep] = React.useState('');
  const [compStreet, setCompStreet] = React.useState('');
  const [compNumber, setCompNumber] = React.useState('');
  const [compComplement, setCompComplement] = React.useState('');
  const [compNeighborhood, setCompNeighborhood] = React.useState('');
  const [compCity, setCompCity] = React.useState('');
  const [compState, setCompState] = React.useState('');
  const [isSearchingCep, setIsSearchingCep] = React.useState(false);

  // Input formatting helpers for premium UX
  const formatCEP = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 5) return clean;
    return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
  };

  const formatCNPJ = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 2) return clean;
    if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
    if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
    if (clean.length <= 12) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
  };

  const formatPhone = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 2) return clean;
    if (clean.length <= 7) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
  };

  // Real API CEP dynamic lookup
  const fetchCepDetails = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsSearchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (data && !data.erro) {
          setCompStreet(data.logradouro || '');
          setCompNeighborhood(data.bairro || '');
          setCompCity(data.localidade || '');
          setCompState(data.uf || '');
          toast.success('Localização detectada automaticamente pelo CEP!');
        } else {
          toast.error('CEP não encontrado. Digite os detalhes manualmente.');
        }
      } catch (err) {
        console.error('Error fetching CEP details:', err);
        toast.error('Falha de rede ao consultar CEP.');
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editPhone, setEditPhone] = React.useState('');
  const [editPixKey, setEditPixKey] = React.useState('');
  const [editCep, setEditCep] = React.useState('');
  const [editStreet, setEditStreet] = React.useState('');
  const [editNumber, setEditNumber] = React.useState('');
  const [editComplement, setEditComplement] = React.useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem é muito grande. Escolha uma imagem menor que 2MB.');
      return;
    }

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = reader.result as string;
        await updateProfile({ photoURL: base64String });
        toast.success('Foto de perfil atualizada com sucesso!');
      } catch (err) {
        console.error('Failed to update photo:', err);
        toast.error('Erro ao atualizar foto de perfil.');
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.onerror = () => {
      toast.error('Erro ao ler o arquivo de imagem.');
      setIsUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };
  const [editNeighborhood, setEditNeighborhood] = React.useState('');
  const [editCity, setEditCity] = React.useState('');
  const [editState, setEditState] = React.useState('');

  const [emailNotifications, setEmailNotifications] = React.useState<boolean>(() => {
    return localStorage.getItem('vapt_pref_email_notifications') !== 'false';
  });
  const [privateProfile, setPrivateProfile] = React.useState<boolean>(() => {
    return localStorage.getItem('vapt_pref_private_profile') === 'true';
  });

  React.useEffect(() => {
    if (user) {
      setEditName(user.displayName || '');
      setEditPhone(user.phone || '');
      setEditPixKey(user.pixKey || '');
      setEditCep(user.cep || '');
      setEditStreet(user.street || '');
      setEditNumber(user.number || '');
      setEditComplement(user.complement || '');
      setEditNeighborhood(user.neighborhood || '');
      setEditCity(user.city || '');
      setEditState(user.state || '');
    }
  }, [user]);

  const toggleEmailNotifications = () => {
    const newValue = !emailNotifications;
    setEmailNotifications(newValue);
    localStorage.setItem('vapt_pref_email_notifications', String(newValue));
    toast.success(newValue ? 'Notificações por email ativadas!' : 'Notificações por email desativadas.');
  };

  const togglePrivateProfile = () => {
    const newValue = !privateProfile;
    setPrivateProfile(newValue);
    localStorage.setItem('vapt_pref_private_profile', String(newValue));
    toast.success(newValue ? 'Perfil definido como privado.' : 'Perfil definido como público.');
  };

  const handleRemoveSaved = async (adId: string) => {
    if (!user) return;
    try {
      await adService.toggleSave(user.uid, adId);
      setSavedAds(prev => prev.filter(ad => ad.id !== adId));
      toast.success('Anúncio removido dos salvos!');
    } catch (err) {
      console.error('Falha ao remover anúncio do estado do perfil:', err);
      toast.error('Ocorreu um erro ao tentar remover.');
    }
  };

  const handleSavePixKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!pixKeyInput.trim()) {
      toast.error('Por favor, informe uma Chave Pix válida.');
      return;
    }
    setIsSavingPix(true);
    const loadId = toast.loading('Salvando Chave Pix...');
    try {
      await updateProfile({ pixKey: pixKeyInput.trim() });
      toast.success('Chave Pix registrada com sucesso!', { id: loadId });
    } catch (err) {
      console.error('Failed to save Pix Key:', err);
      toast.error('Erro ao salvar Chave Pix.', { id: loadId });
    } finally {
      setIsSavingPix(false);
    }
  };

  const handleRequestWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!pixKeyInput.trim()) {
      toast.error('Você precisa cadastrar uma Chave Pix antes de solicitar um saque.');
      return;
    }

    const availableBonus = affiliateSales
      .filter(s => s.status === 'Finalizada' || s.status === 'Liberado para Saque')
      .reduce((acc, s) => acc + s.bonusValue, 0);

    const alreadyWithdrawn = withdrawRequests
      .filter(w => w.status === 'Aprovado' || w.status === 'Pendente')
      .reduce((acc, w) => acc + w.amount, 0);

    const withdrawable = Math.max(0, availableBonus - alreadyWithdrawn);

    const requestedAmount = parseFloat(withdrawAmountInput);

    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      toast.error('Informe um valor válido e maior que zero para o saque.');
      return;
    }

    if (requestedAmount > withdrawable) {
      toast.error(`Saldo insuficiente. Você pode sacar no máximo R$ ${withdrawable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
      return;
    }

    setIsRequestingWithdraw(true);
    const loadId = toast.loading('Processando solicitação de saque...');
    try {
      const finalPixKey = pixKeyInput.trim();
      if (finalPixKey !== user.pixKey) {
        await updateProfile({ pixKey: finalPixKey });
      }

      await withdrawService.create({
        userId: user.uid,
        userName: user.displayName || 'Usuário Vapt',
        userEmail: user.email,
        pixKey: finalPixKey,
        amount: requestedAmount,
        status: 'Pendente'
      });

      setWithdrawAmountInput('');
      
      await fetchData();
      toast.success('Solicitação de saque enviada com sucesso! Aguarde a liberação do administrador.', { id: loadId });
    } catch (err) {
      console.error('Error requesting withdrawal:', err);
      toast.error('Erro ao solicitar saque.', { id: loadId });
    } finally {
      setIsRequestingWithdraw(false);
    }
  };

  const fetchData = React.useCallback(async () => {
    if (user) {
      setIsLoading(true);
      try {
        const [ads, coupons, cats] = await Promise.all([
          adService.getSavedAds(user.uid),
          couponService.getUserCoupons(user.uid),
          categoryService.getAll()
        ]);
        setSavedAds(ads);
        setUserCoupons(coupons);
        setAvailableCats(cats);
        if (cats.length > 0) {
          setCompCategory(prev => prev || cats[0].name);
        }

        // Aggregate engagement metrics dynamically (Issue 25)
        const uComp = await companyService.getByUserId(user.uid);
        setUserCompany(uComp || null);

        let totalVisits = 0;
        if (uComp) {
          const allAds = await adService.getAll();
          const compAds = allAds.filter(ad => ad.companyId === uComp.id);
          setCompanyAds(compAds);
          totalVisits = compAds.reduce((acc, ad) => acc + (ad.views || 0), 0);
        } else {
          setCompanyAds([]);
          totalVisits = Math.floor(ads.reduce((acc, ad) => acc + (ad.views || 0), 0) + coupons.length * 5);
        }
        setEngagementMetric(totalVisits);

        // Fetch or simulate view history
        const allAds = await adService.getAll();
        const historyIdsRaw = localStorage.getItem('vapt_view_history');
        let historyAds: Ad[] = [];
        if (historyIdsRaw) {
          try {
            const histIds = JSON.parse(historyIdsRaw) as string[];
            historyAds = allAds.filter(ad => histIds.includes(ad.id));
          } catch {}
        }
        if (historyAds.length === 0) {
          // fallback to some default popular ads so it's beautifully pre-populated
          historyAds = allAds.slice(0, 4);
        }
        setViewHistory(historyAds);

        // Fetch affiliate, referred companies, and notifications
        const [allComps, salesData, withdrawsData, notifsData] = await Promise.all([
          companyService.getAll(),
          salesService.getByAffiliateId(user.uid),
          withdrawService.getByUserId(user.uid),
          notificationService.getAll()
        ]);
        setReferredCompanies(allComps.filter(c => c.referredBy === user.uid));
        setAffiliateSales(salesData);
        setWithdrawRequests(withdrawsData);
        setNotifications(notifsData);

        // Fetch referred users from Firestore
        let referredUsersData: any[] = [];
        try {
          const q = query(collection(db, 'users'), where('referredBy', '==', user.uid));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            referredUsersData.push({ id: doc.id, ...doc.data() });
          });
        } catch (e) {
          console.error('Error fetching referred users from firestore:', e);
        }

        // Merge with local storage fallback
        const savedUsersStr = localStorage.getItem('vapt_registered_users');
        if (savedUsersStr) {
          try {
            const registeredUsers = JSON.parse(savedUsersStr);
            const localReferred = registeredUsers
              .filter((u: any) => u.referredBy === user.uid)
              .map((u: any) => ({
                id: u.uid,
                displayName: u.displayName || u.name || 'Usuário Vapt',
                email: u.email,
                role: u.role,
                createdAt: u.createdAt || Date.now()
              }));
            
            const allMerged = [...referredUsersData, ...localReferred];
            const uniqueMap = new Map();
            allMerged.forEach(item => uniqueMap.set(item.id, item));
            referredUsersData = Array.from(uniqueMap.values());
          } catch {}
        }
        setReferredUsers(referredUsersData);
      } catch (err) {
        console.error('Failed to fetch profile data:', err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [user]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Mock global event listener for updates from adService
  React.useEffect(() => {
    const handleUpdate = () => fetchData();
    
    // Subscribe to internal events
    const unsubscribe = events.subscribe('user_data_updated', (data) => {
      if (user && data.userId === user.uid) {
        fetchData();
      }
    });

    window.addEventListener('storage', handleUpdate); // For multi-tab
    
    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleUpdate);
    };
  }, [fetchData, user]);

  React.useEffect(() => {
    const unsubscribe = events.subscribe('notifications_updated', (updated: AppNotification[]) => {
      setNotifications(updated);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="w-12 h-12 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] animate-pulse">Sincronizando Sessão...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="py-6 max-w-5xl mx-auto">
      <Helmet>
        <title>{user?.displayName} | Meu Perfil | Vapt Market</title>
      </Helmet>
      <div className="bg-surface-panel rounded-[2.5rem] border border-white/10 p-8 md:p-12 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-brand-orange p-1 shadow-2xl shadow-brand-orange/20">
              <div className="w-full h-full rounded-full bg-surface-item flex items-center justify-center text-4xl font-black text-white italic overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  getInitials(user?.displayName)
                )}
              </div>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute bottom-0 right-0 w-10 h-10 bg-brand-blue text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-surface-panel hover:scale-110 active:scale-95 transition-all cursor-pointer"
            >
              {isUploadingPhoto ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={18} />
              )}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-4">
              <h1 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-tight">{user?.displayName}</h1>
              <button 
                onClick={() => {
                  const newRole = user?.role === 'admin' ? 'user' : 'admin';
                  updateProfile({ role: newRole });
                  toast.success(`Cargo alterado offline para: ${newRole === 'admin' ? 'Administrador ⚙️' : 'Membro Regular 👤'}`);
                }}
                className={cn(
                  "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest w-fit mx-auto md:mx-0 border hover:scale-105 active:scale-95 transition-all cursor-pointer",
                  user?.role === 'admin' 
                    ? "bg-brand-orange/10 text-brand-orange border-brand-orange/25" 
                    : "bg-brand-blue/10 text-brand-blue border-brand-blue/25"
                )}
                title="Clique aqui para simular troca de cargo"
              >
                {user?.role === 'admin' ? 'Administrador ⚙️' : 'Membro VIP 👤'}
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 sm:gap-4 mb-8 md:mb-6">
              <div className="flex items-center gap-2 text-white/40 text-sm font-medium">
                <MapPin size={16} /> {user?.city ? `${user.city}, ${user.state || 'SP'}` : 'São Paulo, SP'}
              </div>
              <div className="flex items-center gap-2 text-white/40 text-sm font-medium">
                <Bell size={16} /> 3 Notificações
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 relative z-10 font-sans">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="w-full sm:w-auto px-8 py-3 bg-brand-orange text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-orange/20 cursor-pointer hover:bg-brand-orange/90 hover:scale-105 active:scale-95 transition-all text-center"
              >
                Editar Perfil
              </button>
              <button 
                onClick={() => {
                  document.getElementById('quick-settings')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-8 py-3 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer transition-all text-center"
              >
                Configurações
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 text-center border-l border-white/5 pl-8 hidden lg:grid relative min-w-[240px]">
            {privateProfile ? (
              <div className="col-span-3 h-full flex flex-col items-center justify-center bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/5 p-4 py-6">
                <Lock size={18} className="text-white/30 mb-2 animate-pulse" />
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Painel Privado</p>
                <p className="text-[8px] text-white/20 mt-0.5">Métricas ocultadas</p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-2xl font-black text-white">{savedAds.length}</p>
                  <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mt-1">Salvos</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{userCoupons.length}</p>
                  <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mt-1">Cupons</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{formatNumber(engagementMetric)}</p>
                  <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mt-1">Visitas</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Tabs */}
        <div className="space-y-4">
          <div className="bg-surface-panel rounded-3xl border border-white/10 overflow-hidden">
            <button 
              onClick={() => setActiveTab('saved')}
              className={cn(
                "w-full flex items-center justify-between p-6 transition-all group",
                activeTab === 'saved' ? "bg-white/5 text-brand-blue" : "text-white/40 hover:text-white"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", activeTab === 'saved' ? "bg-brand-blue/10" : "bg-white/5 group-hover:bg-white/10")}>
                  <Bookmark size={20} />
                </div>
                <span className="font-bold uppercase tracking-widest text-xs">Itens Salvos</span>
              </div>
              <ChevronRight size={16} />
            </button>

            <button 
              onClick={() => setActiveTab('coupons')}
              className={cn(
                "w-full flex items-center justify-between p-6 transition-all group border-t border-white/5",
                activeTab === 'coupons' ? "bg-white/5 text-brand-orange" : "text-white/40 hover:text-white"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", activeTab === 'coupons' ? "bg-brand-orange/10" : "bg-white/5 group-hover:bg-white/10")}>
                  <Ticket size={20} />
                </div>
                <span className="font-bold uppercase tracking-widest text-xs">Meus Cupons</span>
              </div>
              <ChevronRight size={16} />
            </button>

            <button 
              onClick={() => setActiveTab('company')}
              className={cn(
                "w-full flex items-center justify-between p-6 transition-all group border-t border-white/5",
                activeTab === 'company' ? "bg-white/5 text-brand-blue" : "text-white/40 hover:text-white"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", activeTab === 'company' ? "bg-brand-blue/10" : "bg-white/5 group-hover:bg-white/10")}>
                  <Store size={20} />
                </div>
                <span className="font-bold uppercase tracking-widest text-xs">Minha Empresa</span>
              </div>
              <ChevronRight size={16} />
            </button>

            <button 
              onClick={() => setActiveTab('statistics')}
              className={cn(
                "w-full flex items-center justify-between p-6 transition-all group border-t border-white/5",
                activeTab === 'statistics' ? "bg-white/5 text-amber-500" : "text-white/40 hover:text-white"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", activeTab === 'statistics' ? "bg-amber-50/10" : "bg-white/5 group-hover:bg-white/10")}>
                  <BarChart3 size={20} className="text-amber-500" />
                </div>
                <span className="font-bold uppercase tracking-widest text-xs">Métricas & Conquistas</span>
              </div>
              <ChevronRight size={16} />
            </button>

            <button 
              onClick={() => setActiveTab('history')}
              className={cn(
                "w-full flex items-center justify-between p-6 transition-all group border-t border-white/5",
                activeTab === 'history' ? "bg-white/5 text-purple-400" : "text-white/40 hover:text-white"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", activeTab === 'history' ? "bg-purple-400/10" : "bg-white/5 group-hover:bg-white/10")}>
                  <History size={20} className="text-purple-400" />
                </div>
                <span className="font-bold uppercase tracking-widest text-xs">Histórico</span>
              </div>
              <ChevronRight size={16} />
            </button>

            <button 
              onClick={() => setActiveTab('affiliate')}
              className={cn(
                "w-full flex items-center justify-between p-6 transition-all group border-t border-white/5",
                activeTab === 'affiliate' ? "bg-white/5 text-brand-orange" : "text-white/40 hover:text-white"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", activeTab === 'affiliate' ? "bg-brand-orange/10" : "bg-white/5 group-hover:bg-white/10")}>
                  <TrendingUp size={20} className="text-brand-orange" />
                </div>
                <span className="font-bold uppercase tracking-widest text-xs">Indicações (Afiliado)</span>
              </div>
              <ChevronRight size={16} />
            </button>

            <button 
              onClick={() => setActiveTab('notifications')}
              className={cn(
                "w-full flex items-center justify-between p-6 transition-all group border-t border-white/5",
                activeTab === 'notifications' ? "bg-white/5 text-brand-orange" : "text-white/40 hover:text-white"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors relative", activeTab === 'notifications' ? "bg-brand-orange/10" : "bg-white/5 group-hover:bg-white/10")}>
                  <Bell size={20} className={cn(activeTab === 'notifications' ? "text-brand-orange" : "")} />
                  {notifications.filter(n => n.unread).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-orange text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#111317]">
                      {notifications.filter(n => n.unread).length}
                    </span>
                  )}
                </div>
                <span className="font-bold uppercase tracking-widest text-xs">Notificações</span>
              </div>
              <ChevronRight size={16} />
            </button>

            <Link 
              to="/termos"
              className="w-full flex items-center justify-between p-6 transition-all group border-t border-white/5 text-white/40 hover:text-white hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-white/5 group-hover:bg-white/10">
                  <FileText size={20} className="text-brand-blue group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-left">
                  <span className="block font-bold uppercase tracking-widest text-xs">Termos & Privacidade</span>
                  <span className="block text-[8px] text-white/30 font-semibold uppercase tracking-wider mt-0.5">Políticas da Plataforma</span>
                </div>
              </div>
              <ChevronRight size={16} />
            </Link>
          </div>

          <div id="quick-settings" className="bg-surface-panel rounded-3xl border border-white/10 p-6 space-y-6">
            <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2 px-2">Configurações Rápidas</h4>
            <div className="space-y-4">
              {/* Perfil Privado Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors", privateProfile ? "bg-brand-orange/10 text-brand-orange" : "bg-white/5 text-white/40")}>
                    <Shield size={16} />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-[10px] text-white uppercase tracking-wider">Perfil Privado</span>
                    <span className="block text-[9px] text-white/40 font-medium">Ocultar métricas públicas</span>
                  </div>
                </div>
                <button 
                  onClick={togglePrivateProfile}
                  className={cn(
                    "w-9 h-5 rounded-full p-0.5 transition-colors duration-200 relative focus:outline-none flex items-center cursor-pointer",
                    privateProfile ? "bg-brand-orange" : "bg-white/10"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200",
                    privateProfile ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Notificações Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors", emailNotifications ? "bg-brand-blue/10 text-brand-blue" : "bg-white/5 text-white/40")}>
                    <Bell size={16} />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-[10px] text-white uppercase tracking-wider">Notificações</span>
                    <span className="block text-[9px] text-white/40 font-medium">Alertas de cupons</span>
                  </div>
                </div>
                <button 
                  onClick={toggleEmailNotifications}
                  className={cn(
                    "w-9 h-5 rounded-full p-0.5 transition-colors duration-200 relative focus:outline-none flex items-center cursor-pointer",
                    emailNotifications ? "bg-brand-blue" : "bg-white/10"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200",
                    emailNotifications ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>

              <button 
                onClick={logout}
                className="w-full flex items-center gap-4 p-4 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest cursor-pointer"
              >
                <LogOut size={18} />
                <span className="font-bold text-xs uppercase tracking-widest">Sair</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2">
          {activeTab === 'saved' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedAds.length > 0 ? savedAds.map((ad, index) => (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-surface-panel rounded-[2rem] border border-white/10 overflow-hidden group hover:border-brand-blue/30 transition-all font-sans"
                >
                  <div className="aspect-[4/3] relative">
                    <img referrerPolicy="no-referrer" src={ad.thumbnail} alt={ad.title} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                    <div className="absolute top-4 right-4">
                       <button 
                        onClick={() => handleRemoveSaved(ad.id)}
                        className="w-10 h-10 rounded-full bg-brand-orange text-white flex items-center justify-center shadow-lg cursor-pointer hover:scale-115 active:scale-90 transition-all border-0"
                        title="Remover dos Salvos"
                       >
                         <Bookmark size={18} fill="currentColor" />
                       </button>
                    </div>
                    <div className="absolute bottom-4 left-4">
                       <span className="bg-black/60 backdrop-blur-md text-[9px] font-black text-white px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">
                         {ad.category}
                       </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-white font-bold mb-2 group-hover:text-brand-blue transition-colors line-clamp-1">{ad.title}</h3>
                    <div className="flex items-center justify-between">
                       <p className="text-brand-green font-black tracking-tighter">
                         {ad.price ? `R$ ${ad.price.toLocaleString('pt-BR')}` : 'Sob Consulta'}
                       </p>
                       <Link 
                        to={`/anuncio/${ad.id}`}
                        className="text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors animate-pulse"
                       >
                         Ver Detalhes
                       </Link>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full py-20 text-center bg-surface-panel rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center min-h-[350px]">
                  <Bookmark size={48} className="text-white/10 mb-4" />
                  <p className="text-white/30 font-black uppercase tracking-widest text-[11px]">Nenhum anúncio salvo ainda</p>
                  <p className="text-white/20 text-xs mt-1 max-w-xs leading-relaxed">Clique no ícone de salvar em qualquer anúncio do feed para visualizá-lo aqui depois.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="space-y-4 font-sans">
              {userCoupons.length > 0 ? userCoupons.map((coupon, index) => (
                <motion.div
                  key={coupon.id}
                  initial={{ opacity: 0, x: -25 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-surface-panel rounded-3xl border border-white/10 p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-brand-orange/30 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/[0.01] rounded-full blur-2xl pointer-events-none" />
                  <div className="w-16 h-16 bg-brand-orange/10 rounded-2xl flex items-center justify-center text-brand-orange shrink-0 shadow-lg shadow-brand-orange/5">
                    <Ticket size={32} />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="text-white font-black uppercase tracking-tighter italic text-base">{coupon.companyName}</h4>
                    <p className="text-brand-orange font-black text-2xl tracking-tight leading-none mt-1">{coupon.discountValue}</p>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center justify-center md:justify-start gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                      Expira em: {safeFormatDate(coupon.expiresAt)}
                    </p>
                  </div>
                  <div className="bg-white/5 px-6 py-4 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center shrink-0 min-w-[150px] gap-2">
                    <div className="text-center">
                      <span className="text-[9px] font-black text-white/25 uppercase tracking-widest mb-1 block">Cupom Ativo</span>
                      <span className="text-lg font-black text-brand-blue font-mono tracking-widest bg-brand-blue/5 border border-brand-blue/20 px-3 py-1 rounded-lg block">{coupon.code}</span>
                    </div>
                    <button
                      onClick={() => setSelectedCoupon({
                        code: coupon.code,
                        discountValue: coupon.discountValue,
                        description: coupon.description || 'Cupom Promocional',
                        companyName: coupon.companyName
                      })}
                      className="w-full py-1.5 rounded-lg bg-brand-orange text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <QrCode size={12} /> QR Code
                    </button>
                  </div>
                </motion.div>
              )) : (
                <div className="bg-surface-panel rounded-3xl border border-white/10 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-20 h-20 bg-brand-orange/10 rounded-[2rem] flex items-center justify-center text-brand-orange mb-6">
                    <Ticket size={40} />
                  </div>
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">Sem Cupons Ativos</h3>
                  <p className="text-white/40 text-sm font-medium max-w-xs mb-8">Você ainda não resgatou nenhum cupom de desconto. Explore as ofertas da sua região!</p>
                  <Link to="/cupons" className="px-8 py-3 bg-brand-orange text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-brand-orange/20 hover:scale-105 active:scale-95 transition-all">
                    Buscar Promoções
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'company' && (
            <div className="space-y-6 font-sans">
              {userCompany ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-surface-panel rounded-[2rem] border border-white/10 overflow-hidden relative text-left">
                    <div className="h-32 bg-gradient-to-r from-brand-blue/30 to-brand-orange/10 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-blue-500/10" />
                      <div className="absolute top-4 right-4 animate-bounce">
                        <span className="bg-brand-blue text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
                          <CheckCircle2 size={10} /> Parceiro Verificado Vapt
                        </span>
                      </div>
                    </div>

                    <div className="p-8 pt-0 -mt-8 relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                      <div className="w-20 h-20 rounded-2xl bg-[#111317] border-2 border-white/10 p-1 shrink-0 overflow-hidden flex items-center justify-center shadow-xl font-sans text-xs">
                        {userCompany.logo ? (
                          <img referrerPolicy="no-referrer" src={userCompany.logo} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <Store size={36} className="text-white/30" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">{userCompany.name}</h3>
                        <p className="text-brand-orange text-xs font-bold uppercase tracking-wider">{userCompany.category}</p>
                      </div>
                      <button 
                        onClick={async () => {
                          if (confirm('Deseja desvincular esta empresa para simular um novo cadastro comercial?')) {
                            // Reset local stats
                            setCompName('');
                            setCompCnpj('');
                            setCompEmail('');
                            setCompPhone('');
                            setCompInstagram('');
                            setCompWebsite('');
                            setCompHours('');
                            setCompCep('');
                            setCompStreet('');
                            setCompNumber('');
                            setCompComplement('');
                            setCompNeighborhood('');
                            setCompCity('');
                            setCompState('');
                            setCompDesc('');
                            setCompAddress('');

                            await companyService.create({ ...userCompany, userId: 'deleted_or_other' });
                            window.dispatchEvent(new Event('vapt_company_updated'));
                            fetchData();
                            toast.success('Empresa desvinculada! Agora você pode criar uma nova de exemplo.');
                          }
                        }}
                        className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[9px] font-black rounded-lg uppercase tracking-widest transition-all cursor-pointer border-0"
                      >
                        Resetar Simulação
                      </button>
                    </div>

                    <div className="p-8 border-t border-white/5 space-y-6">
                      <div>
                        <h5 className="text-[9px] font-black uppercase text-white/30 tracking-widest mb-1.5">Descrição do Estabelecimento</h5>
                        <p className="text-white/70 text-xs leading-relaxed">{userCompany.description || 'Nenhuma descrição providenciada.'}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* Informações Gerais */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-brand-blue uppercase tracking-widest border-b border-white/5 pb-2">Informações Gerais</h4>
                          
                          {userCompany.cnpj && (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 shrink-0">
                                <Shield size={14} />
                              </div>
                              <div className="text-left">
                                <span className="block text-[8px] font-bold text-white/30 uppercase tracking-wider">CNPJ</span>
                                <span className="block text-white/80 text-xs font-mono">{userCompany.cnpj}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 shrink-0">
                              <MessageSquare size={14} />
                            </div>
                            <div className="text-left">
                              <span className="block text-[8px] font-bold text-white/30 uppercase tracking-wider">WhatsApp Comercial</span>
                              <span className="block text-white/80 text-xs font-semibold">{userCompany.whatsapp || userCompany.phone}</span>
                            </div>
                          </div>

                          {userCompany.email && (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 shrink-0">
                                <Bell size={14} />
                              </div>
                              <div className="text-left">
                                <span className="block text-[8px] font-bold text-white/30 uppercase tracking-wider">E-mail Comercial</span>
                                <span className="block text-white/80 text-xs font-semibold truncate max-w-[200px]">{userCompany.email}</span>
                              </div>
                            </div>
                          )}

                          {userCompany.hours && (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 shrink-0">
                                <Clock size={14} />
                              </div>
                              <div className="text-left">
                                <span className="block text-[8px] font-bold text-white/30 uppercase tracking-wider">Funcionamento</span>
                                <span className="block text-white/80 text-xs font-semibold">{userCompany.hours}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Localização & Links */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-brand-orange uppercase tracking-widest border-b border-white/5 pb-2">Localização & Redes</h4>

                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 shrink-0 mt-0.5">
                              <MapPin size={14} />
                            </div>
                            <div className="text-left">
                              <span className="block text-[8px] font-bold text-white/30 uppercase tracking-wider">Endereço Comercial</span>
                              <span className="block text-white/80 text-xs font-semibold mt-0.5 leading-snug">{userCompany.address || 'Não especificado'}</span>
                              {userCompany.cep && (
                                <span className="inline-block bg-white/5 border border-white/10 text-[8px] font-bold px-2 py-0.5 rounded-md mt-1.5 text-white/60 uppercase tracking-widest font-mono">
                                  CEP: {userCompany.cep}
                                </span>
                              )}
                            </div>
                          </div>

                          {(userCompany.instagram || userCompany.website) && (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              {userCompany.instagram && (
                                <a 
                                  href={`https://instagram.com/${userCompany.instagram.replace('@', '')}`}
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors text-white/70 hover:text-white"
                                >
                                  <Instagram size={14} className="text-pink-500 shrink-0" />
                                  <span className="text-[10px] font-black uppercase truncate">@{userCompany.instagram}</span>
                                </a>
                              )}
                              {userCompany.website && (
                                <a 
                                  href={userCompany.website.startsWith('http') ? userCompany.website : `https://${userCompany.website}`}
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors text-white/70 hover:text-white"
                                >
                                  <Globe size={14} className="text-brand-blue shrink-0" />
                                  <span className="text-[10px] font-black uppercase truncate">Site Web</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-white italic uppercase tracking-tighter">Anúncios de {userCompany.name} ({companyAds.length})</h4>
                      <Link to="/quero_anunciar" className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline flex items-center gap-1 transition-colors">
                        <Plus size={12} /> Postar Novo Curta
                      </Link>
                    </div>

                    {companyAds.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {companyAds.map((ad) => (
                          <div key={ad.id} className="bg-surface-panel rounded-2xl border border-white/5 overflow-hidden p-4 flex gap-4 items-center">
                            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white/5 relative shadow">
                              <img referrerPolicy="no-referrer" src={ad.thumbnail} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <span className="text-[8px] text-white font-black bg-black/60 px-1.5 py-0.5 rounded uppercase font-mono">{ad.category}</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-white font-bold text-xs truncate leading-snug">{ad.title}</h5>
                              <p className="text-brand-green font-black text-[11px] mt-0.5">
                                {ad.price ? `R$ ${ad.price.toLocaleString('pt-BR')}` : 'Grátis/Sob Consulta'}
                              </p>
                              <div className="flex items-center gap-4 text-white/30 text-[9px] mt-1.5 font-semibold">
                                <span className="flex items-center gap-0.5"><TrendingUp size={10} className="text-brand-blue" /> {ad.views || 0} views</span>
                                <span className="flex items-center gap-0.5"><Heart size={10} className="text-brand-orange" /> {ad.saved || 0} saves</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-white/[0.01] border border-white/5 rounded-2xl">
                        <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest">Nenhum anúncio publicado ainda.</p>
                        <p className="text-white/20 text-[9px] mt-1 max-w-xs mx-auto">Vá na guia Quero Anunciar para lançar seu primeiro anúncio rápido!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-surface-panel rounded-[2.5rem] border border-white/10 p-8 md:p-12 relative overflow-hidden space-y-8"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-brand-blue/10 text-brand-blue rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-brand-blue/5">
                      <Store size={32} />
                    </div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter font-sans">Cadastre seu Negócio Real</h3>
                    <p className="text-white/40 text-xs max-w-md mx-auto leading-relaxed">
                      Publique ofertas instantâneas em formato de vídeo feed curtinho e ative cupons de desconto exclusivos. Crie sua empresa modelo para testar.
                    </p>
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!compName.trim() || !compPhone.trim() || !compCnpj.trim() || !compEmail.trim()) {
                        toast.error('Preencha os dados básicos obrigatórios.');
                        return;
                      }

                      if (!compCep.trim() || !compStreet.trim() || !compNumber.trim() || !compCity.trim() || !compState.trim()) {
                        toast.error('Preencha as informações de endereço obrigatórias baseadas em um CEP válido.');
                        return;
                      }

                      setIsRegisteringCompany(true);
                      try {
                        const randomId = 'comp_' + Math.random().toString(36).substr(2, 9);
                        const assembledAddress = `${compStreet}, ${compNumber}${compComplement.trim() ? ` - ${compComplement.trim()}` : ''}, ${compNeighborhood}, ${compCity} - ${compState}`;

                        await companyService.create({
                          id: randomId,
                          name: compName.trim(),
                          category: (compCategory || availableCats[0]?.name || 'Restaurantes') as any,
                          phone: compPhone.trim(),
                          whatsapp: compPhone.trim(),
                          address: assembledAddress,
                          description: compDesc.trim(),
                          cnpj: compCnpj.trim(),
                          email: compEmail.trim(),
                          instagram: compInstagram.trim(),
                          website: compWebsite.trim(),
                          hours: compHours.trim(),
                          cep: compCep.trim(),
                          street: compStreet.trim(),
                          number: compNumber.trim(),
                          complement: compComplement.trim(),
                          neighborhood: compNeighborhood.trim(),
                          city: compCity.trim(),
                          state: compState.trim(),
                          userId: user.uid,
                          logo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=80',
                          status: 'active',
                          verified: true
                        });
                        
                        toast.success('Empresa Parceira cadastrada com sucesso!');
                        window.dispatchEvent(new Event('vapt_company_updated'));
                        fetchData();
                      } catch (err) {
                        toast.error('Erro ao efetuar cadastro da empresa.');
                      } finally {
                        setIsRegisteringCompany(false);
                      }
                    }} 
                    className="space-y-6 pt-4 border-t border-white/5 text-left"
                  >
                    {/* Seção 1: Identificação Comercial */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <Store size={14} className="text-brand-blue" />
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">1. Informações do Estabelecimento</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-white/30 tracking-widest pl-1">Nome Fantasia comercial *</label>
                          <input 
                            type="text"
                            required
                            value={compName}
                            onChange={(e) => setCompName(e.target.value)}
                            placeholder="Ex: Pizzaria Forno à Lenha"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-semibold focus:outline-none focus:border-brand-blue"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-white/30 tracking-widest pl-1">Canal / Categoria da Empresa *</label>
                          <select 
                            required
                            value={compCategory}
                            onChange={(e) => setCompCategory(e.target.value)}
                            className="w-full bg-[#161a22] border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-semibold focus:outline-none focus:border-brand-blue"
                          >
                            {availableCats.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-white/30 tracking-widest pl-1">CNPJ do Negócio comercial *</label>
                          <input 
                            type="text"
                            required
                            maxLength={18}
                            value={compCnpj}
                            onChange={(e) => setCompCnpj(formatCNPJ(e.target.value))}
                            placeholder="Ex: 00.000.000/0001-00"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-semibold focus:outline-none focus:border-brand-blue font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-white/30 tracking-widest pl-1">E-mail Comercial *</label>
                          <input 
                            type="email"
                            required
                            value={compEmail}
                            onChange={(e) => setCompEmail(e.target.value)}
                            placeholder="Ex: contato@pizzaria.com"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-semibold focus:outline-none focus:border-brand-blue"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[8px] font-black uppercase text-white/30 tracking-widest pl-1">WhatsApp Comercial de Contato *</label>
                          <input 
                            type="text"
                            required
                            maxLength={15}
                            value={compPhone}
                            onChange={(e) => setCompPhone(formatPhone(e.target.value))}
                            placeholder="Ex: (27) 99999-9999"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-semibold focus:outline-none focus:border-brand-blue"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Seção 2: Localização e CEP Inteligente */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <MapPin size={14} className="text-brand-orange" />
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">2. Endereço e Detecção por CEP</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5 relative">
                          <label className="text-[8px] font-black uppercase text-white/30 tracking-widest pl-1">CEP *</label>
                          <div className="relative">
                            <input 
                              type="text"
                              required
                              maxLength={9}
                              value={compCep}
                              onChange={(e) => {
                                const val = formatCEP(e.target.value);
                                setCompCep(val);
                                if (val.replace(/\D/g, '').length === 8) {
                                  fetchCepDetails(val);
                                }
                              }}
                              placeholder="00000-000"
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-white text-xs font-semibold focus:outline-none focus:border-brand-orange font-mono"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                              {isSearchingCep ? (
                                <div className="w-4 h-4 border-2 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
                              ) : (
                                <MapPin size={14} className="text-white/20" />
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => fetchCepDetails(compCep)}
                            disabled={compCep.replace(/\D/g, '').length !== 8 || isSearchingCep}
                            className="text-[9px] font-bold text-brand-orange uppercase tracking-wider hover:underline block mt-1 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                          >
                            Detectar pelo CEP
                          </button>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[8px] font-black uppercase text-white/30 tracking-widest pl-1">Rua / Logradouro *</label>
                          <input 
                            type="text"
                            required
                            value={compStreet}
                            onChange={(e) => setCompStreet(e.target.value)}
                            placeholder="Autocompletado ao digitar o CEP"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-semibold focus:outline-none focus:border-brand-blue"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-white/30 tracking-widest pl-1">Número *</label>
                          <input 
                            type="text"
                            required
                            value={compNumber}
                            onChange={(e) => setCompNumber(e.target.value)}
                            placeholder="Ex: 145"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-semibold focus:outline-none focus:border-brand-blue"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[8px] font-black uppercase text-white/30 tracking-widest pl-1">Complemento / Bloco</label>
                          <input 
                            type="text"
                            value={compComplement}
                            onChange={(e) => setCompComplement(e.target.value)}
                            placeholder="Ex: Sala 402 - Bloco B"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-semibold focus:outline-none focus:border-brand-blue"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-white/30 tracking-widest pl-1">Bairro *</label>
                          <input 
                            type="text"
                            required
                            value={compNeighborhood}
                            onChange={(e) => setCompNeighborhood(e.target.value)}
                            placeholder="Bairro"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-semibold focus:outline-none focus:border-brand-blue"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-white/30 tracking-widest pl-1">Cidade *</label>
                          <input 
                            type="text"
                            required
                            value={compCity}
                            onChange={(e) => setCompCity(e.target.value)}
                            placeholder="Cidade"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-semibold focus:outline-none focus:border-brand-blue"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-white/30 tracking-widest pl-1">Estado (UF) *</label>
                          <input 
                            type="text"
                            required
                            maxLength={2}
                            value={compState}
                            onChange={(e) => setCompState(e.target.value.toUpperCase())}
                            placeholder="Ex: SP"
                            className="w-full bg-[#161a22] border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-semibold focus:outline-none focus:border-brand-blue text-center uppercase font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Seção 3: Canais Digitais & Funcionamento */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <Clock size={14} className="text-teal-400" />
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">3. Funcionamento e Links Digitais</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-white/30 tracking-widest pl-1">Instagram do Negócio</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs font-semibold">@</span>
                            <input 
                              type="text"
                              value={compInstagram}
                              onChange={(e) => setCompInstagram(e.target.value.replace('@', ''))}
                              placeholder="pizzaria_lenha"
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-xs font-semibold focus:outline-none focus:border-brand-blue"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-white/30 tracking-widest pl-1">Website Oficial</label>
                          <input 
                            type="text"
                            value={compWebsite}
                            onChange={(e) => setCompWebsite(e.target.value)}
                            placeholder="Ex: www.pizzarialenha.com"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-semibold focus:outline-none focus:border-brand-blue"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-white/30 tracking-widest pl-1">Horário de Funcionamento</label>
                          <input 
                            type="text"
                            value={compHours}
                            onChange={(e) => setCompHours(e.target.value)}
                            placeholder="Ex: Ter a Dom: 18h às 23h"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-semibold focus:outline-none focus:border-brand-blue"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-[8px] font-black uppercase text-white/30 tracking-widest pl-1">Breve Descrição / Slogan do Estúdio *</label>
                      <textarea 
                        rows={3}
                        required
                        value={compDesc}
                        onChange={(e) => setCompDesc(e.target.value)}
                        placeholder="Ex: Fornecemos a melhor pizza artesanal da capital, com entrega super rápida e ingredientes selecionados do campo."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-semibold focus:outline-none focus:border-brand-blue resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={isRegisteringCompany}
                      className="w-full py-4 bg-brand-blue hover:bg-brand-blue/90 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] border-0 mt-4"
                    >
                      {isRegisteringCompany ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Validar Cadastro comercial no Vapt'
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="space-y-6 font-sans">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface-panel rounded-3xl border border-white/10 p-6 relative overflow-hidden text-left"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-white font-black uppercase tracking-tighter italic text-base flex items-center gap-2">
                      <Award className="text-amber-500" size={20} /> Seu Nível de Fidelidade
                    </h3>
                    <p className="text-white/40 text-[9px] uppercase font-bold tracking-widest mt-0.5">Economize mais para avançar sua conta</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black px-4 py-1.5 rounded-xl uppercase tracking-widest leading-none shrink-0 self-start sm:self-center">
                    Membro Titânio
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-white/50">
                    <span>Nível 3</span>
                    <span>2.855 / 4.000 XP</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full" style={{ width: '71.3%' }} />
                  </div>
                  <p className="text-[10px] text-white/30 leading-snug">
                     Você precisa de <span className="text-amber-500 font-bold">1.145 XP</span> para atingir o Nível 4 e desbloquear cupons com cashback real em carteiras digitais parceiras!
                  </p>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                {[
                  { title: 'Economia Acumulada', text: `R$ ${(userCoupons.length * 15 + 45).toLocaleString('pt-BR')},00`, desc: 'Baseado em cupons resgatados', icon: PiggyBank, color: 'text-brand-green bg-brand-green/10 border-brand-green/20' },
                  { title: 'Cupons Ativos', text: String(userCoupons.length), desc: 'Cupons de desconto salvos', icon: Ticket, color: 'text-brand-orange bg-brand-orange/10 border-brand-orange/20' },
                  { title: 'Favoritos', text: String(savedAds.length), desc: 'Produtos favoritados', icon: Bookmark, color: 'text-brand-blue bg-brand-blue/10 border-brand-blue/20' },
                  { title: 'Visitas Reais', text: String(formatNumber(engagementMetric)), desc: 'Métricas de visualização', icon: TrendingUp, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-surface-panel rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1 mb-3">
                      <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{item.title}</span>
                      <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border", item.color)}>
                        <item.icon size={12} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xl font-black text-white italic tracking-tighter leading-none">{item.text}</p>
                      <span className="text-[8px] text-white/20 font-bold uppercase tracking-wider block mt-1">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-surface-panel rounded-3xl border border-white/10 p-6 space-y-4 text-left">
                <h4 className="text-xs font-black uppercase text-white/40 tracking-[0.15em]">Conquistas de Engajamento ({[
                  userCoupons.length > 0,
                  true,
                  savedAds.length > 0,
                  userCompany !== null,
                  user?.role === 'admin'
                ].filter(Boolean).length} de 5)</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  {[
                    { title: 'Caçador de Descontos', desc: 'Resgatou seu primeiro desconto na plataforma.', level: 'Bronze', unlocked: userCoupons.length > 0, icon: Percent, color: 'text-brand-orange bg-brand-orange/10 border-brand-orange/20' },
                    { title: 'Navegante VIP', desc: 'Ativou sua conta premium exclusiva no Vapt.', level: 'Prata', unlocked: true, icon: Award, color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
                    { title: 'Guardião do Carrinho', desc: 'Salvou ao menos 1 item favorito no seu perfil de usuário.', level: 'Prata', unlocked: savedAds.length > 0, icon: Bookmark, color: 'text-brand-blue bg-brand-blue/10 border-brand-blue/20' },
                    { title: 'Iniciativa Comercial', desc: 'Criou ou cadastrou sua primeira loja/empresa parceira.', level: 'Ouro', unlocked: userCompany !== null, icon: Store, color: 'text-teal-400 bg-teal-400/10 border-teal-400/20' },
                    { title: 'Diretor Supremo', desc: 'Simulou o privilégio de Administrador do sistema.', level: 'Diamante', unlocked: user?.role === 'admin', icon: Shield, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
                  ].map((badge, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "p-4 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.01]",
                        badge.unlocked 
                          ? "bg-white/[0.02] border-white/10" 
                          : "bg-black/20 border-white/5 opacity-40 select-none"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-inner", badge.color)}>
                        <badge.icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-white font-bold text-xs truncate leading-snug">{badge.title}</h5>
                          {badge.unlocked ? (
                            <span className="bg-brand-green/20 text-brand-green text-[7px] font-black uppercase px-1.5 py-0.5 rounded leading-none shrink-0 font-sans">Desbloqueado</span>
                          ) : (
                            <span className="bg-white/10 text-white/30 text-[7px] font-black uppercase px-1.5 py-0.5 rounded leading-none shrink-0 font-sans">Bloqueado</span>
                          )}
                        </div>
                        <p className="text-[9px] text-white/40 leading-relaxed mt-0.5 truncate">{badge.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 font-sans text-center">
              <div className="flex items-center justify-between text-left mb-2">
                <div>
                  <h3 className="text-white font-black uppercase tracking-tighter italic text-base">Seu Histórico de Feed</h3>
                  <p className="text-white/40 text-[9px] uppercase font-bold tracking-widest mt-0.5">Os últimos vídeos que despertaram seu interesse comercial</p>
                </div>
                <button 
                  onClick={() => {
                    localStorage.removeItem('vapt_view_history');
                    setViewHistory([]);
                    toast.success('Histórico de visualização limpo!');
                  }}
                  className="text-[9px] font-bold text-[#f87171] hover:text-red-300 uppercase tracking-widest hover:underline transition-colors cursor-pointer border-0 bg-transparent"
                >
                  Limpar Histórico
                </button>
              </div>

              {viewHistory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left font-sans">
                  {viewHistory.map((ad, index) => (
                    <motion.div
                      key={ad.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-surface-panel rounded-3xl border border-white/5 overflow-hidden group hover:border-[#a855f7]/30 transition-all"
                    >
                      <div className="aspect-[16/10] relative">
                        <img referrerPolicy="no-referrer" src={ad.thumbnail} alt={ad.title} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                        <div className="absolute top-4 right-4">
                          <span className="bg-[#a855f7] text-white font-black text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg">
                            Assistido
                          </span>
                        </div>
                        <div className="absolute bottom-4 left-4">
                           <span className="bg-black/60 backdrop-blur-md text-[9px] font-black text-white px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">
                             {ad.category}
                           </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h4 className="text-white font-bold text-sm mb-1 line-clamp-1 leading-snug group-hover:text-[#a855f7] transition-colors">{ad.title}</h4>
                        <div className="flex justify-between items-center mt-3">
                          <p className="text-brand-green font-black tracking-tight text-xs">
                            {ad.price ? `R$ ${ad.price.toLocaleString('pt-BR')}` : 'Sob Consulta'}
                          </p>
                          <Link 
                            to={`/anuncio/${ad.id}`}
                            className="bg-white/5 hover:bg-[#a855f7]/10 hover:text-[#a855f7] text-white/50 text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all"
                          >
                            Reassistir
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-surface-panel rounded-3xl border border-white/10 p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
                  <History size={48} className="text-purple-400 mb-4 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">Sem Histórico de Feed</h3>
                  <p className="text-white/40 text-xs font-medium max-w-xs mb-8">Navegue pelas ofertas em formato Reels/Tiktok para salvar seu histórico de propagandas comerciais!</p>
                  <Link to="/" className="px-8 py-3 bg-purple-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all">
                    Ir para o Feed
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'affiliate' && (
            <div className="space-y-8 font-sans">
              <div>
                <h3 className="text-white font-black uppercase tracking-tighter italic text-base">Seu Painel de Afiliado</h3>
                <p className="text-white/40 text-[9px] uppercase font-bold tracking-widest mt-0.5">Indique empresas e fature bônus por cada venda realizada na plataforma!</p>
              </div>

              {/* Referral Link Card */}
              <div className="bg-surface-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 rounded-full -mr-16 -mt-16 blur-xl pointer-events-none" />
                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Share2 size={14} className="text-brand-orange animate-pulse" />
                  Seu Link de Indicação Exclusivo
                </h4>
                <p className="text-[10px] text-white/50 leading-relaxed mb-4">
                  Copie e envie este link para donos de empresas. Quando eles se cadastrarem na plataforma usando o seu link, a empresa deles ficará vinculada à sua conta de afiliado para sempre!
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-xs font-mono font-semibold flex items-center select-all overflow-x-auto whitespace-nowrap">
                    {`${window.location.origin}/#/afiliado/${user.uid}`}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/#/afiliado/${user.uid}`);
                      toast.success('Link de indicação copiado com sucesso!');
                    }}
                    className="px-6 py-3 bg-brand-orange hover:bg-brand-orange/90 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-brand-orange/15 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Copy size={14} />
                    Copiar Link
                  </button>
                </div>
              </div>

              {/* Financial Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#111317] p-6 rounded-2xl border border-white/5 shadow-xl">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Bônus Acumulado</p>
                  <p className="text-xl font-black text-white mt-2">
                    R$ {affiliateSales.reduce((acc, s) => acc + s.bonusValue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-[#111317] p-6 rounded-2xl border border-white/5 shadow-xl">
                  <p className="text-[10px] text-brand-green font-black uppercase tracking-widest">Bônus Recebido (Finalizado)</p>
                  <p className="text-xl font-black text-brand-green mt-2">
                    R$ {affiliateSales.filter(s => s.status === 'Finalizada').reduce((acc, s) => acc + s.bonusValue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-[#111317] p-6 rounded-2xl border border-white/5 shadow-xl">
                  <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Aguardando / Pendente</p>
                  <p className="text-xl font-black text-amber-500 mt-2">
                    R$ {affiliateSales.filter(s => s.status !== 'Finalizada').reduce((acc, s) => acc + s.bonusValue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Seção Pix e Saque de Bônus */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cadastro Chave Pix */}
                <div className="bg-surface-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between relative overflow-hidden">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                      <PiggyBank size={14} className="text-brand-orange animate-pulse" />
                      Configuração da Chave Pix
                    </h4>
                    <p className="text-[10px] text-white/50 leading-relaxed mb-4">
                      Cadastre sua chave Pix para receber os pagamentos dos seus bônus de indicação. Certifique-se de que a chave está correta antes de salvar.
                    </p>
                  </div>

                  <form onSubmit={handleSavePixKey} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-white/40 uppercase tracking-widest block">Chave Pix para Recebimento</label>
                      <input 
                        type="text"
                        value={pixKeyInput}
                        onChange={(e) => setPixKeyInput(e.target.value)}
                        placeholder="CPF, CNPJ, Email, Telefone ou Chave Aleatória"
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-xs font-bold focus:outline-none focus:border-brand-orange transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSavingPix}
                      className="w-full py-3 bg-brand-orange hover:bg-brand-orange/90 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-brand-orange/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      Salvar Chave Pix
                    </button>
                  </form>
                </div>

                {/* Solicitação de Saque */}
                <div className="bg-surface-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between relative overflow-hidden">
                  {(() => {
                    const availableBonus = affiliateSales
                      .filter(s => s.status === 'Finalizada' || s.status === 'Liberado para Saque')
                      .reduce((acc, s) => acc + s.bonusValue, 0);
                    const alreadyWithdrawn = withdrawRequests
                      .filter(w => w.status === 'Aprovado' || w.status === 'Pendente')
                      .reduce((acc, w) => acc + w.amount, 0);
                    const withdrawable = Math.max(0, availableBonus - alreadyWithdrawn);
                    const hasPixKey = !!user?.pixKey;

                    return (
                      <>
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                            <DollarSign size={14} className="text-brand-green" />
                            Solicitar Saque de Bônus
                          </h4>
                          <p className="text-[10px] text-white/50 leading-relaxed mb-4">
                            Disponível para saque: <strong className="text-brand-green">R$ {withdrawable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> (Bônus finalizados menos saques solicitados).
                          </p>
                          
                          {hasPixKey ? (
                            <div className="mb-4 p-3 bg-brand-green/5 border border-brand-green/10 rounded-xl flex items-center justify-between text-[10px]">
                              <span className="font-semibold uppercase tracking-wider text-[8px] text-white/40">Pix Cadastrado:</span>
                              <span className="font-mono font-bold text-brand-green">{user.pixKey}</span>
                            </div>
                          ) : (
                            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-amber-500 text-[10px] font-medium leading-normal">
                              <AlertCircle size={14} className="shrink-0 text-amber-500 animate-bounce" />
                              <span>Você precisa cadastrar uma Chave Pix ao lado antes de solicitar o saque.</span>
                            </div>
                          )}
                        </div>

                        <form onSubmit={handleRequestWithdraw} className="space-y-4">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[8px] font-black text-white/40 uppercase tracking-widest block">Valor do Saque (R$)</label>
                              {withdrawable > 0 && hasPixKey && (
                                <button
                                  type="button"
                                  onClick={() => setWithdrawAmountInput(withdrawable.toFixed(2))}
                                  className="text-[8px] font-black text-brand-green uppercase tracking-widest hover:underline cursor-pointer bg-transparent border-none p-0"
                                >
                                  Sacar valor máximo
                                </button>
                              )}
                            </div>
                            <input 
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={withdrawAmountInput}
                              onChange={(e) => setWithdrawAmountInput(e.target.value)}
                              placeholder="Ex: 50.00"
                              disabled={!hasPixKey || withdrawable <= 0}
                              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-xs font-mono font-bold focus:outline-none focus:border-brand-green transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isRequestingWithdraw || !hasPixKey || withdrawable <= 0}
                            className="w-full py-3 bg-brand-green text-black hover:bg-brand-green/90 disabled:hover:bg-brand-green disabled:opacity-50 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-brand-green/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                          >
                            {isRequestingWithdraw ? 'Processando...' : 'Solicitar Saque'}
                          </button>
                        </form>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Histórico de Solicitações de Saque */}
              {withdrawRequests.length > 0 && (
                <div className="bg-surface-panel p-6 rounded-3xl border border-white/10 space-y-4">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-3">
                    <Clock size={14} className="text-brand-orange animate-pulse" />
                    Histórico de Solicitações de Saque
                  </h4>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {withdrawRequests.map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                        <div className="space-y-0.5">
                          <span className="block font-bold text-xs text-white">R$ {req.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          <span className="block text-[8px] text-white/40 uppercase tracking-wider font-semibold">Chave Pix: {req.pixKey} • {safeFormatDate(req.createdAt)}</span>
                        </div>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                          req.status === 'Aprovado' ? "text-brand-green bg-brand-green/5 border border-brand-green/10" :
                          req.status === 'Recusado' ? "text-red-500 bg-red-500/5 border border-red-500/10" :
                          "text-amber-500 bg-amber-500/5 border border-amber-500/10"
                        )}>
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grid for Referred Users, Companies & Sales List */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Users Referred Section */}
                <div className="bg-surface-panel p-6 rounded-3xl border border-white/10 space-y-4">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-3">
                    <Users size={14} className="text-brand-orange animate-pulse" />
                    Usuários Indicados ({referredUsers.length})
                  </h4>

                  {referredUsers.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Nenhum usuário cadastrado ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {referredUsers.map((u) => (
                        <div key={u.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-white/60 shrink-0 uppercase border border-white/5">
                              {getInitials(u.displayName || 'U')}
                            </div>
                            <div>
                              <span className="block font-bold text-xs text-white line-clamp-1">{u.displayName}</span>
                              <span className="block text-[8px] text-white/40 uppercase tracking-wider font-semibold">Conta {u.role === 'empresa' ? 'Empresa' : 'Cliente'}</span>
                            </div>
                          </div>
                          <span className="text-[8px] text-white/30 font-mono font-semibold">{safeFormatDate(u.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Companies Referred Section */}
                <div className="bg-surface-panel p-6 rounded-3xl border border-white/10 space-y-4">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-3">
                    <Store size={14} className="text-brand-blue" />
                    Empresas Indicadas ({referredCompanies.length})
                  </h4>

                  {referredCompanies.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Nenhuma empresa cadastrada ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {referredCompanies.map((comp) => (
                        <div key={comp.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                          <div className="flex items-center gap-3">
                            <img src={comp.logo} alt={comp.name} className="w-8 h-8 rounded-lg object-cover bg-white/5 shrink-0" referrerPolicy="no-referrer" />
                            <div>
                              <span className="block font-bold text-xs text-white line-clamp-1">{comp.name}</span>
                              <span className="block text-[8px] text-white/40 uppercase tracking-wider font-semibold">{comp.address?.split('-')[1] || 'Endereço'}</span>
                            </div>
                          </div>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                            comp.status === 'active' ? "text-brand-green bg-brand-green/5 border border-brand-green/10" : "text-amber-500 bg-amber-500/5 border border-amber-500/10"
                          )}>
                            {comp.status === 'active' ? 'Ativo' : 'Pendente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sales list Section */}
                <div className="bg-surface-panel p-6 rounded-3xl border border-white/10 space-y-4">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-3">
                    <DollarSign size={14} className="text-brand-orange" />
                    Histórico de Comissões
                  </h4>

                  {affiliateSales.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Nenhum bônus ou comissão gerada ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {affiliateSales.map((sale) => (
                        <div key={sale.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="block font-bold text-xs text-white">{sale.companyName}</span>
                              <span className="block text-[8px] text-white/40 uppercase tracking-widest font-bold">Venda: R$ {sale.saleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="text-right">
                              <span className="block font-black text-xs text-brand-orange">R$ {sale.bonusValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              <span className="block text-[8px] text-white/30 font-bold">{sale.bonusPercent}% de taxa</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center border-t border-white/[0.02] pt-2">
                            <span className="text-[8px] text-white/30 font-semibold">{safeFormatDate(sale.createdAt)}</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                              sale.status === 'Finalizada' && "text-brand-green bg-brand-green/5 border border-brand-green/10",
                              sale.status === 'Aguardando Pagamento' && "text-amber-500 bg-amber-500/5 border border-amber-500/10",
                              sale.status === 'Pendente' && "text-red-400 bg-red-400/5 border border-red-400/10"
                            )}>
                              {sale.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-surface-panel p-6 sm:p-8 rounded-[2rem] border border-white/10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                      <Bell size={20} className="text-brand-orange" />
                      Minhas Atividades & Notificações
                    </h3>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                      Acompanhe cupons, mensagens, aprovações e novidades
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={async () => {
                        const loadId = toast.loading('Marcando como lidas...');
                        try {
                          await notificationService.markAllAsRead();
                          toast.success('Todas as notificações marcadas como lidas!', { id: loadId });
                        } catch {
                          toast.error('Erro ao marcar notificações.', { id: loadId });
                        }
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-white/5"
                    >
                      Marcar todas como lidas
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Tem certeza que deseja apagar todas as notificações?')) {
                          const loadId = toast.loading('Limpando notificações...');
                          try {
                            await notificationService.clearAll();
                            toast.success('Histórico de notificações limpo!', { id: loadId });
                          } catch {
                            toast.error('Erro ao limpar notificações.', { id: loadId });
                          }
                        }
                      }}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-red-500/10"
                    >
                      Limpar todas
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'all', label: 'Todas' },
                    { id: 'unread', label: 'Não lidas' },
                    { id: 'coupon', label: '⚡ Cupons' },
                    { id: 'approval', label: '✅ Aprovações' },
                    { id: 'chat', label: '💬 Conversas' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterType(tab.id as any)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                        filterType === tab.id
                          ? "bg-brand-orange text-white"
                          : "bg-white/5 text-white/40 hover:text-white"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Notifications List */}
                {notifications.filter(notif => {
                  if (filterType === 'all') return true;
                  if (filterType === 'unread') return notif.unread;
                  return notif.type === filterType;
                }).length === 0 ? (
                  <div className="py-12 text-center bg-white/[0.01] rounded-2xl border border-white/[0.02]">
                    <Bell className="mx-auto text-white/15 mb-3" size={32} />
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Nenhuma atividade encontrada</p>
                    <p className="text-[10px] text-white/20 mt-1">Você não tem notificações para esta categoria no momento.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications
                      .filter(notif => {
                        if (filterType === 'all') return true;
                        if (filterType === 'unread') return notif.unread;
                        return notif.type === filterType;
                      })
                      .map((notif, idx) => (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={async () => {
                            if (notif.unread) {
                              await notificationService.markAsRead(notif.id);
                            }
                          }}
                          className={cn(
                            "p-4 rounded-2xl border transition-all relative flex gap-4 cursor-pointer text-left",
                            notif.unread
                              ? "bg-brand-orange/[0.03] border-brand-orange/20 hover:bg-brand-orange/[0.06]"
                              : "bg-white/[0.01] border-white/5 hover:bg-white/[0.03]"
                          )}
                        >
                          {notif.unread && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-orange rounded-l-2xl" />
                          )}
                          
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            notif.unread ? "bg-brand-orange/10 text-brand-orange" : "bg-white/5 text-white/40"
                          )}>
                            {notif.type === 'coupon' ? <Ticket size={18} /> : 
                             notif.type === 'approval' ? <CheckCircle2 size={18} /> : 
                             <MessageSquare size={18} />}
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                              <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest shrink-0 flex items-center gap-1">
                                <Clock size={8} /> {formatRelativeTime(notif.createdAt)}
                              </span>
                            </div>
                            <p className="text-[10px] text-white/50 leading-relaxed font-sans">{notif.message}</p>
                            
                            {notif.unread && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await notificationService.markAsRead(notif.id);
                                  toast.success('Marcada como lida');
                                }}
                                className="text-[8px] font-bold text-brand-orange uppercase tracking-wider hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                              >
                                Marcar como lida
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className="bg-surface-panel border border-white/10 rounded-[2.5rem] w-full max-w-xl p-6 sm:p-8 relative z-10 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 rounded-full -mr-16 -mt-16 blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter font-sans">
                Editar Cadastro
              </h3>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-white/40 hover:text-white transition-colors text-xs font-black"
              >
                🗙
              </button>
            </div>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-6 font-sans">
              Mantenha seus dados pessoais e de entrega sempre atualizados
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!editName.trim()) {
                toast.error('O nome de exibição não pode estar em branco.');
                return;
              }
              const cleanCep = editCep.replace(/\D/g, '');
              const loadId = toast.loading('Salvando perfil...');
              try {
                await updateProfile({ 
                  displayName: editName.trim(),
                  phone: editPhone.trim(),
                  pixKey: editPixKey.trim(),
                  cep: cleanCep,
                  street: editStreet.trim(),
                  number: editNumber.trim(),
                  complement: editComplement.trim(),
                  neighborhood: editNeighborhood.trim(),
                  city: editCity.trim(),
                  state: editState.trim().toUpperCase()
                });
                
                // Update local storage so sidebar gets refreshed immediately
                if (editCity) {
                  const locName = `${editCity}, ${editState || 'SP'}`;
                  localStorage.setItem('vapt_user_location_name', locName);
                  if (cleanCep) localStorage.setItem('vapt_user_cep', cleanCep);
                  window.dispatchEvent(new Event('vapt_location_updated'));
                }
                
                toast.success('Perfil atualizado com sucesso!', { id: loadId });
                setIsEditModalOpen(false);
              } catch (err) {
                console.error(err);
                toast.error('Erro ao atualizar perfil.', { id: loadId });
              }
            }} className="space-y-5 font-sans">
              
              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1.5 pb-2 scrollbar-thin scrollbar-thumb-white/10">
                
                {/* 1. Dados Pessoais Section */}
                <div className="space-y-4">
                  <div className="text-brand-orange text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-1">
                    <UserIcon size={12} />
                    <span>1. Informações Pessoais</span>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5 pl-1">
                      Nome / Apelido de Exibição *
                    </label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-xs focus:outline-none focus:border-brand-orange/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                      placeholder="Ex: João Silva"
                      maxLength={40}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5 pl-1">
                        WhatsApp / Celular
                      </label>
                      <input 
                        type="text" 
                        value={editPhone}
                        onChange={(e) => setEditPhone(formatPhone(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono font-bold text-xs focus:outline-none focus:border-brand-orange/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5 pl-1">
                        Chave Pix (Para Reembolsos/Ganhos)
                      </label>
                      <input 
                        type="text" 
                        value={editPixKey}
                        onChange={(e) => setEditPixKey(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono font-bold text-xs focus:outline-none focus:border-brand-orange/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                        placeholder="CPF, E-mail, Celular ou Aleatória"
                        maxLength={100}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Endereço Section */}
                <div className="space-y-4 pt-2">
                  <div className="text-brand-orange text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-1">
                    <MapPin size={12} />
                    <span>2. Endereço e CEP Inteligente</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5 pl-1">
                        CEP *
                      </label>
                      <input 
                        type="text" 
                        value={editCep}
                        onChange={async (e) => {
                          const val = formatCEP(e.target.value);
                          setEditCep(val);
                          const clean = val.replace(/\D/g, '');
                          if (clean.length === 8) {
                            const loadToast = toast.loading('Consultando CEP...');
                            try {
                              const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
                              const data = await res.json();
                              if (data && !data.erro) {
                                setEditStreet(data.logradouro || '');
                                setEditNeighborhood(data.bairro || '');
                                setEditCity(data.localidade || '');
                                setEditState(data.uf || '');
                                toast.success(`Endereço carregado: ${data.localidade} - ${data.uf}`, { id: loadToast });
                              } else {
                                toast.error('CEP não encontrado.', { id: loadToast });
                              }
                            } catch {
                              toast.error('Erro de conexão ao consultar CEP.', { id: loadToast });
                            }
                          }
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono font-bold text-xs focus:outline-none focus:border-brand-orange/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                        placeholder="00000-000"
                        maxLength={9}
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5 pl-1">
                        Rua / Logradouro *
                      </label>
                      <input 
                        type="text" 
                        value={editStreet}
                        onChange={(e) => setEditStreet(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-xs focus:outline-none focus:border-brand-orange/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                        placeholder="Rua, Avenida, Praça..."
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5 pl-1">
                        Número *
                      </label>
                      <input 
                        type="text" 
                        value={editNumber}
                        onChange={(e) => setEditNumber(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-xs focus:outline-none focus:border-brand-orange/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                        placeholder="Número da residência"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5 pl-1">
                        Complemento
                      </label>
                      <input 
                        type="text" 
                        value={editComplement}
                        onChange={(e) => setEditComplement(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-xs focus:outline-none focus:border-brand-orange/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                        placeholder="Apto, Bloco, Fundos..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5 pl-1">
                        Bairro *
                      </label>
                      <input 
                        type="text" 
                        value={editNeighborhood}
                        onChange={(e) => setEditNeighborhood(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-xs focus:outline-none focus:border-brand-orange/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                        placeholder="Bairro"
                        required
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5 pl-1">
                        Cidade *
                      </label>
                      <input 
                        type="text" 
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-xs focus:outline-none focus:border-brand-orange/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                        placeholder="Cidade"
                        required
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5 pl-1">
                        UF *
                      </label>
                      <input 
                        type="text" 
                        value={editState}
                        onChange={(e) => setEditState(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-xs focus:outline-none focus:border-brand-orange/50 focus:bg-white/10 transition-all placeholder:text-white/20 text-center uppercase"
                        placeholder="UF"
                        maxLength={2}
                        required
                      />
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex gap-4 pt-2 border-t border-white/5">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 px-6 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 px-6 bg-brand-orange hover:bg-brand-orange/95 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-brand-orange/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <QrCodeModal 
        isOpen={selectedCoupon !== null}
        onClose={() => setSelectedCoupon(null)}
        code={selectedCoupon?.code || ''}
        discountValue={selectedCoupon?.discountValue || ''}
        description={selectedCoupon?.description || ''}
        companyName={selectedCoupon?.companyName || ''}
      />
    </div>
  );
}

function formatRelativeTime(milli: number): string {
  const diff = Date.now() - milli;
  const secs = Math.floor(diff / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (secs < 60) return 'Agora mesmo';
  if (mins < 60) return `Há ${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
  if (hours < 24) return `Há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  return `Há ${days} ${days === 1 ? 'dia' : 'dias'}`;
}
