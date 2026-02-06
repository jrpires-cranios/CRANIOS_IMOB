import { useEffect, useState } from 'react';
import { apiClient } from '../src/client';

interface Imovel {
  id: string;
  tipo: string;
  finalidade: string;
  titulo: string;
  descricao?: string;
  endereco: string;
  bairro?: string;
  cidade: string;
  estado: string;
  cep?: string;
  preco_venda?: number;
  preco_locacao?: number;
  area_total?: number;
  area_construida?: number;
  quartos?: number;
  suites?: number;
  banheiros?: number;
  vagas_garagem?: number;
  caracteristicas?: string[];
  fotos?: string[];
  foto_principal?: string;
  disponivel: boolean;
  destaque: boolean;
  created_at: string;
  updated_at: string;
}

export default function FeaturedProperties() {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImoveis() {
      try {
        console.log('[FeaturedProperties] Buscando imóveis...');
        const response = await apiClient.getImoveisDestaque(6);
        
        if (response.success && response.data) {
          console.log('[FeaturedProperties] Imóveis encontrados:', response.data.length);
          setImoveis(response.data);
        } else {
          setError(response.error || 'Erro ao buscar imóveis');
        }
      } catch (err) {
        console.error('[FeaturedProperties] Erro:', err);
        setError('Erro de conexão com o servidor');
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
          <div className="animate-pulse flex justify-center items-center py-12">
            <div className="text-center">
              <div className="inline-block h-12 w-12 border-4 border-t-blue-500 rounded-full border-t-transparent animate-spin"></div>
              <p className="mt-4 text-gray-600">Carregando imóveis...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">⚠️ Erro</h3>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (imoveis.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Imóveis em Destaque</h2>
          <p className="text-gray-600">Nenhum imóvel em destaque no momento.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Imóveis em Destaque
          </h2>
          <p className="text-gray-600 text-lg">
            As melhores oportunidades de moradia em Salvador
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {imoveis.map((imovel) => (
            <div
              key={imovel.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 border border-gray-200"
            >
              <div className="relative">
                {imovel.foto_principal ? (
                  <img
                    src={imovel.foto_principal}
                    alt={imovel.titulo}
                    className="w-full h-56 object-cover"
                  />
                ) : (
                  <div className="w-full h-56 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 3 3-7-7 3 14M3 21v-2a4 4 0 0 0-4-4 0 0-4-8v-2a4 4 0 0 0-4-4 0 0-4-8 0 6-6 4 4 4m-3-3 6 6-4 0 0 0 0z" />
                    </svg>
                  </div>
                )}
                
                {imovel.destaque && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                      DESTAQUE
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-start gap-2 mb-3">
                  <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${
                    imovel.tipo === 'apartamento' ? 'bg-blue-100 text-blue-800' :
                    imovel.tipo === 'casa' ? 'bg-green-100 text-green-800' :
                    imovel.tipo === 'terreno' ? 'bg-orange-100 text-orange-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {imovel.tipo}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {imovel.finalidade === 'venda' ? 'Venda' : imovel.finalidade === 'locacao' ? 'Locação' : 'Venda/Locação'}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                  {imovel.titulo}
                </h3>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {imovel.bairro && (
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 0-2.827 0L11.757 18.828a2 998 2.998 0 0 0 5.656 5.656l-2.828 2.828-2.998-2.998-5.656-5.656l1.857 1.857-2.828-2.828zm-2.828 0 4.828-4.828-2.998 2.998-5.656-5.656l-2.828 2.828-2.998-2.998zm-2.828 0-4.828 4.828 2.998 2.998-5.656 5.656l2.828-2.828 2.998 2.998 5.656 5.656l-2.828 2.828-2.998 2.998z" />
                      </svg>
                      <span>{imovel.bairro}, {imovel.cidade}</span>
                    </p>
                  )}

                  {imovel.quartos !== undefined && (
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 3 3-7-7 3 14M3 21v-2a4 4 0 0 0-4-4 0 0-4-8v-2a4 4 0 0 0-4-4 0 0-4-8 0 6-6 4 4 4m-3-3 6 6-4 0 0 0 0z" />
                      </svg>
                      <span>{imovel.quartos} quartos</span>
                      {imovel.suites !== undefined && <span> • {imovel.suites} suíte(s)</span>}
                    </p>
                  )}

                  {imovel.area_total !== undefined && (
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8a4 4 0 1 1-8 0 4 4 0 0 1 0 8 4z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8a4 4 0 1 1-8 0 4 4 0 0 1 0 8 4z" />
                      </svg>
                      <span>{imovel.area_total} m²</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-2xl font-bold text-gray-900">
                    {imovel.preco_venda ? (
                      <>
                        R$ {imovel.preco_venda.toLocaleString('pt-BR')}
                      </>
                    ) : imovel.preco_locacao ? (
                      <>
                        R$ {imovel.preco_locacao.toLocaleString('pt-BR')}<span className="text-sm text-gray-600">/mês</span>
                      </>
                    ) : (
                      <span className="text-gray-500">Sob consulta</span>
                    )}
                  </div>

                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                    Ver detalhes
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7-7m7 7l-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-blue-600 hover:text-blue-700 font-semibold text-lg inline-flex items-center gap-2"
          >
            Ver todos os imóveis
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7l-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
