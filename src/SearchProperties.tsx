import { useState } from 'react';
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
  estado: string;
  preco_venda?: number;
  preco_locacao?: number;
  quartos?: number;
  area_total?: number;
  banheiros?: number;
  vagas_garagem?: number;
}

export default function SearchProperties() {
  const [query, setQuery] = useState('');
  const [tipo, setTipo] = useState('');
  const [finalidade, setFinalidade] = useState('');
  const [cidade, setCidade] = useState('');
  const [quartos, setQuartos] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Imovel[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults([]);

    try {
      console.log('[Search] Parâmetros:', { query, tipo, finalidade, cidade, quartos });
      
      // Search by query string
      let response;
      if (query) {
        response = await apiClient.searchImoveis(query, 12);
      } else {
        // Filter by type/finality/city
        response = await apiClient.getImoveis({
          tipo: tipo || undefined,
          finalidade: finalidade || undefined,
          cidade: cidade || undefined,
          quartos: quartos ? Number(quartos) : undefined,
          limit: 12,
        });
      }

      if (response.success && response.data) {
        console.log('[Search] Resultados:', response.data.length);
        setResults(response.data);
      } else {
        console.error('[Search] Erro:', response.error);
      }
    } catch (error) {
      console.error('[Search] Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-blue-50 to-white py-16">
      <div className="container mx-auto px-4">
        {/* Search Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Encontre seu imóvel ideal
          </h1>
          <p className="text-xl text-gray-600">
            Milhares de opções em Salvador e região
          </p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 011-14 0 7-7 7 0 011-14 0 7-7 7 0 011-14 0 7-7 7 0 011-14 0 7-7 7 0 011-14 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Digite endereço, bairro ou características..."
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Buscando...
                </>
              ) : (
                <>
                  Buscar
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 011-14 0 7-7 7 0 011-14 0 7-7 7 0 011-14 0 7-7 7 0 011-14 0z" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Toggle Filters */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mt-4 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2h2a2 2 0 012 0v4a2 2 0 01-2 2H7a2 2 0 01-2-2V4m0 2a2 2 0 012 0h6a2 2 0 012 0h4a2 2 0 01-2 2v4a2 2 0 01-2 2z" />
            </svg>
            {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          </button>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 bg-gray-50 rounded-xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="apartamento">Apartamento</option>
                  <option value="casa">Casa</option>
                  <option value="terreno">Terreno</option>
                  <option value="comercial">Comercial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Finalidade
                </label>
                <select
                  value={finalidade}
                  onChange={(e) => setFinalidade(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas</option>
                  <option value="venda">Venda</option>
                  <option value="locacao">Locação</option>
                  <option value="ambos">Venda/Locação</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Salvador, Lauro, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quartos
                </label>
                <select
                  value={quartos}
                  onChange={(e) => setQuartos(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </div>
            </div>
          )}
        </form>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {results.length} {results.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((imovel) => (
                <div
                  key={imovel.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 border border-gray-200"
                >
                  <div className="relative">
                    {imovel.foto_principal ? (
                      <img
                        src={imovel.foto_principal}
                        alt={imovel.titulo}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <svg className="w-16 h-16 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 3 3 7 7v14l-7-7-3-3-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${
                          imovel.tipo === 'apartamento' ? 'bg-blue-100 text-blue-800' :
                          imovel.tipo === 'casa' ? 'bg-green-100 text-green-800' :
                          imovel.tipo === 'terreno' ? 'bg-orange-100 text-orange-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {imovel.tipo}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {imovel.finalidade === 'venda' ? 'Venda' : imovel.finalidade === 'locacao' ? 'Locação' : ''}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                      {imovel.titulo}
                    </h3>

                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <p className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 00-2.827 0l-4.244-4.243a8 8 0 00-11.314 0z" />
                        </svg>
                        <span>{imovel.bairro}, {imovel.cidade}</span>
                      </p>
                      {imovel.quartos && (
                        <p className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 3 3 7 7v14l-7-7-3-3-7-7z" />
                          </svg>
                          <span>{imovel.quartos} quartos</span>
                        </p>
                      )}
                      {imovel.area_total && (
                        <p className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8a4 4 0 014 0 1-8 0 1 8 0 4z" />
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

                      <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2">
                        Ver detalhes
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7v-12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
