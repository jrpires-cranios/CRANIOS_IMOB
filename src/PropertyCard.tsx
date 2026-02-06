import { useEffect } from 'react';
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
}

interface PropertyCardProps {
  imovel: Imovel;
}

export default function PropertyCard({ imovel }: PropertyCardProps) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300 border border-gray-200" id={`imovel-${imovel.id}`}>
      {/* Image */}
      <div className="relative h-64 bg-gray-200">
        {imovel.foto_principal ? (
          <img
            src={imovel.foto_principal}
            alt={imovel.titulo}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <svg className="w-20 h-20 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 3 3 7 7v14l-7-7-3-3-7-7z" />
            </svg>
          </div>
        )}

        {imovel.destaque && (
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-yellow-500 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              ⭐ DESTAQUE
            </span>
          </div>
        )}

        {/* Price Badge */}
        <div className="absolute bottom-4 right-4 z-10">
          <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
            {imovel.preco_venda ? (
              <>
                <span className="text-xs text-gray-500">Venda: </span>
                <span className="text-lg font-bold text-gray-900">
                  R$ {imovel.preco_venda.toLocaleString('pt-BR')}
                </span>
              </>
            ) : imovel.preco_locacao ? (
              <>
                <span className="text-xs text-gray-500">Locação: </span>
                <span className="text-lg font-bold text-gray-900">
                  R$ {imovel.preco_locacao.toLocaleString('pt-BR')}
                  <span className="text-sm text-gray-600">/mês</span>
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-600">Sob consulta</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
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
            <h2 className="text-xl font-bold text-gray-900 line-clamp-1">
              {imovel.titulo}
            </h2>
          </div>

          <button
            onClick={() => setLoading(!loading)}
            disabled={loading}
            className="text-red-500 hover:text-red-600 transition disabled:opacity-50"
          >
            <svg className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 9 0 0 0 0 0 0 0 1 0 0 0 9 0 0 0 0 0 0 0 1 0 0 0 9 0 0 0 0 0 0 0 0-2.5 0l-4.243 4.243a8.828 8.828 0 000 0 0 0 0 0 0-2.5 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 6.364 6.364 0 0 0 0 0 0 1.414 1.414 0 0 0 0 0 0-4.242 0 0-4.242 0 0 0 0 0 0 0 6.364-1.414 1.414 0 0 0 0 0 0-1.414-1.414z" />
            </svg>
          </button>
        </div>

        {/* Description */}
        {imovel.descricao && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {imovel.descricao}
          </p>
        )}

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {imovel.quartos !== undefined && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 3 3 7 7v14l-7-7-3-3-7-7z" />
              </svg>
              <span className="text-sm text-gray-700">{imovel.quartos} quartos</span>
            </div>
          )}
          {imovel.banheiros !== undefined && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 3h4.674M12 3h4.674m-9.337 5.5a7 7 0 11-14 0 7-7 0 00-11.314 0m-4.242 4.243a8.828 8.828 0 000 0 0 0 0 0-2.5 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 6.364 6.364 0 0 0 0 0 0 1.414 1.414 0 0 0 0 0 0-4.242 0 0-4.242 0 0 0 0 0 0 0 6.364-1.414 1.414z" />
              </svg>
              <span className="text-sm text-gray-700">{imovel.banheiros} banheiros</span>
            </div>
          )}
          {imovel.vagas_garagem !== undefined && imovel.vagas_garagem > 0 && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21l-7-7m0 0l-7 7m7-7v-12" />
              </svg>
              <span className="text-sm text-gray-700">{imovel.vagas_garagem} vagas</span>
            </div>
          )}
          {imovel.area_total !== undefined && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8a4 4 0 014 0 1-8 0 1 8 0 4z" />
              </svg>
              <span className="text-sm text-gray-700">{imovel.area_total} m²</span>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-start gap-3 mb-6 bg-blue-50 rounded-lg px-4 py-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 00-2.827 0l-4.244-4.243a8 8 0 00-11.314 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 font-medium line-clamp-1">
              {imovel.endereco}
            </p>
            {imovel.bairro && (
              <p className="text-xs text-gray-600">
                {imovel.bairro}, {imovel.cidade} - {imovel.estado}
              </p>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex gap-3">
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition transform hover:scale-[1.02]">
            Ver detalhes
          </button>
          <button className="flex-1 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold transition">
            Agendar visita
          </button>
        </div>
      </div>
    </div>
  );
}
