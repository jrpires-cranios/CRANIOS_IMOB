import { searchAgent } from './search_agent.js';
import { qualificationAgent } from './qualification_agent.js';
import { schedulingAgent } from './scheduling_agent.js';
import type { Imovel } from '../types.js';

/**
 * Agente de Chat que coordena os agentes paralelos
 * Gerencia a conversação e despacha tarefas para outros agentes
 */
export class ChatAgent {
  private conversaAtual: any[] = [];
  private contexto: {
    cliente?: {
      nome?: string;
      email?: string;
      telefone?: string;
      orcamento?: number;
      quartos?: number;
      cidade?: string;
      tipo_interesse?: string;
      finalidade?: string;
    };
    imoveisVistos: string[] = [];
    leadId?: string;
  } = {};

  /**
   * Processa mensagem do usuário e despacha para agentes apropriados
   */
  async processarMensagem(mensagem: string, sessionId: string): Promise<{
    response: string;
    data?: any;
    acao?: string;
  }> {
    console.log('[ChatAgent] Processando mensagem:', mensagem);
    console.log('[ChatAgent] Contexto atual:', this.contexto);

    try {
      // Análise inicial da mensagem usando LLM (simulado por enquanto)
      const intencao = this.analisarIntencao(mensagem, this.conversaAtual);
      console.log('[ChatAgent] Intenção detectada:', intencao);

      // Despacha para agente apropriado
      switch (intencao.tipo) {
        case 'BUSCA':
          return await this.handleBusca(mensagem, intencao);
        
        case 'QUALIFICACAO':
          return await this.handleQualificacao(mensagem, intencao);
        
        case 'AGENDAMENTO':
          return await this.handleAgendamento(mensagem, intencao);
        
        case 'SAUDACAO':
          return this.handleSaudacao();
        
        default:
          return await this.handleGeral(mensagem, sessionId);
      }

    } catch (error) {
      console.error('[ChatAgent] Erro ao processar mensagem:', error);
      return {
        response: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Analisa a intenção da mensagem usando LLM (simulado)
   * NOTA: Em produção, isso usaria o LLM real via OpenRouter
   */
  private analisarIntencao(mensagem: string, historico: any[]): {
    tipo: 'BUSCA' | 'QUALIFICACAO' | 'AGENDAMENTO' | 'SAUDACAO' | 'GERAL';
    params?: any;
    confianca: number;
  } {
    const msg = mensagem.toLowerCase();
    let tipo: any = 'GERAL';
    let params: any = {};
    let confianca = 0.5;

    // Padrões de busca
    if (msg.includes('apartamento') || msg.includes('casa') || msg.includes('terreno') || 
        msg.includes('imóvel') || msg.includes('busc') || msg.includes('procuro') ||
        msg.includes('quero') || msg.includes('estou buscando')) {
      tipo = 'BUSCA';
      if (msg.includes('2 quartos')) params.quartos = 2;
      if (msg.includes('3 quartos')) params.quartos = 3;
      if (msg.includes('4 quartos')) params.quartos = 4;
      confianca = 0.8;
    }

    // Padrões de qualificação
    if (msg.includes('tenho') || msg.includes('sou') || msg.includes('meu orçamento') ||
        msg.includes('quero gastar') || msg.includes('estou disposto') || msg.includes('faixa de preço')) {
      tipo = 'QUALIFICACAO';
      if (msg.includes('R$')) {
        const match = msg.match(/r\$\s*(\d+(?:[.,]\d+)?)/i);
        if (match) params.orcamento = this.parseMoney(match[1]);
      }
      if (msg.includes('quartos')) {
        const match = msg.match(/quartos?:\s*(\d+)/i);
        if (match) params.quartos = parseInt(match[1]);
      }
      confianca = 0.7;
    }

    // Padrões de agendamento
    if (msg.includes('agendar') || msg.includes('visita') || msg.includes('conhecer') ||
        msg.includes('marcar') || msg.includes('horário')) {
      tipo = 'AGENDAMENTO';
      confianca = 0.9;
    }

    // Busca similaridade no histórico
    const similarHistorico = historico.find(h => 
      h.tipo === tipo && Math.abs(h.confianca - confianca) < 0.2
    );

    if (similarHistorico && confianca < 0.7) {
      // Se confiança baixa e tem histórico similar, aumenta confiança
      confianca = similarHistorico.confianca;
      params = { ...similarHistorico.params, ...params };
    }

    return { tipo, params, confianca };
  }

  /**
   * Lida com buscas de imóveis
   */
  private async handleBusca(mensagem: string, intencao: any): Promise<{
    response: string;
    data?: any;
    acao: string;
  }> {
    console.log('[ChatAgent] Handle BUSCA');

    const resultado = await searchAgent.searchByText(mensagem.substring(0, 100), 6);

    if (!resultado.success || resultado.data.length === 0) {
      return {
        response: 'Não encontrei imóveis que atendem aos critérios da busca. Quer que eu refine com mais detalhes?',
        acao: 'refinamento_busca',
      };
    }

    // Atualiza contexto com imóveis vistos
    const novosIds = resultado.data.map(i => i.id);
    this.contexto.imoveisVistos = [...this.contexto.imoveisVistos, ...novosIds];

    this.conversaAtual.push({
      role: 'assistant',
      content: `Encontrei ${resultado.data.length} imóveis para você.`,
      tipo: 'BUSCA',
      confianca: 0.8,
      params: {},
    });

    const imovel = resultado.data[0];
    const descricao = `Encontrei ${imovel.tipo} em ${imovel.cidade}! ` +
      `${imovel.quartos} quartos, ${imovel.banheiros} banheiros, ` +
      `${imovel.area_total}m². ` +
      (imovel.preco_venda ? `Por R$ ${imovel.preco_venda.toLocaleString('pt-BR')}` : 
       imovel.preco_locacao ? `R$ ${imovel.preco_locacao.toLocaleString('pt-BR')}/mês` : '') +
      '. \n\n' +
      'Algo que chama sua atenção?';

    return {
      response: descricao,
      data: {
        tipo: 'imoveis_encontrados',
        imoveis: resultado.data,
      },
      acao: 'mostrar_imoveis',
    };
  }

  /**
   * Lida com qualificação de cliente
   */
  private async handleQualificacao(mensagem: string, intencao: any): Promise<{
    response: string;
    data?: any;
    acao: string;
  }> {
    console.log('[ChatAgent] Handle QUALIFICACAO');

    // Extrai dados do cliente do contexto atual
    const clienteData = this.contexto.cliente || {};

    // Se não tem dados de cliente, pergunta primeiro
    if (!clienteData.orcamento && !clienteData.quartos && !clienteData.email) {
      return {
        response: 'Perfeito! Para eu encontrar os imóveis ideais para você, me diga:\n\n' +
          '1. Qual a sua faixa de orçamento?\n' +
          '2. Quantos quartos você precisa?\n' +
          '3. Qual cidade você busca?\n' +
          '4. Você prefere apartamento ou casa?',
        acao: 'coletar_dados_cliente',
      };
    }

    // Atualiza contexto com novos dados
    if (intencao.params.orcamento) {
      clienteData.orcamento = intencao.params.orcamento;
    }
    if (intencao.params.quartos) {
      clienteData.quartos = intencao.params.quartos;
    }

    this.contexto.cliente = clienteData;

    // Despacha para QualificationAgent
    const resultado = await qualificationAgent.qualifyClient(clienteData);

    if (!resultado.success || resultado.recomendacoes.length === 0) {
      return {
        response: 'Baseado nas suas preferências, não encontrei imóveis disponíveis no momento. Posso te avisar quando novos imóveis forem adicionados?',
        acao: 'alerta_disponibilidade',
      };
    }

    const imovel = resultado.recomendacoes[0].imovel;
    const descricao = `Com base no seu orçamento (${clienteData.orcamento ? `R$ ${clienteData.orcamento.toLocaleString('pt-BR')}` : ''}) ` +
      `e preferência por ${clienteData.quartos} quartos, ` +
      `encontrei esta opção:\n\n` +
      `🏠 ${imovel.titulo}\n` +
      `📍 ${imovel.bairro}, ${imovel.cidade}\n` +
      `🛏️ ${imovel.quartos} quartos, ${imovel.banheiros} banheiros\n` +
      `📏 ${imovel.area_total}m²\n` +
      (imovel.preco_venda ? `💰 R$ ${imovel.preco_venda.toLocaleString('pt-BR')}` : '') +
      `\n\n${imovel.motivo}\n\n` +
      `O que acha? Quer agendar uma visita?`;

    this.conversaAtual.push({
      role: 'assistant',
      content: `Qualifiquei cliente com ${resultado.total_aptos} imóveis compatíveis.`,
      tipo: 'QUALIFICACAO',
      confianca: 0.7,
      params: clienteData,
    });

    return {
      response: descricao,
      data: {
        tipo: 'imoveis_recomendados',
        imoveis: resultado.recomendacoes,
        perfil: clienteData,
        score: resultado.recomendacoes[0].score,
      },
      acao: 'mostrar_recomendacoes',
    };
  }

  /**
   * Lida com agendamento de visita
   */
  private async handleAgendamento(mensagem: string, intencao: any): Promise<{
    response: string;
    data?: any;
    acao: string;
  }> {
    console.log('[ChatAgent] Handle AGENDAMENTO');

    // Verifica se já tem lead_id no contexto
    if (!this.contexto.leadId) {
      return {
        response: 'Para agendar uma visita, preciso saber seus dados de contato. Me fornecer seu nome, email e telefone?',
        acao: 'coletar_contato',
      };
    }

    // Pergunta detalhes da visita
    const msg = mensagem.toLowerCase();
    
    // Extrai dados da mensagem
    let data = '';
    let horario = '';
    
    const matchData = msg.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (matchData) data = matchData[1];
    
    const matchHorario = msg.match(/(\d{1,2})[.:h](\d{1,2})/);
    if (matchHorario) {
      const [hh, mm] = matchHorario[1].split(/[.:h]/);
      horario = `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
    }

    if (!data || !horario) {
      return {
        response: 'Perfeito! Para agendar a visita, me informe:\n\n' +
          '1. Qual a data desejada? (ex: 05/02/2026)\n' +
          '2. Qual o horário preferido? (ex: 14:00)',
        acao: 'agendar_visita',
      };
    }

    // Marca a visita
    const resultado = await schedulingAgent.agendarVisita({
      lead_id: this.contexto.leadId,
      imovel_id: this.contexto.imoveisVistos[0] || '',
      data,
      horario,
      observacoes: `Agendado via Chat em ${new Date().toLocaleString('pt-BR')}`,
    });

    if (resultado.success) {
      this.conversaAtual.push({
        role: 'assistant',
        content: `Visita agendada para ${data} às ${horario}.`,
        tipo: 'AGENDAMENTO',
        confianca: 0.9,
      });
    }

    return {
      response: resultado.success 
        ? `✅ Visita agendada com sucesso!\n\nData: ${data}\nHorário: ${horario}\n\nVocê vai receber uma confirmação por email e WhatsApp.` 
        : resultado.mensagem || 'Não foi possível agendar a visita.',
      data: resultado.agendamento,
      acao: resultado.success ? 'visita_agendada' : 'erro_agendamento',
    };
  }

  /**
   * Lida com saudação
   */
  private handleSaudacao(): {
    response: string;
    data?: any;
    acao: string;
  } {
    return {
      response: 'Olá! 👋 Bem-vindo ao Crânios IMOB!\n\n' +
        'Sou sua assistente de IA especializada em imóveis.\n\n' +
        'Posso te ajudar a:\n' +
        '🔍 Buscar imóveis\n' +
        '🎯 Encontrar opções compatíveis com seu perfil\n' +
        '📅 Agendar visitas\n' +
        '💬 Tirar dúvidas\n\n' +
        'Como posso ajudar você hoje?',
      acao: 'saudacao',
    };
  }

  /**
   * Lida com mensagens gerais
   */
  private async handleGeral(mensagem: string, sessionId: string): Promise<{
    response: string;
    data?: any;
    acao: string;
  }> {
    console.log('[ChatAgent] Handle GERAL');

    // Salva mensagem no banco de dados
    try {
      const { supabaseAdmin } = await import('../config/supabase.js');
      await supabaseAdmin.default
        .from('mensagens')
        .insert([{
          conversa_id: sessionId,
          role: 'user',
          content: mensagem,
          metadata: {
            dispositivo: 'chat',
            timestamp: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
        }]);
    } catch (error) {
      console.error('[ChatAgent] Erro ao salvar mensagem:', error);
    }

    // Verifica se é uma busca implícita
    const msg = mensagem.toLowerCase();
    
    if (msg.includes('quero') || msg.includes('procuro') || 
        msg.includes('buscar') || msg.includes('mostrar')) {
      return await this.handleBusca(mensagem, { tipo: 'BUSCA', params: {}, confianca: 0.6 });
    }

    return {
      response: 'Entendi. Para eu te ajudar melhor, poderia me fornecer mais detalhes sobre o que você está procurando?\n\n' +
        'Por exemplo:\n' +
        '• Tipo de imóvel (apartamento, casa, terreno)\n' +
        '• Quantos quartos\n' +
        '• Faixa de orçamento\n' +
        '• Localização desejada',
      acao: 'esclarecimento',
    };
  }

  /**
   * Converte string de dinheiro para número
   */
  private parseMoney(str: string): number {
    const clean = str.replace(/\./g, '').replace(',', '.').replace(/\D/g, '');
    return parseFloat(clean) || 0;
  }

  /**
   * Atualiza contexto com informações do cliente
   */
  atualizarCliente(info: {
    nome?: string;
    email?: string;
    telefone?: string;
    orcamento?: number;
    quartos?: number;
    cidade?: string;
    tipo_interesse?: string;
  }) {
    this.contexto.cliente = {
      ...this.contexto.cliente,
      ...info,
    };

    console.log('[ChatAgent] Contexto atualizado:', this.contexto.cliente);
  }

  /**
   * Define o lead atual
   */
  setLead(leadId: string) {
    this.contexto.leadId = leadId;
    console.log('[ChatAgent] Lead definido:', leadId);
  }

  /**
   * Obtém conversa atual
   */
  getConversa(): any[] {
    return this.conversaAtual;
  }

  /**
   * Obtém contexto atual
   */
  getContexto(): any {
    return this.contexto;
  }
}

export const chatAgent = new ChatAgent();
