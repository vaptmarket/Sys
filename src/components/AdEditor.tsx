import React from 'react';
import { Ad, Category, Coupon, Company } from '../types';
import { X, Save, Film, Image as LucideImage, Tag, DollarSign, AlignLeft, Type, MapPin, MessageSquare, Calendar, Store } from 'lucide-react';
import { cn, formatCurrency, parseCurrency, getYouTubeEmbedUrl } from '../lib/utils';
import toast from 'react-hot-toast';


interface AdEditorProps {
  ad: Ad;
  categories: { id: string; name: Category; icon: string }[];
  companies?: Company[];
  coupons?: Coupon[];
  onSave: (updatedAd: Ad) => Promise<void>;
  onCancel: () => void;
}

export default function AdEditor({ ad, categories, companies = [], coupons = [], onSave, onCancel }: AdEditorProps) {
  const [formData, setFormData] = React.useState<Ad>({ ...ad });
  const [isSaving, setIsSaving] = React.useState(false);
  const [displayPrice, setDisplayPrice] = React.useState(ad.price ? formatCurrency(ad.price.toString().replace('.', '')) : '');
  const [isSearchingCep, setIsSearchingCep] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'price') {
      const formatted = formatCurrency(value);
      setDisplayPrice(formatted);
      setFormData(prev => ({ ...prev, price: parseCurrency(value) }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

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
    if (!companyId || companyId === 'custom') {
      setFormData(prev => ({
        ...prev,
        companyId: 'admin',
        companyName: 'Minha Empresa',
        companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=100&q=80',
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        location: ''
      }));
    } else {
      const comp = companies.find(c => c.id === companyId);
      if (comp) {
        setFormData(prev => ({
          ...prev,
          companyId: comp.id,
          companyName: comp.name,
          companyLogo: comp.logo,
          category: (comp.category as Category) || prev.category || (categories[0]?.name as Category),
          cep: comp.cep || '',
          street: comp.street || '',
          number: comp.number || '',
          complement: comp.complement || '',
          neighborhood: comp.neighborhood || '',
          city: comp.city || '',
          state: comp.state || '',
          location: comp.city ? `${comp.city}, ${comp.state || ''}` : comp.address || ''
        }));
        toast.success(`Dados preenchidos herdando da empresa: ${comp.name}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const embedUrl = getYouTubeEmbedUrl(formData.videoUrl);
    if (!embedUrl) {
      toast.error('Por favor, insira um link válido do YouTube (ex: watch, shorts, ou compartilhado)');
      return;
    }
    // Validation of full address fields
    if (!formData.cep || !formData.street || !formData.number || !formData.city || !formData.state) {
      toast.error('O endereço completo é obrigatório (CEP, Rua, Número, Cidade e Estado).');
      return;
    }
    setIsSaving(true);
    try {
      await onSave({ ...formData, videoUrl: embedUrl });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={!isSaving ? onCancel : undefined} />
      
      <div className="bg-surface-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
        <div className="sticky top-0 bg-surface-panel/80 backdrop-blur-xl p-8 border-b border-white/5 flex items-center justify-between z-20">
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Editar Anúncio</h2>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">ID: {ad.id || 'Novo Anúncio'}</p>
          </div>
          <button 
            onClick={onCancel}
            disabled={isSaving}
            className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Title */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Type size={14} /> Título do Anúncio
              </label>
              <input
                id="ad-title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
              />
            </div>

            {/* Associar Anúncio a uma Empresa */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Store size={14} /> Associar com Empresa Existente
              </label>
              <select
                id="ad-company"
                value={formData.companyId || 'custom'}
                onChange={(e) => handleCompanyChange(e.target.value)}
                disabled={isSaving}
                className="w-full bg-[#1e2024] border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all appearance-none disabled:opacity-50"
              >
                <option value="custom" className="bg-[#111317]">Preencher dados manualmente...</option>
                {companies.map(comp => (
                  <option key={comp.id} value={comp.id} className="bg-[#111317]">
                    {comp.name} ({comp.city || 'Sem Cidade'})
                  </option>
                ))}
              </select>
            </div>

            {/* Category / Categoria */}
            {(!formData.companyId || formData.companyId === 'admin' || formData.companyId === 'custom') ? (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  <Tag size={14} /> Categoria
                </label>
                <select
                  id="ad-category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all appearance-none disabled:opacity-50"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  <Tag size={14} /> Categoria (Preenchida via Empresa)
                </label>
                <div className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-[#fbc02d] font-black uppercase text-xs flex items-center justify-between">
                  <span>{formData.category}</span>
                  <span className="text-[8px] bg-[#fbc02d]/10 text-[#fbc02d] px-2 py-0.5 rounded-full">Herdado</span>
                </div>
              </div>
            )}

            {/* Price */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <DollarSign size={14} /> Valor (R$)
              </label>
              <input
                id="ad-price"
                type="text"
                name="price"
                value={displayPrice}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
              />
            </div>

            {/* Installments */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <AlignLeft size={14} /> Condições de Pagamento
              </label>
              <input
                id="ad-installments"
                type="text"
                name="installments"
                value={formData.installments || ''}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                placeholder="Ex: 12x sem juros"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
              <AlignLeft size={14} /> Descrição Detalhada
            </label>
            <textarea
              id="ad-description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={4}
              disabled={isSaving}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:outline-none focus:border-brand-blue transition-all resize-none disabled:opacity-50"
            />
          </div>

          {/* Endereço Completo & Busca por CEP */}
          <div className="bg-white/[0.01] border border-white/5 rounded-[2rem] p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2">
              <MapPin size={20} className="text-brand-blue" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Endereço Completo do Anúncio</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CEP */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  CEP
                </label>
                <div className="relative">
                  <input 
                    id="ad-cep"
                    type="text" 
                    placeholder="00000-000" 
                    value={formData.cep || ''}
                    name="cep"
                    onChange={(e) => {
                      const formatted = formatCEP(e.target.value);
                      setFormData(prev => ({ ...prev, cep: formatted }));
                      if (formatted.replace(/\D/g, '').length === 8) {
                        fetchCepDetails(formatted);
                      }
                    }}
                    maxLength={9}
                    disabled={isSaving}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50" 
                  />
                  {isSearchingCep && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Rua */}
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Rua / Logradouro</label>
                <input 
                  id="ad-street"
                  type="text" 
                  name="street"
                  placeholder="Ex: Avenida das Flores" 
                  value={formData.street || ''}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50" 
                />
              </div>

              {/* Número */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Número</label>
                <input 
                  id="ad-number"
                  type="text" 
                  name="number"
                  placeholder="Ex: 123" 
                  value={formData.number || ''}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50" 
                />
              </div>

              {/* Complemento */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Complemento</label>
                <input 
                  id="ad-complement"
                  type="text" 
                  name="complement"
                  placeholder="Ex: Apto 4" 
                  value={formData.complement || ''}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50" 
                />
              </div>

              {/* Bairro */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Bairro</label>
                <input 
                  id="ad-neighborhood"
                  type="text" 
                  name="neighborhood"
                  placeholder="Ex: Maresias" 
                  value={formData.neighborhood || ''}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50" 
                />
              </div>

              {/* Cidade */}
              <div className="space-y-3 md:col-span-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Cidade</label>
                <input 
                  id="ad-city"
                  type="text" 
                  name="city"
                  placeholder="Ex: São Sebastião" 
                  value={formData.city || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      city: val, 
                      location: `${val}, ${prev.state || ''}` 
                    }));
                  }}
                  disabled={isSaving}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50" 
                />
              </div>

              {/* Estado */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Estado (UF)</label>
                <input 
                  id="ad-state"
                  type="text" 
                  name="state"
                  placeholder="Ex: SP" 
                  value={formData.state || ''}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setFormData(prev => ({ 
                      ...prev, 
                      state: val, 
                      location: `${prev.city || ''}, ${val}` 
                    }));
                  }}
                  maxLength={2}
                  disabled={isSaving}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50" 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* WhatsApp Link */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <MessageSquare size={14} /> Link do WhatsApp
              </label>
              <input
                id="ad-whatsapp-link"
                type="url"
                name="whatsappLink"
                value={formData.whatsappLink || ''}
                onChange={handleChange}
                required
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                placeholder="Ex: https://wa.me/5512999999999"
              />
            </div>
          </div>

          {/* Datas de Postagem e Expiração */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Start Date / Data de Início */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Calendar size={14} /> Data de Início da Postagem
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate ? formData.startDate.substring(0, 10) : ''}
                onChange={(e) => {
                  const dateStr = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    startDate: dateStr
                  }));
                }}
                required
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
              />
            </div>

            {/* Expires At */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Calendar size={14} /> Data de Expiração
              </label>
              <input
                type="date"
                name="expiresAt"
                value={formData.expiresAt ? formData.expiresAt.substring(0, 10) : ''}
                onChange={(e) => {
                  const dateStr = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    expiresAt: dateStr ? new Date(dateStr + 'T23:59:59.999Z').toISOString() : ''
                  }));
                }}
                required
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Cupom Associado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Associated Coupon */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Tag size={14} /> Cupom de Desconto Associado
              </label>
              <select
                name="couponId"
                value={formData.couponId || ''}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all appearance-none disabled:opacity-50"
              >
                <option value="" className="bg-[#111317]">Nenhum cupom associado</option>
                {coupons.map(coupon => (
                  <option key={coupon.id} value={coupon.id} className="bg-[#111317]">
                    {coupon.code} - {coupon.discountValue} OFF ({coupon.description})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Video URL */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Film size={14} /> URL do Vídeo (Iframe)
              </label>
              <input
                type="url"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleChange}
                required
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
              />
            </div>

            {/* Thumbnail URL */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <LucideImage size={14} /> URL da Thumbnail
              </label>
              <input
                type="url"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleChange}
                required
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Banner Preview */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
              Preview da Imagem
            </label>
            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black">
              {formData.thumbnail && (
                <img src={formData.thumbnail} alt="Preview" className="w-full h-full object-cover" />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-3 py-5 bg-brand-blue text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-blue/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} /> Salvar Alterações
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="flex-1 py-5 bg-white/5 text-white/40 font-black uppercase tracking-widest text-xs rounded-2xl border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
