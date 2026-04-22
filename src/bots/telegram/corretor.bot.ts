import { Telegraf } from 'telegraf';
import { supabase } from '../../config/supabase.js';
import { telegramActivationService } from '../../services/telegram/activation.service.js';
import { pdfGeneratorService } from '../../services/pdf-generator.service.js';
import { r2StorageService } from '../../services/r2-storage.service.js';
import { setupFeedbackFlow, startFeedbackSurvey } from './feedback.flow.js';

export class TelegramBotManager {
    private bot: Telegraf;

    constructor(token: string) {
        this.bot = new Telegraf(token);
        this.setupHandlers();
        setupFeedbackFlow(this.bot);
    }

    private setupHandlers() {
        // Handlers de Inicialização (/start)
        this.bot.start(async (ctx) => {
            const payload = ctx.message.text.split(' ')[1]; // /start IMOB-12345
            const telegramId = ctx.from.id.toString();
            const telegramUsername = ctx.from.username || ctx.from.first_name;

            try {
                // Se tem payload (código de ativação)
                if (payload) {
                    const result = await telegramActivationService.validateAndActivate(payload, telegramId, telegramUsername);

                    if (result.success && result.corretor) {
                        return ctx.reply(`✅ Olá, ${result.corretor.nome}! Sua conta de corretor foi vinculada com sucesso. Agora você receberá os leads quentes e poderá solicitar dossiês por aqui. Use /ajuda para ver os comandos.`);
                    } else {
                        return ctx.reply(`❌ Erro na ativação: ${result.message}`);
                    }
                }

                // Se não tem payload, verificar se já é cadastrado
                const { data: corretor } = await supabase
                    .from('corretores')
                    .select('*')
                    .eq('telegram_id', telegramId)
                    .single();

                if (corretor) {
                    return ctx.reply(`👋 Bem-vindo de volta, ${corretor.nome}! Sistema da Crânios IMOB operando normalmente.`);
                }

                // Não é cadastrado e não mandou payload
                return ctx.reply('🔒 Acesso Restrito. Você precisa de um link de ativação gerado pelo seu gestor para usar este Bot.');
            } catch (err) {
                console.error('[TelegramBot] Erro no /start:', err);
                return ctx.reply('⚠️ Ocorreu um erro interno. Tente novamente mais tarde.');
            }
        });

        // Comando: /ajuda
        this.bot.command('ajuda', (ctx) => {
            ctx.reply(
                `🛠 *Comandos Disponíveis:*\n\n` +
                `/imovel [ID] - Gera um Dossiê em PDF do imóvel e envia aqui.\n` +
                `/perfil - Mostra suas métricas atuais.`
                , { parse_mode: 'Markdown' });
        });

        // Comando: /imovel [ID] ou URL
        this.bot.command('imovel', async (ctx) => {
            const imovelId = ctx.message.text.split(' ')[1];
            if (!imovelId) {
                return ctx.reply('⚠️ Por favor, informe o ID do imóvel. Exemplo: /imovel 1234');
            }

            const telegramId = ctx.from.id.toString();
            const { data: corretor } = await supabase.from('corretores').select('*, clientes(*)').eq('telegram_id', telegramId).single();

            if (!corretor) return ctx.reply('🔒 Acesso Negado. Sua conta não está vinculada.');

            ctx.reply(`⏳ Gerando dossiê mágico para o imóvel... Isso leva uns segundinhos.`);

            try {
                // Simulação da geração de PDF que o backend já sabe fazer
                let clienteConfig = {
                    nome: corretor.clientes?.nome || 'Crânios IMOB',
                    logo_url: corretor.clientes?.logo_url || '',
                    cor_primaria: corretor.clientes?.cor_primaria || '#667eea',
                    cor_secundaria: corretor.clientes?.cor_secundaria || '#764ba2',
                    whatsapp: corretor.telefone || corretor.clientes?.whatsapp || '',
                    email: corretor.email,
                    creci: corretor.creci || '',
                };

                const pdfUrl = await pdfGeneratorService.obterOuGerarPDF(imovelId, clienteConfig, r2StorageService);

                await ctx.reply(`✅ *Dossiê Pronto!*\n\nAqui está o link direto para download do PDF formatado com os seus contatos:\n${pdfUrl}`, { parse_mode: 'Markdown' });
            } catch (err) {
                console.error('[TelegramBot] Erro gerando imóvel:', err);
                ctx.reply('❌ Desculpe, não consegui gerar o PDF. Verifique se o ID está correto.');
            }
        });
    }

    /**
     * Envia os dados de um novo Lead qualificado via Bot
     */
    async sendLeadToCorretor(corretorId: string, leadData: any) {
        try {
            const { data: corretor } = await supabase.from('corretores').select('telegram_id').eq('id', corretorId).single();
            if (!corretor || !corretor.telegram_id) return false;

            const mensagem = `🚨 *NOVO LEAD QUALIFICADO!*\n\n` +
                `👤 *Nome:* ${leadData.nome}\n` +
                `📱 *Contato:* ${leadData.whatsapp}\n` +
                `🎯 *Interesse:* ${leadData.intencao}\n\n` +
                `🧠 *Resumo da IA:*\n${leadData.resumo_ia || 'Não disponível'}\n\n` +
                `🔥 *Score do Match:* ${leadData.match_score || 'N/A'}%\n\n` +
                `Acesse o Dashboard PWA para mais detalhes.`;

            await this.bot.telegram.sendMessage(corretor.telegram_id, mensagem, { parse_mode: 'Markdown' });
            return true;
        } catch (err) {
            console.error('[TelegramBot] Falha ao notificar corretor:', err);
            return false;
        }
    }

    /**
     * Inicia o fluxo conversacional de feedback após a visita (M5b)
     */
    public triggerFeedbackFlow(telegramId: string, agendamentoId: string, leadName: string, corretorId: string, clienteId: string, leadId: string) {
        startFeedbackSurvey(this.bot, telegramId, agendamentoId, leadName, corretorId, clienteId, leadId);
    }

    public startBot() {
        this.bot.launch().then(() => {
            console.log('[TelegramBot] 🚀 Bot iniciado com sucesso usando Long Polling.');
        }).catch(err => console.error('[TelegramBot] Erro ao iniciar:', err));

        // Enable graceful stop
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    }
}

// Inicializa a instância se houver token
let telegramBotInstance: TelegramBotManager | null = null;
if (process.env.TELEGRAM_BOT_TOKEN) {
    telegramBotInstance = new TelegramBotManager(process.env.TELEGRAM_BOT_TOKEN);
}

export { telegramBotInstance };
