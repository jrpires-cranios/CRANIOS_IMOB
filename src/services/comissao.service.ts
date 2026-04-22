import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

// ===================================================================
// TIPOS
// ===================================================================

export interface ComissaoParams {
    tenant_id: string;
    corretor_id: string;
    imovel_id: string;
    referencia_tipo: 'venda' | 'locacao' | 'mensalidade';
    referencia_id: string;
    valor_base: number;
    percentual?: number;
    valor_comissao: number;
    status?: 'pendente' | 'disponivel' | 'pago' | 'cancelado';
    data_previsao?: string;
    observacoes?: string;
}

// ===================================================================
// 1. Geração de Comissões
// ===================================================================

/**
 * Registra uma comissão para um corretor
 */
export async function registrarComissao(params: ComissaoParams) {
    const { data, error } = await supabase
        .from('comissoes')
        .insert([{
            ...params,
            status: params.status || 'pendente',
            updated_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) {
        console.error('[ComissaoService] Erro ao registrar comissão:', error);
        throw error;
    }
    return data;
}

/**
 * Calcula e gera comissão de venda baseada no fechamento
 */
export async function processarComissaoVenda(saleClosing: any) {
    // A tabela sale_closings já tem commission_broker_value
    if (!saleClosing.commission_broker_value || !saleClosing.corretor_id) return null;

    return registrarComissao({
        tenant_id: saleClosing.tenant_id || 'rbhkwmesmvytqdfuwcie',
        corretor_id: saleClosing.corretor_id,
        imovel_id: saleClosing.property_id,
        referencia_tipo: 'venda',
        referencia_id: saleClosing.id,
        valor_base: saleClosing.closing_value,
        percentual: saleClosing.commission_pct,
        valor_comissao: saleClosing.commission_broker_value,
        status: 'pendente', // Só fica disponível após quitação total ou conforme regra
        observacoes: `Comissão de venda - Imóvel ${saleClosing.property_id}`
    });
}

/**
 * Calcula e gera comissão de intermediação de locação (primeiro aluguel)
 */
export async function processarComissaoLocacaoIntermediacao(lease: any, corretorId: string) {
    // Geralmente 50% a 100% do primeiro aluguel para o corretor responsável
    // Por enquanto, vamos assumir uma regra padrão de 50% do primeiro aluguel
    const valorComissao = Number(lease.monthly_rent || 0) * 0.5;

    return registrarComissao({
        tenant_id: lease.tenant_id || 'rbhkwmesmvytqdfuwcie',
        corretor_id: corretorId,
        imovel_id: lease.property_id,
        referencia_tipo: 'locacao',
        referencia_id: lease.id,
        valor_base: lease.monthly_rent,
        percentual: 50,
        valor_comissao: valorComissao,
        status: 'pendente',
        observacoes: 'Comissão de intermediação de locação'
    });
}

// ===================================================================
// 2. Consulta e Gestão
// ===================================================================

export async function getComissoes(tenantId: string, filters: any = {}) {
    let query = supabase
        .from('comissoes')
        .select(`
            *,
            corretor:corretores(nome, email, creci),
            imovel:imoveis(titulo, endereco)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.corretor_id) query = query.eq('corretor_id', filters.corretor_id);
    if (filters.referencia_tipo) query = query.eq('referencia_tipo', filters.referencia_tipo);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function liquidarComissao(comissaoId: string) {
    const { data, error } = await supabase
        .from('comissoes')
        .update({
            status: 'pago',
            data_pagamento: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', comissaoId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getResumoComissoes(tenantId: string, corretorId?: string) {
    let query = supabase
        .from('comissoes')
        .select('valor_comissao, status')
        .eq('tenant_id', tenantId);

    if (corretorId) query = query.eq('corretor_id', corretorId);

    const { data, error } = await query;
    if (error) throw error;

    const resumo = {
        pendente: 0,
        disponivel: 0,
        pago: 0,
        total_gerado: 0
    };

    data?.forEach(c => {
        const valor = Number(c.valor_comissao);
        resumo.total_gerado += valor;
        if (c.status === 'pendente') resumo.pendente += valor;
        if (c.status === 'disponivel') resumo.disponivel += valor;
        if (c.status === 'pago') resumo.pago += valor;
    });

    return resumo;
}
