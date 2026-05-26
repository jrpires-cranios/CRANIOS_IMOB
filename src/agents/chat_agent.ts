import { llmService } from '../services/llm.service.js';
import { knowledgeService } from '../services/knowledge.service.js';
import { PERSONAS } from './personas.js';
import { supabase } from '../config/supabase.js';
import { calendarService } from '../services/calendar.service.js';
import { reservationService } from '../services/reservation.service.js';
import { leadService } from '../services/lead.service.js';
import { pdfGeneratorService } from '../services/pdf-generator.service.js';
import { r2StorageService } from '../services/r2-storage.service.js';
import { LeadMemoryService, LeadProfile } from '../services/lead-memory.service.js';

// As localidades agora vêm do banco de dados organicamente

export class ChatAgent {

  /**
   * Busca o histórico da sessão diretamente na tabela mensagens
   */
  private async getSessionHistory(sessionId: string, limit = 20): Promise<{ role: string, content: string }[]> {
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .select('role, content')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error || !data) return [];
      return data.map(m => ({ role: m.role, content: m.content }));
    } catch (e) {
      console.warn('[ChatAgent] Erro ao buscar histórico:', e);
      return [];
    }
  }

  /**
   * Obtém cidades e bairros disponíveis no banco
   */
  private async obterLocalidadesDisponiveis(clienteId?: string): Promise<{ cidades: string[], bairros: string[] }> {
    try {
      let query = supabase.from('imoveis').select('cidade, bairro').eq('disponivel', true);
      if (clienteId) {
        query = query.eq('cliente_id', clienteId);
      }
      const { data, error } = await query;

      if (error || !data) return { cidades: [], bairros: [] };

      const cidades = [...new Set(data.map(i => i.cidade).filter(Boolean))];
      const bairros = [...new Set(data.map(i => i.bairro).filter(Boolean))];

      return { cidades: cidades as string[], bairros: bairros as string[] };
    } catch (e) {
      console.warn('[ChatAgent] Erro ao buscar localidades:', e);
      return { cidades: [], bairros: [] };
    }
  }

  /**
   * Processa a mensagem do usuário
   */
  async processarMensagem(
    mensagem: string,
    sessionId: string,
    cliente?: any,
    contextoImovelId?: string,
    empreendimento?: string   // Lead de campanha: nome do empreendimento específico
  ): Promise<{
    response: string;
    agente: string;
    tipo: string;
    data?: any;
    acao?: string;
  }> {
    console.log('[ChatAgent] Processando:', mensagem);

    // 0. HISTÓRICO DA SESSÃO
    const historico = await this.getSessionHistory(sessionId);
    console.log(`[ChatAgent] Histórico: ${historico.length} msgs`);

    // 0.2 LOCALIDADES DISPONÍVEIS
    const localidades = await this.obterLocalidadesDisponiveis(cliente?.id);
    const strCidades = localidades.cidades.length > 0 ? localidades.cidades.join(', ') : 'Diversas Cidades';
    const strBairros = localidades.bairros.length > 0 ? localidades.bairros.join(', ') : 'Diversos Bairros';

    // 0.1 IDENTIDADE
    const telefone = sessionId.includes('@') ? sessionId : (cliente?.telefone || sessionId);
    let lead = { id: '', nome: 'Desconhecido', short_id: 'N/A', whatsapp: telefone } as any;
    let isNew = true;
    try {
      const resultado = await leadService.findOrCreate(telefone, cliente?.nome);
      lead = resultado.lead;
      isNew = resultado.isNew;
    } catch (e) {
      console.warn('[ChatAgent] Lead fallback:', e);
    }

    // Detectar nome no histórico ou mensagem atual
    const nomeDetectado = this.detectarNome(historico, mensagem);
    if (nomeDetectado && (!lead.nome || lead.nome === 'Cliente' || lead.nome === 'Desconhecido')) {
      lead.nome = nomeDetectado;
      try { await leadService.updateName(lead.id, nomeDetectado); } catch (e) { }
    }

    const nomeCliente = (lead.nome && lead.nome !== 'Cliente' && lead.nome !== 'Desconhecido') ? lead.nome : null;

    // 0.3 LEAD MEMORY CROSS-SESSION
    let perfilMemoria: LeadProfile | null = null;
    let blocoMemoriaContexto = '';
    const tenantId = cliente?.tenant_id || 'DEFAULT_TENANT'; // Adaptação: Se sua modelagem for single-tenant, usaremos um estático por enquanto

    if (telefone) {
      const memoryService = new LeadMemoryService(supabase, tenantId);
      perfilMemoria = await memoryService.getProfile(telefone, 'whatsapp');
      blocoMemoriaContexto = memoryService.buildContextBlock(perfilMemoria);
    }

    // 0.4 VERIFICAR NPS PENDENTE
    if (lead?.id) {
      const { data: npsPendente } = await supabase.from('nps_responses')
        .select('*').eq('lead_id', lead.id).eq('status', 'pending').single();

      if (npsPendente) {
        // Tenta processar NPS se o lead enviou um número
        const scoreMatch = mensagem.match(/\b([0-9]|10)\b/);
        if (scoreMatch) {
          const score = parseInt(scoreMatch[1]);
          await supabase.from('nps_responses').update({ status: 'completed', score: score, feed_text: mensagem }).eq('id', npsPendente.id);

          // NOTIFICAR IQC DO GESTOR (Mock telegram/webhook)
          console.log(`[NPS GESTOR] O cliente ${lead.nome} avaliou o atendimento com a nota ${score}.`);

          return {
            response: `Muito obrigado, ${lead.nome || ''}! 🙏\nSua avaliação (Nota ${score}) é fundamental para que as nossas Inteligências continuem aprendendo e evoluindo.\n\nPrecisa de algo mais hoje? 😊`,
            agente: 'Elena Souza',
            tipo: 'nps_feedback'
          };
        }
      }
    }

    // 1. DETECTAR INTENÇÃO NA MENSAGEM ATUAL (não no histórico inteiro)
    const mensagemLower = mensagem.toLowerCase();
    const intencaoAtual = this.detectarIntencaoSimples(mensagemLower);

    // Detectar lançamento: campanha com empreendimento OU keywords na mensagem
    const keywordsLancamento = ['lançamento', 'lancamento', 'empreendimento', 'book do', 'planta', 'memorial', 'incorporadora', 'book de', 'material do'];
    const ehLancamento = !!empreendimento || keywordsLancamento.some(k => mensagemLower.includes(k));

    // Priorizar agendamento/portfolio sobre busca — se a msg atual é sobre agendar/ver, NÃO buscar
    const ehPedidoAgendamento = intencaoAtual === 'AGENDAMENTO';

    // Busca: checar msg ATUAL para novos termos de busca (não reusar keywords do histórico)
    const ehBusca = !ehPedidoAgendamento && this.detectarIntencaoBusca(mensagemLower);

    // 2. CONTEXTO DE PORTAL
    let contextoRAG = "";
    let imovelFoco = null;

    if (contextoImovelId) {
      const { data: imovel } = await supabase.from('imoveis').select('*').eq('id', contextoImovelId).single();
      if (imovel) {
        imovelFoco = imovel;
        contextoRAG += `\n[CONTEXTO PORTAL] Imóvel: "${imovel.titulo}" | ${imovel.bairro} | R$ ${imovel.preco_venda || imovel.preco_locacao} | ${imovel.quartos}q.\n`;
      }
    }

    // 3. SE É BUSCA → BUSCAR IMÓVEIS NO BANCO IMEDIATAMENTE
    let dadosAcao: any = {};
    let acaoSugerida = "";
    let agenteKey = 'ELENA';

    // ===========================================================
    // LANÇAMENTOS: Lead de campanha OU pergunta sobre lançamentos
    // ===========================================================
    if (ehLancamento && !ehPedidoAgendamento) {
      agenteKey = 'RICARDO';
      try {
        // Resolver bucket do cliente se disponível
        let bucketCliente: string | undefined;
        if (cliente?.bucket_name) bucketCliente = cliente.bucket_name;
        else if (cliente?.slug) {
          const { data: cl } = await supabase.from('clientes').select('bucket_name').eq('slug', cliente.slug).single();
          if (cl) bucketCliente = cl.bucket_name;
        }

        const lancamentos = await r2StorageService.listarLancamentos(undefined, bucketCliente);

        if (lancamentos.length > 0) {
          // Se veio de campanha: tentar filtrar pelo empreendimento específico
          const empreendimentoNorm = (empreendimento || '').toLowerCase().trim();
          const lancamentoFiltrado = empreendimentoNorm
            ? lancamentos.filter(l => l.nome.toLowerCase().includes(empreendimentoNorm))
            : [];

          const listagem = (lancamentoFiltrado.length > 0 ? lancamentoFiltrado : lancamentos)
            .map(l => `📄 *${l.nome}* (${l.tamanhoMB})\n🔗 ${l.urlDownload}`)
            .join('\n\n');

          const instrucaoEspecifica = empreendimento
            ? `\nATENÇÃO: Este lead chegou pela campanha do empreendimento "${empreendimento}". PRIORIZE o material desse empreendimento na resposta.`
            : '';

          contextoRAG += `\n\n[LANÇAMENTOS DISPONÍVEIS]${instrucaoEspecifica}\nEnvie estes materiais ao cliente e convide para visita:\n\n${listagem}\n\nINSTRUÇÕES:\n1. Apresente os lançamentos com entusiasmo, mencionando o nome do empreendimento.\n2. Inclua o link do book/material (o cliente clica e abre o PDF diretamente).\n3. Mencione que pode agendar uma visita presencial ou online.\n4. Pergunte qual empreendimento mais interessou.\n`;
          dadosAcao = { lancamentos };
          acaoSugerida = 'mostrar_lancamentos';
        } else {
          contextoRAG += `\n[SEM LANÇAMENTOS] Não há materiais de lançamentos cadastrados no momento. Ofereça imóveis prontos para entrega ou agende uma conversa.\n`;
        }
      } catch (e: any) {
        console.warn('[ChatAgent] Erro ao buscar lançamentos:', e.message);
        contextoRAG += `\n[LANÇAMENTOS] Não foi possível carregar os materiais agora. Peça ao cliente um contato para enviar depois.\n`;
      }
    } else if (!ehLancamento && !ehPedidoAgendamento) {
      agenteKey = 'RICARDO';

      // Extrair filtros
      const filtros = await this.extrairFiltros(mensagem, historico.filter(h => h.role === 'user').map(h => h.content), localidades.bairros);

      // AUTO-DETECTAR FINALIDADE por keywords (mais confiável que LLM)
      if (mensagemLower.includes('alug') || mensagemLower.includes('locaç') || mensagemLower.includes('locac')) {
        filtros.finalidade = 'locacao';
      } else if (mensagemLower.includes('compra') || mensagemLower.includes('comprar') || mensagemLower.includes('venda')) {
        filtros.finalidade = 'venda';
      }

      // Mapear LLM output → DB values
      if (filtros.finalidade === 'aluguel') filtros.finalidade = 'locacao';

      console.log('[ChatAgent] Filtros:', JSON.stringify(filtros));

      // LLM agora é responsável por mapear 'praia', 'nobre' para os bairros dinâmicos

      // Buscar no banco
      const imoveis = await this.buscarImoveisNoBanco(filtros, mensagem);

      if (imoveis.length > 0) {
        const ehLocacao = filtros.finalidade === 'locacao';
        contextoRAG += `\n\n[IMÓVEIS ENCONTRADOS] (${imoveis.length} resultados para ${ehLocacao ? 'LOCAÇÃO' : 'VENDA'})\nAPRESENTE ESTES IMÓVEIS ao cliente ${nomeCliente || ''}:\n${imoveis.map(i => {
          const preco = ehLocacao ? (i.preco_locacao || i.preco_venda) : (i.preco_venda || i.preco_locacao);
          const label = ehLocacao ? '/mês' : '';
          const fotoLink = i.foto_principal ? `📸 Fotos: ${i.foto_principal}` : '';
          const pdfLink = i.book_pdf_url ? `📄 Book PDF: ${i.book_pdf_url}` : '';
          return `🏠 ${i.titulo} | Bairro: ${i.bairro} | R$ ${Number(preco).toLocaleString('pt-BR')}${label} | ${i.quartos}q ${i.banheiros ? '| ' + i.banheiros + 'b' : ''} | ID: ${i.id}\n${fotoLink}${pdfLink ? '\n' + pdfLink : ''}`;
        }).join('\n')}\n\nINSTRUÇÕES OBRIGATÓRIAS:\n1. Apresente estes imóveis COM ENTUSIASMO. São para ${ehLocacao ? 'ALUGUEL' : 'COMPRA'}.\n2. Para CADA imóvel, INCLUA o link de fotos (📸) para o cliente visualizar.\n3. Se houver PDF Book disponível (📄), mencione que pode enviar o book completo do imóvel.\n4. Após mostrar, pergunte qual interessou e ofereça enviar mais detalhes/portfólio/book PDF.\n5. NÃO peça mais informações antes de mostrar. Mostre AGORA.\n`;
        dadosAcao = { imoveis };
        acaoSugerida = 'mostrar_imoveis';
      } else {
        // Busca ampla como fallback
        const { data: todoImov } = await supabase.from('imoveis').select('*').eq('disponivel', true).limit(5);
        if (todoImov && todoImov.length > 0) {
          contextoRAG += `\n\n[BUSCA SEM RESULTADOS EXATOS] Não encontrei com os filtros exatos, mas temos estas opções disponíveis nas nossas cidades:\n${todoImov.map(i =>
            `🏠 ${i.titulo} | ${i.bairro} (${i.cidade}) | R$ ${Number(i.preco_venda || i.preco_locacao).toLocaleString('pt-BR')} | ${i.quartos}q${i.foto_principal ? ' | 📸 ' + i.foto_principal : ''}`
          ).join('\n')}\n\nINSTRUÇÃO: Diga que não encontrou com os critérios EXATOS mas mostre as opções disponíveis com links de fotos. Sugira ao ${nomeCliente || 'cliente'} ampliar a busca.\n`;
          dadosAcao = { imoveis: todoImov };
          acaoSugerida = 'mostrar_imoveis';
        } else {
          contextoRAG += `\n[SEM IMÓVEIS] Não há imóveis cadastrados no momento.\n`;
        }
      }
    } else if (!nomeCliente) {
      // Se não sabe o nome e não é busca → Elena
      agenteKey = 'ELENA';
    } else {
      // Usar intenção já detectada no início
      if (intencaoAtual === 'AGENDAMENTO') {
        // FLUXO DE AGENDAMENTO COM VERIFICAÇÃO DE RESERVA
        agenteKey = 'CARLOS';
        const agendResult = await this.processarAgendamento(historico, mensagem, lead, nomeCliente);
        contextoRAG += agendResult.contexto;
        if (agendResult.dados) dadosAcao = agendResult.dados;
        if (agendResult.acao) acaoSugerida = agendResult.acao;
      } else if (intencaoAtual === 'FINANCIAMENTO') {
        agenteKey = 'LUCAS';
      } else if (intencaoAtual === 'DOCUMENTACAO') {
        agenteKey = 'BRUNA';
      } else if (intencaoAtual === 'RENT_CLOSING') {
        agenteKey = 'ELENA';
        const checkoutUrl = `https://craniosimob.com/secure/checkout/${lead.id || lead.short_id}`;
        contextoRAG += `\n[FECHAMENTO DE LOCAÇÃO] O cliente quer alugar o imóvel e iniciar a papelada.\n`;
        contextoRAG += `INSTRUÇÃO OBRIGATÓRIA:\n`;
        contextoRAG += `1. PARABENIZE o cliente pela excelente escolha!\n`;
        contextoRAG += `2. INFORME que na Crânios IMOB, o processo de locação é 100% digital, autônomo e sem burocracia.\n`;
        contextoRAG += `3. ENVIE este Link Seguro Exclusivo para ele preencher os dados, enviar os documentos (dele e do fiador) e assinar o contrato digital: ${checkoutUrl}\n`;
        contextoRAG += `4. NÃO peça dados como CPF ou e-mail aqui no chat, direcione TUDO para o Link Seguro.\n`;
        acaoSugerida = 'rent_closing';
      } else {
        agenteKey = 'ELENA';
      }

      // RAG via Pinecone: Diretrizes do agente e base de conhecimento
      try {
        const { pineconeService } = await import('../services/pinecone.service.js');
        const nomeAgente = agenteKey.toLowerCase();
        const tipoIntencao = intencaoAtual === 'FINANCIAMENTO' ? 'financeiro' : (intencaoAtual === 'DOCUMENTACAO' ? 'juridico' : 'vendas');
        // Busca contexto do Pinecone (namespace do agente + namespace geral)
        const contextoPinecone = await pineconeService.buscarContextoAgente(nomeAgente, tipoIntencao, mensagem, cliente?.id);
        if (contextoPinecone) {
          contextoRAG += `\n[BASE DE CONHECIMENTO & DIRETRIZES]\n${contextoPinecone}\n`;
        }
      } catch (err) {
        console.warn('[ChatAgent] Erro ao buscar RAG no Pinecone:', err);
      }
    }

    const persona = PERSONAS[agenteKey as keyof typeof PERSONAS] || PERSONAS.ELENA;

    const promptPersonaConfigurado = persona.systemPrompt
      .replace(/{{CIDADES_ATUACAO}}/g, strCidades)
      .replace(/{{BAIRROS_ATUACAO}}/g, strBairros);

    // 4. RESPOSTA FINAL
    const promptFinal = `
    ${promptPersonaConfigurado}
    
    [IDENTIDADE DO CLIENTE]
    Nome: ${nomeCliente || 'Desconhecido (PERGUNTE O NOME)'}
    ID: ${lead.short_id}
    Status: ${isNew ? 'Novo' : 'Recorrente'}
    
    [INSTRUÇÕES]
    1. ${nomeCliente ? `Use o nome "${nomeCliente}" nas suas respostas.` : 'PERGUNTE O NOME do cliente.'}
    2. NUNCA repita saudações — olhe o HISTÓRICO.
    3. Se há [IMÓVEIS ENCONTRADOS], APRESENTE-OS IMEDIATAMENTE com links de fotos.
    4. Todos os imóveis são nas cidades: ${strCidades}. JAMAIS cite bairros de cidades que não estejam na lista fornecida.
    5. Respostas objetivas — máximo 4-5 frases + lista de imóveis se houver.
    6. Quando o cliente pedir para VER o imóvel, ENVIE O LINK DAS FOTOS antes de oferecer agendamento.
    7. Se há [RESERVA], siga as instruções de reserva à risca. NÃO invente informações.
    
    ${contextoRAG}
    ${blocoMemoriaContexto}
    `;

    const respostaFinal = await llmService.generateResponse({
      systemPrompt: promptFinal,
      userMessage: mensagem,
      history: historico as any,
      temperature: 0.6
    });

    // --- PÓS-PROCESSAMENTO: Salvar extração de memória ---
    // Fazemos assincronamente (fire and forget) para não atrasar a resposta
    if (telefone) {
      const memoryMatch = respostaFinal.match(/<memory>(.*?)<\/memory>/s);
      if (memoryMatch) {
        try {
          const memoryJson = JSON.parse(memoryMatch[1].trim());
          if (memoryJson && memoryJson.memory_update) {
            const updates = memoryJson.memory_update;
            console.log('[ChatAgent] Atualizando Lead Memory:', updates);
            const memoryService = new LeadMemoryService(supabase, tenantId);
            // Não aguardar (await) para a UI não travar
            memoryService.upsertProfile(telefone, 'whatsapp', updates, 'phone').catch(err => console.error(err));
          }
        } catch (err) {
          console.warn('[ChatAgent] Erro ao parsear JSON de Memory da Elena:', err);
        }
      }
    }

    // Limpar as tags <memory> da resposta antes de enviar ao cliente
    const respostaLimpa = respostaFinal.replace(/<memory>.*?<\/memory>/gs, '').trim();

    return {
      response: respostaLimpa,
      agente: persona.name,
      tipo: ehBusca ? 'busca' : 'outros',
      data: dadosAcao,
      acao: acaoSugerida
    };
  }

  // --- Fluxo de Agendamento com Verificação de Reserva ---

  /**
   * Processa intenção de agendamento: verifica reserva do imóvel e retorna contexto
   */
  private async processarAgendamento(
    historico: { role: string, content: string }[],
    mensagem: string,
    lead: any,
    nomeCliente: string | null
  ): Promise<{ contexto: string, dados?: any, acao?: string }> {
    try {
      // 1. Identificar qual imóvel o cliente quer agendar
      const todosTextos = historico.map(h => h.content).join(' ') + ' ' + mensagem;

      // Tentativa 1: Buscar UUID diretamente
      const idPattern = /ID:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
      const idsEncontrados: string[] = [];
      let match;
      while ((match = idPattern.exec(todosTextos)) !== null) {
        if (!idsEncontrados.includes(match[1])) idsEncontrados.push(match[1]);
      }
      let imovelId = idsEncontrados.length > 0 ? idsEncontrados[idsEncontrados.length - 1] : null;

      // Tentativa 2: Se não achou UUID, buscar por título mencionado nas mensagens do assistente
      if (!imovelId) {
        const assistantMsgs = historico.filter(h => h.role === 'assistant').map(h => h.content).join(' ');
        // Extrair títulos de imóveis mencionados (formato: **Titulo** ou 🏠 Titulo)
        const tituloPattern = /(?:\*\*|🏠\s*\*?\*?)([^*\n|]+?)(?:\*\*|\s*[-–|])/g;
        const titulosEncontrados: string[] = [];
        while ((match = tituloPattern.exec(assistantMsgs)) !== null) {
          const titulo = match[1].trim();
          if (titulo.length > 5 && !titulosEncontrados.includes(titulo)) {
            titulosEncontrados.push(titulo);
          }
        }

        if (titulosEncontrados.length > 0) {
          // Buscar o último título mencionado no banco
          for (let i = titulosEncontrados.length - 1; i >= 0; i--) {
            const { data: found } = await supabase
              .from('imoveis')
              .select('id')
              .ilike('titulo', `%${titulosEncontrados[i].substring(0, 30)}%`)
              .limit(1)
              .single();
            if (found) {
              imovelId = found.id;
              console.log(`[ChatAgent] Imóvel encontrado por título: "${titulosEncontrados[i]}" → ${imovelId}`);
              break;
            }
          }
        }
      }

      if (!imovelId) {
        // Tentativa 3: pegar qualquer imóvel dos últimos resultados desta sessão
        // Buscar o último imóvel mostrado ao cliente (metadata contém ação 'mostrar_imoveis')
        const { data: lastMsg } = await supabase
          .from('mensagens')
          .select('metadata')
          .eq('session_id', historico.length > 0 ? historico[0].content : '')
          .eq('role', 'assistant')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (lastMsg?.metadata?.data?.imoveis?.[0]?.id) {
          imovelId = lastMsg.metadata.data.imoveis[0].id;
        }
      }

      if (!imovelId) {
        return {
          contexto: `\n[AGENDAMENTO] O cliente ${nomeCliente || ''} quer agendar uma visita mas NÃO ficou claro qual imóvel.\nINSTRUÇÃO: Pergunte qual dos imóveis apresentados ele gostaria de visitar.\n`
        };
      }

      // 2. Buscar dados do imóvel
      const { data: imovel } = await supabase.from('imoveis').select('*').eq('id', imovelId).single();
      if (!imovel) {
        return { contexto: `\n[AGENDAMENTO] Imóvel não encontrado no sistema. Peça para o cliente especificar qual imóvel deseja visitar.\n` };
      }

      // 3. ENVIAR PORTFÓLIO/FOTOS PRIMEIRO
      const fotoLink = imovel.foto_principal || '';
      let contexto = `\n[PORTFÓLIO DO IMÓVEL]\n`;
      contexto += `🏠 ${imovel.titulo} — ${imovel.bairro}\n`;
      contexto += `💰 R$ ${Number(imovel.preco_venda || imovel.preco_locacao).toLocaleString('pt-BR')}${imovel.finalidade?.toLowerCase().includes('locac') ? '/mês' : ''}\n`;
      contexto += `🛏️ ${imovel.quartos} quartos | 🚿 ${imovel.banheiros || '?'} banheiros | 🚗 ${imovel.vagas_garagem || 0} vagas\n`;
      if (imovel.area_construida) contexto += `📐 Área: ${imovel.area_construida}m²\n`;
      if (imovel.descricao) contexto += `📝 ${imovel.descricao.substring(0, 200)}\n`;
      if (fotoLink) contexto += `📸 Link das fotos: ${fotoLink}\n`;

      // 4. VERIFICAR RESERVA
      const statusReserva = await reservationService.checkAvailability(imovelId);
      console.log(`[ChatAgent] Reserva imovel ${imovelId}: disponivel=${statusReserva.available}`);

      if (!statusReserva.available) {
        // RESERVADO → Fila de espera
        await reservationService.addToWaitingList(imovelId, lead.id || lead.short_id);
        contexto += `\n⚠️ [IMÓVEL RESERVADO]\nEste imóvel JÁ ESTÁ RESERVADO por outro cliente.\n`;
        contexto += `INSTRUÇÃO OBRIGATÓRIA para o agente:\n`;
        contexto += `1. ENVIE o portfólio/fotos acima para ${nomeCliente || 'o cliente'}.\n`;
        contexto += `2. INFORME que este imóvel está temporariamente reservado por outro interessado.\n`;
        contexto += `3. DIGA que ${nomeCliente || 'ele(a)'} foi adicionado(a) à lista de espera AUTOMATICAMENTE.\n`;
        contexto += `4. Se a reserva do outro cliente expirar ou ele desistir, entraremos em contato imediatamente.\n`;
        contexto += `5. Sugira outros imóveis similares na mesma região.\n`;
        return { contexto, dados: { imovel, reservado: true, fila_espera: true }, acao: 'fila_espera' };
      } else {
        // DISPONÍVEL → Reservar automaticamente por 48h
        const reservaResult = await reservationService.createReservation(imovelId, lead.id || lead.short_id);
        console.log(`[ChatAgent] Reserva criada: ${reservaResult.message}`);
        contexto += `\n✅ [IMÓVEL DISPONÍVEL - RESERVA CRIADA]\n`;
        contexto += `O imóvel foi RESERVADO automaticamente para ${nomeCliente || 'o cliente'} por 48 horas!\n`;
        contexto += `INSTRUÇÃO OBRIGATÓRIA para o agente:\n`;
        contexto += `1. ENVIE o portfólio/fotos acima para ${nomeCliente || 'o cliente'}.\n`;
        contexto += `2. INFORME que o imóvel foi reservado com exclusividade por 48 horas em nome de ${nomeCliente || 'ele(a)'}.\n`;
        contexto += `3. AGENDE a visita para o horário que o cliente pediu.\n`;
        contexto += `4. PASSE confiança — diga que ninguém mais poderá agendar neste período.\n`;
        contexto += `5. Peça confirmação do horário da visita.\n`;
        return { contexto, dados: { imovel, reservado: false, reserva_criada: true }, acao: 'reserva_criada' };
      }
    } catch (e) {
      console.error('[ChatAgent] Erro no agendamento:', e);
      return { contexto: `\n[AGENDAMENTO] Ocorreu um erro ao processar o agendamento. Peça desculpas e tente novamente.\n` };
    }
  }

  // --- Helpers ---

  /**
   * Detecção agressiva de intenção de busca
   */
  private detectarIntencaoBusca(texto: string): boolean {
    const keywords = [
      'quero', 'procur', 'busc', 'ape', 'apartamento', 'casa', 'imovel', 'imóvel',
      'comprar', 'alugar', 'aluguel', 'venda', 'quarto', 'suite', 'suíte',
      'praia', 'perto', 'bairro', 'atalaia', 'jardins', 'grageru', 'farol',
      'jabotiana', 'luzia', 'coroa', 'aruana', 'brotas',
      'tem algo', 'tem aí', 'disponível', 'disponivel', 'opç', 'opções',
      'kitnet', 'cobertura', 'duplex', 'condomínio', 'condominio',
      'investir', 'investimento', 'lançamento', 'lancamento',
      'valor', 'preço', 'preco', 'até', 'mil', 'milhão', 'milhao',
    ];
    return keywords.some(k => texto.includes(k));
  }

  /**
   * Detecção simples de outras intenções
   */
  private detectarIntencaoSimples(texto: string): string {
    const t = texto.toLowerCase();
    if (t.includes('agend') || t.includes('visit') || t.includes('horário') || t.includes('marcar') || t.includes('como posso ver') || t.includes('quero ver') || t.includes('fotos') || t.includes('portfolio') || t.includes('portfólio') || t.includes('adorei') || t.includes('gostei') || t.includes('esse aí') || t.includes('essa opção')) return 'AGENDAMENTO';
    if (t.includes('financ') || t.includes('parcela') || t.includes('entrada') || t.includes('crédito')) return 'FINANCIAMENTO';
    if (t.includes('alugar esse') || t.includes('ficar com esse') || t.includes('fechar locação') || t.includes('fechar locacao') || t.includes('quero locar') || t.includes('documentos para alugar') || t.includes('quero alugar') || t.includes('locação autônoma') || t.includes('mandar a documentação')) return 'RENT_CLOSING';
    if (t.includes('contrato') || t.includes('documento') || t.includes('caução') || t.includes('escritura')) return 'DOCUMENTACAO';
    return 'GERAL';
  }

  /**
   * Detecta nome em mensagens
   */
  private detectarNome(historico: { role: string, content: string }[], mensagemAtual: string): string | null {
    const textos = [...historico.filter(h => h.role === 'user').map(h => h.content), mensagemAtual];
    for (const texto of textos) {
      const patterns = [
        /(?:com|sou|é)\s+(?:o\s+|a\s+)?([A-ZÀ-Ú][a-zà-ú]{2,}(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)/i,
        /(?:meu nome é|me chamo|pode me chamar de)\s+([A-ZÀ-Ú][a-zà-ú]{2,}(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)/i,
      ];
      for (const pattern of patterns) {
        const match = texto.match(pattern);
        if (match && match[1]) {
          const nome = match[1].trim();
          const blacklist = ['Elena', 'Bom', 'Boa', 'Sim', 'Não', 'Aqui', 'Tudo', 'Ok', 'Olá', 'Ola', 'Dia', 'Noite', 'Tarde'];
          if (!blacklist.includes(nome) && nome.length > 2) return nome;
        }
      }
    }
    return null;
  }

  /**
   * Extrai filtros via LLM
   */
  private async extrairFiltros(mensagem: string, historicoUser: string[], bairrosAtuais: string[]): Promise<any> {
    try {
      const raw = await llmService.generateResponse({
        systemPrompt: `Extraia filtros de busca de imóvel. Bairros VÁLIDOS na nossa atuação: ${bairrosAtuais.join(', ')}.
Se o cliente mencionar localidades, mapeie para os bairros válidos acima. Se falar referências geográficas como 'praia', 'orla', 'centro' ou 'nobre', use seu conhecimento geral para associar aos nossos bairros válidos em questão.
Para finalidade: "aluguel"/"alugar" = "locacao", "comprar" = "venda".
RETORNE APENAS JSON, nada mais. O JSON deve ter a estrutura exata de {"bairros":[],"preco_max":null,"quartos":null,"tipo":null,"finalidade":null}`,
        userMessage: `Mensagem: "${mensagem}"\nContexto: "${historicoUser.join(' ')}"\n\nJSON:\n{"bairros":[],"preco_max":null,"quartos":null,"tipo":null,"finalidade":null}`,
        jsonMode: true
      });
      const parsed = JSON.parse(raw);
      // Normalizar finalidade: aluguel → locacao
      if (parsed.finalidade === 'aluguel') parsed.finalidade = 'locacao';
      return parsed;
    } catch (e) {
      return {};
    }
  }

  /**
   * Busca imóveis no banco com filtros
   */
  private async buscarImoveisNoBanco(filtros: any, termoTextual: string): Promise<any[]> {
    try {
      let query = supabase.from('imoveis').select('*').eq('disponivel', true).limit(5);

      // Finalidade: case-insensitive + incluir 'ambos'
      if (filtros.finalidade) {
        const fin = filtros.finalidade.toLowerCase();
        // Busca: finalidade = 'locacao' OR 'Locacao' OR 'ambos' OR 'Ambos'
        query = query.or(`finalidade.ilike.${fin},finalidade.ilike.ambos`);
        console.log(`[ChatAgent] Filtro finalidade: ${fin} (+ ambos)`);
      }
      if (filtros.tipo) query = query.ilike('tipo', filtros.tipo);
      if (filtros.quartos) query = query.gte('quartos', filtros.quartos);
      if (filtros.preco_max) {
        const coluna = filtros.finalidade === 'locacao' ? 'preco_locacao' : 'preco_venda';
        query = query.lte(coluna, filtros.preco_max);
      }
      if (filtros.bairros && filtros.bairros.length > 0) {
        query = query.in('bairro', filtros.bairros);
      }

      const { data, error } = await query;
      if (error) console.warn('[ChatAgent] Query error:', error.message);

      // Fallback: busca ampla se filtros rígidos demais
      if (!data || data.length === 0) {
        console.log('[ChatAgent] Filtros rígidos, relaxando busca...');
        let fallback = supabase.from('imoveis').select('*').eq('disponivel', true).limit(5);
        if (filtros.finalidade) {
          fallback = fallback.or(`finalidade.ilike.${filtros.finalidade},finalidade.ilike.ambos`);
        }
        const { data: dataFallback } = await fallback;
        return dataFallback || [];
      }

      return data;
    } catch (e) {
      console.warn('[ChatAgent] Erro busca:', e);
      return [];
    }
  }

  private async buscarImoveisSimilares(imovel: any): Promise<any[]> {
    const { data } = await supabase
      .from('imoveis')
      .select('*')
      .eq('bairro', imovel.bairro)
      .neq('id', imovel.id)
      .limit(3);
    return data || [];
  }

  async notifyInterestedLeads(imovelId: string, novoStatus: string) {
    await reservationService.notifyWaitingList(imovelId);
  }
}

export const chatAgent = new ChatAgent();
