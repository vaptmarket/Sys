import { Ad, Category, Company, UserSaved, UserCoupon, Coupon, AppNotification } from '../types';
import { MOCK_ADS, MOCK_CATEGORIES, MOCK_COMPANIES, MOCK_COUPONS } from '../constants/mocks';

// Simulation utility for future Firebase latency
const delay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

// Simple Event Emitter for Real-time subscriptions
class EventEmitter {
  private listeners: { [key: string]: ((data: any) => void)[] } = {};

  subscribe(event: string, callback: (data: any) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(l => l !== callback);
    };
  }

  emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(l => l(data));
    }
  }
}

export const events = new EventEmitter();

// LocalStorage Persistence Layer
const STORAGE_KEY = 'vapt_market_data_v1';

const uniqueById = <T extends { id: string }>(arr: T[]): T[] => {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  return arr.filter(item => {
    if (!item || !item.id) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const getStoredData = () => {
  const defaultData = { 
    ads: MOCK_ADS, 
    categories: MOCK_CATEGORIES, 
    companies: MOCK_COMPANIES,
    coupons: MOCK_COUPONS,
    userSaves: [] as UserSaved[],
    userCoupons: [] as UserCoupon[],
    notifications: [
      { id: 'n1', title: 'Oferta Relâmpago ⚡', message: 'Restaurante Sabor & Arte lançou um cupom de 50%!', createdAt: Date.now() - 120000, unread: true, type: 'coupon' },
      { id: 'n2', title: 'Anúncio Aprovado ✅', message: 'Seu anúncio "iPhone 15 Pro Max" já está no ar.', createdAt: Date.now() - 3600000, unread: true, type: 'approval' },
      { id: 'n3', title: 'Nova Mensagem 💬', message: 'Você recebeu uma pergunta sobre o Console Retro.', createdAt: Date.now() - 10800000, unread: false, type: 'chat' },
    ] as AppNotification[],
    settings: {
      platformWhatsapp: 'https://wa.me/5527992830151'
    }
  };
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        ads: uniqueById<Ad>(parsed.ads || defaultData.ads),
        categories: uniqueById<{ id: string; name: any; icon: string; imageUrl?: string; disabled?: boolean }>(parsed.categories || defaultData.categories),
        companies: uniqueById<Company>(parsed.companies || defaultData.companies),
        coupons: uniqueById<Coupon>(parsed.coupons || defaultData.coupons),
        userSaves: parsed.userSaves || defaultData.userSaves,
        userCoupons: uniqueById<UserCoupon>(parsed.userCoupons || defaultData.userCoupons),
        notifications: parsed.notifications || defaultData.notifications,
        settings: parsed.settings || defaultData.settings,
      };
    } catch (e) {
      console.error('Error parsing stored data, using default values', e);
      return {
        ads: uniqueById<Ad>(defaultData.ads),
        categories: uniqueById<{ id: string; name: any; icon: string; imageUrl?: string; disabled?: boolean }>(defaultData.categories),
        companies: uniqueById<Company>(defaultData.companies),
        coupons: uniqueById<Coupon>(defaultData.coupons),
        userSaves: defaultData.userSaves,
        userCoupons: uniqueById<UserCoupon>(defaultData.userCoupons),
        notifications: defaultData.notifications,
        settings: defaultData.settings,
      };
    }
  }
  return {
    ads: uniqueById<Ad>(defaultData.ads),
    categories: uniqueById<{ id: string; name: any; icon: string; imageUrl?: string; disabled?: boolean }>(defaultData.categories),
    companies: uniqueById<Company>(defaultData.companies),
    coupons: uniqueById<Coupon>(defaultData.coupons),
    userSaves: defaultData.userSaves,
    userCoupons: uniqueById<UserCoupon>(defaultData.userCoupons),
    notifications: defaultData.notifications,
    settings: defaultData.settings,
  };
};

const saveStoredData = (data: any) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('LocalStorage persistence failed:', err);
    throw new Error('Falha ao salvar dados localmente. O armazenamento pode estar cheio.');
  }
};

let currentData = getStoredData();

