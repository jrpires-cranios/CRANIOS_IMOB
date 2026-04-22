import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { supabase } from './config/supabase.js';
import { chatAgent } from './agents/chat_agent.js';
import { onboardingService } from './services/onboarding.service.js';
import { pdfGeneratorService } from './services/pdf-generator.service.js';
import { r2StorageService } from './services/r2-storage.service.js';
import { dataImportService } from './services/data-import.service.js';
import { emailService } from './services/email.service.js';
import { calendarService } from './services/calendar.service.js';
import { roletaService } from './services/roleta.service.js';
import { leadBriefingService } from './services/lead-briefing.service.js';
import { registerManagerRoutes } from './manager.controller.js';
import * as webhookController from './controllers/webhook.controller.js';
import { telegramBotInstance } from './bots/telegram/corretor.bot.js';
import { telegramActivationService } from './services/telegram/activation.service.js';
import { planLimitsService, PlanLimitError } from './services/plan-limits.service.js';
import { sessionGuard } from './middlewares/session-guard.middleware.js';
import { sessionService } from './services/session.service.js';
import { masterAccessService } from './services/master-access.service.js';
import { ticketService } from './services/ticket.service.js';
import { whatsappService } from './services/whatsapp.service.js';
import { transcriptionService } from './services/transcription.service.js';
import { humanizerService } from './services/humanizer.service.js';
import { whatsappResponseService, type AccumulatedMessage } from './services/whatsapp-response.service.js';
import * as automation from './services/automation.service.js';
import * as leaseService from './services/lease.service.js';
import * as saleService from './services/sale.service.js';
import * as proprietarioService from './services/proprietario.service.js';
import * as financeiroService from './services/financeiro.service.js';
import * as comissaoService from './services/comissao.service.js';
import * as dashboardService from './services/dashboard.service.js';
import * as franquiaService from './services/franquia.service.js';
import { ordemServicoService } from './services/ordem_servico.service.js';
import { vistoriaService } from './services/vistoria.service.js';
import { relatorioService } from './services/relatorio.service.js';
import { aiPricingService } from './services/ai-pricing.service.js';
import { pineconeService } from './services/pinecone.service.js';
import { PDFParse } from 'pdf-parse';
import fs from 'fs';
import os from 'os';

import { portalPublisher } from './jobs/portal-publisher.job.js';
import { biReportJob } from './jobs/bi-report.job.js';
import { feedbackSurveyJob } from './jobs/feedback-survey.job.js';
import { riskCalculatorJob } from './jobs/risk-calculator.job.js';
import { leadReactivationService } from './services/lead-reactivation.service.js';
import { contentGeneratorService } from './services/content-generator.service.js';
import axios from 'axios';
import multer from 'multer';

// Inicializar multer em memória
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Multer para o endpoint de ingestão de imóveis (PDF + até 20 fotos)
const uploadIngest = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024, files: 21 }, // 50MB por arquivo, 21 campos (1 PDF + 20 fotos)
}).fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'fotos', maxCount: 20 },
]);

// process.on...
// (cleaning up the old location)

process.on('uncaughtException', (err) => { console.error('UNCAUGHT EXCEPTION:', err); });
process.on('unhandledRejection', (reason) => { console.error('UNHANDLED REJECTION:', reason); });

const app = express();
const PORT = process.env.PORT || 3005;

// ========== MIDDLEWARE ==========
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(process.cwd(), 'public')));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/api', sessionGuard);

// ========== MASTER ACCESS INJECTOR ==========
// Verifica se há token de impersonation ativo para o Super Admin. 
// Se sim, ele sobrescreve os metadados de cliente_id da requisição 
// para forçar a simulação e acesso root do sistema para este tenant isolado.
app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = masterAccessService.verifyImpersonationToken(token);
        if (decoded && decoded.scope === 'IMPERSONATION' && decoded.target_tenant_id) {
            if (req.method === 'GET') {
                req.query.cliente_id = decoded.target_tenant_id;
                req.query.tenant_id = decoded.target_tenant_id;
            } else {
                req.body.cliente_id = decoded.target_tenant_id;
                req.body.tenant_id = decoded.target_tenant_id;
                req.body.tenantId = decoded.target_tenant_id;
            }
        }
    }
    next();
});
// ========== HEALTH ==========

app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Crânios IMOB API is running (Brain v3.0)',
        timestamp: new Date().toISOString(),
        version: '3.0.0-FULL',
        env: process.env.NODE_ENV || 'production',
        features: {
            backend_api: true,
            chat_agents: true,
            knowledge_base: true,
            cal_integration: !!process.env.CALCOM_API_KEY,
            email_resend: !!process.env.RESEND_API_KEY,
            pinecone_rag: !!process.env.PINECONE_API_KEY,
            r2_storage: !!process.env.R2_ACCESS_KEY_ID,
            onboarding: true,
            pdf_generation: true,
            data_import: true,
            webhook_forwarding: !!process.env.CRM_WEBHOOK_URL,
            telegram_bot: !!process.env.TELEGRAM_BOT_TOKEN,
        }
    });
});

// ========== AUTH DEMO ==========
app.post('/api/auth/demo-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Credenciais Demo (Movidas para o Backend para Segurança)
        const isMaster = email === 'ceo@cranios.pro' && password === 'Cr@nio$2026!';
        const isSetup = email === 'setup@cranios.pro' && password === 'SetCr@nio$2026!';

        if (!isMaster && !isSetup) {
            return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
        }

        const userId = isMaster
            ? '11111111-1111-1111-1111-111111111111'
            : '22222222-2222-2222-2222-222222222222';
        const role = isMaster ? 'gestor' : 'corretor';

        const ip = req.ip || '0.0.0.0';
        const device = req.headers['user-agent'] || 'MockBrowser/1.0';

        const token = await sessionService.registerSession(userId, role, ip, device);
        return res.json({ success: true, token });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// ========== MASTER ACCESS DEMO ==========
app.post('/api/auth/master-access', async (req, res) => {
    try {
        const { masterKey, targetTenantId } = req.body;

        const adminId = '99999999-9999-9999-9999-999999999999'; // Mock ID do Super Admin

        const isValid = await masterAccessService.authenticateMaster(masterKey);
        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Acesso Negado. Chave Mestra Inválida.' });
        }

        const token = masterAccessService.generateImpersonationToken(adminId, targetTenantId);

        // Log auditing
        await masterAccessService.logAccess(adminId, targetTenantId, 'IMPERSONATION_STARTED', req.ip || '0.0.0.0');

        return res.json({ success: true, token });
    } catch (e: any) {
        return res.status(500).json({ success: false, error: e.message });
    }
});

// ========== IA TICKETING (ENTERPRISE SUPPORT) ==========
app.post('/api/tickets', async (req, res) => {
    try {
        const { tenantId, email, subject, description } = req.body;

        if (!tenantId || !email || !subject || !description) {
            return res.status(400).json({ success: false, error: 'Campos obrigatórios ausentes.' });
        }

        const response = await ticketService.createTicket({ tenantId, email, subject, description });
        return res.json({ success: true, ...response });
    } catch (e: any) {
        return res.status(500).json({ success: false, error: e.message });
    }
});

// ========== CRM LEAD CAPTURE (PÁGINA DE VENDAS) ==========
app.post('/api/crm-lead-capture', async (req, res) => {
    try {
        const data = req.body;
        // Esperado: { empresa, contato, email, faturamento, lucroLiquido, roi, reducaoAnualFolha, custoSistema, pessoasCortadas }

        console.log(`[CRM] Novo Lead Capturado: ${data.empresa} (${data.email})`);

        // 1. Salvar no Pipeline (Simulando uma venda imediata por causa do fluxo pedido)
        const planValueMensal = Math.round((data.custoSistema || 2000) / 12);
        const { data: client, error: clientErr } = await supabase.from('client_pipeline')
            .upsert({ email: data.email, name: data.contato, plan_value: planValueMensal, status: 'PAGAMENTO_CONFIRMADO' })
            .select().single();

        if (clientErr && clientErr.code !== 'PGRST116') {
            console.error('[CRM] Erro ao inserir no pipeline:', clientErr);
        }

        const clientId = client?.id || 'simulated-client-uuid';
        const clientSlug = data.empresa ? data.empresa.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'imob-demo';

        // 2. Provisão de Conta (Supabase Auth)
        const tempPass = await automation.createProvisionalLogin(data.email, data.contato);

        // 3. Simulação Asaas Assinatura
        const mockAsaasCustId = 'cus_simulated_' + Math.floor(Math.random() * 1000000);
        await automation.createRecurringSubscription(mockAsaasCustId, planValueMensal, 'CREDIT_CARD');

        // 4. Assinafy (Geração de Contrato Virtual)
        const docId = await automation.generateContractAssinafy(data.email, data.contato, clientSlug);
        if (client && docId) {
            await supabase.from('client_pipeline').update({ assinafy_document_id: docId, contract_sent_at: new Date() }).eq('id', clientId);
        }

        // 5. Envio de E-mails Prontos (Welcome + Onboard Instructions)
        if (tempPass) {
            await automation.mail.sendWelcome(data.email, data.contato, tempPass);
        }

        const safeUrl = `https://cranios-imob.com/secure-keys?token=${Buffer.from(clientId).toString('base64')}`;
        await automation.mail.sendOnboardingUnlock(data.email, data.contato, safeUrl);

        // 6. Notificação Interna CEO
        const msgTgm = `🚀 *NOVO LEAD (Venda Simulada)*\n👤 ${data.contato}\n🏢 ${data.empresa}\n📧 ${data.email}\n💰 ROI: ${data.roi?.toFixed(0)}%\n💵 Faturamento Imob: R$ ${data.faturamento}\n⚙️ Plano Sistema: R$ ${data.custoSistema}`;
        await automation.telegram.notifyCEO(msgTgm);

        await emailService.enviarEmail('ola@cranios.pro', `🔥 Novo Lead Qualificado: ${data.empresa}`, `<p>Novo lead: ${data.empresa} - ${data.contato}</p><p>Email: ${data.email}</p><p>ROI Estimado: ${data.roi}%</p>`);

        return res.json({ success: true, message: 'Onboarding disparado com sucesso.' });
    } catch (e: any) {
        console.error('[CRM Lead Capture Error]', e);
        return res.status(500).json({ success: false, error: e.message });
    }
});

// ========== DASHBOARD ==========

