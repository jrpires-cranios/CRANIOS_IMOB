import { createClient } from '@supabase/supabase-js';
import { searchAgent } from './search_agent.js';
import type { Imovel } from '../types.js';

const supabase = createClient(
  'https://rbhkwmesmvytqdfuwcie.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiaGt3bWVzbXZ5dHFkZnV3Y2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ0ODUsImV4cCI6MjA4NTM5MDQ4NX0.vHffPyFGC99OhYpfeGihf59oGhIguVwKfQagySAyTck'
);

/**
 * Agente de Qualificação para Imóveis
 * Analisa perfil do cliente e recomenda imóveis
 */
export class QualificationAgent {
  /**
   * Analisa perfil de cliente e recomenda imóveis
   */
  async qualifyClient(params: {
    nome?: string;
    email?: string;
    telefone?: string;
    orcamento?: number;
    quartos?: number;
    cidade?: string;
    tipo_interesse?: 'casa' | 'apartamento' | 'terreno';
    finalidade?: 'venda' | 'locacao';
  }) {
    try {
      console.log('[QualificationAgent] Analisando cliente:', params);

      const { nome, email, telefone, orcamento, quartos, cidade, tipo_interesse, finalidade } = params;

      // Busca imóveis compatíveis com o perfil
      const searchParams: any = {};
      if (cidade) searchParams.cidade = cidade;
      if (tipo_interesse) searchParams.tipo = tipo_interesse;
      if (finalidade) searchParams.finalidade = finalidade;
      if (quartos) searchParams.quartos_min = quartos;

      // Faixa de preço (±20% do orçamento)
      if (orcamento) {
        searchParams.preco_min = Math.floor(orcamento * 0.8);
        searchParams.preco_max = Math.ceil(orcamento * 1.2);
      }

      searchParams.limit = 10;
      searchParams.destaque = true;

      const searchResult = await searchAgent.searchImoveis(searchParams);

      if (!searchResult.success || !searchResult.data) {
        return {
          success: false,
          error: 'Não foi possível buscar imóveis compatíveis',
          recomendacoes: [],
          perfil: params,
        };
      }

      // Analisa os resultados encontrados
      const imoveis = searchResult.data;
      const recomendacoes = imoveis.map(imovel => ({
        imovel,
        score: this.calculateScore(imovel, params),
        motivo: this.generateMotivation(imovel, params),
      }));

      // Ordena por score
      recomendacoes.sort((a, b) => b.score - a.score);

      // Se cliente não tiver imóveis suficientes, busca outros similares
      let imoveisExtras: Imovel[] = [];
      if (recomendacoes.length < 3) {
        const similarResult = await searchAgent.findSimilar(recomendacoes[0].imovel.id, 5);
        if (similarResult.success) {
          imoveisExtras = similarResult.data;
        }
      }

      console.log('[QualificationAgent] Recomendações geradas:', recomendacoes.length);

      // Salva lead no Supabase
      if (email || telefone) {
        await this.saveLead(params);
      }

      return {
        success: true,
        perfil: params,
        recomendacoes: recomendacoes,
        imoveisExtras,
        total_aptos: recomendacoes.length + imoveisExtras.length,
        mensagem: `Encontrei ${recomendacoes.length} imóveis compatíveis com seu perfil!`,
      };
    } catch (error) {
      console.error('[QualificationAgent] Erro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        recomendacoes: [],
        perfil: params,
      };
    }
  }

  /**
   * Calcula score de compatibilidade (0-100)
   */
  private calculateScore(imovel: Imovel, params: any): number {
    let score = 50; // Base score

    // Quartos (se informado)
    if (params.quartos && imovel.quartos) {
      const diff = Math.abs(params.quartos - imovel.quartos);
      score += Math.max(-20, 20 - diff * 5);
    }

    // Orçamento (se informado)
    if (params.orcamento) {
      const preco = imovel.preco_venda || imovel.preco_locacao || 0;
      if (preco > 0) {
        const diff = Math.abs(params.orcamento - preco) / params.orcamento;
        score += Math.max(-20, 20 - diff * 40);
      }
    }

    // Bônus para destaque
    if (imovel.destaque) {
      score += 15;
    }

    // Bônus para boa localização (bairro popular)
    const bairrosPopulares = ['Jardins', 'Pituba', 'Rio Vermelho', 'Barra', 'Ondina'];
    if (imovel.bairro && bairrosPopulares.some(b => imovel.bairro.includes(b))) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Gera texto de motivação
   */
  private generateMotivation(imovel: Imovel, params: any): string {
    const motivos = [];

    // Match de quartos
    if (params.quartos && imovel.quartos && params.quartos === imovel.quartos) {
      motivos.push('Possui a quantidade exata de quartos');
    }

    // Match de localização
    if (params.cidade && imovel.cidade && params.cidade === imovel.cidade) {
      motivos.push(`Localizado em ${imovel.cidade}`);
    }

    if (params.quartos && imovel.quartos && params.quartos < imovel.quartos) {
      motivos.push(`${imovel.quartos - params.quartos} quartos a mais que você precisa`);
    }

    if (params.orcamento && imovel.preco_venda && imovel.preco_venda < params.orcamento) {
      motivos.push('Abaixo do seu orçamento');
    }

    if (imovel.destaque) {
      motivos.push('Imóvel em destaque');
    }

    return motivos.length > 0 ? motivos.join(', ') : 'Imóvel compatível com seu perfil';
  }

  /**
   * Salva lead no Supabase
   */
  private async saveLead(params: any) {
    try {
      const { nome, email, telefone, orcamento, quartos, cidade, tipo_interesse } = params;

      const leadData = {
        nome: nome || '',
        email: email || '',
        telefone: telefone || '',
        interesse: tipo_interesse || '',
        imoveis_interesse: [],
        orcamento_min: orcamento ? orcamento * 0.8 : undefined,
        orcamento_max: orcamento ? orcamento * 1.2 : undefined,
        observacoes: JSON.stringify(params),
        status: 'novo',
      };

      const { error } = await supabase.from('leads').insert([leadData]);

      if (error) {
        console.error('[QualificationAgent] Erro ao salvar lead:', error);
      }

      console.log('[QualificationAgent] Lead salvo com sucesso');
    } catch (error) {
      console.error('[QualificationAgent] Erro ao salvar lead:', error);
    }
  }
}

export const qualificationAgent = new QualificationAgent();
