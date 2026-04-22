/**
 * API Client para Crânios IMOB Backend
 * Conecta diretamente à API na porta 3001
 */

import { Imovel } from './types';

interface ApiConfig {
  baseUrl: string;
  timeout: number;
}


interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  upgrade_url?: string;
  limit?: number;
  current?: number;
}

class ApiClient {
  private config: ApiConfig;

  constructor(config?: Partial<ApiConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || 'http://localhost:3005/api',
      timeout: config?.timeout || 10000,
    };
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      console.log(`[API] Fetching: ${url}`);

      const sessionToken = localStorage.getItem('sessionToken');
      const impersonationToken = localStorage.getItem('impersonationToken');

      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (sessionToken) headers['x-session-token'] = sessionToken;
      if (impersonationToken) headers['Authorization'] = `Bearer ${impersonationToken}`;

      const response = await fetch(url, {
        headers: { ...headers, ...options?.headers },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`[API] Error ${response.status}:`, data);
        if (response.status === 401 && data?.code === 'SESSION_INVALIDATED') {
          window.dispatchEvent(new CustomEvent('auth_error', { detail: data.message }));
        }
        return { success: false, error: data?.error || `HTTP ${response.status}`, ...data };
      }

      console.log(`[API] Success:`, data);
      return data;
    } catch (error) {
      console.error(`[API] Fetch error:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Imóveis
  async getImoveis(filters?: {
    tipo?: string;
    finalidade?: string;
    cidade?: string;
    quartos?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.finalidade) params.append('finalidade', filters.finalidade);
    if (filters?.cidade) params.append('cidade', filters.cidade);
    if (filters?.quartos) params.append('quartos', filters.quartos.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return this.fetch<Imovel[]>(`/imoveis?${params.toString()}`);
  }

  async getImoveisDestaque(limit = 6) {
    return this.fetch<Imovel[]>(`/imoveis/destaque?limit=${limit}`);
  }

  async getImovelById(id: string) {
    return this.fetch<Imovel>(`/imoveis/${id}`);
  }

  async searchImoveis(query: string, limit = 10) {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    return this.fetch<Imovel[]>(`/imoveis/search?${params.toString()}`);
  }

  async createImovel(imovel: Partial<Imovel>) {
    return this.fetch<Imovel>('/imoveis', {
      method: 'POST',
      body: JSON.stringify(imovel),
    });
  }

  async updateImovel(id: string, imovel: Partial<Imovel>) {
    return this.fetch<Imovel>(`/imoveis/${id}`, {
      method: 'PUT',
      body: JSON.stringify(imovel),
    });
  }

  async deleteImovel(id: string) {
    return this.fetch<{ success: boolean }>(`/imoveis/${id}`, {
      method: 'DELETE',
    });
  }

  async getLeads(filters?: { status?: string; tenant_id?: string; corretor_id?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tenant_id) params.append('tenant_id', filters.tenant_id);
    if (filters?.corretor_id) params.append('corretor_id', filters.corretor_id);
    return this.fetch<{ leads: any[] }>(`/leads?${params.toString()}`);
  }

  async getLead(id: string) {
    return this.fetch<{ lead: any }>(`/leads/${id}`);
  }

  async updateLeadStatus(id: string, status: string, extra?: Record<string, any>) {
    return this.fetch<{ lead: any }>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...extra }),
    });
  }

  async getLeadBriefing(id: string) {
    return this.fetch<{ briefing: any }>(`/leads/${id}/briefing`);
  }

  // Chat
  async chat(message: string, sessionId: string) {
    return this.fetch<{ response: string }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    });
  }

  // Manager Dashboard
  async getCorretores() {
    return this.fetch<{ corretores: any[] }>('/manager/corretores');
  }

  async getDashboardOverview() {
    return this.fetch<{ stats: any }>('/manager/dashboard/overview');
  }

  async updateCorretor(id: string, updates: any) {
    return this.fetch(`/manager/corretores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async simularDistribuicao() {
    return this.fetch<any>('/leads/distribute', {
      method: 'POST',
      body: JSON.stringify({
        source: 'Simulador Dashboard',
        valor_interesse: 400000,
        tipos_interesse: ['Apartamento'],
        bairros_interesse: ['Jardins'],
      }),
    });
  }

  // Telegram Bot
  async gerarTelegramLink(corretorId: string) {
    return this.fetch<{ link: string; qrCode: string }>('/telegram/gerar-link', {
      method: 'POST',
      body: JSON.stringify({ corretor_id: corretorId }),
    });
  }

  // Novo: Envio de Convite para Corretor com Tratamento de PlanLimit
  async convidarCorretor(data: { email: string; nome: string; cliente_id?: string; empresaNome?: string }) {
    return this.fetch<{ success: boolean; message?: string; error?: string; code?: string; upgrade_url?: string }>('/corretores/convite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Proprietários (ERP M1)
  async getProprietarios(tenantId: string, search?: string) {
    const params = new URLSearchParams({ tenant_id: tenantId });
    if (search) params.append('search', search);
    return this.fetch<{ proprietarios: any[] }>(`/proprietarios?${params.toString()}`);
  }

  async getProprietarioById(id: string) {
    return this.fetch<{ proprietario: any; portfolio: any }>(`/proprietarios/${id}`);
  }

  async createProprietario(data: any) {
    return this.fetch<{ proprietario: any }>('/proprietarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProprietario(id: string, data: any) {
    return this.fetch<{ proprietario: any }>(`/proprietarios/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async saveBankAccount(data: any) {
    return this.fetch<{ conta: any }>('/proprietarios/contas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteBankAccount(id: string) {
    return this.fetch(`/proprietarios/contas/${id}`, {
      method: 'DELETE',
    });
  }

  async linkPropertyToProprietario(propertyId: string, proprietarioId: string) {
    return this.fetch(`/imoveis/${propertyId}/proprietario`, {
      method: 'PATCH',
      body: JSON.stringify({ proprietario_id: proprietarioId }),
    });
  }

  // Financeiro (ERP M2)
  async getLancamentos(tenantId: string, filters: any = {}) {
    const params = new URLSearchParams({ tenant_id: tenantId, ...filters });
    return this.fetch<{ lancamentos: any[] }>(`/financeiro/lancamentos?${params.toString()}`);
  }

  async updateLancamento(id: string, data: any) {
    return this.fetch<{ lancamento: any }>(`/financeiro/lancamentos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async createLancamento(data: any) {
    return this.fetch<{ lancamento: any }>('/financeiro/lancamentos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFinancialSummary(tenantId: string) {
    return this.fetch<{ summary: any }>(`/financeiro/summary?tenant_id=${tenantId}`);
  }

  async getCashFlow(tenantId: string) {
    return this.fetch<{ fluxo: any[] }>(`/financeiro/fluxo-caixa?tenant_id=${tenantId}`);
  }

  async gerarRecorrencia(tenantId: string, contratoId: string, config: any) {
    return this.fetch<{ lancamentos: any[] }>('/financeiro/recorrencia', {
      method: 'POST',
      body: JSON.stringify({ tenant_id: tenantId, contrato_id: contratoId, config }),
    });
  }

  // Comissões (ERP M3)
  async getComissoes(tenantId: string, filters: any = {}) {
    const params = new URLSearchParams({ tenant_id: tenantId, ...filters });
    return this.fetch<{ comissoes: any[] }>(`/comissoes?${params.toString()}`);
  }

  async getComissaoResumo(tenantId: string, corretorId?: string) {
    const params = new URLSearchParams({ tenant_id: tenantId });
    if (corretorId) params.append('corretor_id', corretorId);
    return this.fetch<{ resumo: any }>(`/comissoes/resumo?${params.toString()}`);
  }

  async liquidarComissao(id: string) {
    return this.fetch<{ comissao: any }>(`/comissoes/${id}/liquidar`, {
      method: 'POST',
    });
  }

  // Dashboard & Metas (M4)
  async getDashboardStats(month: number, year: number) {
    return this.fetch<{ metas: any[], performance: any[], resumo: any }>(`/dashboard/stats?month=${month}&year=${year}`);
  }

  async upsertMeta(meta: any) {
    return this.fetch<any>('/dashboard/metas', {
      method: 'POST',
      body: JSON.stringify(meta),
    });
  }

  async getRanking(month: number, year: number) {
    return this.fetch<any[]>(`/dashboard/ranking?month=${month}&year=${year}`);
  }

  // --- M5: ORDENS DE SERVIÇO ---
  async getPrestadores(tenantId: string) {
    return this.fetch<{ success: boolean; prestadores: any[] }>(`/prestadores?tenant_id=${tenantId}`);
  }

  async createPrestador(prestador: any) {
    return this.fetch<{ success: boolean; prestador: any }>('/prestadores', {
      method: 'POST',
      body: JSON.stringify(prestador),
    });
  }

  async getOrdensServico(tenantId: string) {
    return this.fetch<{ success: boolean; ordens: any[] }>(`/ordens-servico?tenant_id=${tenantId}`);
  }

  async createOrdemServico(os: any) {
    return this.fetch<{ success: boolean; os: any }>('/ordens-servico', {
      method: 'POST',
      body: JSON.stringify(os),
    });
  }

  async updateStatusOS(osId: string, status: string, extra: any = {}) {
    return this.fetch<{ success: boolean; os: any }>(`/ordens-servico/${osId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...extra }),
    });
  }

  // --- M6: VISTORIA DE IMÓVEIS ---
  async getVistorias(tenantId: string) {
    return this.fetch<{ success: boolean; vistorias: any[] }>(`/vistorias?tenant_id=${tenantId}`);
  }

  async getVistoriaById(id: string) {
    return this.fetch<{ success: boolean; vistoria: any }>(`/vistorias/${id}`);
  }

  async createVistoria(vistoria: any) {
    return this.fetch<{ success: boolean; vistoria: any }>('/vistorias', {
      method: 'POST',
      body: JSON.stringify(vistoria),
    });
  }

  async updateVistoria(id: string, updates: any) {
    return this.fetch<{ success: boolean; vistoria: any }>(`/vistorias/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async upsertVistoriaItem(item: any) {
    return this.fetch<{ success: boolean; item: any }>('/vistorias/itens', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async deleteVistoriaItem(id: string) {
    return this.fetch<{ success: boolean }>(`/vistorias/itens/${id}`, {
      method: 'DELETE',
    });
  }

  // --- M7: RELATÓRIOS GERENCIAIS ---
  getFinanceiroReportUrl(format: 'pdf' | 'csv', tenantId: string, startDate: string, endDate: string, tenantName: string) {
    return `${this.config.baseUrl}/relatorios/financeiro/${format}?tenant_id=${tenantId}&start_date=${startDate}&end_date=${endDate}&tenant_name=${encodeURIComponent(tenantName)}`;
  }

  // Health Check
  async healthCheck() {
    return this.fetch<{ message: string }>(`/health`, { method: 'GET' });
  }
}

// Export singleton instance
const apiUrl = import.meta.env.VITE_API_URL || '/api';

export const apiClient = new ApiClient({
  baseUrl: apiUrl,
});

export default apiClient;
