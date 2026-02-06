import { searchAgent } from './agents/search_agent.js';
import { qualificationAgent } from './agents/qualification_agent.js';
import { schedulingAgent } from './agents/scheduling_agent.js';
import { financiamentoAgent } from './agents/financiamento_agent.js';
import { documentacaoAgent } from './agents/documentacao_agent.js';
import { sdrAgent } from './agents/sdr_agent.js';
import type { Imovel, Lead, Conversa } from './types.js';

/**
 * Agente de Chat com Neuro Psicologia e 7 Agentes
 * 
 * PRINCÍPIOS:
 * - NUNCA usar jargões de IA (não "Vou fazer", "Vou estar analisando")
 * - Sempre empático, mas profissional
 * - Adaptação ao lead (espelhamento, detecção de persona)
 * - Técnicas de Neuro Psicologia e Neuro Vendas
 */

export class ChatAgent {
  private conversaAtual: any[] = [];
  private contexto: {
    cliente: {
      nome?: string;
      email?: string;
      telefone?: string;
      nivel_intimidade: number; // 0 (muito distante) - 10 (muito proximo)
      estilo_comunicacao: 'formal' | 'informal' | 'misturado';
      gatilhos_mencionados: string[];
    };
    imoveisVistos: string[] = [];
    leadId?: string;
    empreendimento?: string; // Para SDR
  } = {};

