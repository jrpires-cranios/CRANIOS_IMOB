import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM || 'noreply@cranios.pro';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Crânios IMOB';

export interface OnboardingEmailData {
    nome: string;
    email: string;
    slug: string;
    plano: string;
    nomeAgentes: {
        vendas?: string;
        juridico?: string;
        atendimento?: string;
        concierge?: string;
        vistorias?: string;
    };
    bucketUrl?: string;
    trialDias?: number;
}

export interface AgendamentoEmailData {
    nome: string;
    email: string;
    imovelTitulo: string;
    data: string;
    hora: string;
    bookingUrl?: string;
    tipoAgendamento: 'visita_corretor' | 'entrega_chaves' | 'servico_reparo';
}

export interface LeadNotificacaoData {
    corretorEmail: string;
    corretorNome: string;
    leadNome: string;
    leadTelefone: string;
    leadInteresse: string;
    mensagemOriginal: string;
    nivelQualificacao: 'frio' | 'morno' | 'quente';
    imovelTitulo?: string;
}

export interface BriefingEmailData {
    corretorEmail: string;
    corretorNome: string;
    leadNome: string;
    leadTelefone: string;
    dataHoraVisita?: string;
    imovelTitulo?: string;
    briefing: {
        resumo: string;
        temperatura: string;
        persona: string;
        objecoes: string;
        abordagens: string;
    };
}

export interface ConviteCorretorData {
    corretorEmail: string;
    corretorNome: string;
    empresaNome: string;
    linkConvite: string;
}

export class EmailService {

