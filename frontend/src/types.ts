/**
 * Types compartilhados para Crânios IMOB
 */

// Imovel types
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
  valor_condominio?: number;
  valor_iptu?: number;
  caracteristicas?: string[];
  fotos?: string[];
  foto_principal?: string;
  is_launch?: boolean;
  launch_developer?: string;
  book_pdf_url?: string;
  bucket_book_url?: string;
  status?: string;
  disponivel: boolean;
  destaque: boolean;
  // Propriedades adicionais para agentes
  proprietario?: string;
  cpf_proprietario?: string;
  email_proprietario?: string;
  telefone_proprietario?: string;
  matricula?: string;
  motivo?: string;
  interesse_principal?: string;
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
  valor_condominio?: number;
  valor_iptu?: number;
  caracteristicas?: string[];
  fotos?: string[];
  foto_principal?: string;
}

// CreateLeadDTO - for creating new leads
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

// Agendamento types
export interface Agendamento {
  id: string;
  lead_id: string;
  imovel_id: string;
  data: string;
  horario: string;
  tipo: 'visita' | 'contato';
  status: 'agendado' | 'realizado' | 'cancelado' | 'adiado';
  observacoes?: string;
  motivo_cancelamento?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAgendamentoDTO {
  lead_id: string;
  imovel_id: string;
  data: string;
  horario: string;
  tipo?: 'visita' | 'contato';
  observacoes?: string;
}

// User/Auth types
export interface User {
  id: string;
  email: string;
  nome: string;
  role: 'admin' | 'agent' | 'viewer';
  created_at: string;
  updated_at: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Chat types
export interface Mensagem {
  id: string;
  conversa_id?: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  tipo?: 'text' | 'imagem' | 'documento';
  timestamp: string;
}

export interface AgentAction {
  tipo: 'BUSCA' | 'QUALIFICACAO' | 'AGENDAMENTO' | 'SAUDACAO';
  params?: any;
  resultado?: any;
  confianca?: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
}

// Agente Response
export interface AgenteResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    agente_executado: string;
    tempo_execucao_ms?: number;
    confianca?: number;
  };
}

// Requisições do Chat para Agentes
export interface RequisicaoChat {
  mensagem: string;
  sessionId: string;
  contexto?: {
    cliente?: Partial<Lead>;
    imoveis_vistos?: string[];
    lead_atual?: string;
  };
}

export interface RespostaChat {
  response: string;
  data?: any;
  tipo?: 'imoveis_encontrados' | 'recomendacoes' | 'agendamento' | 'saudacao' | 'error';
  acao_sugerida?: {
    tipo: 'agendar_visita' | 'ver_mais_imoveis' | 'refinar_busca';
    parametros?: any;
  };
}

// Tipos de Intenção
export type IntencaoChat =
  | 'BUSCA'
  | 'QUALIFICACAO'
  | 'AGENDAMENTO'
  | 'SAUDACAO'
  | 'GERAL';

export interface AnaliseIntencao {
  tipo: IntencaoChat;
  confianca: number; // 0.0 - 1.0
  params?: any;
  motivacao?: string;
}

// Tipos de Agentes
export interface AgenteInfo {
  nome: string;
  tipo: 'busca' | 'qualificacao' | 'agendamento';
  descricao: string;
  ativo: boolean;
  ultimo_execucao?: string;
}

// Error types
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  agente_executando?: string;
}

// Contrato types
export interface Contrato {
  id: string;
  lead_id: string;
  imovel_id: string;
  valor_imovel: number;
  tipo_financiamento: 'caixa' | 'bradesco' | 'itau' | 'santander' | 'bancoDoBrasil' | 'particular';
  valor_entrada?: number;
  valor_financiado?: number;
  texto: string;
  plataforma: 'signnow' | 'docusign' | 'manual';
  documento_id?: string;
  envelope_id?: string;
  link_assinatura?: string;
  status: 'pendente_assinatura' | 'enviado_assinatura' | 'em_assinatura' | 'assinado' | 'cancelado' | 'concluido';
  tipo: 'compra_venda' | 'locacao' | 'reserva';
  data_envio?: string;
  data_assinatura?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Chat Context types
export interface ChatRequest {
  mensagem: string;
  message?: string; // Alias for compatibility
  sessionId: string;
  leadId?: string;
  cliente?: any;
}

// Unified Lead interface with all properties
export interface Lead {
  id?: string;
  conversa_id?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  interesse?: string;
  interesse_principal?: string;
  imoveis_interesse?: string[];
  orcamento?: number;
  orcamento_min?: number;
  orcamento_max?: number;
  quartos?: number;
  cidade?: string;
  tipo_interesse?: 'casa' | 'apartamento' | 'terreno';
  finalidade?: 'venda' | 'locacao';
  observacoes?: string;
  status?: 'novo' | 'em_atendimento' | 'qualificado' | 'convertido' | 'agendamento' | 'cancelado' | 'perdido';
  fonte?: string;
  created_at?: string;
  updated_at?: string;
  ultimo_followup?: string;
}

export interface ChatContext {
  cliente?: {
    nome?: string;
    email?: string;
    telefone?: string;
    orcamento?: number;
    quartos?: number;
    cidade?: string;
    tipo_interesse?: 'casa' | 'apartamento' | 'terreno';
    finalidade?: 'venda' | 'locacao';
  };
  imoveisVistos: string[];
  leadId?: string;
  conversaId?: string;
  ultimaInteracao?: string;
}
