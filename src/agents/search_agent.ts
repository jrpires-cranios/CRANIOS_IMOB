import { createClient } from '@supabase/supabase-js';
import type { Imovel } from '../types.js';


const supabase = createClient(
  'https://rbhkwmesmvytqdfuwcie.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiaGt3bWVzbXZ5dHFkZnV3Y2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ0ODUsImV4cCI6MjA4NTM5MDQ4NX0.vHffPyFGC99OhYpfeGihf59oGhIguVwKfQagySAyTck'
);

/**
 * Agente de Busca para Imóveis
 * Busca imóveis no Supabase com filtros avançados
 */
export class SearchAgent {
  /**
   * Busca imóveis com filtros
   */
  async searchImoveis(params: {
    tipo?: 'casa' | 'apartamento' | 'terreno' | 'comercial';
    finalidade?: 'venda' | 'locacao' | 'ambos';
    cidade?: string;
    bairro?: string;
    quartos_min?: number;
    preco_min?: number;
    preco_max?: number;
    area_min?: number;
    area_max?: number;
    vagas_min?: number;
    destaque?: boolean;
    limit?: number;
    offset?: number;
  }) {
    try {
      console.log('[SearchAgent] Buscando imóveis com parâmetros:', params);

      let query = supabase
        .from('imoveis')
        .select('*')
        .eq('disponivel', true);

      // Aplica filtros
      if (params.tipo) {
        query = query.eq('tipo', params.tipo);
      }

      if (params.finalidade) {
        query = query.eq('finalidade', params.finalidade);
      }

      if (params.cidade) {
        query = query.ilike('cidade', `%${params.cidade}%`);
      }

      if (params.bairro) {
        query = query.ilike('bairro', `%${params.bairro}%`);
      }

      if (params.quartos_min) {
        query = query.gte('quartos', params.quartos_min);
      }

      if (params.preco_min) {
        query = query.gte('preco_venda', params.preco_min);
      }

      if (params.preco_max) {
        query = query.lte('preco_venda', params.preco_max);
      }

      if (params.area_min) {
        query = query.gte('area_total', params.area_min);
      }

      if (params.area_max) {
        query = query.lte('area_total', params.area_max);
      }

      if (params.vagas_min) {
        query = query.gte('vagas_garagem', params.vagas_min);
      }

      if (params.destaque !== undefined) {
        query = query.eq('destaque', params.destaque);
      }

      // Ordenação
      query = query.order('destaque', { ascending: false })
        .order('created_at', { ascending: false });

      // Paginação
      const limit = params.limit || 20;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Erro ao buscar imóveis: ${error.message}`);
      }

      console.log('[SearchAgent] Imóveis encontrados:', data.length, 'de', count);

      return {
        success: true,
        data: data as Imovel[],
        total: count || 0,
        limit,
        offset,
      };
    } catch (error) {
      console.error('[SearchAgent] Erro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        data: [],
        total: 0,
        limit: params.limit || 20,
        offset: params.offset || 0,
      };
    }
  }

  /**
   * Busca imóveis em destaque
   */
  async getDestaque(limit = 6) {
    return this.searchImoveis({ destaque: true, limit });
  }

  /**
   * Busca imóveis por texto (livre)
   */
  async searchByText(query: string, limit = 10) {
    try {
      console.log('[SearchAgent] Busca por texto:', query);

      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('disponivel', true)
        .or(`titulo.ilike.%${query}%,descricao.ilike.%${query}%,bairro.ilike.%${query}%,endereco.ilike.%${query}%`)
        .order('destaque', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Erro ao buscar por texto: ${error.message}`);
      }

      console.log('[SearchAgent] Resultados busca texto:', data.length);

      return {
        success: true,
        data: data as Imovel[],
        total: data.length,
      };
    } catch (error) {
      console.error('[SearchAgent] Erro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        data: [],
        total: 0,
      };
    }
  }

  /**
   * Busca similaridade (recomenda imóveis parecidos)
   */
  async findSimilar(imovelId: string, limit = 3) {
    try {
      console.log('[SearchAgent] Buscando imóveis similares a:', imovelId);

      // Primeiro busca o imóvel de referência
      const { data: refImovel, error: refError } = await supabase
        .from('imoveis')
        .select('*')
        .eq('id', imovelId)
        .single();

      if (refError || !refImovel) {
        throw new Error('Imóvel de referência não encontrado');
      }

      // Busca imóveis similares pelo tipo, faixa de preço e cidade
      const preco = refImovel.preco_venda || refImovel.preco_locacao;
      const faixaPreco = preco ? preco * 0.8 : 0;

      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('tipo', refImovel.tipo)
        .eq('cidade', refImovel.cidade)
        .eq('disponivel', true)
        .gte('preco_venda', faixaPreco)
        .order('destaque', { ascending: false })
        .neq('id', imovelId)
        .limit(limit);

      if (error) {
        throw new Error(`Erro ao buscar similares: ${error.message}`);
      }

      console.log('[SearchAgent] Imóveis similares:', data.length);

      return {
        success: true,
        data: data as Imovel[],
        total: data.length,
      };
    } catch (error) {
      console.error('[SearchAgent] Erro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        data: [],
        total: 0,
      };
    }
  }
}

export const searchAgent = new SearchAgent();
