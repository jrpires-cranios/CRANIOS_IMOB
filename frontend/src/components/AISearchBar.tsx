import { useState } from 'react';
import { apiClient } from '../client';
import { Imovel } from '../types';

interface AISearchBarProps {
    onResults: (results: Imovel[], interpretation: any) => void;
    onQuery: (query: string) => void;
}

export default function AISearchBar({ onResults, onQuery }: AISearchBarProps) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [interpretation, setInterpretation] = useState<any>(null);

    const handleSearch = async (q?: string) => {
        const searchQuery = q || query;
        if (!searchQuery.trim()) return;

        onQuery(searchQuery);
        setLoading(true);
        setInterpretation(null);

        try {
            // 1. Enviar para a rota NLP no Backend
            const response = await fetch('/api/ai-search/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery }),
            });

            const filters = await response.json();
            setInterpretation(filters);

            // 2. Com os filtros em mãos, buscar no banco via apiClient
            // Transform filters to format the apiClient expects (e.g. { finalidade, tipo, ... })
            const searchParams: any = {};
            if (filters.operacao) searchParams.finalidade = filters.operacao === 'alugar' ? 'locacao' : filters.operacao === 'comprar' ? 'venda' : filters.operacao;
            if (filters.tipo) searchParams.tipo = filters.tipo;
            searchParams.limit = 500;

            const result = await apiClient.getImoveis(searchParams);

            let fetchedImoveis = result.success ? result.data || [] : [];

            // 3. Aplicar filtros locais mais específicos (bairros, vagas, preços)
            if (filters.bairros_relevantes && filters.bairros_relevantes.length > 0) {
                fetchedImoveis = fetchedImoveis.filter((imovel: Imovel) =>
                    filters.bairros_relevantes!.some((b: string) =>
                        imovel.bairro?.toLowerCase().includes(b.toLowerCase()) ||
                        b.toLowerCase().includes(imovel.bairro?.toLowerCase() || '')
                    )
                );
            }
            if (filters.palavra_chave) {
                const keyword = filters.palavra_chave.toLowerCase();

                fetchedImoveis = fetchedImoveis.filter((i: Imovel) => {
                    const isKitnetSearch = keyword.includes('kitnet') || keyword.includes('conjugado');
                    const isUmQuarto = i.tipo?.toLowerCase() === 'apartamento' && (i.quartos === 1 || i.quartos === 0);

                    if (isKitnetSearch && isUmQuarto) {
                        return true;
                    }

                    return (i.titulo?.toLowerCase().includes(keyword)) ||
                        (i.descricao?.toLowerCase().includes(keyword)) ||
                        (i.tipo?.toLowerCase().includes(keyword)) ||
                        (i.bairro?.toLowerCase().includes(keyword));
                });
            }
            if (filters.preco_max) {
                fetchedImoveis = fetchedImoveis.filter((i: Imovel) => (i.preco_venda || i.preco_locacao || 0) <= filters.preco_max);
            }
            if (filters.quartos_min) {
                fetchedImoveis = fetchedImoveis.filter((i: Imovel) => (i.quartos || 0) >= filters.quartos_min);
            }

            onResults(fetchedImoveis, filters);
        } catch (e) {
            console.error('[AISearchBar] Error searching:', e);
            // Fallback: search sem filtros
            const result = await apiClient.getImoveis();
            onResults(result.data || [], { sugestao_texto: 'Mostrando nossos melhores imóveis para você.' });
        } finally {
            setLoading(false);
        }
    };

    const quickSearches = [
        "Casa para alugar perto da praia",
        "Apartamento nos Jardins",
        "Imóvel à venda até R$ 500k",
        "Terreno em condomínio fechado"
    ];

    return (
        <div className="w-full">
            {/* Search Input */}
            <div className="relative w-full shadow-2xl rounded-full transform transition-all hover:scale-[1.01]">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    {loading ? (
                        <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                        <svg className="w-6 h-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 011-14 0 7-7 7 0 011-14 0 7-7 7 0 011-14 0z" />
                        </svg>
                    )}
                </div>

                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="O que você está procurando? (Ex: Apartamento nos Jardins com 3 quartos)"
                    className="w-full h-16 pl-16 pr-32 bg-white/10 backdrop-blur-md border-[1.5px] border-white/20 text-white placeholder-white/60 text-lg rounded-full outline-none focus:bg-white/20 focus:border-blue-400 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.15)] transition-all"
                />

                <button
                    onClick={() => handleSearch()}
                    className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-8 rounded-full font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-blue-500/50 transition-all flex items-center justify-center pointer-events-auto"
                >
                    Pesquisar
                </button>
            </div>

            {/* Quick Searches Chips */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {quickSearches.map(q => (
                    <button
                        key={q}
                        onClick={() => { setQuery(q); handleSearch(q); }}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white/90 px-4 py-2 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5 whitespace-nowrap"
                    >
                        {q}
                    </button>
                ))}
            </div>

            {/* AI Badge Feedback */}
            {interpretation && !loading && (
                <div className="mt-6 flex justify-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full py-2.5 px-6 animate-fade-in-up">
                        <span className="text-xl">✨</span>
                        <span className="text-white text-sm font-medium">
                            Entendido: <strong className="text-blue-300 font-bold ml-1">{interpretation.interpretacao}</strong>
                        </span>

                        {/* Tags Extraidas */}
                        <div className="flex gap-1 ml-2">
                            {interpretation.operacao && (
                                <span className={`px-3 py-1 text-[11px] font-bold uppercase rounded-full ${interpretation.operacao.includes('alugar') ? 'bg-blue-500/30 text-blue-200' : 'bg-emerald-500/30 text-emerald-200'}`}>
                                    {interpretation.operacao.includes('alugar') ? '🏠 Aluguel' : '🔑 Compra'}
                                </span>
                            )}
                            {interpretation.tipo && (
                                <span className="px-3 py-1 bg-amber-500/30 text-amber-200 text-[11px] font-bold uppercase rounded-full">
                                    {interpretation.tipo}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