  /**
   * Processa mensagem do usuário e despacha para agente apropriado
   */
  async processarMensagem(mensagem: string, sessionId: string): Promise<{
    response: string;
    data?: any;
    acao?: string;
  }> {
    console.log('[ChatAgent] Processando mensagem:', mensagem);
    console.log('[ChatAgent] Contexto atual:', this.contexto);

    try {
      // 1. Análise inicial da mensagem (estilo de comunicação)
      const analise = this.analisarEstiloMensagem(mensagem, this.conversaAtual);
      
      // 2. Detecção de atualizações de contexto
      const contextoAtualizado = this.atualizarContextoComMensagem(mensagem, analise);
      
      // 3. Análise de intenção com base no contexto
      const intencao = this.analisarIntencao(mensagem, this.conversaAtual);
      
      console.log('[ChatAgent] Intenção:', intencao);
      console.log('[ChatAgent] Estilo do cliente:', analise);

      // 4. Despacha para agente apropriado (de 7 opções)
      return await this.despacharParaAgente(intencao, analise);
    } catch (error) {
      console.error('[ChatAgent] Erro ao processar mensagem:', error);
      return {
        response: 'Peço mil desculpas, tivemos um problema. Pode tentar novamente?',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Analisa o estilo de comunicação da mensagem
   * Ritmo, vocabulário, tom, nível de detalhe
   */
  private analisarEstiloMensagem(mensagem: string, historico: any[]): {
    nivel_intimidade: number;
    estilo: 'formal' | 'informal' | 'misturado';
    vocabulario: 'simples' | 'elaborado' | 'tecnico';
    ritmo: 'lento' | 'normal' | 'rapido';
    gatilhos: string[];
  } {
    const msg = mensagem.toLowerCase();
    let nivel_intimidade = 0;
    let estilo = 'misturado';
    let vocabulario = 'simples';
    let ritmo = 'normal';
    const gatilhos: string[] = [];

    // Indicadores de formalidade
    const palavrasFormais = ['gostaria', 'poderia', 'estaria', 'agradeo', 'gentil'];
    const palavrasInformais = ['quero', 'to', 'ver', 'ter', 'falar', 'mandar', 'queria'];
    
    // Indicadores de elaboração
    const palavrasElaboradas = ['analisar', 'verificar', 'considerar', 'possivelmente', 'provavelmente'];
    
    // Indicadores de nível de detalhe
    const nivelDetalhe = mensagem.length; // Mensagem longa = mais detalhista
    const numeroPerguntas = (mensagem.match(/[?]/g) || []).length;

    // Análise
    const temFormais = palavrasFormais.some(p => msg.includes(p));
    const temInformais = palavrasInformais.some(p => msg.includes(p));
    const temElaboradas = palavrasElaboradas.some(p => msg.includes(p));

    if (temFormais) nivel_intimidade += 2;
    if (temInformais) nivel_intimidade += 4;
    
    if (temElaboradas) {
      vocabulario = 'elaborado';
      nivel_intimidade += 1;
    }

    if (nivelDetalhe > 100) nivel_intimidade += 2;
    if (numeroPerguntas > 1) nivel_intimidade += 1;

    // Detecção de gatilhos mentais
    if (msg.includes('urgente') || msg.includes('necessito') || msg.includes('preciso')) {
      gatilhos.push('urgencia');
    }
    if (msg.includes('só') || msg.includes('apenas') || msg.includes('apenas um')) {
      gatilhos.push('exclusividade');
    }
    if (msg.includes('não tem tempo') || msg.includes('preciso decidir logo')) {
      gatilhos.push('escassez_tempo');
    }
    if (msg.includes('familia') || msg.includes('filhos') || msg.includes('casa grande')) {
      gatilhos.push('familia_estabilidade');
    }
    if (msg.includes('lançamento') || msg.includes('empreendimento') || msg.includes('novas unidades')) {
      gatilhos.push('lancamento');
    }

    // Estilo de comunicação
    if (temFormais && !temInformais) estilo = 'formal';
    else if (temInformais && !temFormais) estilo = 'informal';
    else estilo = 'misturado';

    // Ajuste baseado no histórico
    if (historico.length > 0) {
      const mensagensUsuario = historico.filter((h: any) => h.role === 'user');
      
      // Se já teve conversa antes, aumenta intimidade
      if (mensagensUsuario.length > 0) nivel_intimidade += 2;
      
      // Verifica se o cliente está evoluindo (começou informal, agora mais detalhista)
      const primeiraMsg = mensagensUsuario[0].content.toLowerCase();
      const atualMsg = mensagem.toLowerCase();
      
      if (primeiraMsg.length < atualMsg.length) {
        nivel_intimidade += 1; // Está se abrindo mais
        vocabulario = 'elaborado';
      }
    }

    console.log('[ChatAgent] Análise:', { nivel_intimidade, estilo, vocabulario, gatilhos });

    return { nivel_intimidade, estilo, vocabulario, ritmo, gatilhos };
  }

  /**
   * Atualiza contexto com informações da mensagem
   */
  private atualizarContextoComMensagem(mensagem: string, analise: any): any {
    // Atualiza nível de intimidade
    this.contexto.cliente.nivel_intimidade = analise.nivel_intimidade;
    this.contexto.cliente.estilo_comunicacao = analise.estilo;
    this.contexto.cliente.gatilhos_mencionados = analise.gatilhos;

    // Se o nível de intimidade for alto, aumenta "memória" da conversa
    if (analise.nivel_intimidade > 6) {
      this.conversaAtual = this.conversaAtual.slice(-10); // Guarda últimas 10 msgs
    }

    console.log('[ChatAgent] Contexto atualizado:', this.contexto.cliente);

    return this.contexto;
  }

  /**
   * Analisa intenção da mensagem (DE 7 AGENTES)
   */
  private analisarIntencao(mensagem: string, contexto: any): {
    tipo: 'SAUDACAO' | 'BUSCA' | 'QUALIFICACAO' | 'AGENDAMENTO' | 'FINANCIAMENTO' | 'DOCUMENTACAO' | 'SDR_LANCAMENTO' | 'GERAL' | 'OBJECAO';
    confianca: number;
    params?: any;
    motivacao?: string;
  } {
    const msg = mensagem.toLowerCase();
    let tipo: any = 'GERAL';
    let confianca = 0.5;
    let params: any = {};
    let motivacao = '';

    // Detecção de lançamento (SDR)
    if (msg.includes('lançamento') || msg.includes('empreendimento') || 
        msg.includes('novas unidades') || msg.includes('torres')) {
      tipo = 'SDR_LANCAMENTO';
      confianca = 0.9;
      motivacao = 'Lead veio de campanha de lançamento';
      
      // Extrai nome do empreendimento se possível
      const matchEmpreendimento = msg.match(/(?:do|da|em)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
      if (matchEmpreendimento) {
        params.empreendimento = matchEmpreendimento[1];
      }
    }

    // Padrões de financiamento
    else if (msg.includes('financiamento') || msg.includes('financiar') || 
             msg.includes('caixa') || msg.includes('bradesco') || 
             msg.includes('parcela') || msg.includes('entrada') ||
             msg.includes('juros') || msg.includes('amortiz')) {
      tipo = 'FINANCIAMENTO';
      confianca = 0.85;
      params = {
        sistema_amortizacao: 'Price Table', // Default
        prazo_anos: 30, // Default
        tipo_juros: 'residencial',
      };
    }

    // Padrões de documentação
    else if (msg.includes('documentação') || msg.includes('rg') || msg.includes('cpf') ||
             msg.includes('contrato') || msg.includes('cartório') ||
             msg.includes('matrícula') || msg.includes('sri')) {
      tipo = 'DOCUMENTACAO';
      confianca = 0.85;
    }

    // Padrões de busca (Ricardo)
    else if (msg.includes('apartamento') || msg.includes('casa') || msg.includes('terreno') || 
             msg.includes('imóvel') || msg.includes('busc') || msg.includes('procuro') ||
             msg.includes('quero') || msg.includes('estou buscando')) {
      tipo = 'BUSCA';
      if (msg.includes('2 quartos')) params.quartos = 2;
      if (msg.includes('3 quartos')) params.quartos = 3;
      if (msg.includes('4 quartos')) params.quartos = 4;
      confianca = 0.8;
    }

    // Padrões de qualificação (Amanda)
    else if (msg.includes('tenho') || msg.includes('sou') || msg.includes('meu orçamento') ||
             msg.includes('quero gastar') || msg.includes('estou disposto') || msg.includes('faixa de preço')) {
      tipo = 'QUALIFICACAO';
      if (msg.includes('R$')) {
        const match = msg.match(/r\$\s*(\d+(?:[.,]\d+)?)/i);
        if (match) params.orcamento = match[1].replace('.', '').replace(',', '.');
      }
      if (msg.includes('quartos')) {
        const match = msg.match(/quartos?:\s*(\d+)/i);
        if (match) params.quartos = parseInt(match[1]);
      }
      confianca = 0.7;
    }

    // Padrões de agendamento (Carlos)
    else if (msg.includes('agendar') || msg.includes('visita') || msg.includes('conhecer') ||
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

    return { tipo, params, confianca, motivacao };
  }

  /**
   * Seleciona agente apropriado (DE 7) baseado no estilo e intenção
   */
  private despacharParaAgente(intencao: any, analise: any): Promise<{
    response: string;
    data?: any;
    acao?: string;
  }> {
    console.log('[ChatAgent] Despachando para agente:', intencao);

    switch (intencao.tipo) {
      case 'SDR_LANCAMENTO':
        return await this.handleSDRLancamento(intencao.params, analise);
      
      case 'FINANCIAMENTO':
        return await this.handleFinanciamento(intencao.params, analise);
      
      case 'DOCUMENTACAO':
        return await this.handleDocumentacao(intencao.params, analise);
      
      case 'BUSCA':
        return await this.handleBusca(intencao.params, analise);
      
      case 'QUALIFICACAO':
        return await this.handleQualificacao(intencao.params, analise);
      
      case 'AGENDAMENTO':
        return await this.handleAgendamento(intencao.params, analise);
      
      case 'SAUDACAO':
        return await this.handleSaudacao();
      
      default:
        return await this.handleGeral(intencao.params, analise);
    }
  }

  /**
   * Lida com SDR de lançamento (Gabriel)
   */
  private async handleSDRLancamento(params: any, analise: any): Promise<{
    response: string;
    data?: any;
    acao: string;
  }> {
    console.log('[ChatAgent] Handle SDR com Gabriel');

    // Personalidade Gabriel: Amigável, observador, usa nome sempre
    let response = '';

    if (!this.contexto.cliente.nome) {
      // Neuro Psicologia: Gatilho de autoridade (pede nome para personalizar)
      response = `Oi! Que bom você chegar até nós. ${emoji('👍')}

Meu nome é Gabriel Alves, SDR da Crânios IMOB. Vou te ajudar a encontrar o imóvel perfeito no empreendimento ${params.empreendimento || 'que você está interessado'}.

Para poder te atender de forma personalizada, preciso saber seu nome. ${emoji('✨')}

Como você gostaria de ser chamado?`;
    } else if (analise.nivel_intimidade > 7) {
      // Cliente já é bem próximo: "Vou ver as melhores unidades pra você"
      response = `Entendi, ${this.contexto.cliente.nome}! Vou buscar as melhores unidades do empreendimento ${params.empreendimento || 'para você'} agora mesmo. ${emoji('🔍')}`;
    } else if (analise.nivel_intimidade > 4) {
      // Cliente está conhecendo: "Combinou, vou filtrar por X"
      response = `Perfeito, ${this.contexto.cliente.nome}. Vou buscar unidades que combinem com você.`;
    } else {
      // Cliente novo: "Vou começar a busca"
      response = `Certo. Vou buscar as unidades disponíveis no empreendimento.`;
    }

    this.conversaAtual.push({
      role: 'assistant',
      content: `SDR iniciou busca no empreendimento.`,
      tipo: 'SDR_LANCAMENTO',
      confianca: 0.9,
      params,
    });

    return {
      response,
      acao: 'processando',
      agente_executado: 'Gabriel Alves',
    };
  }

  /**
   * Lida com financiamento (Lucas)
   */
  private async handleFinanciamento(params: any, analise: any): Promise<{
    response: string;
    data?: any;
    acao: string;
  }> {
    console.log('[ChatAgent] Handle FINANCIAMENTO com Lucas');

    // Personalidade Lucas: Respeitoso, mas direto, foca em transparência
    let response = '';

    if (analise.nivel_intimidade > 7) {
      response = `Entendi. Vou simular as melhores opções de financiamento pra você. ${emoji('📊')}`;
    } else if (analise.nivel_intimidade > 4) {
      response = `Perfeito. Vou comparar os bancos para encontrar o melhor custo. ${emoji('🔍')}`;
    } else {
      response = `Certo. Vou calcular as parcelas disponíveis. ${emoji('💰')}`;
    }

    this.conversaAtual.push({
      role: 'assistant',
      content: `Financiamento iniciado.`,
      tipo: 'FINANCIAMENTO',
      confianca: 0.85,
      params,
    });

    return {
      response,
      acao: 'processando',
      agente_executado: 'Lucas Ferreira',
    };
  }

  /**
   * Lida com documentação (Bruna)
   */
  private async handleDocumentacao(params: any, analise: any): Promise<{
    response: string;
    data?: any;
    acao: string;
  }> {
    console.log('[ChatAgent] Handle DOCUMENTACAO com Bruna');

    // Personalidade Bruna: Formal, mas cordial, foca em segurança
    let response = '';

    if (analise.nivel_intimidade > 6) {
      response = `Entendi. Vou verificar sua documentação. ${emoji('📋')}`;
    } else if (analise.nivel_intimidade > 3) {
      response = `Combinado. Vou validar os documentos. ${emoji('✅')}`;
    } else {
      response = `Certo. Vou começar o processo de documentação. ${emoji('📋')}`;
    }

    this.conversaAtual.push({
      role: 'assistant',
      content: `Documentação iniciada.`,
      tipo: 'DOCUMENTACAO',
      confianca: 0.85,
      params,
    });

    return {
      response,
      acao: 'processando',
      agente_executado: 'Bruna Costa',
    };
  }

  /**
   * Lida com busca de imóveis (Ricardo)
   */
  private async handleBusca(params: any, analise: any): Promise<{
    response: string;
    data?: any;
    acao: string;
  }> {
    console.log('[ChatAgent] Handle BUSCA com Ricardo');

    // Personalidade Ricardo: Respeitoso, transparente, rápido
    let response = '';

    if (analise.nivel_intimidade > 7) {
      response = `Entendi. Vou buscar os melhores imóveis pra você. ${emoji('🔍')}`;
    } else if (analise.nivel_intimidade > 4) {
      response = `Perfeito. Vou filtrar por ${params.tipo ? params.tipo : 'imóveis'} que te interessa.`;
    } else {
      response = `Certo. Vou fazer uma busca completa para você.`;
    }

    const resultado = await searchAgent.searchByText(params.query?.substring(0, 100) || 'apartamento', 8);

    if (!resultado.success || resultado.data.length === 0) {
      // Neuro Psicologia: Reframe (não encontrou = oportunidade)
      return {
        response: `${response} 

Na verdade, isso pode ser bom. Quando não encontra logo o ideal, é sinal de que algo ainda melhor está por vir. Posso ficar atento e te avisar quando surgirem opções interessantes.`,
        acao: 'alerta_disponibilidade',
        agente_executado: 'Ricardo Figueiredo',
      };
    }

    // Neuro Vendas: Urgência (FOMO)
    if (resultado.data.length <= 3) {
      response += `

Encontrei só ${resultado.data.length} opções que realmente atendem aos seus critérios. 

🔴 Importante: Imóveis assim não aparecem muito. Se estiver interessado, vale a pena visitar rápido. Muitas pessoas olham mas não agendam.

Quer ver as ${resultado.data.length} opções?`;
    } else {
      response += `

Encontrei ${resultado.data.length} opções excelentes! 🏠`;
    }

    // Atualiza contexto com imóveis vistos
    const novosIds = resultado.data.map(i => i.id);
    this.contexto.imoveisVistos = [...this.contexto.imoveisVistos, ...novosIds];

    this.conversaAtual.push({
      role: 'assistant',
      content: `Busca concluída. ${resultado.data.length} imóveis encontrados.`,
      tipo: 'BUSCA',
      confianca: 0.8,
      params,
    });

    return {
      response,
      data: {
        tipo: 'imoveis_encontrados',
        imoveis: resultado.data,
        total: resultado.data.length,
      },
      acao: 'mostrar_imoveis',
      agente_executado: 'Ricardo Figueiredo',
    };
  }

  /**
   * Lida com qualificação (Amanda)
   */
  private async handleQualificacao(params: any, analise: any): Promise<{
    response: string;
    data?: any;
    acao: string;
  }> {
    console.log('[ChatAgent] Handle QUALIFICACAO com Amanda');

    // Personalidade Amanda: Empática, observadora, usa nome sempre
    const clienteData = this.contexto.cliente;

    // Se não tem dados de cliente, pergunta primeiro
    if (!clienteData.orcamento && !clienteData.quartos && !clienteData.email) {
      return {
        response: `Entendi. Para eu poder te oferecer as melhores recomendações, preciso saber mais sobre você. ${emoji('✨')}

Pode me dizer:
• Sua faixa de orçamento?
• Quantos quartos você precisa?
• Qual cidade você busca?
• Prefere apartamento ou casa?`,
        acao: 'coletar_dados',
        agente_executado: 'Amanda Lima',
      };
    }

    // Atualiza contexto com novos dados
    if (params.orcamento) clienteData.orcamento = params.orcamento;
    if (params.quartos) clienteData.quartos = params.quartos;
    if (params.tipo) clienteData.tipo = params.tipo;

    this.contexto.cliente = clienteData;

    // Despacha para QualificationAgent
    const resultado = await qualificationAgent.qualifyClient(clienteData);

    if (!resultado.success || resultado.recomendacoes.length === 0) {
      return {
        response: 'Baseado nas suas preferências, não encontrei imóveis disponíveis no momento. Posso te avisar quando novos imóveis forem adicionados.',
        data: resultado,
        acao: 'alerta_disponibilidade',
        agente_executado: 'Amanda Lima',
      };
    }

    const imovel = resultado.recomendacoes[0].imovel;
    const story = this.gerarStoryQualificacao(imovel, clienteData);

    this.conversaAtual.push({
      role: 'assistant',
      content: `Cliente qualificado com ${resultado.total_aptos} imóveis compatíveis.`,
      tipo: 'QUALIFICACAO',
      confianca: 0.7,
      params: clienteData,
    });

    return {
      response: story,
      data: resultado,
      acao: 'mostrar_recomendacoes',
      agente_executado: 'Amanda Lima',
    };
  }

  /**
   * Gera Storytelling para qualificação
   */
  private gerarStoryQualificacao(imovel: Imovel, cliente: any): string {
    const { tipo, cidade, quartos, area_total, preco_venda, bairro } = imovel;
    
    let story = `Analisei seu perfil e encontrei algo que combina muito bem: ${tipo} em ${cidade}. ${emoji('🏠')}`;
    
    // Neuro Psicologia: Cenário de uso futuro
    if (quartos >= 2) {
      story += `👨‍👩‍👧‍👦 Imagina você recebendo amigos e família nesses ${quartos} quartos. `;
    }
    
    if (area_total >= 100) {
      story += `🏡 Com ${area_total}m², você tem espaço para montar um escritório em casa. `;
    }
    
    if (bairro) {
      story += `📍 O bairro ${bairro} é muito bem localizado. `;
    }
    
    // Neuro Vendas: Valor percebido
    if (preco_venda) {
      story += `💰 O valor de R$ ${preco_venda.toLocaleString('pt-BR')} está bem compatível com o que busca. `;
      
      // Dor de perda (FOMO)
      story += `🔥 Honestamente: imóveis com esse perfil na região não aparecem todos os dias. Se estiver interessado, vale muito agendar uma visita rapidinho. `;
    }
    
    story += `\n\nO que você achou dessa opção? ${emoji('✨')}`;

    return story;
  }

  /**
   * Lida com agendamento (Carlos)
   */
  private async handleAgendamento(params: any, analise: any): Promise<{
    response: string;
    data?: any;
    acao: string;
  }> {
    console.log('[ChatAgent] Handle AGENDAMENTO com Carlos');

    // Verifica se já tem lead_id no contexto
    if (!this.contexto.leadId) {
      return {
        response: `Para agendar uma visita, preciso saber seus dados de contato. ${emoji('📋')}

Me forneça:
• Seu nome completo
• Seu email
• Seu telefone (opcional)

Com isso, marco a visita na agenda do proprietário e te confirmo por WhatsApp. ${emoji('📱')}`,
        acao: 'coletar_contato',
        agente_executado: 'Carlos Mendes',
      };
    }

    // Pergunta detalhes da visita
    const msg = JSON.stringify(params).toLowerCase();
    
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
        response: `Perfeito! Para agendar a visita, preciso: ${emoji('📅')}

1. Qual a data desejada? (ex: 05/02/2026)
2. Qual o horário preferido? (ex: 14:00)`,
        acao: 'agendar_visita',
        agente_executado: 'Carlos Mendes',
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
        params,
      });
    }

    return {
      response: resultado.success 
        ? `✅ Visita agendada com sucesso! ${emoji('📅')}\n\nData: ${data}\nHorário: ${horario}\n\nVocê vai receber confirmação por email e WhatsApp. ${emoji('📱')}` 
        : resultado.mensagem || 'Não foi possível agendar a visita.',
      data: resultado.agendamento,
      acao: resultado.success ? 'visita_agendada' : 'erro_agendamento',
      agente_executado: 'Carlos Mendes',
    };
  }

  /**
   * Lida com saudação (Elena)
   */
  private handleSaudacao(): {
    response: string;
    data?: any;
    acao: string;
  } {
    return {
      response: `Olá! Bem-vindo à Crânios IMOB! ${emoji('🏠')}

Sou Elena Souza, Coordenadora de Atendimento. Fico muito feliz de receber você! ${emoji('✨')}

Nossa equipe é especializada em imóveis em Salvador e região:
• Ricardo - Busca de imóveis
• Amanda - Análise de perfil
• Carlos - Agendamentos
• Lucas - Financiamento bancário
• Bruna - Documentação
• Gabriel - Qualificação de lançamentos

Posso te ajudar de várias formas:
• Buscar imóveis que combinam com você
• Calcular financiamento
• Agendar visitas
• Tirar dúvidas

Como posso ajudar você hoje? ${emoji('❓')}`,
      acao: 'saudacao',
      agente_executado: 'Elena Souza',
    };
  }

  /**
   * Lida com mensagens gerais (Elena)
   */
  private async handleGeral(params: any, analise: any): Promise<{
    response: string;
    data?: any;
    acao: string;
  }> {
    console.log('[ChatAgent] Handle GERAL com Elena');

    // Verifica se é uma busca implícita
    const msg = JSON.stringify(params).toLowerCase();
    
    if (msg.includes('quero') || msg.includes('procuro') || 
        msg.includes('buscar') || msg.includes('mostrar')) {
      return await this.handleBusca({ query: msg.substring(0, 100) }, analise);
    }

    return {
      response: `Entendi. Para eu te ajudar melhor, poderia me fornecer mais detalhes sobre o que está procurando? ${emoji('🤔')}

Por exemplo:
• Tipo de imóvel (apartamento, casa, terreno)
• Quantos quartos
• Faixa de orçamento
• Localização desejada`,
      acao: 'esclarecimento',
      agente_executado: 'Elena Souza',
    };
  }

  /**
   * Atualiza informações do cliente
   */
  atualizarCliente(info: {
    nome?: string;
    email?: string;
    telefone?: string;
    orcamento?: number;
    quartos?: number;
    cidade?: string;
    tipo_interesse?: string;
    finalidade?: string;
    empreendimento?: string; // Para SDR
  }) {
    this.contexto.cliente = {
      ...this.contexto.cliente,
      ...info,
    };

    console.log('[ChatAgent] Cliente atualizado:', this.contexto.cliente);
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
