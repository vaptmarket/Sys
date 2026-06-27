import React from 'react';
import { X, Copy, Check, QrCode, Sparkles, Store, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  discountValue: string;
  description: string;
  companyName: string;
}

export default function QrCodeModal({
  isOpen,
  onClose,
  code,
  discountValue,
  description,
  companyName
}: QrCodeModalProps) {
  const [copied, setCopied] = React.useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(code)}&color=000000&bgcolor=ffffff&qzone=2`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="bg-[#0f0f12] w-full max-w-sm rounded-[3rem] border border-white/10 p-8 relative z-10 shadow-2xl flex flex-col items-center"
          >
            {/* Top Glow bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-blue via-brand-orange to-brand-blue animate-shimmer" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors p-1 rounded-full bg-white/5 hover:bg-white/10"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="text-center space-y-2 mt-4 w-full">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-[9px] font-black uppercase tracking-widest">
                <Sparkles size={10} className="animate-pulse" /> QR Code de Validação
              </span>
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter line-clamp-1">
                {companyName}
              </h3>
              <p className="text-brand-blue font-black text-3xl tracking-tight leading-none uppercase italic">
                {discountValue} OFF
              </p>
              <p className="text-white/60 text-xs font-medium px-4 line-clamp-2 mt-1">
                {description}
              </p>
            </div>

            {/* QR Code Canvas Frame */}
            <div className="my-6 relative p-4 bg-white rounded-3xl shadow-xl shadow-brand-blue/5 border-4 border-brand-blue/30 group">
              <div className="absolute inset-0 bg-brand-blue/10 rounded-2xl filter blur opacity-0 group-hover:opacity-100 transition-opacity" />
              <img
                src={qrCodeUrl}
                alt={`QR Code para o cupom ${code}`}
                className="w-48 h-48 object-contain relative z-10 rounded-xl"
              />
            </div>

            {/* Code Copy Field */}
            <div className="w-full bg-black/40 border-2 border-dashed border-white/10 rounded-2xl p-4 flex items-center justify-between hover:border-brand-orange/30 transition-all mb-6">
              <div className="flex flex-col text-left">
                <span className="text-[8px] font-black text-white/35 uppercase tracking-widest">Código do Cupom</span>
                <span className="font-mono text-xl font-black text-brand-orange tracking-widest uppercase">
                  {code}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                  copied ? "bg-brand-green text-black" : "bg-white/5 text-white hover:bg-brand-orange hover:text-white"
                )}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>

            {/* Instructions */}
            <div className="w-full space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5 text-left">
              <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-1">Como utilizar:</p>
              
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-brand-blue/15 text-brand-blue flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Apresente este <strong>QR Code</strong> ou o código copiado ao atendente no momento do pagamento.
                </p>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-brand-blue/15 text-brand-blue flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  O estabelecimento fará a leitura para aplicar o desconto de <strong>{discountValue}</strong> instantaneamente.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full py-3.5 bg-brand-orange hover:bg-brand-orange/90 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-orange/20"
            >
              Fechar
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
