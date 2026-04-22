import { chatAgent } from './chat_agent.js';
import { supabase } from './config/supabase.js';
import type { Request, Response } from 'express';

export async function handleChat(req: Request, res: Response) {
  const { message, sessionId, cliente } = req.body as any;

  console.log('[ChatAPI] Nova mensagem:', message);
  console.log('[ChatAPI] Cliente:', cliente);

  try {
    // Atualiza contexto do agente com dados do cliente
    if (cliente) {
      chatAgent.atualizarCliente(cliente);
    }

    // Salva mensagem no Supabase
    await supabase.from('mensagens').insert([{
      conversa_id: sessionId,
      session_id: sessionId,
      role: 'user',
      content: message,
      metadata: cliente,
      created_at: new Date().toISOString(),
    }]);

    // Processa mensagem usando o ChatAgent (com 7 agentes)
    const resultado = await chatAgent.processarMensagem(message, sessionId);

    // @ts-ignore - agente_executado may exist in resultado
    const agenteExecutado = resultado.agente_executado || resultado.data?.agente_executado;
    // @ts-ignore - tipo may exist in resultado
    const tipo = resultado.tipo || 'chat';

    // Salva resposta do assistente
    if (agenteExecutado) {
      await supabase.from('mensagens').insert([{
        conversa_id: sessionId,
        session_id: sessionId,
        role: 'assistant',
        content: resultado.response,
        metadata: {
          agente: agenteExecutado,
          tipo: tipo,
          acao_sugerida: resultado.acao,
        },
        created_at: new Date().toISOString(),
      }]);
    }

    console.log('[ChatAPI] Resposta gerada por:', agenteExecutado);

    res.json({
      success: true,
      response: resultado.response,
      agente: agenteExecutado,
      tipo: tipo,
      data: resultado.data,
      acao: resultado.acao,
      conversa: chatAgent.getConversa(),
      contexto: chatAgent.getContexto(),
    });
  } catch (error) {
    console.error('[ChatAPI] Erro ao processar mensagem:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
    });
  }
}

export async function getHistoricoChat(req: Request, res: Response) {
  const { sessionId } = req.params;

  try {
    const { data } = await supabase
      .from('mensagens')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    res.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error('[ChatAPI] Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
    });
  }
}

export async function criarConversa(req: Request, res: Response) {
  const { nome, email, telefone } = req.body;

  try {
    const { data } = await supabase
      .from('conversas')
      .insert([{
        session_id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        nome_usuario: nome,
        email,
        telefone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .maybeSingle();

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[ChatAPI] Erro ao criar conversa:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
    });
  }
}

export async function criarLead(req: Request, res: Response) {
  const { nome, email, telefone, interesse, imoveis_interesse, orcamento_min, orcamento_max, observacoes } = req.body;

  try {
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        nome: nome || '',
        email: email || '',
        telefone: telefone || '',
        interesse: interesse || '',
        imoveis_interesse: imoveis_interesse || [],
        orcamento_min: orcamento_min || undefined,
        orcamento_max: orcamento_max || undefined,
        observacoes: JSON.stringify(req.body),
        status: 'novo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .maybeSingle();

    if (error) throw error;

    // Seta lead no ChatAgent
    if (data && data.id) {
      chatAgent.setLead(data.id);
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[ChatAPI] Erro ao criar lead:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
    });
  }
}
