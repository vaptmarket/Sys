import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { adService, companyService, couponService } from '../services/mockFirebase';
import { Ad, Company, Coupon } from '../types';
import { 
  MessageCircle, 
  MapPin, 
  Share2, 
  Heart, 
  Bookmark, 
  ChevronLeft, 
  ExternalLink,
  Store,
  Clock,
  ShieldCheck,
  Play,
  Ticket
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { cn } from '../lib/utils';
import ShareModal from '../components/ShareModal';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';

// Fix for Leaflet icon
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function AdDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [ad, setAd] = React.useState<Ad | null>(null);
  const [company, setCompany] = React.useState<Company | null>(null);
  const [relatedAds, setRelatedAds] = React.useState<Ad[]>([]);
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [redeemedIds, setRedeemedIds] = React.useState<string[]>([]);
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRedeeming, setIsRedeeming] = React.useState<string | null>(null);
  const [isLiked, setIsLiked] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [activeLightboxIndex, setActiveLightboxIndex] = React.useState<number | null>(null);

  // Sync like status from localStorage
  React.useEffect(() => {
    try {
      const likedAds = JSON.parse(localStorage.getItem('vapt_liked_ads') || '[]');
      if (id && likedAds.includes(id)) {
        setIsLiked(true);
      }
    } catch {
      // Ignore fallback
    }
  }, [id]);

  // Main ad data fetching
  React.useEffect(() => {
    let active = true;
    async function loadData() {
      if (!id) return;
      setIsLoading(true);
      try {
        const foundAd = await adService.getById(id);
        if (!active) return;
        if (foundAd) {
          setAd(foundAd);
          // Increment views
          await adService.incrementViews(foundAd.id);
          
          const foundCompany = await companyService.getById(foundAd.companyId);
          if (!active) return;
          if (foundCompany) {
            setCompany(foundCompany);
          }
          
          // Get related ads
          const allAds = await adService.getAll();
          if (!active) return;
          const related = allAds
            .filter(a => a.id !== id && a.category === foundAd.category && a.status === 'active')
            .slice(0, 3);
          setRelatedAds(related);

          // Get coupons of this company
          try {
            const allCoupons = await couponService.getAll();
            const filteredCoupons = allCoupons.filter(c => c.companyId === foundAd.companyId);
            if (active) {
              setCoupons(filteredCoupons);
            }
          } catch (err) {
            console.warn("Nenhum cupom carregado para este parceiro", err);
          }
        } else {
          setAd(null);
          setCompany(null);
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes do anúncio:", error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [id]);

  // Fetch Saved and Redeemed Statuses when user is logged in
  React.useEffect(() => {
    if (!user || !ad) {
      setRedeemedIds([]);
      setIsSaved(false);
      return;
    }

    let active = true;
    async function fetchUserStates() {
      try {
        const isSavedFirebase = await adService.isAdSaved(user.uid, ad.id);
        if (!active) return;
        setIsSaved(isSavedFirebase);

        const userCoupons = await couponService.getUserCoupons(user.uid);
        if (!active) return;
        setRedeemedIds(userCoupons.map(uc => uc.couponId));
      } catch (err) {
        console.error("Erro ao carregar estados de usuário:", err);
      }
    }

    fetchUserStates();
    return () => {
      active = false;
    };
  }, [user, ad]);

  const handleToggleLike = async () => {
    if (!ad) return;
    try {
      const nextLiked = !isLiked;
      setIsLiked(nextLiked);
      
      // Update local storage
      const likedAds = JSON.parse(localStorage.getItem('vapt_liked_ads') || '[]');
      if (nextLiked) {
        if (!likedAds.includes(ad.id)) {
          likedAds.push(ad.id);
        }
      } else {
        const idx = likedAds.indexOf(ad.id);
        if (idx > -1) {
          likedAds.splice(idx, 1);
        }
      }
      localStorage.setItem('vapt_liked_ads', JSON.stringify(likedAds));

      // Update in Firebase / Local Counter
      await adService.updateLikes(ad.id, nextLiked ? 1 : -1);
      setAd(prev => prev ? { ...prev, likes: Math.max(0, prev.likes + (nextLiked ? 1 : -1)) } : null);
      
      if (nextLiked) {
        toast.success("Obrigado pelo feedback! Você curtiu o anúncio.", { icon: '❤️' });
      } else {
        toast("Curtida removida com sucesso.", { icon: '💔' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSave = async () => {
    if (!ad) return;
    if (!user) {
      toast.error("Por favor, faça login para salvar anúncios nos seus favoritos.");
      return;
    }
    
    try {
      const saved = await adService.toggleSave(user.uid, ad.id);
      setIsSaved(saved);
      if (saved) {
        toast.success("Anúncio salvo nos favoritos! Acesse-o no seu perfil.", { icon: '⭐' });
      } else {
        toast("Anúncio removido dos favoritos.", { icon: '🗑️' });
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar favoritos.");
    }
  };

  const handleRedeem = async (coupon: Coupon) => {
    if (!user) {
      toast.error("Por favor, faça login ou crie uma conta para resgatar cupons.");
      return;
    }

    setIsRedeeming(coupon.id);
    try {
      const redeemed = await couponService.redeem(user.uid, coupon.id);
      if (redeemed) {
        setRedeemedIds(prev => [...prev, coupon.id]);
        toast.success(`Cupom ${coupon.code} resgatado! Veja no seu perfil.`, { icon: '🎫' });
      } else {
        toast.error("Erro ao resgatar cupom. Tente novamente.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Falha ao se conectar. Tente novamente.");
    } finally {
      setIsRedeeming(null);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-0 animate-pulse space-y-8">
        <div className="flex items-center justify-between">
          <div className="h-6 w-20 bg-white/10 rounded-lg"></div>
          <div className="flex gap-4">
            <div className="h-10 w-10 bg-white/10 rounded-full"></div>
            <div className="h-10 w-10 bg-white/10 rounded-full"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video bg-white/10 rounded-2xl md:rounded-[2.5rem]"></div>
            <div className="bg-surface-panel p-6 md:p-12 rounded-2xl md:rounded-[2.5rem] space-y-6 border border-white/10">
              <div className="h-6 w-32 bg-white/10 rounded-lg"></div>
              <div className="h-12 w-3/4 bg-white/10 rounded-lg"></div>
              <div className="h-8 w-1/4 bg-white/10 rounded-lg"></div>
              <div className="space-y-3 pt-6 border-t border-white/5">
                <div className="h-4 bg-white/10 rounded w-full"></div>
                <div className="h-4 bg-white/10 rounded w-5/6"></div>
                <div className="h-4 bg-white/10 rounded w-4/6"></div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-surface-panel p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-white/10 space-y-6 flex flex-col items-center">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/10"></div>
              <div className="h-6 w-32 bg-white/10 rounded-lg"></div>
              <div className="h-4 w-48 bg-white/10 rounded-lg"></div>
              <div className="h-12 w-full bg-white/10 rounded-xl mt-4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ad || !company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold text-white mb-4">Anúncio não encontrado</h2>
        <Link to="/busca" className="text-brand-blue font-bold uppercase tracking-widest text-xs">Voltar para busca</Link>
      </div>
    );
  }

  const galleryImages = [ad.thumbnail, ...(ad.images || [])];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-0">
      {/* Header / Breadcrumb */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <Link to="/busca" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Voltar para a busca</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={() => setShowShareModal(true)}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all border border-white/5 hover:border-white/10"
            title="Compartilhar"
          >
            <Share2 size={16} md:size={18} />
          </button>
          
          <button 
            onClick={handleToggleSave}
            className={cn(
              "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all border",
              isSaved 
                ? "bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/10" 
                : "bg-white/5 text-white border-white/5 hover:bg-white/10 hover:border-white/10"
            )}
            title={isSaved ? "Salvo nos favoritos" : "Salvar nos favoritos"}
          >
            <Bookmark size={16} md:size={18} fill={isSaved ? "currentColor" : "none"} />
          </button>

          <button 
            onClick={handleToggleLike}
            className={cn(
              "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all border",
              isLiked 
                ? "bg-brand-orange text-white border-brand-orange shadow-lg shadow-brand-orange/10" 
                : "bg-white/5 text-white border-white/5 hover:bg-white/10 hover:border-white/10"
            )}
            title={isLiked ? "Curtido" : "Curtir"}
          >
            <Heart size={16} md:size={18} fill={isLiked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6 md:space-y-12">
          {/* Video Section */}
          <div className="relative aspect-video rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-black group">
            <iframe 
              src={ad.videoUrl}
              className="w-full h-full border-0"
              title={ad.title}
              allow="autoplay; encrypted-media"
            />
            <div className="absolute top-4 left-4 md:top-6 md:left-6 pointer-events-none">
              <span className="bg-brand-blue/80 backdrop-blur-md text-[8px] md:text-[10px] font-black px-2 py-1 md:px-3 md:py-1.5 rounded-lg uppercase tracking-widest text-white shadow-xl">
                 Vídeo Comercial Oficial
              </span>
            </div>
          </div>

          {/* Description, Gallery & Coupons */}
          <div className="space-y-6 md:space-y-8 bg-surface-panel p-5 md:p-12 rounded-2xl md:rounded-[2.5rem] border border-white/10">
            <div>
               <div className="flex items-center gap-2 mb-4">
                  <span className="bg-brand-orange/10 text-brand-orange text-[9px] md:text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                    {ad.category}
                  </span>
                  <span className="text-white/20 text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Clock size={10} md:size={12} /> Postado recentemente
                  </span>
               </div>
               <h1 className="text-2xl md:text-5xl font-black font-display text-white italic uppercase tracking-tighter leading-tight md:leading-none mb-4 md:mb-6">
                 {ad.title}
               </h1>
               <div className="flex items-center justify-between pb-6 md:pb-8 border-b border-white/5 flex-wrap gap-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl md:text-4xl font-black text-brand-green tracking-tighter">
                      {ad.price ? `R$ ${ad.price.toLocaleString('pt-BR')}` : 'Sob Consulta'}
                    </span>
                    {ad.installments && (
                      <span className="text-white/30 text-[9px] md:text-xs font-bold uppercase">{ad.installments}</span>
                    )}
                  </div>
                  
                  {ad.likes > 0 && (
                    <div className="flex items-center gap-1 text-white/30 text-xs font-bold uppercase tracking-widest bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-lg">
                      <Heart size={12} fill="currentColor" className="text-brand-orange" /> {ad.likes} {ad.likes === 1 ? 'Curtida' : 'Curtidas'}
                    </div>
                  )}
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-base md:text-lg font-black text-white uppercase tracking-tight">
                 Sobre este Anúncio
               </h3>
               <p className="text-white/60 leading-relaxed text-sm md:text-base font-medium whitespace-pre-line">
                 {ad.description || 'Nenhuma descrição detalhada fornecida para este anúncio.'}
               </p>
            </div>

            {/* Gallery */}
            <div className="space-y-4 pt-6 border-t border-white/5">
               <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Fotos Reais</h3>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                 {galleryImages.map((img, idx) => (
                   <motion.div 
                     key={idx}
                     whileHover={{ scale: 1.05 }}
                     onClick={() => setActiveLightboxIndex(idx)}
                     className="aspect-square rounded-xl md:rounded-2xl overflow-hidden border border-white/10 cursor-pointer bg-black/40 relative group"
                   >
                     <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-90" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                       <span className="text-[8px] font-black uppercase tracking-widest text-white bg-black/60 px-2 py-1 rounded">Ampliar Foto</span>
                     </div>
                   </motion.div>
                 ))}
               </div>
            </div>

            {/* Coupons Section */}
            {coupons.length > 0 && (
              <div className="space-y-4 md:space-y-6 pt-6 border-t border-white/10">
                <h3 className="text-base md:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Ticket className="text-brand-orange" size={18} /> Cupons de Desconto Parceiros
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coupons.map((coupon) => {
                    const isRedeemed = redeemedIds.includes(coupon.id);
                    return (
                      <motion.div
                        key={coupon.id}
                        whileHover={{ y: -2 }}
                        className={cn(
                          "relative p-4 rounded-xl border flex flex-col justify-between transition-all overflow-hidden",
                          isRedeemed 
                            ? "bg-white/[0.01] border-white/5 opacity-70" 
                            : "bg-surface-item border-white/10 hover:border-brand-orange/30"
                        )}
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-brand-orange/5 rounded-full -mr-6 -mt-6 blur-md pointer-events-none" />
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-black text-brand-orange uppercase bg-brand-orange/10 px-2.5 py-0.5 rounded">
                              {coupon.discountValue} Off
                            </span>
                            <span className="text-[9px] font-bold text-white/40 uppercase">
                              Expira em: {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-white italic uppercase mb-1">{coupon.code}</h4>
                          <p className="text-xs text-white/50 leading-snug line-clamp-2 mb-4">
                            {coupon.description}
                          </p>
                        </div>
                        <button
                          disabled={isRedeemed || isRedeeming === coupon.id}
                          onClick={() => handleRedeem(coupon)}
                          className={cn(
                            "w-full py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2",
                            isRedeemed
                              ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                              : "bg-brand-orange hover:bg-brand-orange/90 text-white shadow-lg shadow-brand-orange/10 active:scale-[0.98]"
                          )}
                        >
                          <Ticket size={12} />
                          {isRedeemed ? "Resgatado" : isRedeeming === coupon.id ? "Resgatando..." : "Resgatar Cupom"}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Location Map Section */}
          <div className="space-y-4 md:space-y-6 bg-surface-panel p-5 md:p-12 rounded-2xl md:rounded-[2.5rem] border border-white/10 overflow-hidden">
            <h3 className="text-lg md:text-xl font-black font-display text-white italic uppercase tracking-tighter flex items-center gap-3">
              <MapPin className="text-brand-orange" size={20} md:size={24} /> Onde retirar
            </h3>
            <p className="text-white/45 text-[11px] md:text-sm font-semibold break-words">
              {ad.street ? (
                `${ad.street}, ${ad.number}${ad.complement ? ` - ${ad.complement}` : ''} - ${ad.neighborhood}, ${ad.city} - ${ad.state}${ad.cep ? ` (CEP: ${ad.cep})` : ''}`
              ) : (
                company.address
              )}
            </p>
            <div className="h-[250px] md:h-[400px] rounded-xl md:rounded-[2rem] overflow-hidden border border-white/10 shadow-inner relative z-0 w-full">
               {ad.coords ? (
                 <MapContainer 
                  center={[ad.coords.lat, ad.coords.lng]} 
                  zoom={15} 
                  style={{ height: '100%', width: '100%', filter: 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[ad.coords.lat, ad.coords.lng]}>
                    <Popup>
                      <div className="p-2 font-bold text-gray-900">{ad.companyName}</div>
                    </Popup>
                  </Marker>
                </MapContainer>
               ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20 italic">Mapa não disponível</div>
               )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Company Card */}
          <div className="bg-surface-panel p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-white/10 lg:sticky lg:top-24 space-y-6 md:space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
               <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-brand-blue p-1 mb-2">
                 <img src={company.logo} alt={company.name} className="w-full h-full object-cover rounded-full" />
               </div>
               <div>
                  <h2 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter mb-1">{company.name}</h2>
                  <div className="flex items-center justify-center gap-1.5 text-brand-blue">
                     <ShieldCheck size={14} md:size={16} />
                     <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Parceiro Verificado</span>
                  </div>
               </div>
               <p className="text-white/40 text-[10px] md:text-xs font-medium line-clamp-3">
                 {company.description}
               </p>
            </div>

            <div className="space-y-3 md:space-y-4">
              <a 
                href={ad.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-3 py-3.5 md:py-4 bg-brand-green hover:bg-brand-green/90 text-black font-black uppercase tracking-widest text-[10px] md:text-xs rounded-xl md:rounded-2xl shadow-xl shadow-brand-green/10 transition-all hover:scale-105"
              >
                <MessageCircle size={16} md:size={18} fill="currentColor" />
                Negociar via WhatsApp
              </a>
              <Link 
                to={`/empresa/${company.id}`}
                className="w-full flex items-center justify-center gap-3 py-3.5 md:py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] md:text-xs rounded-xl md:rounded-2xl border border-white/10 transition-all"
              >
                <Store size={16} md:size={18} />
                Ver Todos Produtos
              </Link>
            </div>

            <div className="pt-5 md:pt-6 border-t border-white/5 grid grid-cols-2 gap-4 text-center">
               <div>
                  <p className="text-[9px] md:text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Vendas</p>
                  <p className="text-base md:text-lg font-black text-white">124+</p>
               </div>
               <div>
                  <p className="text-[9px] md:text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Avaliação</p>
                  <p className="text-base md:text-lg font-black text-brand-orange">4.9 ★</p>
               </div>
            </div>
          </div>

          {/* Related Ads */}
          <div className="pb-12 lg:pb-0">
            <h4 className="text-[10px] md:text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-4 md:mb-6">Sugestões para você</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 md:gap-6">
               {relatedAds.map((ra) => (
                 <Link key={ra.id} to={`/anuncio/${ra.id}`} className="flex gap-4 group">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl md:rounded-2xl overflow-hidden shrink-0 border border-white/10 ring-2 ring-transparent group-hover:ring-brand-blue transition-all">
                       <img src={ra.thumbnail} alt={ra.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex flex-col justify-center">
                       <h5 className="font-bold text-white text-xs md:text-sm line-clamp-2 leading-tight group-hover:text-brand-blue transition-colors">{ra.title}</h5>
                       <p className="text-brand-green font-black text-xs md:text-sm mt-1">{ra.price ? `R$ ${ra.price.toLocaleString('pt-BR')}` : 'Consultar'}</p>
                    </div>
                 </Link>
               ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Photo Lightbox Modal */}
      <AnimatePresence>
        {activeLightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md"
            onClick={() => setActiveLightboxIndex(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveLightboxIndex(null)}
              className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation Arrows */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveLightboxIndex(prev => prev !== null ? (prev - 1 + galleryImages.length) % galleryImages.length : null);
                  }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-4 rounded-full transition-all flex items-center justify-center"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveLightboxIndex(prev => prev !== null ? (prev + 1) % galleryImages.length : null);
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-4 rounded-full transition-all flex items-center justify-center"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[80vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={galleryImages[activeLightboxIndex]}
                alt="Detalhe da Foto"
                className="w-full h-full max-h-[75vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
              />
              <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-4">
                Foto {activeLightboxIndex + 1} de {galleryImages.length}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        adTitle={ad.title} 
        adId={ad.id} 
      />
    </div>
  );
}