export const adService = {
  async getAll(): Promise<Ad[]> {
    await delay();
    return [...currentData.ads].sort((a, b) => b.createdAt - a.createdAt);
  },

  async getById(id: string): Promise<Ad | undefined> {
    await delay();
    return currentData.ads.find((ad: Ad) => ad.id === id);
  },

  async getLatest(page = 0, limitCount = 10): Promise<Ad[]> {
    await delay();
    const activeAds = currentData.ads.filter((ad: Ad) => ad.status === 'active');
    const sortedAds = [...activeAds].sort((a, b) => b.createdAt - a.createdAt);
    const start = page * limitCount;
    return sortedAds.slice(start, start + limitCount);
  },

  async updateLikes(adId: string, increment: number): Promise<void> {
    await delay(300);
    const ad = currentData.ads.find((a: Ad) => a.id === adId);
    if (ad) {
      ad.likes += increment;
      saveStoredData(currentData);
      events.emit('ads_updated', currentData.ads);
    }
  },

  async incrementViews(adId: string): Promise<void> {
    const ad = currentData.ads.find((a: Ad) => a.id === adId);
    if (ad) {
      ad.views += 1;
      saveStoredData(currentData);
      events.emit('ads_updated', currentData.ads);
    }
  },

  async toggleSave(userId: string, adId: string): Promise<boolean> {
    await delay(300);
    let userSave = currentData.userSaves.find((s: any) => s.userId === userId);
    
    if (!userSave) {
      userSave = { userId, adIds: [] };
      currentData.userSaves.push(userSave);
    }

    const index = userSave.adIds.indexOf(adId);
    const ad = currentData.ads.find((a: Ad) => a.id === adId);
    
    let isSaved = false;
    if (index > -1) {
      userSave.adIds.splice(index, 1);
      if (ad) ad.saved = Math.max(0, ad.saved - 1);
    } else {
      userSave.adIds.push(adId);
      if (ad) ad.saved += 1;
      isSaved = true;
    }

    saveStoredData(currentData);
    events.emit('ads_updated', currentData.ads);
    events.emit('user_data_updated', { userId });
    return isSaved;
  },

  async getSavedAds(userId: string): Promise<Ad[]> {
    await delay();
    const userSave = currentData.userSaves.find((s: any) => s.userId === userId);
    if (!userSave) return [];
    return currentData.ads.filter((ad: Ad) => userSave.adIds.includes(ad.id));
  },

  async isAdSaved(userId: string, adId: string): Promise<boolean> {
    const userSave = currentData.userSaves.find((s: any) => s.userId === userId);
    return !!userSave?.adIds.includes(adId);
  },

  async updateFeatured(adId: string, featured: boolean): Promise<void> {
    await delay(300);
    const ad = currentData.ads.find((a: Ad) => a.id === adId);
    if (ad) {
      ad.featured = featured;
      saveStoredData(currentData);
      events.emit('ads_updated', currentData.ads);
    }
  },

  subscribeAds(callback: (ads: Ad[]) => void): () => void {
    const sortedAds = [...currentData.ads].sort((a, b) => b.createdAt - a.createdAt);
    callback(sortedAds);
    return events.subscribe('ads_updated', (ads) => {
      callback([...ads].sort((a, b) => b.createdAt - a.createdAt));
    });
  },

  async create(adData: Partial<Ad>): Promise<string> {
    await delay(1500);
    const newId = adData.id || Math.random().toString(36).substr(2, 9);
    
    const index = currentData.ads.findIndex((a: Ad) => a.id === newId);
    if (index > -1) {
      currentData.ads[index] = { ...currentData.ads[index], ...adData } as Ad;
    } else {
      const newAd = { 
        ...adData, 
        id: newId,
        likes: adData.likes || 0,
        shares: adData.shares || 0,
        saved: adData.saved || 0,
        views: adData.views || 0,
        createdAt: Date.now(),
        status: 'pending', // Issue 06: New ads start as pending
        companyLogo: adData.companyLogo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=100&q=80',
        companyName: adData.companyName || 'Admin Post'
      } as Ad;
      currentData.ads.push(newAd);
    }
    
    saveStoredData(currentData);
    events.emit('ads_updated', currentData.ads);
    return newId;
  },

  async delete(id: string): Promise<void> {
    await delay(500);
    const index = currentData.ads.findIndex((a: Ad) => a.id === id);
    if (index > -1) {
      currentData.ads.splice(index, 1);
      saveStoredData(currentData);
      events.emit('ads_updated', currentData.ads);
    }
  },

  async updateStatus(id: string, status: 'active' | 'pending' | 'rejected'): Promise<void> {
    await delay(800);
    const ad = currentData.ads.find((a: Ad) => a.id === id);
    if (ad) {
      ad.status = status;
      
      const statusSymbol = status === 'active' ? 'Aprovado ✅' : 'Rejeitado ❌';
      const detailMsg = status === 'active' 
        ? `Seu anúncio "${ad.title}" já está no ar.` 
        : `Seu anúncio "${ad.title}" não passou nas diretrizes de moderação.`;
      
      if (!currentData.notifications) currentData.notifications = [];
      currentData.notifications.push({
        id: Math.random().toString(36).substr(2, 9),
        title: `Anúncio ${statusSymbol}`,
        message: detailMsg,
        createdAt: Date.now(),
        unread: true,
        type: 'approval'
      });

      saveStoredData(currentData);
      events.emit('ads_updated', currentData.ads);
      events.emit('notifications_updated', currentData.notifications);
    }
  }
};