    /**
     * Email de boas-vindas ao cliente onboardado
     */
    async enviarWelcomeOnboarding(data: OnboardingEmailData): Promise<boolean> {
        const agentesHtml = Object.entries(data.nomeAgentes)
            .filter(([_, nome]) => nome)
            .map(([funcao, nome]) => {
                const funcaoLabel: Record<string, string> = {
                    vendas: '🏠 Agente de Vendas',
                    juridico: '⚖️ Agente Jurídico',
                    atendimento: '💬 Atendimento',
                    concierge: '🔑 Concierge',
                    vistorias: '📋 Vistorias',
                };
                return `<tr>
                    <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#666">${funcaoLabel[funcao] || funcao}</td>
                    <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#333">${nome}</td>
                </tr>`;
            }).join('');

        try {
            await resend.emails.send({
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                to: data.email,
                subject: `🚀 Bem-vindo ao Crânios IMOB, ${data.nome}!`,
                html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9">
    <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:40px;text-align:center">
        <h1 style="color:white;margin:0;font-size:28px">🧠 Crânios IMOB</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Inteligência Artificial para Imobiliárias</p>
    </div>
    
    <div style="background:white;padding:32px;border-radius:0 0 12px 12px">
        <h2 style="color:#333">Olá, ${data.nome}! 🎉</h2>
        <p style="color:#555;line-height:1.6">
            Sua conta foi criada com sucesso no <strong>Crânios IMOB</strong>. 
            Seus agentes de IA exclusivos estão configurados e prontos para trabalhar!
        </p>
        
        <div style="background:#f8f9ff;border-radius:8px;padding:20px;margin:24px 0">
            <h3 style="color:#667eea;margin:0 0 16px">🤖 Seus Agentes Exclusivos</h3>
            <table style="width:100%;border-collapse:collapse">
                ${agentesHtml}
            </table>
        </div>
        
        <div style="background:#f0fff4;border-left:4px solid #22c55e;padding:16px;border-radius:4px;margin:24px 0">
            <strong style="color:#15803d">✅ Plano:</strong> <span style="color:#333">${data.plano}</span><br>
            ${data.trialDias ? `<strong style="color:#15803d">⏱️ Trial:</strong> <span style="color:#333">${data.trialDias} dias gratuitos</span><br>` : ''}
            <strong style="color:#15803d">🔗 Seu slug:</strong> <span style="color:#333">${data.slug}</span>
        </div>

        <p style="color:#555;line-height:1.6">
            Acesse agora e configure seus imóveis, treine seus agentes e comece a atender leads automaticamente!
        </p>
        
        <div style="text-align:center;margin:32px 0">
            <a href="https://cranios.pro/dashboard" 
               style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:16px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">
                🚀 Acessar Dashboard
            </a>
        </div>
        
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#999;font-size:13px;text-align:center">
            Crânios IMOB · <a href="https://cranios.pro" style="color:#667eea">cranios.pro</a> · 
            <a href="mailto:suporte@cranios.pro" style="color:#667eea">suporte@cranios.pro</a>
        </p>
    </div>
</body>
</html>`,
            });
            console.log('[EmailService] ✅ Welcome email enviado para:', data.email);
            return true;
        } catch (error) {
            console.error('[EmailService] ❌ Erro ao enviar welcome email:', error);
            return false;
        }
    }

    /**
     * Confirmação de agendamento para o cliente (lead)
     */
    async enviarConfirmacaoAgendamento(data: AgendamentoEmailData): Promise<boolean> {
        const tipoLabel: Record<string, string> = {
            visita_corretor: '🏠 Visita ao Imóvel com Corretor',
            entrega_chaves: '🔑 Entrega de Chaves (Concierge)',
            servico_reparo: '🔧 Serviço e Reparos',
        };

        try {
            await resend.emails.send({
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                to: data.email,
                subject: `✅ Agendamento Confirmado — ${data.imovelTitulo}`,
                html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9">
    <div style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:32px;text-align:center">
        <h1 style="color:white;margin:0;font-size:24px">✅ Agendamento Confirmado!</h1>
    </div>
    
    <div style="background:white;padding:32px;border-radius:0 0 12px 12px">
        <p style="color:#555">Olá, <strong>${data.nome}</strong>!</p>
        <p style="color:#555;line-height:1.6">Seu agendamento foi confirmado com sucesso. Veja os detalhes abaixo:</p>
        
        <div style="background:#f8f9ff;border-radius:8px;padding:20px;margin:20px 0">
            <table style="width:100%;border-collapse:collapse">
                <tr>
                    <td style="padding:8px;color:#666">📋 Tipo</td>
                    <td style="padding:8px;font-weight:bold">${tipoLabel[data.tipoAgendamento]}</td>
                </tr>
                <tr style="background:#f9f9f9">
                    <td style="padding:8px;color:#666">🏠 Imóvel</td>
                    <td style="padding:8px;font-weight:bold">${data.imovelTitulo}</td>
                </tr>
                <tr>
                    <td style="padding:8px;color:#666">📅 Data</td>
                    <td style="padding:8px;font-weight:bold">${data.data}</td>
                </tr>
                <tr style="background:#f9f9f9">
                    <td style="padding:8px;color:#666">🕐 Hora</td>
                    <td style="padding:8px;font-weight:bold">${data.hora}</td>
                </tr>
            </table>
        </div>
        
        ${data.bookingUrl ? `
        <div style="text-align:center;margin:24px 0">
            <a href="${data.bookingUrl}" 
               style="background:#667eea;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
                📅 Ver / Reagendar no Calendário
            </a>
        </div>
        ` : ''}
        
        <p style="color:#777;font-size:13px">Em caso de dúvidas, entre em contato via WhatsApp.</p>
        
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#999;font-size:12px;text-align:center">
            Crânios IMOB · <a href="https://cranios.pro" style="color:#667eea">cranios.pro</a>
        </p>
    </div>
</body>
</html>`,
            });
            console.log('[EmailService] ✅ Confirmação enviada para:', data.email);
            return true;
        } catch (error) {
            console.error('[EmailService] ❌ Erro ao enviar confirmação:', error);
            return false;
        }
    }

