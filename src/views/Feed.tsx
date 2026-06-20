import React from 'react';
import AdVideo from '../components/AdVideo';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { adService } from '../services/mockFirebase';
import { Ad } from '../types';

export default function Feed() {
  const [ads, setAds] = React.useState<Ad[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const loader = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const loadInitialAds = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await adService.getLatest(0, 5);
      const activeAds = data.filter(ad => ad.status === 'active');
      setAds(activeAds);
      setPage(0);
      setHasMore(data.length === 5);
    } catch (err) {
      console.error('Error loading initial ads:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = React.useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const data = await adService.getLatest(nextPage, 5);
      
      if (data.length === 0) {
        setHasMore(false);
        return;
      }

      setAds(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const newUniqueAds = data.filter(ad => ad.status === 'active' && !existingIds.has(ad.id));
        return [...prev, ...newUniqueAds];
      });
      setPage(nextPage);
      setHasMore(data.length === 5);
    } catch (err) {
      console.error('Error loading more ads:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page]);

  React.useEffect(() => {
    loadInitialAds();
  }, [loadInitialAds]);

  // Observer for loading more ads
  React.useEffect(() => {
    const loaderNode = loader.current;
    const scrollNode = scrollContainerRef.current;
    if (!loaderNode || !hasMore || !scrollNode) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoading && hasMore) {
        loadMore();
      }
    }, { 
      root: scrollNode,
      rootMargin: '600px', // Pre-load ads much earlier
      threshold: 0.1 
    });

    observer.observe(loaderNode);
    return () => observer.disconnect();
  }, [isLoading, hasMore, loadMore, ads.length]); // Added ads.length to re-attach when list grows

  // Handle scroll to track active index
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPos = container.scrollTop;
    const itemHeight = container.clientHeight;
    const index = Math.round(scrollPos / itemHeight);
    if (index !== activeIndex && index >= 0 && index < ads.length) {
      setActiveIndex(index);
      // Increment views
      adService.incrementViews(ads[index].id);
    }
  };

  const scrollUp = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollTop - container.clientHeight,
        behavior: 'smooth'
      });
    }
  };

  const scrollDown = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollTop + container.clientHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <Helmet>
        <title>Vapt Market | O que você procura em Segundos</title>
        <meta name="description" content="Descubra ofertas, eletrônicos, gastronomia e muito mais no Vapt Market. Anúncios curtos em vídeo para o que você procura." />
      </Helmet>
      
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="w-full max-w-lg mx-auto aspect-[9/16] h-[calc(100vh-180px)] md:h-[800px] flex flex-col gap-12 snap-y snap-mandatory overflow-y-auto no-scrollbar shadow-2xl pb-24 px-2 md:px-0"
      >
        {isLoading && ads.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-surface-panel rounded-3xl animate-pulse">
            <div className="w-20 h-20 bg-white/10 rounded-full" />
            <div className="w-48 h-4 bg-white/10 rounded-full" />
            <div className="w-32 h-3 bg-white/5 rounded-full" />
          </div>
        ) : ads.map((ad, index) => (
          <div 
            key={ad.id}
            ref={index === ads.length - 1 ? loader : null}
            className="w-full h-full flex-shrink-0 snap-start"
          >
            <AdVideo ad={ad} isActive={index === activeIndex} />
          </div>
        ))}
        
        {/* Loading Indicator / Intersection Trigger */}
        <div className="w-full py-12 flex flex-col items-center justify-center gap-4 snap-start">
          {hasMore ? (
            <>
              <div className="w-8 h-8 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest animate-pulse">Carregando mais ofertas...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-1 bg-white/10 rounded-full" />
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Você chegou ao fim das novidades</p>
            </>
          )}
        </div>
      </div>
      
      {/* Floating indicators as seen in design */}
      <div className="hidden lg:flex fixed right-12 top-1/2 -translate-y-1/2 flex-col gap-4 text-white">
        <button 
          onClick={scrollUp}
          className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          title="Vídeo Anterior"
        >
           <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
           </svg>
        </button>
        <button 
          onClick={scrollDown}
          className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          title="Próximo Vídeo"
        >
           <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
           </svg>
        </button>
      </div>
    </div>
  );
}
