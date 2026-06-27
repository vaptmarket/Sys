import { Ad, Category, Company, Coupon } from '../types';

export const MOCK_CATEGORIES: { id: string; name: Category; icon: string }[] = [
  { id: '1', name: 'Restaurantes', icon: 'Utensils' },
  { id: '2', name: 'Pousadas', icon: 'Bed' },
  { id: '3', name: 'Eletrônicos', icon: 'Smartphone' },
  { id: '4', name: 'Veículos', icon: 'Car' },
  { id: '5', name: 'Serviços', icon: 'Wrench' },
  { id: '6', name: 'Moda', icon: 'ShoppingBag' },
];

export const MOCK_ADS: Ad[] = [
  {
    id: '1',
    companyId: 'c1',
    companyName: 'Pousada Mar Azul',
    companyLogo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=100&q=80',
    title: 'Suíte Vista Mar com 30% OFF',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
    category: 'Pousadas',
    city: 'Maresias',
    price: 450,
    installments: '3x sem juros',
    whatsappLink: 'https://wa.me/5511999998888',
    expiresAt: '2026-12-31',
    likes: 1240,
    shares: 450,
    saved: 890,
    views: 3500,
    status: 'active',
    coords: { lat: -23.7915, lng: -45.5564 },
    couponId: 'cp1',
    createdAt: Date.now() - 3600000, // 1 hour ago
    startDate: '2026-06-25',
    description: 'Aproveite o final de semana na melhor pousada de Maresias. Suítes completas com ar condicionado, frigobar e café da manhã incluso.',
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: '2',
    companyId: 'c2',
    companyName: 'Bistrô do Sol',
    companyLogo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=100&q=80',
    title: 'Festival do Camarão',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1551731359-2b349793038a?auto=format&fit=crop&w=800&q=80',
    category: 'Restaurantes',
    city: 'Ilhabela',
    price: 89.90,
    whatsappLink: 'https://wa.me/5512999997777',
    expiresAt: '2026-12-31',
    likes: 850,
    shares: 210,
    saved: 430,
    views: 1200,
    status: 'active',
    coords: { lat: -23.8166, lng: -45.3601 },
    couponId: 'cp2',
    createdAt: Date.now(), // just now
    startDate: '2026-06-27',
    description: 'Camarões frescos selecionados com molho especial da casa. Servido com arroz de coco e batata rústica.'
  },
  {
    id: '3',
    companyId: 'c2',
    companyName: 'Loja do Café Gourmet',
    companyLogo: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=100&q=80',
    title: 'Grãos Aramo 25% OFF',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    category: 'Restaurantes',
    city: 'São Paulo',
    price: 35.00,
    whatsappLink: 'https://wa.me/5511999991111',
    expiresAt: '2026-12-31',
    likes: 0,
    shares: 0,
    saved: 0,
    views: 0,
    status: 'pending',
    createdAt: Date.now() - 86400000,
    startDate: '2026-06-26',
  }
];

export const MOCK_COMPANIES: Company[] = [
  {
    id: 'c1',
    name: 'Pousada Mar Azul',
    description: 'A melhor hospedagem pé na areia em Maresias. Conforto e sofisticação para toda sua família.',
    logo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=100&q=80',
    phone: '1133445566',
    whatsapp: '5511999998888',
    address: 'Av. Dr. Francisco Loup, 1200 - Maresias, São Sebastião - SP',
    verified: true,
    hours: '24h',
    coords: { lat: -23.7915, lng: -45.5564 },
    status: 'active'
  },
  {
    id: 'c2',
    name: 'Loja do Café Gourmet',
    description: 'Os melhores grãos do mundo na sua xícara.',
    logo: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=100&q=80',
    phone: '11999991111',
    whatsapp: '5511999991111',
    address: 'Rua das Flores, 123 - São Paulo - SP',
    status: 'pending'
  },
  {
    id: 'c3',
    name: 'Sapataria Estilo',
    description: 'Calçados para todas as ocasiões.',
    logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&q=80',
    phone: '11999992222',
    whatsapp: '5511999992222',
    address: 'Av. Paulista, 1000 - São Paulo - SP',
    status: 'pending'
  }
];

export const MOCK_COUPONS: Coupon[] = [
  {
    id: 'cp1',
    companyId: 'c1',
    code: 'VAPT10',
    description: '10% de desconto em qualquer reserva',
    discountValue: '10%',
    expiresAt: '2025-12-31',
    usedCount: 45
  },
  {
    id: 'cp2',
    companyId: 'c2',
    code: 'BIKE50',
    description: 'R$ 50,00 de desconto em eletrônicos',
    discountValue: 'R$ 50',
    expiresAt: '2025-06-30',
    usedCount: 12
  }
];

