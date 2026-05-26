
import { useState, useEffect } from 'react';
import { apiClient } from '../client';
import { Imovel } from '../types';

import AISearchBar from './AISearchBar';

const HERO_BG_IMAGE = 'https://images.unsplash.com/photo-1600596542815-2a4d9f9313b6?q=80&w=2070&auto=format&fit=crop';

interface HeroProps {
  onSelectProperty?: (imovel: Imovel) => void;
  onSearch?: (results: Imovel[], interpretation: any) => void;
}

export default function Hero({ onSelectProperty, onSearch }: HeroProps) {
  const [imovel, setImovel] = useState<Imovel | null>(null);
  const [previewImageFailed, setPreviewImageFailed] = useState(false);


  useEffect(() => {
    async function loadFeaturedImovel() {
      try {
        const response = await apiClient.getImoveisDestaque(8);

        if (response.success && response.data && response.data.length > 0) {
          const featured = response.data.find((item) => !item.is_launch && item.foto_principal) || response.data[0];
          setImovel(featured);
        }
      } catch (error) {
        console.error('[Hero] Erro:', error);
      }
    }

    loadFeaturedImovel();
  }, []);

  const bgImage = HERO_BG_IMAGE;
  const previewImage = !previewImageFailed ? imovel?.foto_principal || HERO_BG_IMAGE : HERO_BG_IMAGE;

  return (
    <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-gray-900">
      {/* Background Image with Parallax-like effect */}
      <div className="absolute inset-0 z-0">
        <img
          src={bgImage}
          alt="Luxury Home"
          className="w-full h-full object-cover transition-transform duration-[20s] hover:scale-110"
        />
        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-gray-900/40 to-gray-900/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="animate-fade-in-up">
          <span className="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-medium tracking-wide mb-6 uppercase">
            Exclusividade & Sofisticação
          </span>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight shadow-md">
            Encontre o Imóvel <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">
              dos Seus Sonhos
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto font-light">
            Uma seleção curada das propriedades mais exclusivas de Aracaju e região.
          </p>

          {/* Search Bar / CTA */}
          <div className="max-w-4xl mx-auto transform transition-all hover:scale-[1.01] z-30 relative relative">
            <AISearchBar
              onResults={(res, interpretation) => onSearch && onSearch(res, interpretation)}
              onQuery={(q) => console.log('Buscando:', q)}
            />
          </div>

          {/* Quick Stats or Trusted By */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/80">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-white">500+</span>
              <span className="text-sm uppercase tracking-wider">Imóveis</span>
            </div>
            <div className="w-px h-12 bg-white/20 hidden md:block"></div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-white">150+</span>
              <span className="text-sm uppercase tracking-wider">Vendidos</span>
            </div>
            <div className="w-px h-12 bg-white/20 hidden md:block"></div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-white">24/7</span>
              <span className="text-sm uppercase tracking-wider">Suporte IA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Property Preview (Floating) */}
      {imovel && (
        <div className="absolute bottom-8 right-8 z-20 hidden lg:block max-w-sm animate-slide-in-right">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/50 hover:bg-white transition duration-300 group cursor-pointer"
            onClick={() => onSelectProperty?.(imovel)}>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden active:scale-95 transition">
                <img
                  src={previewImage}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  alt=""
                  onError={() => setPreviewImageFailed(true)}
                />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase mb-1">Destaque</p>
                <h3 className="font-bold text-gray-900 leading-tight mb-1">{imovel.titulo}</h3>
                <p className="text-sm text-gray-600">{imovel.bairro}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full group-hover:bg-blue-600 group-hover:text-white transition ml-auto">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