    /**
     * Notificação interna para o corretor quando um lead quente chega
     */
    async notificarCorretorLeadQuente(data: LeadNotificacaoData): Promise<boolean> {
        const cores: Record<string, string> = {
            quente: '#ef4444',
            morno: '#f97316',
            frio: '#3b82f6',
        };
        const emojis: Record<string, string> = {
            quente: '🔥',
            morno: '🟡',
            frio: '❄️',
        };

        try {
            await resend.emails.send({
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                to: data.corretorEmail,
                subject: `${emojis[data.nivelQualificacao]} Lead ${data.nivelQualificacao.toUpperCase()} — ${data.leadNome}`,
                html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9">
    <div style="background:${cores[data.nivelQualificacao]};padding:24px;text-align:center">
        <h1 style="color:white;margin:0;font-size:20px">
            ${emojis[data.nivelQualificacao]} Lead ${data.nivelQualificacao.toUpperCase()} — Ação necessária!
        </h1>
    </div>
    
    <div style="background:white;padding:28px;border-radius:0 0 12px 12px">
        <p>Olá, <strong>${data.corretorNome}</strong>!</p>
        <p style="color:#555">Um novo lead chegou pelo chatbot e precisa de atendimento:</p>
        
        <div style="background:#f8f9ff;border-radius:8px;padding:20px;margin:16px 0">
            <table style="width:100%;border-collapse:collapse">
                <tr>
                    <td style="padding:8px;color:#666;width:120px">👤 Nome</td>
                    <td style="padding:8px;font-weight:bold">${data.leadNome}</td>
                </tr>
                <tr style="background:#f9f9f9">
                    <td style="padding:8px;color:#666">📱 Telefone</td>
                    <td style="padding:8px;font-weight:bold">${data.leadTelefone}</td>
                </tr>
                ${data.imovelTitulo ? `
                <tr>
                    <td style="padding:8px;color:#666">🏠 Interesse</td>
                    <td style="padding:8px;font-weight:bold">${data.imovelTitulo}</td>
                </tr>` : ''}
                <tr style="background:#f9f9f9">
                    <td style="padding:8px;color:#666">💬 Mensagem</td>
                    <td style="padding:8px;font-style:italic">"${data.mensagemOriginal}"</td>
                </tr>
            </table>
        </div>
        
        <div style="background:#fff8f0;border-left:4px solid ${cores[data.nivelQualificacao]};padding:12px;border-radius:4px;margin:16px 0">
            <strong>📞 Entrar em contato ${data.nivelQualificacao === 'quente' ? 'IMEDIATAMENTE' : data.nivelQualificacao === 'morno' ? 'em até 24h' : 'em até 48h'}</strong>
        </div>

        <a href="https://wa.me/55${data.leadTelefone.replace(/\D/g, '')}" 
           style="display:inline-block;background:#25D366;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px">
            💬 Abrir WhatsApp
        </a>
    </div>
</body>
</html>`,
            });
            console.log('[EmailService] ✅ Notificação corretor enviada para:', data.corretorEmail);
            return true;
        } catch (error) {
            console.error('[EmailService] ❌ Erro ao notificar corretor:', error);
            return false;
        }
    }

    /**
     * Email simples de texto
     */
    async enviarEmail(to: string, subject: string, html: string): Promise<boolean> {
        try {
            await resend.emails.send({
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                to,
                subject,
                html,
            });
            return true;
        } catch (error) {
            console.error('[EmailService] Erro ao enviar email:', error);
            return false;
        }
    }

    /**
     * Enviar dossiê (Briefing gerado por IA) para o corretor responsável
     */
    async enviarBriefingCorretor(data: BriefingEmailData): Promise<boolean> {
        try {
            await resend.emails.send({
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                to: data.corretorEmail,
                subject: `📋 Dossiê Inteligente: Seu próximo atendimento — ${data.leadNome}`,
                html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9">
    <div style="background:linear-gradient(135deg,#0ea5e9,#2563eb);padding:32px;text-align:center">
        <h1 style="color:white;margin:0;font-size:22px">📋 Dossiê de Atendimento (IA)</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">O corretor chega preparado antes da visita.</p>
    </div>
    
    <div style="background:white;padding:32px;border-radius:0 0 12px 12px">
        <p>Olá, <strong>${data.corretorNome}</strong>,</p>
        <p style="color:#555">A nossa IA conversou com o lead e preparou este briefing estratégico para te ajudar no fechamento:</p>
        
        <div style="background:#f8f9ff;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #3b82f6;">
            <p style="margin:0 0 8px 0;"><strong>👤 Cliente:</strong> ${data.leadNome}</p>
            <p style="margin:0 0 8px 0;"><strong>📱 Telefone:</strong> ${data.leadTelefone}</p>
            ${data.dataHoraVisita ? `<p style="margin:0 0 8px 0;"><strong>📅 Agendamento:</strong> ${data.dataHoraVisita}</p>` : ''}
            ${data.imovelTitulo ? `<p style="margin:0 0 0 0;"><strong>🏠 Imóvel:</strong> ${data.imovelTitulo}</p>` : ''}
        </div>
        
        <h3 style="color:#1e40af;margin-top:24px;">🌡️ Temperatura do Lead</h3>
        <p style="background:#f1f5f9;padding:12px;border-radius:6px;">${data.briefing.temperatura}</p>
        
        <h3 style="color:#1e40af;margin-top:24px;">🔍 Persona / Perfil Psicológico</h3>
        <p style="background:#f1f5f9;padding:12px;border-radius:6px;">${data.briefing.persona}</p>
        
        <h3 style="color:#1e40af;margin-top:24px;">📝 Resumo do Desejo</h3>
        <p style="background:#f1f5f9;padding:12px;border-radius:6px;white-space:pre-line">${data.briefing.resumo}</p>
        
        <h3 style="color:#ef4444;margin-top:24px;">⚠️ Objeções e Preocupações</h3>
        <p style="background:#fef2f2;color:#991b1b;padding:12px;border-radius:6px;white-space:pre-line">${data.briefing.objecoes}</p>
        
        <h3 style="color:#16a34a;margin-top:24px;">🎯 Estratégias e Abordagens de Fechamento</h3>
        <p style="background:#f0fdf4;color:#166534;padding:12px;border-radius:6px;white-space:pre-line">${data.briefing.abordagens}</p>
        
        <div style="text-align:center;margin:32px 0">
            <a href="https://wa.me/55${data.leadTelefone.replace(/\D/g, '')}" 
               style="background:#25D366;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
                💬 Iniciar Conversa no WhatsApp
            </a>
        </div>
        
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#999;font-size:12px;text-align:center">Crânios IMOB · Inteligência Artificial em Vendas Imobiliárias</p>
    </div>
</body>
</html>`,
            });
            console.log('[EmailService] ✅ Briefing IA enviado para:', data.corretorEmail);
            return true;
        } catch (error) {
            console.error('[EmailService] ❌ Erro ao enviar briefing:', error);
            return false;
        }
    }

