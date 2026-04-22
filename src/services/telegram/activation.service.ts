import { supabase } from '../../config/supabase.js';
import QRCode from 'qrcode';

export class TelegramActivationService {
    /**
     * Gera um código único e cria um deep link do Telegram
     */
    async generateActivationLink(corretorId: string, clienteId: string): Promise<{ code: string; link: string; qrCodeDataUrl: string } | null> {
        try {
            // Gera um código humano legível simples, ex: IMOB-8F3A2
            const code = `IMOB-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            // Define expiração para 24 horas
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            const { data, error } = await supabase
                .from('corretor_activations')
                .insert([{
                    code,
                    corretor_id: corretorId,
                    cliente_id: clienteId,
                    expires_at: expiresAt.toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'CraniosImobBot';
            const link = `https://t.me/${botUsername}?start=${code}`;
            const qrCodeDataUrl = await QRCode.toDataURL(link);

            return { code, link, qrCodeDataUrl };
        } catch (error) {
            console.error('[TelegramActivation] Erro gerando link:', error);
            return null;
        }
    }

    /**
     * Valida um código recepcionado pelo /start do bot
     */
    async validateAndActivate(code: string, telegramId: string, telegramUsername: string): Promise<{ success: boolean; corretor?: any; message?: string }> {
        try {
            // 1. Buscar o código
            const { data: activation, error } = await supabase
                .from('corretor_activations')
                .select('*, corretores(*)')
                .eq('code', code)
                .single();

            if (error || !activation) {
                return { success: false, message: 'Código de ativação inválido ou não encontrado.' };
            }

            if (activation.used_at) {
                return { success: false, message: 'Este código já foi utilizado.' };
            }

            if (new Date(activation.expires_at) < new Date()) {
                return { success: false, message: 'Este código expirou. Solicite um novo ao gestor.' };
            }

            // 2. Atualizar o corretor com os dados do Telegram
            const { error: updateError } = await supabase
                .from('corretores')
                .update({
                    telegram_id: telegramId.toString(),
                    telegram_username: telegramUsername,
                    bot_activated_at: new Date().toISOString()
                })
                .eq('id', activation.corretor_id);

            if (updateError) throw updateError;

            // 3. Marcar código como usado
            await supabase
                .from('corretor_activations')
                .update({ used_at: new Date().toISOString() })
                .eq('id', activation.id);

            return { success: true, corretor: activation.corretores };
        } catch (error: any) {
            console.error('[TelegramActivation] Erro validando código:', error);
            return { success: false, message: 'Ocorreu um erro interno ao validar o código.' };
        }
    }
}

export const telegramActivationService = new TelegramActivationService();
