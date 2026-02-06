/**
 * API Client para Crânios IMOB Backend
 * Conecta diretamente à API na porta 3001
 */

interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

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
  cep?: string;
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
  destaque: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private config: ApiConfig;

  constructor(config?: Partial<ApiConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || 'http://localhost:3001/api',
      timeout: config?.timeout || 10000,
    };
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    try {
      console.log(`[API] Fetching: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error(`[API] Error ${response.status}:`, data);
        return { success: false, error: `HTTP ${response.status}`, data: data as T };
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
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.finalidade) params.append('finalidade', filters.finalidade);
    if (filters?.cidade) params.append('cidade', filters.cidade);
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

  // Health Check
  async healthCheck() {
    return this.fetch<{ message: string }>(`/health`, { method: 'GET' });
  }
}

// Export singleton instance
const apiUrl = import.meta.env.VITE_API_URL || window.location.hostname.includes('92.246.130.18') 
  ? 'http://92.246.130.18:3001/api'
  : 'http://localhost:3001/api';

export const apiClient = new ApiClient({
  baseUrl: apiUrl,
});

export default apiClient;
