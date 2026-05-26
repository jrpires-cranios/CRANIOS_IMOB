const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});

// Comentando referência problemática temporariamente
// const signNowAgent = require('./agents/signnow_agent.js').signNowAgent;

const { matchNewProperty } = require('./jobs/match-new-property.job.js');

const app = express();
const PORT = process.env.PORT || 3002;

// Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://rbhkwmesmvytqdfuwcie.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '');
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ========== HEALTH & DB TEST ==========

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Crânios IMOB API is running',
    timestamp: new Date().toISOString(),
    version: '1.2.2',
    env: process.env.NODE_ENV || 'production',
    features: {
      backend_api: true,
      chat_agents: true,
      signnow_ready: false, // Desativado temporariamente
      lgpd_protection: true,
    },
    agentes_ativos: 7,
    nota: 'SignNow desativado temporariamente devido a erro de compilacao. Usando agentes JS nativos.',
  });
});

app.get('/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase.from('imoveis').select('count').single();
    if (error) throw error;
    console.log('[DB] Supabase connection OK, count:', data.count);
    res.json({ db: 'OK', count: data.count });
  } catch (e) {
    console.log('[DB] Supabase connection ERROR:', e.message);
    res.status(500).json({ db: 'ERROR', message: e.message });
  }
});

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // 1. Total Imóveis
    const { count: totalImoveis } = await supabase.from('imoveis').select('*', { count: 'exact', head: true });

    // 2. Imóveis Disponíveis
    const { count: imoveisDisponiveis } = await supabase.from('imoveis').select('*', { count: 'exact', head: true }).eq('disponivel', true);

    // 3. Leads (simulado ou da tabela 'clientes' se existir, vamos usar 'mensagens' unique session_ids como proxy)
    const { data: msgs } = await supabase.from('mensagens').select('session_id');
    const uniqueLeads = new Set(msgs?.map(m => m.session_id) || []).size;

    // 4. Agendamentos (simulado - contar intenções de agendamento)
    const { count: agendamentos } = await supabase.from('mensagens').select('*', { count: 'exact', head: true }).ilike('metadata->>intencao', 'AGENDAMENTO');

    res.json({
      success: true,
      stats: {
        totalImoveis: totalImoveis || 0,
        imoveisDisponiveis: imoveisDisponiveis || 0,
        leads: uniqueLeads || 0,
        agendamentos: agendamentos || 0,
        atendimentosHoje: 12, // Simulado para demo
        vendasMes: 3, // Simulado
        locacoesMes: 5 // Simulado
      }
    });
  } catch (error) {
    console.error('[DashboardAPI] Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== IMOVEIS ENDPOINTS ==========

app.get('/api/imoveis', async (req, res) => {
  try {
    const { tipo, finalidade, cidade, limit, offset } = req.query;
    console.log('[API] GET /api/imoveis, params:', req.query);

    let query = supabase
      .from('imoveis')
      .select('*')
      .eq('disponivel', true);

    if (tipo) query = query.eq('tipo', tipo);
    if (finalidade) query = query.eq('finalidade', finalidade);
    if (cidade) query = query.ilike('cidade', `%${cidade}%`);

    query = query.order('destaque', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(Number(limit) || 200);

    const { data, error } = await query;

    if (error) throw error;

    console.log('[API] Imoveis encontrados:', data.length);
    res.json({ success: true, data });
  } catch (e) {
    console.error('[API] Error getting imoveis:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/imoveis/destaque', async (req, res) => {
  try {
    const { limit } = req.query;
    console.log('[API] GET /api/imoveis/destaque, limit:', limit);

    const { data, error } = await supabase
      .from('imoveis')
      .select('*')
      .eq('disponivel', true)
      .eq('destaque', true)
      .order('created_at', { ascending: false })
      .limit(Number(limit) || 6);

    if (error) throw error;

    console.log('[API] Imoveis destaque:', data.length);
    res.json({ success: true, data });
  } catch (e) {
    console.error('[API] Error getting destaque:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/imoveis/search', async (req, res) => {
  try {
    const { q, limit } = req.query;
    console.log('[API] GET /api/imoveis/search, q:', q);

    if (!q) {
      res.status(400).json({ success: false, error: 'Query de busca obrigatória' });
      return;
    }

    const { data, error } = await supabase
      .from('imoveis')
      .select('*')
      .eq('disponivel', true)
      .or(`titulo.ilike.%${q}%,descricao.ilike.%${q}%,bairro.ilike.%${q}%`)
      .order('destaque', { ascending: false })
      .limit(Number(limit) || 10);

    if (error) throw error;

    console.log('[API] Busca encontrou:', data.length, 'imoveis');
    res.json({ success: true, data });
  } catch (e) {
    console.error('[API] Error searching:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/imoveis/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[API] GET /api/imoveis/:id, id:', id);

    const { data, error } = await supabase
      .from('imoveis')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ success: false, error: 'Imóvel não encontrado' });
      return;
    }

    console.log('[API] Imóvel encontrado:', data.titulo);
    res.json({ success: true, data });
  } catch (e) {
    console.error('[API] Error getting imovel:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/imoveis', async (req, res) => {
  try {
    console.log('[API] POST /api/imoveis, body:', req.body);

    const imovel = req.body;
    const { data, error } = await supabase
      .from('imoveis')
      .insert([{
        ...imovel,
        cidade: imovel.cidade || 'Salvador',
        estado: imovel.estado || 'BA',
        disponivel: true,
        destaque: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('[API] Imóvel criado:', data.titulo);

    // FEATURE 3: Disparar Proactive Alerts em background
    if (data && data.id) {
      // Envolvemos em setTimeout para não segurar a request
      setTimeout(() => {
        matchNewProperty(data.id).catch(err => console.error('[API] Falha no MatchNewProperty Job', err));
      }, 1000); // 1 segundo de delay
    }

    res.status(201).json({ success: true, data });
  } catch (e) {
    console.error('[API] Error creating imovel:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ========== CHAT ENDPOINTS ==========

app.post('/api/chat', async (req, res) => {
  const { message, sessionId, cliente } = req.body;

  console.log('[ChatAPI] Nova mensagem:', message);
  console.log('[ChatAPI] Cliente:', cliente);

  try {
    // Salva mensagem no Supabase (fire and forget - não bloqueia)
    supabase.from('mensagens').insert([{
      conversa_id: sessionId,
      session_id: sessionId,
      role: 'user',
      content: message,
      metadata: cliente,
      created_at: new Date().toISOString(),
    }]).then(() => { }).catch(e => console.error('[ChatAPI] Erro ao salvar msg:', e));

    // 1. Analise de mensagem (estilo de comunicação)
    const analise = analiseMensagem(message, []);

    // 2. Detecção de intenção (7 agentes)
    const intencao = analisarIntencao(message, cliente, analise);

    // 3. Despacho para agente correto baseado na intenção
    const response = await despacharParaAgente(intencao, analise, message, cliente);

    // Salva resposta do assistente (fire and forget)
    supabase.from('mensagens').insert([{
      conversa_id: sessionId,
      session_id: sessionId,
      role: 'assistant',
      content: response.texto,
      metadata: {
        agente: response.agente,
        tipo: response.tipo,
        intencao: intencao.tipo,
        confianca: intencao.confianca,
      },
      created_at: new Date().toISOString(),
    }]).then(() => { }).catch(e => console.error('[ChatAPI] Erro ao salvar resposta:', e));

    console.log('[ChatAPI] Resposta gerada por:', response.agente, '| Intenção:', intencao.tipo);

    // Delay para simular digitação (humanização)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1500));

    res.json({
      success: true,
      response: response.texto,
      agente: response.agente,
      tipo: response.tipo,
      intencao: intencao.tipo,
      confianca: intencao.confianca,
      data: response.data || null,
    });
  } catch (error) {
    console.error('[ChatAPI] Erro:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
    });
  }
});

// ========== DOCUMENTACAO ENDPOINTS (Simulados temporariamente) ==========

app.post('/api/documind/criar-contrato', async (req, res) => {
  const { lead_id, imovel_id, valor_imovel, tipo_financiamento, valor_entrada, valor_financiado, data_assinatura } = req.body;

  console.log('[DocAPI] Criando contrato:', req.body);

  try {
    // Resposta simulada (SignNow temporariamente desativado)
    res.json({
      success: true,
      contrato: {
        id: `contrato_${Date.now()}`,
        texto: 'Contrato gerado com sucesso (Simulado - SignNow sendo ajustado)',
        link_assinatura: `https://app-eval.signnow.com/document/demo-${Date.now().toString(36)}/sign`,
        data_assinatura: data_assinatura || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      mensagem: 'Contrato gerado com sucesso! Pronto para assinar.',
      nota: 'SignNow está sendo ajustado para integração completa. Esta versão usa simulação.',
    });
  } catch (error) {
    console.error('[DocAPI] Erro ao criar contrato:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      contrato: null,
    });
  }
});

app.post('/api/documind/enviar-para-assinatura', async (req, res) => {
  const { contrato_id, lead_email, lead_nome, data_assinatura } = req.body;

  console.log('[DocAPI] Enviando para assinatura:', req.body);

  try {
    // Resposta simulada
    res.json({
      success: true,
      contrato: {
        id: contrato_id,
        status: 'enviado_assinatura',
      },
      mensagem: 'Contrato enviado para assinatura! (Simulado - SignNow sendo ajustado)',
      nota: 'SignNow está sendo ajustado para integração completa. Esta versão usa simulação.',
    });
  } catch (error) {
    console.error('[DocAPI] Erro ao enviar:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      contrato: null,
    });
  }
});

app.get('/api/documind/verificar-assinatura/:contrato_id', async (req, res) => {
  const { contrato_id } = req.params;

  console.log('[DocAPI] Verificando status:', contrato_id);

  try {
    // Resposta simulada
    res.json({
      success: true,
      status: 'assinado',
      contrato_id,
      mensagem: '✅ Contrato assinado! (Simulado - SignNow sendo ajustado)',
      nota: 'SignNow está sendo ajustado para integração completa. Esta versão usa simulação.',
    });
  } catch (error) {
    console.error('[DocAPI] Erro ao verificar:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      status: 'desconhecido',
    });
  }
});

// ========== HELPER FUNCTIONS ==========

function analiseMensagem(mensagem, historico) {
  const msg = mensagem.toLowerCase();
  let nivel_intimidade = 0;
  let estilo = 'misturado';
  let vocabulario = 'simples';
  let ritmo = 'normal';
  const gatilhos = [];

  const palavras_formais = ['gostaria', 'poderia', 'agradeço', 'estaria', 'gentil'];
  const palavras_informais = ['quero', 'to', 'ver', 'ter', 'falar', 'mandar', 'queria'];
  const palavras_elaboradas = ['analisar', 'verificar', 'considerar', 'possivelmente', 'provavelmente'];

  const temFormais = palavras_formais.some(p => msg.includes(p));
  const temInformais = palavras_informais.some(p => msg.includes(p));
  const temElaboradas = palavras_elaboradas.some(p => msg.includes(p));

  if (temInformais) nivel_intimidade += 4;
  if (temFormais) nivel_intimidade += 2;
  if (temElaboradas) { vocabulario = 'elaborado'; nivel_intimidade += 1; }

  if (mensagem.length > 100) nivel_intimidade += 2;
  const numPerguntas = (mensagem.match(/[?]/g) || []).length;
  if (numPerguntas > 1) nivel_intimidade += 1;

  // Gatilhos mentais
  if (msg.includes('urgente') || msg.includes('necessito') || msg.includes('preciso')) gatilhos.push('urgencia');
  if (msg.includes('só') || msg.includes('apenas')) gatilhos.push('exclusividade');
  if (msg.includes('não tem tempo') || msg.includes('preciso decidir logo')) gatilhos.push('escassez_tempo');
  if (msg.includes('familia') || msg.includes('filhos') || msg.includes('casa grande')) gatilhos.push('familia_estabilidade');
  if (msg.includes('lançamento') || msg.includes('empreendimento') || msg.includes('novas unidades')) gatilhos.push('lancamento');
  if (msg.includes('assinatura') || msg.includes('contrato')) gatilhos.push('assinatura');

  if (temFormais && !temInformais) estilo = 'formal';
  else if (temInformais && !temFormais) estilo = 'informal';

  return { nivel_intimidade, estilo, vocabulario, ritmo, gatilhos };
}

function analisarIntencao(mensagem, cliente, analise) {
  const msg = mensagem.toLowerCase();
  let tipo = 'GERAL';
  let confianca = 0.5;
  let params = {};
  let motivacao = '';

  // Saudação
  const saudacoes = ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hello', 'hey', 'e aí', 'opa'];
  if (saudacoes.some(s => msg.trim().startsWith(s)) && msg.length < 30) {
    tipo = 'SAUDACAO';
    confianca = 0.95;
    return { tipo, confianca, params, motivacao };
  }

  // Lançamento (SDR - Gabriel)
  if (msg.includes('lançamento') || msg.includes('empreendimento') ||
    msg.includes('novas unidades') || msg.includes('torres')) {
    tipo = 'SDR_LANCAMENTO';
    confianca = 0.9;
    motivacao = 'Lead veio de campanha de lançamento';
    const matchEmpreendimento = msg.match(/(?:do|da|em)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (matchEmpreendimento) params.empreendimento = matchEmpreendimento[1];
  }
  // Financiamento (Lucas)
  else if (msg.includes('financiamento') || msg.includes('financiar') ||
    msg.includes('caixa') || msg.includes('bradesco') ||
    msg.includes('parcela') || msg.includes('entrada') ||
    msg.includes('juros') || msg.includes('amortiz')) {
    tipo = 'FINANCIAMENTO';
    confianca = 0.85;
    params = { sistema_amortizacao: 'Price Table', prazo_anos: 30, tipo_juros: 'residencial' };
  }
  // Documentação (Bruna)
  else if (msg.includes('documentação') || msg.includes('documento') || msg.includes('rg') || msg.includes('cpf') ||
    msg.includes('contrato') || msg.includes('cartório') ||
    msg.includes('matrícula') || msg.includes('sri') || msg.includes('assinatura')) {
    tipo = 'DOCUMENTACAO';
    confianca = 0.85;
  }
  // Agendamento (Carlos)
  else if (msg.includes('agendar') || msg.includes('visita') || msg.includes('conhecer') ||
    msg.includes('marcar') || msg.includes('horário')) {
    tipo = 'AGENDAMENTO';
    confianca = 0.9;
  }
  // Busca (Ricardo)
  else if (msg.includes('apartamento') || msg.includes('casa') || msg.includes('terreno') ||
    msg.includes('imóvel') || msg.includes('imovel') || msg.includes('busc') || msg.includes('procuro') ||
    msg.includes('quero') || msg.includes('estou buscando') || msg.includes('tem ') ||
    msg.includes('disponível') || msg.includes('disponivel')) {
    tipo = 'BUSCA';
    confianca = 0.8;
    if (msg.includes('2 quartos')) params.quartos = 2;
    if (msg.includes('3 quartos')) params.quartos = 3;
    if (msg.includes('4 quartos')) params.quartos = 4;
    // Extrai bairro se mencionado
    const bairros = ['atalaia', 'aruana', 'jardins', 'grageru', 'luzia', 'siqueira', 'centro', 'farolândia', 'coroa do meio', 'treze de julho', '13 de julho', 'ponto novo', 'inácio barbosa'];
    bairros.forEach(b => { if (msg.includes(b)) params.bairro = b; });
  }
  // Qualificação (Amanda)
  else if (msg.includes('tenho') || msg.includes('sou') || msg.includes('meu orçamento') || msg.includes('meu orcamento') ||
    msg.includes('quero gastar') || msg.includes('estou disposto') || msg.includes('faixa de preço') ||
    msg.includes('minha renda') || msg.includes('salário') || msg.includes('salario')) {
    tipo = 'QUALIFICACAO';
    confianca = 0.7;
    const matchOrcamento = msg.match(/r\$\s*([\d.,]+)/i);
    if (matchOrcamento) params.orcamento = matchOrcamento[1].replace('.', '').replace(',', '.');
  }

  // Detectar Venda vs Locação
  if (msg.includes('alugar') || msg.includes('locação') || msg.includes('aluguel') || msg.includes('mensal')) {
    params.finalidade = 'locacao';
  } else if (msg.includes('comprar') || msg.includes('venda') || msg.includes('compra') || msg.includes('investir')) {
    params.finalidade = 'venda';
  }

  return { tipo, confianca, params, motivacao };
}

/**
 * Despacha mensagem para o agente correto baseado na intenção detectada
 * Cada agente tem personalidade, tom e gatilhos de neuro-vendas
 */
async function despacharParaAgente(intencao, analise, mensagem, cliente) {
  console.log('[Despacho] Tipo:', intencao.tipo, '| Confiança:', intencao.confianca);

  switch (intencao.tipo) {
    case 'SAUDACAO':
      return handleSaudacao(analise, cliente);
    case 'BUSCA':
      return await handleBusca(intencao.params, analise, mensagem);
    case 'QUALIFICACAO':
      return handleQualificacao(intencao.params, analise, cliente);
    case 'AGENDAMENTO':
      return handleAgendamento(intencao.params, analise, cliente);
    case 'FINANCIAMENTO':
      return handleFinanciamento(intencao.params, analise);
    case 'DOCUMENTACAO':
      return handleDocumentacao(intencao.params, analise);
    case 'SDR_LANCAMENTO':
      return handleSDRLancamento(intencao.params, analise, cliente);
    default:
      return handleGeral(analise, mensagem);
  }
}

// ─── AGENTE 1: Elena Souza (Coordenadora - Saudação) ───
function handleSaudacao(analise, cliente) {
  const nome = cliente?.nome ? `, ${cliente.nome}` : '';
  const texto = `Olá${nome}! Bem-vindo à Crânios IMOB! 🏠

Sou Elena Souza, Coordenadora de Atendimento. Fico muito feliz de receber você! ✨

Nossa equipe é especializada em imóveis em Aracaju e região:
• 🔍 Ricardo - Busca de imóveis
• 🎯 Amanda - Análise de perfil
• 📅 Carlos - Agendamentos
• 💰 Lucas - Financiamento bancário
• 📋 Bruna - Documentação
• 🚀 Gabriel - Lançamentos

Posso te ajudar de várias formas:
• Buscar imóveis que combinam com você
• Calcular financiamento
• Agendar visitas
• Tirar dúvidas

Como posso ajudar você hoje? 😊`;

  return { texto, agente: 'Elena Souza', tipo: 'saudacao' };
}

// ─── AGENTE 2: Ricardo Figueiredo (Busca de Imóveis) ───
async function handleBusca(params, analise, mensagem) {
  console.log('[Busca] Ricardo Figueiredo ativado | Params:', params);

  const nomeAgente = 'Ricardo Figueiredo';
  let texto = '';

  // VALIDAÇÃO: Se não tiver bairro nem tipo definido, PERGUNTAR antes de buscar
  const temLocal = params.bairro || mensagem.includes('bairro') || mensagem.includes('zona') || mensagem.includes('perto') || mensagem.includes('região');
  const temTipo = params.tipo || mensagem.includes('casa') || mensagem.includes('apto') || mensagem.includes('apartamento') || mensagem.includes('terreno');
  const temFinalidade = params.finalidade || mensagem.includes('comprar') || mensagem.includes('alugar');

  // Só pergunta se a mensagem for muito curta/vaga e não for um clique de botão detalhado
  // ignorar se tiver "lançamento" pois cai no SDR
  if ((!temLocal && !temTipo) && mensagem.length < 60) {
    return {
      texto: `Olá! Sou Ricardo Figueiredo. 🔍\n\nPara eu encontrar o imóvel ideal, me conte um pouco mais:\n\n• Você procura **Casa** ou **Apartamento**?\n• Tem algum **Bairro** de preferência?\n• Seria para **Compra** ou **Aluguel**?`,
      agente: nomeAgente,
      tipo: 'busca_incompleta'
    };
  }

  // Faz busca real no Supabase
  try {
    let query = supabase
      .from('imoveis')
      .select('*')
      .eq('disponivel', true);

    if (params.bairro) {
      query = query.ilike('bairro', `%${params.bairro}%`);
    }
    if (params.quartos) {
      query = query.gte('quartos', params.quartos);
    }

    // Filtro Venda vs Locação
    if (params.finalidade === 'locacao') {
      query = query.not('preco_locacao', 'is', null);
    } else if (params.finalidade === 'venda') {
      query = query.not('preco_venda', 'is', null);
    }

    // Busca por texto da mensagem também
    const searchTerms = mensagem.toLowerCase();
    const tipos = { 'apartamento': 'apartamento', 'casa': 'casa', 'terreno': 'terreno', 'comercial': 'comercial', 'sala': 'comercial' };
    for (const [keyword, tipo] of Object.entries(tipos)) {
      if (searchTerms.includes(keyword)) {
        query = query.eq('tipo', tipo);
        break;
      }
    }

    query = query.order('destaque', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      texto = `Olá! Sou Ricardo Figueiredo da Crânios IMOB. 🔍\n\nFiz uma busca, mas não encontrei imóveis com essas características exatas no momento.\n\nQue tal expandirmos a busca? Me diga outra região ou tipo de imóvel que te interessa.`;
      return { texto, agente: nomeAgente, tipo: 'busca', data: { imoveis: [], total: 0 } };
    }

    // Resposta com imóveis encontrados + neuro vendas
    if (analise.nivel_intimidade > 6) {
      texto = `Achei umas opções ótimas pra você! 🔥\n\n`;
    } else if (analise.nivel_intimidade > 3) {
      texto = `Olá! Sou Ricardo Figueiredo. Encontrei ${data.length} opções que podem te interessar! 🏠\n\n`;
    } else {
      texto = `Olá! Sou Ricardo Figueiredo da Crânios IMOB. Fiz uma busca e encontrei ${data.length} opções excelentes para você. 🔍\n\n`;
    }

    // Limitar duplicatas (embora o SQL limite 5, verificar IDs)
    const seenIds = new Set();
    const uniqueData = data.filter(item => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });

    uniqueData.forEach((imovel, i) => {
      const preco = imovel.preco_venda ? `R$ ${Number(imovel.preco_venda).toLocaleString('pt-BR')}` :
        imovel.preco_locacao ? `R$ ${Number(imovel.preco_locacao).toLocaleString('pt-BR')}/mês` : 'Consulte';

      texto += `${i + 1}. **${imovel.titulo}**\n`;
      texto += `   📍 ${imovel.bairro || imovel.endereco || imovel.cidade}\n`;
      texto += `   💰 ${preco}\n`;
      if (imovel.quartos) texto += `   🛏️ ${imovel.quartos} quartos`;
      if (imovel.area_total) texto += ` | ${imovel.area_total}m²`;
      if (imovel.vagas_garagem) texto += ` | ${imovel.vagas_garagem} vagas`;
      texto += '\n\n';
    });

    // Neuro Vendas: Urgência (FOMO) se poucos resultados
    if (uniqueData.length <= 3) {
      texto += `🔴 **Importante:** Imóveis assim não aparecem muito. Se estiver interessado, vale a pena visitar rápido!\n\n`;
    }

    texto += `Quer mais detalhes de algum deles ou agendar uma visita? 😊`;

    return { texto, agente: nomeAgente, tipo: 'busca', data: { imoveis: uniqueData, total: uniqueData.length } };

  } catch (err) {
    console.error('[Busca] Erro:', err);
    texto = `Tive um problema técnico na busca, mas já estou resolvendo. Enquanto isso, me diz: o que você procura exatemente?`;
    return { texto, agente: nomeAgente, tipo: 'busca' };
  }
}

// ─── AGENTE 3: Amanda Lima (Qualificação de Leads) ───
function handleQualificacao(params, analise, cliente) {
  console.log('[Qualificação] Amanda Lima ativada | Params:', params);
  const nomeAgente = 'Amanda Lima';
  let texto = '';

  if (analise.nivel_intimidade > 6) {
    texto = `Que bom que você compartilhou isso comigo! 🎯

Vou analisar seu perfil para encontrar as melhores opções dentro do seu orçamento.`;
  } else {
    texto = `Olá! Sou Amanda Lima da Crânios IMOB. 🎯

Fico feliz que esteja considerando investir em um imóvel! Para eu poder te oferecer as melhores recomendações, preciso entender um pouco mais sobre você. ✨`;
  }

  texto += `

Pode me contar:
• 💰 Sua faixa de orçamento (quanto pretende investir?)
• 🛏️ Quantos quartos você precisa?
• 📍 Qual região/bairro prefere?
• 🏠 Prefere apartamento ou casa?
• 🎯 Compra ou aluguel?

Com essas informações, vou montar um perfil personalizado e te recomendar os melhores imóveis! 🏡`;

  return { texto, agente: nomeAgente, tipo: 'qualificacao' };
}

// ─── AGENTE 4: Carlos Mendes (Agendamento de Visitas) ───
function handleAgendamento(params, analise, cliente) {
  console.log('[Agendamento] Carlos Mendes ativado');
  const nomeAgente = 'Carlos Mendes';
  let texto = '';

  // Verificar se tem data/horario na mensagem?
  // Se não tiver, pedir explicitamente
  // (Simplificado - em produção usaria NLP de data)

  if (analise.estilo === 'formal') {
    texto = `Olá! Sou Carlos Mendes, responsável pelos agendamentos. 📅\n\n`;
  } else {
    texto = `Olá! Sou Carlos Mendes da Crânios IMOB. 📅\n\n`;
  }

  texto += `Para agendarmos sua visita, me confirme por favor:\n\n• Qual o imóvel de interesse?\n• Qual o melhor dia e horário para você?`;

  return { texto, agente: nomeAgente, tipo: 'agendamento' };
}

// ─── AGENTE 5: Lucas Ferreira (Financiamento) ───
function handleFinanciamento(params, analise) {
  console.log('[Financiamento] Lucas Ferreira ativado');
  const nomeAgente = 'Lucas Ferreira';
  let texto = '';

  if (analise.nivel_intimidade > 6) {
    texto = `Entendi. Vou simular as melhores opções de financiamento pra você. 📊`;
  } else if (analise.nivel_intimidade > 3) {
    texto = `Olá! Sou Lucas Ferreira, especialista em financiamento da Crânios IMOB. 💰

Vou comparar os bancos para encontrar o melhor custo benefício para você!`;
  } else {
    texto = `Olá! Sou Lucas Ferreira da Crânios IMOB, especialista em financiamento imobiliário. 💰

Posso ajudar você a encontrar a melhor opção de financiamento.`;
  }

  texto += `

Para uma simulação precisa, preciso saber:
• 🏠 Valor do imóvel que te interessa
• 💰 Quanto pode dar de entrada (se possível)
• 📅 Prazo desejado (10, 20 ou 30 anos)
• 🏦 Tem preferência por algum banco? (Caixa, Bradesco, Itaú, Santander)

📊 **Taxas de referência atuais:**
• Caixa: a partir de 8,99% a.a.
• Bradesco: a partir de 9,49% a.a.
• Itaú: a partir de 9,29% a.a.
• Santander: a partir de 9,39% a.a.

Me passa os dados e eu faço uma comparação completa! 🚀`;

  return { texto, agente: nomeAgente, tipo: 'financiamento' };
}

// ─── AGENTE 6: Bruna Costa (Documentação) ───
function handleDocumentacao(params, analise) {
  console.log('[Documentação] Bruna Costa ativada');
  const nomeAgente = 'Bruna Costa';
  let texto = '';

  if (analise.estilo === 'informal') {
    texto = `Oi! Sou Bruna Costa da Crânios IMOB. 📋

Vou te ajudar com toda a parte de documentação! Sei que pode parecer complicado, mas vou simplificar tudo pra você.`;
  } else {
    texto = `Olá! Sou Bruna Costa, responsável pela documentação na Crânios IMOB. 📋

Estou aqui para garantir que toda a parte documental do seu negócio imobiliário esteja em ordem.`;
  }

  texto += `

📄 **Documentos necessários para compra:**
• RG e CPF (original e cópia)
• Comprovante de renda (3 últimos meses)
• Comprovante de endereço
• Certidão de estado civil
• Declaração de IR (se tiver)

📝 **Tipos de contrato disponíveis:**
• Compra e Venda
• Locação
• Locação com Opção de Compra (70% dos aluguéis abatidos!)
• Reserva

🔒 **Garantia LGPD:** Todos os seus dados são protegidos conforme a Lei Geral de Proteção de Dados.

Precisa de ajuda com algum desses? Me diz como posso te ajudar! 😊`;

  return { texto, agente: nomeAgente, tipo: 'documentacao' };
}

// ─── AGENTE 7: Gabriel Alves (SDR Lançamentos) ───
function handleSDRLancamento(params, analise, cliente) {
  console.log('[SDR] Gabriel Alves ativado | Empreendimento:', params.empreendimento);
  const nomeAgente = 'Gabriel Alves';
  const empreendimento = params.empreendimento || 'que você está interessado';
  const nome = cliente?.nome || '';
  let texto = '';

  if (nome) {
    texto = `Oi, ${nome}! Que bom você chegar até nós! 👍

Meu nome é Gabriel Alves, sou o SDR da Crânios IMOB. Vou te ajudar a encontrar a melhor oportunidade no empreendimento ${empreendimento}. 🏗️`;
  } else {
    texto = `Oi! Que bom você chegar até nós! 👍

Sou Gabriel Alves, SDR da Crânios IMOB. Vou te ajudar com o empreendimento ${empreendimento}. 🏗️

Primeiro, como você gostaria de ser chamado?`;
  }

  texto += `

🏗️ **Como posso ajudar:**
• Informações sobre unidades disponíveis
• Plantas e metragens
• Condições de pagamento na planta
• Tour virtual
• Agendamento de visita ao stand

💡 **Dica:** Empreendimentos na planta geralmente valorizam de 20-40% até a entrega das chaves!

Quer saber mais sobre unidades disponíveis? 🚀`;

  return { texto, agente: nomeAgente, tipo: 'sdr_lancamento' };
}

// ─── AGENTE DEFAULT: Elena Souza (Geral) ───
function handleGeral(analise, mensagem) {
  console.log('[Geral] Elena Souza ativada (fallback)');
  const nomeAgente = 'Elena Souza';
  let texto = '';

  if (analise.nivel_intimidade > 5) {
    texto = `Entendi! Vou te ajudar com isso. 😊

Para eu direcionar você pro melhor especialista da nossa equipe, me conta um pouco mais:`;
  } else {
    texto = `Olá! Sou Elena Souza da Crânios IMOB. 😊

Para eu poder te ajudar da melhor forma, poderia me contar um pouco mais sobre o que está procurando?`;
  }

  texto += `

Por exemplo:
• 🔍 "Quero um apartamento 2 quartos" → Busca de imóveis
• 💰 "Preciso de financiamento" → Simulação bancária
• 📅 "Quero agendar uma visita" → Agendamento
• 📋 "Preciso dos documentos" → Documentação
• 🏗️ "Vi um lançamento" → Informações de empreendimento

Fique à vontade para perguntar qualquer coisa! 🏠`;

  return { texto, agente: nomeAgente, tipo: 'geral' };
}

// ========== ROOT ==========

app.get('/', (req, res) => {
  res.json({
    name: 'Crânios IMOB API (Simples + SignNow)',
    version: '1.2.1',
    status: 'running',
    health: '/health',
    endpoints: [
      '/health',
      '/test-db',
      '/api/imoveis',
      '/api/imoveis/destaque',
      '/api/imoveis/search',
      '/api/chat',
      '/api/documind/criar-contrato',
      '/api/documind/enviar-para-assinatura',
      '/api/documind/verificar-assinatura/:contrato_id',
    ],
    agents: 7,
    signnow_status: 'Em ajuste (desativado temporariamente para garantir funcionamento)',
  });
});

// ========== ERROR HANDLING ==========

app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ success: false, error: err.message });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: `Rota não encontrada: ${req.method} ${req.url}` });
});

// ========== START SERVER ==========

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🚀 CRÂNIOS IMOB SERVER (SIMPLES + SIGNNOW)');
  console.log('='.repeat(60));
  console.log(`📡 Port: ${PORT} (Mudado de 3001 para evitar conflito)`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔗 Health: http://0.0.0.0:${PORT}/health`);
  console.log(`🏠 Imóveis: http://0.0.0.0:${PORT}/api/imoveis`);
  console.log(`⭐ Destaque: http://0.0.0.0:${PORT}/api/imoveis/destaque`);
  console.log(`🔍 Busca: http://0.0.0.0:${PORT}/api/imoveis/search`);
  console.log(`💬 Chat: http://0.0.0.0:${PORT}/api/chat`);
  console.log(`📋 DocuMind: http://0.0.0.0:${PORT}/api/documind/criar-contrato`);
  console.log(`🗄️ Teste DB: http://0.0.0.0:${PORT}/test-db`);
  console.log(`🤖 7 Agentes Ativos (SignNow desativado temporariamente)`);
  console.log(`🔒 LGPD e Proteção de Dados`);
  console.log('='.repeat(60));
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
});

server.on('error', (err) => {
  console.error('='.repeat(60));
  console.error('❌ FATAL ERROR starting server');
  console.error('='.repeat(60));
  console.error('Error code:', err.code);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  console.error('='.repeat(60));
  console.error('💡 POSSÍVEIS CAUSAS:');
  console.error('  - Porta já está em uso (EADDRINUSE)');
  console.error('  - Permissões insuficientes (EACCES)');
  console.error('  - Firewall bloqueando');
  console.error('='.repeat(60));
  process.exit(1);
});

server.on('close', () => {
  console.log('🛑 Server closed');
});

process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
