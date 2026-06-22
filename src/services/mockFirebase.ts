import { Ad, Category, Company, UserSaved, UserCoupon, Coupon, AppNotification } from '../types';
import { MOCK_ADS, MOCK_CATEGORIES, MOCK_COMPANIES, MOCK_COUPONS } from '../constants/mocks';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}


// Simulation utility for future latency
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

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

// LocalStorage Persistence Fallback Layer
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
    categories: MOCK_CATEGORIES as any[], 
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
      return defaultData;
    }
  }
  return defaultData;
};

const saveStoredData = (data: any) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('LocalStorage persistence failed:', err);
  }
};

let currentData = getStoredData();

// Firestore background initialization & seed helper
const seedCollection = async <T extends { id: string }>(colName: string, defaultData: T[]) => {
  try {
    const qSnap = await getDocs(collection(db, colName));
    if (qSnap.empty) {
      console.log(`Seeding empty collection: ${colName}`);
      for (const item of defaultData) {
        await setDoc(doc(db, colName, item.id), item);
      }
    }
  } catch (err) {
    console.error(`Failed to seed collection ${colName}:`, err);
    handleFirestoreError(err, OperationType.WRITE, colName);
  }
};


// Seed essential static lists dynamically
seedCollection('categories', MOCK_CATEGORIES as any[]).catch(e => console.warn('Categories auto-seed deferred', e));
seedCollection('companies', MOCK_COMPANIES).catch(e => console.warn('Companies auto-seed deferred', e));
seedCollection('ads', MOCK_ADS).catch(e => console.warn('Ads auto-seed deferred', e));
seedCollection('coupons', MOCK_COUPONS).catch(e => console.warn('Coupons auto-seed deferred', e));