export const categoryService = {
  async getAll(): Promise<{ id: string; name: any; icon: string; imageUrl?: string; disabled?: boolean }[]> {
    await delay(500);
    return [...currentData.categories];
  },

  async create(name: string, icon: string, imageUrl?: string): Promise<string> {
    await delay(800);
    const newId = Math.random().toString(36).substr(2, 9);
    const newCat = { id: newId, name: name as any, icon, imageUrl, disabled: false };
    currentData.categories.push(newCat);
    saveStoredData(currentData);
    return newId;
  },

  async update(id: string, name: string, icon: string, imageUrl?: string, disabled?: boolean): Promise<void> {
    await delay(500);
    const cat = currentData.categories.find((c: any) => c.id === id);
    if (cat) {
      cat.name = name;
      cat.icon = icon;
      cat.imageUrl = imageUrl;
      cat.disabled = disabled ?? cat.disabled;
      saveStoredData(currentData);
    }
  },

  async remove(id: string): Promise<void> {
    await delay(500);
    const index = currentData.categories.findIndex((c: any) => c.id === id);
    if (index > -1) {
      currentData.categories.splice(index, 1);
      saveStoredData(currentData);
    }
  }
};

export const companyService = {
  async getAll(): Promise<Company[]> {
    await delay(300);
    return [...currentData.companies];
  },

  async getById(id: string): Promise<Company | undefined> {
    await delay();
    return currentData.companies.find((c: Company) => c.id === id);
  },

  async getByUserId(userId: string): Promise<Company | undefined> {
    await delay();
    return currentData.companies.find((c: Company) => c.userId === userId);
  },

  async getPending(): Promise<Company[]> {
    await delay();
    return currentData.companies.filter((c: Company) => c.status === 'pending');
  },

  async updateStatus(id: string, status: 'active' | 'pending' | 'rejected'): Promise<void> {
    await delay(800);
    const company = currentData.companies.find((c: Company) => c.id === id);
    if (company) {
      company.status = status;
      if (status === 'active') company.verified = true;
      
      const statusSymbol = status === 'active' ? 'Aprovada ✅' : 'Rejeitada ❌';
      const detailMsg = status === 'active' 
        ? `Sua empresa "${company.name}" foi verificada com sucesso!` 
        : `Sua empresa "${company.name}" não foi aceita pela administração.`;
        
      if (!currentData.notifications) currentData.notifications = [];
      currentData.notifications.push({
        id: Math.random().toString(36).substr(2, 9),
        title: `Parceria ${statusSymbol}`,
        message: detailMsg,
        createdAt: Date.now(),
        unread: true,
        type: 'approval'
      });

      saveStoredData(currentData);
      events.emit('notifications_updated', currentData.notifications);
    }
  },

  async create(companyData: Partial<Company>): Promise<string> {
    await delay(1000);
    const newId = companyData.id || Math.random().toString(36).substr(2, 9);
    
    const index = currentData.companies.findIndex((c: Company) => c.id === newId);
    if (index > -1) {
      currentData.companies[index] = {
        ...currentData.companies[index],
        ...companyData,
        id: newId
      } as Company;
    } else {
      const newCompany = {
        ...companyData,
        id: newId,
        status: companyData.status || 'pending',
        verified: companyData.verified || false,
        logo: companyData.logo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=100&q=80',
      } as Company;
      currentData.companies.push(newCompany);
    }
    
    saveStoredData(currentData);
    return newId;
  },

  async delete(id: string): Promise<void> {
    await delay(500);
    const index = currentData.companies.findIndex((c: Company) => c.id === id);
    if (index > -1) {
      currentData.companies.splice(index, 1);
      saveStoredData(currentData);
    }
  }
};

