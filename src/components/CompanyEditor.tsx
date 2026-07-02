import React from 'react';
import { Company } from '../types';
import { X, Save, Type, AlignLeft, Phone, Link, MapPin, Clock, CheckCircle, Users, FileText, Mail, Tag, Upload, Image } from 'lucide-react';
import toast from 'react-hot-toast';

interface CompanyEditorProps {
  company: Company;
  onSave: (updatedCompany: Company) => Promise<void>;
  onCancel: () => void;
  usersList?: any[];
  categories?: any[];
}

const DEFAULT_CATEGORIES = [
  'Restaurantes',
  'Pousadas',
  'Hotéis',
  'Veículos',
  'Imóveis',
  'Moda',
  'Eletrônicos',
  'Serviços',
  'Mercado',
  'Construção',
  'Turismo',
  'Promoções',
  'Eventos',
  'Delivery',
  'Produtos Usados'
];

export default function CompanyEditor({ company, onSave, onCancel, usersList = [], categories = [] }: CompanyEditorProps) {
  const [formData, setFormData] = React.useState<Company>({ 
    ...company,
    category: company.category || (categories && categories.length > 0 ? (typeof categories[0] === 'string' ? categories[0] : (categories[0].name || categories[0].id)) : 'Restaurantes')
  });
  const [isSaving, setIsSaving] = React.useState(false);

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem do banner deve ter no máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          banner: reader.result as string
        }));
        toast.success('Banner carregado com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  const updateAddress = (updated: Company): Company => {
    const parts = [
      updated.street,
      updated.number ? `${updated.number}` : '',
      updated.complement ? `(${updated.complement})` : '',
      updated.neighborhood,
      updated.city,
      updated.state ? updated.state.toUpperCase() : '',
      updated.cep ? `CEP ${updated.cep}` : ''
    ].filter(p => p && p.trim() !== '');

    updated.address = parts.join(', ');
    return updated;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 14) value = value.slice(0, 14);
    
    // Apply CNPJ mask: XX.XXX.XXX/XXXX-XX
    let masked = value;
    if (value.length > 12) {
      masked = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12)}`;
    } else if (value.length > 8) {
      masked = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8)}`;
    } else if (value.length > 5) {
      masked = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5)}`;
    } else if (value.length > 2) {
      masked = `${value.slice(0, 2)}.${value.slice(2)}`;
    }

    setFormData(prev => ({ ...prev, cnpj: masked }));
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    
    // Apply CEP mask: XXXXX-XXX
    let maskedValue = value;
    if (value.length > 5) {
      maskedValue = `${value.slice(0, 5)}-${value.slice(5)}`;
    }

    setFormData(prev => {
      const updated = { ...prev, cep: maskedValue };
      return updateAddress(updated);
    });

    if (value.length === 8) {
      const loadId = toast.loading('Buscando CEP...');
      try {
        const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
        const data = await response.json();
        if (data.erro) {
          toast.error('CEP não encontrado.', { id: loadId });
          return;
        }

        setFormData(prev => {
          const updated = {
            ...prev,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || ''
          };
          return updateAddress(updated);
        });
        toast.success('Localização carregada!', { id: loadId });
      } catch (error) {
        console.error('Error fetching CEP:', error);
        toast.error('Erro ao conectar ao serviço de CEP.', { id: loadId });
      }
    }
  };

  const handleAddressComponentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      return updateAddress(updated);
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('O nome da empresa é obrigatório.');
      return;
    }
    setIsSaving(true);
    try {
      const dataToSave = { ...formData };
      if (!dataToSave.referredBy) {
        // If empty string or null, remove the property
        delete dataToSave.referredBy;
      }
      await onSave(dataToSave);
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
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
              {company.id === 'nova' ? 'Adicionar Empresa' : 'Editar Empresa'}
            </h2>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">
              ID: {company.id === 'nova' ? 'Nova Empresa' : (company.id || 'Nova Empresa')}
            </p>
          </div>
          <button 
            onClick={onCancel}
            disabled={isSaving}
            className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Name */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Type size={14} /> Nome da Empresa
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
              />
            </div>

            {/* Category */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Tag size={14} /> Categoria da Empresa
              </label>
              <select
                name="category"
                value={formData.category || 'Restaurantes'}
                onChange={handleChange}
                required
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all appearance-none disabled:opacity-50 cursor-pointer"
              >
                {(categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES).map((cat) => {
                  const catValue = typeof cat === 'string' ? cat : (cat.name || cat.id);
                  const catLabel = typeof cat === 'string' ? cat : (cat.name || cat.id);
                  return (
                    <option key={catValue} value={catValue} className="bg-[#111317]">
                      {catLabel}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Logo Url */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Link size={14} /> URL do Logotipo (Imagem)
              </label>
              <input
                type="url"
                name="logo"
                value={formData.logo || ''}
                onChange={handleChange}
                required
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Banner Upload or URL */}
          <div className="space-y-3 bg-white/[0.01] border border-white/5 p-6 rounded-3xl">
            <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
              <Image size={14} className="text-brand-blue" /> Banner do Perfil (Upload ou URL)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block">Opção 1: Fazer Upload da Imagem</span>
                <div className="relative border border-dashed border-white/20 hover:border-brand-blue/50 rounded-2xl p-5 text-center cursor-pointer transition-all bg-black/20 hover:bg-black/30">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerFileChange}
                    disabled={isSaving}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload size={20} className="mx-auto text-brand-blue mb-1" />
                  <span className="text-[10px] text-white/50 block font-bold">Escolha ou arraste uma foto</span>
                  <span className="text-[8px] text-white/30 block mt-0.5">Máximo 2MB</span>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block">Opção 2: Inserir Link da Imagem (URL)</span>
                <input
                  type="url"
                  name="banner"
                  value={formData.banner || ''}
                  onChange={handleChange}
                  disabled={isSaving}
                  placeholder="Ex: https://images.unsplash.com/... ou link direto"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-xs focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                />
              </div>
            </div>
            {formData.banner && (
              <div className="relative h-28 w-full rounded-2xl overflow-hidden border border-white/10 mt-4">
                <img src={formData.banner} className="w-full h-full object-cover" alt="Prévia do Banner" />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, banner: '' }))}
                  className="absolute top-2 right-2 bg-black/75 hover:bg-red-500 hover:text-white text-white/80 p-2 rounded-full transition-all cursor-pointer shadow-lg"
                  title="Remover Banner"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
              <AlignLeft size={14} /> Descrição da Empresa
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              required
              disabled={isSaving}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Phone */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Phone size={14} /> Telefone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                required
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                placeholder="(12) 99999-9999"
              />
            </div>

            {/* Whatsapp */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Phone size={14} /> WhatsApp Link ou Número
              </label>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp || ''}
                onChange={handleChange}
                required
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                placeholder="Ex: 5512999999999"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Website */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Link size={14} /> Website (Opcional)
              </label>
              <input
                type="url"
                name="website"
                value={formData.website || ''}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                placeholder="https://example.com"
              />
            </div>

            {/* Instagram */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Link size={14} /> Instagram URL / @Usuário (Opcional)
              </label>
              <input
                type="text"
                name="instagram"
                value={formData.instagram || ''}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                placeholder="Ex: https://instagram.com/sua_empresa"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* CNPJ */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <FileText size={14} /> CNPJ (Opcional)
              </label>
              <input
                type="text"
                name="cnpj"
                value={formData.cnpj || ''}
                onChange={handleCnpjChange}
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                placeholder="00.000.000/0000-00"
              />
            </div>

            {/* Email */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Mail size={14} /> E-mail (Opcional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                placeholder="contato@empresa.com"
              />
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t border-white/5">
            <h3 className="text-xs font-black text-brand-blue uppercase tracking-widest flex items-center gap-2">
              <MapPin size={16} /> Endereço & Localização
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* CEP */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  CEP (Auto-busca)
                </label>
                <input
                  type="text"
                  name="cep"
                  value={formData.cep || ''}
                  onChange={handleCepChange}
                  disabled={isSaving}
                  className="w-full bg-white/5 border border-brand-blue/30 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50 shadow-md shadow-brand-blue/5"
                  placeholder="Ex: 12240-000"
                />
              </div>

              {/* Cidade */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Cidade
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleAddressComponentChange}
                  disabled={isSaving}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                  placeholder="Cidade"
                />
              </div>

              {/* Estado */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Estado (UF)
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state || ''}
                  onChange={handleAddressComponentChange}
                  disabled={isSaving}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Rua / Logradouro */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Rua / Logradouro
                </label>
                <input
                  type="text"
                  name="street"
                  value={formData.street || ''}
                  onChange={handleAddressComponentChange}
                  disabled={isSaving}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                  placeholder="Rua / Avenida"
                />
              </div>

              {/* Bairro */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Bairro
                </label>
                <input
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood || ''}
                  onChange={handleAddressComponentChange}
                  disabled={isSaving}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                  placeholder="Bairro"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Número */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Número
                </label>
                <input
                  type="text"
                  name="number"
                  value={formData.number || ''}
                  onChange={handleAddressComponentChange}
                  disabled={isSaving}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                  placeholder="Nº"
                />
              </div>

              {/* Complemento */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Complemento
                </label>
                <input
                  type="text"
                  name="complement"
                  value={formData.complement || ''}
                  onChange={handleAddressComponentChange}
                  disabled={isSaving}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                  placeholder="Sala, Bloco, etc. (Opcional)"
                />
              </div>

              {/* Hours */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  <Clock size={14} /> Funcionamento (Opcional)
                </label>
                <input
                  type="text"
                  name="hours"
                  value={formData.hours || ''}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                  placeholder="Ex: Seg a Sex das 08h às 18h"
                />
              </div>
            </div>

            {/* Compiled Full Address */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <MapPin size={14} /> Endereço Completo (Gerado Automaticamente)
              </label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                required
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white/60 font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                placeholder="Rua, Número - Bairro, Cidade - UF"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Status */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                Status de Moderação
              </label>
              <select
                name="status"
                value={formData.status || 'pending'}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all appearance-none disabled:opacity-50"
              >
                <option value="active" className="bg-[#111317]">Ativa / Aprovada</option>
                <option value="pending" className="bg-[#111317]">Pendente / Moderação</option>
                <option value="rejected" className="bg-[#111317]">Rejeitada</option>
              </select>
            </div>

            {/* Affiliate / Referred By */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Users size={14} className="text-brand-orange" /> Usuário Afiliado (Indicação)
              </label>
              <select
                name="referredBy"
                value={formData.referredBy || ''}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all appearance-none disabled:opacity-50 cursor-pointer"
              >
                <option value="" className="bg-[#111317]">Sem Afiliado (Nenhum)</option>
                {usersList.map((u) => (
                  <option key={u.uid || u.id} value={u.uid || u.id} className="bg-[#111317]">
                    {u.displayName || u.name || 'Sem nome'} ({u.email || 'Sem email'})
                  </option>
                ))}
              </select>
            </div>

            {/* Verified (Checkbox) */}
            <div className="flex items-center gap-3 pt-6 md:pt-10">
              <input
                type="checkbox"
                id="verified"
                name="verified"
                checked={!!formData.verified}
                onChange={handleCheckboxChange}
                disabled={isSaving}
                className="w-5 h-5 bg-white/5 border border-white/10 rounded focus:ring-brand-blue text-brand-blue cursor-pointer disabled:opacity-50"
              />
              <label htmlFor="verified" className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest cursor-pointer select-none">
                <CheckCircle size={14} className="text-brand-blue" /> Selo Verificada
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-10 border-t border-white/5">
            <button 
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="flex-1 py-4 bg-white/5 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all disabled:opacity-50 cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex-1 py-4 bg-brand-blue text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-blue/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <div className="w-5 h-5 border border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
