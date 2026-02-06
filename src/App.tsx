import { useState } from 'react';
import Hero from './src/Hero';
import FeaturedProperties from './src/FeaturedProperties';
import SearchProperties from './src/SearchProperties';

export default function App() {
  const [activeTab, setActiveTab] = useState<'hero' | 'search'>('hero');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 3 3-7 7 7v14l-7-7 3 3-7-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">Crânios IMOB</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => setActiveTab('hero')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'hero' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Início
              </button>
              <button 
                onClick={() => setActiveTab('search')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'search' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Buscar Imóveis
              </button>
            </nav>

            {/* Mobile Menu */}
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
        {activeTab === 'hero' && <Hero />}
        {activeTab === 'search' && <SearchProperties />}
      </main>

      {/* Floating Featured Section */}
      {activeTab === 'hero' && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
              Em Destaque
            </h2>
            <p className="text-lg text-center text-gray-600 mb-8">
              Confira nossas melhores oportunidades
            </p>
            <FeaturedProperties />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Crânios IMOB</h3>
              <p className="text-gray-400 text-sm mb-2">Imobiliária inteligente com IA</p>
              <p className="text-gray-400 text-sm">Salvador, BA</p>
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
              <p className="text-gray-400 text-sm mb-2">📱 (71) 99999-9999</p>
              <p className="text-gray-400 text-sm mb-2">✉️ contato@cranios-imob.com</p>
              <p className="text-gray-400 text-sm">📍 Av. Contorno, 3000 - Salvador, BA</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
            © 2026 Crânios IMOB. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
