import { useEffect, useState } from 'react';
import { apiClient } from '../client';
import { Imovel } from '../types';
import PropertyCard from './PropertyCard';

interface FeaturedPropertiesProps {
  onSelectProperty?: (imovel: Imovel) => void;
}

export default function FeaturedProperties({ onSelectProperty }: FeaturedPropertiesProps) {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImoveis() {
      try {
        console.log('[FeaturedProperties] Buscando imóveis...');
        const response = await apiClient.getImoveisDestaque(6);

        if (response.success && response.data) {
          console.log('[FeaturedProperties] Imóveis encontrados:', response.data.length);
          setImoveis(response.data);
        } else {
          // Silent fail or log
          console.warn('[FeaturedProperties] API Warning:', response.error);
        }
      } catch (err) {
        console.error('[FeaturedProperties] Erro:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchImoveis();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </section>
    );
  }

  // If no properties, don't show the section or show a graceful message
  if (imoveis.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-blue-600 font-semibold tracking-wide uppercase text-sm">
            Oportunidades Exclusivas
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">
            Imóveis em Destaque
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Uma seleção das melhores propriedades disponíveis em Aracaju para você.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {imoveis.map((imovel) => (
            <PropertyCard
              key={imovel.id}
              imovel={imovel}
              onClick={() => onSelectProperty?.(imovel)}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} // Simplified action or redirect
            className="inline-flex items-center gap-2 text-blue-700 font-bold hover:text-blue-800 transition text-lg group"
          >
            Ver todos os imóveis
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
