import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

// ===================================================================
// TIPOS
// ===================================================================

export interface LancamentoParams {
    tenant_id: string;
    tipo: 'receita' | 'despesa';
    categoria: string;
    status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
    valor: number;
    valor_pago?: number;
    vencimento: string;
    proprietario_id?: string;
    imovel_id?: string;
    lead_id?: string;
    contrato_id?: string;
    is_recorrente?: boolean;
    recorrencia_id?: string;
    parcela_atual?: number;
    total_parcelas?: number;
    descricao?: string;
    observacoes?: string;
}

// ===================================================================
// 1. CRUD de Lançamentos
// ===================================================================

export async function createLancamento(params: LancamentoParams) {
    const { data, error } = await supabase
        .from('financeiro_lancamentos')
        .insert([params])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateLancamento(id: string, params: Partial<LancamentoParams>) {
    const { data, error } = await supabase
        .from('financeiro_lancamentos')
        .update({ ...params, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getLancamentos(tenantId: string, filters: any = {}) {
    let query = supabase
        .from('financeiro_lancamentos')
        .select(`
            *,
            proprietario:proprietarios(nome_completo),
            imovel:imoveis(titulo, endereco)
        `)
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('vencimento', { ascending: true });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.tipo) query = query.eq('tipo', filters.tipo);
    if (filters.inicio) query = query.gte('vencimento', filters.inicio);
    if (filters.fim) query = query.lte('vencimento', filters.fim);
    if (filters.proprietario_id) query = query.eq('proprietario_id', filters.proprietario_id);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

// ===================================================================
// 2. Geração de Recorrência Automática
// ===================================================================

/**
 * Gera parcelas futuras para um contrato (ex: 12 meses de Aluguel + IPTU + Taxa Adm)
 */
export async function gerarRecorrenciaContrato(
    tenantId: string,
    contratoId: string,
    config: {
        imovel_id: string;
        proprietario_id: string;
        data_inicio: string;
        meses: number;
        valor_aluguel: number;
        valor_iptu?: number;
        valor_seguro?: number;
        valor_taxa_lixo?: number;
        taxa_adm_pct?: number;
    }
) {
    const recorrenciaId = crypto.randomUUID();
    const lancamentos: LancamentoParams[] = [];

    for (let i = 1; i <= config.meses; i++) {
        const dataVencimento = new Date(config.data_inicio);
        dataVencimento.setMonth(dataVencimento.getMonth() + i - 1);
        const vencimentoStr = dataVencimento.toISOString().split('T')[0];

        // 1. Receita: Aluguel (Inquilino -> Imobiliária)
        lancamentos.push({
            tenant_id: tenantId,
            tipo: 'receita',
            categoria: 'Aluguel',
            status: 'pendente',
            valor: config.valor_aluguel,
            vencimento: vencimentoStr,
            imovel_id: config.imovel_id,
            proprietario_id: config.proprietario_id,
            contrato_id: contratoId,
            is_recorrente: true,
            recorrencia_id: recorrenciaId,
            parcela_atual: i,
            total_parcelas: config.meses,
            descricao: `Aluguel - Parcela ${i}/${config.meses}`
        });

        // 2. Receitas: Taxas (IPTU, Seguro, etc)
        if (config.valor_iptu) {
            lancamentos.push({
                tenant_id: tenantId, tipo: 'receita', categoria: 'IPTU', status: 'pendente',
                valor: config.valor_iptu, vencimento: vencimentoStr, imovel_id: config.imovel_id,
                proprietario_id: config.proprietario_id, contrato_id: contratoId,
                is_recorrente: true, recorrencia_id: recorrenciaId, parcela_atual: i, total_parcelas: config.meses
            });
        }

        // 3. Despesa: Taxa Administrativa (Imobiliária retém do proprietário)
        if (config.taxa_adm_pct) {
            const valorTaxa = (config.valor_aluguel * config.taxa_adm_pct) / 100;
            lancamentos.push({
                tenant_id: tenantId,
                tipo: 'despesa',
                categoria: 'Taxa Administrativa',
                status: 'pendente',
                valor: valorTaxa,
                vencimento: vencimentoStr,
                imovel_id: config.imovel_id,
                proprietario_id: config.proprietario_id,
                contrato_id: contratoId,
                is_recorrente: true,
                recorrencia_id: recorrenciaId,
                parcela_atual: i,
                total_parcelas: config.meses,
                descricao: `Comissão Imobiliária - Parcela ${i}/${config.meses}`
            });
        }
    }

    const { data, error } = await supabase
        .from('financeiro_lancamentos')
        .insert(lancamentos)
        .select();

    if (error) throw error;
    return data;
}

// ===================================================================
// 3. Resumos e BI
// ===================================================================

export async function getFluxoCaixaMensal(tenantId: string) {
    const { data, error } = await supabase
        .from('v_fluxo_caixa_mensal')
        .select('*')
        .eq('tenant_id', tenantId);

    if (error) throw error;
    return data;
}

export async function getResumoDashboard(tenantId: string) {
    // Busca lançamentos pendentes do mês atual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    const fimMes = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 0);

    const { data, error } = await supabase
        .from('financeiro_lancamentos')
        .select('tipo, valor, status')
        .eq('tenant_id', tenantId)
        .gte('vencimento', inicioMes.toISOString().split('T')[0])
        .lte('vencimento', fimMes.toISOString().split('T')[0]);

    if (error) throw error;

    const resumo = {
        receita_prevista: 0,
        receita_realizada: 0,
        despesa_prevista: 0,
        despesa_realizada: 0,
        atrasados: 0
    };

    data.forEach(l => {
        if (l.tipo === 'receita') {
            resumo.receita_prevista += Number(l.valor);
            if (l.status === 'pago') resumo.receita_realizada += Number(l.valor);
        } else {
            resumo.despesa_prevista += Number(l.valor);
            if (l.status === 'pago') resumo.despesa_realizada += Number(l.valor);
        }
        if (l.status === 'atrasado') resumo.atrasados += 1;
    });

    return resumo;
}
