import React from 'react';
import { Check, X, Store, Clock, ExternalLink, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ModerationCardProps {
  key?: React.Key;
  id: string;
  name: string;
  subtitle?: string;
  time: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export default function ModerationCard({ id, name, subtitle, time, onApprove, onReject, onDelete, isLoading }: ModerationCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`flex items-center justify-between p-4 md:p-6 bg-white/5 rounded-2xl border border-white/5 group hover:border-brand-orange/20 transition-all ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white/40 group-hover:text-brand-orange transition-colors">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Store size={20} />
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-white group-hover:text-brand-orange transition-colors">{name}</p>
          {subtitle && <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{subtitle}</p>}
          <div className="flex items-center gap-2 text-[10px] text-white/40 font-medium italic">
            <Clock size={10} />
            Solicitado há {time}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onApprove(id)}
          className="w-10 h-10 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center hover:bg-brand-green transition-all hover:text-white shadow-lg shadow-brand-green/5"
          title="Aprovar"
        >
          <Check size={18} />
        </button>
        <button 
          onClick={() => onReject(id)}
          className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 transition-all hover:text-white shadow-lg shadow-red-500/5"
          title="Reprovar"
        >
          <X size={18} />
        </button>
        {onDelete && (
          <button 
            onClick={() => onDelete(id)}
            className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 transition-all hover:text-white shadow-lg shadow-rose-500/5"
            title="Excluir Definitivamente"
          >
            <Trash2 size={16} />
          </button>
        )}
        <button className="w-10 h-10 rounded-xl bg-white/5 text-white/20 flex items-center justify-center hover:text-white" title="Ver Detalhes">
          <ExternalLink size={16} />
        </button>
      </div>
    </motion.div>
  );
}
