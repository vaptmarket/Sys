import React from 'react';
import { 
  Utensils, 
  Home, 
  Hotel, 
  Car, 
  Building2, 
  Shirt, 
  Smartphone, 
  Wrench, 
  ShoppingCart, 
  HardHat, 
  Palmtree, 
  Tag, 
  Ticket, 
  Truck, 
  Box,
  HelpCircle
} from 'lucide-react';
import { Category } from '../types';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { categoryService } from '../services/mockFirebase';

const ICON_MAP: Record<string, any> = {
  Utensils,
  Home,
  Hotel,
  Car,
  Building2,
  Shirt,
  Smartphone,
  Wrench,
  ShoppingCart,
  HardHat,
  Palmtree,
  Tag,
  Ticket,
  Truck,
  Box,
  HelpCircle
};

const CATEGORY_UI: Record<string, { icon: any; color: string; image: string }> = {
  'Restaurantes': { icon: Utensils, color: 'bg-orange-500', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80' },
  'Pousadas': { icon: Palmtree, color: 'bg-blue-500', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80' },
  'Hotéis': { icon: Hotel, color: 'bg-indigo-500', image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=400&q=80' },
  'Veículos': { icon: Car, color: 'bg-red-500', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80' },
  'Imóveis': { icon: Building2, color: 'bg-emerald-500', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80' },
  'Moda': { icon: Shirt, color: 'bg-pink-500', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=400&q=80' },
  'Eletrônicos': { icon: Smartphone, color: 'bg-cyan-500', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=400&q=80' },
  'Serviços': { icon: Wrench, color: 'bg-amber-500', image: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?auto=format&fit=crop&w=400&q=80' },
  'Mercado': { icon: ShoppingCart, color: 'bg-green-500', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80' },
  'Construção': { icon: HardHat, color: 'bg-slate-500', image: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&w=400&q=80' },
  'Turismo': { icon: Palmtree, color: 'bg-teal-500', image: 'https://images.unsplash.com/photo-1500835595272-85144e117d98?auto=format&fit=crop&w=400&q=80' },
  'Promoções': { icon: Tag, color: 'bg-rose-500', image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=400&q=80' },
  'Eventos': { icon: Ticket, color: 'bg-purple-500', image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=400&q=80' },
  'Delivery': { icon: Truck, color: 'bg-yellow-500', image: 'https://images.unsplash.com/photo-1526367790999-015078648c7e?auto=format&fit=crop&w=400&q=80' },
  'Produtos Usados': { icon: Box, color: 'bg-brown-500', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80' },
};

export default function Categories() {
  const [categories, setCategories] = React.useState<{ id: string; name: Category; icon: string; imageUrl?: string; disabled?: boolean }[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    categoryService.getAll().then(data => {
      setCategories(data.filter((c: any) => !c.disabled));
      setIsLoading(false);
    });
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <div className="py-6">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl md:text-4xl font-black font-display text-white mb-2">Explore Canais</h1>
        <p className="text-white/40 font-semibold uppercase tracking-widest text-[10px]">Canais de Divulgação Associados à Categoria de Cada Empresa Parceira</p>
      </motion.header>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-square rounded-3xl bg-surface-panel animate-pulse border border-white/5" />
          ))}
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
        >
          {categories.map((cat) => {
            const ui = CATEGORY_UI[cat.name] || {
              icon: Tag,
              color: 'bg-brand-blue',
              image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'
            };
            const Icon = (cat.icon && ICON_MAP[cat.icon]) || ui.icon;
            
            return (
              <motion.div
                key={cat.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                className="group relative aspect-square rounded-3xl overflow-hidden shadow-xl border border-white/5"
              >
                <Link to={`/busca?category=${cat.name}`} className="absolute inset-0">
                  <img 
                    src={cat.imageUrl || ui.image} 
                    alt={cat.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-deep via-transparent to-transparent" />
                  
                  <div className="absolute bottom-5 left-5 right-5">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg", ui.color)}>
                      <Icon size={20} />
                    </div>
                    <h3 className="text-white font-bold text-base leading-tight uppercase tracking-tight">{cat.name}</h3>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
