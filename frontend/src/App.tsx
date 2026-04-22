import SecureKeysForm from './pages/SecureKeysForm';
import SecureCheckout from './pages/SecureCheckout';
import PropertyForm from './pages/PropertyForm';
import SaleClosingPanel from './pages/SaleClosingPanel';
import Proprietarios from './pages/Proprietarios';

import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import OnboardingLayout from './layouts/OnboardingLayout';

export default function App() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';

  // Secure Keys Form
  if (path === '/secure-keys') {
    return <SecureKeysForm />;
  }

  // Secure Checkout Form
  if (path.startsWith('/secure/checkout/')) {
    const leadId = path.split('/').pop() || '';
    return <SecureCheckout leadId={leadId} />;
  }

  // Novo Cadastro de Imóvel ou Edição (Geralmente via Admin ou Corretores)
  if (path === '/imovel/novo' || path.startsWith('/imovel/editar/')) {
    const propertyId = path.startsWith('/imovel/editar/') ? path.split('/').pop() || undefined : undefined;
    return <PropertyForm propertyId={propertyId} onBack={() => { window.location.href = '/admin'; }} />;
  }

  // Fechamento de Vendas
  if (path === '/vendas') {
    return <SaleClosingPanel onBack={() => { window.location.href = '/admin'; }} />;
  }

  // Módulo Específico: Proprietários
  if (path === '/proprietarios') {
    return <Proprietarios onBack={() => { window.location.href = '/admin'; }} />;
  }

  // ==== ROTEAMENTO DE LAYOUTS PRINCIPAIS ====

  // 1. Onboarding (SaaS Setup)
  if (path.startsWith('/onboard')) {
    return <OnboardingLayout />;
  }

  // 2. Painel Administrativo (ERP)
  if (path.startsWith('/admin')) {
    return <AdminLayout />;
  }

  // 3. Site Público (Padrão)
  return <PublicLayout />;
}