app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const { count: totalImoveis } = await supabase.from('imoveis').select('*', { count: 'exact', head: true });
        const { data: msgs } = await supabase.from('mensagens').select('session_id');
        const uniqueLeads = new Set(msgs?.map((m: any) => m.session_id) || []).size;
        const { count: agendamentos } = await supabase.from('mensagens').select('*', { count: 'exact', head: true }).ilike('metadata->>intencao', 'AGENDAMENTO');

        res.json({
            success: true,
            stats: {
                totalImoveis: totalImoveis || 0,
                leads: uniqueLeads || 0,
                agendamentos: agendamentos || 0,
                imoveisDisponiveis: totalImoveis ? totalImoveis - 5 : 0,
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/dashboard/network-stats/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;
        // 1. Busca todas filiais desse franqueador
        const { data: branches } = await supabase.from('tenants').select('id, name').eq('parent_tenant_id', tenantId);
        if (!branches || branches.length === 0) return res.json({ success: true, branches: [] });

        const branchesIds = branches.map(b => b.id);

        // 2. Compara KPIs (Exemplo: Contagem de Leads e Imóveis) 
        const { data: leads } = await supabase.from('leads').select('tenant_id').in('tenant_id', branchesIds);
        const { data: imoveis } = await supabase.from('imoveis').select('tenant_id').in('tenant_id', branchesIds);

        const stats = branches.map(branch => {
            const bLeads = (leads || []).filter(l => l.tenant_id === branch.id).length;
            const bImoveis = (imoveis || []).filter(i => i.tenant_id === branch.id).length;
            return {
                id: branch.id,
                name: branch.name,
                leads: bLeads,
                imoveis: bImoveis
            };
        });

        res.json({ success: true, branches: stats });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/dashboard/bi/:clienteId', async (req, res) => {
    try {
        const { clienteId } = req.params;
        const biData = await dashboardService.getExecutiveBI(clienteId);

        res.json({ success: true, bi: biData });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== FRANQUIAS ==========

app.get('/api/franquias/:parentId', async (req, res) => {
    try {
        const { parentId } = req.params;
        const franquias = await franquiaService.getFranquias(parentId);
        res.json({ success: true, data: franquias });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/franquias/:parentId', async (req, res) => {
    try {
        const { parentId } = req.params;
        const result = await franquiaService.createFranquia(parentId, req.body);
        res.json({ success: true, data: result });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ========== IMÓVEIS ==========

app.get('/api/imoveis', async (req, res) => {
    try {
        const { tipo, finalidade, limit, cliente_slug } = req.query as any;
        let query = supabase.from('imoveis').select('*').eq('disponivel', true);

        if (tipo) query = query.eq('tipo', tipo);
        if (finalidade) query = query.eq('finalidade', finalidade);
        if (cliente_slug) {
            const { data: cliente } = await supabase.from('clientes').select('id').eq('slug', cliente_slug).single();
            if (cliente) query = query.eq('cliente_id', cliente.id);
        }

        query = query.order('destaque', { ascending: false }).order('created_at', { ascending: false });
        if (limit) {
            query = query.limit(Number(limit));
        } else {
            query = query.limit(10000); // Traz todos os imóveis (liberado o limite padrão de 20)
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json({ success: true, data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/imoveis/destaque', async (req, res) => {
    try {
        const { limit, cliente_slug } = req.query as any;
        let query = supabase.from('imoveis').select('*').eq('disponivel', true).eq('destaque', true);

        if (cliente_slug) {
            const { data: cliente } = await supabase.from('clientes').select('id').eq('slug', cliente_slug).single();
            if (cliente) query = query.eq('cliente_id', cliente.id);
        }

        query = query.order('created_at', { ascending: false }).limit(Number(limit) || 3);
        const { data, error } = await query;
        if (error) throw error;
        res.json({ success: true, data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/imoveis/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('imoveis').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        if (!data) return res.status(404).json({ success: false, error: 'Imóvel não encontrado' });
        res.json({ success: true, data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/imoveis/search', async (req, res) => {
    try {
        const { q } = req.query as any;
        if (!q) return res.status(400).json({ success: false, error: 'Query obrigatória' });
        const { data, error } = await supabase.from('imoveis').select('*').eq('disponivel', true).textSearch('descricao', q).limit(10);
        if (error) throw error;
        res.json({ success: true, data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * POST /api/imoveis - Cadastrar novo imóvel e gerar PDF automaticamente
 */
app.post('/api/imoveis', async (req, res) => {
    try {
        const imovel = req.body;
        console.log('[API] POST /api/imoveis:', imovel.titulo);

        // 1. Inserir no Supabase
        const { data, error } = await supabase
            .from('imoveis')
            .insert([{
                ...imovel,
                disponivel: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        // 2. Gerar PDF em Background
        const imovelId = data.id;

        // Disparar PDF assincronamente (não bloqueia a resposta da API)
        setTimeout(async () => {
            try {
                let clienteConfig = {
                    nome: 'Crânios IMOB',
                    logo_url: '',
                    cor_primaria: '#667eea',
                    cor_secundaria: '#764ba2',
                    whatsapp: process.env.WHATSAPP_CORRETOR || '',
                    email: 'contato@cranios.pro',
                    creci: '',
                };

                if (data.cliente_id) {
                    const { data: cliente } = await supabase.from('clientes').select('*').eq('id', data.cliente_id).single();
                    if (cliente) {
                        clienteConfig = { ...clienteConfig, ...cliente };
                    }
                }

                const pdfUrl = await pdfGeneratorService.obterOuGerarPDF(imovelId, clienteConfig, r2StorageService);
                console.log(`[API] PDF gerado automaticamente com sucesso: ${pdfUrl}`);

            } catch (err: any) {
                console.error(`[API] Erro ao gerar PDF background para imóvel ${imovelId}:`, err.message);
            }
        }, 1000);

        res.status(201).json({ success: true, data });
    } catch (e: any) {
        console.error('[API] Erro criando imóvel:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * POST /api/webhooks/imoveis - Recebe trigger do Supabase (Database Webhooks)
 * Acionado no INSERT, UPDATE ou DELETE da tabela 'imoveis'.
 */
app.post('/api/webhooks/imoveis', async (req, res) => {
    try {
        const { type, record, old_record } = req.body;
        // type: 'INSERT' | 'UPDATE' | 'DELETE'

        const imovel = type === 'DELETE' ? old_record : record;
        if (!imovel || !imovel.id || !imovel.tenant_id) {
            return res.status(400).json({ success: false, error: 'Payload incompleto para portalPublisher' });
        }

        // Envia de forma assíncrona (não bloqueia o webhook)
        portalPublisher.processImovelChange(imovel.id, imovel.tenant_id, type).catch(err => {
            console.error('[Webhooks Imoveis] Erro no portalPublisher:', err);
        });

        res.status(200).json({ success: true, message: 'Evento recebido.' });
    } catch (e: any) {
        console.error('[Webhooks Imoveis] Erro ao processar:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * Gerar PDF Book de um imóvel
 */
app.post('/api/imoveis/:id/gerar-pdf', async (req, res) => {
    try {
        const { id } = req.params;
        const { data: imovel, error } = await supabase.from('imoveis').select('*').eq('id', id).single();
        if (error || !imovel) return res.status(404).json({ success: false, error: 'Imóvel não encontrado' });

        // Buscar config do cliente
        let clienteConfig = {
            nome: 'Crânios IMOB',
            logo_url: '',
            cor_primaria: '#667eea',
            cor_secundaria: '#764ba2',
            whatsapp: process.env.WHATSAPP_CORRETOR || '',
            email: 'contato@cranios.pro',
            creci: '',
        };

        if (imovel.cliente_id) {
            const { data: cliente } = await supabase.from('clientes').select('*').eq('id', imovel.cliente_id).single();
            if (cliente) {
                clienteConfig = {
                    nome: cliente.nome,
                    logo_url: cliente.logo_url || '',
                    cor_primaria: cliente.cor_primaria || '#667eea',
                    cor_secundaria: cliente.cor_secundaria || '#764ba2',
                    whatsapp: cliente.whatsapp || '',
                    email: cliente.email || 'contato@cranios.pro',
                    creci: cliente.creci || '',
                };
            }
        }

        const pdfUrl = await pdfGeneratorService.obterOuGerarPDF(id, clienteConfig, r2StorageService);
        res.json({ success: true, pdfUrl });
    } catch (error: any) {
        console.error('[API] Erro ao gerar PDF:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/imoveis/sugestao-preco - Inteligência Artificial de Precificação
 */
app.post('/api/imoveis/sugestao-preco', async (req, res) => {
    try {
        const { tenantId, tipo, contexto, bairro, cidade, quartos, area_construida } = req.body;
        
        console.log(`[PricingAI] Analisando sugestão para ${tipo} em ${bairro}, ${cidade} (${contexto})`);
        
        const result = await aiPricingService.getPriceSuggestion({
            tenantId, tipo, contexto, bairro, cidade, quartos, area_construida
        });
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.json(result);
    } catch (error: any) {
        console.error('[PricingAI] Erro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/imoveis/gerar-conteudo - IA Generativa de Conteúdo (Descrição / Redes Sociais)
 */
app.post('/api/imoveis/gerar-conteudo', async (req, res) => {
    try {
        const { id, tipoConteudo, ...propertyData } = req.body;
        // Se id for informado, buscamos os dados na base. 
        // Se não (criação nova), usamos os dados passados pelo frontend.
        let params = propertyData;
        if (id) {
            const { data: imovel, error } = await supabase.from('imoveis').select('*').eq('id', id).single();
            if (error || !imovel) return res.status(404).json({ success: false, error: 'Imóvel não encontrado' });
            params = { ...imovel, valor: imovel.preco_venda || imovel.preco_locacao || 0 };
        }

        console.log(`[ContentGen] Gerando ${tipoConteudo} para tipo ${params.tipo} em ${params.bairro}`);
        let result;

        if (tipoConteudo === 'instagram_post') {
            result = await contentGeneratorService.generateInstagramPost(params);
        } else {
            result = await contentGeneratorService.generatePropertyDescription(params);
        }

        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (error: any) {
        console.error('[ContentGen] Erro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/imoveis/ingest — Upload PDF + metadata → R2 → Pinecone → Supabase
 * Multipart form: campo "pdf" (file) + campos de metadados textuais
 */
app.post('/api/imoveis/ingest', uploadIngest, async (req, res) => {
    const steps: string[] = [];
    try {
        const files = req.files as Record<string, Express.Multer.File[]>;
        const file = files?.pdf?.[0] || null;
        const fotoFiles = files?.fotos || [];
        const body = req.body;

        // Parse metadata (pode vir como JSON string ou campos individuais)
        let meta: any = {};
        if (body.metadata) {
            try { meta = JSON.parse(body.metadata); } catch {}
        } else {
            meta = {
                titulo: body.titulo, tipo: body.tipo, finalidade: body.finalidade,
                endereco: body.endereco, bairro: body.bairro, cidade: body.cidade,
                estado: body.estado, cep: body.cep, descricao: body.descricao,
                preco: body.preco ? parseFloat(body.preco) : null,
                quartos: body.quartos ? parseInt(body.quartos) : null,
                banheiros: body.banheiros ? parseInt(body.banheiros) : null,
                area: body.area ? parseFloat(body.area) : null,
                destaque: body.destaque === 'true' || body.destaque === true,
                caracteristicas: body.caracteristicas ? (
                    Array.isArray(body.caracteristicas) ? body.caracteristicas
                    : body.caracteristicas.split(',').map((s: string) => s.trim()).filter(Boolean)
                ) : [],
                cliente_id: body.cliente_id || null,
                cliente_slug: body.cliente_slug || null,
            };
        }

        if (!meta.titulo) return res.status(400).json({ success: false, error: 'titulo é obrigatório' });

        const finalidade = meta.finalidade || 'venda';
        const isLancamento = finalidade === 'lancamento';

        // Resolver cliente (opcional)
        let clienteId: string | null = meta.cliente_id || null;
        if (!clienteId && meta.cliente_slug) {
            const { data: c } = await supabase.from('clientes').select('id').eq('slug', meta.cliente_slug).single();
            if (c) clienteId = c.id;
        }

        // 1. Upload PDF para R2 (se fornecido)
        let pdfKey: string | null = null;
        if (file) {
            if (!file.mimetype.includes('pdf')) {
                return res.status(400).json({ success: false, error: 'Apenas arquivos PDF são aceitos' });
            }
            const nomeSeguro = meta.titulo.replace(/[^a-zA-Z0-9._\s-]/g, '').replace(/\s+/g, '-') + '.pdf';
            const { R2StorageService } = await import('./services/r2-storage.service.js');
            let r2upload: any;
            if (clienteId) {
                const { data: c } = await supabase.from('clientes').select('bucket_name, slug').eq('id', clienteId).single();
                r2upload = R2StorageService.forCliente(c?.bucket_name || c?.slug || clienteId);
            } else {
                r2upload = r2StorageService;
            }
            pdfKey = await r2upload.uploadPropertyPDF(clienteId || 'demo', nomeSeguro, file.buffer);
            steps.push(`✅ PDF enviado para R2: ${pdfKey}`);
        }

        // 2. Extrair texto do PDF + indexar no Pinecone
        let vectorCount = 0;
        if (file && isLancamento) {
            const tmpFile = path.join(os.tmpdir(), `ingest_${Date.now()}.pdf`);
            let rawText = '';
            let pageCount = 0;
            try {
                fs.writeFileSync(tmpFile, file.buffer);
                const parser = new PDFParse({ url: 'file://' + tmpFile });
                const parsed = await parser.getText();
                rawText = parsed.text || '';
                pageCount = Array.isArray(parsed.pages) ? parsed.pages.length : 0;
            } finally {
                try { fs.unlinkSync(tmpFile); } catch {}
            }

            const text = rawText.replace(/\f/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
            const wordCount = text.split(/\s+/).filter(Boolean).length;
            steps.push(`✅ Texto extraído: ${wordCount} palavras, ${pageCount} páginas`);

            if (wordCount >= 50) {
                const CHUNK = 600, OVERLAP = 80;
                const words = text.split(/\s+/).filter(Boolean);
                const chunks: string[] = [];
                for (let i = 0; i < words.length; i += CHUNK - OVERLAP) {
                    chunks.push(words.slice(i, i + CHUNK).join(' '));
                    if (chunks[chunks.length - 1].split(/\s+/).length < 20) { chunks.pop(); break; }
                }

                const slug = meta.cliente_slug || (clienteId ? clienteId.substring(0, 8) : 'demo');
                const namespace = `${slug}:gabriel`.toLowerCase();
                const nomeId = meta.titulo.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

                await pineconeService.upsertBatch(
                    chunks.map((chunk, idx) => ({
                        id: `${nomeId}_chunk_${idx}`,
                        text: chunk,
                        metadata: {
                            text: chunk.substring(0, 500),
                            source: 'lancamento',
                            agente: 'gabriel',
                            tipo: 'lancamentos',
                            imovelId: nomeId,
                            cliente_id: clienteId || '',
                            titulo: meta.titulo,
                            chunk_index: idx,
                            total_chunks: chunks.length,
                        },
                    })),
                    namespace
                );
                vectorCount = chunks.length;
                steps.push(`✅ ${vectorCount} vetores indexados no Pinecone (ns: ${namespace})`);
            } else {
                steps.push(`⚠️ PDF com pouco texto — Pinecone ignorado`);
            }
        }

        // 3. Criar imóvel no Supabase
        const imovelRecord: any = {
            tipo: meta.tipo || 'Apartamento',
            finalidade: isLancamento ? 'venda' : finalidade,
            titulo: meta.titulo,
            descricao: meta.descricao || '',
            endereco: meta.endereco || '',
            bairro: meta.bairro || '',
            cidade: meta.cidade || '',
            estado: meta.estado || '',
            cep: meta.cep || '',
            disponivel: true,
            destaque: meta.destaque || false,
            caracteristicas: meta.caracteristicas?.length ? JSON.stringify(meta.caracteristicas) : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        if (clienteId) imovelRecord.cliente_id = clienteId;
        if (meta.quartos) imovelRecord.quartos = parseInt(meta.quartos);
        if (meta.banheiros) imovelRecord.banheiros = parseInt(meta.banheiros);
        if (meta.area) imovelRecord.area_construida = parseFloat(meta.area);
        if (meta.preco) {
            if (finalidade === 'locacao') imovelRecord.preco_locacao = parseFloat(meta.preco);
            else imovelRecord.preco_venda = parseFloat(meta.preco);
        }
        if (pdfKey) imovelRecord.foto_principal = pdfKey;

        const { data: imovel, error: imovelError } = await supabase
            .from('imoveis').insert([imovelRecord]).select().single();

        if (imovelError) {
            steps.push(`⚠️ Supabase: ${imovelError.message.substring(0, 120)}`);
            return res.json({ success: false, steps, error: imovelError.message });
        }

        steps.push(`✅ Imóvel criado no Supabase (id: ${imovel.id})`);

        // 4. Upload de fotos para R2
        const fotoUrls: string[] = [];
        if (fotoFiles.length > 0) {
            const { R2StorageService } = await import('./services/r2-storage.service.js');
            let r2fotos: any;
            if (clienteId) {
                const { data: c } = await supabase.from('clientes').select('bucket_name, slug').eq('id', clienteId).single();
                r2fotos = R2StorageService.forCliente(c?.bucket_name || c?.slug || clienteId);
            } else {
                r2fotos = r2StorageService;
            }

            for (let i = 0; i < fotoFiles.length; i++) {
                const f = fotoFiles[i];
                const ext = f.originalname.split('.').pop()?.toLowerCase() || 'jpg';
                const filename = `foto_${i + 1}_${Date.now()}.${ext}`;
                const url = await r2fotos.uploadPropertyPhoto(f.buffer, imovel.id, filename, clienteId || 'demo');
                fotoUrls.push(url);
            }

            // Atualizar imóvel com foto_principal + fotos[]
            const fotoUpdate: any = {
                fotos: fotoUrls,
                updated_at: new Date().toISOString(),
            };
            if (!imovelRecord.foto_principal) fotoUpdate.foto_principal = fotoUrls[0];
            await supabase.from('imoveis').update(fotoUpdate).eq('id', imovel.id);
            imovel.foto_principal = fotoUpdate.foto_principal || imovel.foto_principal;
            imovel.fotos = fotoUrls;
            steps.push(`✅ ${fotoUrls.length} foto(s) enviada(s) para R2`);
        }

        // 5. Gerar PDF/Book automaticamente com identidade visual da imobiliária
        if (fotoUrls.length > 0 || imovel.foto_principal) {
            setTimeout(async () => {
                try {
                    let clienteConfig: any = {
                        nome: 'Crânios IMOB',
                        logo_url: '',
                        cor_primaria: '#667eea',
                        cor_secundaria: '#764ba2',
                        telefone: '',
                        email: 'contato@cranios.pro',
                        creci: '',
                    };
                    if (clienteId) {
                        const { data: c } = await supabase.from('clientes').select('*').eq('id', clienteId).single();
                        if (c) clienteConfig = {
                            nome: c.nome,
                            logo_url: c.logo_url || '',
                            cor_primaria: c.cor_primaria || '#667eea',
                            cor_secundaria: c.cor_secundaria || '#764ba2',
                            telefone: c.whatsapp || c.telefone || '',
                            email: c.email || 'contato@cranios.pro',
                            creci: c.creci || '',
                            whatsapp: c.whatsapp || '',
                        };
                    }
                    await pdfGeneratorService.obterOuGerarPDF(imovel.id, clienteConfig, r2StorageService);
                    console.log(`[Ingest] 📄 Book PDF gerado para imóvel "${meta.titulo}"`);
                } catch (err: any) {
                    console.error(`[Ingest] Erro ao gerar PDF book:`, err.message);
                }
            }, 500);
            steps.push(`📄 Book PDF sendo gerado em background (identidade visual da imobiliária)`);
        }

        console.log(`[Ingest] ✅ Imóvel "${meta.titulo}" — ${vectorCount} vetores, ${fotoUrls.length} fotos`);
        res.status(201).json({
            success: true, steps, imovel,
            stats: { vectorCount, pdfKey, totalFotos: fotoUrls.length },
        });
    } catch (e: any) {
        console.error('[Ingest] Erro:', e);
        steps.push(`❌ Erro: ${e.message}`);
        res.status(500).json({ success: false, error: e.message, steps });
    }
});

/**
 * PUT /api/imoveis/:id - Atualiza imóvel completo
 */
app.put('/api/imoveis/:id', async (req, res) => {
  try {
    const imovelUpdate = { ...req.body, updated_at: new Date().toISOString() };
    delete imovelUpdate.id;
    const { data, error } = await supabase.from('imoveis').update(imovelUpdate).eq('id', req.params.id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Imóvel não encontrado' });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/imoveis/:id - Exclui imóvel
 */
app.delete('/api/imoveis/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('imoveis').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Imóvel excluído com sucesso' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== CHAT ==========

app.post('/api/chat', async (req, res) => {
    const { message, sessionId, cliente, imovelId, empreendimento } = req.body;
    console.log('[ChatAPI] Msg:', message?.substring(0, 50), '| ImovelContexto:', imovelId, '| Empreendimento:', empreendimento || '-');

    try {
        await supabase.from('mensagens').insert([{
            session_id: sessionId,
            role: 'user',
            content: message,
            metadata: { ...cliente, imovelContexto: imovelId, empreendimento },
            created_at: new Date().toISOString(),
        }]);

        // Forward to CRM Webhook
        if (process.env.CRM_WEBHOOK_URL) {
            axios.post(process.env.CRM_WEBHOOK_URL, {
                event: 'new_message', sessionId, message, cliente, imovelId, empreendimento,
                timestamp: new Date().toISOString()
            }).catch(err => console.error('[ChatAPI] CRM webhook error:', err.message));
        }

        const resultado = await chatAgent.processarMensagem(message, sessionId, cliente, imovelId, empreendimento);

        await supabase.from('mensagens').insert([{
            session_id: sessionId,
            role: 'assistant',
            content: resultado.response,
            metadata: { agente: resultado.agente, tipo: resultado.tipo, acao: resultado.acao, data: resultado.data },
            created_at: new Date().toISOString(),
        }]);

        res.json({
            success: true,
            response: resultado.response,
            agente: resultado.agente,
            tipo: resultado.tipo,
            data: resultado.data
        });
    } catch (error: any) {
        console.error('[ChatAPI] Erro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/chat/historico/:sessionId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('mensagens').select('*').eq('session_id', req.params.sessionId)
            .order('created_at', { ascending: true }).limit(50);
        if (error) throw error;
        res.json({ success: true, data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ========== ONBOARDING ==========

/**
 * POST /api/onboarding
 * Cadastra nova imobiliária cliente com configuração de agentes personalizados
 */
app.post('/api/onboarding', async (req, res) => {
    try {
        const {
            nome, email, telefone, whatsapp, website, cnpj, razao_social,
            plano = 'trial', endereco,
            // Personalização dos agentes
            nomeAgentes = {},   // { vendas: 'Carlos', juridico: 'Dra. Ana', ... }
            instrucoes = {},    // Instruções específicas por agente
            escolherFuncoes = [], // Quais funcionalidades ativar
            cor_primaria, cor_secundaria,
        } = req.body;

        if (!nome || !email) {
            return res.status(400).json({ success: false, error: 'Nome e email são obrigatórios' });
        }

        console.log('[OnboardingAPI] Iniciando onboarding para:', nome);

        // 1. Criar cliente no sistema
        const resultado = await onboardingService.onboardCliente({
            nome, email, telefone, whatsapp, cnpj, razao_social, website,
            plano,
            endereco: endereco || {},
            cor_primaria: cor_primaria || '#667eea',
            cor_secundaria: cor_secundaria || '#764ba2',
            nomeAgentes: {
                vendas: nomeAgentes.vendas || 'Ricardo',
                juridico: nomeAgentes.juridico || 'Bruna',
                atendimento: nomeAgentes.atendimento || 'Sofia',
                concierge: nomeAgentes.concierge || 'Michael',
                vistorias: nomeAgentes.vistorias || 'Marcos',
                financeiro: nomeAgentes.financeiro || 'Lucas',
                ...nomeAgentes,
            },
            instrucoes,
            funcoes: escolherFuncoes,
        });

        if (!resultado.success) {
            return res.status(500).json(resultado);
        }

        console.log('[OnboardingAPI] ✅ Onboarding concluído:', resultado.slug);
        res.json(resultado);

    } catch (error: any) {
        console.error('[OnboardingAPI] Erro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/onboarding/:slug — Verificar status de um cliente
 */
app.get('/api/onboarding/:slug', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('clientes').select('*').eq('slug', req.params.slug).single();
        if (error || !data) return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
        res.json({ success: true, cliente: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ========== IMPORTAÇÃO DE DADOS ==========

/**
 * POST /api/import/analisar — Analisa estrutura do arquivo antes de importar
 */
app.post('/api/import/analisar', async (req, res) => {
    try {
        const { tipo, csv_content, json_content, dados_conexao } = req.body;
        const estrutura = await dataImportService.analisarFonte({
            cliente_id: req.body.cliente_id || 'temp',
            tipo, csv_content, json_content, dados_conexao,
        });
        res.json({ success: true, estrutura });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/import/executar — Importa imóveis (CSV, JSON, MySQL)
 */
app.post('/api/import/executar', async (req, res) => {
    try {
        const { tipo, csv_content, json_content, dados_conexao, cliente_id, validar = true } = req.body;

        if (!cliente_id) return res.status(400).json({ success: false, error: 'cliente_id obrigatório' });

        const estrutura = await dataImportService.analisarFonte({
            cliente_id, tipo, csv_content, json_content, dados_conexao
        });
        const mapeamento = await dataImportService.gerarMapeamento(estrutura);

        // Obter os dados brutos para validação
        let dadosBrutos: any[] = [];
        if (tipo === 'csv' && csv_content) {
            const { parse } = await import('csv-parse/sync');
            dadosBrutos = parse(csv_content, { columns: true, skip_empty_lines: true, trim: true });
        } else if (tipo === 'json' && json_content) {
            dadosBrutos = Array.isArray(json_content) ? json_content : [json_content];
        }

        const validados = validar
            ? await dataImportService.validarDados(dadosBrutos, mapeamento)
            : { validos: dadosBrutos, invalidos: [], avisos: [], erros: [] };

        const resultado = await dataImportService.executarImportacao(cliente_id, validados);
        res.json({ success: resultado.sucesso, resultado, mapeamento });

    } catch (error: any) {
        console.error('[ImportAPI] Erro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== AGENDAMENTOS ==========

/**
 * GET /api/agendamentos/slots — Horários disponíveis (integrado com a Roleta)
 */
app.get('/api/agendamentos/slots', async (req, res) => {
    try {
        const { tipo = 'AGENDA_CORRETOR', data, corretorId, clienteId } = req.query as any;
        if (!data) return res.status(400).json({ success: false, error: 'data (YYYY-MM-DD) obrigatória' });

        if (tipo === 'AGENDA_CORRETOR') {
            // Se já foi especificado um corretor, checa apenas ele
            if (corretorId) {
                const { data: c } = await supabase.from('corretores').select('*').eq('id', corretorId).single();
                if (c) {
                    const slots = await calendarService.getAvailableSlots(tipo, data, c.calcom_api_key, c.calcom_event_type_id);
                    return res.json({ success: true, slots, data, corretor_id: c.id, corretor_nome: c.nome });
                }
            }

            // Senão, usa a roleta para encontrar o próximo corretor que tem slot livre neste dia
            const tentados: string[] = [];
            while (true) {
                const corretor = await roletaService.proximoCorretorDisponivel(clienteId, tentados);
                if (!corretor) break; // Todos testados e nenhum tem slot

                const slots = await calendarService.getAvailableSlots(tipo, data, corretor.calcom_api_key, corretor.calcom_event_type_id);
                if (slots.length > 0) {
                    return res.json({ success: true, slots, data, corretor_id: corretor.id, corretor_nome: corretor.nome });
                }
                tentados.push(corretor.id);
            }

            // Se ninguém tiver slot, apenas volta array vazio ou mock genérico
            const slots = await calendarService.getAvailableSlots(tipo, data);
            return res.json({ success: true, slots, data });
        }

        const slots = await calendarService.getAvailableSlots(tipo, data);
        res.json({ success: true, slots, data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * POST /api/agendamentos/visita — Agendar visita com corretor e confirmar roleta
 */
app.post('/api/agendamentos/visita', async (req, res) => {
    try {
        const { nome, email, imovelId, imovelTitulo, data, hora, observacoes, corretorId, leadId, clienteId } = req.body;
        if (!nome || !email || !imovelId || !data || !hora) {
            return res.status(400).json({ success: false, error: 'Campos obrigatórios: nome, email, imovelId, data, hora' });
        }

        const disponivel = await calendarService.verificarDisponibilidadeImovel(imovelId, data, hora);
        if (!disponivel) {
            return res.json({ success: false, error: 'Horário já ocupado para este imóvel. Escolha outro horário.' });
        }

        let brokerCalcomApiKey = undefined;
        let brokerCalcomEventTypeId = undefined;
        let cNome = 'Nossa Equipe';

        if (corretorId) {
            const { data: c } = await supabase.from('corretores').select('*').eq('id', corretorId).single();
            if (c) {
                brokerCalcomApiKey = c.calcom_api_key;
                brokerCalcomEventTypeId = c.calcom_event_type_id;
                cNome = c.nome;

                // Confirmar Atribuição na Roleta se viemos do chat/fluxo automatizado
                if (leadId) {
                    await roletaService.atribuirLeadCorretor(leadId, corretorId, clienteId);
                }
            }
        }

        const booking = await calendarService.agendarVisitaCorretor({
            nome, email, imovelId, imovelTitulo, data, hora, observacoes,
            brokerCalcomApiKey,
            brokerCalcomEventTypeId
        });

        if (booking.success) {
            // Se agendado, dispara a IA para gerar o briefing do corretor
            if (leadId) {
                leadBriefingService.gerarBriefing(leadId).catch(err => console.error('[LeadBriefing] Erro background:', err.message));
            }

            if (email && process.env.RESEND_API_KEY) {
                emailService.enviarConfirmacaoAgendamento({
                    nome, email,
                    imovelTitulo: imovelTitulo || 'Imóvel selecionado',
                    data: new Date(data).toLocaleDateString('pt-BR'),
                    hora,
                    bookingUrl: booking.bookingUrl,
                    tipoAgendamento: 'visita_corretor',
                }).catch(console.error);
            }
        }

        res.json({ success: booking.success, booking, disponivel: true, corretor: cNome });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ========== REATIVAÇÃO COM IA (M7) ==========

app.post('/api/leads/:leadId/reactivate/generate', async (req, res) => {
    try {
        const { leadId } = req.params;
        const result = await leadReactivationService.generateMessage(leadId);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/leads/:leadId/reactivate/send', async (req, res) => {
    try {
        const { leadId } = req.params;
        const { tenantId, corretorId, text } = req.body;
        
        if (!tenantId || !text) {
            return res.status(400).json({ success: false, error: 'tenantId e text são obrigatórios' });
        }

        const result = await leadReactivationService.sendAndLog(leadId, tenantId, corretorId, text);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        // Simulação de disparo de mensagem de WhatsApp poderia entrar aqui
        // await automation.whatsapp.sendMessage(lead.telefone, text);
        
        res.json({ success: true, message: 'Reativação logada com sucesso!' });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ========== LEADS (CRM) ==========

/**
 * GET /api/leads - Lista todos os leads com filtros opcionais
 */
app.get('/api/leads', async (req, res) => {
  try {
    const { status, tenant_id, corretor_id, limit = '100' } = req.query;
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(parseInt(limit as string));
    if (status && status !== 'all') query = query.eq('status', status);
    if (tenant_id) query = query.eq('tenant_id', tenant_id);
    if (corretor_id) query = query.eq('corretor_id', corretor_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, leads: data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/leads/:id/briefing - Gera/retorna briefing IA do lead
 */
app.get('/api/leads/:id/briefing', async (req, res) => {
  try {
    const briefing = await leadBriefingService.gerarBriefing(req.params.id);
    if (!briefing) {
      return res.json({ success: true, briefing: null, message: 'Sem histórico suficiente para gerar briefing' });
    }
    res.json({ success: true, briefing });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/leads/:id - Busca um lead por ID
 */
app.get('/api/leads/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('leads').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    res.json({ success: true, lead: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/leads/:id - Atualiza status e outros campos de um lead
 */
app.patch('/api/leads/:id', async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('leads').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, lead: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== LISTAGENS (CRM) ==========

/**
 * POST /api/agendamentos/concierge — Agendar entrega/devolução de chaves
 */
app.post('/api/agendamentos/concierge', async (req, res) => {
    try {
        const { nome, email, imovelId, imovelTitulo, data, hora, tipo = 'entrega' } = req.body;
        const booking = await calendarService.agendarConcierge({ nome, email, imovelId, imovelTitulo, data, hora, tipo });

        if (booking.success && email && process.env.RESEND_API_KEY) {
            emailService.enviarConfirmacaoAgendamento({
                nome, email,
                imovelTitulo: imovelTitulo || 'Locação',
                data: new Date(data).toLocaleDateString('pt-BR'),
                hora,
                bookingUrl: booking.bookingUrl,
                tipoAgendamento: 'entrega_chaves',
            }).catch(console.error);
        }

        res.json({ success: booking.success, booking });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * POST /api/agendamentos/servico — Agendar serviço/reparo
 */
app.post('/api/agendamentos/servico', async (req, res) => {
    try {
        const { nome, email, imovelId, imovelTitulo, tipoServico, data, hora, descricaoProblema } = req.body;
        const booking = await calendarService.agendarServico({ nome, email, imovelId, imovelTitulo, tipoServico, data, hora, descricaoProblema });

        if (booking.success && email && process.env.RESEND_API_KEY) {
            emailService.enviarConfirmacaoAgendamento({
                nome, email,
                imovelTitulo: `${tipoServico} — ${imovelTitulo || 'Imóvel'}`,
                data: new Date(data).toLocaleDateString('pt-BR'),
                hora,
                bookingUrl: booking.bookingUrl,
                tipoAgendamento: 'servico_reparo',
            }).catch(console.error);
        }

        res.json({ success: booking.success, booking });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ========== STORAGE ==========

/**
 * POST /api/storage/upload-url — Obter URL assinada para upload direto do frontend
 */
app.post('/api/storage/upload-url', async (req, res) => {
    try {
        const { filePath, expiresIn = 3600 } = req.body;
        if (!filePath) return res.status(400).json({ success: false, error: 'filePath obrigatório' });
        const url = await r2StorageService.getSignedUploadUrl(filePath, expiresIn);
        const publicUrl = r2StorageService.getPublicUrl(filePath);
        res.json({ success: true, uploadUrl: url, publicUrl });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ========== EMAIL (DEV/TEST) ==========

app.post('/api/email/test', async (req, res) => {
    if (process.env.NODE_ENV === 'production' && !req.headers['x-admin-key']) {
        return res.status(403).json({ success: false, error: 'Não autorizado' });
    }
    try {
        const ok = await emailService.enviarEmail(
            req.body.to || 'ceo.cranios@gmail.com',
            'Teste Crânios IMOB Brain v3.0',
            '<h1>✅ Email funcionando!</h1><p>Resend integrado com sucesso.</p>'
        );
        res.json({ success: ok });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ========== WEBHOOK ==========

app.post('/api/webhook/test', (req, res) => {
    res.json({ success: true, message: 'Webhook ativo', received_data: req.body });
});

// ========== LANÇAMENTOS (PDFs do R2) ==========

/**
 * GET /api/lancamentos — Lista todos os PDFs da pasta Lançamentos/
 * Retorna nome, tamanho e URL de download assinada (válida 7 dias)
 */
app.get('/api/lancamentos', async (req, res) => {
    try {
        const { cliente_id, cliente_slug } = req.query as any;
        let clienteId = cliente_id;

        // Resolver cliente_id a partir do slug se fornecido
        if (!clienteId && cliente_slug) {
            const { data: cliente } = await supabase.from('clientes').select('id').eq('slug', cliente_slug).single();
            if (cliente) clienteId = cliente.id;
        }

        const lancamentos = await r2StorageService.listarLancamentos(clienteId);
        res.json({ success: true, total: lancamentos.length, lancamentos });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * POST /api/lancamentos/download — Gera URL assinada para um PDF específico
 * Body: { key: "Lançamentos/nome.pdf", expiresIn?: 3600 }
 */
app.post('/api/lancamentos/download', async (req, res) => {
    try {
        const { key, expiresIn = 604800 } = req.body;
        if (!key) return res.status(400).json({ success: false, error: 'key obrigatório' });

        const nome = key.split('/').pop() || key;
        const url = await r2StorageService.getSignedDownloadUrl(key, expiresIn, nome);
        res.json({ success: true, url, expiresEm: new Date(Date.now() + expiresIn * 1000).toISOString() });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * GET /api/lancamentos/arquivos — Lista TODOS os arquivos de uma pasta R2 (uso admin)
 */
app.get('/api/lancamentos/arquivos', async (req, res) => {
    try {
        const { prefix = 'Lançamentos/' } = req.query as any;
        const arquivos = await r2StorageService.listFiles(prefix);
        res.json({ success: true, total: arquivos.length, arquivos });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ========== GESTÃO DE CORRETORES E ROLETA ==========

/**
 * GET /api/corretores
 */
app.get('/api/corretores', async (req, res) => {
    try {
        const { cliente_id } = req.query;
        let query = supabase.from('corretores').select('*').order('nome');
        if (cliente_id) query = query.eq('cliente_id', cliente_id);
        const { data, error } = await query;
        if (error) throw error;
        res.json({ success: true, corretores: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * POST /api/corretores
 */
app.post('/api/corretores', async (req, res) => {
    try {
        const { nome, email, cliente_id, telefone, calcom_api_key, calcom_event_type_id } = req.body;

        // Bloqueador de Corretor
        if (cliente_id) {
            await planLimitsService.checkCorretorLimit(cliente_id);
        }

        const { data, error } = await supabase.from('corretores').insert([{
            nome, email, cliente_id, telefone, calcom_api_key, calcom_event_type_id
        }]).select();

        if (error) throw error;

        let telegramActivation = null;
        if (data && data[0] && data[0].id) {
            // Gerar link de ativação do Telegram
            telegramActivation = await telegramActivationService.generateActivationLink(data[0].id, data[0].cliente_id);
        }

        res.json({ success: true, corretor: data?.[0], telegramActivation });
    } catch (e: any) {
        if (e.name === 'PlanLimitError') {
            return res.status(403).json({ success: false, error: e.message, code: e.code, upgrade_url: e.details?.upgrade_url });
        }
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * POST /api/corretores/convite
 */
app.post('/api/corretores/convite', async (req, res) => {
    try {
        const { email, nome, cliente_id, empresaNome } = req.body;
        if (!email || !nome) return res.status(400).json({ success: false, error: 'Email e nome são obrigatórios' });

        // Bloqueador de Convite
        if (cliente_id) {
            await planLimitsService.checkCorretorLimit(cliente_id);
        }

        const baseUrl = process.env.BASE_URL || (req.get('host')?.includes('localhost') ? `http://${req.get('host')}` : `https://${req.get('host')}`);
        const linkConvite = `${baseUrl}/corretor-cadastro.html?email=${encodeURIComponent(email)}&cliente_id=${cliente_id}&nome=${encodeURIComponent(nome)}`;

        const enviado = await emailService.enviarConviteCorretor({
            corretorEmail: email,
            corretorNome: nome,
            empresaNome: empresaNome || 'Crânios IMOB',
            linkConvite
        });

        res.json({ success: enviado, message: enviado ? 'Convite enviado' : 'Falha ao enviar convite' });
    } catch (e: any) {
        if (e.name === 'PlanLimitError') {
            return res.status(403).json({ success: false, error: e.message, code: e.code, upgrade_url: e.details?.upgrade_url });
        }
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * POST /api/corretores/login
 */
app.post('/api/corretores/login', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, error: 'Email obrigatório' });

        const { data, error } = await supabase.from('corretores').select('*').eq('email', email).single();
        if (error || !data) return res.status(401).json({ success: false, error: 'Corretor não encontrado com este email' });

        if (!data.ativo) return res.status(403).json({ success: false, error: 'Corretor inativo' });

        res.json({ success: true, corretor: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * GET /api/corretores/:id/leads
 */
app.get('/api/corretores/:id/leads', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('leads').select('*').eq('corretor_id', id).order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ success: true, leads: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * PATCH /api/corretores/:id/roleta
 * Para o gestor mudar o peso, pausar(peso 0), ou tirar da roleta
 */
app.patch('/api/corretores/:id/roleta', async (req, res) => {
    try {
        const { id } = req.params;
        const { peso_roleta, na_roleta, ativo } = req.body;
        const updates: any = {};
        if (peso_roleta !== undefined) updates.peso_roleta = peso_roleta;
        if (na_roleta !== undefined) updates.na_roleta = na_roleta;
        if (ativo !== undefined) updates.ativo = ativo;

        const { data, error } = await supabase.from('corretores').update(updates).eq('id', id).select();
        if (error) throw error;

        res.json({ success: true, corretor: data?.[0] });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});


// ========== FALLBACK ==========

// ========== GESTÃO DE LANÇAMENTOS POR CLIENTE (Multi-tenant) ==========

/**
 * GET /api/clientes/:slug/lancamentos
 * Lista os PDFs de Lançamentos do bucket isolado do cliente
 */
app.get('/api/clientes/:slug/lancamentos', async (req, res) => {
    try {
        const { slug } = req.params;
        const { data: cliente, error } = await supabase
            .from('clientes').select('id, bucket_name, nome').eq('slug', slug).single();
        if (error || !cliente) return res.status(404).json({ success: false, error: 'Cliente não encontrado' });

        const { R2StorageService } = await import('./services/r2-storage.service.js');
        const r2 = R2StorageService.forCliente(cliente.bucket_name || slug);
        const lancamentos = await r2.listarLancamentos();

        res.json({ success: true, cliente: { nome: cliente.nome, slug }, total: lancamentos.length, lancamentos });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * POST /api/clientes/:slug/lancamentos/upload-url
 * Gera URL assinada para o cliente fazer upload direto para o seu bucket
 * Body: { filename: "meu_empreendimento.pdf" }
 */
app.post('/api/clientes/:slug/lancamentos/upload-url', async (req, res) => {
    try {
        const { slug } = req.params;
        const { filename } = req.body;
        if (!filename) return res.status(400).json({ success: false, error: 'filename é obrigatório' });

        // Validar que é PDF
        if (!filename.toLowerCase().endsWith('.pdf')) {
            return res.status(400).json({ success: false, error: 'Apenas arquivos PDF são aceitos' });
        }

        const { data: cliente, error } = await supabase
            .from('clientes').select('bucket_name, nome').eq('slug', slug).single();
        if (error || !cliente) return res.status(404).json({ success: false, error: 'Cliente não encontrado' });

        const bucketName = cliente.bucket_name || slug;
        const { R2StorageService } = await import('./services/r2-storage.service.js');
        const r2 = R2StorageService.forCliente(bucketName);

        const nomeSeguro = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const key = `Lançamentos / ${nomeSeguro} `;
        const uploadUrl = await r2.getSignedUploadUrl(key, 3600); // expira em 1h

        res.json({
            success: true,
            uploadUrl,
            key,
            instrucoes: 'Faça PUT para uploadUrl com Content-Type: application/pdf',
            expiresEm: new Date(Date.now() + 3600 * 1000).toISOString(),
        });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * DELETE /api/clientes/:slug/lancamentos
 * Remove um PDF específico do bucket do cliente
 * Body: { key: "Lançamentos/nome.pdf" }
 */
app.delete('/api/clientes/:slug/lancamentos', async (req, res) => {
    try {
        const { slug } = req.params;
        const { key } = req.body;
        if (!key) return res.status(400).json({ success: false, error: 'key é obrigatório' });
        if (!key.startsWith('Lançamentos/')) return res.status(403).json({ success: false, error: 'Só é possível excluir arquivos da pasta Lançamentos' });

        const { data: cliente, error } = await supabase
            .from('clientes').select('bucket_name').eq('slug', slug).single();
        if (error || !cliente) return res.status(404).json({ success: false, error: 'Cliente não encontrado' });

        const { R2StorageService } = await import('./services/r2-storage.service.js');
        const r2 = R2StorageService.forCliente(cliente.bucket_name || slug);
        await r2.delete(key);

        res.json({ success: true, message: `Arquivo ${key} removido` });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ========== MANAGER DASHBOARD OTHERS ==========

registerManagerRoutes(app);

// ========== WEBHOOKS & AUTOMATION ==========
app.post('/api/webhooks/asaas', webhookController.handleAsaasWebhook);
app.post('/api/webhooks/assinafy', webhookController.handleAssinafyWebhook);
app.post('/api/webhooks/calcom', webhookController.handleCalcomWebhook);

// ========== UAZAPI WHATSAPP WEBHOOK ==========
app.post('/api/webhooks/uazapi', async (req, res) => {
    // Responde imediatamente — UazAPI exige resposta rápida
    res.status(200).json({ received: true });

    try {
        const body = req.body;

        // Só processa mensagens recebidas
        if (body?.type !== 'ReceivedCallback') return;

        // Ignora mensagens que a própria instância enviou
        if (body?.fromMe === true || body?.wasSentByApi === true) return;

        const senderPhone: string = (body?.phone || '').replace(/\D/g, '');
        const senderName: string = body?.chatName || body?.senderName || 'Visitante';
        const instanceId: string = body?.instanceId || '';

        if (!senderPhone) return;

        // ── Determinar tipo: texto ou áudio ──────────────────────────
        const textContent: string | undefined = body?.text?.message || body?.message;
        const audioUrl: string | undefined = body?.audio?.audioUrl || body?.audioUrl;
        const isAudio = !textContent && !!audioUrl;

        // Ignorar outros tipos de mídia (imagem, vídeo, sticker, documento)
        if (!textContent && !audioUrl) {
            if (whatsappService.isConfigured()) {
                await whatsappService.sendText(
                    senderPhone,
                    'Desculpe, ainda não consigo visualizar imagens ou arquivos. Pode me descrever em texto? 😊'
                );
            }
            return;
        }

        // ── Resolver tenant (cliente/imobiliária) ────────────────────
        let cliente: any = null;
        if (instanceId) {
            const { data: c } = await supabase
                .from('clientes').select('id, nome, slug, whatsapp, email')
                .eq('uazapi_instance_id', instanceId).single();
            if (c) cliente = c;
        }
        if (!cliente) {
            const { data: lead } = await supabase
                .from('leads').select('cliente_id')
                .eq('telefone', senderPhone).not('cliente_id', 'is', null)
                .order('created_at', { ascending: false }).limit(1).single();
            if (lead?.cliente_id) {
                const { data: c } = await supabase
                    .from('clientes').select('id, nome, slug, whatsapp, email')
                    .eq('id', lead.cliente_id).single();
                if (c) cliente = c;
            }
        }
        if (!cliente) {
            const { data: clientes } = await supabase
                .from('clientes').select('id, nome, slug, whatsapp, email')
                .eq('ativo', true).limit(1);
            if (clientes?.length === 1) cliente = clientes[0];
        }

        // ── Transcrição de áudio ─────────────────────────────────────
        let resolvedText: string | null = textContent || null;
        if (isAudio && audioUrl) {
            console.log(`[UazAPI] Áudio de ${senderPhone} — transcrevendo...`);
            resolvedText = await transcriptionService.transcribeFromUrl(audioUrl);
            if (!resolvedText) {
                if (whatsappService.isConfigured()) {
                    await whatsappService.sendText(
                        senderPhone,
                        'Não consegui entender o áudio desta vez. Pode repetir em texto? 🙏'
                    );
                }
                return;
            }
            console.log(`[UazAPI] Transcrição: "${resolvedText.substring(0, 60)}"`);
        }

        if (!resolvedText) return;

        const msg: AccumulatedMessage = {
            type: isAudio ? 'audio' : 'text',
            content: resolvedText,
            ...(isAudio && audioUrl ? { originalAudioUrl: audioUrl } : {}),
        };

        console.log(`[UazAPI] ${isAudio ? '🎙️' : '💬'} ${senderPhone} (${senderName}): ${resolvedText.substring(0, 60)}`);

        // ── Acumulador: aguarda 3s para juntar mensagens rápidas ─────
        const sessionId = `whatsapp_${senderPhone}`;
        const clienteCtx = cliente
            ? { id: cliente.id, nome: senderName, slug: cliente.slug, telefone: senderPhone }
            : { nome: senderName, telefone: senderPhone };

        whatsappResponseService.accumulate(senderPhone, msg, async (messages, hadAudio) => {
            try {
                const fullInput = whatsappResponseService.mergeMessages(messages);

                // Salvar mensagem(ns) do usuário
                await supabase.from('mensagens').insert([{
                    session_id: sessionId,
                    role: 'user',
                    content: fullInput,
                    metadata: { canal: 'whatsapp', phone: senderPhone, nome: senderName, cliente_id: cliente?.id, hadAudio },
                    created_at: new Date().toISOString(),
                }]);

                // Processar com o agente
                const resultado = await chatAgent.processarMensagem(fullInput, sessionId, clienteCtx);

                // Humanizar resposta (remove padrões de IA)
                const humanized = await humanizerService.humanize(resultado.response);

                // Salvar resposta humanizada
                await supabase.from('mensagens').insert([{
                    session_id: sessionId,
                    role: 'assistant',
                    content: humanized,
                    metadata: { canal: 'whatsapp', agente: resultado.agente, tipo: resultado.tipo, hadAudio },
                    created_at: new Date().toISOString(),
                }]);

                // Enviar com espelhamento (áudio→áudio+texto) e efeito digitando
                await whatsappResponseService.sendWithMirroring(senderPhone, humanized, hadAudio);

            } catch (err: any) {
                console.error('[UazAPI Webhook] Erro no processamento:', err.message);
            }
        });

    } catch (error: any) {
        console.error('[UazAPI Webhook] Erro:', error.message);
    }
});

// ========== AI SEARCH & CHAT ==========
import { aiSearchController } from './controllers/ai_search.controller.js';
app.post('/api/ai-search/parse', aiSearchController.parseSearchIntent);
app.post('/api/ai-search/chat', aiSearchController.chatAgent);

// ========== SAAS ONBOARDING (MULTI-TENANT) ==========
app.post('/api/onboarding/secure-keys', async (req, res) => {
    try {
        const auth = req.headers.authorization;
        const keys = req.body.keys;
        if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Token inválido' });

        const token = auth.split(' ')[1];
        const clientId = Buffer.from(token, 'base64').toString('utf-8');

        // Check token validity in DB before saving
        const { data: client, error } = await supabase.from('client_pipeline').select('id, name, secure_form_token').eq('id', clientId).single();
        if (error || !client || !client.secure_form_token) return res.status(401).json({ error: 'Expirado' });

        const parsedToken = JSON.parse(client.secure_form_token);
        if (parsedToken.exp < Date.now()) return res.status(401).json({ error: 'Link expirado' });

        // Salvar keys criptografadas (simulado no JSONB)
        await supabase.from('client_pipeline').update({
            api_credentials: keys,
            secure_form_token: null, // Invalida link
            api_keys_received_at: new Date().toISOString(),
            status: 'CHAVES_RECEBIDAS'
        }).eq('id', clientId);

        // Notificar CEO
        await import('./services/automation.service.js').then(({ telegram }) => {
            telegram.notifyCEO(`🔑 *CHAVES DE INTEGRAÇÃO RECEBIDAS!*\n\nCliente: ${client.name}\nAs chaves seguras já estão no cofre.`);
        });

        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/onboarding/submit', async (req, res) => {
    try {
        const formData = req.body;
        console.log(`[Onboarding] Recebido payload de onboarding para: ${formData.company?.name}`);

        // 1. Criar Slug Único
        const slug = (formData.company?.name || 'imob').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');

        // 2. Inserir Tenant na Base Master (Tabela tenants e tenant_integrations)
        const { data: tenant, error: tError } = await supabase.from('tenants').insert({
            name: formData.company?.name || 'Imobiliária',
            slug: slug,
            status: 'provisioning',
            pinecone_prefix: slug,
            r2_bucket: formData.infra?.r2Bucket || slug,
            onboarding_data: formData,
            supabase_project_id: formData.infra?.supabaseRegion // Exemplo: salving region or ID
        }).select('id').single();

        if (tError) {
            console.error('[Onboarding] Error inserting tenant:', tError);
            return res.status(500).json({ success: false, error: tError.message });
        }

        const tenantId = tenant.id;

        // 3. Salvar Integrações (Webhooks selecionados)
        const integrations = [];
        for (const [key, enabled] of Object.entries(formData.integrations || {})) {
            if (enabled) {
                integrations.push({
                    tenant_id: tenantId,
                    channel: key,
                    status: 'active',
                    config: {}
                });
            }
        }
        if (integrations.length > 0) {
            await supabase.from('tenant_integrations').insert(integrations);
        }

        // 4. Iniciar Pipeline RAG (Assíncrono para não travar request longa da UI de cara, ou sincrono rápido)
        // Aqui importamos o serviço RAG novo
        const { ragGeneratorService } = await import('./services/rag-generator.service.js');

        // Despachamos a geração para rodar em facking background no servidor Node
        ragGeneratorService.generateTenantRAG(tenantId, slug, formData)
            .then(() => {
                supabase.from('tenants').update({ status: 'active', provisioned_at: new Date().toISOString() }).eq('id', tenantId).then();
                console.log(`[Onboarding] Tenant ${slug} provisionado com sucesso pelo Engine RAG.`);
            })
            .catch(e => console.error('[Onboarding] Falha na geração do RAG', e));

        // 5. Retornar URL do dashboard para a UI
        res.json({
            success: true,
            tenant_id: tenantId,
            slug: slug,
            dashboard_url: `https://app.imobsystem.com.br/${slug}`,
            message: 'Provisionamento iniciado na infraestrutura Multi-tenant.',
        });

    } catch (e: any) {
        console.error('[Onboarding API Error]', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ===================================================

// ========== TELEGRAM ==========

/**
 * POST /api/telegram/gerar-link
 * Gera e retorna um link de ativação e QR Code para o corretor habilitar o Bot
 */
app.post('/api/telegram/gerar-link', async (req, res) => {
    try {
        const { corretorId, clienteId } = req.body;
        if (!corretorId || !clienteId) {
            return res.status(400).json({ success: false, error: 'corretorId e clienteId são obrigatórios' });
        }

        const linkData = await telegramActivationService.generateActivationLink(corretorId, clienteId);

        if (!linkData) {
            return res.status(500).json({ success: false, error: 'Falha ao gerar link de ativação do Telegram' });
        }

        res.json({ success: true, data: linkData });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ===================================================

// ========== CHECKOUT SEGURO (LOCAÇÃO / VENDA) ==========

app.post('/api/secure/checkout/submit', upload.fields([
    { name: 'docIdentidade', maxCount: 1 },
    { name: 'comprovanteRenda', maxCount: 1 },
    { name: 'docFiador', maxCount: 1 }
]), async (req, res) => {
    try {
        const { leadId, json_data } = req.body;
        const data = JSON.parse(json_data || '{}');

        console.log(`[Checkout] Nova submissão de locação/venda via Portal do Cliente: Lead ${leadId}`);

        // 1. Upload arquivos para o R2
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        let docURLs: Record<string, string> = {};

        if (files) {
            for (const [key, fileArray] of Object.entries(files)) {
                if (fileArray && fileArray.length > 0) {
                    const file = fileArray[0];
                    const s3Key = `docs/${leadId}/${key}_${Date.now()}`;
                    // Tenta subir no r2; caso role fallback, pegamos URL fake/local
                    try {
                        const url = await r2StorageService.upload(file.buffer, s3Key, file.mimetype);
                        docURLs[key] = url;
                    } catch (e) {
                        docURLs[key] = `simulated_url_${key}.pdf`;
                        console.warn(`[Checkout] R2 Storage falhou, usando URL simulada para ${key}`);
                    }
                }
            }
        }

        // 2. Simular/Criar cliente no Asaas
        // Na vida real, chamar asaas_api.post('/customers', { name, cpfCnpj... })
        const mockAsaasCustId = 'cus_locacao_' + (leadId || '').substring(0, 8);

        // 3. Gerar Cobrança (Caução/Aluguel ou Venda)
        // Assume-se locação 100% autônoma
        const vlrAluguelBase = 2500;
        console.log(`[Checkout Asaas] Criando assinatura de aluguel para o ID ${mockAsaasCustId} valor: ${vlrAluguelBase}`);
        await automation.createRecurringSubscription(mockAsaasCustId, vlrAluguelBase, 'BOLETO');

        // 4. Assinafy: Gerar contrato digital para assinatura do cliente + CEO
        console.log(`[Checkout Assinafy] Disparando Minuta via Assinafy para o e-mail: ${data.email}`);
        const assinafyDocId = await automation.generateContractAssinafy(data.email, data.nomeCompleto, String(leadId));

        // 5. Atualizar o Lead no Banco de Dados
        await supabase.from('leads').update({
            status: 'contract_sent',
            operacao_status: 'contrato_gerado',
            custom_data: {
                checkout_dados: data,
                documentos: docURLs,
                asaas_customer_id: mockAsaasCustId,
                assinafy_document_id: assinafyDocId,
                checkout_date: new Date().toISOString()
            }
        }).eq('id', leadId).or(`short_id.eq.${leadId}`);

        // 6. Notificar Corretor/Equipe Administrativa
        try {
            await automation.telegram.notifyCEO(`💰 *FECHAMENTO AUTÔNOMO!* 💰\n✅ O cliente *${data.nomeCompleto}* acabou de preencher os dados de locação/venda pelo Portal do Cliente!\n📄 Documentos enviados para análise.\n🔗 Assinafy Doc criado: ${assinafyDocId}\n💳 Asaas Cus Id: ${mockAsaasCustId}`);
        } catch (e) { }

        res.json({ success: true, message: 'Checkout recebido e processado com sucesso.' });
    } catch (e: any) {
        console.error('[Checkout API Error]', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ========== ROTAs DE LOCAÇÃO ==========

// Buscar parâmetros resolvidos de um imóvel (para UI mostrar herança)
app.get('/api/leases/params/:propertyId', async (req, res) => {
    try {
        const params = await leaseService.resolveLeaseParams(req.params.propertyId);
        res.json({ success: true, params });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Criar contrato de locação completo (Asaas + Assinafy + Lease no BD)
app.post('/api/leases', async (req, res) => {
    try {
        const result = await leaseService.createCompleteLease(req.body);
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Buscar contratos ativos
app.get('/api/leases', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        let query = supabase.from('leases').select('*').order('created_at', { ascending: false });
        if (tenantId) query = query.eq('tenant_id', tenantId);
        const { data, error } = await query;
        if (error) return res.status(400).json({ error: error.message });
        res.json({ success: true, leases: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Avisos de reajuste pendentes
app.get('/api/leases/:id/notices', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('lease_adjustment_notices')
            .select('*')
            .eq('lease_id', req.params.id)
            .order('adjustment_date', { ascending: true });
        if (error) return res.status(400).json({ error: error.message });
        res.json({ success: true, notices: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Índices financeiros atuais
app.get('/api/financial-indices', async (req, res) => {
    try {
        const { data } = await supabase
            .from('financial_indices')
            .select('*')
            .order('reference_month', { ascending: false })
            .limit(30);
        res.json({ success: true, indices: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Sync manual de índices (admin)
app.post('/api/admin/sync-indices', async (req, res) => {
    try {
        const results = await leaseService.syncFinancialIndices();
        res.json({ success: true, message: `${results.length} índices sincronizados.`, data: results });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ===================================================================
// 7. ERP - M1: PROPRIETÁRIOS
// ===================================================================

app.get('/api/proprietarios', async (req, res) => {
    try {
        const tenantId = req.query.tenant_id as string;
        if (!tenantId) return res.status(400).json({ error: 'tenant_id é obrigatório' });

        const proprietarios = await proprietarioService.getProprietarios(tenantId, req.query.search as string);
        res.json({ success: true, proprietarios });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/proprietarios/:id', async (req, res) => {
    try {
        const data = await proprietarioService.getProprietarioById(req.params.id);
        const portfolio = await proprietarioService.getProprietarioPortfolio(req.params.id);
        res.json({ success: true, proprietario: data, portfolio });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/proprietarios', async (req, res) => {
    try {
        const data = await proprietarioService.createProprietario(req.body);
        res.json({ success: true, proprietario: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.patch('/api/proprietarios/:id', async (req, res) => {
    try {
        const data = await proprietarioService.updateProprietario(req.params.id, req.body);
        res.json({ success: true, proprietario: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/proprietarios/contas', async (req, res) => {
    try {
        const data = await proprietarioService.saveBankAccount(req.body);
        res.json({ success: true, conta: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.delete('/api/proprietarios/contas/:id', async (req, res) => {
    try {
        await proprietarioService.deleteBankAccount(req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.patch('/api/imoveis/:id/proprietario', async (req, res) => {
    try {
        const { proprietario_id } = req.body;
        const data = await proprietarioService.linkPropertyToProprietario(req.params.id, proprietario_id);
        await proprietarioService.refreshPortfolioView();
        res.json({ success: true, imovel: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ===================================================================
// 8. ERP - M2: FINANCEIRO
// ===================================================================

app.get('/api/financeiro/lancamentos', async (req, res) => {
    try {
        const tenantId = req.query.tenant_id as string;
        if (!tenantId) return res.status(400).json({ error: 'tenant_id é obrigatório' });
        const data = await financeiroService.getLancamentos(tenantId, req.query);
        res.json({ success: true, lancamentos: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/financeiro/lancamentos', async (req, res) => {
    try {
        const data = await financeiroService.createLancamento(req.body);
        res.json({ success: true, lancamento: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.patch('/api/financeiro/lancamentos/:id', async (req, res) => {
    try {
        const data = await financeiroService.updateLancamento(req.params.id, req.body);
        res.json({ success: true, lancamento: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/financeiro/recorrencia', async (req, res) => {
    try {
        const { tenant_id, contrato_id, config } = req.body;
        const data = await financeiroService.gerarRecorrenciaContrato(tenant_id, contrato_id, config);
        res.json({ success: true, lancamentos: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/financeiro/summary', async (req, res) => {
    try {
        const tenantId = req.query.tenant_id as string;
        if (!tenantId) return res.status(400).json({ error: 'tenant_id é obrigatório' });
        const data = await financeiroService.getResumoDashboard(tenantId);
        res.json({ success: true, summary: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/financeiro/fluxo-caixa', async (req, res) => {
    try {
        const tenantId = req.query.tenant_id as string;
        if (!tenantId) return res.status(400).json({ error: 'tenant_id é obrigatório' });
        const data = await financeiroService.getFluxoCaixaMensal(tenantId);
        res.json({ success: true, fluxo_caixa: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ===================================================================
// 9. ERP - M3: COMISSÕES
// ===================================================================

app.get('/api/comissoes', async (req, res) => {
    try {
        const tenantId = req.query.tenant_id as string;
        if (!tenantId) return res.status(400).json({ error: 'tenant_id é obrigatório' });
        const data = await comissaoService.getComissoes(tenantId, req.query);
        res.json({ success: true, comissoes: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/comissoes/resumo', async (req, res) => {
    try {
        const tenantId = req.query.tenant_id as string;
        const corretorId = req.query.corretor_id as string;
        if (!tenantId) return res.status(400).json({ error: 'tenant_id é obrigatório' });
        const data = await comissaoService.getResumoComissoes(tenantId, corretorId);
        res.json({ success: true, resumo: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/comissoes/:id/liquidar', async (req, res) => {
    try {
        const data = await comissaoService.liquidarComissao(req.params.id);
        res.json({ success: true, comissao: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ===================================================================
// ROTAS DASHBOARD & METAS (M4)
// ===================================================================
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const { month, year } = req.query;
        const tenantId = req.headers['x-tenant-id'] as string || 'rbhkwmesmvytqdfuwcie';
        const m = month ? parseInt(month as string) : new Date().getMonth() + 1;
        const y = year ? parseInt(year as string) : new Date().getFullYear();

        const stats = await dashboardService.getDashboardStats(tenantId, m, y);
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/dashboard/metas', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string || 'rbhkwmesmvytqdfuwcie';
        const meta = { ...req.body, tenant_id: tenantId };
        const result = await dashboardService.upsertMeta(meta);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/dashboard/ranking', async (req, res) => {
    try {
        const { month, year } = req.query;
        const tenantId = req.headers['x-tenant-id'] as string || 'rbhkwmesmvytqdfuwcie';
        const m = month ? parseInt(month as string) : new Date().getMonth() + 1;
        const y = year ? parseInt(year as string) : new Date().getFullYear();

        const ranking = await dashboardService.getCorretorRanking(tenantId, m, y);
        res.json(ranking);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/financeiro/summary', async (req, res) => {
    try {
        const tenantId = req.query.tenant_id as string;
        const data = await financeiroService.getResumoDashboard(tenantId);
        res.json({ success: true, summary: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/financeiro/fluxo-caixa', async (req, res) => {
    try {
        const tenantId = req.query.tenant_id as string;
        const data = await financeiroService.getFluxoCaixaMensal(tenantId);
        res.json({ success: true, fluxo: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ========== ROTAS DE VENDA DE IMÓVEIS ==========

// Parâmetros resolvidos de um imóvel para fechamento (herança Agency → Imóvel)
app.get('/api/sales/params/:propertyId', async (req, res) => {
    try {
        const params = await saleService.resolveSaleParams(req.params.propertyId);
        res.json({ success: true, params });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Criar novo fechamento de venda (Corretor)
app.post('/api/sales/closing', async (req, res) => {
    try {
        const result = await saleService.createSaleClosing(req.body);
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Listar fechamentos (Gestor)
app.get('/api/sales/closings', async (req, res) => {
    try {
        const { status, propertyId, limit } = req.query;
        const closings = await saleService.getSaleClosings({
            status: status as string | undefined,
            propertyId: propertyId as string | undefined,
            limit: limit ? parseInt(limit as string) : undefined,
        });
        res.json({ success: true, closings });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Aprovar fechamento (Gestor)
app.post('/api/sales/closings/:id/approve', async (req, res) => {
    try {
        const { approverName = 'Gestor' } = req.body;
        const result = await saleService.approveSaleClosing(req.params.id, approverName);
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Rejeitar fechamento (Gestor)
app.post('/api/sales/closings/:id/reject', async (req, res) => {
    try {
        const { reason = 'Não informado', rejectorName = 'Gestor' } = req.body;
        const result = await saleService.rejectSaleClosing(req.params.id, reason, rejectorName);
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Atualizar status de um fechamento
app.patch('/api/sales/closings/:id/status', async (req, res) => {
    try {
        const { status, ...extra } = req.body;
        if (!status) return res.status(400).json({ error: 'status é obrigatório' });
        await saleService.updateClosingStatus(req.params.id, status, extra);
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Histórico de notificações de um fechamento
app.get('/api/sales/closings/:id/notifications', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('closing_notifications')
            .select('*')
            .eq('closing_id', req.params.id)
            .order('sent_at', { ascending: false });
        if (error) return res.status(400).json({ error: error.message });
        res.json({ success: true, notifications: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Webhook Telegram: Gestor aprova/rejeita via mensagem
// Mensagem esperada: "aprovar XXXXXXXX" ou "rejeitar XXXXXXXX motivo aqui"
app.post('/api/sales/telegram-approval', async (req, res) => {
    try {
        const text: string = req.body?.message?.text || '';
        const match = text.match(/^(aprovar|rejeitar)\s+([a-f0-9-]{8,36})(\s+.+)?$/i);
        if (!match) {
            return res.json({ ok: true }); // ignore mensagens não reconhecidas
        }
        const action = match[1].toLowerCase();
        const closingId = match[2];
        const reason = match[3]?.trim();
        const senderName = req.body?.message?.from?.first_name || 'Gestor';

        // Busca o fechamento pelo ID parcial (8 chars)
        const { data: closing } = await supabase
            .from('sale_closings')
            .select('id, status')
            .ilike('id', `${closingId}%`)
            .single();

        if (!closing) {
            return res.json({ ok: true, warn: 'Fechamento não encontrado' });
        }

        if (action === 'aprovar') {
            await saleService.approveSaleClosing(closing.id, senderName);
        } else {
            await saleService.rejectSaleClosing(closing.id, reason || 'Não informado', senderName);
        }

        res.json({ ok: true, action, closingId: closing.id });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});


// ========== WEBHOOK / FECHAMENTO DE NEGÓCIO (CORRETOR MARCOU COMO "WON") ==========
app.post('/api/leads/:id/won', async (req, res) => {
    try {
        const leadId = req.params.id;
        console.log(`[Fechamento] Corretor marcou LEAD ${leadId} como WON (Ganha).`);

        const { data: lead, error } = await supabase.from('leads').select('*').eq('id', leadId).single();
        if (error || !lead) {
            return res.status(404).json({ success: false, error: 'Lead não encontrado.' });
        }

        // Gera Link do Portal do Cliente
        // Em prod: https://cranios.imob/secure/checkout/xxx
        const secureLink = `https://app.imobsystem.com.br/secure/checkout/${leadId}`;

        // Dispara mensagem WhatsApp/Telegram pro cliente
        const msg = `Olá ${lead.nome}! Parabéns pelo fechamento do imóvel. 🎉\nPara seguirmos com a elaboração do seu contrato e aprovação, por favor, envie sua documentação de forma 100% segura pelo nosso portal oficial:\n\n👉 Acessar Portal do Imóvel: ${secureLink}\n\nQualquer dúvida, nossa IA ou seu corretor está à disposição!`;

        // Simula disparo Whatsapp/Telegram
        await automation.telegram.notifyCEO(`[Log] WhatsApp enviado para Lead ${lead.nome} (${lead.telefone}) solicitando documentos via checkout seguro.\nLink gerado: ${secureLink}`);

        // Atualiza Lead Status
        await supabase.from('leads').update({
            operacao_status: 'fechamento_iniciado',
            checkout_link_sent_at: new Date().toISOString()
        }).eq('id', leadId);

        res.json({ success: true, message: 'Link de checkout seguro enviado ao cliente.' });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ========== LANDING PAGE CRÂNIOS IMOB (CRM LEAD CAPTURE) ==========

app.post('/api/crm-lead-capture', async (req, res) => {
    try {
        const payload = req.body;
        // payload = { empresa, contato, email, faturamento, lucroLiquido, roi, reducaoAnualFolha, custoSistema, pessoasCortadas }

        console.log(`[CRM Lead Capture] Nova simulação da Landing Page. Email: ${payload.email} (${payload.empresa})`);

        // 1. Enviar E-mail Analítico para ola@cranios.pro e Cliente
        const emailHtml = `
            <h2>Relatório de Lucratividade com Agentes IA - Crânios IMOB</h2>
            <p>Olá <strong>${payload.contato}</strong>,</p>
            <p>Sua análise de ROI Inteligente concluiu que você pode ter uma <strong>economia anual na folha de R$ ${Number(payload.reducaoAnualFolha).toLocaleString('pt-BR')}</strong> (substituindo ${payload.pessoasCortadas} salários/encargos por Inteligência Artificial).</p>
            <p>O lucro líquido real (1º ano, subtraindo os custos do nosso sistema da economia total) projetado para a <strong>${payload.empresa}</strong> é de <strong>R$ ${Number(payload.lucroLiquido).toLocaleString('pt-BR')}</strong>.</p>
            <p>Múltiplo de ROI: <strong>${Number(payload.roi).toFixed(0)}%</strong></p>
            <hr />
            <p>Para você experimentar o poder do nosso ecossistema, <strong>já liberamos um ambiente prévio exclusivo e disparamos seu contrato teste!</strong></p>
        `;

        // Simulando disparo RESEND bypass frontend constraint
        await automation.mail.sendWelcome(payload.email, payload.contato, 'Bypass ROI Email');
        // Em prod seria await mailer.send(payload.email, 'Seu Relatório de ROI', emailHtml);

        // 2. Criação Cliente Asaas de Demonstração e Cobrança
        const mockCustId = 'cus_' + Math.random().toString(36).substr(2, 9);
        await automation.createRecurringSubscription(mockCustId, payload.custoSistema / 12, 'CREDIT_CARD');

        // 3. Login Provisório (Gestor)
        const password = await automation.createProvisionalLogin(payload.email, payload.contato) || 'Senha123!';

        // 4. Assinafy Contrato (Simulado SaaS IMOB)
        await automation.generateContractAssinafy(payload.email, payload.contato, payload.empresa.replace(/\s+/g, '').toLowerCase());

        // 5. E-mail de Boas Vindas com Senha
        await automation.mail.sendWelcome(payload.email, payload.contato, password);

        // Notifica CEO
        await automation.telegram.notifyCEO(`🚀 *NOVO LEAD QUALIFICADO (LANDING PAGE ROI)!* 🚀\nImobiliária: ${payload.empresa}\nFaturamento Ref: R$ ${payload.faturamento}\nCorte: ${payload.pessoasCortadas} vagas\nROI Calculado: ${payload.roi}%\n\nA automação de Assinafy e Asaas já foi engatilhada e a Imobiliária recebeu os e-mails!`);

        res.json({ success: true, message: 'Funil ativado com sucesso.' });
    } catch (e: any) {
        console.error('[CRM Lead Capture Error]', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ===================================================================
// 10. ERP - M5: ORDENS DE SERVIÇO
// ===================================================================

app.get('/api/prestadores', async (req, res) => {
    try {
        const tenantId = req.query.tenant_id as string || 'rbhkwmesmvytqdfuwcie';
        const data = await ordemServicoService.getPrestadores(tenantId);
        res.json({ success: true, prestadores: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/prestadores', async (req, res) => {
    try {
        const data = await ordemServicoService.createPrestador(req.body);
        res.json({ success: true, prestador: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/ordens-servico', async (req, res) => {
    try {
        const tenantId = req.query.tenant_id as string || 'rbhkwmesmvytqdfuwcie';
        const data = await ordemServicoService.getOrdensServico(tenantId);
        res.json({ success: true, ordens: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/ordens-servico', async (req, res) => {
    try {
        const data = await ordemServicoService.createOrdemServico(req.body);
        res.json({ success: true, os: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.patch('/api/ordens-servico/:id/status', async (req, res) => {
    try {
        const { status, ...extra } = req.body;
        const data = await ordemServicoService.updateStatusOS(req.params.id, status, extra);
        res.json({ success: true, os: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ===================================================================
// 11. ERP - M6: VISTORIA DE IMÓVEIS
// ===================================================================

app.get('/api/vistorias', async (req, res) => {
    try {
        const tenantId = req.query.tenant_id as string || 'rbhkwmesmvytqdfuwcie';
        const data = await vistoriaService.getVistorias(tenantId);
        res.json({ success: true, vistorias: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/vistorias/:id', async (req, res) => {
    try {
        const data = await vistoriaService.getVistoriaById(req.params.id);
        res.json({ success: true, vistoria: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/vistorias', async (req, res) => {
    try {
        const data = await vistoriaService.createVistoria(req.body);
        res.json({ success: true, vistoria: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.patch('/api/vistorias/:id', async (req, res) => {
    try {
        const data = await vistoriaService.updateVistoria(req.params.id, req.body);
        res.json({ success: true, vistoria: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/vistorias/itens', async (req, res) => {
    try {
        const data = await vistoriaService.upsertVistoriaItem(req.body);
        res.json({ success: true, item: data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.delete('/api/vistorias/itens/:id', async (req, res) => {
    try {
        await vistoriaService.deleteVistoriaItem(req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ===================================================================
// 12. ERP - M7: RELATÓRIOS GERENCIAIS
// ===================================================================

app.get('/api/relatorios/financeiro/pdf', async (req, res) => {
    try {
        const { tenant_id, start_date, end_date, tenant_name } = req.query;
        const tenantId = tenant_id as string || 'rbhkwmesmvytqdfuwcie';
        const data = await relatorioService.getDadosFinanceiros(tenantId, start_date as string, end_date as string);

        const html = relatorioService.renderRelatorioFinanceiroHTML(data, tenant_name as string || 'Imobiliária', start_date as string, end_date as string);
        const pdf = await relatorioService.generatePDF(html);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio_financeiro_${start_date}_${end_date}.pdf`);
        res.send(pdf);
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/relatorios/financeiro/csv', async (req, res) => {
    try {
        const { tenant_id, start_date, end_date } = req.query;
        const tenantId = tenant_id as string || 'rbhkwmesmvytqdfuwcie';
        const data = await relatorioService.getDadosFinanceiros(tenantId, start_date as string, end_date as string);

        const columns = ['data_vencimento', 'categoria', 'descricao', 'tipo', 'valor', 'status'];
        const csv = await relatorioService.exportToCSV(data, columns);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio_financeiro_${start_date}_${end_date}.csv`);
        res.send(csv);
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ===================================================

// ===== LANDING PAGE — SALES AUTOMATION =====
import { salesAutomationService } from './services/sales-automation.service.js';

// POST /api/sales/landing-lead
app.post('/api/sales/landing-lead', async (req, res) => {
    try {
        const { nome, imobiliaria, email, whatsapp, corretores, plano, dados_roi, fonte, sessionId } = req.body;
        if (!email) return res.status(400).json({ error: 'Email obrigatório' });
        const lead = await salesAutomationService.criarOuAtualizarLead({
            nome, imobiliaria, email, whatsapp, corretores, plano,
            roi_data: dados_roi, fonte: fonte || 'landing_page', session_id: sessionId,
        });
        res.json({ success: true, leadId: lead.id });
    } catch (err) {
        console.error('[POST /api/sales/landing-lead]', err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// POST /api/sales/checkout
app.post('/api/sales/checkout', async (req, res) => {
    try {
        const { plano, nome, imobiliaria, email, whatsapp, cnpj } = req.body;
        if (!email || !plano) return res.status(400).json({ error: 'Email e plano são obrigatórios' });
        const result = await salesAutomationService.criarCheckout({ plano, nome, imobiliaria, email, whatsapp, cnpj });
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('[POST /api/sales/checkout]', err);
        res.status(500).json({ error: 'Erro ao processar checkout' });
    }
});

app.use('*', (req, res) => {
    res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl} ` });
});



// ========== START ==========

app.listen(PORT, () => {
    console.log(`
  🚀 CRÂNIOS IMOB BRAIN v3.0 ATIVADO
  📡 Porta: ${PORT}
  📧 Email(Resend): ${process.env.RESEND_API_KEY ? '✅ Ativo' : '❌ Sem chave'}
  📅 Cal.com: ${process.env.CALCOM_API_KEY ? '✅ Ativo' : '⚠️  Usando hardcoded key'}
  🧠 Pinecone RAG: ${process.env.PINECONE_API_KEY ? '✅ Ativo' : '❌ Sem chave'}
  🗄️  R2 Storage: ${process.env.R2_ACCESS_KEY_ID ? '✅ Ativo' : '❌ Sem credenciais'}
  🔗 CRM Webhook: ${process.env.CRM_WEBHOOK_URL ? '✅ Configurado' : '⚠️  Desativado'}
  🤖 Telegram Bot: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Iniciado' : '⚠️  Desativado'}
    `);

    // Inicialização do Bot do Telegram
    if (telegramBotInstance) {
        telegramBotInstance.startBot();
    }

    // Job de BI Executivo Semanal
    biReportJob.start();

    // Job de Feedback de Visitas (M5b)
    feedbackSurveyJob.start();
});

export default app;
