import { useState } from 'react';
import Hero from '../components/Hero';
import FeaturedProperties from '../components/FeaturedProperties';
import SearchProperties from '../components/SearchProperties';
import PropertyDetailsModal from '../components/PropertyDetailsModal';
import WhatsAppButton from '../components/WhatsAppButton';
import ChatWidget from '../components/ChatWidget';
import { Imovel } from '../types';
import { apiClient } from '../client';

export default function PublicLayout() {
  const [activeTab, setActiveTab] = useState<'hero' | 'search'>('hero');
  const [selectedProperty, setSelectedProperty] = useState<Imovel | null>(null);
  const [aiSearchResults, setAiSearchResults] = useState<Imovel[]>([]);
  const [aiSearchInterpretation, setAiSearchInterpretation] = useState<any>(null);

  const handleAiSearch = (results: Imovel[], interpretation: any) => {
    setAiSearchResults(results);
    setAiSearchInterpretation(interpretation);
    setActiveTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChatSearch = async (query: string) => {
    try {
      const response = await fetch('/api/ai-search/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const filters = await response.json();
      const searchParams: any = {};

      if (filters.operacao) searchParams.finalidade = filters.operacao === 'alugar' ? 'locacao' : filters.operacao === 'comprar' ? 'venda' : filters.operacao;
      if (filters.tipo) searchParams.tipo = filters.tipo;
      searchParams.limit = 500;

      const result = await apiClient.getImoveis(searchParams);
      let fetchedImoveis = result.success ? result.data || [] : [];

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

      handleAiSearch(fetchedImoveis, filters);
    } catch (e) {
      console.error(e);
      handleAiSearch([], null);
    }
  };

  const handleSelectProperty = (imovel: Imovel) => {
    setSelectedProperty(imovel);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Modal */}
      {selectedProperty && (
        <PropertyDetailsModal
          imovel={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}

      {/* Header Público Minimalista */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('hero')}>
              <img src="/logo_bco.png" alt="Crânios Imob Real" className="h-12" />
            </div>

            <nav className="hidden md:flex items-center gap-4">
              <button
                onClick={() => setActiveTab('hero')}
                className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'hero' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Início
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'search' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Buscar Imóveis
              </button>
            </nav>

            <button className="md:hidden p-2 text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {activeTab === 'hero' && <Hero onSelectProperty={handleSelectProperty} onSearch={handleAiSearch} />}
        {activeTab === 'search' && <SearchProperties onSelectProperty={handleSelectProperty} initialResults={aiSearchResults.length > 0 ? aiSearchResults : undefined} initialInterpretation={aiSearchInterpretation} />}
      </main>

      {/* Destaques (apenas na home) */}
      {activeTab === 'hero' && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
              Em Destaque
            </h2>
            <p className="text-lg text-center text-gray-600 mb-8">
              Confira nossas melhores oportunidades
            </p>
            <FeaturedProperties onSelectProperty={handleSelectProperty} />
          </div>
        </section>
      )}

      {/* Footer Público */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Crânios IMOB</h3>
              <p className="text-gray-400 text-sm mb-2">Imobiliária inteligente com IA</p>
              <p className="text-gray-400 text-sm">Aracaju, SE</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Sobre nós</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Contato</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Termos de uso</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Política de privacidade</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contato</h3>
              <p className="text-gray-400 text-sm mb-2">📱 (79) 99999-9999</p>
              <p className="text-gray-400 text-sm mb-2">✉️ contato@cranios-imob.com</p>
              <p className="text-gray-400 text-sm">📍 13 de Julho, Aracaju - SE</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
            © 2026 Crânios IMOB. Todos os direitos reservados.
          </div>
        </div>
      </footer>
      <WhatsAppButton />
      <ChatWidget onSearchFromChat={(query) => handleChatSearch(query)} />
    </div>
  );
}
