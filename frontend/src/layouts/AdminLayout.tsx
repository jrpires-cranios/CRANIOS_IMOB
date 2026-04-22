import { useState } from 'react';
import Dashboard from '../pages/Dashboard';
import Admin from '../pages/Admin';
import Financeiro from '../pages/Financeiro';
import Comissoes from '../pages/Comissoes';
import DashboardERP from '../pages/DashboardERP';
import OrdensServico from '../pages/OrdensServico';
import Vistorias from '../pages/Vistorias';
import Relatorios from '../pages/Relatorios';
import CRMKanban from '../pages/CRMKanban';
import ExecutiveBI from '../pages/ExecutiveBI';
import Franquias from '../pages/Franquias';
import LoginModal from '../components/LoginModal';

export default function AdminLayout() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin' | 'financeiro' | 'comissoes' | 'metas' | 'servicos' | 'vistorias' | 'relatorios' | 'crm' | 'executivebi' | 'franquias'>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginTarget, setLoginTarget] = useState<'dashboard' | 'admin' | 'financeiro' | 'comissoes' | 'metas' | 'servicos' | 'vistorias' | 'relatorios' | 'crm' | 'executivebi' | 'franquias' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigation = (tab: 'dashboard' | 'admin' | 'financeiro' | 'comissoes' | 'metas' | 'servicos' | 'vistorias' | 'relatorios' | 'crm' | 'executivebi' | 'franquias') => {
    if (!isAuthenticated) {
      setLoginTarget(tab);
      return;
    }
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // Se não estiver autenticado e não tiver login target para disparar o modal, abrir modal para a aba atual logo de início.
  if (!isAuthenticated && !loginTarget) {
    setLoginTarget(activeTab);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {loginTarget && (
        <LoginModal
          target={loginTarget}
          onClose={() => setLoginTarget(null)}
          onSuccess={() => {
            setIsAuthenticated(true);
            setActiveTab(loginTarget);
            setLoginTarget(null);
          }}
        />
      )}

      {isAuthenticated && (
        <>
          {/* Menu ERP */}
          <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                {/* Logo e Nome do ERP */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl text-blue-900">Crânios ERP</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">ADMIN</span>
                </div>

                {/* Navigation ERP */}
                <nav className="hidden md:flex items-center gap-2 overflow-x-auto">
                  <button
                    onClick={() => handleNavigation('dashboard')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    📈 BI Executivo
                  </button>
                  <button
                    onClick={() => handleNavigation('admin')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'admin' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    🏢 Imóveis & CRM
                  </button>
                  <button
                    onClick={() => handleNavigation('crm')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'crm' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    🎯 CRM Kanban
                  </button>
                  <button
                    onClick={() => { window.location.href = '/proprietarios'; }}
                    className="px-3 py-2 text-sm rounded-lg font-bold text-blue-600 border border-blue-600 hover:bg-blue-50 transition"
                  >
                    💼 Proprietários
                  </button>
                  <button
                    onClick={() => handleNavigation('financeiro')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'financeiro' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    💰 Financeiro
                  </button>
                  <button
                    onClick={() => handleNavigation('comissoes')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'comissoes' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    🎖️ Comissões
                  </button>
                  <button
                    onClick={() => handleNavigation('metas')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'metas' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    📊 Corretores & Metas
                  </button>
                  <button
                    onClick={() => handleNavigation('servicos')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'servicos' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    🛠️ O.S. (Manutenção)
                  </button>
                  <button
                    onClick={() => handleNavigation('vistorias')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'vistorias' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    📸 Vistorias
                  </button>
                  <button
                    onClick={() => handleNavigation('relatorios')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'relatorios' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    📄 Relatórios
                  </button>
                  <button
                    onClick={() => handleNavigation('executivebi')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'executivebi' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    📊 BI C-Level
                  </button>
                  <button
                    onClick={() => handleNavigation('franquias')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'franquias' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    🏛️ Franquias
                  </button>
                  <a
                    href="/"
                    className="ml-4 px-3 py-2 text-sm rounded-lg font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition flex items-center gap-1"
                    title="Ver site público"
                  >
                    🌐 Ver Site
                  </a>
                </nav>

                <button
                  className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  aria-label="Abrir menu"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile dropdown menu */}
            {mobileMenuOpen && (
              <div className="md:hidden border-t border-gray-200 py-2">
                <div className="flex flex-col gap-1 px-2">
                  <button onClick={() => handleNavigation('dashboard')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>📈 BI Executivo</button>
                  <button onClick={() => handleNavigation('admin')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'admin' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>🏢 Imóveis & CRM</button>
                  <button onClick={() => handleNavigation('crm')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'crm' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>🎯 CRM Kanban</button>
                  <button onClick={() => { window.location.href = '/proprietarios'; }} className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-blue-600 border border-blue-600 hover:bg-blue-50 transition">💼 Proprietários</button>
                  <button onClick={() => handleNavigation('financeiro')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'financeiro' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>💰 Financeiro</button>
                  <button onClick={() => handleNavigation('comissoes')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'comissoes' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>🎖️ Comissões</button>
                  <button onClick={() => handleNavigation('metas')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'metas' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>📊 Corretores & Metas</button>
                  <button onClick={() => handleNavigation('servicos')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'servicos' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>🛠️ O.S. (Manutenção)</button>
                  <button onClick={() => handleNavigation('vistorias')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'vistorias' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>📸 Vistorias</button>
                  <button onClick={() => handleNavigation('relatorios')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'relatorios' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>📄 Relatórios</button>
                  <button onClick={() => handleNavigation('executivebi')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'executivebi' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>📊 BI C-Level</button>
                  <button onClick={() => handleNavigation('franquias')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'franquias' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>🏛️ Franquias</button>
                  <a href="/" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition">🌐 Ver Site</a>
                </div>
              </div>
            )}
          </header>

          {/* Área de Conteúdo do Admin */}
          <main>
            {activeTab === 'dashboard' && <Dashboard onGoHome={() => handleNavigation('dashboard')} />}
            {activeTab === 'admin' && <Admin />}
            {activeTab === 'financeiro' && <Financeiro onBack={() => handleNavigation('dashboard')} />}
            {activeTab === 'comissoes' && <Comissoes onBack={() => handleNavigation('dashboard')} />}
            {activeTab === 'metas' && <DashboardERP />}
            {activeTab === 'servicos' && <OrdensServico onBack={() => handleNavigation('dashboard')} />}
            {activeTab === 'vistorias' && <Vistorias onBack={() => handleNavigation('dashboard')} />}
            {activeTab === 'relatorios' && <Relatorios onBack={() => handleNavigation('dashboard')} />}
            {activeTab === 'crm' && <CRMKanban />}
            {activeTab === 'executivebi' && <ExecutiveBI />}
            {activeTab === 'franquias' && <Franquias />}
          </main>
        </>
      )}
    </div>
  );
}
