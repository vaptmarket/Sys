import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { adService, companyService } from '../services/mockFirebase';
import { Ad, Company } from '../types';
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
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { cn } from '../lib/utils';
import ShareModal from '../components/ShareModal';

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
  const [ad, setAd] = React.useState<Ad | null>(null);
  const [company, setCompany] = React.useState<Company | null>(null);
  const [relatedAds, setRelatedAds] = React.useState<Ad[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [selectedImage, setSelectedImage] = React.useState(0);
  const [isLiked, setIsLiked] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);

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
          <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Voltar</span>
        </Link>
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={() => setShowShareModal(true)}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all"
          >
            <Share2 size={16} md:size={18} />
          </button>
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className={cn(
              "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all",
              isLiked ? "bg-brand-orange text-white" : "bg-white/5 text-white hover:bg-white/10"
            )}
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
                 Vídeo em Destaque
              </span>
            </div>
          </div>

          {/* Description & Gallery */}
          <div className="space-y-6 md:space-y-8 bg-surface-panel p-5 md:p-12 rounded-2xl md:rounded-[2.5rem] border border-white/10">
            <div>
               <div className="flex items-center gap-2 mb-4">
                  <span className="bg-brand-orange/10 text-brand-orange text-[9px] md:text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                    {ad.category}
                  </span>
                  <span className="text-white/20 text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Clock size={10} md:size={12} /> Postado há 2 dias
                  </span>
               </div>
               <h1 className="text-2xl md:text-5xl font-black font-display text-white italic uppercase tracking-tighter leading-tight md:leading-none mb-4 md:mb-6">
                 {ad.title}
               </h1>
               <div className="flex items-center gap-6 pb-6 md:pb-8 border-b border-white/5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl md:text-3xl font-black text-brand-green tracking-tighter">
                      {ad.price ? `R$ ${ad.price.toLocaleString('pt-BR')}` : 'Sob Consulta'}
                    </span>
                    {ad.installments && (
                      <span className="text-white/30 text-[9px] md:text-xs font-bold uppercase">{ad.installments}</span>
                    )}
                  </div>
               </div>
            </div>

            <div className="space-y-4 md:space-y-6">
               <h3 className="text-base md:text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                 Sobre este Anúncio
               </h3>
               <p className="text-white/60 leading-relaxed text-sm md:text-lg font-medium">
                 {ad.description || 'Nenhuma descrição detalhada fornecida para este anúncio.'}
               </p>
            </div>

            {/* Gallery */}
            <div className="space-y-4">
               <h3 className="text-sm md:text-lg font-bold text-white uppercase tracking-tight">Fotos Reais</h3>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                 {galleryImages.map((img, idx) => (
                   <motion.div 
                     key={idx}
                     whileHover={{ scale: 1.05 }}
                     className="aspect-square rounded-lg md:rounded-2xl overflow-hidden border border-white/10 cursor-pointer"
                   >
                     <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                   </motion.div>
                 ))}
               </div>
            </div>
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
                      <div className="p-2 font-bold">{ad.companyName}</div>
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
      
      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        adTitle={ad.title} 
        adId={ad.id} 
      />
    </div>
  );
}
