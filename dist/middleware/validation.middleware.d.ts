import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    nome: z.ZodString;
    tenant_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    nome: string;
    tenant_id?: string | undefined;
}, {
    email: string;
    password: string;
    nome: string;
    tenant_id?: string | undefined;
}>;
export declare const enderecoSchema: z.ZodObject<{
    logradouro: z.ZodString;
    numero: z.ZodString;
    complemento: z.ZodOptional<z.ZodString>;
    bairro: z.ZodString;
    cidade: z.ZodString;
    estado: z.ZodString;
    cep: z.ZodString;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    cidade: string;
    bairro: string;
    estado: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
}, {
    cidade: string;
    bairro: string;
    estado: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
}>;
export declare const createImovelSchema: z.ZodObject<{
    titulo: z.ZodString;
    descricao: z.ZodString;
    tipo: z.ZodEnum<["apartamento", "casa", "comercial", "terreno", "rural"]>;
    finalidade: z.ZodEnum<["venda", "aluguel", "temporada"]>;
    preco: z.ZodNumber;
    area_total: z.ZodOptional<z.ZodNumber>;
    area_construida: z.ZodOptional<z.ZodNumber>;
    quartos: z.ZodOptional<z.ZodNumber>;
    banheiros: z.ZodOptional<z.ZodNumber>;
    vagas: z.ZodOptional<z.ZodNumber>;
    endereco: z.ZodObject<{
        logradouro: z.ZodString;
        numero: z.ZodString;
        complemento: z.ZodOptional<z.ZodString>;
        bairro: z.ZodString;
        cidade: z.ZodString;
        estado: z.ZodString;
        cep: z.ZodString;
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        cidade: string;
        bairro: string;
        estado: string;
        cep: string;
        logradouro: string;
        numero: string;
        complemento?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    }, {
        cidade: string;
        bairro: string;
        estado: string;
        cep: string;
        logradouro: string;
        numero: string;
        complemento?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    }>;
    caracteristicas: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    imagens: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    status: z.ZodDefault<z.ZodEnum<["ativo", "inativo", "vendido", "alugado"]>>;
    destaque: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    destaque: boolean;
    tipo: "casa" | "apartamento" | "terreno" | "comercial" | "rural";
    finalidade: "venda" | "aluguel" | "temporada";
    titulo: string;
    descricao: string;
    endereco: {
        cidade: string;
        bairro: string;
        estado: string;
        cep: string;
        logradouro: string;
        numero: string;
        complemento?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    };
    status: "ativo" | "inativo" | "vendido" | "alugado";
    preco: number;
    quartos?: number | undefined;
    area_total?: number | undefined;
    area_construida?: number | undefined;
    banheiros?: number | undefined;
    caracteristicas?: string[] | undefined;
    vagas?: number | undefined;
    imagens?: string[] | undefined;
}, {
    tipo: "casa" | "apartamento" | "terreno" | "comercial" | "rural";
    finalidade: "venda" | "aluguel" | "temporada";
    titulo: string;
    descricao: string;
    endereco: {
        cidade: string;
        bairro: string;
        estado: string;
        cep: string;
        logradouro: string;
        numero: string;
        complemento?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    };
    preco: number;
    destaque?: boolean | undefined;
    quartos?: number | undefined;
    area_total?: number | undefined;
    area_construida?: number | undefined;
    banheiros?: number | undefined;
    caracteristicas?: string[] | undefined;
    status?: "ativo" | "inativo" | "vendido" | "alugado" | undefined;
    vagas?: number | undefined;
    imagens?: string[] | undefined;
}>;
export declare const updateImovelSchema: z.ZodObject<{
    titulo: z.ZodOptional<z.ZodString>;
    descricao: z.ZodOptional<z.ZodString>;
    tipo: z.ZodOptional<z.ZodEnum<["apartamento", "casa", "comercial", "terreno", "rural"]>>;
    finalidade: z.ZodOptional<z.ZodEnum<["venda", "aluguel", "temporada"]>>;
    preco: z.ZodOptional<z.ZodNumber>;
    area_total: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    area_construida: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    quartos: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    banheiros: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    vagas: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    endereco: z.ZodOptional<z.ZodObject<{
        logradouro: z.ZodString;
        numero: z.ZodString;
        complemento: z.ZodOptional<z.ZodString>;
        bairro: z.ZodString;
        cidade: z.ZodString;
        estado: z.ZodString;
        cep: z.ZodString;
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        cidade: string;
        bairro: string;
        estado: string;
        cep: string;
        logradouro: string;
        numero: string;
        complemento?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    }, {
        cidade: string;
        bairro: string;
        estado: string;
        cep: string;
        logradouro: string;
        numero: string;
        complemento?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    }>>;
    caracteristicas: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    imagens: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["ativo", "inativo", "vendido", "alugado"]>>>;
    destaque: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    destaque?: boolean | undefined;
    tipo?: "casa" | "apartamento" | "terreno" | "comercial" | "rural" | undefined;
    finalidade?: "venda" | "aluguel" | "temporada" | undefined;
    quartos?: number | undefined;
    titulo?: string | undefined;
    descricao?: string | undefined;
    endereco?: {
        cidade: string;
        bairro: string;
        estado: string;
        cep: string;
        logradouro: string;
        numero: string;
        complemento?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    } | undefined;
    area_total?: number | undefined;
    area_construida?: number | undefined;
    banheiros?: number | undefined;
    caracteristicas?: string[] | undefined;
    status?: "ativo" | "inativo" | "vendido" | "alugado" | undefined;
    preco?: number | undefined;
    vagas?: number | undefined;
    imagens?: string[] | undefined;
}, {
    destaque?: boolean | undefined;
    tipo?: "casa" | "apartamento" | "terreno" | "comercial" | "rural" | undefined;
    finalidade?: "venda" | "aluguel" | "temporada" | undefined;
    quartos?: number | undefined;
    titulo?: string | undefined;
    descricao?: string | undefined;
    endereco?: {
        cidade: string;
        bairro: string;
        estado: string;
        cep: string;
        logradouro: string;
        numero: string;
        complemento?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    } | undefined;
    area_total?: number | undefined;
    area_construida?: number | undefined;
    banheiros?: number | undefined;
    caracteristicas?: string[] | undefined;
    status?: "ativo" | "inativo" | "vendido" | "alugado" | undefined;
    preco?: number | undefined;
    vagas?: number | undefined;
    imagens?: string[] | undefined;
}>;
export declare const searchImoveisSchema: z.ZodObject<{
    tipo: z.ZodOptional<z.ZodEnum<["apartamento", "casa", "comercial", "terreno", "rural"]>>;
    finalidade: z.ZodOptional<z.ZodEnum<["venda", "aluguel", "temporada"]>>;
    precoMin: z.ZodOptional<z.ZodNumber>;
    precoMax: z.ZodOptional<z.ZodNumber>;
    quartos: z.ZodOptional<z.ZodNumber>;
    bairro: z.ZodOptional<z.ZodString>;
    cidade: z.ZodOptional<z.ZodString>;
    estado: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    tipo?: "casa" | "apartamento" | "terreno" | "comercial" | "rural" | undefined;
    finalidade?: "venda" | "aluguel" | "temporada" | undefined;
    cidade?: string | undefined;
    quartos?: number | undefined;
    bairro?: string | undefined;
    estado?: string | undefined;
    precoMin?: number | undefined;
    precoMax?: number | undefined;
}, {
    tipo?: "casa" | "apartamento" | "terreno" | "comercial" | "rural" | undefined;
    finalidade?: "venda" | "aluguel" | "temporada" | undefined;
    cidade?: string | undefined;
    quartos?: number | undefined;
    bairro?: string | undefined;
    estado?: string | undefined;
    limit?: number | undefined;
    precoMin?: number | undefined;
    precoMax?: number | undefined;
    page?: number | undefined;
}>;
export declare const createLeadSchema: z.ZodObject<{
    nome: z.ZodString;
    email: z.ZodString;
    telefone: z.ZodOptional<z.ZodString>;
    origem: z.ZodDefault<z.ZodEnum<["site", "whatsapp", "indicacao", "portais", "outro"]>>;
    imovel_interesse_id: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["novo", "contato", "qualificado", "proposta", "fechado", "perdido"]>>;
    notas: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    nome: string;
    status: "novo" | "qualificado" | "contato" | "proposta" | "fechado" | "perdido";
    origem: "site" | "whatsapp" | "indicacao" | "portais" | "outro";
    telefone?: string | undefined;
    imovel_interesse_id?: string | undefined;
    notas?: string | undefined;
}, {
    email: string;
    nome: string;
    status?: "novo" | "qualificado" | "contato" | "proposta" | "fechado" | "perdido" | undefined;
    telefone?: string | undefined;
    origem?: "site" | "whatsapp" | "indicacao" | "portais" | "outro" | undefined;
    imovel_interesse_id?: string | undefined;
    notas?: string | undefined;
}>;
export declare const updateLeadSchema: z.ZodObject<{
    nome: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    telefone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    origem: z.ZodOptional<z.ZodDefault<z.ZodEnum<["site", "whatsapp", "indicacao", "portais", "outro"]>>>;
    imovel_interesse_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["novo", "contato", "qualificado", "proposta", "fechado", "perdido"]>>>;
    notas: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    nome?: string | undefined;
    status?: "novo" | "qualificado" | "contato" | "proposta" | "fechado" | "perdido" | undefined;
    telefone?: string | undefined;
    origem?: "site" | "whatsapp" | "indicacao" | "portais" | "outro" | undefined;
    imovel_interesse_id?: string | undefined;
    notas?: string | undefined;
}, {
    email?: string | undefined;
    nome?: string | undefined;
    status?: "novo" | "qualificado" | "contato" | "proposta" | "fechado" | "perdido" | undefined;
    telefone?: string | undefined;
    origem?: "site" | "whatsapp" | "indicacao" | "portais" | "outro" | undefined;
    imovel_interesse_id?: string | undefined;
    notas?: string | undefined;
}>;
export declare const chatMessageSchema: z.ZodObject<{
    sessionId: z.ZodString;
    message: z.ZodString;
    leadId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    message: string;
    leadId?: string | undefined;
}, {
    sessionId: string;
    message: string;
    leadId?: string | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    limit?: number | undefined;
    page?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateImovelInput = z.infer<typeof createImovelSchema>;
export type UpdateImovelInput = z.infer<typeof updateImovelSchema>;
export type SearchImoveisInput = z.infer<typeof searchImoveisSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
//# sourceMappingURL=validation.middleware.d.ts.map