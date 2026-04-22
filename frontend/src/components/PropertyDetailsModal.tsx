import { useState, useEffect } from 'react';
import { Imovel } from '../types';

interface PropertyDetailsModalProps {
    imovel: Imovel;
    onClose: () => void;
}

export default function PropertyDetailsModal({ imovel, onClose }: PropertyDetailsModalProps) {
    const [activeImage, setActiveImage] = useState<string>(imovel.foto_principal || '');

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Prevent background scrolling
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const allPhotos = [imovel.foto_principal, ...(imovel.fotos || [])].filter(Boolean) as string[];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-transform hover:scale-110"
                >
                    <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Gallery Section */}
                <div className="relative h-64 sm:h-96 bg-gray-100 shrink-0">
                    {activeImage ? (
                        <img
                            src={activeImage}
                            alt={imovel.titulo}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}

                    {/* Tag Status */}
                    <div className="absolute top-4 left-4 flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold shadow-sm ${imovel.tipo === 'apartamento' ? 'bg-blue-100 text-blue-800' :
                            imovel.tipo === 'casa' ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                            }`}>
                            {imovel.tipo}
                        </span>
                        {imovel.destaque && (
                            <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-bold shadow-sm flex items-center gap-1">
                                ⭐ Destaque
                            </span>
                        )}
                    </div>
                </div>

                {/* Thumbnails */}
                {allPhotos.length > 1 && (
                    <div className="flex gap-2 p-4 overflow-x-auto bg-gray-50 border-b border-gray-100">
                        {allPhotos.map((photo, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImage(photo)}
                                className={`w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition ${activeImage === photo ? 'border-blue-600 ring-2 ring-blue-100' : 'border-transparent opacity-70 hover:opacity-100'
                                    }`}
                            >
                                <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Details Content */}
                <div className="p-6 sm:p-8 space-y-8">

                    {/* Header Info */}
                    <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-gray-100 pb-6">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{imovel.titulo}</h2>
                            <p className="text-gray-600 flex items-center gap-2 text-lg">
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 0-2.827 0L11.757 18.828a2 998 2.998 0 0 0 5.656 5.656l-2.828 2.828-2.998-2.998-5.656-5.656l1.857 1.857-2.828-2.828zm-2.828 0 4.828-4.828-2.998 2.998-5.656-5.656l-2.828 2.828 2.998 2.998 5.656 5.656l-2.828 2.828-2.998 2.998z" />
                                </svg>
                                {imovel.endereco}, {imovel.bairro} - {imovel.cidade}/{imovel.estado}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-blue-600">
                                {imovel.preco_venda ? (
                                    `R$ ${imovel.preco_venda.toLocaleString('pt-BR')}`
                                ) : imovel.preco_locacao ? (
                                    `R$ ${imovel.preco_locacao.toLocaleString('pt-BR')}/mês`
                                ) : 'Sob Consulta'}
                            </div>
                            <div className="text-sm text-gray-500 font-medium uppercase tracking-wide mt-1">
                                {imovel.finalidade === 'ambos' ? 'Venda / Locação' : imovel.finalidade}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Property Grid */}
                    <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 mb-8 border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l4 4a1 1 0 01.586 1.414V19a2 2 0 01-2 2z" />
                            </svg>
                            Detalhes do Imóvel
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8">
                            {/* Property ID */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-blue-600 font-bold text-xs">ID</span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Código</p>
                                    <p className="font-semibold text-gray-900">RT{imovel.id.substring(0, 4).toUpperCase()}</p>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Preço</p>
                                    <p className="font-semibold text-gray-900">
                                        {imovel.preco_venda
                                            ? `R$ ${imovel.preco_venda.toLocaleString('pt-BR')}`
                                            : imovel.preco_locacao
                                                ? `R$ ${imovel.preco_locacao.toLocaleString('pt-BR')}/mês`
                                                : 'Sob consulta'}
                                    </p>
                                </div>
                            </div>

                            {/* Property Size */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8a4 4 0 1 1-8 0 4 4 0 0 1 0 8 4z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Área Total</p>
                                    <p className="font-semibold text-gray-900">{imovel.area_total || '-'} m²</p>
                                </div>
                            </div>

                            {/* Bedrooms */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 3 3-7 7 3 14M3 21v-2a4 4 0 0 0-4-4 0 0-4-8v-2a4 4 0 0 0-4-4 0 0-4-8 0 6-6 4 4 4m-3-3 6 6-4 0 0 0 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Quartos</p>
                                    <p className="font-semibold text-gray-900">{imovel.quartos || '-'}</p>
                                </div>
                            </div>

                            {/* Bathrooms */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 3h4.674M12 3h4.674m-9.337 5.5a7 7 0 11-14 0 7-7 0 00-11.314 0m-4.242 4.243a8.828 8.828 0 000 0 0 0 0 0-2.5 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 6.364 6.364 0 0 0 0 0 0 1.414 1.414 0 0 0 0 0 0-4.242 0 0-4.242 0 0 0 0 0 0 0 6.364-1.414 1.414z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Banheiros</p>
                                    <p className="font-semibold text-gray-900">{imovel.banheiros || '-'}</p>
                                </div>
                            </div>

                            {/* Garage */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21l-7-7m0 0l-7 7m7-7v-12" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Vagas</p>
                                    <p className="font-semibold text-gray-900">{imovel.vagas_garagem || '-'}</p>
                                </div>
                            </div>

                            {/* Year Built */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Ano</p>
                                    <p className="font-semibold text-gray-900">2023</p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Status</p>
                                    <p className="font-semibold text-gray-900 capitalize">
                                        {imovel.finalidade === 'venda' ? 'Venda' : 'Aluguel'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Sobre o imóvel</h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg">
                            {imovel.descricao || 'Nenhuma descrição disponível para este imóvel.'}
                        </p>
                    </div>

                    {/* Characteristics */}
                    {imovel.caracteristicas && imovel.caracteristicas.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Diferenciais</h3>
                            <div className="flex flex-wrap gap-2">
                                {imovel.caracteristicas.map((item, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                        ✅ {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Call to Action */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
                        <a
                            href={`https://wa.me/5511913377110?text=Ol%C3%A1!%20Tenho%20interesse%20no%20im%C3%B3vel%20${imovel.titulo}%20(Ref:%20RT${imovel.id.substring(0, 4).toUpperCase()})`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                            </svg>
                            Conversar no WhatsApp
                        </a>
                        <a
                            href={`https://wa.me/5511913377110?text=Ol%C3%A1!%20Gostaria%20de%20agendar%20uma%20visita%20para%20o%20im%C3%B3vel%20${imovel.titulo}%20(Ref:%20RT${imovel.id.substring(0, 4).toUpperCase()})`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 text-center"
                        >
                            Agendar Visita
                        </a>
                    </div>

                </div>
            </div>
        </div>
    );
}