export const adService = {
  async getAll(): Promise<Ad[]> {
    try {
      await seedCollection('ads', MOCK_ADS);
      const snap = await getDocs(collection(db, 'ads'));
      const ads: Ad[] = [];
      snap.forEach(d => {
        ads.push({ id: d.id, ...d.data() } as Ad);
      });
      return ads.sort((a, b) => b.createdAt - a.createdAt);
    } catch (e) {
      console.error('Firestore ads.getAll error, fallback to local:', e);
      return [...currentData.ads].sort((a, b) => b.createdAt - a.createdAt);
    }
  },

  async getById(id: string): Promise<Ad | undefined> {
    try {
      const snap = await getDoc(doc(db, 'ads', id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Ad;
      }
      return undefined;
    } catch {
      return currentData.ads.find((ad: Ad) => ad.id === id);
    }
  },

  async getLatest(page = 0, limitCount = 10): Promise<Ad[]> {
    try {
      await seedCollection('ads', MOCK_ADS);
      const snap = await getDocs(collection(db, 'ads'));
      const ads: Ad[] = [];
      snap.forEach(d => {
        const item = { id: d.id, ...d.data() } as Ad;
        if (item.status === 'active') {
          ads.push(item);
        }
      });
      ads.sort((a, b) => b.createdAt - a.createdAt);
      const start = page * limitCount;
      return ads.slice(start, start + limitCount);
    } catch (e) {
      console.error('Firestore getLatest error, fallback to local:', e);
      const activeAds = currentData.ads.filter((ad: Ad) => ad.status === 'active');
      const sortedAds = [...activeAds].sort((a, b) => b.createdAt - a.createdAt);
      const start = page * limitCount;
      return sortedAds.slice(start, start + limitCount);
    }
  },

  async updateLikes(adId: string, increment: number): Promise<void> {
    try {
      const docRef = doc(db, 'ads', adId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const currentLikes = snap.data().likes || 0;
        await updateDoc(docRef, { likes: Math.max(0, currentLikes + increment) });
      }
    } catch (e) {
      console.error('Firestore updateLikes error, fallback to local:', e);
    }

    // Sync local fallback
    const ad = currentData.ads.find((a: Ad) => a.id === adId);
    if (ad) {
      ad.likes = Math.max(0, ad.likes + increment);
      saveStoredData(currentData);
      events.emit('ads_updated', currentData.ads);
    }
  },

  async incrementViews(adId: string): Promise<void> {
    try {
      const docRef = doc(db, 'ads', adId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const currentViews = snap.data().views || 0;
        await updateDoc(docRef, { views: currentViews + 1 });
      }
    } catch (e) {
      console.error('Firestore incrementViews error, fallback to local:', e);
    }

    // Sync local fallback
    const ad = currentData.ads.find((a: Ad) => a.id === adId);
    if (ad) {
      ad.views += 1;
      saveStoredData(currentData);
      events.emit('ads_updated', currentData.ads);
    }
  },

  async toggleSave(userId: string, adId: string): Promise<boolean> {
    let isSaved = false;
    try {
      const saveRef = doc(db, 'userSaves', userId);
      const snap = await getDoc(saveRef);
      let adIds: string[] = [];
      if (snap.exists()) {
        adIds = snap.data().adIds || [];
      }
      const index = adIds.indexOf(adId);
      if (index > -1) {
        adIds.splice(index, 1);
      } else {
        adIds.push(adId);
        isSaved = true;
      }
      await setDoc(saveRef, { userId, adIds });

      const adDocRef = doc(db, 'ads', adId);
      const adSnap = await getDoc(adDocRef);
      if (adSnap.exists()) {
        const currentSaved = adSnap.data().saved || 0;
        await updateDoc(adDocRef, { saved: Math.max(0, currentSaved + (isSaved ? 1 : -1)) });
      }
    } catch (e) {
      console.error('Firestore toggleSave error:', e);
    }

    // Sync local fallback
    let userSave = currentData.userSaves.find((s: any) => s.userId === userId);
    if (!userSave) {
      userSave = { userId, adIds: [] };
      currentData.userSaves.push(userSave);
    }
    const index = userSave.adIds.indexOf(adId);
    const ad = currentData.ads.find((a: Ad) => a.id === adId);
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
    try {
      const saveRef = doc(db, 'userSaves', userId);
      const snap = await getDoc(saveRef);
      if (!snap.exists()) return [];
      const adIds: string[] = snap.data().adIds || [];
      if (adIds.length === 0) return [];

      const adsSnap = await getDocs(collection(db, 'ads'));
      const ads: Ad[] = [];
      adsSnap.forEach(d => {
        const item = { id: d.id, ...d.data() } as Ad;
        if (adIds.includes(item.id)) {
          ads.push(item);
        }
      });
      return ads;
    } catch (e) {
      console.error('Firestore getSavedAds error:', e);
      const userSave = currentData.userSaves.find((s: any) => s.userId === userId);
      if (!userSave) return [];
      return currentData.ads.filter((ad: Ad) => userSave.adIds.includes(ad.id));
    }
  },

  async isAdSaved(userId: string, adId: string): Promise<boolean> {
    try {
      const saveRef = doc(db, 'userSaves', userId);
      const snap = await getDoc(saveRef);
      if (snap.exists()) {
        const adIds: string[] = snap.data().adIds || [];
        return adIds.includes(adId);
      }
      return false;
    } catch {
      const userSave = currentData.userSaves.find((s: any) => s.userId === userId);
      return !!userSave?.adIds.includes(adId);
    }
  },

  async updateFeatured(adId: string, featured: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, 'ads', adId), { featured });
    } catch (e) {
      console.error('Firestore updateFeatured error:', e);
    }

    // Sync local fallback
    const ad = currentData.ads.find((a: Ad) => a.id === adId);
    if (ad) {
      ad.featured = featured;
      saveStoredData(currentData);
      events.emit('ads_updated', currentData.ads);
    }
  },

  subscribeAds(callback: (ads: Ad[]) => void): () => void {
    let unsubFirestore: (() => void) | null = null;
    let active = true;

    seedCollection('ads', MOCK_ADS).then(() => {
      if (!active) return;
      unsubFirestore = onSnapshot(collection(db, 'ads'), (snap) => {
        const ads: Ad[] = [];
        snap.forEach(d => {
          ads.push({ id: d.id, ...d.data() } as Ad);
        });
        ads.sort((a, b) => b.createdAt - a.createdAt);
        callback(ads);
      }, (err) => {
        console.error('Firestore subscribeAds error, using local fallback:', err);
      });
    });

    const localUnsub = events.subscribe('ads_updated', (ads) => {
      callback([...ads].sort((a, b) => b.createdAt - a.createdAt));
    });

    return () => {
      active = false;
      if (unsubFirestore) unsubFirestore();
      localUnsub();
    };
  },

  async create(adData: Partial<Ad>): Promise<string> {
    const newId = adData.id || Math.random().toString(36).substr(2, 9);
    const newAd = { 
      ...adData, 
      id: newId,
      likes: adData.likes || 0,
      shares: adData.shares || 0,
      saved: adData.saved || 0,
      views: adData.views || 0,
      createdAt: adData.createdAt || Date.now(),
      status: adData.status || 'pending',
      companyLogo: adData.companyLogo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=100&q=80',
      companyName: adData.companyName || 'Admin Post'
    } as Ad;

    try {
      await setDoc(doc(db, 'ads', newId), newAd);
    } catch (e) {
      console.error('Firestore ad creation failed, falling back:', e);
    }

    // Local sync
    const index = currentData.ads.findIndex((a: Ad) => a.id === newId);
    if (index > -1) {
      currentData.ads[index] = { ...currentData.ads[index], ...newAd } as Ad;
    } else {
      currentData.ads.push(newAd);
    }
    saveStoredData(currentData);
    events.emit('ads_updated', currentData.ads);
    return newId;
  },

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'ads', id));
    } catch (e) {
      console.error('Firestore ad delete failed:', e);
    }

    // Local sync
    const index = currentData.ads.findIndex((a: Ad) => a.id === id);
    if (index > -1) {
      currentData.ads.splice(index, 1);
      saveStoredData(currentData);
      events.emit('ads_updated', currentData.ads);
    }
  },

  async updateStatus(id: string, status: 'active' | 'pending' | 'rejected'): Promise<void> {
    const statusSymbol = status === 'active' ? 'Aprovado ✅' : 'Rejeitado ❌';
    let adTitle = 'Anúncio';
    try {
      const adDocRef = doc(db, 'ads', id);
      const adSnap = await getDoc(adDocRef);
      if (adSnap.exists()) {
        adTitle = adSnap.data().title || adTitle;
        await updateDoc(adDocRef, { status });
      }
    } catch (e) {
      console.error('Firestore updateStatus error:', e);
    }

    const ad = currentData.ads.find((a: Ad) => a.id === id);
    if (ad) {
      ad.status = status;
      adTitle = ad.title || adTitle;
    }

    const detailMsg = status === 'active' 
      ? `Seu anúncio "${adTitle}" já está no ar.` 
      : `Seu anúncio "${adTitle}" não passou nas diretrizes de moderação.`;

    const newNotif = {
      id: Math.random().toString(36).substr(2, 9),
      title: `Anúncio ${statusSymbol}`,
      message: detailMsg,
      createdAt: Date.now(),
      unread: true,
      type: 'approval' as const
    };

    try {
      await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
    } catch (e) {
      console.error('Firestore updateStatus notification insert failed:', e);
    }

    if (!currentData.notifications) currentData.notifications = [];
    currentData.notifications.push(newNotif);

    if (ad) {
      saveStoredData(currentData);
    }
    
    events.emit('ads_updated', currentData.ads);
    events.emit('notifications_updated', currentData.notifications);
  }
};

