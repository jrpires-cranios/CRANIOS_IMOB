/**
 * Tipos compartilhados do Crânios IMOB
 */

export interface Imovel {
    id: string;
    titulo: string;
    descricao?: string;
    tipo: 'casa' | 'apartamento' | 'terreno' | 'comercial' | string;
    finalidade: 'venda' | 'locacao' | 'ambos' | string;
    cidade: string;
    estado?: string;
    bairro?: string;
    endereco?: string;
    cep?: string;
    latitude?: number;
    longitude?: number;
    quartos?: number;
    suites?: number;
    banheiros?: number;
    vagas_garagem?: number;
    area_total?: number;
    area_construida?: number;
    preco_venda?: number;
    preco_locacao?: number;
    condominio?: number;
    iptu?: number;
    disponivel: boolean;
    destaque?: boolean;
    fotos?: string[];
    foto_capa?: string;
    video_url?: string;
    caracteristicas?: string[];
    empreendimento_id?: string;
    cliente_id?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
}

export interface Lead {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
    whatsapp?: string;
    origem?: string;
    interesse?: string;
    imoveis_interesse?: string[];
    orcamento_min?: number;
    orcamento_max?: number;
    quartos_desejados?: number;
    cidade_desejada?: string;
    tipo_interesse?: string;
    finalidade?: string;
    observacoes?: string;
    status?: string;
    temperatura?: 'frio' | 'morno' | 'quente' | string;
    corretor_id?: string;
    cliente_id?: string;
    empreendimento_nome?: string;
    empreendimento_id?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
}

export interface Conversa {
    id: string;
    lead_id: string;
    session_id: string;
    mensagens: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp?: string;
    }>;
    agente_atual?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
}

export interface CorretorConfig {
    id?: string;
    corretor_id: string;
    peso_roleta: number;
    status: 'ativo' | 'ausente' | 'pausado' | 'ferias';
    ferias_inicio?: string | null;
    ferias_fim?: string | null;
    iqc: number;
    iqc_override: boolean;
    iqc_motivo?: string;
    tipos_imovel?: string[];
    modalidades?: string[];
    valor_min?: number;
    valor_max?: number;
    bairros?: string[];
    lancamentos?: string[];
    limite_leads_dia?: number;
    sla_config?: any;
    created_at?: string;
    updated_at?: string;
    // joined fields
    corretores?: {
        nome: string;
        email: string;
        telefone: string;
    };
}

export interface RouletteState {
    id?: string;
    corretor_id: string;
    creditos: number;
    total_recebidos: number;
    ultimo_lead_at?: string;
    updated_at?: string;
}

export interface LeadDistributionLog {
    id?: string;
    lead_id: string;
    corretor_id?: string | null;
    temperatura?: string;
    score_dificuldade?: number;
    motivo_escolha?: string;
    corretores_elegiveis?: string[];
    status?: string;
    atribuido_at?: string;
}

export interface LeadSlaEvent {
    id?: string;
    lead_id: string;
    corretor_id?: string | null;
    evento: string;
    sla_limite_min?: number;
    realizado_em?: string | null;
    sla_status?: 'ok' | 'atencao' | 'violado';
    created_at?: string;
}
