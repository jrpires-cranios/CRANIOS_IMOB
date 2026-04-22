import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

export async function getDashboardStats(tenantId: string, month: number, year: number) {
    // 1. Get Goals for the period
    const { data: metas } = await supabase
        .from('erp_metas')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('mes_referencia', month)
        .eq('ano_referencia', year);

    // 2. Get Performance from View
    const { data: performance } = await supabase
        .from('v_performance_vendas')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('mes', month)
        .eq('ano', year);

    // 3. Get Financial Stats (Revenue received this month)
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const { data: financial } = await supabase
        .from('financeiro_lancamentos')
        .select('valor_pago')
        .eq('tenant_id', tenantId)
        .eq('status', 'pago')
        .gte('data_pagamento', startDate)
        .lte('data_pagamento', endDate);

    const receitaRealizada = (financial || []).reduce((acc, curr) => acc + Number(curr.valor_pago || 0), 0);

    // 4. Calculate VGV Total (Realized)
    const vgvTotal = (performance || []).reduce((acc, curr) => acc + Number(curr.vgv_total || 0), 0);
    const qtdVendas = (performance || []).reduce((acc, curr) => acc + Number(curr.total_vendas || 0), 0);

    // 5. Build Result
    return {
        metas: metas || [],
        performance: performance || [],
        resumo: {
            vgv_total: vgvTotal,
            vendas_qtd: qtdVendas,
            receita_realizada: receitaRealizada,
            periodo: `${month}/${year}`
        }
    };
}

export async function upsertMeta(meta: any) {
    const { data, error } = await supabase
        .from('erp_metas')
        .upsert(meta)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getCorretorRanking(tenantId: string, month: number, year: number) {
    const { data, error } = await supabase
        .from('v_performance_vendas')
        .select('corretor_id, broker_name, vgv_total, total_vendas')
        .eq('tenant_id', tenantId)
        .eq('mes', month)
        .eq('ano', year)
        .order('vgv_total', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getExecutiveBI(tenantId: string) {
    // 1. VSO (Vendas sobre Oferta)
    // Traz total de imoveis ativos e imoveis vendidos no mes atual
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    
    // Imóveis ativos (oferta) - assumindo status 'disponivel'
    const { count: countAtivos } = await supabase
        .from('imoveis')
        .select('*', { count: 'exact', head: true })
        // Se as colunas de finalidade/status forem diferentes, adapte
        .eq('cliente_id', tenantId);
        // .eq('status', 'disponivel')
        
    // Imóveis vendidos no mês (considerando leads com status won no mes)
    const { count: countVendidos } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('cliente_id', tenantId)
        .eq('status', 'won')
        .gte('last_status_change', startOfMonth);

    const ativos = countAtivos || 0;
    const vendidos = countVendidos || 0;
    const vso = ativos > 0 ? ((vendidos / ativos) * 100).toFixed(2) : 0;

    // 2. TML (Tempo Médio de Venda/Locação)
    // Pega leads ganhos nos últimos 90 dias para média
    const noventaDiasAtras = new Date(new Date().setDate(new Date().getDate() - 90)).toISOString();
    const { data: leadsGanhos } = await supabase
        .from('leads')
        .select('created_at, last_status_change')
        .eq('cliente_id', tenantId)
        .eq('status', 'won')
        .gte('last_status_change', noventaDiasAtras);

    let totalDias = 0;
    let tml = 0;
    if (leadsGanhos && leadsGanhos.length > 0) {
        leadsGanhos.forEach(lead => {
            const start = new Date(lead.created_at).getTime();
            const end = new Date(lead.last_status_change || lead.created_at).getTime();
            const dias = (end - start) / (1000 * 60 * 60 * 24);
            totalDias += dias;
        });
        tml = Math.round(totalDias / leadsGanhos.length);
    }

    // 3. Benchmark Corretor
    // Pega corretores que tiveram leads ganhos
    const { data: benchmarkData } = await supabase
        .from('v_performance_vendas')
        .select('corretor_id, broker_name, vgv_total, total_vendas')
        .eq('tenant_id', tenantId)
        .order('vgv_total', { ascending: false });

    return {
        vso: { vendidos, ativos, percentage: vso },
        tml: { dias: tml, base_leads: leadsGanhos?.length || 0 },
        benchmark: benchmarkData || []
    };
}