export const categoryService = {
  async getAll(): Promise<{ id: string; name: any; icon: string; imageUrl?: string; disabled?: boolean }[]> {
    try {
      await seedCollection('categories', MOCK_CATEGORIES as any[]);
      const snap = await getDocs(collection(db, 'categories'));
      const categories: any[] = [];
      snap.forEach(d => {
        categories.push({ id: d.id, ...d.data() });
      });
      return categories;
    } catch (e) {
      console.error('Firestore categories.getAll failed:', e);
      handleFirestoreError(e, OperationType.GET, 'categories');
      return [...currentData.categories];
    }
  },

  async create(name: string, icon: string, imageUrl?: string): Promise<string> {
    const newId = Math.random().toString(36).substr(2, 9);
    const newCat = { id: newId, name: name as any, icon, imageUrl, disabled: false };
    try {
      await setDoc(doc(db, 'categories', newId), newCat);
    } catch (e) {
      console.error('Firestore categories.create failed:', e);
    }
    currentData.categories.push(newCat);
    saveStoredData(currentData);
    return newId;
  },

  async update(id: string, name: string, icon: string, imageUrl?: string, disabled?: boolean): Promise<void> {
    try {
      await setDoc(doc(db, 'categories', id), { name, icon, imageUrl, disabled: disabled ?? false }, { merge: true });
    } catch (e) {
      console.error('Firestore categories.update failed:', e);
    }
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
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (e) {
      console.error('Firestore categories.delete failed:', e);
    }
    const index = currentData.categories.findIndex((c: any) => c.id === id);
    if (index > -1) {
      currentData.categories.splice(index, 1);
      saveStoredData(currentData);
    }
  }
};

