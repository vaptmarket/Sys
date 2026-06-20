import React from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Facebook, 
  Twitter as TwitterIcon, 
  MessageCircle, 
  Send, 
  Link as LinkIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  adTitle: string;
  adId: string;
}

export default function ShareModal({ isOpen, onClose, adTitle, adId }: ShareModalProps) {
  const [copied, setCopied] = React.useState(false);
  const shareUrl = `${window.location.origin}/anuncio/${adId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socialPlatforms = [
    { 
      name: 'WhatsApp', 
      icon: MessageCircle, 
      color: 'bg-[#25D366]', 
      text: 'text-white',
      getShareUrl: () => `https://api.whatsapp.com/send?text=${encodeURIComponent(adTitle + '\n' + shareUrl)}`
    },
    { 
      name: 'Facebook', 
      icon: Facebook, 
      color: 'bg-[#1877F2]', 
      text: 'text-white',
      getShareUrl: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    { 
      name: 'Twitter', 
      icon: TwitterIcon, 
      color: 'bg-[#1DA1F2]', 
      text: 'text-white',
      getShareUrl: () => `https://twitter.com/intent/tweet?text=${encodeURIComponent(adTitle)}&url=${encodeURIComponent(shareUrl)}`
    },
    { 
      name: 'Telegram', 
      icon: Send, 
      color: 'bg-[#0088CC]', 
      text: 'text-white',
      getShareUrl: () => `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(adTitle)}`
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-surface-panel w-full max-w-sm rounded-[2.5rem] border border-white/10 p-8 relative z-10 shadow-2xl"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Compartilhar</h3>
                <p className="text-white/40 text-xs font-medium line-clamp-1 italic px-4">"{adTitle}"</p>
              </div>

              {/* Social Icons Grid */}
              <div className="grid grid-cols-4 gap-4">
                {socialPlatforms.map((platform) => (
                  <button 
                    key={platform.name}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                    onClick={() => {
                      const url = platform.getShareUrl();
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <div className={`w-12 h-12 rounded-2xl ${platform.color} ${platform.text} flex items-center justify-center shadow-lg transform group-hover:scale-110 active:scale-90 transition-all`}>
                      <platform.icon size={20} fill="currentColor" />
                    </div>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{platform.name}</span>
                  </button>
                ))}
              </div>

              {/* Link Input */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest text-left px-2">Ou copie o link</p>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-2 pl-4">
                  <div className="text-white/20 shrink-0">
                    <LinkIcon size={16} />
                  </div>
                  <input 
                    type="text" 
                    readOnly 
                    value={shareUrl}
                    className="bg-transparent border-none outline-none text-white/60 text-xs font-medium w-full truncate"
                  />
                  <button 
                    onClick={handleCopy}
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${copied ? 'bg-brand-green text-white' : 'bg-brand-blue text-white hover:bg-brand-blue/80'}`}
                  >
                    {copied ? <Check size={18} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 bg-white/5 text-white/60 rounded-2xl font-black uppercase tracking-widest text-xs border border-white/10 hover:bg-white/10 transition-all"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
