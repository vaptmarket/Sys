import React from 'react';
import { Coupon, Company } from '../types';
import { X, Save, Ticket, Calendar, AlertCircle, Trash2, Building2, AlignLeft, Percent, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface CouponEditorProps {
  coupon: Coupon;
  companies: Company[];
  onSave: (couponData: Coupon) => Promise<void>;
  onCancel: () => void;
}

export default function CouponEditor({ coupon, companies, onSave, onCancel }: CouponEditorProps) {
  const [formData, setFormData] = React.useState<Coupon>({
    ...coupon,
    active: coupon.active !== false, // Default to true
  });
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

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value ? parseInt(value, 10) : undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyId) {
      toast.error('Selecione uma empresa parceira!');
      return;
    }
    if (!formData.code.trim()) {
      toast.error('Insira o código do cupom!');
      return;
    }
    if (!formData.discountValue.trim()) {
      toast.error('Insira o valor do desconto!');
      return;
    }
    if (!formData.expiresAt) {
      toast.error('Insira a data de validade!');
      return;
    }

    setIsSaving(true);
    try {
      // Normalize code to uppercase
      const finalCoupon: Coupon = {
        ...formData,
        code: formData.code.toUpperCase().trim()
      };
      await onSave(finalCoupon);
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast.error(error.message || 'Erro ao salvar o cupom.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="absolute inset-0 cursor-pointer" onClick={onCancel} />
      
      <div className="bg-surface-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
        <div className="sticky top-0 bg-surface-panel/80 backdrop-blur-xl p-8 border-b border-white/5 flex items-center justify-between z-20">
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
              {coupon.id === 'novo' ? 'Adicionar Cupom' : 'Editar Cupom'}
            </h2>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">
              ID: {coupon.id === 'novo' ? 'Novo Cupom' : coupon.id}
            </p>
          </div>
          <button 
            onClick={onCancel}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Code */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Ticket size={14} /> Código do Cupom
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                disabled={isSaving}
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black uppercase tracking-widest focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                placeholder="EX: VAPT50, PROMO20"
              />
            </div>

            {/* Company Association */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Building2 size={14} /> Empresa Parceira
              </label>
              <select
                name="companyId"
                value={formData.companyId}
                onChange={handleChange}
                disabled={isSaving}
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50 appearance-none cursor-pointer"
              >
                <option value="" className="bg-surface-panel text-white">Selecione uma empresa...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id} className="bg-surface-panel text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Discount Value */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Percent size={14} /> Valor do Desconto
              </label>
              <input
                type="text"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleChange}
                disabled={isSaving}
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                placeholder="Ex: 50% de desconto, R$ 20 OFF"
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Calendar size={14} /> Data de Validade
              </label>
              <input
                type="date"
                name="expiresAt"
                value={formData.expiresAt}
                onChange={handleChange}
                disabled={isSaving}
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Usage Limit */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                Limite de Uso (Opcional)
              </label>
              <input
                type="number"
                name="usageLimit"
                value={formData.usageLimit || ''}
                onChange={handleNumberChange}
                disabled={isSaving}
                min={1}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50"
                placeholder="Ex: 100 (deixe vazio para ilimitado)"
              />
            </div>

            {/* Active Switch */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block">
                Status do Cupom
              </label>
              <label className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 cursor-pointer select-none hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleCheckboxChange}
                  disabled={isSaving}
                  className="rounded border-white/10 text-brand-blue focus:ring-brand-blue bg-white/5 h-5 w-5 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">Cupom Ativo e Disponível</span>
                  <span className="text-[10px] text-white/40 font-semibold uppercase tracking-widest">
                    Usuários poderão visualizar e resgatar
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <AlignLeft size={14} /> Descrição / Regras de Uso
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isSaving}
              required
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-blue transition-all disabled:opacity-50 resize-none"
              placeholder="Ex: Válido para todo o cardápio, exceto bebidas. Um uso por CPF."
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-white/5">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-4 rounded-2xl bg-brand-blue hover:bg-brand-blue/90 text-white font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 shadow-lg shadow-brand-blue/20 cursor-pointer disabled:opacity-50"
            >
              <Save size={14} />
              {isSaving ? 'Salvando...' : 'Salvar Cupom'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
