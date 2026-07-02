import React from 'react';
import { 
  Heart, 
  Share2, 
  Bookmark, 
  MapPin, 
  MessageCircle, 
  ChevronRight,
  ExternalLink,
  Store,
  Ticket,
  Copy,
  Check,
  Tag,
  X,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Ad, Coupon } from '../types';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { safeFormatDate } from '../utils/date';

import ShareModal from './ShareModal';
import QrCodeModal from './QrCodeModal';

import { adService, couponService } from '../services/mockFirebase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface AdVideoProps {
  ad: Ad;
  isActive: boolean;
  isOldest?: boolean;
}

export default function AdVideo({ ad, isActive, isOldest }: AdVideoProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const [showCouponModal, setShowCouponModal] = React.useState(false);
  const [showQrCodeModal, setShowQrCodeModal] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [hasRedeemed, setHasRedeemed] = React.useState(false);
  const [coupon, setCoupon] = React.useState<Coupon | null>(null);

  React.useEffect(() => {
    if (user && ad.id) {
      adService.isAdSaved(user.uid, ad.id).then(setIsSaved);
    }
  }, [user, ad.id]);

  React.useEffect(() => {
    if (user && ad.couponId) {
      couponService.getUserCoupons(user.uid).then(coupons => {
        setHasRedeemed(coupons.some(c => c.couponId === ad.couponId));
      });
    } else {
      setHasRedeemed(false);
    }
  }, [user, ad.couponId]);

  React.useEffect(() => {
    let active = true;
    if (ad.couponId) {
      couponService.getById(ad.couponId).then(fetched => {
        if (active) {
          setCoupon(fetched || null);
        }
      }).catch(err => {
        console.error('Error fetching coupon:', err);
        if (active) {
          setCoupon(null);
        }
      });
    } else {
      setCoupon(null);
    }
    return () => {
      active = false;
    };
  }, [ad.couponId]);

  const toggleLike = async () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    try {
      await adService.updateLikes(ad.id, newLikedState ? 1 : -1);
    } catch (error: any) {
      console.error('Error liking ad:', error);
      setIsLiked(!newLikedState);
      toast.error(error?.message || 'Ocorreu um erro ao salvar as informações localmente. Verifique o limite de armazenamento do navegador!');
    }
  };

  const handleSave = async () => {
    if (!user) return; // In a real app, show login prompt
    try {
      const saved = await adService.toggleSave(user.uid, ad.id);
      setIsSaved(saved);
    } catch (error: any) {
      console.error('Error saving ad:', error);
      toast.error(error?.message || 'Ocorreu um erro ao salvar as informações localmente. Verifique o limite de armazenamento do navegador!');
    }
  };


  const handleRedeemCoupon = async () => {
    if (coupon) {
      try {
        navigator.clipboard.writeText(coupon.code);
        setCopied(true);
        if (user && !hasRedeemed) {
          await couponService.redeem(user.uid, coupon.id);
          setHasRedeemed(true);
        }
        setTimeout(() => setCopied(false), 2000);
      } catch (error: any) {
        console.error('Error redeeming coupon:', error);
        toast.error(error?.message || 'Ocorreu um erro ao salvar as informações localmente. Verifique o limite de armazenamento do navegador!');
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden shadow-2xl group border border-white/10">
      {/* Video Content */}
      <div className="absolute inset-0 z-0">
        {isActive ? (
          <iframe 
            src={ad.videoUrl}
            className="w-full h-full object-cover pointer-events-none"
            title={ad.title}
          />
        ) : (
          <img src={ad.thumbnail} alt={ad.title} className="w-full h-full object-cover opacity-60" />
        )}
      </div>

      {/* Scrims */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-28 flex flex-col gap-4 items-center z-20">
        <button 
          onClick={toggleLike} 
          className="flex flex-col items-center gap-1 group/btn"
        >
          <div className={cn(
            "w-12 h-12 rounded-full glass-morphism flex items-center justify-center transition-all active:scale-90",
            isLiked ? "text-brand-orange bg-brand-orange/20" : "text-white"
          )}>
            <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
          </div>
          <span className="text-[10px] font-bold text-white/80">{ad.likes + (isLiked ? 1 : 0)}</span>
        </button>

        <button 
          onClick={() => setShowShareModal(true)}
          className="flex flex-col items-center gap-1 group/btn"
        >
          <div className="w-12 h-12 rounded-full glass-morphism flex items-center justify-center text-white active:scale-90 transition-all">
            <Share2 size={24} />
          </div>
        </button>

        <button 
          onClick={handleSave}
          className="flex flex-col items-center gap-1 group/btn"
        >
          <div className={cn(
            "w-12 h-12 rounded-full glass-morphism flex items-center justify-center transition-all active:scale-90",
            isSaved ? "text-brand-blue bg-brand-blue/20" : "text-white"
          )}>
            <Bookmark size={24} fill={isSaved ? "currentColor" : "none"} />
          </div>
        </button>

        {coupon && (
          <button 
            onClick={() => setShowCouponModal(true)}
            className="flex flex-col items-center gap-1 group/btn"
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all",
              hasRedeemed ? "bg-brand-green text-black" : "bg-brand-orange text-white shadow-brand-orange/40 animate-bounce"
            )}>
              {hasRedeemed ? <Check size={24} /> : <Ticket size={24} />}
            </div>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-tighter",
              hasRedeemed ? "text-brand-green" : "text-brand-orange"
            )}>
              {hasRedeemed ? 'Resgatado' : 'Cupom'}
            </span>
          </button>
        )}
      </div>

      {/* Coupon Modal */}
      <AnimatePresence>
        {showCouponModal && coupon && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-surface-panel border border-white/10 rounded-3xl p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue via-brand-orange to-brand-blue animate-shimmer" />
              
              <button 
                onClick={() => setShowCouponModal(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>

              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-brand-orange/10 rounded-2xl flex items-center justify-center mx-auto text-brand-orange">
                  <Ticket size={32} />
                </div>
                
                <div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">
                    {hasRedeemed ? 'Cupom Resgatado!' : 'Seu Cupom!'}
                  </h3>
                  <p className="text-white/60 text-sm font-medium">{coupon.description}</p>
                </div>

                <div className={cn(
                  "border-2 border-dashed rounded-2xl p-6 relative group",
                  hasRedeemed ? "bg-brand-green/10 border-brand-green/30" : "bg-white/5 border-white/10"
                )}>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Código do Cupom</p>
                  <p className={cn(
                    "text-3xl font-black tracking-[0.2em] font-mono",
                    hasRedeemed ? "text-brand-green" : "text-brand-blue"
                  )}>
                    {coupon.code}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button 
                      onClick={handleRedeemCoupon}
                      disabled={hasRedeemed && !copied}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold transition-all text-xs cursor-pointer",
                        hasRedeemed 
                          ? "bg-brand-green/20 text-brand-green border border-brand-green/30" 
                          : "bg-brand-blue hover:bg-brand-blue/90 text-white"
                      )}
                    >
                      {copied ? (
                        <>
                          <Check size={14} />
                          Copiado!
                        </>
                      ) : hasRedeemed ? (
                        <>
                          <Copy size={14} />
                          Copiar
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Resgatar
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setShowQrCodeModal(true)}
                      className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all text-xs cursor-pointer"
                    >
                      <QrCode size={14} />
                      QR Code
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                   <Tag size={12} />
                   Válido até {safeFormatDate(coupon.expiresAt)}
                </div>
              </div>
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

      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 flex flex-col gap-3 md:gap-4 z-10">
        <div className="mb-1 md:mb-2">
           {isOldest && (
             <span className="bg-brand-blue text-[8px] md:text-[9px] font-black px-2 py-0.5 md:py-1 rounded-sm uppercase mb-1 md:mb-2 inline-block tracking-widest text-white">
               Postagem Mais Antiga
             </span>
           )}
           <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight line-clamp-2">
             {ad.title}
           </h2>
           <div className="flex items-center gap-2 mt-1 text-white/60 text-xs md:text-sm font-medium">
             <span className="flex items-center gap-1">
                <MapPin size={12} />
                {ad.city}
             </span>
             {ad.price && (
               <span className="flex items-center gap-1 before:content-['•'] before:mr-2">
                 R$ {ad.price.toLocaleString('pt-BR')}
               </span>
             )}
           </div>
        </div>

        <div className="flex items-center justify-between pb-3 md:pb-4 border-b border-white/10">
          <Link to={`/empresa/${ad.companyId}`} className="flex items-center gap-2 md:gap-3 cursor-pointer">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-brand-blue bg-surface-item overflow-hidden shrink-0">
              <img src={ad.companyLogo} alt={ad.companyName} className="w-full h-full object-cover" />
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-xs md:text-sm text-white truncate">{ad.companyName}</p>
              <p className="text-[8px] md:text-[10px] text-white/40 italic font-medium">Vendedor Verificado</p>
            </div>
          </Link>
          <div className="bg-white/5 backdrop-blur-md px-2 md:px-3 py-1 rounded-full border border-white/10 shrink-0">
            <span className="text-[8px] md:text-[9px] font-bold text-white/60 uppercase tracking-widest">{ad.category}</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="grid grid-cols-2 gap-2 md:gap-3 mt-1 md:mt-2">
          <a 
            href={ad.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 md:gap-2 py-2.5 md:py-3.5 bg-brand-green hover:bg-brand-green/90 text-black font-bold text-xs md:text-sm rounded-xl md:rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95"
          >
            <MessageCircle size={16} fill="currentColor" />
            WhatsApp
          </a>
          <Link 
            to={`/anuncio/${ad.id}`}
            className="flex-1 flex items-center justify-center bg-white hover:bg-gray-200 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm text-black uppercase tracking-tighter transition-all transform hover:scale-[1.02] active:scale-95 text-center"
          >
             Ver Detalhes
          </Link>
        </div>
      </div>

      {coupon && (
        <QrCodeModal 
          isOpen={showQrCodeModal}
          onClose={() => setShowQrCodeModal(false)}
          code={coupon.code}
          discountValue={coupon.discountValue}
          description={coupon.description}
          companyName={ad.companyName}
        />
      )}
    </div>
  );
}
