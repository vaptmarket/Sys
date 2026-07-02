import React from 'react';
import { 
  BarChart3, 
  Users, 
  Video, 
  Store, 
  AlertCircle,
  MoreVertical,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  TrendingUp,
  Edit3,
  Star,
  Plus,
  Trash2,
  Tag,
  Settings,
  MessageSquare,
  Eye,
  EyeOff,
  Save,
  Utensils,
  Bed,
  Hotel,
  Upload,
  Image as ImageIcon,
  X,
  Car,
  Wrench,
  ShoppingBag,
  Smartphone,
  HardHat,
  Palmtree,
  Ticket,
  Truck,
  Box,
  ShoppingCart,
  Building2,
  Shirt,
  HelpCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import AdEditor from '../components/AdEditor';
import ModerationCard from '../components/ModerationCard';
import CompanyEditor from '../components/CompanyEditor';
import CouponEditor from '../components/CouponEditor';
import { Ad, Category, Company, Coupon, Sale, WithdrawRequest } from '../types';
import { adService, categoryService, companyService, couponService, settingsService, notificationService, salesService, events, withdrawService } from '../services/mockFirebase';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import { safeFormatDate } from '../utils/date';

const ICON_MAP: Record<string, any> = {
  Utensils,
  Bed,
  Hotel,
  Car,
  Wrench,
  ShoppingBag,
  Smartphone,
  HardHat,
  Palmtree,
  Ticket,
  Truck,
  Box,
  Tag,
  ShoppingCart,
  Building2,
  Shirt,
  HelpCircle
};

const CATEGORY_ICONS_LIST = [
  'Tag',
  'Utensils',
  'Bed',
  'Hotel',
  'Car',
  'Wrench',
  'ShoppingBag',
  'Smartphone',
  'HardHat',
  'Palmtree',
  'Ticket',
  'Truck',
  'Box',
  'ShoppingCart',
  'Building2',
  'Shirt',
  'HelpCircle'
];

export default function Admin() {
  const [activeTab, setActiveTab] = React.useState<'ads' | 'moderation' | 'categories' | 'companies' | 'settings' | 'users' | 'affiliates' | 'coupons'>('ads');
  const [ads, setAds] = React.useState<Ad[]>([]);
  const [categories, setCategories] = React.useState<{ id: string; name: Category | string; icon: string; imageUrl?: string; disabled?: boolean }[]>([]);
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState<string | null>(null);
  const [editingAd, setEditingAd] = React.useState<Ad | null>(null);
  const [newCatName, setNewCatName] = React.useState('');
  const [newCatIcon, setNewCatIcon] = React.useState('Tag');
  const [newCatImageUrl, setNewCatImageUrl] = React.useState('');
  const [isDraggingCreate, setIsDraggingCreate] = React.useState(false);

  // Affiliate & Sales state variables
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [withdraws, setWithdraws] = React.useState<WithdrawRequest[]>([]);
  const [bonusPercent, setBonusPercent] = React.useState<number>(10);
  const [isSavingAffiliateSettings, setIsSavingAffiliateSettings] = React.useState(false);
  const [newSaleAffiliateId, setNewSaleAffiliateId] = React.useState('');
  const [newSaleCompanyId, setNewSaleCompanyId] = React.useState('');
  const [newSaleValue, setNewSaleValue] = React.useState('');
  const [newSaleStatus, setNewSaleStatus] = React.useState<'Pendente' | 'Aguardando Pagamento' | 'Finalizada'>('Pendente');

  // Editing state for categories
  const [editingCatId, setEditingCatId] = React.useState<string | null>(null);
  const [editingCatName, setEditingCatName] = React.useState('');
  const [editingCatIcon, setEditingCatIcon] = React.useState('Tag');
  const [editingCatImageUrl, setEditingCatImageUrl] = React.useState('');
  const [isDraggingEdit, setIsDraggingEdit] = React.useState(false);
  const [editingCatDisabled, setEditingCatDisabled] = React.useState(false);

  const [pendingCompanies, setPendingCompanies] = React.useState<Company[]>([]);
  const [allCompanies, setAllCompanies] = React.useState<Company[]>([]);
  const [editingCompany, setEditingCompany] = React.useState<Company | null>(null);
  const [editingCoupon, setEditingCoupon] = React.useState<Coupon | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'pending' | 'rejected'>('all');
  const [companyStatusFilter, setCompanyStatusFilter] = React.useState<'all' | 'active' | 'pending' | 'rejected'>('all');

  const [platformWhatsapp, setPlatformWhatsapp] = React.useState('');
  const [isSavingSettings, setIsSavingSettings] = React.useState(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger'
  });

  // User Management State and Functions
  const [usersList, setUsersList] = React.useState<any[]>([]);
  const [userSearch, setUserSearch] = React.useState('');
  const [userRoleFilter, setUserRoleFilter] = React.useState<'all' | 'admin' | 'cliente' | 'empresa' | 'user'>('all');
  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<any | null>(null);
  const [userForm, setUserForm] = React.useState({ displayName: '', email: '', password: '', role: 'cliente' as 'admin' | 'cliente' | 'empresa' | 'user' });

  const fetchUsers = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      const querySnapshot = await getDocs(collection(db, 'users'));
      const firestoreUsers: any[] = [];
      querySnapshot.forEach((doc) => {
        firestoreUsers.push({ id: doc.id, ...doc.data() });
      });

      const savedUsersStr = localStorage.getItem('vapt_registered_users');
      const localUsers = savedUsersStr ? JSON.parse(savedUsersStr) : [];

      const mergedMap = new Map<string, any>();

      localUsers.forEach((u: any) => {
        const key = (u.uid || u.email || '').toLowerCase();
        if (key) {
          mergedMap.set(key, { ...u, source: 'local' });
        }
      });

      firestoreUsers.forEach((u: any) => {
        const key = (u.uid || u.id || u.email || '').toLowerCase();
        if (key) {
          const existing = mergedMap.get(key);
          mergedMap.set(key, {
            uid: u.uid || u.id,
            email: u.email,
            displayName: u.displayName || 'Usuário Vapt',
            role: u.role || 'cliente',
            createdAt: u.createdAt || Date.now(),
            password: existing?.password || '123',
            source: 'firestore'
          });
        }
      });

      const list = Array.from(mergedMap.values());
      setUsersList(list);
    } catch (err) {
      console.error('Error fetching users:', err);
      const savedUsersStr = localStorage.getItem('vapt_registered_users');
      const localUsers = savedUsersStr ? JSON.parse(savedUsersStr) : [];
      setUsersList(localUsers.map((u: any) => ({ ...u, source: 'local' })));
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.displayName.trim() || !userForm.email.trim()) {
      toast.error('Nome e E-mail são obrigatórios!');
      return;
    }

    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');

      const isEdit = !!editingUser;
      const targetUid = isEdit ? editingUser.uid : 'user_' + Date.now();

      const userData = {
        uid: targetUid,
        displayName: userForm.displayName.trim(),
        email: userForm.email.trim().toLowerCase(),
        role: userForm.role,
        createdAt: isEdit ? (editingUser.createdAt || Date.now()) : Date.now()
      };

      try {
        const userDocRef = doc(db, 'users', targetUid);
        await setDoc(userDocRef, userData, { merge: true });
      } catch (fsErr) {
        console.warn('Could not write to Firestore collection: ', fsErr);
      }

      const savedUsersStr = localStorage.getItem('vapt_registered_users');
      let registeredUsers = savedUsersStr ? JSON.parse(savedUsersStr) : [];

      const idx = registeredUsers.findIndex((u: any) => u.uid === targetUid || u.email.toLowerCase() === userData.email);
      const userPassword = isEdit ? (editingUser.password || '123') : (userForm.password || '123');

      if (idx !== -1) {
        registeredUsers[idx] = {
          ...registeredUsers[idx],
          ...userData,
          password: userPassword
        };
      } else {
        registeredUsers.push({
          ...userData,
          password: userPassword
        });
      }
      localStorage.setItem('vapt_registered_users', JSON.stringify(registeredUsers));

      toast.success(isEdit ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!');
      setIsUserModalOpen(false);
      setEditingUser(null);
      setUserForm({ displayName: '', email: '', password: '', role: 'cliente' });
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar usuário.');
    }
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remover Usuário',
      message: `Tem certeza que deseja remover o usuário "${email}"? Esta ação não pode ser desfeita.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const { doc, deleteDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');

          try {
            await deleteDoc(doc(db, 'users', uid));
          } catch (fsErr) {
            console.warn('Could not delete from Firestore: ', fsErr);
          }

          const savedUsersStr = localStorage.getItem('vapt_registered_users');
          if (savedUsersStr) {
            let registeredUsers = JSON.parse(savedUsersStr);
            registeredUsers = registeredUsers.filter((u: any) => u.uid !== uid && u.email !== email);
            localStorage.setItem('vapt_registered_users', JSON.stringify(registeredUsers));
          }

          toast.success('Usuário removido com sucesso!');
          fetchUsers();
        } catch (err: any) {
          toast.error(err?.message || 'Erro ao remover usuário.');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const fetchSales = async () => {
    try {
      const data = await salesService.getAll();
      setSales(data);
    } catch (e) {
      console.error('Error fetching sales:', e);
    }
  };

  const fetchWithdraws = async () => {
    try {
      const data = await withdrawService.getAll();
      setWithdraws(data);
    } catch (e) {
      console.error('Error fetching withdraws:', e);
    }
  };

  const handleUpdateWithdrawStatus = async (id: string, status: 'Pendente' | 'Aprovado' | 'Recusado') => {
    try {
      await withdrawService.updateStatus(id, status);
      toast.success(`Status da solicitação atualizado para: ${status}!`);
      await fetchWithdraws();
    } catch (err) {
      console.error('Error updating withdraw status:', err);
      toast.error('Erro ao atualizar status da solicitação.');
    }
  };

  const handleSaveAffiliateSettings = async (percent: number) => {
    setIsSavingAffiliateSettings(true);
    try {
      await settingsService.updateSettings({ 
        platformWhatsapp, 
        companyReferralBonusPercent: percent 
      });
      setBonusPercent(percent);
      toast.success('Percentual de bônus atualizado com sucesso!');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao atualizar percentual de bônus.');
    } finally {
      setIsSavingAffiliateSettings(false);
    }
  };

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSaleAffiliateId) {
      toast.error('Selecione um afiliado!');
      return;
    }
    if (!newSaleCompanyId) {
      toast.error('Selecione a empresa indicada!');
      return;
    }
    const val = parseFloat(newSaleValue);
    if (isNaN(val) || val <= 0) {
      toast.error('Informe um valor de venda válido!');
      return;
    }

    const affiliate = usersList.find(u => u.uid === newSaleAffiliateId || u.id === newSaleAffiliateId);
    const company = allCompanies.find(c => c.id === newSaleCompanyId);

    if (!affiliate) {
      toast.error('Afiliado não encontrado!');
      return;
    }
    if (!company) {
      toast.error('Empresa não encontrada!');
      return;
    }

    const calculatedBonus = parseFloat((val * (bonusPercent / 100)).toFixed(2));

    try {
      await salesService.create({
        affiliateId: affiliate.uid || affiliate.id,
        affiliateName: affiliate.displayName || affiliate.name || 'Afiliado',
        companyId: company.id,
        companyName: company.name,
        saleValue: val,
        bonusPercent: bonusPercent,
        bonusValue: calculatedBonus,
        status: newSaleStatus,
        createdAt: Date.now()
      });
      toast.success('Venda adicionada com sucesso!');
      setNewSaleValue('');
      setNewSaleAffiliateId('');
      setNewSaleCompanyId('');
      setNewSaleStatus('Pendente');
      fetchSales();
    } catch (err: any) {
      toast.error('Erro ao adicionar venda.');
    }
  };

  const handleUpdateSaleStatus = async (saleId: string, status: 'Pendente' | 'Aguardando Pagamento' | 'Finalizada') => {
    try {
      await salesService.updateStatus(saleId, status);
      toast.success('Status da venda atualizado!');
      fetchSales();
    } catch (err) {
      toast.error('Erro ao atualizar status.');
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Venda',
      message: 'Tem certeza que deseja excluir este registro de venda?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await salesService.delete(saleId);
          toast.success('Registro de venda removido!');
          fetchSales();
        } catch (err) {
          toast.error('Erro ao remover venda.');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  React.useEffect(() => {
    settingsService.getSettings().then(s => {
      setPlatformWhatsapp(s.platformWhatsapp);
      setBonusPercent(s.companyReferralBonusPercent !== undefined ? s.companyReferralBonusPercent : 10);
    });
    fetchSales();
    fetchWithdraws();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformWhatsapp.trim()) {
      toast.error('O link do WhatsApp não pode ser vazio!');
      return;
    }
    if (!platformWhatsapp.startsWith('http://') && !platformWhatsapp.startsWith('https://')) {
      toast.error('O link deve ser um endereço de URL válido (começando com http:// ou https://)');
      return;
    }
    setIsSavingSettings(true);
    try {
      await settingsService.updateSettings({ platformWhatsapp: platformWhatsapp.trim() });
      toast.success('Configurações salvas com sucesso!');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar configurações.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  React.useEffect(() => {
    const unsubscribe = adService.subscribeAds((data) => {
      setAds(data);
    });
    
    categoryService.getAll().then(data => {
      setCategories(data);
    });

    couponService.getAll().then(data => {
      setCoupons(data);
    });

    companyService.getPending().then(data => {
      setPendingCompanies(data);
    });

    companyService.getAll().then(data => {
      setAllCompanies(data);
      setIsLoading(false);
    });

    fetchUsers();

    return () => unsubscribe();
  }, []);

  const handleCategoryFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem é muito grande! Escolha um arquivo de até 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (isEdit) {
          setEditingCatImageUrl(base64String);
        } else {
          setNewCatImageUrl(base64String);
        }
        toast.success('Imagem carregada com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCategoryDrop = (e: React.DragEvent, isEdit: boolean) => {
    e.preventDefault();
    if (isEdit) {
      setIsDraggingEdit(false);
    } else {
      setIsDraggingCreate(false);
    }
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, envie um arquivo de imagem válido (PNG, JPG, JPEG, WebP).');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem é muito grande! Escolha uma imagem de até 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (isEdit) {
          setEditingCatImageUrl(base64String);
        } else {
          setNewCatImageUrl(base64String);
        }
        toast.success('Imagem carregada com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      toast.error('O nome da categoria não pode ser vazio!');
      return;
    }

    const exists = categories.some(cat => cat.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      toast.error('Essa categoria já existe!');
      return;
    }

    const loadId = toast.loading('Adicionando nova categoria...');
    try {
      const id = await categoryService.create(trimmed, newCatIcon, newCatImageUrl.trim());
      setCategories(prev => [...prev, { id, name: trimmed, icon: newCatIcon, imageUrl: newCatImageUrl.trim(), disabled: false }]);
      setNewCatName('');
      setNewCatIcon('Tag');
      setNewCatImageUrl('');
      toast.success('Categoria criada com sucesso!', { id: loadId });
    } catch (err) {
      console.error(err);
      toast.error('Ocorreu um erro ao criar a categoria.', { id: loadId });
    }
  };

  const handleStartEditCategory = (cat: { id: string; name: Category | string; icon: string; imageUrl?: string; disabled?: boolean }) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
    setEditingCatIcon(cat.icon);
    setEditingCatImageUrl(cat.imageUrl || '');
    setEditingCatDisabled(!!cat.disabled);
  };

  const handleCancelEditCategory = () => {
    setEditingCatId(null);
  };

  const handleSaveCategoryEdit = async (id: string) => {
    const trimmed = editingCatName.trim();
    if (!trimmed) {
      toast.error('O nome da categoria não pode ser vazio!');
      return;
    }

    const loadId = toast.loading('Atualizando categoria...');
    try {
      await categoryService.update(id, trimmed, editingCatIcon, editingCatImageUrl.trim(), editingCatDisabled);
      
      setCategories(prev => prev.map(c => c.id === id ? {
        ...c,
        name: trimmed,
        icon: editingCatIcon,
        imageUrl: editingCatImageUrl.trim(),
        disabled: editingCatDisabled
      } : c));

      setEditingCatId(null);
      toast.success('Categoria atualizada com sucesso!', { id: loadId });
    } catch (err) {
      console.error(err);
      toast.error('Ocorreu um erro ao salvar as alterações da categoria.', { id: loadId });
    }
  };

  const handleToggleCategoryDisabled = async (id: string, name: string, currentDisabled: boolean) => {
    const targetStatus = !currentDisabled;
    const loadId = toast.loading(targetStatus ? 'Desativando categoria...' : 'Ativando categoria...');
    try {
      // Find current cat details to keep other parameters identical
      const cat = categories.find(c => c.id === id);
      if (cat) {
        await categoryService.update(id, cat.name, cat.icon, cat.imageUrl, targetStatus);
        setCategories(prev => prev.map(c => c.id === id ? { ...c, disabled: targetStatus } : c));
        toast.success(targetStatus ? 'Categoria desativada da busca!' : 'Categoria ativada e visível!', { id: loadId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao alterar status da categoria.', { id: loadId });
    }
  };

  const handleRemoveCategory = async (id: string, name: Category | string) => {
    try {
      // Safety check: is any ad using this category?
      const hasAds = ads.some(ad => ad.category === name);
      if (hasAds) {
        toast.error(`Não é possível remover "${name}": existem anúncios vinculados.`);
        return;
      }

      await categoryService.remove(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Categoria removida');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover categoria');
    }
  };

  const stats = [
    { label: 'Anúncios Ativos', value: ads.filter(a => a.status === 'active').length.toLocaleString(), change: '+12%', icon: Video, color: 'text-brand-blue' },
    { label: 'Empresas Registradas', value: ads.reduce((acc, ad) => acc.add(ad.companyId), new Set<string>()).size.toString(), change: '+5%', icon: Store, color: 'text-brand-orange' },
    { label: 'Total de Visualizações', value: (ads.reduce((acc, ad) => acc + (ad.views || 0), 0) / 1000).toFixed(1) + 'k', change: '+25%', icon: TrendingUp, color: 'text-brand-green' },
    { 
      label: 'Visitas Únicas', 
      value: (ads.reduce((acc, ad) => acc + (ad.views || 0), 0) * 0.45 / 1000).toFixed(1) + 'k', 
      change: '+8%', 
      icon: Users, 
      color: 'text-purple-500' 
    },
  ];

  const [sortConfig, setSortConfig] = React.useState<{
    key: 'companyName' | 'title' | 'status' | 'featured' | 'startDate' | 'expiresAt' | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  const handleSort = (key: 'companyName' | 'title' | 'status' | 'featured' | 'startDate' | 'expiresAt') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAdsShow = React.useMemo(() => {
    const filtered = ads.filter(ad => statusFilter === 'all' || ad.status === statusFilter);
    if (!sortConfig.key) return filtered;

    return [...filtered].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortConfig.key === 'startDate') {
        const parseDate = (dStr: string | undefined, fallback: number) => {
          if (!dStr) return fallback;
          const parsed = Date.parse(dStr);
          if (!isNaN(parsed)) return parsed;
          const parts = dStr.split('/');
          if (parts.length === 3) {
            const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            if (!isNaN(d.getTime())) return d.getTime();
          }
          return fallback;
        };
        aVal = parseDate(a.startDate, a.createdAt || 0);
        bVal = parseDate(b.startDate, b.createdAt || 0);
      } else if (sortConfig.key === 'expiresAt') {
        aVal = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
        bVal = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
      } else if (sortConfig.key === 'featured') {
        aVal = a.featured ? 1 : 0;
        bVal = b.featured ? 1 : 0;
      } else {
        aVal = (a[sortConfig.key] || '').toString().toLowerCase();
        bVal = (b[sortConfig.key] || '').toString().toLowerCase();
      }

      if (aVal < bVal) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [ads, statusFilter, sortConfig]);

  const renderSortIndicator = (key: 'companyName' | 'title' | 'status' | 'featured' | 'startDate' | 'expiresAt') => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown size={10} className="text-white/10 opacity-0 group-hover:opacity-100 transition-opacity ml-1 inline-block" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={10} className="text-brand-blue ml-1 inline-block" />
    ) : (
      <ArrowDown size={10} className="text-brand-blue ml-1 inline-block" />
    );
  };

  const pendingAds = ads.filter(ad => ad.status === 'pending');

  const handleUpdateAdStatus = async (id: string, newStatus: 'active' | 'pending' | 'rejected') => {
    setIsProcessing(id);
    const loadId = toast.loading('Atualizando status...');
    try {
      await adService.updateStatus(id, newStatus);
      toast.success('Status atualizado!', { id: loadId });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Ocorreu um erro ao salvar as informações localmente. Verifique o limite de armazenamento do navegador!', { id: loadId });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleApproveAd = async (id: string) => {
    setIsProcessing(id);
    const loadId = toast.loading('Aprovando anúncio...');
    try {
      await adService.updateStatus(id, 'active');
      const ad = ads.find(a => a.id === id);
      if (ad) {
        await notificationService.add(
          'Anúncio Aprovado',
          `Seu anúncio "${ad.title}" foi aprovado pelos administradores e já está ativo!`,
          'approval'
        );
      }
      toast.success('Anúncio aprovado!', { id: loadId });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Ocorreu um erro ao salvar as informações localmente. Verifique o limite de armazenamento do navegador!', { id: loadId });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRejectAd = async (id: string) => {
    setIsProcessing(id);
    const loadId = toast.loading('Rejeitando anúncio...');
    try {
      await adService.updateStatus(id, 'rejected');
      const ad = ads.find(a => a.id === id);
      if (ad) {
        await notificationService.add(
          'Anúncio Rejeitado',
          `Infelizmente, seu anúncio "${ad.title}" não atende às nossas diretrizes e foi rejeitado.`,
          'approval'
        );
      }
      toast.success('Anúncio rejeitado', { id: loadId });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Ocorreu um erro ao salvar as informações localmente. Verifique o limite de armazenamento do navegador!', { id: loadId });
    } finally {
      setIsProcessing(null);
    }
  };
  
  const handleDeleteAd = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Anúncio',
      message: 'Tem certeza que deseja excluir permanentemente este anúncio? Esta ação não pode ser desfeita.',
      variant: 'danger',
      onConfirm: async () => {
        setIsProcessing(id);
        const loadId = toast.loading('Excluindo anúncio...');
        try {
          await adService.delete(id);
          toast.success('Anúncio excluído!', { id: loadId });
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          console.error(err);
          toast.error(err?.message || 'Ocorreu um erro ao salvar as informações localmente. Verifique o limite de armazenamento do navegador!', { id: loadId });
        } finally {
          setIsProcessing(null);
        }
      }
    });
  };

  const handleSaveAd = async (adData: Ad) => {
    const loadId = toast.loading('Salvando anúncio...');
    try {
      await adService.create(adData);
      if (adData.id) {
        toast.success('Anúncio atualizado com sucesso!', { id: loadId });
      } else {
        toast.success('Anúncio criado com sucesso!', { id: loadId });
      }
      setEditingAd(null);
    } catch (error: any) {
      console.error('Error saving ad:', error);
      toast.error(error?.message || 'Ocorreu um erro ao salvar as informações localmente. Verifique o limite de armazenamento do navegador!', { id: loadId });
    }
  };

  const handleNewAd = () => {
    setEditingAd({
      id: '',
      companyId: 'admin',
      companyName: 'Minha Empresa',
      companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=100&q=80',
      title: '',
      videoUrl: '',
      thumbnail: '',
      category: categories[0]?.name || 'Restaurantes',
      city: '',
      price: 0,
      whatsappLink: '',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 0,
      shares: 0,
      saved: 0,
    } as Ad);
  };

  const handleToggleFeatured = async (adId: string, currentFeatured: boolean) => {
    try {
      const newStatus = !currentFeatured;
      await adService.updateFeatured(adId, newStatus);
      setAds(prev => prev.map(a => a.id === adId ? { ...a, featured: newStatus } : a));
    } catch (error: any) {
      console.error('Error toggling featured status:', error);
      toast.error(error?.message || 'Ocorreu um erro ao salvar as informações localmente. Verifique o limite de armazenamento do navegador!');
    }
  };

  const handleApproveCompany = async (id: string) => {
    setIsProcessing(id);
    const loadId = toast.loading('Aprovando empresa...');
    try {
      await companyService.updateStatus(id, 'active');
      const comp = allCompanies.find(c => c.id === id) || pendingCompanies.find(c => c.id === id);
      if (comp) {
        await notificationService.add(
          'Empresa Aprovada',
          `A empresa "${comp.name}" foi aprovada para anunciar na nossa plataforma!`,
          'approval'
        );
      }
      setPendingCompanies(prev => prev.filter(c => c.id !== id));
      setAllCompanies(prev => prev.map(c => c.id === id ? { ...c, status: 'active', verified: true } : c));
      toast.success('Empresa aprovada!', { id: loadId });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Ocorreu um erro ao salvar as informações localmente. Verifique o limite de armazenamento do navegador!', { id: loadId });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRejectCompany = async (id: string) => {
    setIsProcessing(id);
    const loadId = toast.loading('Rejeitando empresa...');
    try {
      await companyService.updateStatus(id, 'rejected');
      const comp = allCompanies.find(c => c.id === id) || pendingCompanies.find(c => c.id === id);
      if (comp) {
        await notificationService.add(
          'Parceria Rejeitada',
          `Lamentamos, mas o registro da empresa "${comp.name}" não atende às nossas diretrizes e foi rejeitado.`,
          'approval'
        );
      }
      setPendingCompanies(prev => prev.filter(c => c.id !== id));
      setAllCompanies(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c));
      toast.success('Empresa rejeitada', { id: loadId });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Ocorreu um erro ao salvar as informações localmente. Verifique o limite de armazenamento do navegador!', { id: loadId });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Empresa',
      message: 'Tem certeza que deseja excluir permanentemente esta empresa? Todos os anúncios vinculados serão removidos.',
      variant: 'danger',
      onConfirm: async () => {
        setIsProcessing(id);
        const loadId = toast.loading('Excluindo empresa...');
        try {
          await companyService.delete(id);
          setPendingCompanies(prev => prev.filter(c => c.id !== id));
          setAllCompanies(prev => prev.filter(c => c.id !== id));
          toast.success('Empresa excluída!', { id: loadId });
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          console.error(err);
          toast.error(err?.message || 'Ocorreu um erro ao salvar as informações localmente. Verifique o limite de armazenamento do navegador!', { id: loadId });
        } finally {
          setIsProcessing(null);
        }
      }
    });
  };

  const handleSaveCompany = async (companyData: Company) => {
    const loadId = toast.loading('Salvando empresa...');
    try {
      const isNew = !companyData.id || companyData.id === 'nova' || !allCompanies.some(c => c.id === companyData.id);
      const id = await companyService.create(companyData);
      const finalCompany = { ...companyData, id };

      if (isNew) {
        setAllCompanies(prev => [finalCompany, ...prev]);
        if (finalCompany.status === 'pending') {
          setPendingCompanies(prev => [finalCompany, ...prev]);
        }
      } else {
        setAllCompanies(prev => prev.map(c => c.id === companyData.id ? finalCompany : c));
        setPendingCompanies(prev => prev.map(c => c.id === companyData.id ? finalCompany : c));
      }

      toast.success(isNew ? 'Empresa adicionada com sucesso!' : 'Empresa atualizada com sucesso!', { id: loadId });
      setEditingCompany(null);
    } catch (error: any) {
      console.error('Error saving company:', error);
      toast.error(error?.message || 'Ocorreu um erro ao salvar as informações localmente. Verifique o limite de armazenamento do navegador!', { id: loadId });
    }
  };

  const handleSaveCoupon = async (couponData: Coupon) => {
    const loadId = toast.loading('Salvando cupom...');
    try {
      const isNew = !couponData.id || couponData.id === 'novo' || !coupons.some(c => c.id === couponData.id);
      const id = await couponService.create(couponData);
      const finalCoupon = { ...couponData, id };

      if (isNew) {
        setCoupons(prev => [finalCoupon, ...prev]);
      } else {
        setCoupons(prev => prev.map(c => c.id === couponData.id ? finalCoupon : c));
      }

      toast.success(isNew ? 'Cupom adicionado com sucesso!' : 'Cupom atualizado com sucesso!', { id: loadId });
      setEditingCoupon(null);
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast.error(error?.message || 'Erro ao salvar cupom.', { id: loadId });
    }
  };

  const handleDeleteCoupon = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Cupom',
      message: 'Tem certeza que deseja excluir permanentemente este cupom? Esta ação não pode ser desfeita.',
      variant: 'danger',
      onConfirm: async () => {
        const loadId = toast.loading('Excluindo cupom...');
        try {
          await couponService.delete(id);
          setCoupons(prev => prev.filter(c => c.id !== id));
          toast.success('Cupom excluído com sucesso!', { id: loadId });
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error: any) {
          console.error('Error deleting coupon:', error);
          toast.error(error?.message || 'Erro ao excluir o cupom.', { id: loadId });
        }
      }
    });
  };

  const handleToggleCouponStatus = async (coupon: Coupon) => {
    const loadId = toast.loading(coupon.active === false ? 'Ativando cupom...' : 'Desativando cupom...');
    try {
      const updatedCoupon = {
        ...coupon,
        active: coupon.active === false
      };
      await couponService.create(updatedCoupon);
      setCoupons(prev => prev.map(c => c.id === coupon.id ? updatedCoupon : c));
      toast.success(updatedCoupon.active ? 'Cupom ativado com sucesso!' : 'Cupom desativado com sucesso!', { id: loadId });
    } catch (error: any) {
      console.error('Error toggling coupon status:', error);
      toast.error(error?.message || 'Erro ao alterar status do cupom.', { id: loadId });
    }
  };

  return (
    <div className="py-6">
      <header className="mb-12 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
           <h1 className="text-3xl md:text-4xl font-black font-display text-white italic tracking-tighter uppercase leading-none">Painel Central</h1>
           <p className="text-white/40 font-semibold uppercase tracking-widest text-[10px] mt-2">Área Administrativa • Vapt Market</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white">Super Admin</p>
            <p className="text-[10px] text-brand-orange font-bold uppercase tracking-widest">Master Access</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <AlertCircle size={20} className="text-white/40" />
          </div>
        </motion.div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'ads', label: 'Anúncios', icon: Video },
          { id: 'moderation', label: 'Moderação', icon: CheckCircle },
          { id: 'companies', label: 'Empresas', icon: Store },
          { id: 'categories', label: 'Canais (Categorias)', icon: Tag },
          { id: 'coupons', label: 'Cupons', icon: Ticket },
          { id: 'users', label: 'Usuários', icon: Users },
          { id: 'affiliates', label: 'Afiliados', icon: TrendingUp },
          { id: 'settings', label: 'Ajustes', icon: Settings },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20" 
                : "bg-white/5 text-white/40 hover:bg-white/10"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((s, i) => (
          <motion.div 
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#111317] p-6 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] -mr-12 -mt-12 rounded-full transition-all group-hover:scale-150" />
            <div className={cn("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 transition-transform group-hover:rotate-12", s.color)}>
              <s.icon size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{s.label}</p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-black text-white">{s.value}</h3>
              <span className="text-[10px] font-black text-brand-green mb-1 flex items-center gap-1 bg-brand-green/10 px-2 py-0.5 rounded-full">
                 <ArrowUpRight size={10} />
                 {s.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Dynamic Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'ads' && (
          <motion.div 
            key="ads" 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }}
            className="bg-[#111317] rounded-[3rem] border border-white/5 overflow-hidden"
          >
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-2">Últimos Anúncios</h3>
                <div className="flex items-center gap-2">
                  {['all', 'active', 'pending', 'rejected'].map((s) => (
                    <button 
                      key={s}
                      onClick={() => setStatusFilter(s as any)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all border",
                        statusFilter === s 
                          ? "bg-white/10 border-white/20 text-white" 
                          : "bg-transparent border-transparent text-white/20 hover:text-white"
                      )}
                    >
                      {s === 'all' ? 'Todos' : s === 'active' ? 'Ativos' : s === 'pending' ? 'Pendentes' : 'Rejeitados'}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={handleNewAd}
                className="px-6 py-3 bg-brand-blue text-white font-black uppercase tracking-widest text-[10px] rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-blue/20 hover:scale-[1.02] active:scale-95 transition-all self-start md:self-auto"
              >
                <Plus size={14} />
                Novo Anúncio
              </button>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="text-[10px] font-black text-white/20 uppercase tracking-widest text-left select-none">
                    <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort('companyName')}>
                      <span className="flex items-center gap-1">
                        Empresa {renderSortIndicator('companyName')}
                      </span>
                    </th>
                    <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort('title')}>
                      <span className="flex items-center gap-1">
                        Título {renderSortIndicator('title')}
                      </span>
                    </th>
                    <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort('status')}>
                      <span className="flex items-center gap-1">
                        Status {renderSortIndicator('status')}
                      </span>
                    </th>
                    <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort('featured')}>
                      <span className="flex items-center gap-1">
                        Destaque {renderSortIndicator('featured')}
                      </span>
                    </th>
                    <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort('startDate')}>
                      <span className="flex items-center gap-1">
                        Início {renderSortIndicator('startDate')}
                      </span>
                    </th>
                    <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort('expiresAt')}>
                      <span className="flex items-center gap-1">
                        Vencimento {renderSortIndicator('expiresAt')}
                      </span>
                    </th>
                    <th className="px-4 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAdsShow.map((ad, idx) => (
                    <motion.tr 
                      key={ad.id} 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-6">
                        <div className="flex items-center gap-3">
                          <img src={ad.companyLogo} className="w-10 h-10 rounded-xl object-cover" alt="" />
                          <div>
                            <p className="text-xs font-bold text-white mb-0.5">{ad.companyName}</p>
                            <p className="text-[10px] text-white/40 font-medium">{ad.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <div className="max-w-[180px] md:max-w-[240px]">
                          <p className="text-xs font-bold text-white line-clamp-2" title={ad.title}>
                            {ad.title}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <div className="relative group/status">
                          <select 
                            value={ad.status}
                            disabled={isProcessing === ad.id}
                            onChange={(e) => handleUpdateAdStatus(ad.id, e.target.value as any)}
                            className={cn(
                              "appearance-none text-[9px] font-black uppercase tracking-widest px-8 py-2 rounded-full cursor-pointer transition-all border-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111317] disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-[120px]",
                              ad.status === 'active' ? "bg-brand-green/10 text-brand-green focus:ring-brand-green" : 
                              ad.status === 'pending' ? "bg-brand-orange/10 text-brand-orange focus:ring-brand-orange" : 
                              "bg-rose-500/10 text-rose-500 focus:ring-rose-500"
                            )}
                          >
                            <option value="active" className="bg-[#111317] text-brand-green font-bold uppercase">Ativo</option>
                            <option value="pending" className="bg-[#111317] text-brand-orange font-bold uppercase">Pendente</option>
                            <option value="rejected" className="bg-[#111317] text-rose-500 font-bold uppercase">Rejeitado</option>
                          </select>
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors">
                            {ad.status === 'active' && <CheckCircle size={10} className="text-brand-green" />}
                            {ad.status === 'pending' && <AlertCircle size={10} className="text-brand-orange" />}
                            {ad.status === 'rejected' && <XCircle size={10} className="text-rose-500" />}
                          </div>
                          {isProcessing === ad.id ? (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="w-2 h-2 border border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                          ) : (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 transition-opacity group-hover/status:opacity-100">
                              <MoreVertical size={10} className="text-white" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <button 
                          onClick={() => handleToggleFeatured(ad.id, !!ad.featured)}
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            ad.featured ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/20" : "bg-white/5 text-white/20 hover:bg-white/10"
                          )}
                          title={ad.featured ? "Remover dos Destaques" : "Marcar como Destaque"}
                        >
                          <Star size={14} fill={ad.featured ? "currentColor" : "none"} />
                        </button>
                      </td>
                      <td className="px-4 py-6">
                        <span className="text-[10px] font-bold text-white/40">
                          {ad.startDate && ad.startDate.split('-').length === 3 
                            ? `${ad.startDate.split('-')[2]}/${ad.startDate.split('-')[1]}/${ad.startDate.split('-')[0]}` 
                            : safeFormatDate(ad.createdAt || Date.now())}
                        </span>
                      </td>
                      <td className="px-4 py-6">
                        <span className="text-[10px] font-bold text-white/40">{safeFormatDate(ad.expiresAt)}</span>
                      </td>
                      <td className="px-4 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingAd(ad)}
                            className="text-white/20 hover:text-brand-blue transition-colors p-2"
                            title="Editar"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteAd(ad.id)}
                            className="text-white/10 hover:text-rose-500 transition-colors p-2"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'moderation' && (
          <motion.div 
            key="moderation"
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="bg-[#111317] rounded-[3rem] border border-white/5 overflow-hidden">
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Empresas Pendentes</h3>
                <span className="text-[10px] font-black text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full uppercase tracking-widest">{pendingCompanies.length} Aguardando</span>
              </div>
              <div className="p-8 space-y-6">
                <AnimatePresence mode="popLayout">
                  {pendingCompanies.map((c) => (
                    <ModerationCard 
                      key={c.id}
                      id={c.id}
                      name={c.name}
                      time="Recentemente"
                      onApprove={() => handleApproveCompany(c.id)}
                      onReject={() => handleRejectCompany(c.id)}
                      onDelete={() => handleDeleteCompany(c.id)}
                      isLoading={isProcessing === c.id}
                    />
                  ))}
                  {pendingCompanies.length === 0 && (
                    <motion.div 
                      key="no-companies"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-12 text-center"
                    >
                      <p className="text-white/20 font-bold uppercase tracking-widest text-[10px]">Tudo em dia!</p>
                      <p className="text-white/40 text-xs mt-1">Nenhuma empresa pendente para moderação.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="bg-[#111317] rounded-[3rem] border border-white/5 overflow-hidden">
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Anúncios Pendentes</h3>
                <span className="text-[10px] font-black text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full uppercase tracking-widest">{pendingAds.length} Aguardando</span>
              </div>
              <div className="p-8 space-y-6">
                <AnimatePresence mode="popLayout">
                  {pendingAds.map((ad) => (
                    <ModerationCard 
                      key={ad.id}
                      id={ad.id}
                      name={ad.title}
                      subtitle={ad.companyName}
                      time="Recente"
                      onApprove={() => handleApproveAd(ad.id)}
                      onReject={() => handleRejectAd(ad.id)}
                      onDelete={() => handleDeleteAd(ad.id)}
                      isLoading={isProcessing === ad.id}
                    />
                  ))}
                  {pendingAds.length === 0 && (
                    <motion.div 
                      key="no-ads"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-12 text-center"
                    >
                      <p className="text-white/20 font-bold uppercase tracking-widest text-[10px]">Sem solicitações</p>
                      <p className="text-white/40 text-xs mt-1">Nenhum anúncio aguardando aprovação.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'categories' && (
          <motion.div 
            key="categories"
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }}
            className="bg-[#111317] rounded-[3rem] border border-white/5 overflow-hidden font-sans"
          >
            {/* Criar Categoria Form */}
            <div className="p-8 border-b border-white/5 bg-white/[0.01]">
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                <Plus className="text-brand-blue" size={20} />
                Nova Categoria
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                {/* Nome & Icones */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-wider mb-2">Nome da Categoria</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Culinária Japonesa, Farmácias..." 
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                    />
                  </div>

                  {/* Icon selection inside Col 1 */}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-wider mb-3">Ícone Representativo</label>
                    <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-6 gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl max-h-36 overflow-y-auto no-scrollbar">
                      {CATEGORY_ICONS_LIST.map((icName) => {
                        const IconComponent = ICON_MAP[icName] || Tag;
                        const isSelected = newCatIcon === icName;
                        return (
                          <button
                            key={icName}
                            onClick={() => setNewCatIcon(icName)}
                            title={icName}
                            type="button"
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-all border",
                              isSelected 
                                ? "bg-brand-blue border-brand-blue text-white shadow-lg shadow-brand-blue/35 scale-110" 
                                : "bg-white/5 border-transparent text-white/60 hover:text-white hover:bg-white/10"
                            )}
                          >
                            <IconComponent size={18} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Imagem de Destaque (URL + File Upload Drag & Drop) */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-wider mb-2">Imagem de Destaque da Categoria</label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* URL input */}
                      <div className="flex flex-col justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div>
                          <span className="text-[9px] font-black uppercase text-brand-blue tracking-widest block mb-1">Opção A: Por Endereço (URL)</span>
                          <p className="text-white/40 text-[11px] mb-3 leading-relaxed">Insira um link direto de imagem pública da internet (Ex: Unsplash, Pexels).</p>
                        </div>
                        <input 
                          type="url" 
                          placeholder="https://images.unsplash.com/..." 
                          value={newCatImageUrl}
                          onChange={(e) => setNewCatImageUrl(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                        />
                      </div>

                      {/* File Upload drag and drop zone */}
                      <div 
                        onDragOver={handleCategoryDragOver}
                        onDragLeave={() => setIsDraggingCreate(false)}
                        onDrop={(e) => handleCategoryDrop(e, false)}
                        onDragEnter={() => setIsDraggingCreate(true)}
                        className={cn(
                          "relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-2xl transition-all cursor-pointer group text-center min-h-[140px]",
                          isDraggingCreate 
                            ? "border-brand-blue bg-brand-blue/10 scale-[1.02]" 
                            : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                        )}
                        onClick={() => document.getElementById('new-cat-file-input')?.click()}
                      >
                        <input 
                          type="file" 
                          id="new-cat-file-input"
                          onChange={(e) => handleCategoryFileChange(e, false)}
                          accept="image/*"
                          className="hidden"
                        />
                        
                        {newCatImageUrl && newCatImageUrl.startsWith('data:') ? (
                          <div className="absolute inset-0 rounded-2xl overflow-hidden">
                            <img src={newCatImageUrl} alt="Preview" className="w-full h-full object-cover opacity-25" />
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-2">
                              <ImageIcon size={20} className="text-brand-green mb-1 animate-pulse" />
                              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Imagem Carregada!</span>
                              <span className="text-[9px] text-white/50">Toque p/ alterar</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewCatImageUrl('');
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white/80 hover:text-rose-400 hover:bg-black/80 transition-all"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="text-white/40 group-hover:text-brand-blue transition-colors mb-2" size={24} />
                            <span className="text-[10px] font-black uppercase text-white/80 tracking-wider">Opção B: Enviar Arquivo</span>
                            <span className="text-[9px] text-white/40 mt-1">Arraste a imagem ou clique para selecionar</span>
                            <span className="text-[8px] text-white/30 tracking-widest mt-0.5 uppercase">(Máx: 2MB • PNG/JPG/WebP)</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tiny live preview if any image is loaded (URL or converted to Base64) */}
                  {newCatImageUrl && (
                    <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 rounded-lg bg-black/50 overflow-hidden border border-white/10">
                          <img src={newCatImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-white/60 tracking-wider block">Visualização do Banner</span>
                          <span className="text-[9px] text-white/30 truncate max-w-[200px] block">
                            {newCatImageUrl.startsWith('data:') ? 'Arquivo Base64 (.png/.jpg)' : newCatImageUrl}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewCatImageUrl('')}
                        className="p-2 text-rose-500 hover:bg-rose-500/15 rounded-xl transition-colors text-[9px] font-black uppercase tracking-widest flex items-center gap-1"
                      >
                        <X size={12} />
                        Limpar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={handleAddCategory}
                  className="px-8 py-4 bg-brand-blue hover:bg-brand-blue-hover text-white font-black uppercase tracking-widest text-[10px] rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-blue/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Plus size={14} />
                  Criar Categoria
                </button>
              </div>
            </div>

            {/* Lista de Categorias Cadastradas */}
            <div className="p-8">
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-6">Categorias de Negócios</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {categories.map((cat, idx) => {
                  const isEditing = editingCatId === cat.id;
                  const IconComp = ICON_MAP[cat.icon] || Tag;
                  const hasCustomImage = !!cat.imageUrl;
                  const fallbackImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';
                  
                  return (
                    <motion.div 
                      key={cat.id} 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden flex flex-col justify-between group hover:border-white/10 transition-colors"
                    >
                      {isEditing ? (
                        /* Modo de Edição */
                        <div className="p-6 flex flex-col gap-4">
                          <h4 className="text-xs font-black uppercase tracking-widest text-brand-blue">Editando Categoria</h4>
                          
                          <div>
                            <label className="block text-[8px] font-black uppercase text-white/30 tracking-wider mb-1">Nome no Menu</label>
                            <input 
                              type="text" 
                              value={editingCatName}
                              onChange={(e) => setEditingCatName(e.target.value)}
                              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2 text-white text-xs outline-none focus:ring-1 focus:ring-brand-blue"
                            />
                          </div>

                          <div>
                            <label className="block text-[8px] font-black uppercase text-white/30 tracking-wider mb-1">Imagem de Destaque</label>
                            <div className="flex flex-col gap-2">
                              {/* URL input */}
                              <input 
                                type="url" 
                                value={editingCatImageUrl}
                                onChange={(e) => setEditingCatImageUrl(e.target.value)}
                                placeholder="Link da imagem (URL) ou envie abaixo..."
                                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2 text-white text-xs outline-none focus:ring-1 focus:ring-brand-blue"
                              />
                              
                              {/* Drag and Drop zone */}
                              <div 
                                onDragOver={handleCategoryDragOver}
                                onDragLeave={() => setIsDraggingEdit(false)}
                                onDrop={(e) => handleCategoryDrop(e, true)}
                                onDragEnter={() => setIsDraggingEdit(true)}
                                onClick={() => document.getElementById(`edit-cat-file-input-${cat.id}`)?.click()}
                                className={cn(
                                  "border border-dashed p-3 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[64px]",
                                  isDraggingEdit 
                                    ? "border-brand-blue bg-brand-blue/10" 
                                    : "border-white/10 bg-white/[0.01] hover:bg-white/5 animate-pulse"
                                )}
                              >
                                <input 
                                  type="file" 
                                  id={`edit-cat-file-input-${cat.id}`}
                                  onChange={(e) => handleCategoryFileChange(e, true)}
                                  accept="image/*"
                                  className="hidden"
                                />
                                {editingCatImageUrl && editingCatImageUrl.startsWith('data:') ? (
                                  <div className="flex items-center gap-2">
                                    <ImageIcon size={14} className="text-brand-green" />
                                    <span className="text-[9px] font-bold text-white/80">Imagem carregada!</span>
                                    <button 
                                      type="button" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingCatImageUrl('');
                                      }}
                                      className="text-rose-500 hover:text-rose-400 p-1 text-[8px] font-bold tracking-widest uppercase ml-1"
                                    >
                                      Trocar
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 justify-center">
                                    <Upload size={12} className="text-white/40" />
                                    <span className="text-[9px] font-bold text-white/60">Arraste ou clique para enviar foto</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[8px] font-black uppercase text-white/30 tracking-wider mb-1">Escolher Ícone</label>
                            <div className="flex flex-wrap gap-1 p-2 bg-white/5 border border-white/10 rounded-xl max-h-24 overflow-y-auto no-scrollbar">
                              {CATEGORY_ICONS_LIST.map((iconName) => {
                                const OptionIcon = ICON_MAP[iconName] || Tag;
                                const isIconSelected = editingCatIcon === iconName;
                                return (
                                  <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => setEditingCatIcon(iconName)}
                                    className={cn(
                                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all border",
                                      isIconSelected 
                                        ? "bg-brand-blue text-white border-brand-blue scale-105" 
                                        : "bg-white/5 border-transparent text-white/40 hover:text-white"
                                    )}
                                  >
                                    <OptionIcon size={14} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5 mt-1">
                            <span className="text-[10px] font-bold text-white/60">Status da Categoria:</span>
                            <button
                              type="button"
                              onClick={() => setEditingCatDisabled(!editingCatDisabled)}
                              className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all",
                                editingCatDisabled 
                                  ? "bg-rose-500/15 border-rose-500/20 text-rose-400" 
                                  : "bg-brand-green/15 border-brand-green/20 text-brand-green"
                              )}
                            >
                              {editingCatDisabled ? 'Inativa / Oculta' : 'Ativa / Visível'}
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <button
                              onClick={handleCancelEditCategory}
                              className="py-3 bg-white/5 text-white/60 hover:bg-white/10 font-bold uppercase tracking-widest text-[9px] rounded-xl transition-all"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleSaveCategoryEdit(cat.id)}
                              className="py-3 bg-brand-blue text-white font-bold uppercase tracking-widest text-[9px] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-brand-blue/10"
                            >
                              <Save size={12} />
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Exibição Padrão da Categoria */
                        <>
                          {/* Banner superior com imagem */}
                          <div className="relative h-28 w-full bg-slate-900 overflow-hidden">
                            <img 
                              src={cat.imageUrl || fallbackImage} 
                              alt={cat.name} 
                              className="w-full h-full object-cover opacity-35" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111317] to-transparent" />
                            
                            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                              <span className={cn(
                                "px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider shadow-md",
                                cat.disabled 
                                  ? "bg-rose-500/80 text-white" 
                                  : "bg-brand-green/80 text-white"
                              )}>
                                {cat.disabled ? 'Desativado' : 'Ativo'}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleStartEditCategory(cat)}
                                  className="w-8 h-8 rounded-full bg-black/40 border border-white/15 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-colors"
                                  title="Editar"
                                >
                                  <Edit3 size={12} />
                                </button>
                                <button
                                  onClick={() => handleToggleCategoryDisabled(cat.id, cat.name, !!cat.disabled)}
                                  className={cn(
                                    "w-8 h-8 rounded-full border flex items-center justify-center transition-colors",
                                    cat.disabled
                                      ? "bg-brand-green/20 border-brand-green/30 text-brand-green hover:bg-brand-green/40"
                                      : "bg-rose-500/20 border-rose-500/30 text-rose-400 hover:bg-rose-500/40"
                                  )}
                                  title={cat.disabled ? "Ativar Categoria" : "Desativar Categoria"}
                                >
                                  {cat.disabled ? <Eye size={12} /> : <EyeOff size={12} />}
                                </button>
                              </div>
                            </div>

                            <div className="absolute bottom-3 left-4 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center text-brand-blue shadow-lg">
                                <IconComp size={16} />
                              </div>
                              <span className="text-sm font-black text-white italic uppercase tracking-tight">{cat.name}</span>
                            </div>
                          </div>

                          {/* Seção inferior de metadados / exclusão */}
                          <div className="p-4 bg-white/[0.01] flex items-center justify-between border-t border-white/5">
                            <span className="text-[9px] font-bold text-white/30 tracking-widest uppercase">
                              {ads.filter(a => a.category === cat.name).length} anúncios vinculados
                            </span>
                            <button 
                              onClick={() => handleRemoveCategory(cat.id, cat.name)}
                              className="text-white/20 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-500/5"
                              title="Excluir Categoria"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'companies' && (
          <motion.div 
            key="companies"
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }}
            className="bg-[#111317] rounded-[3rem] border border-white/5 overflow-hidden font-sans"
          >
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-2">Todas as Empresas</h3>
                <div className="flex items-center gap-2">
                  {['all', 'active', 'pending', 'rejected'].map((s) => (
                    <button 
                      key={s}
                      onClick={() => setCompanyStatusFilter(s as any)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all border",
                        companyStatusFilter === s 
                          ? "bg-white/10 border-white/20 text-white" 
                          : "bg-transparent border-transparent text-white/20 hover:text-white"
                      )}
                    >
                      {s === 'all' ? 'Todas' : s === 'active' ? 'Ativas' : s === 'pending' ? 'Pendentes' : 'Rejeitadas'}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setEditingCompany({
                  id: 'nova',
                  name: '',
                  logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=100&q=80',
                  description: '',
                  phone: '',
                  whatsapp: '',
                  website: '',
                  instagram: '',
                  address: '',
                  hours: '',
                  status: 'active',
                  verified: false
                })}
                className="bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase tracking-widest text-[10px] px-5 py-3 rounded-2xl shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-1.5 shrink-0 self-start md:self-auto cursor-pointer"
              >
                <Plus size={14} />
                Adicionar Empresa
              </button>
            </div>
            
            <div className="p-4 overflow-x-auto">
              <table className="w-full min-w-[600px] font-sans">
                <thead>
                  <tr className="text-[10px] font-black text-white/20 uppercase tracking-widest text-left">
                    <th className="px-4 py-4">Empresa</th>
                    <th className="px-4 py-4">Contato</th>
                    <th className="px-4 py-4">Redes / Link</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Selo</th>
                    <th className="px-4 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allCompanies.filter(c => companyStatusFilter === 'all' || c.status === companyStatusFilter).map((comp, idx) => (
                    <motion.tr 
                      key={comp.id} 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-6">
                        <div className="flex items-center gap-3">
                          <img src={comp.logo} className="w-10 h-10 rounded-xl object-cover bg-white/5" alt="" />
                          <div>
                            <p className="text-xs font-bold text-white mb-0.5">{comp.name}</p>
                            <p className="text-[10px] text-white/40 font-medium line-clamp-1">{comp.address}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <div>
                          <p className="text-xs font-bold text-white mb-0.5">{comp.phone}</p>
                          <p className="text-[9px] text-[#fbc02d] font-bold uppercase">{comp.whatsapp}</p>
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <div className="text-[10px] space-y-1">
                          {comp.website && (
                            <p className="text-white/40 truncate max-w-[120px]">
                              🌐 <a href={comp.website} target="_blank" rel="noopener noreferrer" className="hover:text-brand-blue font-bold">{comp.website}</a>
                            </p>
                          )}
                          {comp.instagram && (
                            <p className="text-white/40 truncate max-w-[120px]">
                              📸 <span className="font-bold">{comp.instagram}</span>
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <span className={cn(
                          "inline-block text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                          comp.status === 'active' ? "bg-brand-green/10 text-brand-green" : 
                          comp.status === 'pending' ? "bg-brand-orange/10 text-brand-orange" : 
                          "bg-rose-500/10 text-rose-500"
                        )}>
                          {comp.status === 'active' ? 'Ativo' : comp.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                        </span>
                      </td>
                      <td className="px-4 py-6">
                        <span className={cn(
                          "inline-block text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                          comp.verified ? "bg-brand-blue/10 text-brand-blue" : "bg-white/5 text-white/20"
                        )}>
                          {comp.verified ? 'Verificado' : 'Normal'}
                        </span>
                      </td>
                      <td className="px-4 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingCompany(comp)}
                            className="text-white/20 hover:text-brand-blue transition-colors p-2"
                            title="Editar Dados da Empresa"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteCompany(comp.id)}
                            className="text-white/10 hover:text-rose-500 transition-colors p-2"
                            title="Excluir Empresa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {allCompanies.filter(c => companyStatusFilter === 'all' || c.status === companyStatusFilter).length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-white/20 font-bold uppercase tracking-widest text-[10px]">
                        Nenhuma empresa cadastrada ou correspondente aos filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div 
            key="users"
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#111317] p-6 rounded-[2rem] border border-white/5 shadow-xl">
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Buscar usuários por nome ou e-mail..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-white placeholder-white/25 text-xs font-semibold focus:outline-none focus:border-brand-orange transition-all"
                  />
                </div>
                {/* Role Filter */}
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value as any)}
                  className="bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-white/60 text-xs font-semibold focus:outline-none focus:border-brand-orange transition-all cursor-pointer"
                >
                  <option value="all" className="bg-[#111317] text-white">Todos os Níveis</option>
                  <option value="admin" className="bg-[#111317] text-white">Admin</option>
                  <option value="cliente" className="bg-[#111317] text-white">Cliente</option>
                  <option value="empresa" className="bg-[#111317] text-white">Empresa</option>
                </select>
              </div>

              {/* Add User Button */}
              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({ displayName: '', email: '', password: '', role: 'cliente' });
                  setIsUserModalOpen(true);
                }}
                className="w-full md:w-auto px-6 py-3 bg-brand-orange text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-brand-orange/85 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-orange/15 cursor-pointer"
              >
                <Plus size={14} />
                Cadastrar Usuário
              </button>
            </div>

            {/* Users Table / Grid */}
            <div className="bg-[#111317] rounded-[2rem] border border-white/5 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-4 px-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Usuário</th>
                      <th className="py-4 px-6 text-[10px] font-black text-white/30 uppercase tracking-widest">E-mail</th>
                      <th className="py-4 px-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Nível de Acesso</th>
                      <th className="py-4 px-6 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {usersList
                      .filter(u => {
                        const searchLower = userSearch.toLowerCase();
                        const matchesSearch = 
                          (u.displayName || '').toLowerCase().includes(searchLower) ||
                          (u.email || '').toLowerCase().includes(searchLower);

                        const matchesRole = 
                          userRoleFilter === 'all' || 
                          u.role === userRoleFilter ||
                          (userRoleFilter === 'cliente' && u.role === 'user');

                        return matchesSearch && matchesRole;
                      })
                      .map(u => {
                        const initial = (u.displayName || 'U').charAt(0).toUpperCase();
                        const isUserAdmin = u.role === 'admin';
                        const isUserEmpresa = u.role === 'empresa';
                        const isUserCliente = u.role === 'cliente' || u.role === 'user' || !u.role;

                        return (
                          <motion.tr 
                            key={u.uid}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-white/[0.01] transition-colors"
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white",
                                  isUserAdmin ? "bg-rose-500/10 border border-rose-500/20 text-rose-400" :
                                  isUserEmpresa ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" :
                                  "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                                )}>
                                  {initial}
                                </div>
                                <span className="text-white text-xs font-bold">{u.displayName || 'Usuário Sem Nome'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-white/40 text-xs font-semibold">{u.email}</span>
                            </td>
                            <td className="py-4 px-6">
                              {isUserAdmin && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 text-rose-400">
                                  Administrador
                                </span>
                              )}
                              {isUserEmpresa && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                  Empresa
                                </span>
                              )}
                              {isUserCliente && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                  Cliente
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingUser(u);
                                    setUserForm({
                                      displayName: u.displayName || '',
                                      email: u.email || '',
                                      password: u.password || '',
                                      role: (u.role === 'user' ? 'cliente' : u.role) || 'cliente'
                                    });
                                    setIsUserModalOpen(true);
                                  }}
                                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center"
                                  title="Editar Usuário"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.uid, u.email)}
                                  className="p-2 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 transition-all cursor-pointer flex items-center justify-center"
                                  title="Excluir Usuário"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}

                    {usersList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-white/20 font-bold uppercase tracking-widest text-[10px]">
                          Carregando ou nenhum usuário encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Create/Edit Modal */}
            {isUserModalOpen && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#111317] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-md relative shadow-2xl"
                >
                  <button 
                    onClick={() => {
                      setIsUserModalOpen(false);
                      setEditingUser(null);
                    }}
                    className="absolute top-6 right-6 text-white/40 hover:text-white transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>

                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-1">
                    {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                  </h3>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-6">
                    {editingUser ? 'Atualize as credenciais e nível do usuário' : 'Crie um novo acesso administrativo ou regular'}
                  </p>

                  <form onSubmit={handleSaveUser} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 px-1">Nome Completo</label>
                      <input
                        type="text"
                        required
                        value={userForm.displayName}
                        onChange={(e) => setUserForm(prev => ({ ...prev, displayName: e.target.value }))}
                        className="block w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-white text-xs font-semibold focus:outline-none focus:border-brand-orange transition-all"
                        placeholder="Nome do usuário"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 px-1">E-mail</label>
                      <input
                        type="email"
                        required
                        value={userForm.email}
                        onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                        className="block w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-white text-xs font-semibold focus:outline-none focus:border-brand-orange transition-all"
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    {!editingUser && (
                      <div>
                        <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 px-1">Senha</label>
                        <input
                          type="password"
                          required
                          value={userForm.password}
                          onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                          className="block w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-white text-xs font-semibold focus:outline-none focus:border-brand-orange transition-all"
                          placeholder="Mínimo 3 caracteres"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 px-1">Nível de Acesso</label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {[
                          { id: 'cliente', label: 'Cliente' },
                          { id: 'empresa', label: 'Empresa' },
                          { id: 'admin', label: 'Admin' }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setUserForm(prev => ({ ...prev, role: opt.id as any }))}
                            className={`py-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                              userForm.role === opt.id
                                ? 'bg-brand-orange/15 border-brand-orange text-brand-orange font-bold'
                                : 'bg-white/[0.02] border-white/5 text-white/40 hover:text-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-6 py-4 bg-brand-orange text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-brand-orange/15 cursor-pointer hover:bg-brand-orange/90 transition-all font-bold"
                    >
                      {editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }}
            className="bg-[#111317] rounded-[3rem] border border-white/5 overflow-hidden p-8 max-w-2xl"
          >
            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-2">Configurações da Plataforma</h3>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-8">
              Gerencie parâmetros de contato e links do Vapt Market
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Link Oficial do WhatsApp
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-green">
                    <MessageSquare size={18} />
                  </div>
                  <input 
                    type="url"
                    placeholder="Ex: https://wa.me/5527992830151"
                    value={platformWhatsapp}
                    onChange={(e) => setPlatformWhatsapp(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white text-sm font-semibold focus:outline-none focus:border-brand-blue transition-all"
                    required
                  />
                </div>
                <p className="text-[10px] text-white/30 leading-relaxed">
                  ⚠️ Este link será usado para redirecionar usuários não-administradores que manifestarem interesse em postar um anúncio na plataforma.
                </p>
              </div>

              <button 
                type="submit"
                disabled={isSavingSettings}
                className="w-full py-4 bg-brand-orange text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-orange/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSavingSettings ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  'Salvar Alterações'
                )}
              </button>
            </form>
          </motion.div>
        )}

        {activeTab === 'coupons' && (
          <motion.div 
            key="coupons"
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Gerenciamento de Cupons</h3>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">
                  Crie, edite, ative, desative e exclua cupons de desconto da plataforma
                </p>
              </div>

              <button
                onClick={() => setEditingCoupon({
                  id: 'novo',
                  code: '',
                  companyId: '',
                  description: '',
                  discountValue: '',
                  expiresAt: '',
                  usedCount: 0,
                  active: true
                })}
                className="bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase tracking-widest text-[10px] px-6 py-4 rounded-2xl shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 self-start md:self-auto cursor-pointer"
              >
                <Plus size={14} />
                Adicionar Cupom
              </button>
            </div>

            {/* Coupons List */}
            <div className="bg-[#111317] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-4 px-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Código</th>
                      <th className="py-4 px-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Empresa</th>
                      <th className="py-4 px-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Desconto / Descrição</th>
                      <th className="py-4 px-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Validade</th>
                      <th className="py-4 px-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Uso / Limite</th>
                      <th className="py-4 px-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Status</th>
                      <th className="py-4 px-6 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <Ticket className="mx-auto text-white/10 mb-4" size={40} />
                          <p className="text-white/40 font-bold text-sm">Nenhum cupom cadastrado na plataforma</p>
                          <p className="text-white/20 text-xs mt-1">Clique no botão acima para adicionar o primeiro cupom.</p>
                        </td>
                      </tr>
                    ) : (
                      coupons.map(coupon => {
                        const company = allCompanies.find(c => c.id === coupon.companyId);
                        const isExpired = new Date(coupon.expiresAt) < new Date();

                        return (
                          <tr key={coupon.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                            <td className="py-5 px-6">
                              <span className="bg-brand-blue/10 border border-brand-blue/20 text-brand-blue font-black tracking-widest text-[11px] uppercase px-3 py-1.5 rounded-xl">
                                {coupon.code}
                              </span>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex items-center gap-3">
                                {company?.logo && (
                                  <img 
                                    src={company.logo} 
                                    alt={company.name} 
                                    className="w-8 h-8 rounded-xl object-cover border border-white/10"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                <div>
                                  <p className="font-bold text-white text-xs">{company?.name || 'Empresa não encontrada'}</p>
                                  <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">ID: {coupon.companyId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-5 px-6 max-w-xs">
                              <p className="font-bold text-white text-xs">{coupon.discountValue}</p>
                              <p className="text-white/40 text-[10px] font-semibold mt-1 line-clamp-1">{coupon.description}</p>
                            </td>
                            <td className="py-5 px-6">
                              <span className={cn(
                                "text-xs font-bold",
                                isExpired ? "text-brand-orange" : "text-white/60"
                              )}>
                                {safeFormatDate(coupon.expiresAt)}
                                {isExpired && <span className="text-[9px] font-black bg-brand-orange/10 px-2 py-0.5 rounded-full ml-1.5 uppercase tracking-wider">Expirado</span>}
                              </span>
                            </td>
                            <td className="py-5 px-6">
                              <p className="text-xs font-bold text-white">
                                {coupon.usedCount} <span className="text-white/30 font-normal">/ {coupon.usageLimit || 'Sem limite'}</span>
                              </p>
                            </td>
                            <td className="py-5 px-6">
                              <button
                                onClick={() => handleToggleCouponStatus(coupon)}
                                className={cn(
                                  "font-black uppercase tracking-widest text-[9px] px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5",
                                  coupon.active !== false
                                    ? "bg-brand-green/10 border-brand-green/20 text-brand-green hover:bg-brand-green/20"
                                    : "bg-white/5 border-white/10 text-white/30 hover:bg-white/10"
                                )}
                              >
                                {coupon.active !== false ? 'Ativo' : 'Inativo'}
                              </button>
                            </td>
                            <td className="py-5 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setEditingCoupon(coupon)}
                                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                                  title="Editar Cupom"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCoupon(coupon.id)}
                                  className="w-8 h-8 rounded-xl bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-white flex items-center justify-center transition-all cursor-pointer"
                                  title="Excluir Cupom"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'affiliates' && (
          <motion.div 
            key="affiliates"
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-[#111317] p-6 rounded-[2rem] border border-white/5 shadow-xl">
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Total em Vendas</p>
                <p className="text-2xl font-black text-white mt-2">
                  R$ {sales.reduce((acc, s) => acc + s.saleValue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-[#111317] p-6 rounded-[2rem] border border-white/5 shadow-xl">
                <p className="text-[10px] text-brand-orange font-black uppercase tracking-widest">Total de Bônus</p>
                <p className="text-2xl font-black text-brand-orange mt-2">
                  R$ {sales.reduce((acc, s) => acc + s.bonusValue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-[#111317] p-6 rounded-[2rem] border border-white/5 shadow-xl">
                <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Bônus Pendentes/Aguardando</p>
                <p className="text-2xl font-black text-amber-500 mt-2">
                  R$ {sales.filter(s => s.status !== 'Finalizada').reduce((acc, s) => acc + s.bonusValue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-[#111317] p-6 rounded-[2rem] border border-white/5 shadow-xl">
                <p className="text-[10px] text-brand-green font-black uppercase tracking-widest">Bônus Pagos / Finalizados</p>
                <p className="text-2xl font-black text-brand-green mt-2">
                  R$ {sales.filter(s => s.status === 'Finalizada').reduce((acc, s) => acc + s.bonusValue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Configurations & Add Sale forms */}
              <div className="space-y-8 lg:col-span-1">
                {/* 1. Configuration Panel */}
                <div className="bg-[#111317] p-6 rounded-[2.5rem] border border-white/5 shadow-xl">
                  <h4 className="text-sm font-black text-white uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-brand-orange" />
                    Percentual de Bônus
                  </h4>
                  <p className="text-[10px] text-white/40 font-semibold uppercase tracking-widest mb-4">
                    Configuração de bônus por indicação de empresas
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                        Bônus ao Indicar Empresa (%)
                      </label>
                      <div className="relative">
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={bonusPercent}
                          onChange={(e) => setBonusPercent(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm font-semibold focus:outline-none focus:border-brand-blue"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">%</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSaveAffiliateSettings(bonusPercent)}
                      disabled={isSavingAffiliateSettings}
                      className="w-full py-3 bg-brand-blue text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-brand-blue/15 hover:bg-brand-blue/90 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSavingAffiliateSettings ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Salvar Percentual'
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Add Sale Panel */}
                <div className="bg-[#111317] p-6 rounded-[2.5rem] border border-white/5 shadow-xl">
                  <h4 className="text-sm font-black text-white uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                    <Plus size={16} className="text-brand-orange" />
                    Adicionar Venda
                  </h4>
                  <p className="text-[10px] text-white/40 font-semibold uppercase tracking-widest mb-4">
                    Inserir venda manual com indicação
                  </p>
                  <form onSubmit={handleAddSale} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                        Selecione o Afiliado
                      </label>
                      <select
                        value={newSaleAffiliateId}
                        onChange={(e) => {
                          setNewSaleAffiliateId(e.target.value);
                          setNewSaleCompanyId(''); // reset company select on affiliate change
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white/60 text-xs font-semibold focus:outline-none focus:border-brand-orange cursor-pointer"
                        required
                      >
                        <option value="" className="bg-[#111317] text-white/40">Selecione o usuário...</option>
                        {usersList.map((u) => (
                          <option key={u.uid || u.id} value={u.uid || u.id} className="bg-[#111317] text-white">
                            {u.displayName || u.name} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                        Empresa Indicada
                      </label>
                      <select
                        value={newSaleCompanyId}
                        onChange={(e) => setNewSaleCompanyId(e.target.value)}
                        disabled={!newSaleAffiliateId}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white/60 text-xs font-semibold focus:outline-none focus:border-brand-orange cursor-pointer disabled:opacity-50"
                        required
                      >
                        <option value="" className="bg-[#111317] text-white/40">
                          {!newSaleAffiliateId ? 'Selecione primeiro um afiliado' : 'Selecione a empresa...'}
                        </option>
                        {allCompanies
                          .filter(c => c.referredBy === newSaleAffiliateId)
                          .map((c) => (
                            <option key={c.id} value={c.id} className="bg-[#111317] text-white">
                              {c.name}
                            </option>
                          ))}
                      </select>
                      {newSaleAffiliateId && allCompanies.filter(c => c.referredBy === newSaleAffiliateId).length === 0 && (
                        <p className="text-[9px] text-amber-500 mt-1 font-semibold">
                          ⚠️ Este usuário não possui empresas vinculadas como indicação dele.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                        Valor da Venda (R$)
                      </label>
                      <input 
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Ex: 1500.00"
                        value={newSaleValue}
                        onChange={(e) => setNewSaleValue(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm font-semibold focus:outline-none focus:border-brand-orange"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                        Status do Bônus / Venda
                      </label>
                      <select
                        value={newSaleStatus}
                        onChange={(e) => setNewSaleStatus(e.target.value as any)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white/60 text-xs font-semibold focus:outline-none focus:border-brand-orange cursor-pointer"
                        required
                      >
                        <option value="Pendente" className="bg-[#111317] text-white">Pendente</option>
                        <option value="Aguardando Pagamento" className="bg-[#111317] text-white">Aguardando Pagamento</option>
                        <option value="Finalizada" className="bg-[#111317] text-white">Finalizada</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-brand-orange text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-brand-orange/15 hover:bg-brand-orange/90 transition-all cursor-pointer"
                    >
                      Adicionar Venda
                    </button>
                  </form>
                </div>
              </div>

              {/* Sales List Table */}
              <div className="bg-[#111317] rounded-[2.5rem] border border-white/5 shadow-xl overflow-hidden lg:col-span-2 p-6 flex flex-col h-fit">
                <h4 className="text-sm font-black text-white uppercase italic tracking-tighter mb-2">
                  Registro de Vendas e Indicações
                </h4>
                <p className="text-[10px] text-white/40 font-semibold uppercase tracking-widest mb-6">
                  Visualize as vendas de indicações de afiliados e altere os status dos bônus
                </p>

                {sales.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-xs text-white/30 font-bold uppercase tracking-wider">Nenhuma venda registrada ainda</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="py-4 px-4 text-[9px] font-black text-white/30 uppercase tracking-widest">Afiliado / Empresa</th>
                          <th className="py-4 px-4 text-[9px] font-black text-white/30 uppercase tracking-widest">Venda (R$)</th>
                          <th className="py-4 px-4 text-[9px] font-black text-white/30 uppercase tracking-widest">Bônus</th>
                          <th className="py-4 px-4 text-[9px] font-black text-white/30 uppercase tracking-widest">Status</th>
                          <th className="py-4 px-4 text-[9px] font-black text-white/30 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.map((sale) => (
                          <tr key={sale.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                            <td className="py-4 px-4">
                              <div className="font-bold text-white text-xs">{sale.affiliateName}</div>
                              <div className="text-[10px] text-white/40">Indicou: <span className="text-brand-orange">{sale.companyName}</span></div>
                            </td>
                            <td className="py-4 px-4 text-xs font-semibold text-white/80">
                              R$ {sale.saleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-xs font-bold text-brand-orange">
                                R$ {sale.bonusValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                              <div className="text-[9px] text-white/30">Taxa: {sale.bonusPercent}%</div>
                            </td>
                            <td className="py-4 px-4">
                              <select
                                value={sale.status}
                                onChange={(e) => handleUpdateSaleStatus(sale.id, e.target.value as any)}
                                className={cn(
                                  "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-white/5 border border-white/10 cursor-pointer focus:outline-none",
                                  sale.status === 'Finalizada' && "text-brand-green border-brand-green/20 bg-brand-green/5",
                                  sale.status === 'Aguardando Pagamento' && "text-amber-500 border-amber-500/20 bg-amber-500/5",
                                  sale.status === 'Pendente' && "text-red-400 border-red-400/20 bg-red-400/5"
                                )}
                              >
                                <option value="Pendente" className="bg-[#111317] text-white">Pendente</option>
                                <option value="Aguardando Pagamento" className="bg-[#111317] text-white">Aguardando Pagamento</option>
                                <option value="Finalizada" className="bg-[#111317] text-white">Finalizada</option>
                              </select>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => handleDeleteSale(sale.id)}
                                className="p-2 text-white/20 hover:text-red-400 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Seção de Solicitações de Saque de Afiliados */}
              <div className="bg-[#111317] rounded-[2.5rem] border border-white/5 shadow-xl overflow-hidden p-6 flex flex-col h-fit mt-8">
                <h4 className="text-sm font-black text-white uppercase italic tracking-tighter mb-2">
                  Solicitações de Saque de Afiliados
                </h4>
                <p className="text-[10px] text-white/40 font-semibold uppercase tracking-widest mb-6">
                  Visualize e gerencie os pedidos de saque efetuados pelos parceiros afiliados
                </p>

                {withdraws.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-xs text-white/30 font-bold uppercase tracking-wider">Nenhuma solicitação de saque pendente ou registrada</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="py-4 px-4 text-[9px] font-black text-white/30 uppercase tracking-widest">Usuário / Email</th>
                          <th className="py-4 px-4 text-[9px] font-black text-white/30 uppercase tracking-widest">Chave Pix</th>
                          <th className="py-4 px-4 text-[9px] font-black text-white/30 uppercase tracking-widest">Valor do Saque</th>
                          <th className="py-4 px-4 text-[9px] font-black text-white/30 uppercase tracking-widest">Data</th>
                          <th className="py-4 px-4 text-[9px] font-black text-white/30 uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdraws.map((req) => (
                          <tr key={req.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                            <td className="py-4 px-4">
                              <div className="font-bold text-white text-xs">{req.userName}</div>
                              <div className="text-[10px] text-white/40">{req.userEmail}</div>
                            </td>
                            <td className="py-4 px-4 text-xs font-semibold text-white/80 font-mono">
                              {req.pixKey}
                            </td>
                            <td className="py-4 px-4 text-xs font-bold text-brand-green">
                              R$ {req.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-4 text-[10px] text-white/50">
                              {safeFormatDate(req.createdAt)}
                            </td>
                            <td className="py-4 px-4">
                              <select
                                value={req.status}
                                onChange={(e) => handleUpdateWithdrawStatus(req.id, e.target.value as any)}
                                className={cn(
                                  "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-white/5 border border-white/10 cursor-pointer focus:outline-none",
                                  req.status === 'Aprovado' && "text-brand-green border-brand-green/20 bg-brand-green/5",
                                  req.status === 'Recusado' && "text-red-400 border-red-400/20 bg-red-400/5",
                                  req.status === 'Pendente' && "text-amber-500 border-amber-500/20 bg-amber-500/5"
                                )}
                              >
                                <option value="Pendente" className="bg-[#111317] text-white font-bold text-xs">Pendente</option>
                                <option value="Aprovado" className="bg-[#111317] text-white font-bold text-xs">Aprovado</option>
                                <option value="Recusado" className="bg-[#111317] text-white font-bold text-xs">Recusado</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingAd && (
          <AdEditor 
            ad={editingAd} 
            categories={categories}
            companies={allCompanies}
            coupons={coupons}
            onSave={handleSaveAd} 
            onCancel={() => setEditingAd(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingCompany && (
          <CompanyEditor 
            company={editingCompany} 
            usersList={usersList}
            categories={categories}
            onSave={handleSaveCompany} 
            onCancel={() => setEditingCompany(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingCoupon && (
          <CouponEditor 
            coupon={editingCoupon}
            companies={allCompanies}
            onSave={handleSaveCoupon}
            onCancel={() => setEditingCoupon(null)}
          />
        )}
      </AnimatePresence>

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        isLoading={isProcessing === 'delete-action' || !!(isProcessing && ads.find(a => a.id === isProcessing))}
      />
    </div>
  );
}
