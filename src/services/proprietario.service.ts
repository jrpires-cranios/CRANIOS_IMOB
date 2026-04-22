import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

// ===================================================================
// TIPOS
// ===================================================================

export interface ProprietarioParams {
    tenant_id: string;
    tipo_pessoa: 'PF' | 'PJ';
    nome_completo: string;
    cpf_cnpj: string;
    email?: string;
    telefone?: string;
    whatsapp?: string;
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    observacoes?: string;
}

export interface BankAccountParams {
    tenant_id: string;
    proprietario_id: string;
    banco: string;
    agencia?: string;
    conta?: string;
    tipo_conta?: 'corrente' | 'poupanca';
    chave_pix?: string;
    tipo_pix?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
    principal?: boolean;
}

// ===================================================================
// 1. Gestão de Proprietários
// ===================================================================

export async function createProprietario(params: ProprietarioParams) {
    const { data, error } = await supabase
        .from('proprietarios')
        .insert([params])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateProprietario(id: string, params: Partial<ProprietarioParams>) {
    const { data, error } = await supabase
        .from('proprietarios')
        .update(params)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getProprietarios(tenantId: string, search?: string) {
    let query = supabase
        .from('proprietarios')
        .select('*')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('nome_completo', { ascending: true });

    if (search) {
        query = query.or(`nome_completo.ilike.%${search}%,cpf_cnpj.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function getProprietarioById(id: string) {
    const { data, error } = await supabase
        .from('proprietarios')
        .select(`
            *,
            contas:proprietario_contas_bancarias(*),
            imoveis:imoveis(id, titulo, finalidade, status, preco_locacao, preco_venda, endereco)
        `)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

// ===================================================================
// 2. Gestão de Contas Bancárias
// ===================================================================

export async function saveBankAccount(params: BankAccountParams) {
    // Se for principal, desmarca as outras
    if (params.principal) {
        await supabase
            .from('proprietario_contas_bancarias')
            .update({ principal: false })
            .eq('proprietario_id', params.proprietario_id);
    }

    const { data, error } = await supabase
        .from('proprietario_contas_bancarias')
        .upsert(params)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteBankAccount(id: string) {
    const { error } = await supabase
        .from('proprietario_contas_bancarias')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

// ===================================================================
// 3. Vínculo de Imóveis
// ===================================================================

export async function linkPropertyToProprietario(propertyId: string, proprietarioId: string) {
    const { data, error } = await supabase
        .from('imoveis')
        .update({ proprietario_id: proprietarioId })
        .eq('id', propertyId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ===================================================================
// 4. Portfólio / Métricas
// ===================================================================

export async function getProprietarioPortfolio(id: string) {
    const { data, error } = await supabase
        .from('mv_portfolio_proprietario')
        .select('*')
        .eq('proprietario_id', id)
        .single();

    // Fallback se a view materializada não estiver atualizada ou não houver dados
    if (error || !data) {
        console.warn('[ProprietarioService] View mv_portfolio_proprietario sem dados para:', id);
        return {
            proprietario_id: id,
            qtd_disponiveis: 0,
            qtd_locados: 0,
            qtd_vendidos: 0,
            receita_mensal: 0
        };
    }
    return data;
}

export async function refreshPortfolioView() {
    // Supabase JS não tem comando nativo REFRESH MATERIALIZED VIEW
    // Precisamos de RPC ou SQL direto via API se possível.
    // Como estamos no backend, podemos usar o supabase-mcp se fosse uma migration, 
    // mas aqui é código de runtime. Vou deixar anotado para usar via SQL direto se necessário.
    const { error } = await supabase.rpc('refresh_portfolio_view');
    if (error) {
        console.error('[ProprietarioService] Erro ao atualizar view:', error);
    }
}
