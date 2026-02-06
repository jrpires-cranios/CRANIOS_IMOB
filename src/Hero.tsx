import { useState, useEffect } from 'react';
import { apiClient } from '../client';

interface Imovel {
  id: string;
  tipo: string;
  finalidade: string;
  titulo: string;
  descricao?: string;
  endereco: string;
  bairro?: string;
  cidade: string;
  preco_venda?: number;
  preco_locacao?: number;
  area_total?: number;
  quartos?: number;
  foto_principal?: string;
}

export default function Hero() {
  const [imovel, setImovel] = useState<Imovel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeaturedImovel() {
      try {
        setLoading(true);
        const response = await apiClient.getImoveisDestaque(1);
        
        if (response.success && response.data && response.data.length > 0) {
          console.log('[Hero] Imóvel destaque:', response.data[0]);
          setImovel(response.data[0]);
        }
      } catch (error) {
        console.error('[Hero] Erro:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFeaturedImovel();
  }, []);

  return (
    <section className="relative bg-gray-900 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {imovel?.foto_principal ? (
          <img
            src={imovel.foto_principal}
            alt={imovel.titulo}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/50 to-gray-900" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 sm:py-32">
        <div className="max-w-3xl">
          <div className="inline-block px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg font-bold text-sm mb-6">
            ⭐ DESTAQUE DA SEMANA
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
            {loading ? (
              <span className="inline-block animate-pulse">Carregando...</span>
            ) : (
              <>
                Encontre o imóvel
                <br />
                <span className="text-yellow-400">
                  dos seus sonhos
                </span>
              </>
            )}
          </h1>

          {!loading && imovel && (
            <>
              <p className="text-xl text-gray-300 mb-6">
                {imovel.bairro}, {imovel.cidade}
              </p>

              <div className="flex gap-4">
                <a
                  href={`#imovel-${imovel.id}`}
                  className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition transform hover:scale-105"
                >
                  Ver detalhes
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7v-12" />
                  </svg>
                </a>
              </div>
            </>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7v-14" />
          </svg>
        </div>
      </div>
    </section>
  );
}
