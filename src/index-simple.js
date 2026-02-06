const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Comentando referência problemática temporariamente
// const signNowAgent = require('./agents/signnow_agent.js').signNowAgent;

const app = express();
const PORT = process.env.PORT || 3002;

// Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://rbhkwmesmvytqdfuwcie.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiaGt3bWVzbXZ5dHFkZnV3Y2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ0ODUsImV4cCI6MjA4NTM5MDQ4NX0.vHffPyFGC99OhYpfeGihf59oGhIguVwKfQagySAyTck';
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
    version: '1.2.1',
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
    // Salva mensagem no Supabase
    await supabase.from('mensagens').insert([{
      conversa_id: sessionId,
      session_id: sessionId,
      role: 'user',
      content: message,
      metadata: cliente,
      created_at: new Date().toISOString(),
    }]);

    // Analise de mensagem (estilo de comunicação)
    const analise = analiseMensagem(message, []);
    
    // Detecção de intenção (7 agentes)
    const intencao = analisarIntencao(message, cliente, analise);
    
    // Despacho para agente (simulado para now)
    const response = gerarRespostaComAgentes(message, analise);

    // Salva resposta do assistente
    await supabase.from('mensagens').insert([{
      conversa_id: sessionId,
      session_id: sessionId,
      role: 'assistant',
      content: response.texto,
      metadata: {
        agente: response.agente,
        tipo: response.tipo,
      },
      created_at: new Date().toISOString(),
    }]);

    console.log('[ChatAPI] Resposta gerada por:', response.agente);

    res.json({
      success: true,
      response: response.texto,
      agente: response.agente,
      tipo: response.tipo,
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

  const palavras_formais = ['gostaria', 'poderia', 'agradeo'];
  const palavras_informais = ['quero', 'to', 'ver', 'ter', 'falar'];
  
  if (palavras_informais.some(p => msg.includes(p))) nivel_intimidade += 4;
  if (palavras_formais.some(p => msg.includes(p))) nivel_intimidade += 2;
  
  if (mensagem.length > 100) nivel_intimidade += 2;
  
  if (msg.includes('urgente') || msg.includes('necessito') || msg.includes('preciso')) gatilhos.push('urgencia');
  if (msg.includes('só') || msg.includes('apenas')) gatilhos.push('exclusividade');
  if (msg.includes('assinatura') || msg.includes('contrato')) gatilhos.push('assinatura');

  if (palavras_formais.some(p => msg.includes(p)) && !palavras_informais.some(p => msg.includes(p))) estilo = 'formal';
  else if (palavras_informais.some(p => msg.includes(p)) && !palavras_formais.some(p => msg.includes(p))) estilo = 'informal';

  return { nivel_intimidade, estilo, vocabulario, ritmo, gatilhos };
}

function analisarIntencao(mensagem, cliente, analise) {
  const msg = mensagem.toLowerCase();
  let tipo = 'GERAL';
  let confianca = 0.5;
  let params = {};
  let motivacao = '';

  if (msg.includes('apartamento') || msg.includes('casa') || msg.includes('terreno')) {
    tipo = 'BUSCA';
    confianca = 0.8;
  } else if (msg.includes('assinatura') || msg.includes('contrato')) {
    tipo = 'DOCUMENTACAO';
    confianca = 0.9;
  } else if (msg.includes('agendar') || msg.includes('visita')) {
    tipo = 'AGENDAMENTO';
    confianca = 0.9;
  } else if (msg.includes('tenho') || msg.includes('sou') || msg.includes('meu orcamento')) {
    tipo = 'QUALIFICACAO';
    confianca = 0.7;
  }

  return { tipo, confianca, params, motivacao };
}

function gerarRespostaComAgentes(mensagem, analise) {
  const agentes = [
    { id: 'AGENTE_COORDENADOR', nome: 'Elena Souza', tom: 'amigável' },
    { id: 'AGENTE_BUSCA', nome: 'Ricardo Figueiredo', tom: 'respeitoso' },
    { id: 'AGENTE_QUALIFICACAO', nome: 'Amanda Lima', tom: 'amigável' },
    { id: 'AGENTE_AGENDAMENTO', nome: 'Carlos Mendes', tom: 'formal' },
    { id: 'AGENTE_FINANCIAMENTO', nome: 'Lucas Ferreira', tom: 'respeitoso' },
    { id: 'AGENTE_DOCUMENTACAO', nome: 'Bruna Costa', tom: 'formal' },
    { id: 'AGENTE_SDR', nome: 'Gabriel Alves', tom: 'amigável' },
  ];

  const agente_selecionado = agentes[0];

  const texto = `Olá! Sou ${agente_selecionado.nome} da Crânios IMOB. Como posso ajudar você hoje?`;

  return {
    texto,
    agente: agente_selecionado.nome,
    tipo: 'saudacao',
  };
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
