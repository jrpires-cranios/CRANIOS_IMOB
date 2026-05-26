import { useState } from 'react';
import { Imovel } from '../types';

interface PropertyCardProps {
  imovel: Imovel;
  onClick?: () => void;
}

type FeatureIconName = 'bed' | 'bath' | 'parking' | 'area' | 'location';

function FeatureIcon({ name, className = 'w-5 h-5' }: { name: FeatureIconName; className?: string }) {
  const common = {
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  };

  if (name === 'bed') {
    return (
      <svg {...common}>
        <path d="M4 11.25V7.8A2.8 2.8 0 0 1 6.8 5h3.05a2.15 2.15 0 0 1 2.15 2.15v4.1" />
        <path d="M12 11.25h8.25A1.75 1.75 0 0 1 22 13v5.25" />
        <path d="M2 18.25V9.75" />
        <path d="M2 15.25h20" />
        <path d="M5 18.25v-3" />
        <path d="M19 18.25v-3" />
        <path d="M6.7 8.15h2.4" />
      </svg>
    );
  }

  if (name === 'bath') {
    return (
      <svg {...common}>
        <path d="M5 11.25h15.25v1.9A5.85 5.85 0 0 1 14.4 19H9.85A5.85 5.85 0 0 1 4 13.15v-1.9h1Z" />
        <path d="M7 11.25V6.9A2.9 2.9 0 0 1 9.9 4h.35A2.75 2.75 0 0 1 13 6.75" />
        <path d="M12.25 7.1h3.1" />
        <path d="M8 19l-.8 2" />
        <path d="M16 19l.8 2" />
      </svg>
    );
  }

  if (name === 'parking') {
    return (
      <svg {...common}>
        <path d="M5 19V8.2A3.2 3.2 0 0 1 8.2 5h5.05a4.15 4.15 0 0 1 0 8.3H9.2" />
        <path d="M9.2 19V5" />
        <path d="M9.2 9.15h3.7a1.05 1.05 0 1 1 0 2.1H9.2" />
      </svg>
    );
  }

  if (name === 'area') {
    return (
      <svg {...common}>
        <path d="M5 5h14v14H5z" />
        <path d="M8 16.5h3.75" />
        <path d="M8 13.5h2.25" />
        <path d="M14 8h2" />
        <path d="M16 8v2" />
        <path d="M5 9h14" />
        <path d="M9 5v14" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M12 21s7-5.45 7-11.4A7 7 0 0 0 5 9.6C5 15.55 12 21 12 21Z" />
      <path d="M9.4 9.55h5.2l1.05 4.15H8.35l1.05-4.15Z" />
      <path d="M9.65 13.7v1.45" />
      <path d="M14.35 13.7v1.45" />
      <path d="M10.25 8.25h3.5" />
    </svg>
  );
}

function FeaturePill({ icon, label }: { icon: FeatureIconName; label: string }) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3 text-slate-700 transition duration-200 hover:border-blue-100 hover:bg-blue-50/60">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm ring-1 ring-slate-100 transition group-hover:text-blue-700 group-hover:ring-blue-100">
        <FeatureIcon name={icon} className="h-4.5 w-4.5" />
      </span>
      <span className="text-sm font-medium leading-none tracking-normal">{label}</span>
    </div>
  );
}

export default function PropertyCard({ imovel, onClick }: PropertyCardProps) {
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
              <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${imovel.tipo === 'apartamento' ? 'bg-blue-100 text-blue-800' :
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
            <FeaturePill icon="bed" label={`${imovel.quartos} quartos`} />
          )}
          {imovel.banheiros !== undefined && (
            <FeaturePill icon="bath" label={`${imovel.banheiros} banheiros`} />
          )}
          {imovel.vagas_garagem !== undefined && imovel.vagas_garagem > 0 && (
            <FeaturePill icon="parking" label={`${imovel.vagas_garagem} vagas`} />
          )}
          {imovel.area_total !== undefined && (
            <FeaturePill icon="area" label={`${imovel.area_total} m²`} />
          )}
        </div>

        {/* Location */}
        <div className="flex items-start gap-3 mb-6 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3.5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm ring-1 ring-blue-100">
            <FeatureIcon name="location" className="h-5 w-5" />
          </span>
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
          <button
            onClick={onClick}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition transform hover:scale-[1.02]"
          >
            Ver detalhes
          </button>
          <a
            href={`https://wa.me/5511913377110?text=Ol%C3%A1!%20Gostaria%20de%20agendar%20uma%20visita%20para%20o%20im%C3%B3vel%20${imovel.titulo}%20(Ref:%20RT${imovel.id.substring(0, 4).toUpperCase()})`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold transition text-center"
          >
            Agendar visita
          </a>
        </div>
      </div>
    </div>
  );
}
