"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.chatMessageSchema = exports.updateLeadSchema = exports.createLeadSchema = exports.searchImoveisSchema = exports.updateImovelSchema = exports.createImovelSchema = exports.enderecoSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
// ============================================================================
// Auth Schemas
// ============================================================================
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    nome: zod_1.z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    tenant_id: zod_1.z.string().uuid('Tenant ID inválido').optional(),
});
// ============================================================================
// Imoveis Schemas
// ============================================================================
exports.enderecoSchema = zod_1.z.object({
    logradouro: zod_1.z.string().min(1, 'Logradouro é obrigatório'),
    numero: zod_1.z.string().min(1, 'Número é obrigatório'),
    complemento: zod_1.z.string().optional(),
    bairro: zod_1.z.string().min(1, 'Bairro é obrigatório'),
    cidade: zod_1.z.string().min(1, 'Cidade é obrigatória'),
    estado: zod_1.z.string().length(2, 'Estado deve ter 2 caracteres'),
    cep: zod_1.z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
});
exports.createImovelSchema = zod_1.z.object({
    titulo: zod_1.z.string().min(5, 'Título deve ter no mínimo 5 caracteres'),
    descricao: zod_1.z.string().min(20, 'Descrição deve ter no mínimo 20 caracteres'),
    tipo: zod_1.z.enum(['apartamento', 'casa', 'comercial', 'terreno', 'rural']),
    finalidade: zod_1.z.enum(['venda', 'aluguel', 'temporada']),
    preco: zod_1.z.number().positive('Preço deve ser positivo'),
    area_total: zod_1.z.number().positive().optional(),
    area_construida: zod_1.z.number().positive().optional(),
    quartos: zod_1.z.number().int().min(0).optional(),
    banheiros: zod_1.z.number().int().min(0).optional(),
    vagas: zod_1.z.number().int().min(0).optional(),
    endereco: exports.enderecoSchema,
    caracteristicas: zod_1.z.array(zod_1.z.string()).optional(),
    imagens: zod_1.z.array(zod_1.z.string().url()).optional(),
    status: zod_1.z.enum(['ativo', 'inativo', 'vendido', 'alugado']).default('ativo'),
    destaque: zod_1.z.boolean().default(false),
});
exports.updateImovelSchema = exports.createImovelSchema.partial();
exports.searchImoveisSchema = zod_1.z.object({
    tipo: zod_1.z.enum(['apartamento', 'casa', 'comercial', 'terreno', 'rural']).optional(),
    finalidade: zod_1.z.enum(['venda', 'aluguel', 'temporada']).optional(),
    precoMin: zod_1.z.coerce.number().positive().optional(),
    precoMax: zod_1.z.coerce.number().positive().optional(),
    quartos: zod_1.z.coerce.number().int().min(0).optional(),
    bairro: zod_1.z.string().optional(),
    cidade: zod_1.z.string().optional(),
    estado: zod_1.z.string().length(2).optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
// ============================================================================
// Leads Schemas
// ============================================================================
exports.createLeadSchema = zod_1.z.object({
    nome: zod_1.z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: zod_1.z.string().email('Email inválido'),
    telefone: zod_1.z.string().optional(),
    origem: zod_1.z.enum(['site', 'whatsapp', 'indicacao', 'portais', 'outro']).default('site'),
    imovel_interesse_id: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(['novo', 'contato', 'qualificado', 'proposta', 'fechado', 'perdido']).default('novo'),
    notas: zod_1.z.string().optional(),
});
exports.updateLeadSchema = exports.createLeadSchema.partial();
// ============================================================================
// Chat Schemas
// ============================================================================
exports.chatMessageSchema = zod_1.z.object({
    sessionId: zod_1.z.string().min(1, 'Session ID é obrigatório'),
    message: zod_1.z.string().min(1, 'Mensagem não pode estar vazia'),
    leadId: zod_1.z.string().uuid().optional(),
});
// ============================================================================
// Pagination Schema
// ============================================================================
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
//# sourceMappingURL=validation.middleware.js.map