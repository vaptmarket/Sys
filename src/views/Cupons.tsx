import React from 'react';
import { couponService, companyService } from '../services/mockFirebase';
import { Coupon, Company } from '../types';
import { motion } from 'motion/react';
import { Ticket, Copy, Check, Tag, Info, ShoppingBag } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Cupons() {
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [allCoupons, allCompanies] = await Promise.all([
          couponService.getAll(),
          companyService.getAll()
        ]);
        if (!active) return;
        setCoupons(allCoupons);
        setCompanies(allCompanies);
      } catch (error) {
        console.error("Erro ao carregar dados da central de cupons:", error);
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
  }, []);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="py-6 animate-pulse space-y-12">
        <header className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl"></div>
            <div className="h-10 w-64 bg-white/10 rounded-lg"></div>
          </div>
          <div className="h-6 w-96 bg-white/10 rounded-lg"></div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-surface-panel border border-white/10 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 bg-white/10 rounded"></div>
                  <div className="h-3 w-32 bg-white/10 rounded"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-8 w-24 bg-white/10 rounded"></div>
                <div className="h-4 w-full bg-white/10 rounded"></div>
              </div>
              <div className="h-12 w-full bg-white/10 rounded-xl pt-4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-brand-orange/20 rounded-2xl flex items-center justify-center text-brand-orange">
            <Ticket size={28} />
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-display text-white italic uppercase tracking-tighter">Central de Cupons</h1>
        </div>
        <p className="text-white/60 text-lg font-medium max-w-2xl">
          Economize em suas compras e serviços com os cupons exclusivos das melhores empresas da região.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {coupons.map((coupon, index) => {
          const company = companies.find(c => c.id === coupon.companyId);
          return (
            <motion.div
              key={coupon.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-surface-panel border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-brand-orange/30 transition-all flex flex-col"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Ticket size={120} />
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-white overflow-hidden shadow-lg border border-white/10">
                  <img src={company?.logo} alt={company?.name} className="w-full h-full object-cover" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest leading-none mb-1">{company?.name}</p>
                   <span className="bg-brand-blue/10 text-brand-blue text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Parceiro Verificado</span>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-tight mb-3">
                  {coupon.discountValue} OFF
                </h3>
                <p className="text-white/60 text-sm font-medium mb-6">{coupon.description}</p>
              </div>

              <div className="space-y-4">
                <div className="bg-black/40 border-2 border-dashed border-white/10 rounded-2xl p-4 flex items-center justify-between group-hover:border-brand-orange/30 transition-all">
                  <div className="font-mono text-xl font-black text-brand-orange tracking-widest px-2">
                    {coupon.code}
                  </div>
                  <button 
                    onClick={() => handleCopyCode(coupon.id, coupon.code)}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      copiedId === coupon.id ? "bg-brand-green text-black" : "bg-white/5 text-white hover:bg-brand-orange"
                    )}
                  >
                    {copiedId === coupon.id ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
                   <div className="flex items-center gap-1.5">
                     <Tag size={12} />
                     Expira em {new Date(coupon.expiresAt).toLocaleDateString()}
                   </div>
                   <div className="flex items-center gap-1.5">
                     <ShoppingBag size={12} />
                     {coupon.usedCount} usados
                   </div>
                </div>

                <Link 
                  to={`/empresa/${coupon.companyId}`}
                  className="w-full py-3 bg-white/5 hover:bg-white text-white hover:text-black rounded-xl font-black text-[10px] uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2"
                >
                  <Info size={14} />
                  Ver Empresa
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-20 p-12 bg-gradient-to-br from-brand-blue/10 to-brand-orange/10 rounded-[3rem] border border-white/5 text-center">
         <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Tem um negócio?</h2>
         <p className="text-white/60 font-medium mb-8 max-w-xl mx-auto">Crie agora mesmo cupons exclusivos para seus vídeos e atraia centenas de novos clientes na sua região.</p>
         <Link to="/anunciar" className="inline-flex items-center gap-3 px-8 py-4 bg-brand-orange text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-orange/20 hover:scale-105 active:scale-95 transition-all">
           Ganhar Visibilidade Agora
         </Link>
      </div>
    </div>
  );
}
