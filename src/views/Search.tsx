import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, MapPin, Filter, MessageCircle, Video, Navigation, Map as MapIcon, List, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Ad } from '../types';
import { adService, categoryService } from '../services/mockFirebase';
import { calculateDistance, getCurrentPosition } from '../lib/geo';
import SearchSkeleton from '../components/SearchSkeleton';
import toast from 'react-hot-toast';

// Fix for default Leaflet icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper to dynamic recenter map on coordinates change
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category');
  
  const [ads, setAds] = React.useState<Ad[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState(initialCategory || 'Todas');
  const [userCoords, setUserCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = React.useState<'recent' | 'price' | 'distance'>('recent');
  
  // Debounce logic
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Advanced filters state
  const [maxPrice, setMaxPrice] = React.useState<number | null>(null);
  const [onlyWithCoupons, setOnlyWithCoupons] = React.useState(false);
  const [radiusKm, setRadiusKm] = React.useState(10); // Default 10km radius
  const [showFilters, setShowFilters] = React.useState(false);

  const [categoriesList, setCategoriesList] = React.useState<string[]>(['Todas', 'Próximos']);

  React.useEffect(() => {
    categoryService.getAll().then(data => {
      const activeCats = data.filter((c: any) => !c.disabled).map((c: any) => c.name);
      setCategoriesList(['Todas', 'Próximos', ...activeCats]);
    });
  }, []);

  // Load persisted location
  React.useEffect(() => {
    const savedCoords = localStorage.getItem('vapt_user_coords');
    if (savedCoords) {
      try {
        const coords = JSON.parse(savedCoords);
        setUserCoords(coords);
        setSelectedCategory('Próximos');
        setSortBy('distance');
      } catch (e) {
        console.error("Erro ao ler localização salva:", e);
      }
    }
  }, []);

  React.useEffect(() => {
    adService.getAll().then(data => {
      setAds(data.filter(ad => ad.status === 'active')); // Issue 06: Search only shows active ads
      setIsLoading(false);
    });
  }, []);

  const handleGetLocation = async () => {
    setIsLocating(true);
    try {
      const position = await getCurrentPosition();
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      setUserCoords(coords);
      localStorage.setItem('vapt_user_coords', JSON.stringify(coords));
      setSelectedCategory('Próximos');
      setSortBy('distance');
    } catch (error) {
      console.error("Erro ao obter localização:", error);
      toast.error("Não foi possível obter sua localização. Verifique as permissões.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleClearLocation = () => {
     setUserCoords(null);
     setSelectedCategory('Todas');
     setSortBy('recent');
     localStorage.removeItem('vapt_user_coords');
  };

  const filteredAds = React.useMemo(() => {
    let result = ads.filter(ad => {
      const matchesQuery = ad.title.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
                         ad.companyName.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                         ad.city.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                         (ad.description && ad.description.toLowerCase().includes(debouncedQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'Todas' || 
                            selectedCategory === 'Próximos' || 
                            ad.category === selectedCategory;
      
      const matchesPrice = !maxPrice || (ad.price && ad.price <= maxPrice);
      const matchesCoupons = !onlyWithCoupons || !!ad.couponId;
      
      return matchesQuery && matchesCategory && matchesPrice && matchesCoupons;
    });

    if (selectedCategory === 'Próximos' && userCoords) {
      result = result
        .map(ad => ({
          ...ad,
          distance: ad.coords ? calculateDistance(userCoords.lat, userCoords.lng, ad.coords.lat, ad.coords.lng) : Infinity
        }))
        .filter(ad => (ad.distance || Infinity) <= radiusKm);
    }

    // Apply sorting
    return [...result].sort((a: any, b: any) => {
      if (sortBy === 'price') {
        return (a.price || Infinity) - (b.price || Infinity);
      }
      if (sortBy === 'distance' && userCoords) {
        const da = a.distance !== undefined ? a.distance : Infinity;
        const db = b.distance !== undefined ? b.distance : Infinity;
        return da - db;
      }
      // default: recent
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [ads, debouncedQuery, selectedCategory, userCoords, radiusKm, maxPrice, onlyWithCoupons, sortBy]);

  // Coordenada central média para o mapa (Padrão: São Paulo)
  const mapCenter = userCoords || { lat: -23.5505, lng: -46.6333 };

  const calculatedMapCenter = React.useMemo(() => {
    const adsWithCoords = filteredAds.filter(ad => ad.coords);
    if (adsWithCoords.length > 0) {
      const sumLat = adsWithCoords.reduce((acc, ad) => acc + ad.coords!.lat, 0);
      const sumLng = adsWithCoords.reduce((acc, ad) => acc + ad.coords!.lng, 0);
      return {
        lat: sumLat / adsWithCoords.length,
        lng: sumLng / adsWithCoords.length
      };
    }
    return mapCenter;
  }, [filteredAds, mapCenter]);

  return (
    <div className="py-6 min-h-[calc(100vh-10rem)]">
      <header className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="relative w-full md:max-w-md">
            <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input 
              type="text" 
              placeholder="O que você procura?" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#111317] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white text-sm focus:ring-2 focus:ring-brand-blue"
            />
            {query && (
               <button 
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"
               >
                 <X size={16} />
               </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-surface-panel p-1 rounded-xl border border-white/5 self-start md:self-auto">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                viewMode === 'list' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white"
              )}
            >
              <List size={16} />
              Lista
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                viewMode === 'map' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white"
              )}
            >
              <MapIcon size={16} />
              Mapa
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                if (cat === 'Próximos') {
                  handleGetLocation();
                } else {
                  setSelectedCategory(cat);
                }
              }}
              className={cn(
                "whitespace-nowrap px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border flex items-center gap-2",
                selectedCategory === cat 
                  ? "bg-brand-blue border-brand-blue text-white shadow-lg shadow-brand-blue/20" 
                  : "bg-white/5 border-white/5 text-white/40 hover:text-white"
              )}
            >
              {cat === 'Próximos' && (isLocating ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Navigation size={12} />)}
              {cat}
            </button>
          ))}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-4 py-2 rounded-full transition-all flex items-center gap-2 shrink-0 border",
              showFilters ? "bg-brand-orange border-brand-orange text-white" : "bg-white/5 border-white/5 text-white/40"
            )}
          >
             <Filter size={16} />
             {showFilters && <span className="text-[10px] font-black uppercase tracking-widest">Filtros</span>}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-surface-panel/50 rounded-[2rem] border border-white/5 p-6 mt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Radius Filter */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Raio de Busca</label>
                    <span className="text-xs font-bold text-brand-blue">{radiusKm}km</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={radiusKm} 
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full accent-brand-blue"
                  />
                </div>

                {/* Price Filter */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Preço Máximo (R$)</label>
                    <span className="text-xs font-bold text-brand-green">{maxPrice ? `Até R$ ${maxPrice}` : 'Qualquer valor'}</span>
                  </div>
                  <input 
                    type="number" 
                    placeholder="Ex: 500" 
                    value={maxPrice || ''}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-black/20 border border-white/5 rounded-xl py-2 px-4 text-white text-xs outline-none focus:border-brand-green transition-all"
                  />
                </div>

                {/* Coupons Toggle */}
                <div className="flex items-center justify-between md:justify-center gap-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Apenas com Cupom</label>
                  <button 
                    onClick={() => setOnlyWithCoupons(!onlyWithCoupons)}
                    className={cn(
                      "w-12 h-6 rounded-full p-1 transition-all",
                      onlyWithCoupons ? "bg-brand-orange" : "bg-white/10"
                    )}
                  >
                    <div className={cn("w-4 h-4 bg-white rounded-full transition-all", onlyWithCoupons ? "translate-x-6" : "translate-x-0")} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black font-display text-white uppercase italic tracking-tighter text-balance">
                {selectedCategory === 'Próximos' && userCoords ? 'Anúncios próximos a você' : `${filteredAds.length} resultados encontrados`}
              </h2>
              <div className="flex items-center gap-4 text-[10px] text-white/40 font-black uppercase tracking-widest shrink-0">
                 ORDENAR: 
                 <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-brand-blue border-none focus:ring-0 cursor-pointer uppercase font-black"
                 >
                   <option value="recent">Recentes</option>
                   <option value="price">Menor Preço</option>
                   {userCoords && <option value="distance">Distância</option>}
                 </select>
              </div>
            </div>
            
            {isLoading ? (
              <SearchSkeleton />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAds.map((ad: any, index) => (
                  <motion.div
                    key={ad.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-surface-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl hover:border-brand-blue/30 transition-all font-sans"
                  >
                    <div className="relative aspect-video overflow-hidden">
                       <img src={ad.thumbnail} alt={ad.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70" />
                       <div className="absolute inset-0 bg-gradient-to-t from-surface-deep via-transparent to-transparent opacity-80" />
                       <div className="absolute top-4 left-4 bg-brand-blue/90 backdrop-blur-md px-3 py-1 rounded-sm">
                         <span className="text-[9px] font-black text-white uppercase tracking-widest">{ad.category}</span>
                       </div>
                       <div className="absolute top-4 right-4 text-white/30">
                         <Video size={18} />
                       </div>
                       {ad.distance !== undefined && ad.distance !== Infinity && (
                         <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-brand-green">
                           {ad.distance.toFixed(1)} km de você
                         </div>
                       )}
                    </div>

                    <div className="p-6 space-y-4">
                      <div>
                        <Link to={`/empresa/${ad.companyId}`} className="flex items-center gap-2 mb-2 group/comp">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-white shadow-sm border border-white/10">
                            <img src={ad.companyLogo} alt="" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest group-hover/comp:text-brand-blue transition-colors">{ad.companyName}</span>
                        </Link>
                        <h3 className="font-bold text-white text-lg leading-tight line-clamp-1">{ad.title}</h3>
                        <div className="flex items-center gap-1 text-[10px] text-white/20 font-bold uppercase tracking-tighter mt-1">
                          <MapPin size={10} />
                          {ad.city}
                        </div>
                      </div>

                      {ad.price && (
                        <div className="flex items-baseline gap-2 pb-2 border-b border-white/5">
                          <span className="text-brand-orange font-black text-2xl tracking-tighter">R$ {ad.price.toLocaleString('pt-BR')}</span>
                          <span className="text-white/20 text-[9px] font-black uppercase tracking-widest">{ad.installments}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <a 
                          href={ad.whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 py-3 bg-brand-green text-black font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-brand-green/90 transition-all transform active:scale-95 shadow-lg shadow-brand-green/10"
                        >
                          <MessageCircle size={14} fill="currentColor" />
                          WhatsApp
                        </a>
                        <Link 
                          to={`/anuncio/${ad.id}`} 
                          className="flex items-center justify-center gap-2 py-3 bg-white/5 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all border border-white/10 active:scale-95"
                        >
                          Ver Detalhes
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {filteredAds.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-6"
                  >
                     <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/10 group cursor-default">
                       <SearchIcon size={48} className="group-hover:scale-110 group-hover:text-brand-orange transition-all duration-500" />
                     </div>
                     <div className="max-w-sm mx-auto space-y-2">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Nenhum resultado</h3>
                        <p className="text-white/40 text-sm font-medium">Não encontramos nada para sua busca. Tente buscar por termos mais genéricos ou mude a categoria acima.</p>
                     </div>
                     <div className="flex flex-wrap justify-center gap-2">
                       {['iPhone', 'Hambúrguer', 'Pousada', 'Tênis'].map((term) => (
                         <button 
                           key={term}
                           onClick={() => setQuery(term)}
                           className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white/40 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                         >
                           {term}
                         </button>
                       ))}
                     </div>
                     <button 
                      onClick={handleClearLocation} 
                      className="mt-4 px-8 py-3 bg-brand-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-blue/20 hover:scale-[1.02] active:scale-95 transition-all"
                     >
                       Resetar Filtros
                     </button>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="map"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-[600px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative z-10"
          >
            <MapContainer 
              center={[calculatedMapCenter.lat, calculatedMapCenter.lng]} 
              zoom={13} 
              style={{ height: '100%', width: '100%', filter: 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <RecenterMap center={[calculatedMapCenter.lat, calculatedMapCenter.lng]} />
              {filteredAds.filter(ad => ad.coords).map((ad) => (
                <Marker key={ad.id} position={[ad.coords!.lat, ad.coords!.lng]}>
                  <Popup className="ad-popup">
                    <div className="flex flex-col gap-2 p-1 min-w-[150px]">
                      <img src={ad.thumbnail} alt={ad.title} className="w-full h-20 object-cover rounded-lg" />
                      <h4 className="font-bold text-sm text-black leading-tight line-clamp-2">{ad.title}</h4>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">{ad.companyName}</p>
                      <Link 
                        to={`/anuncio/${ad.id}`}
                        className="text-center py-2 bg-brand-blue text-white font-bold text-[10px] uppercase tracking-widest rounded-md"
                      >
                        Ver Detalhes
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            
            <div className="absolute bottom-6 right-6 z-20 bg-surface-item backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl max-w-[200px]">
               <h4 className="text-[10px] font-black uppercase text-white/40 mb-2 tracking-widest font-display">Busca no Mapa</h4>
               <p className="text-xs text-white/60 leading-relaxed font-medium">Navegue pelo mapa para encontrar anúncios próximos à sua região preferida.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
