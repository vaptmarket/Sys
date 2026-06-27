import React from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { adService, companyService, couponService } from '../services/mockFirebase';
import { Company, Ad, Coupon } from '../types';
import { useAuth } from '../hooks/useAuth';
import { 
  Instagram, 
  Globe, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle2,
  MessageCircle,
  Share2,
  Ticket,
  Copy,
  Check,
  Tag,
  Plus,
  Trash2,
  Settings,
  Save,
  Eye,
  EyeOff,
  Store,
  Calendar,
  DollarSign,
  TrendingUp,
  Heart
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

export default function CompanyProfile() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [company, setCompany] = React.useState<Company | null>(null);
  const [ads, setAds] = React.useState<Ad[]>([]);
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Management Mode States
  const [isManagementMode, setIsManagementMode] = React.useState(false);
  const [mgmtTab, setMgmtTab] = React.useState<'perfil' | 'cupons' | 'anuncios'>('perfil');
  const [allCompanyAds, setAllCompanyAds] = React.useState<Ad[]>([]);

  // Editing Company Profile fields
  const [compName, setCompName] = React.useState('');
  const [compDesc, setCompDesc] = React.useState('');
  const [compAddress, setCompAddress] = React.useState('');
  const [compPhone, setCompPhone] = React.useState('');
  const [compWhatsapp, setCompWhatsapp] = React.useState('');
  const [compHours, setCompHours] = React.useState('');
  const [compInstagram, setCompInstagram] = React.useState('');
  const [compWebsite, setCompWebsite] = React.useState('');
  const [compLogo, setCompLogo] = React.useState('');
  const [compCategory, setCompCategory] = React.useState('');
  const [compCnpj, setCompCnpj] = React.useState('');
  const [compCep, setCompCep] = React.useState('');
  const [compStreet, setCompStreet] = React.useState('');
  const [compNumber, setCompNumber] = React.useState('');
  const [compComplement, setCompComplement] = React.useState('');
  const [compNeighborhood, setCompNeighborhood] = React.useState('');
  const [compCity, setCompCity] = React.useState('');
  const [compState, setCompState] = React.useState('');
  const [compEmail, setCompEmail] = React.useState('');
  const [compUserId, setCompUserId] = React.useState('');
  const [compVerified, setCompVerified] = React.useState(false);
  const [compStatus, setCompStatus] = React.useState<'pending' | 'active' | 'rejected'>('active');
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);

  // New Coupon fields
  const [newCouponCode, setNewCouponCode] = React.useState('');
  const [newCouponDesc, setNewCouponDesc] = React.useState('');
  const [newCouponVal, setNewCouponVal] = React.useState('');
  const [newCouponExpiry, setNewCouponExpiry] = React.useState('');
  const [isCreatingCoupon, setIsCreatingCoupon] = React.useState(false);

  const hasManagementAccess = React.useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (company && (company.userId === user.uid || company.email === user.email)) return true;
    return false;
  }, [user, company]);

  const manageParam = searchParams.get('manage');

  React.useEffect(() => {
    if (manageParam === 'true' && hasManagementAccess) {
      setIsManagementMode(true);
    } else {
      setIsManagementMode(false);
    }
  }, [manageParam, hasManagementAccess]);

  React.useEffect(() => {
    if (company) {
      setCompName(company.name || '');
      setCompDesc(company.description || '');
      setCompAddress(company.address || '');
      setCompPhone(company.phone || '');
      setCompWhatsapp(company.whatsapp || '');
      setCompHours(company.hours || '');
      setCompInstagram(company.instagram || '');
      setCompWebsite(company.website || '');
      setCompLogo(company.logo || '');
      setCompCategory(company.category || 'Restaurantes');
      setCompCnpj(company.cnpj || '');
      setCompCep(company.cep || '');
      setCompStreet(company.street || '');
      setCompNumber(company.number || '');
      setCompComplement(company.complement || '');
      setCompNeighborhood(company.neighborhood || '');
      setCompCity(company.city || '');
      setCompState(company.state || '');
      setCompEmail(company.email || '');
      setCompUserId(company.userId || '');
      setCompVerified(!!company.verified);
      setCompStatus(company.status || 'active');
    }
  }, [company]);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const foundCompany = await companyService.getById(id);
      if (foundCompany) {
        setCompany(foundCompany);
        
        // Get all ads
        const allAds = await adService.getAll();
        const companyAllAds = allAds.filter(a => a.companyId === foundCompany.id);
        setAllCompanyAds(companyAllAds);
        
        // Active ads for public view
        const activeAds = companyAllAds.filter(a => a.status === 'active');
        setAds(activeAds);
        
        // Get coupons
        const allCoupons = await couponService.getAll();
        const companyCoupons = allCoupons.filter(c => c.companyId === foundCompany.id);
        setCoupons(companyCoupons);
      } else {
        setCompany(null);
        setAds([]);
        setCoupons([]);
        setAllCompanyAds([]);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do perfil da empresa:", error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [id]);

  const refreshCompanyData = async () => {
    if (!id) return;
    try {
      const foundCompany = await companyService.getById(id);
      if (foundCompany) {
        setCompany(foundCompany);
        
        const allAds = await adService.getAll();
        const companyAllAds = allAds.filter(a => a.companyId === foundCompany.id);
        setAllCompanyAds(companyAllAds);
        
        const activeAds = companyAllAds.filter(a => a.status === 'active');
        setAds(activeAds);
        
        const allCoupons = await couponService.getAll();
        const companyCoupons = allCoupons.filter(c => c.companyId === foundCompany.id);
        setCoupons(companyCoupons);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInstagramClick = () => {
    if (company && company.instagram) {
      const url = company.instagram.startsWith('http') 
        ? company.instagram 
        : `https://instagram.com/${company.instagram.replace('@', '')}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Esta empresa não cadastrou um perfil de Instagram.');
    }
  };

  const handleWebsiteClick = () => {
    if (company && company.website) {
      const url = company.website.startsWith('http') ? company.website : `https://${company.website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Esta empresa não cadastrou um endereço de site.');
    }
  };

  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.origin + `/empresa/${id}`);
    toast.success('Link do perfil copiado com sucesso!');
  };

  // Management Mode Actions
  const handleToggleAdStatus = async (adId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'rejected' : 'active';
    const loadId = toast.loading(nextStatus === 'active' ? 'Ativando anúncio...' : 'Desativando anúncio...');
    try {
      await adService.updateStatus(adId, nextStatus);
      await refreshCompanyData();
      toast.success(nextStatus === 'active' ? 'Anúncio ATIVADO no Feed!' : 'Anúncio DESATIVADO (Pausado)!', { id: loadId });
    } catch (err) {
      console.error('Error toggling ad status:', err);
      toast.error('Ocorreu um erro ao alterar status do anúncio.', { id: loadId });
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    if (!newCouponCode || !newCouponDesc || !newCouponVal || !newCouponExpiry) {
      toast.error('Todos os campos do cupom são obrigatórios!');
      return;
    }

    setIsCreatingCoupon(true);
    const loadId = toast.loading('Criando novo cupom...');
    try {
      await couponService.create({
        companyId: company.id,
        code: newCouponCode.trim().toUpperCase(),
        description: newCouponDesc.trim(),
        discountValue: newCouponVal.trim(),
        expiresAt: newCouponExpiry
      });

      setNewCouponCode('');
      setNewCouponDesc('');
      setNewCouponVal('');
      setNewCouponExpiry('');

      await refreshCompanyData();
      toast.success('Novo cupom de desconto ativado!', { id: loadId });
    } catch (err) {
      console.error('Error creating coupon:', err);
      toast.error('Falha ao registrar cupom de desconto.', { id: loadId });
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Deseja realmente remover este cupom de desconto de forma definitiva?')) return;
    const loadId = toast.loading('Excluindo cupom...');
    try {
      await couponService.delete(couponId);
      await refreshCompanyData();
      toast.success('Cupom de desconto removido!', { id: loadId });
    } catch (err) {
      console.error('Error deleting coupon:', err);
      toast.error('Erro ao remover o cupom.', { id: loadId });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    if (!compName.trim() || !compPhone.trim() || !compAddress.trim()) {
      toast.error('Nome da empresa, Telefone e Endereço são obrigatórios para a empresa!');
      return;
    }

    setIsSavingProfile(true);
    const loadId = toast.loading('Salvando alterações do perfil corporativo...');
    try {
      await companyService.create({
        ...company,
        name: compName.trim(),
        description: compDesc.trim(),
        address: compAddress.trim(),
        phone: compPhone.trim(),
        whatsapp: compWhatsapp.trim() || compPhone.trim(),
        hours: compHours.trim(),
        instagram: compInstagram.trim(),
        website: compWebsite.trim(),
        logo: compLogo.trim(),
        category: compCategory,
        cnpj: compCnpj.trim(),
        cep: compCep.trim(),
        street: compStreet.trim(),
        number: compNumber.trim(),
        complement: compComplement.trim(),
        neighborhood: compNeighborhood.trim(),
        city: compCity.trim(),
        state: compState.trim(),
        email: compEmail.trim(),
        userId: compUserId.trim(),
        verified: compVerified,
        status: compStatus
      });

      await refreshCompanyData();
      toast.success('Dados comerciais salvos com sucesso!', { id: loadId });
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Erro ao salvar as informações da empresa.', { id: loadId });
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-0 animate-pulse space-y-8">
        <div className="relative h-48 md:h-80 rounded-[2rem] md:rounded-[3rem] bg-white/10 mb-8 md:mb-12 shadow-2xl"></div>
        <div className="relative -mt-20 md:-mt-40 px-4 md:px-12 pb-8 md:pb-12 border-b border-white/5 flex flex-col md:flex-row items-end gap-6 md:gap-8">
          <div className="w-28 h-28 md:w-48 md:h-48 rounded-[1.5rem] md:rounded-[3rem] bg-white/10 shrink-0"></div>
          <div className="flex-1 space-y-3 pb-4">
            <div className="h-8 w-2/3 bg-white/10 rounded-lg"></div>
            <div className="h-4 w-1/2 bg-white/10 rounded-lg"></div>
            <div className="h-4 w-1/3 bg-white/10 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold text-white mb-4">Empresa não encontrada</h2>
        <Link to="/busca" className="text-brand-blue font-bold uppercase tracking-widest text-xs">Voltar para busca</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-1 md:px-0 font-sans">
      {/* ADMIN CONTROLS BANNER */}
      {hasManagementAccess && (
        <div className="relative z-20 bg-white/[0.02] border border-white/10 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 mb-6 text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0 border border-brand-orange/20">
              <Settings className="animate-spin-slow text-brand-orange" size={22} />
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">
                {user?.role === 'admin' ? 'Painel de Administrador Geral' : 'Painel de Gestor Comercial'}
              </h4>
              <p className="text-[10.5px] text-white/40 leading-snug">
                {user?.role === 'admin' 
                  ? 'Você possui acesso de Administrador do Vapt Market e pode alterar todos os dados desta empresa.'
                  : 'Você possui acesso de gestor comercial para gerenciar esta empresa parceira do Vapt Market.'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-[#111317] border border-white/5 rounded-2xl p-1 shrink-0 w-full md:w-auto">
            <button 
              type="button"
              onClick={() => setIsManagementMode(false)}
              className={cn(
                "flex-1 md:flex-initial px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer",
                !isManagementMode ? "bg-brand-blue text-white shadow-lg" : "text-white/40 hover:text-white"
              )}
            >
              Visualizar Perfil
            </button>
            <button 
              type="button"
              onClick={() => setIsManagementMode(true)}
              className={cn(
                "flex-1 md:flex-initial px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer",
                isManagementMode ? "bg-brand-orange text-white shadow-lg" : "text-white/40 hover:text-white"
              )}
            >
              Gerenciar Empresa
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative h-48 md:h-80 rounded-[2rem] md:rounded-[3rem] overflow-hidden mb-6 md:mb-8 shadow-2xl">
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80" 
          alt="Banner" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e12] via-transparent to-transparent" />
      </div>

      {!isManagementMode ? (
        <>
          {/* PUBLIC MODE VIEW */}
          <div className="relative z-10 -mt-20 md:-mt-40 px-4 md:px-12 pb-8 md:pb-12 border-b border-white/5">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
              <div className="w-28 h-28 md:w-48 md:h-48 rounded-[1.5rem] md:rounded-[3rem] border-[4px] md:border-[6px] border-[#0c0e12] overflow-hidden shadow-xl bg-white shrink-0">
                <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 pb-2 md:pb-4 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mb-2">
                  <h1 className="text-2xl md:text-5xl font-black font-display text-white">{company.name}</h1>
                  {company.verified && <CheckCircle2 className="text-brand-blue animate-pulse" size={22} md:size={28} fill="currentColor" />}
                </div>
                <p className="text-white/60 text-sm md:text-base font-medium max-w-xl line-clamp-3 md:line-clamp-none mx-auto md:mx-0 leading-relaxed">{company.description}</p>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 mt-4 md:mt-6">
                   <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full text-[10px] md:text-xs font-bold text-white/60">
                     <MapPin size={12} md:size={14} className="text-brand-blue" />
                     {company.address}
                   </div>
                   <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full text-[10px] md:text-xs font-bold text-white/60">
                     <Clock size={12} md:size={14} className="text-brand-orange" />
                     Aberto Agora: {company.hours || '24h'}
                   </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-auto pb-2 md:pb-4">
                <a 
                  href={`https://wa.me/${company.whatsapp || company.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 px-6 md:px-8 py-3.5 md:py-4 bg-brand-green text-white font-black uppercase tracking-widest text-[9px] md:text-[10px] rounded-xl md:rounded-2xl shadow-xl shadow-brand-green/20 hover:scale-[1.02] active:scale-95 transition-all text-center"
                >
                  <MessageCircle size={18} md:size={20} fill="white" />
                  WhatsApp Direto
                </a>
                <div className="flex gap-2 md:gap-3">
                  <button 
                    onClick={handleInstagramClick}
                    className="flex-1 h-10 md:h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-xl md:rounded-2xl transition-all cursor-pointer"
                    title="Instagram"
                  >
                    <Instagram size={18} md:size={20} />
                  </button>
                  <button 
                    onClick={handleWebsiteClick}
                    className="flex-1 h-10 md:h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-xl md:rounded-2xl transition-all cursor-pointer"
                    title="Website"
                  >
                    <Globe size={18} md:size={20} />
                  </button>
                  <button 
                    onClick={handleShareClick}
                    className="flex-1 h-10 md:h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-xl md:rounded-2xl transition-all cursor-pointer"
                    title="Compartilhar Perfil"
                  >
                    <Share2 size={18} md:size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Coupons Section */}
          <div className="mt-16">
            <div className="flex items-center gap-3 mb-8">
              <Ticket className="text-brand-orange" size={24} />
              <h2 className="text-xl md:text-2xl font-black font-display text-white italic uppercase tracking-tighter">Cupons de Desconto de {company.name}</h2>
            </div>

            {coupons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon) => (
                  <motion.div
                    key={coupon.id}
                    whileHover={{ y: -5 }}
                    className="bg-surface-panel border border-white/10 rounded-3xl p-6 relative overflow-hidden group text-left"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-orange" />
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="bg-brand-orange/10 text-brand-orange text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest mb-2 inline-block">
                          {coupon.discountValue} OFF
                        </span>
                        <h3 className="text-lg font-bold text-white leading-tight">{coupon.description}</h3>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl group-hover:border-brand-orange/30 transition-all">
                      <div>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Código</p>
                        <p className="text-xl font-black text-brand-orange tracking-widest font-mono">{coupon.code}</p>
                      </div>
                      <button 
                        onClick={() => handleCopyCode(coupon.id, coupon.code)}
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                          copiedId === coupon.id ? "bg-brand-green text-black" : "bg-brand-orange text-white hover:scale-110"
                        )}
                      >
                        {copiedId === coupon.id ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                      <Tag size={12} />
                      Expira em {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12 bg-white/[0.01] border border-white/5 rounded-3xl flex flex-col items-center justify-center text-center p-6">
                <Ticket className="text-white/10 mb-3 animate-pulse" size={44} />
                <p className="text-xs uppercase font-extrabold text-white/30 tracking-widest">Nenhum cupom listado no momento</p>
                <p className="text-[10px] text-white/20 mt-1">Crie cupons ativando o Modo Gestão acima de forma instantânea!</p>
              </div>
            )}
          </div>

          {/* Ads Grid */}
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-green animate-ping inline-block mr-1"></span>
                <h2 className="text-xl md:text-2xl font-black font-display text-white italic uppercase tracking-tighter">Vídeos Publicados (Feed)</h2>
              </div>
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4 py-1.5 bg-white/5 rounded-full">
                {ads.length} canais ativos
              </div>
            </div>

            {ads.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {ads.map((ad, index) => (
                  <motion.div 
                    key={ad.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative aspect-[9/16] rounded-[2rem] overflow-hidden shadow-xl text-left"
                  >
                    <img src={ad.thumbnail} alt={ad.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-all" />
                    
                    <div className="absolute top-4 right-4 bg-brand-blue text-white font-black text-[10px] px-3 py-1 rounded-full uppercase italic tracking-tighter shadow-lg">
                      ATIVO
                    </div>

                    <div className="absolute bottom-6 left-6 right-6">
                      <Link to={`/anuncio/${ad.id}`}>
                        <h3 className="text-white font-bold leading-tight line-clamp-2 md:text-lg mb-2 hover:text-brand-blue transition-colors">{ad.title}</h3>
                      </Link>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white/60 text-[10px] uppercase font-black">
                          <CheckCircle2 size={12} className="text-brand-blue" />
                          {ad.likes + 25} views
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/anuncio/${ad.id}`);
                            toast.success('Link do anúncio copiado com sucesso!');
                          }}
                          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all cursor-pointer"
                          title="Compartilhar Anúncio"
                        >
                          <Share2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-20 bg-white/[0.01] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-8">
                <Store className="text-white/10 mb-4 animate-pulse" size={54} />
                <p className="text-xs uppercase font-extrabold text-white/30 tracking-widest">Nenhum vídeo publicado de forma ativa</p>
                <p className="text-[10px] text-white/20 mt-1 max-w-xs leading-relaxed">Os vídeos vinculados a esta empresa estão desativados ou aguardando moderação ativa.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* PARTNER / MANAGEMENT MODE SCREEN */
        <div className="bg-[#111317] border border-white/5 rounded-[2.5rem] p-6 md:p-10 space-y-10 text-left">
          
          {/* TAB BAR FOR MANAGEMENT */}
          <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-6">
            <button
              onClick={() => setMgmtTab('perfil')}
              className={cn(
                "px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2",
                mgmtTab === 'perfil' 
                  ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/10" 
                  : "bg-white/5 text-white/40 hover:text-white"
              )}
            >
              <Store size={14} /> Dados da Empresa
            </button>
            <button
              onClick={() => setMgmtTab('cupons')}
              className={cn(
                "px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2",
                mgmtTab === 'cupons' 
                  ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/10" 
                  : "bg-white/5 text-white/40 hover:text-white"
              )}
            >
              <Ticket size={14} /> Cupom de Desconto ({coupons.length})
            </button>
            <button
              onClick={() => setMgmtTab('anuncios')}
              className={cn(
                "px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2",
                mgmtTab === 'anuncios' 
                  ? "bg-[#6a3fdb] text-white shadow-lg" 
                  : "bg-white/5 text-white/40 hover:text-white"
              )}
            >
              <Eye size={14} /> Ativar/Desativar Vídeos ({allCompanyAds.length})
            </button>
          </div>

          {/* TAB 1: EDIT PROFILE */}
          {mgmtTab === 'perfil' && (
            <form onSubmit={handleSaveProfile} className="space-y-8 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <Store className="text-brand-blue" size={24} />
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Configuração do Perfil Corporativo</h3>
                  <p className="text-[10.5px] text-white/40 font-medium">As alterações feitas abaixo serão refletidas de imediato na página de visualização pública da empresa.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Nome do Estabelecimento *</label>
                  <input 
                    type="text" 
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    required
                    disabled={isSavingProfile}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all"
                  />
                </div>

                {/* Categoria */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest font-sans">Segmento / Categoria *</label>
                  <select 
                    value={compCategory}
                    onChange={(e) => setCompCategory(e.target.value)}
                    disabled={isSavingProfile}
                    className="w-full bg-[#1e2024] border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all appearance-none"
                  >
                    {['Restaurantes', 'Pousadas', 'Hotéis', 'Veículos', 'Imóveis', 'Moda', 'Eletrônicos', 'Serviços', 'Mercado', 'Construção', 'Turismo', 'Promoções', 'Eventos', 'Delivery', 'Produtos Usados'].map((cat) => (
                      <option key={cat} value={cat} className="bg-[#111317]">{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Descrição */}
                <div className="space-y-2.5 md:col-span-2">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Breve descrição institucional</label>
                  <textarea 
                    value={compDesc}
                    onChange={(e) => setCompDesc(e.target.value)}
                    rows={4}
                    disabled={isSavingProfile}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-semibold focus:outline-none focus:border-brand-blue transition-all max-h-36"
                  />
                </div>

                {/* Telefone */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Telefone de Contato *</label>
                  <input 
                    type="text" 
                    value={compPhone}
                    onChange={(e) => setCompPhone(e.target.value)}
                    required
                    disabled={isSavingProfile}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">WhatsApp Comercial (Link DDI)</label>
                  <input 
                    type="text" 
                    value={compWhatsapp}
                    onChange={(e) => setCompWhatsapp(e.target.value)}
                    placeholder="Ex: 5511999998888"
                    disabled={isSavingProfile}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all"
                  />
                </div>

                {/* Endereço */}
                <div className="space-y-2.5 md:col-span-2">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Endereço Comercial Completo *</label>
                  <input 
                    type="text" 
                    value={compAddress}
                    onChange={(e) => setCompAddress(e.target.value)}
                    required
                    disabled={isSavingProfile}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all"
                  />
                </div>

                {/* Hours */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Horário de Funcionamento</label>
                  <input 
                    type="text" 
                    value={compHours}
                    onChange={(e) => setCompHours(e.target.value)}
                    placeholder="Ex: Seg a Sex das 8h às 18h"
                    disabled={isSavingProfile}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all"
                  />
                </div>

                {/* Logo URL */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Link da Imagem da Logomarca (URL)</label>
                  <input 
                    type="url" 
                    value={compLogo}
                    onChange={(e) => setCompLogo(e.target.value)}
                    disabled={isSavingProfile}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all"
                  />
                </div>

                {/* Instagram */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Usuário Instagram (@)</label>
                  <input 
                    type="text" 
                    value={compInstagram}
                    onChange={(e) => setCompInstagram(e.target.value)}
                    placeholder="Ex: seu_comercio"
                    disabled={isSavingProfile}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all"
                  />
                </div>

                {/* Website */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Endereço do Site (Website)</label>
                  <input 
                    type="text" 
                    value={compWebsite}
                    onChange={(e) => setCompWebsite(e.target.value)}
                    placeholder="Ex: www.suaempresa.com.br"
                    disabled={isSavingProfile}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all"
                  />
                </div>

                {/* CNPJ */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">CNPJ da Empresa</label>
                  <input 
                    type="text" 
                    value={compCnpj}
                    onChange={(e) => setCompCnpj(e.target.value)}
                    placeholder="Ex: 00.000.000/0001-00"
                    disabled={isSavingProfile}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all"
                  />
                </div>

                {/* CEP */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">CEP Comercial</label>
                  <input 
                    type="text" 
                    value={compCep}
                    onChange={(e) => setCompCep(e.target.value)}
                    placeholder="Ex: 11600-000"
                    disabled={isSavingProfile}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all"
                  />
                </div>

                {/* Street */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Rua / Logradouro</label>
                  <input 
                    type="text" 
                    value={compStreet}
                    onChange={(e) => setCompStreet(e.target.value)}
                    placeholder="Ex: Av. Dr. Francisco Loup"
                    disabled={isSavingProfile}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all"
                  />
                </div>

                {/* Number */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Número</label>
                  <input 
                    type="text" 
                    value={compNumber}
                    onChange={(e) => setCompNumber(e.target.value)}
                    placeholder="Ex: 1250"
                    disabled={isSavingProfile}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all"
                  />
                </div>

                {/* Bairro */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Bairro</label>
                  <input 
                    type="text" 
                    value={compNeighborhood}
                    onChange={(e) => setCompNeighborhood(e.target.value)}
                    placeholder="Ex: Maresias"
                    disabled={isSavingProfile}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all"
                  />
                </div>

                {/* Complement */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Complemento</label>
                  <input 
                    type="text" 
                    value={compComplement}
                    onChange={(e) => setCompComplement(e.target.value)}
                    placeholder="Ex: Bloco B / Sala 4"
                    disabled={isSavingProfile}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all"
                  />
                </div>

                {/* City */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Cidade</label>
                  <input 
                    type="text" 
                    value={compCity}
                    onChange={(e) => setCompCity(e.target.value)}
                    placeholder="Ex: São Sebastião"
                    disabled={isSavingProfile}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all"
                  />
                </div>

                {/* State */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Estado (UF)</label>
                  <input 
                    type="text" 
                    value={compState}
                    onChange={(e) => setCompState(e.target.value)}
                    placeholder="Ex: SP"
                    maxLength={2}
                    disabled={isSavingProfile}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all uppercase"
                  />
                </div>

                {/* Verification & Status toggles (Only visible to admin users) */}
                {user?.role === 'admin' && (
                  <>
                    <div className="space-y-2.5">
                      <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Email do Proprietário (Admin)</label>
                      <input 
                        type="email" 
                        value={compEmail}
                        onChange={(e) => setCompEmail(e.target.value)}
                        placeholder="Ex: joao@exemplo.com"
                        disabled={isSavingProfile}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">ID de Usuário Proprietário (Admin)</label>
                      <input 
                        type="text" 
                        value={compUserId}
                        onChange={(e) => setCompUserId(e.target.value)}
                        placeholder="ID único do usuário"
                        disabled={isSavingProfile}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Status da Parceria (Admin)</label>
                      <select 
                        value={compStatus}
                        onChange={(e) => setCompStatus(e.target.value as 'pending' | 'active' | 'rejected')}
                        disabled={isSavingProfile}
                        className="w-full bg-[#1e2024] border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold focus:outline-none focus:border-brand-blue transition-all appearance-none"
                      >
                        <option value="active">Ativo / Aprovado</option>
                        <option value="pending">Pendente de Aprovação</option>
                        <option value="rejected">Rejeitado / Suspenso</option>
                      </select>
                    </div>

                    <div className="space-y-2.5 flex flex-col justify-center">
                      <span className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Selo Verificado (Admin)</span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={compVerified} 
                          onChange={(e) => setCompVerified(e.target.checked)}
                          disabled={isSavingProfile}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/15 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                        <span className="ml-3 text-xs font-bold text-white/60">Selo Ativado</span>
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 h-14 px-8 bg-brand-blue hover:bg-brand-blue/90 text-white font-black uppercase text-xs rounded-2xl transition-all shadow-xl shadow-brand-blue/20 cursor-pointer disabled:opacity-50"
                >
                  <Save size={16} />
                  Salvar Perfil Comercial
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: COUPON MANAGEMENT */}
          {mgmtTab === 'cupons' && (
            <div className="space-y-10 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Coupon creation form */}
                <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-2">
                    <Plus className="text-brand-orange" size={20} />
                    <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Criar Novo Cupom</h4>
                  </div>
                  
                  <form onSubmit={handleCreateCoupon} className="space-y-5">
                    {/* Código */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest">Código do Cupom *</label>
                      <input 
                        type="text" 
                        value={newCouponCode}
                        onChange={(e) => setNewCouponCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                        placeholder="Ex: VAPT30"
                        required
                        disabled={isCreatingCoupon}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-xs font-bold focus:outline-none focus:border-brand-orange transition-all font-mono tracking-widest"
                      />
                    </div>

                    {/* Descrição */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest">Descrição do Desconto *</label>
                      <input 
                        type="text" 
                        value={newCouponDesc}
                        onChange={(e) => setNewCouponDesc(e.target.value)}
                        placeholder="Ex: 30% de desconto na primeira compra"
                        required
                        disabled={isCreatingCoupon}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-xs font-semibold focus:outline-none focus:border-brand-orange transition-all"
                      />
                    </div>

                    {/* Valor desc */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest">Valor Reduzido / OFF *</label>
                      <input 
                        type="text" 
                        value={newCouponVal}
                        onChange={(e) => setNewCouponVal(e.target.value)}
                        placeholder="Ex: 30% ou R$ 50"
                        required
                        disabled={isCreatingCoupon}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-xs font-bold focus:outline-none focus:border-brand-orange transition-all"
                      />
                    </div>

                    {/* Expira data */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest">Data Máxima de Expiração *</label>
                      <input 
                        type="date" 
                        value={newCouponExpiry}
                        onChange={(e) => setNewCouponExpiry(e.target.value)}
                        required
                        disabled={isCreatingCoupon}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-xs font-bold focus:outline-none focus:border-brand-orange transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isCreatingCoupon}
                      className="w-full flex items-center justify-center gap-2 h-12 bg-brand-orange hover:bg-brand-orange/90 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Plus size={14} /> Ativar Cupom de Desconto
                    </button>
                  </form>
                </div>

                {/* Coupon list */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center gap-2">
                    <Ticket className="text-brand-orange animate-bounce" size={20} />
                    <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Cupons Emitidos Ativos ({coupons.length})</h4>
                  </div>

                  {coupons.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {coupons.map((coupon) => (
                        <div key={coupon.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-1 h-full bg-brand-orange" />
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs bg-brand-orange/15 text-brand-orange font-black px-2 py-0.5 rounded font-mono uppercase">
                                {coupon.discountValue} OFF
                              </span>
                              <h5 className="text-white font-bold text-sm leading-tight mt-2">{coupon.description}</h5>
                              <p className="text-[14px] text-brand-orange font-black font-mono tracking-widest mt-1.5">{coupon.code}</p>
                              
                              <div className="flex gap-4 text-[9px] text-white/30 font-bold uppercase tracking-widest mt-4">
                                <span className="flex items-center gap-1"><Calendar size={10} /> Expira: {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}</span>
                                <span className="flex items-center gap-1"><CheckCircle2 size={10} /> {coupon.usedCount || 0} resgates</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              className="text-white/30 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-all cursor-pointer border-0"
                              title="Remover Cupom de Desconto"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 bg-white/[0.01] border border-white/5 rounded-3xl flex flex-col items-center justify-center text-center p-6">
                      <Ticket size={36} className="text-white/10 mb-2" />
                      <p className="text-[10px] uppercase font-black tracking-widest text-white/30">Nenhum cupom ativo cadastrado</p>
                      <p className="text-[9px] text-white/20 mt-1 max-w-xs leading-normal">Utilize o formulário para lançar cupons de desconto instantâneos e atrair mais clientes!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VIDEOS & ADS STATE TOGGLE */}
          {mgmtTab === 'anuncios' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                  <Eye className="text-[#6a3fdb]" /> Controle de Vídeos do Feed
                </h3>
                <p className="text-[10.5px] text-white/40 leading-normal mt-1">
                  Ative ou desative conteúdos curtos associados à sua marca. Anúncios desativados serão ocultados de imediato no Feed Geral de vídeos e nas buscas de usuários.
                </p>
              </div>

              {allCompanyAds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allCompanyAds.map((ad) => {
                    const isActive = ad.status === 'active';
                    return (
                      <div 
                        key={ad.id} 
                        className={cn(
                          "bg-white/[0.01] border rounded-[2rem] p-5 flex flex-col justify-between gap-5 transition-all",
                          isActive ? "border-white/10" : "border-white/5 opacity-75"
                        )}
                      >
                        <div className="flex gap-4 items-center">
                          <div className="w-18 h-24 rounded-2xl overflow-hidden shrink-0 bg-white/5 relative">
                            <img referrerPolicy="no-referrer" src={ad.thumbnail} className="w-full h-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center font-mono text-[8.5px] font-bold text-white uppercase">
                              {ad.category}
                            </div>
                          </div>
                          
                          <div className="text-left flex-1 min-w-0">
                            <h4 className="text-white font-bold text-xs leading-snug line-clamp-2">{ad.title}</h4>
                            <p className="text-brand-green font-black text-[12px] mt-1">
                              {ad.price ? `R$ ${ad.price.toLocaleString('pt', {minimumFractionDigits: 2})}` : 'Grátis'}
                            </p>
                            
                            <div className="flex items-center gap-3 mt-3 text-[9px] font-bold uppercase tracking-widest text-white/30">
                              <span className="flex items-center gap-1"><TrendingUp size={10} /> {ad.views || 0} views</span>
                              <span className="flex items-center gap-1"><Heart size={10} /> {ad.saved || 0} saves</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              isActive ? "bg-brand-green animate-pulse" : "bg-white/10"
                            )} />
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-wider",
                              isActive ? "text-brand-green" : "text-white/30"
                            )}>
                              {isActive ? "Ad Ativo no Feed" : "Ad Pausado/Oculto"}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleAdStatus(ad.id, ad.status)}
                            className={cn(
                              "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border-0",
                              isActive 
                                ? "bg-red-500/10 hover:bg-red-500/20 text-red-400" 
                                : "bg-brand-green/10 hover:bg-brand-green/20 text-brand-green"
                            )}
                          >
                            {isActive ? (
                              <>
                                <EyeOff size={11} /> Desativar
                              </>
                            ) : (
                              <>
                                <Eye size={11} /> Ativar no Feed
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-24 bg-white/[0.01] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-8">
                  <Settings className="text-white/10 mb-4 animate-spin-slow" size={48} />
                  <p className="text-xs uppercase font-extrabold text-white/30 tracking-widest">Nenhum anúncio criado para gerenciar</p>
                  <p className="text-[10px] text-white/20 mt-1 max-w-xs leading-relaxed">Publique ofertas e anúncios de vídeo feed curto na aba "Quero Anunciar" para associá-los de imediato!</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