export const companyService = {
  async getAll(): Promise<Company[]> {
    try {
      await seedCollection('companies', MOCK_COMPANIES);
      const snap = await getDocs(collection(db, 'companies'));
      const companies: Company[] = [];
      snap.forEach(d => {
        companies.push({ id: d.id, ...d.data() } as Company);
      });
      return companies;
    } catch (e) {
      return [...currentData.companies];
    }
  },

  async getById(id: string): Promise<Company | undefined> {
    try {
      const snap = await getDoc(doc(db, 'companies', id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Company;
      }
      return undefined;
    } catch (e) {
      return currentData.companies.find((c: Company) => c.id === id);
    }
  },

  async getByUserId(userId: string): Promise<Company | undefined> {
    try {
      const q = query(collection(db, 'companies'), where('userId', '==', userId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { id: d.id, ...d.data() } as Company;
      }
      return undefined;
    } catch (e) {
      console.error('Firestore getByUserId error:', e);
      return currentData.companies.find((c: Company) => c.userId === userId);
    }
  },

  async getPending(): Promise<Company[]> {
    try {
      const snap = await getDocs(collection(db, 'companies'));
      const pending: Company[] = [];
      snap.forEach(d => {
        const c = { id: d.id, ...d.data() } as Company;
        if (c.status === 'pending') {
          pending.push(c);
        }
      });
      return pending;
    } catch (e) {
      return currentData.companies.filter((c: Company) => c.status === 'pending');
    }
  },

  async updateStatus(id: string, status: 'active' | 'pending' | 'rejected'): Promise<void> {
    const statusSymbol = status === 'active' ? 'Aprovada ✅' : 'Rejeitada ❌';
    let companyName = 'Empresa';
    try {
      const docRef = doc(db, 'companies', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        companyName = snap.data().name || companyName;
        await updateDoc(docRef, { status, verified: status === 'active' ? true : snap.data().verified || false });
      }
    } catch (e) {
      console.error('Firestore company.updateStatus error:', e);
    }

    const company = currentData.companies.find((c: Company) => c.id === id);
    if (company) {
      company.status = status;
      if (status === 'active') company.verified = true;
      companyName = company.name || companyName;
    }

    const detailMsg = status === 'active' 
      ? `Sua empresa "${companyName}" foi verificada com sucesso!` 
      : `Sua empresa "${companyName}" não foi aceita pela administração.`;

    const newNotif = {
      id: Math.random().toString(36).substr(2, 9),
      title: `Parceria ${statusSymbol}`,
      message: detailMsg,
      createdAt: Date.now(),
      unread: true,
      type: 'approval' as const
    };

    try {
      await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
    } catch (e) {
      console.error('Firestore company notification insert failed:', e);
    }

    if (!currentData.notifications) currentData.notifications = [];
    currentData.notifications.push(newNotif);

    if (company) {
      saveStoredData(currentData);
    }

    events.emit('notifications_updated', currentData.notifications);
  },

  async create(companyData: Partial<Company>): Promise<string> {
    const newId = companyData.id || Math.random().toString(36).substr(2, 9);
    const newCompany = {
      ...companyData,
      id: newId,
      status: companyData.status || 'pending',
      verified: companyData.verified || false,
      logo: companyData.logo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=100&q=80',
    } as Company;

    try {
      await setDoc(doc(db, 'companies', newId), newCompany);
    } catch (e) {
      console.error('Firestore company.create failed:', e);
    }

    const index = currentData.companies.findIndex((c: Company) => c.id === newId);
    if (index > -1) {
      currentData.companies[index] = { ...currentData.companies[index], ...newCompany } as Company;
    } else {
      currentData.companies.push(newCompany);
    }
    saveStoredData(currentData);
    return newId;
  },

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'companies', id));
    } catch (e) {
      console.error('Firestore company.delete failed:', e);
    }
    const index = currentData.companies.findIndex((c: Company) => c.id === id);
    if (index > -1) {
      currentData.companies.splice(index, 1);
      saveStoredData(currentData);
    }
  }
};

