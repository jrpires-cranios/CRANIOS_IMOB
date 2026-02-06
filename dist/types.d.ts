export interface Imovel {
    id: string;
    tipo: 'casa' | 'apartamento' | 'terreno' | 'comercial';
    finalidade: 'venda' | 'locacao' | 'ambos';
    titulo: string;
    descricao?: string;
    endereco: string;
    bairro?: string;
    cidade: string;
    estado: string;
    cep?: string;
    preco_venda?: number;
    preco_locacao?: number;
    area_total?: number;
    area_construida?: number;
    quartos?: number;
    suites?: number;
    banheiros?: number;
    vagas_garagem?: number;
    caracteristicas?: string[];
    fotos?: string[];
    foto_principal?: string;
    disponivel: boolean;
    destaque: boolean;
    created_at: string;
    updated_at: string;
}
export interface CreateImovelDTO {
    tipo: string;
    finalidade: string;
    titulo: string;
    descricao?: string;
    endereco: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    preco_venda?: number;
    preco_locacao?: number;
    area_total?: number;
    area_construida?: number;
    quartos?: number;
    suites?: number;
    banheiros?: number;
    vagas_garagem?: number;
    caracteristicas?: string[];
    fotos?: string[];
    foto_principal?: string;
}
export interface Lead {
    id: string;
    conversa_id?: string;
    nome?: string;
    email?: string;
    telefone?: string;
    interesse?: string;
    imoveis_interesse?: string[];
    orcamento_min?: number;
    orcamento_max?: number;
    observacoes?: string;
    status: 'novo' | 'em_atendimento' | 'qualificado' | 'convertido';
    created_at: string;
    updated_at: string;
}
export interface CreateLeadDTO {
    nome?: string;
    email?: string;
    telefone?: string;
    interesse?: string;
    imoveis_interesse?: string[];
    orcamento_min?: number;
    orcamento_max?: number;
    observacoes?: string;
}
export interface User {
    id: string;
    email: string;
    nome: string;
    role: 'admin' | 'agent' | 'viewer';
}
export interface AuthPayload {
    userId: string;
    email: string;
    role: string;
}
export interface AuthResponse {
    user: User;
    token: string;
}
export interface Conversa {
    id: string;
    session_id: string;
    nome_usuario?: string;
    email?: string;
    telefone?: string;
    created_at: string;
    updated_at: string;
}
export interface Mensagem {
    id: string;
    conversa_id?: string;
    session_id: string;
    role: 'user' | 'assistant';
    content: string;
    metadata?: Record<string, unknown>;
    created_at: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface AuthRequest extends Express.Request {
    user?: AuthPayload;
}
export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
//# sourceMappingURL=types.d.ts.map