export type Category = 
  | 'Restaurantes'
  | 'Pousadas'
  | 'Hotéis'
  | 'Veículos'
  | 'Imóveis'
  | 'Moda'
  | 'Eletrônicos'
  | 'Serviços'
  | 'Mercado'
  | 'Construção'
  | 'Turismo'
  | 'Promoções'
  | 'Eventos'
  | 'Delivery'
  | 'Produtos Usados';

export interface Company {
  id: string;
  userId?: string;
  referredBy?: string;
  name: string;
  description: string;
  logo: string;
  banner?: string;
  phone: string;
  whatsapp: string;
  instagram?: string;
  website?: string;
  address: string;
  hours?: string;
  verified?: boolean;
  status?: 'pending' | 'active' | 'rejected';
  coords?: { lat: number; lng: number };
  category?: string;
  cnpj?: string;
  email?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface Coupon {
  id: string;
  companyId: string;
  code: string;
  description: string;
  discountValue: string;
  expiresAt: string;
  usageLimit?: number;
  usedCount: number;
  active?: boolean;
}

export interface Ad {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  title: string;
  videoUrl: string; // YouTube link or similar
  thumbnail: string;
  category: Category;
  city: string;
  price?: number;
  installments?: string;
  whatsappLink: string;
  location?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  state?: string;
  expiresAt: string;
  likes: number;
  shares: number;
  saved: number;
  views: number;
  status: 'pending' | 'active' | 'rejected';
  coords?: { lat: number; lng: number };
  couponId?: string;
  description?: string;
  images?: string[];
  featured?: boolean;
  createdAt: number;
  startDate?: string;
}

export interface UserSaved {
  userId: string;
  adIds: string[];
}

export interface UserCoupon {
  id: string;
  userId: string;
  couponId: string;
  code: string;
  companyName: string;
  discountValue: string;
  expiresAt: string;
  redeemedAt: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: number;
  unread: boolean;
  type: 'coupon' | 'approval' | 'chat';
}

export interface Sale {
  id: string;
  affiliateId: string;
  affiliateName: string;
  companyId: string;
  companyName: string;
  saleValue: number;
  bonusPercent: number;
  bonusValue: number;
  status: 'Pendente' | 'Aguardando Pagamento' | 'Finalizada' | 'Liberado para Saque';
  createdAt: number;
}

export interface WithdrawRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  pixKey: string;
  amount: number;
  status: 'Pendente' | 'Aprovado' | 'Recusado';
  createdAt: number;
}

