import OpenAI from 'openai';
import { supabase } from '../config/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TicketRequest {
    tenantId: string;
    email: string;
    subject: string;
    description: string;
}

export interface TicketResponse {
    ticketId: string;
    message: string;
    selfResolveSuggestion?: string;
    aiClassification: {
        category: string;
        severity: string;
        slaHours: number;
    };
}

export class TicketService {
    /**
     * Cria um novo ticket de suporte. A IA analisa e atribui categoria,
     * severidade e tenta fornecer um "Self Resolve" quase instantâneo.
     */
    async createTicket(req: TicketRequest): Promise<TicketResponse> {
        // 1. Prompt do Agente Especialista de Triagem L1 (Suporte)
        const prompt = `
Você é um Agente de Triagem de TI (L1) para um sistema SaaS Imobiliário chamado Crânios IMOB.
Avalie o seguinte ticket enviado por um cliente:
Assunto: "${req.subject}"
Descrição: "${req.description}"

Você deve responder APENAS com um objeto JSON válido, sem markdown, contendo as exatas chaves:
{
    "category": "DÚVIDA | ERRO SISTÊMICO | FINANCEIRO | SUGESTÃO | ONBOARDING",
    "severity": "BAIXA | MÉDIA | ALTA | CRÍTICA",
    "slaHours": <numero estimado de horas para resolver: 4, 12, 24, 48>,
    "canSelfResolve": <boolean indicando se o problema pode ser resolvido com uma instrução sua>,
    "selfResolveSuggestion": "<mensagem educada orientando como resolver, ou null se precisar de humano>"
}
Responda APENAS JSON.
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2
        });

        const rawJson = completion.choices[0].message.content?.trim().replace(/```json/g, '').replace(/```/g, '') || '{}';
        let aiAnalysis: any = {};

        try {
            aiAnalysis = JSON.parse(rawJson);
        } catch (e) {
            console.error('[TicketService] Erro no Parse LLM:', rawJson);
            // Default Fallback
            aiAnalysis = {
                category: "OUTROS",
                severity: "MÉDIA",
                slaHours: 24,
                canSelfResolve: false,
                selfResolveSuggestion: null
            };
        }

        // 2. Calcula Deadline de Acordo com SLA
        const slaDeadline = new Date();
        slaDeadline.setHours(slaDeadline.getHours() + (aiAnalysis.slaHours || 24));

        // 3. Salva no Supabase
        const { data: ticket, error } = await supabase
            .from('support_tickets')
            .insert({
                tenant_id: req.tenantId,
                requester_email: req.email,
                subject: req.subject,
                description: req.description,
                ai_category: aiAnalysis.category,
                ai_severity: aiAnalysis.severity,
                ai_sla_deadline: slaDeadline.toISOString(),
                status: aiAnalysis.canSelfResolve ? 'WAITING_USER_CONFIRMATION' : 'OPEN'
            })
            .select('id')
            .single();

        if (error || !ticket) {
            console.error('[TicketService] Erro ao gravar ticket DB:', error);
            throw new Error('Falha sistêmica ao registrar ticket.');
        }

        return {
            ticketId: ticket.id,
            message: 'Ticket registrado e analisado com sucesso.',
            selfResolveSuggestion: aiAnalysis.canSelfResolve ? aiAnalysis.selfResolveSuggestion : undefined,
            aiClassification: {
                category: aiAnalysis.category,
                severity: aiAnalysis.severity,
                slaHours: aiAnalysis.slaHours
            }
        };
    }
}

export const ticketService = new TicketService();
