import React from 'react';
import { 
  Video, 
  Link as LinkIcon, 
  Edit3, 
  DollarSign, 
  MessageCircle, 
  Rocket,
  Check,
  Camera,
  FileText,
  MapPin,
  Store,
  Shield
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatPhone, formatCurrency, parseCurrency, getYouTubeEmbedUrl } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';


import { adService, categoryService, companyService, settingsService } from '../services/mockFirebase';
import { Category, Company } from '../types';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function QueroAnunciar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [isLaunching, setIsLaunching] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [categories, setCategories] = React.useState<{ id: string; name: Category; icon: string }[]>([]);
  const [userCompany, setUserCompany] = React.useState<Company | null>(null);
  const [allCompanies, setAllCompanies] = React.useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>('');
  const [showCompanyField, setShowCompanyField] = React.useState(false);
  const [videoPreview, setVideoPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [platformWhatsapp, setPlatformWhatsapp] = React.useState('https://wa.me/5527992830151');
  const [isSearchingCep, setIsSearchingCep] = React.useState(false);

  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    category: '' as Category | '',
    price: '',
    installment: '',
    whatsapp: '',
    videoUrl: '',
    companyName: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    location: '', // Assembled info or fallback
    startDate: new Date().toISOString().substring(0, 10)
  });

  const formatCEP = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 5) return clean;
    return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
  };

  const fetchCepDetails = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsSearchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (data && !data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || '',
            location: data.localidade ? `${data.localidade}, ${data.uf || ''}` : ''
          }));
          toast.success('Localização detectada via CEP!');
        } else {
          toast.error('CEP não encontrado.');
        }
      } catch (err) {
        console.error('Error fetching CEP details:', err);
        toast.error('Falha de rede ao consultar CEP.');
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    if (companyId === 'new') {
      setFormData(prev => ({
        ...prev,
        companyName: '',
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        whatsapp: '',
        location: '',
      }));
      setShowCompanyField(true);
    } else {
      const comp = allCompanies.find(c => c.id === companyId);
      if (comp) {
        setFormData(prev => ({
          ...prev,
          companyName: comp.name,
          cep: comp.cep || '',
          street: comp.street || '',
          number: comp.number || '',
          complement: comp.complement || '',
          neighborhood: comp.neighborhood || '',
          city: comp.city || '',
          state: comp.state || '',
          whatsapp: comp.whatsapp || comp.phone || '',
          location: comp.city ? `${comp.city}, ${comp.state || ''}` : comp.address || '',
        }));
        setShowCompanyField(false);
      }
    }
  };

  React.useEffect(() => {
    settingsService.getSettings().then(s => {
      setPlatformWhatsapp(s.platformWhatsapp);
    });
  }, []);

  React.useEffect(() => {
    categoryService.getAll().then(setCategories);
    companyService.getAll().then(setAllCompanies);
    
    if (user) {
      companyService.getByUserId(user.uid).then(company => {
        if (company) {
          setUserCompany(company);
          setSelectedCompanyId(company.id);
          setFormData(prev => ({
            ...prev,
            companyName: company.name,
            cep: company.cep || '',
            street: company.street || '',
            number: company.number || '',
            complement: company.complement || '',
            neighborhood: company.neighborhood || '',
            city: company.city || '',
            state: company.state || '',
            whatsapp: company.whatsapp || company.phone || '',
            location: company.city ? `${company.city}, ${company.state || ''}` : company.address || '',
          }));
        } else {
          setShowCompanyField(true);
        }
      });
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="py-12 max-w-2xl mx-auto px-4 font-sans">
        <div className="text-center space-y-4 mb-10">
          <h1 className="text-4xl md:text-5xl font-black font-display text-white mb-4 leading-none lowercase tracking-tighter italic">
            quero anunciar.
          </h1>
          <p className="text-white/40 font-semibold uppercase tracking-widest text-[10px]">Expanda suas vendas com o poder do vídeo curto</p>
        </div>

        <div className="bg-[#111317] rounded-[3rem] p-8 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden text-center space-y-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 blur-[120px] rounded-full -mr-32 -mt-32" />
          
          <div className="w-24 h-24 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center mx-auto shadow-xl">
            <Rocket size={44} />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Anuncie no Vapt Market</h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-md mx-auto">
              No Vapt Market, apenas <span className="text-brand-orange font-bold">Administradores e Parceiros VIP</span> podem postar anúncios diretamente. Como membro, você pode solicitar o desejo de anunciar agora mesmo!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-2">
            {[
              { id: '1', step: '1', title: 'Manifestar Interesse', desc: 'Clique no botão abaixo para iniciar o contato pelo WhatsApp oficial.' },
              { id: '2', step: '2', title: 'Envio do Vídeo', desc: 'Envie o link ou vídeo do seu produto ou serviço para avaliação.' },
              { id: '3', step: '3', title: 'Conversão em Vendas', desc: 'Seu anúncio cinemático será publicado no Feed por nossa equipe!' },
            ].map((stepItem, idx) => (
              <div id={stepItem.id} key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-2 right-4 text-white/5 font-black text-5xl italic leading-none">{stepItem.step}</div>
                <h4 className="text-xs font-black uppercase tracking-wider text-brand-blue mb-1 relative z-10">{stepItem.title}</h4>
                <p className="text-[10px] text-white/40 leading-relaxed mt-1 relative z-10">{stepItem.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <a 
              href={platformWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                toast.success('Redirecionando para o WhatsApp oficial...');
              }}
              className="w-full py-5 bg-gradient-to-r from-brand-blue to-blue-600 hover:from-brand-blue hover:to-blue-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
            >
              <MessageCircle size={18} />
              Solicitar Desejo de Anunciar
            </a>
            
            <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest">
              Dúvidas? Fale com o WhatsApp oficial: <span className="text-brand-green">{(() => {
                try {
                  const cleaned = platformWhatsapp.split('/').pop() || '';
                  if (cleaned && cleaned.match(/^\d+$/)) {
                    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
                  }
                } catch {}
                return 'Contato Oficial';
              })()}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('O vídeo deve ter no máximo 50MB.');
        return;
      }
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      setFormData(prev => ({ ...prev, videoUrl: url }));
    }
  };

  const steps = [
    { number: 1, label: 'Mídia', icon: Video },
    { number: 2, label: 'Detalhes', icon: Edit3 },
    { number: 3, label: 'Contato', icon: MessageCircle },
  ];

  const validateStep1 = () => {
    if (!formData.videoUrl) {
      toast.error('Insira o link do seu vídeo do YouTube.');
      return false;
    }
    const embedUrl = getYouTubeEmbedUrl(formData.videoUrl);
    if (!embedUrl) {
      toast.error('O link precisa ser um endereço de vídeo do YouTube válido (ex: watch, shorts ou compartilhado).');
      return false;
    }
    // Update the videoUrl with the validated/formatted embed link
    setFormData(prev => ({ ...prev, videoUrl: embedUrl }));
    return true;
  };

  const validateStep2 = () => {
    if (!formData.title || !formData.category || (showCompanyField && !formData.companyName)) {
      toast.error('Preencha os dados básicos obrigatórios.');
      return false;
    }
    if (!formData.cep || !formData.street || !formData.number || !formData.city || !formData.state) {
      toast.error('Preencha as informações de endereço obrigatórias (CEP, rua, número, cidade, UF).');
      return false;
    }
    return true;
  };

  const handlePublish = async () => {
    if (!formData.whatsapp) {
      toast.error('Preencha seu WhatsApp.');
      return;
    }

    setIsLaunching(true);
    try {
      let companyId = selectedCompanyId || userCompany?.id;
      let targetCompany = allCompanies.find(c => c.id === companyId);
      
      let companyName = targetCompany?.name || userCompany?.name || formData.companyName;
      let companyLogo = targetCompany?.logo || userCompany?.logo || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=80';

      // Create company if doesn't exist
      if (!companyId && user) {
        const randomId = 'comp_' + Math.random().toString(36).substr(2, 9);
        const assembledAddress = `${formData.street}, ${formData.number}${formData.complement.trim() ? ` - ${formData.complement.trim()}` : ''}, ${formData.neighborhood}, ${formData.city} - ${formData.state}`;
        companyId = await companyService.create({
          id: randomId,
          name: formData.companyName,
          userId: user.uid,
          status: 'active',
          cep: formData.cep,
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          address: assembledAddress,
          phone: formData.whatsapp,
          whatsapp: formData.whatsapp,
          description: formData.description || 'Nenhuma descrição fornecida.',
          logo: companyLogo,
        });
        companyName = formData.companyName;
      }

      // Mapeamento local de geocodificação para as cidades principais do litoral e fallbacks
      const cityLower = (formData.city || '').toLowerCase();
      let coords: { lat: number; lng: number } | undefined = undefined;

      if (cityLower.includes('ilhabela')) {
        coords = { lat: -23.7781, lng: -45.3582 };
      } else if (cityLower.includes('sebastião') || cityLower.includes('sebastiao') || cityLower.includes('maresias')) {
        coords = { lat: -23.8014, lng: -45.4111 };
      } else if (cityLower.includes('caraguatatuba') || cityLower.includes('caragua')) {
        coords = { lat: -23.6226, lng: -45.4125 };
      } else if (cityLower.includes('ubatuba')) {
        coords = { lat: -23.4339, lng: -45.0711 };
      } else {
        // Fallback de geolocalização (São Paulo)
        coords = { lat: -23.5505, lng: -46.6333 };
      }

      await adService.create({
        title: formData.title,
        description: formData.description,
        category: formData.category as Category,
        price: parseCurrency(formData.price),
        installments: formData.installment,
        whatsappLink: `https://wa.me/55${formData.whatsapp.replace(/\D/g, '')}`,
        videoUrl: formData.videoUrl,
        thumbnail: 'https://images.unsplash.com/photo-1551731359-2b349793038a?auto=format&fit=crop&w=800&q=80',
        city: formData.city || 'São Paulo',
        cep: formData.cep,
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        state: formData.state,
        location: `${formData.city}, ${formData.state}`,
        companyId,
        companyName,
        companyLogo,
        coords,
        likes: 0,
        shares: 0,
        saved: 0,
        views: 0,
        status: 'active',
        createdAt: Date.now(),
        startDate: formData.startDate || new Date().toISOString().substring(0, 10),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      
      setIsSuccess(true);
      toast.success('Anúncio publicado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao publicar anúncio:', error);
      toast.error(error?.message || 'Ocorreu um erro ao salvar o anúncio.');
    } finally {
      setIsLaunching(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="w-32 h-32 bg-brand-green/20 text-brand-green rounded-full flex items-center justify-center shadow-2xl shadow-brand-green/10">
          <Check size={64} strokeWidth={3} />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Anúncio Enviado!</h1>
          <p className="text-white/40 text-sm font-medium max-w-sm mx-auto">
            Seu anúncio foi enviado com sucesso e está agora em fase de moderação. Em breve ele estará visível para todos os usuários!
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link to="/" className="flex-1 py-4 bg-brand-blue text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-blue/20">
            Ver no Feed
          </Link>
          <button onClick={() => { setIsSuccess(false); setStep(1); }} className="flex-1 py-4 bg-white/5 text-white/40 font-black uppercase tracking-widest text-xs rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
            Criar Outro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-4xl mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-6xl font-black font-display text-white mb-4 leading-none lowercase tracking-tighter italic">
          venda mais rápido.
        </h1>
        <p className="text-white/40 font-semibold uppercase tracking-widest text-[10px]">Crie seu anúncio em vídeo em menos de 2 minutos</p>
      </header>

      {/* Progress */}
      <div className="flex items-center justify-between mb-16 relative">
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/5 -translate-y-1/2 z-0" />
        {steps.map((s) => (
          <div key={s.number} className="relative z-10 flex flex-col items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl",
              step >= s.number ? "bg-brand-blue text-white" : "bg-[#1e2024] text-white/20"
            )}>
              {step > s.number ? <Check size={20} /> : <s.icon size={20} />}
            </div>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest",
              step >= s.number ? "text-brand-blue" : "text-white/20"
            )}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-[#111317] rounded-[3rem] p-8 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 blur-[120px] rounded-full -mr-32 -mt-32" />
        
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Seu vídeo vendedor</h2>
              <p className="text-white/40 text-sm font-medium">Insira um link do YouTube em formato vertical ou horizontal para o seu anúncio</p>
            </div>
            
            <div className="max-w-xl mx-auto space-y-6">
              <div className="bg-[#1e2024] rounded-3xl p-8 border border-white/5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-full -mr-16 -mt-16 blur-xl pointer-events-none" />
                <div className="flex items-center gap-3 text-white font-black text-xs uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
                  <LinkIcon size={18} className="text-brand-blue" />
                  Link do Vídeo no YouTube
                </div>
                
                <div className="space-y-4">
                  <span className="block text-[10px] font-bold text-white/30 uppercase tracking-widest">
                    URL do Vídeo (Assista, Shorts ou link de Compartilhar)
                  </span>
                  <input 
                    type="url" 
                    placeholder="Ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
                    value={formData.videoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-semibold focus:outline-none focus:border-brand-blue transition-all placeholder:text-white/20"
                    required
                  />
                  <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5 mt-4">
                    <p className="text-[10px] text-white/45 font-semibold leading-relaxed">
                      💡 <span className="font-bold text-[#fbc02d] uppercase mr-1">Dica:</span>
                      Cole o link do seu vídeo e o sistema formatará com autoplay e loop contínuo para o feed cinemático do Vapt Market.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <button onClick={() => validateStep1() && setStep(2)} className="w-full py-5 bg-brand-blue text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-blue/20 cursor-pointer">
              Próximo Passo
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Detalhes do Anúncio</h2>
              <p className="text-white/40 text-sm font-medium">Quais são as informações gerais e a localização da oferta?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Associar Anúncio a uma Empresa */}
              <div className="md:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Store size={22} className="text-brand-orange" />
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Associação de Empresa</h3>
                    <p className="text-[10px] text-white/40">Selecione uma empresa cadastrada para herdar suas configurações e endereço padrão</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Selecione a empresa vinculada</label>
                  <select
                    value={selectedCompanyId || 'new'}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    className="w-full bg-[#1e2024] border border-white/10 rounded-xl py-4 px-6 text-white text-sm focus:outline-none focus:border-brand-blue font-semibold appearance-none"
                  >
                    <option value="new">Criar / Digitar Nova Empresa manualmente...</option>
                    {allCompanies.map(comp => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name} ({comp.city || 'Sem Cidade'} - {comp.state || 'UF'})
                      </option>
                    ))}
                  </select>
                </div>

                {showCompanyField && (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Nome da Nova Empresa / Negócio</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Pizzaria da Nonna" 
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full bg-[#1e2024] border-2 border-brand-blue/10 rounded-xl py-4 px-6 text-white text-sm font-semibold focus:outline-none focus:border-brand-blue" 
                    />
                  </div>
                )}
              </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Título do Anúncio</label>
                 <input 
                   type="text" 
                   placeholder="Ex: Pousada Mar Azul" 
                   value={formData.title}
                   onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                   className="w-full bg-[#1e2024] border-none rounded-xl py-4 px-6 text-white text-sm focus:ring-2 focus:ring-brand-blue" 
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Categoria</label>
                 <select 
                   value={formData.category}
                   onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Category }))}
                   className="w-full bg-[#1e2024] border-none rounded-xl py-4 px-6 text-white text-sm focus:ring-2 focus:ring-brand-blue appearance-none"
                 >
                   <option value="">Selecione...</option>
                   {categories.map(cat => (
                     <option key={cat.id} value={cat.name}>{cat.name}</option>
                   ))}
                 </select>
               </div>
               <div className="md:col-span-2 space-y-2">
                 <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Descrição Detalhada</label>
                 <textarea 
                   placeholder="Descreva seu produto ou serviço em detalhes..." 
                   value={formData.description}
                   onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                   rows={4}
                   className="w-full bg-[#1e2024] border-none rounded-xl py-4 px-6 text-white text-sm focus:ring-2 focus:ring-brand-blue resize-none" 
                 />
               </div>

               {/* Endereço Completo & Busca por CEP */}
               <div className="md:col-span-2 bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-6">
                 <div className="flex items-center gap-2">
                   <MapPin size={20} className="text-brand-blue" />
                   <h3 className="text-xs font-black text-white uppercase tracking-wider">Endereço Completo do Anúncio</h3>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">CEP (Deteção Automática)</label>
                     <div className="relative">
                       <input 
                         type="text" 
                         placeholder="00000-000" 
                         value={formData.cep}
                         onChange={(e) => {
                           const formatted = formatCEP(e.target.value);
                           setFormData(prev => ({ ...prev, cep: formatted }));
                           if (formatted.replace(/\D/g, '').length === 8) {
                             fetchCepDetails(formatted);
                           }
                         }}
                         maxLength={9}
                         className="w-full bg-[#1e2024] border border-white/10 rounded-xl py-4 px-6 text-white text-sm focus:outline-none focus:border-brand-blue font-semibold" 
                       />
                       {isSearchingCep && (
                         <div className="absolute right-4 top-1/2 -translate-y-1/2">
                           <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                         </div>
                       )}
                     </div>
                   </div>

                   <div className="md:col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Rua / Logradouro</label>
                     <input 
                       type="text" 
                       placeholder="Ex: Avenida das Flores" 
                       value={formData.street}
                       onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                       className="w-full bg-[#1e2024] border-none rounded-xl py-4 px-6 text-white text-sm focus:ring-2 focus:ring-brand-blue" 
                     />
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Número</label>
                     <input 
                       type="text" 
                       placeholder="Ex: 123" 
                       value={formData.number}
                       onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                       className="w-full bg-[#1e2024] border-none rounded-xl py-4 px-6 text-white text-sm focus:ring-2 focus:ring-brand-blue" 
                     />
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Complemento</label>
                     <input 
                       type="text" 
                       placeholder="Ex: Apto 4" 
                       value={formData.complement}
                       onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                       className="w-full bg-[#1e2024] border-none rounded-xl py-4 px-6 text-white text-sm focus:ring-2 focus:ring-brand-blue" 
                     />
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Bairro</label>
                     <input 
                       type="text" 
                       placeholder="Ex: Maresias" 
                       value={formData.neighborhood}
                       onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                       className="w-full bg-[#1e2024] border-none rounded-xl py-4 px-6 text-white text-sm focus:ring-2 focus:ring-brand-blue" 
                     />
                   </div>

                   <div className="space-y-2 md:col-span-2">
                     <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Cidade</label>
                     <input 
                       type="text" 
                       placeholder="Ex: São Sebastião" 
                       value={formData.city}
                       onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value, location: `${e.target.value}, ${formData.state}` }))}
                       className="w-full bg-[#1e2024] border-none rounded-xl py-4 px-6 text-white text-sm focus:ring-2 focus:ring-brand-blue" 
                     />
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Estado (UF)</label>
                     <input 
                       type="text" 
                       placeholder="Ex: SP" 
                       value={formData.state}
                       onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase(), location: `${formData.city}, ${e.target.value.toUpperCase()}` }))}
                       maxLength={2}
                       className="w-full bg-[#1e2024] border-none rounded-xl py-4 px-6 text-white text-sm focus:ring-2 focus:ring-brand-blue" 
                     />
                   </div>
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Preço (Opcional)</label>
                 <div className="relative">
                   <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                   <input 
                     type="text" 
                     placeholder="R$ 0,00" 
                     value={formData.price}
                     onChange={(e) => setFormData(prev => ({ ...prev, price: formatCurrency(e.target.value) }))}
                     className="w-full bg-[#1e2024] border-none rounded-xl py-4 pl-10 pr-6 text-white text-sm focus:ring-2 focus:ring-brand-blue" 
                   />
                 </div>
               </div>
               <div className=" space-y-2">
                 <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Parcelamento</label>
                 <input 
                   type="text" 
                   placeholder="Ex: 12x sem juros" 
                   value={formData.installment}
                   onChange={(e) => setFormData(prev => ({ ...prev, installment: e.target.value }))}
                   className="w-full bg-[#1e2024] border-none rounded-xl py-4 px-6 text-white text-sm focus:ring-2 focus:ring-brand-blue" 
                 />
               </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Data de Início da Postagem</label>
                  <input 
                    type="date" 
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-[#1e2024] border-none rounded-xl py-4 px-6 text-white text-sm focus:ring-2 focus:ring-brand-blue" 
                    required
                  />
                </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 py-5 bg-white/5 text-white font-black uppercase tracking-widest text-xs rounded-2xl">
                Voltar
              </button>
              <button onClick={() => validateStep2() && setStep(3)} className="flex-[2] py-5 bg-brand-blue text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-blue/20">
                Confirmar Detalhes
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto">
                <MessageCircle size={40} />
              </div>
              <h2 className="text-2xl font-black text-white">Último passo: Contato</h2>
              <p className="text-white/40 text-sm font-medium max-w-sm mx-auto italic">Onde o cliente vai falar com você para fechar a venda?</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">WhatsApp para Vendas</label>
                 <input 
                   type="text" 
                   placeholder="(00) 00000-0000" 
                   value={formData.whatsapp}
                   onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: formatPhone(e.target.value) }))}
                   className="w-full bg-brand-green/5 border-2 border-brand-green/20 rounded-2xl py-5 px-8 text-white text-lg font-black focus:ring-2 focus:ring-brand-green" 
                 />
                 <p className="text-[10px] text-white/30 font-bold uppercase mt-2 text-center">Inclua o DDD e número</p>
              </div>

              <div className="bg-brand-orange/10 rounded-2xl p-6 border border-brand-orange/20">
                 <p className="text-brand-orange font-bold text-sm mb-2 italic">Dica Vapt Premium:</p>
                 <p className="text-white/60 text-xs font-medium">Anunciantes VIP recebem estatísticas detalhadas de cliques e botão em destaque.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={handlePublish}
                disabled={isLaunching}
                className="w-full py-6 bg-brand-orange text-white font-black uppercase tracking-widest text-sm rounded-[2rem] shadow-2xl shadow-brand-orange/40 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {isLaunching ? (
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Rocket size={24} />
                    PUBLICAR ANÚNCIO AGORA
                  </>
                )}
              </button>
              <button onClick={() => setStep(2)} className="w-full py-4 text-white/40 font-bold uppercase tracking-widest text-[10px]">
                Ainda não, quero revisar
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
