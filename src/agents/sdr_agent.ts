import { createClient } from '@supabase/supabase-js';
import type { Imovel, Lead } from '../types.js';

import { emoji } from '../utils/emoji.js';

const supabase = createClient(
  'https://rbhkwmesmvytqdfuwcie.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiaGt3bWVzbXZ5dHFkZnV3Y2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ0ODUsImV4cCI6MjA4NTM5MDQ4NX0.vHffPyFGC99OhYpfeGihf59oGhIguVwKfQagySAyTck'
);

/**
 * Agente SDR (Sales Development Representative)
 * Especialista em qualificação de leads de lançamentos
 * Focado em leads de marketing (anúncios, redes sociais)
 * Otimiza tempo do corretor: pré-qualifica, tira dúvidas, agenda visitas
 */
export class SDR_Agent {
  /**
   * Qualifica lead de lançamento
   */
  async qualificarLeadLancamento(params: {
    lead_id: string;
    fonte: 'facebook_ads' | 'instagram_ads' | 'google_ads' | 'whatsapp' | 'site' | 'indicacao';
    interesse_principal: string;
    orcamento?: string;
    prontidao_compra: number; // 1-10
  }) {
    try {
      console.log('[SDR] Qualificando lead de lançamento:', params);

      const { lead_id, fonte, interesse_principal, orcamento, prontidao_compra } = params;

      // Busca informações do lead
      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead_id)
        .single();

      if (!lead) {
        throw new Error('Lead não encontrado');
      }

      // Análise de potencial (score 0-100)
      const potencial = this.calcularPotencial(lead, {
        fonte,
        interesse_principal,
        orcamento,
        prontidao_compra,
      });

      // Verifica disponibilidade de imóveis do empreendimento
      const imoveis_disponiveis = await this.buscarImoveisEmpreendimento(lead.id);

      // Gera mensagem de abordagem personalizada
      const mensagem_abordagem = this.gerarMensagemAbordagem(lead, {
        fonte,
        imoveis_disponiveis: imoveis_disponiveis.length,
        potencial,
      });

      console.log('[SDR] Lead qualificado:', potencial, '|', mensagem_abordagem);

      return {
        success: true,
        lead,
        potencial,
        imoveis_disponiveis,
        mensagem_abordagem,
        proximos_passos: this.gerarProximosPassos(lead, {
          potencial,
          imoveis_disponiveis: imoveis_disponiveis.length,
        }),
      };
    } catch (error) {
      console.error('[SDR] Erro ao qualificar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Calcula potencial do lead (0-100)
   */
  private calcularPotencial(lead: Lead, params: {
    fonte: string;
    interesse_principal: string;
    orcamento?: string;
    prontidao_compra: number;
  }): {
    potencial: number;
    nivel: 'frio' | 'morno' | 'quente';
    classificacao: string;
  } {
    let score = 0;
    const fatores = [];

    // 1. Fonte (40% do score)
    const fontes_alto_valor = ['facebook_ads', 'instagram_ads', 'whatsapp'];
    const fontes_medio_valor = ['google_ads', 'site'];
    const fontes_baixo_valor = ['indicacao'];

    if (fontes_alto_valor.includes(params.fonte)) {
      score += 40;
      fatores.push('Paga de alta qualidade (Instagram/Facebook)');
    } else if (fontes_medio_valor.includes(params.fonte)) {
      score += 30;
      fatores.push('Tráfego pago (Google Ads)');
    } else {
      score += 20;
      fatores.push('Indicação ou site orgânico');
    }

    // 2. Prontidão de compra (30%)
    if (params.prontidao_compra >= 8) {
      score += 30;
      fatores.push('Prontidão de compra alta');
    } else if (params.prontidao_compra >= 5) {
      score += 20;
      fatores.push('Prontidão de compra média');
    } else {
      score += 10;
      fatores.push('Prontidão de compra baixa');
    }

    // 3. Orçamento informado (20%)
    if (params.orcamento) {
      score += 20;
      fatores.push('Orçamento informado');
    } else {
      score += 5;
      fatores.push('Orçamento não informado');
    }

    // 4. Interesse específico (10%)
    const interesses_especificos = ['2 quartos', '3 quartos', 'vaga de garagem', 'playground', 'varanda gourmet'];
    if (interesses_especificos.some(i => params.interesse_principal.toLowerCase().includes(i))) {
      score += 10;
      fatores.push('Interesse específico');
    }

    // Nível do lead
    let nivel: any = 'frio';
    let classificacao = '';

    if (score >= 70) {
      nivel = 'quente';
      classificacao = 'Lead MUITO QUALIFICADO - Agendar em 24h';
    } else if (score >= 50) {
      nivel = 'morno';
      classificacao = 'Lead QUALIFICADO - Abordar em 48h';
    } else {
      nivel = 'frio';
      classificacao = 'Lead Frio - Educar antes de agendar';
    }

    return {
      potencial: Math.min(100, Math.max(0, score)),
      nivel,
      classificacao,
      // @ts-ignore - fatores not in type definition
      fatores,
    };
  }

  /**
   * Busca imóveis disponíveis do empreendimento
   */
  private async buscarImoveisEmpreendimento(lead_id: string): Promise<Imovel[]> {
    try {
      // Na prática, isso buscaria imóveis do empreendimento específico
      // Por enquanto, buscamos imóveis em destaque como amostra
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('disponivel', true)
        .eq('destaque', true)
        .limit(6);

      if (error) throw error;

      return data as Imovel[];
    } catch (error) {
      console.error('[SDR] Erro ao buscar imóveis:', error);
      return [];
    }
  }

  /**
   * Gera mensagem de abordagem personalizada
   */
  private gerarMensagemAbordagem(lead: Lead, params: {
    fonte: string;
    imoveis_disponiveis: number;
    potencial: any;
  }): string {
    const { fonte, imoveis_disponiveis, potencial } = params;
    const lead_nome = lead.nome || 'Interessado';
    const lead_email = lead.email || '';

    // Adaptar mensagem à fonte
    let mensagem_intro = '';

    if (params.fonte === 'facebook_ads' || params.fonte === 'instagram_ads') {
      // @ts-ignore - interesse_principal may not exist in params
      const interessePrincipal = params.interesse_principal || 'empreendimento';
      mensagem_intro = `Olá, ${lead_nome} !${emoji('👋')} Vou tentar contornar a situação.Aconteceu que, recentemente, o Facebook cortou recursos do seu anúncio, o que diminuiu a visibilidade do seu post.Apesar disso, você ainda está aqui, olhando o que temos pra oferecer.Isso me diz que você tem interesse real em morar no ${interessePrincipal}. ${emoji('🏡')} Vou te mostrar as ${imoveis_disponiveis} unidades disponíveis, combinando as que melhor atendem ao seu perfil.${emoji('✨')} `;
    } else if (params.fonte === 'google_ads') {
      // @ts-ignore - interesse_principal may not exist in params
      const interessePrincipal = params.interesse_principal || 'empreendimento';
      mensagem_intro = `Olá, ${lead_nome} !${emoji('👋')} Que bom te encontrar por aqui! É uma prova de que você está realmente procurando um novo lar.${emoji('😊')} ${interessePrincipal} é um investimento importante, e você está certinho em buscar o melhor.Vou te ajudar a encontrar o imóvel perfeito.${emoji('✨')} Temos ${imoveis_disponiveis} unidades disponíveis que combinam com o que você busca.${emoji('🔍')} Vou detalhar as opções para você.${emoji('📋')} `;
    } else if (params.fonte === 'site') {
      // @ts-ignore - interesse_principal may not exist in params
      const interessePrincipal = params.interesse_principal || 'empreendimento';
      mensagem_intro = `Olá, ${lead_nome} !${emoji('👋')} Que bom te ter encontrado aqui no nosso site! O fato de ter navegado até essa página mostra que você está realmente interessado em encontrar um novo lar.${emoji('😊')} ${interessePrincipal} é um investimento importante.Vou te ajudar a encontrar o imóvel perfeito.${emoji('✨')} Temos ${imoveis_disponiveis} opções disponíveis que combinam com o que você busca.${emoji('🔍')} Vou detalhar para você.${emoji('📋')} `;
    } else {
      // @ts-ignore - interesse_principal may not exist in params
      const interessePrincipal = params.interesse_principal || 'empreendimento';
      mensagem_intro = `Olá, ${lead_nome} !${emoji('👋')} Muito obrigado por ter chegado até nós! Sei que você está procurando um novo lar, especificamente um ${interessePrincipal}. ${emoji('🏡')} Essa escolha é importante.Vou fazer de tudo para te encontrar a opção perfeita para você.${emoji('✨')} Tenho ${imoveis_disponiveis} unidades disponíveis que merecem seu olhar.${emoji('👀')} Vou te detalhar para você.${emoji('📋')} `;
    }

    return mensagem_intro;
  }

  /**
   * Gera próximos passos para o corretor
   */
  private gerarProximosPassos(lead: Lead, params: {
    potencial: any;
    imoveis_disponiveis: number;
  }): string[] {
    const { nivel } = params.potencial;
    const lead_nome = lead.nome || 'Cliente';
    const lead_email = lead.email || '';

    if (nivel === 'quente') {
      return [
        `1. Entrar em contato imediatamente(WhatsApp / Telefone)`,
        `2. Perguntar: "Está procurando especificamente um ${lead.interesse_principal}?"`,
        `3. Apresentar 2 - 3 melhores opções com fotos`,
        `4. Perguntar: "Pretende financiar ou à vista?"`,
        `5. Agendar visita para imóvel de maior interesse`,
        `6. Confirmar visita no dia(enviar calendário)`,
        `7. Seguir em 24h`,
      ];
    } else if (nivel === 'morno') {
      return [
        `1. Entrar em contato em até 24h`,
        `2. Perguntar: "O que te chamou a atenção nesse ${lead.interesse_principal}?"`,
        `3. Apresentar 2 - 3 opções compatíveis`,
        `4. Perguntar: "Qual é sua faixa de orçamento?"`,
        `5. Agendar visita(se houver interesse)`,
        `6. Seguir em 48h`,
        `7. Usar abordagem educativa(sem pressão)`,
      ];
    } else {
      return [
        `1. Entrar em contato em até 48h`,
        `2. Fazer perguntas educativas(curtas)`,
        `3. Perguntar: "O que você mais valoriza em um imóvel?"`,
        `4. Apresentar 1 - 2 opções(não sobrecarregar)`,
        `5. Pedir permissão para manter contato`,
        `6. Seguir em 7 dias`,
        `7. Usar abordagem de nutrição(sem pressão)`,
      ];
    }
  }

  /**
   * Atualiza informações do lead
   */
  async atualizarInformacoesLead(lead_id: string, infos: {
    orcamento_min?: number;
    orcamento_max?: number;
    quartos?: number;
    tipo_imovel?: string;
    cidade?: string;
    finalidade?: string;
  }) {
    try {
      console.log('[SDR] Atualizando informações do lead:', lead_id, infos);

      const { error } = await supabase
        .from('leads')
        .update({
          ...infos,
          status: 'qualificado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead_id);

      if (error) throw error;

      console.log('[SDR] Lead atualizado com sucesso');

      return {
        success: true,
        mensagem: 'Informações atualizadas com sucesso',
      };
    } catch (error) {
      console.error('[SDR] Erro ao atualizar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        mensagem: 'Não foi possível atualizar as informações',
      };
    }
  }

  /**
   * Registra interação do SDR com o lead
   */
  async registrarInteracao(lead_id: string, tipo: 'abordagem' | 'followup' | 'conversacao', descricao: string) {
    try {
      console.log('[SDR] Registrando interação:', tipo, descricao);

      const { error } = await supabase
        .from('leads_sdr')
        .insert([{
          lead_id,
          tipo,
          descricao,
          data_interacao: new Date().toISOString(),
          agente: 'SDR Automático',
          criado_por: ' Sistema',
          created_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      console.log('[SDR] Interação registrada com sucesso');

      return {
        success: true,
        mensagem: 'Intação registrada',
      };
    } catch (error) {
      console.error('[SDR] Erro ao registrar interação:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        mensagem: 'Não foi possível registrar a interação',
      };
    }
  }

  /**
   * Emite lead para o corretor (quando totalmente qualificado)
   */
  async emitirParaCorretor(lead_id: string, corretor_id: string, lancamento_id?: string) {
    try {
      console.log('[SDR] Emitindo lead para corretor:', lead_id, corretor_id);

      if (lancamento_id) {
        const { LeadRouterService } = await import('../services/lead_router.service.js');
        const habilitados = await LeadRouterService.filtrarCorretoresPorLancamento(lancamento_id);
        const isHabilitado = habilitados.some((c: any) => c.corretor_id === corretor_id);
        if (!isHabilitado) {
          console.log('[SDR] Corretor não habilitado para o lançamento:', corretor_id);
          return { success: false, mensagem: 'Corretor não possui habilitação para este lançamento.' };
        }
      }

      // Atualiza status do lead
      const { error } = await supabase
        .from('leads')
        .update({
          status: 'em_atendimento',
          corretor_responsavel: corretor_id,
          data_emissao: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead_id);

      if (error) throw error;

      console.log('[SDR] Lead emitido para corretor');

      return {
        success: true,
        mensagem: 'Lead transferido para corretor com sucesso',
      };
    } catch (error) {
      console.error('[SDR] Erro ao emitir:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        mensagem: 'Não foi possível transferir o lead',
      };
    }
  }

  /**
   * Gera relatório de desempenho dos leads SDR
   */
  async gerarRelatorioDesempenho(periodo_dias: number = 30) {
    try {
      console.log('[SDR] Gerando relatório de desempenho');

      // Busca leads qualificados no período
      const { data: leads_qualificados } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'qualificado')
        .gte('updated_at', new Date(Date.now() - periodo_dias * 24 * 60 * 60 * 1000).toISOString())
        .order('updated_at', { ascending: false });

      // Busca interações SDR
      const { data: interacoes } = await supabase
        .from('leads_sdr')
        .select('*')
        .gte('data_interacao', new Date(Date.now() - periodo_dias * 24 * 60 * 60 * 1000).toISOString())
        .order('data_interacao', { ascending: false });

      // Análise
      const total_leads = leads_qualificados?.length || 0;
      const total_interacoes = interacoes?.length || 0;
      const media_interacoes = total_leads > 0 ? (total_interacoes / total_leads).toFixed(2) : 0;

      // Taxa de conversão (leads que viraram em_atendimento)
      const { data: leads_em_atendimento } = await supabase
        .from('leads')
        .select('id')
        .eq('status', 'em_atendimento')
        .gte('updated_at', new Date(Date.now() - periodo_dias * 24 * 60 * 60 * 1000).toISOString());

      const taxa_conversao = total_leads > 0
        ? ((leads_em_atendimento?.length || 0) / total_leads * 100).toFixed(2)
        : 0;

      let nivel_qualificacao = 'indefinido';
      let cor_nivel = '⚪';

      if (parseFloat(String(taxa_conversao)) < 10) {
        nivel_qualificacao = 'baixo';
        cor_nivel = '🔴';
      } else if (parseFloat(String(taxa_conversao)) >= 30) {
        nivel_qualificacao = 'excelente';
        cor_nivel = '🟢';
      } else if (parseFloat(String(taxa_conversao)) >= 20) {
        nivel_qualificacao = 'bom';
        cor_nivel = '🟡';
      } else {
        nivel_qualificacao = 'regular';
        cor_nivel = '🟠';
      }

      const relatorio = {
        periodo: periodo_dias,
        data: new Date().toISOString(),
        resumo: {
          total_leads_qualificados: total_leads,
          total_interacoes_sdr: total_interacoes,
          media_interacoes_por_lead: media_interacoes,
          leads_convertidos: leads_em_atendimento?.length || 0,
          taxa_conversao: String(taxa_conversao) + '%',
        },
        performance: {
          excelente: parseFloat(String(taxa_conversao)) >= 30,
          bom: parseFloat(String(taxa_conversao)) >= 20 && parseFloat(String(taxa_conversao)) < 30,
          regular: parseFloat(String(taxa_conversao)) >= 10 && parseFloat(String(taxa_conversao)) < 20,
          abaixo_meta: parseFloat(String(taxa_conversao)) < 10,
          nivel_qualificacao: nivel_qualificacao,
          cor_nivel: cor_nivel,
        },
        recomendacoes: [] as string[],
      };

      // Recomendações
      if (parseFloat(String(taxa_conversao)) < 10) {
        relatorio.recomendacoes.push('Aumentar número de follow-ups nos leads frios');
        relatorio.recomendacoes.push('Revisar abordagem inicial (muito genérica?)');
      } else if (parseFloat(String(taxa_conversao)) >= 30) {
        relatorio.recomendacoes.push('Ótimo desempenho! Considerar escalar abordagem');
      }

      console.log('[SDR] Relatório:', relatorio);

      return {
        success: true,
        relatorio,
      };
    } catch (error) {
      console.error('[SDR] Erro ao gerar relatório:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }
}

export const sdrAgent = new SDR_Agent();