    /**
     * Enviar convite de cadastro para um corretor
     */
    async enviarConviteCorretor(data: ConviteCorretorData): Promise<boolean> {
        try {
            await resend.emails.send({
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                to: data.corretorEmail,
                subject: `Você foi convidado para a equipe ${data.empresaNome} na Crânios IMOB!`,
                html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9">
    <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:40px;text-align:center">
        <h1 style="color:white;margin:0;font-size:24px">Bem-vindo à equipe! 🚀</h1>
    </div>
    
    <div style="background:white;padding:32px;border-radius:0 0 12px 12px">
        <h2 style="color:#333">Olá, ${data.corretorNome}!</h2>
        <p style="color:#555;line-height:1.6">
            Você foi convidado pelo seu gestor para fazer parte da plataforma inteligente <strong>Crânios IMOB</strong> através da <strong>${data.empresaNome}</strong>.
        </p>
        <p style="color:#555;line-height:1.6">
            Para começar a receber leads qualificados e atendimentos agendados diretamente na sua agenda, conclua seu cadastro e vincule a sua conta do <strong>Cal.com</strong>.
        </p>
        
        <div style="text-align:center;margin:32px 0">
            <a href="${data.linkConvite}" 
               style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:16px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">
                📝 Aceitar Convite e Completar Perfil
            </a>
        </div>
        
        <div style="background:#f8f9ff;border-radius:8px;padding:20px;margin:24px 0;font-size:13px;color:#666">
            <strong>O que você vai precisar?</strong><br>
            Apenas de uma conta gratuita no <a href="https://cal.com" style="color:#667eea">Cal.com</a> com um evento "Visita de Imóvel" configurado. O sistema puxará sua disponibilidade de lá!
        </div>
        
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#999;font-size:12px;text-align:center">Crânios IMOB · O Futuro do Mercado Imobiliário</p>
    </div>
</body>
</html>`,
            });
            console.log('[EmailService] ✅ Convite enviado para:', data.corretorEmail);
            return true;
        } catch (error) {
            console.error('[EmailService] ❌ Erro ao enviar convite:', error);
            return false;
        }
    }
}

export const emailService = new EmailService();