export const couponService = {
  async getAll(): Promise<Coupon[]> {
    await delay();
    return [...currentData.coupons];
  },

  async getById(id: string): Promise<Coupon | undefined> {
    await delay();
    return currentData.coupons.find((c: any) => c.id === id);
  },

  async redeem(userId: string, couponId: string): Promise<UserCoupon | null> {
    await delay(1000);
    const coupon = currentData.coupons.find((c: any) => c.id === couponId);
    if (!coupon) return null;

    const existing = currentData.userCoupons.find((uc: any) => uc.userId === userId && uc.couponId === couponId);
    if (existing) return existing;

    const company = currentData.companies.find((c: any) => c.id === coupon.companyId);

    const newUserCoupon: UserCoupon = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      couponId,
      code: coupon.code,
      companyName: company?.name || 'Empresa Vapt',
      discountValue: coupon.discountValue,
      expiresAt: coupon.expiresAt,
      redeemedAt: Date.now()
    };

    currentData.userCoupons.push(newUserCoupon);
    coupon.usedCount += 1;
    saveStoredData(currentData);
    events.emit('user_data_updated', { userId });
    return newUserCoupon;
  },

  async getUserCoupons(userId: string): Promise<UserCoupon[]> {
    await delay();
    return currentData.userCoupons.filter((uc: any) => uc.userId === userId);
  },

  async create(couponData: Omit<Coupon, 'id' | 'usedCount'> & { id?: string; usedCount?: number }): Promise<string> {
    await delay(500);
    const newId = couponData.id || Math.random().toString(36).substr(2, 9);
    const index = currentData.coupons.findIndex((c: Coupon) => c.id === newId);
    const fullCoupon: Coupon = {
      ...couponData,
      id: newId,
      usedCount: couponData.usedCount || 0
    };
    if (index > -1) {
      currentData.coupons[index] = fullCoupon;
    } else {
      currentData.coupons.push(fullCoupon);
    }
    saveStoredData(currentData);
    events.emit('coupons_updated', currentData.coupons);
    return newId;
  },

  async delete(id: string): Promise<void> {
    await delay(300);
    const index = currentData.coupons.findIndex((c: Coupon) => c.id === id);
    if (index > -1) {
      currentData.coupons.splice(index, 1);
      saveStoredData(currentData);
      events.emit('coupons_updated', currentData.coupons);
    }
  }
};

export const notificationService = {
  async getAll(): Promise<AppNotification[]> {
    await delay(200);
    return [...(currentData.notifications || [])].sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
  
  async markAsRead(id: string): Promise<void> {
    await delay(100);
    if (!currentData.notifications) currentData.notifications = [];
    const notif = currentData.notifications.find((n: any) => n.id === id);
    if (notif) {
      notif.unread = false;
      saveStoredData(currentData);
      events.emit('notifications_updated', currentData.notifications);
    }
  },

  async markAllAsRead(): Promise<void> {
    await delay(150);
    if (!currentData.notifications) currentData.notifications = [];
    currentData.notifications.forEach((n: any) => n.unread = false);
    saveStoredData(currentData);
    events.emit('notifications_updated', currentData.notifications);
  },

  async add(title: string, message: string, type: 'coupon' | 'approval' | 'chat'): Promise<void> {
    if (!currentData.notifications) currentData.notifications = [];
    const newNotif = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      createdAt: Date.now(),
      unread: true,
      type
    };
    currentData.notifications.push(newNotif);
    saveStoredData(currentData);
    events.emit('notifications_updated', currentData.notifications);
  },

  async clearAll(): Promise<void> {
    await delay(200);
    currentData.notifications = [];
    saveStoredData(currentData);
    events.emit('notifications_updated', currentData.notifications);
  }
};

export const settingsService = {
  async getSettings(): Promise<{ platformWhatsapp: string }> {
    await delay(100);
    if (!currentData.settings) {
      currentData.settings = { platformWhatsapp: 'https://wa.me/5527992830151' };
    }
    return { ...currentData.settings };
  },

  async updateSettings(settings: { platformWhatsapp: string }): Promise<void> {
    await delay(100);
    currentData.settings = { ...settings };
    saveStoredData(currentData);
    events.emit('settings_updated', currentData.settings);
  }
};

