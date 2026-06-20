import React from 'react';
import { Company } from '../types';
import { X, Save, Type, AlignLeft, Phone, Link, MapPin, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CompanyEditorProps {
  company: Company;
  onSave: (updatedCompany: Company) => Promise<void>;
  onCancel: () => void;
}

export default function CompanyEditor({ company, onSave, onCancel }: CompanyEditorProps) {
  const [formData, setFormData] = React.useState<Company>({ ...company });
  const [isSaving, setIsSaving] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      await onSave(formData);
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
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Editar Empresa</h2>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">ID: {company.id || 'Nova Empresa'}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
            {/* Address */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <MapPin size={14} /> Endereço Completo
              </label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                required
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                placeholder="Rua, Número, Bairro, Cidade"
              />
            </div>

            {/* Hours */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Clock size={14} /> Horário de Funcionamento (Opcional)
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
