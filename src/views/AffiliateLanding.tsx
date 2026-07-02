import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { motion } from 'motion/react';
import { Shield, Sparkles, CheckCircle2, ArrowRight, Store, Zap } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

export default function AffiliateLanding() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [affiliateName, setAffiliateName] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;

    // Persist affiliate ID in localStorage for company creation tracking
    localStorage.setItem('vapt_referral_affiliate_id', id);
    console.log('Affiliate ID stored from landing page:', id);

    const fetchAffiliate = async () => {
      try {
        const docRef = doc(db, 'users', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setAffiliateName(snap.data().displayName || snap.data().name || 'Um parceiro');
        } else {
          // Fallback to localStorage registered users
          const savedUsersStr = localStorage.getItem('vapt_registered_users');
          if (savedUsersStr) {
            const registeredUsers = JSON.parse(savedUsersStr);
            const matched = registeredUsers.find((u: any) => u.uid === id);
            if (matched) {
              setAffiliateName(matched.displayName || matched.name);
            }
          }
        }
      } catch (e) {
        console.error('Error fetching affiliate:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchAffiliate();
  }, [id]);

  const handleStart = () => {
    toast.success('Indicação ativada! Prossiga com o cadastro de sua empresa.');
    navigate('/anunciar');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <Helmet>
        <title>Indicação Premiada | Vapt Market</title>
      </Helmet>

      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl bg-surface-panel p-8 sm:p-12 rounded-[3rem] border border-white/10 shadow-2xl relative text-center"
      >
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-blue to-brand-orange text-white px-6 py-2 rounded-full font-black text-[9px] uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
          <Sparkles size={12} className="animate-spin" />
          Indicação Oficial
        </div>

        <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-brand-blue/20 to-brand-orange/20 text-brand-orange mb-8 border border-white/10">
          <Store size={36} className="animate-pulse" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white italic uppercase tracking-tighter leading-tight mb-4">
          Você foi Convidado!
        </h1>

        <p className="text-white/60 text-base sm:text-lg max-w-lg mx-auto font-medium leading-relaxed mb-8">
          {loading ? (
            <span className="opacity-40">Identificando indicação...</span>
          ) : affiliateName ? (
            <>
              Seu amigo <strong className="text-brand-orange font-black">{affiliateName}</strong> está te convidando para anunciar no <strong className="text-white font-black uppercase">Vapt Market</strong>!
            </>
          ) : (
            <>
              Você foi indicado por um parceiro para anunciar sua empresa no <strong className="text-white font-black uppercase">Vapt Market</strong>!
            </>
          )}
        </p>

        <div className="bg-[#111317] border border-white/5 rounded-[2rem] p-6 sm:p-8 text-left mb-8 space-y-6">
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-4">
            <Zap size={14} className="text-brand-orange" />
            Por que anunciar no Vapt Market?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <CheckCircle2 size={18} className="text-brand-green shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wide">Visibilidade Local</p>
                <p className="text-[10px] text-white/45 leading-relaxed mt-1">Conecte sua empresa diretamente aos moradores e turistas da região.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 size={18} className="text-brand-green shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wide">Vídeos & Ofertas</p>
                <p className="text-[10px] text-white/45 leading-relaxed mt-1">Publique seus comerciais dinâmicos e conquiste novos clientes pelo feed visual.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 size={18} className="text-brand-green shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wide">Cupons de Desconto</p>
                <p className="text-[10px] text-white/45 leading-relaxed mt-1">Gere cupons personalizados com QR Code e acompanhe suas retiradas.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 size={18} className="text-brand-green shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wide">Contato Direto</p>
                <p className="text-[10px] text-white/45 leading-relaxed mt-1">Os clientes entram em contato diretamente no seu WhatsApp em um clique.</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full sm:w-auto px-8 py-4 bg-brand-orange text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-orange/20 cursor-pointer flex items-center justify-center gap-3 hover:bg-brand-orange/90 transition-all mx-auto"
        >
          Cadastrar Minha Empresa
          <ArrowRight size={16} />
        </button>

        <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mt-6 flex items-center justify-center gap-1.5">
          <Shield size={12} className="text-brand-green" />
          Sua indicação será detectada e vinculada de forma 100% segura.
        </p>
      </motion.div>
    </div>
  );
}