export const couponService = {
  async getAll(): Promise<Coupon[]> {
    try {
      await seedCollection('coupons', MOCK_COUPONS);
      const snap = await getDocs(collection(db, 'coupons'));
      const coupons: Coupon[] = [];
      snap.forEach(d => {
        coupons.push({ id: d.id, ...d.data() } as Coupon);
      });
      return coupons;
    } catch (e) {
      return [...currentData.coupons];
    }
  },

  async getById(id: string): Promise<Coupon | undefined> {
    try {
      const snap = await getDoc(doc(db, 'coupons', id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Coupon;
      }
      return undefined;
    } catch {
      return currentData.coupons.find((c: any) => c.id === id);
    }
  },

  async redeem(userId: string, couponId: string): Promise<UserCoupon | null> {
    try {
      const redemptionId = `${userId}_${couponId}`;
      const userCouponRef = doc(db, 'userCoupons', redemptionId);
      const userCouponSnap = await getDoc(userCouponRef);
      if (userCouponSnap.exists()) {
        return userCouponSnap.data() as UserCoupon;
      }

      const couponRef = doc(db, 'coupons', couponId);
      const couponSnap = await getDoc(couponRef);
      if (!couponSnap.exists()) return null;

      const coupon = { id: couponSnap.id, ...couponSnap.data() } as Coupon;
      
      const usedCount = (coupon.usedCount || 0) + 1;
      await updateDoc(couponRef, { usedCount });

      let companyName = 'Empresa Vapt';
      const companySnap = await getDoc(doc(db, 'companies', coupon.companyId));
      if (companySnap.exists()) {
        companyName = companySnap.data().name || companyName;
      }

      const newUserCoupon: UserCoupon = {
        id: redemptionId,
        userId,
        couponId,
        code: coupon.code,
        companyName,
        discountValue: coupon.discountValue,
        expiresAt: coupon.expiresAt,
        redeemedAt: Date.now()
      };

      await setDoc(userCouponRef, newUserCoupon);

      const ucIndex = currentData.userCoupons.findIndex(uc => uc.userId === userId && uc.couponId === couponId);
      if (ucIndex === -1) {
        currentData.userCoupons.push(newUserCoupon);
      }
      const localCoupon = currentData.coupons.find((c: any) => c.id === couponId);
      if (localCoupon) localCoupon.usedCount += 1;
      saveStoredData(currentData);
      events.emit('user_data_updated', { userId });

      return newUserCoupon;
    } catch (e) {
      console.error('Firestore redeem failed, falling back to local:', e);
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
    }
  },

  async getUserCoupons(userId: string): Promise<UserCoupon[]> {
    try {
      const q = query(collection(db, 'userCoupons'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const userCoupons: UserCoupon[] = [];
      snap.forEach(d => {
        userCoupons.push(d.data() as UserCoupon);
      });
      return userCoupons;
    } catch (e) {
      console.error('Firestore getUserCoupons failed:', e);
      return currentData.userCoupons.filter((uc: any) => uc.userId === userId);
    }
  },

  async create(couponData: Omit<Coupon, 'id' | 'usedCount'> & { id?: string; usedCount?: number }): Promise<string> {
    const newId = couponData.id || Math.random().toString(36).substr(2, 9);
    const fullCoupon: Coupon = {
      ...couponData,
      id: newId,
      usedCount: couponData.usedCount || 0
    };

    try {
      await setDoc(doc(db, 'coupons', newId), fullCoupon);
    } catch (e) {
      console.error('Firestore coupon.create failed:', e);
    }

    const index = currentData.coupons.findIndex((c: Coupon) => c.id === newId);
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
    try {
      await deleteDoc(doc(db, 'coupons', id));
    } catch (e) {
      console.error('Firestore coupon.delete failed:', e);
    }

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
    try {
      const snap = await getDocs(collection(db, 'notifications'));
      if (snap.empty) {
        const defaultNotifs = [
          { id: 'n1', title: 'Oferta Relâmpago ⚡', message: 'Restaurante Sabor & Arte lançou um cupom de 50%!', createdAt: Date.now() - 120000, unread: true, type: 'coupon' },
          { id: 'n2', title: 'Anúncio Aprovado ✅', message: 'Seu anúncio "iPhone 15 Pro Max" já está no ar.', createdAt: Date.now() - 3600000, unread: true, type: 'approval' },
          { id: 'n3', title: 'Nova Mensagem 💬', message: 'Você recebeu uma pergunta sobre o Console Retro.', createdAt: Date.now() - 10800000, unread: false, type: 'chat' },
        ];
        for (const notif of defaultNotifs) {
          await setDoc(doc(db, 'notifications', notif.id), notif);
        }
        return defaultNotifs as AppNotification[];
      }
      const notifications: AppNotification[] = [];
      snap.forEach(d => {
        notifications.push({ id: d.id, ...d.data() } as AppNotification);
      });
      return notifications.sort((a, b) => b.createdAt - a.createdAt);
    } catch (e) {
      if (!currentData.notifications) currentData.notifications = [];
      return [...currentData.notifications].sort((a: any, b: any) => b.createdAt - a.createdAt);
    }
  },
  
  async markAsRead(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', id), { unread: false });
    } catch (e) {
      console.error('Firestore notification.markAsRead failed:', e);
    }

    if (!currentData.notifications) currentData.notifications = [];
    const notif = currentData.notifications.find((n: any) => n.id === id);
    if (notif) {
      notif.unread = false;
      saveStoredData(currentData);
    }
    
    this.getAll().then(updatedList => {
      events.emit('notifications_updated', updatedList);
    });
  },

  async markAllAsRead(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'notifications'));
      for (const d of snap.docs) {
        if (d.data().unread) {
          await updateDoc(doc(db, 'notifications', d.id), { unread: false });
        }
      }
    } catch (e) {
      console.error('Firestore notification.markAllAsRead failed:', e);
    }

    if (!currentData.notifications) currentData.notifications = [];
    currentData.notifications.forEach((n: any) => n.unread = false);
    saveStoredData(currentData);

    this.getAll().then(updatedList => {
      events.emit('notifications_updated', updatedList);
    });
  },

  async add(title: string, message: string, type: 'coupon' | 'approval' | 'chat'): Promise<void> {
    const newNotif = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      createdAt: Date.now(),
      unread: true,
      type
    };

    try {
      await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
    } catch (e) {
      console.error('Firestore notification.add failed:', e);
    }

    if (!currentData.notifications) currentData.notifications = [];
    currentData.notifications.push(newNotif);
    saveStoredData(currentData);

    this.getAll().then(updatedList => {
      events.emit('notifications_updated', updatedList);
    });
  },

  async clearAll(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'notifications'));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'notifications', d.id));
      }
    } catch (e) {
      console.error('Firestore notification.clearAll failed:', e);
    }

    currentData.notifications = [];
    saveStoredData(currentData);
    events.emit('notifications_updated', []);
  }
};

export const settingsService = {
  async getSettings(): Promise<{ platformWhatsapp: string }> {
    try {
      const snap = await getDoc(doc(db, 'settings', 'global'));
      if (snap.exists()) {
        return snap.data() as { platformWhatsapp: string };
      }
      const defaultSettings = { platformWhatsapp: 'https://wa.me/5527992830151' };
      await setDoc(doc(db, 'settings', 'global'), defaultSettings);
      return defaultSettings;
    } catch (e) {
      if (!currentData.settings) {
        currentData.settings = { platformWhatsapp: 'https://wa.me/5527992830151' };
      }
      return { ...currentData.settings };
    }
  },

  async updateSettings(settings: { platformWhatsapp: string }): Promise<void> {
    try {
      await setDoc(doc(db, 'settings', 'global'), settings, { merge: true });
    } catch (e) {
      console.error('Firestore settings.updateSettings failed:', e);
    }
    currentData.settings = { ...settings };
    saveStoredData(currentData);
    events.emit('settings_updated', currentData.settings);
  }
};
