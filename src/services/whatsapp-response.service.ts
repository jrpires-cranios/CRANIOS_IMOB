/**
 * WhatsApp Response Service — Crânios IMOB
 *
 * Responsável por:
 * 1. ACUMULADOR: agrupa mensagens rápidas do mesmo remetente (janela de 5s)
 *    → Se cliente manda 3 mensagens seguidas, Elena lê todas juntas e responde uma vez
 *
 * 2. DIVISOR INTELIGENTE: quebra respostas longas em blocos naturais
 *    → Divide por parágrafos, máx. 280 chars por mensagem
 *
 * 3. EFEITO DIGITANDO: delay proporcional ao tamanho antes de cada bloco
 *    → ~40ms/char, entre 800ms e 3500ms — parece humano digitando
 *
 * 4. ESPELHAMENTO: se cliente enviou áudio → Elena responde com áudio + texto
 *    → Requer GOOGLE_TTS_API_KEY configurado; sem ele, só envia texto
 */

import { whatsappService } from './whatsapp.service.js';
import { ttsService } from './tts.service.js';

export interface AccumulatedMessage {
    type: 'text' | 'audio';
    content: string;          // texto ou transcrição do áudio
    originalAudioUrl?: string;
}

interface Accumulation {
    messages: AccumulatedMessage[];
    timer: NodeJS.Timeout;
}

type ProcessCallback = (messages: AccumulatedMessage[], hadAudio: boolean) => Promise<void>;

class WhatsAppResponseService {
    // Acumulador em memória: phone → mensagens pendentes + timer
    private pending = new Map<string, Accumulation>();

    // ────────────────────────────────────────────────────────────
    // 1. ACUMULADOR
    // ────────────────────────────────────────────────────────────

    /**
     * Adiciona mensagem ao buffer do remetente.
     * Se não chegar nova mensagem em `windowMs`, dispara onProcess com tudo acumulado.
     */
    accumulate(
        phone: string,
        message: AccumulatedMessage,
        onProcess: ProcessCallback,
        windowMs = 5000
    ): void {
        const existing = this.pending.get(phone);
        if (existing) clearTimeout(existing.timer);

        const messages = existing ? [...existing.messages, message] : [message];
        const hadAudio = messages.some(m => m.type === 'audio');

        const timer = setTimeout(async () => {
            this.pending.delete(phone);
            try {
                await onProcess(messages, hadAudio);
            } catch (e: any) {
                console.error('[Response] Erro no processamento acumulado:', e.message);
            }
        }, windowMs);

        this.pending.set(phone, { messages, timer });
    }

    /**
     * Concatena todas as mensagens acumuladas em um único texto para o agente
     */
    mergeMessages(messages: AccumulatedMessage[]): string {
        return messages.map(m => m.content).join('\n').trim();
    }

    // ────────────────────────────────────────────────────────────
    // 2. DIVISOR INTELIGENTE
    // ────────────────────────────────────────────────────────────

    /**
     * Divide texto longo em blocos para envio separado.
     * Respeitando parágrafos e limite de caracteres.
     */
    splitForChat(text: string, maxChars = 280): string[] {
        if (text.length <= maxChars) return [text.trim()];

        const chunks: string[] = [];
        const paragraphs = text.split(/\n{2,}/);
        let current = '';

        for (const para of paragraphs) {
            const candidate = current ? `${current}\n\n${para}` : para;
            if (candidate.length > maxChars && current) {
                chunks.push(current.trim());
                current = para;
            } else {
                current = candidate;
            }
        }
        if (current.trim()) chunks.push(current.trim());

        // Segunda passagem: chunks ainda grandes por excesso de texto sem \n\n
        const result: string[] = [];
        for (const chunk of chunks) {
            if (chunk.length <= maxChars) {
                result.push(chunk);
            } else {
                // Split por frases
                const sentences = chunk.match(/[^.!?]+[.!?]+(\s|$)/g) || [chunk];
                let buf = '';
                for (const s of sentences) {
                    if ((buf + s).length > maxChars && buf) {
                        result.push(buf.trim());
                        buf = s;
                    } else {
                        buf += s;
                    }
                }
                if (buf.trim()) result.push(buf.trim());
            }
        }

        return result.filter(c => c.length > 0);
    }

    // ────────────────────────────────────────────────────────────
    // 3. EFEITO DIGITANDO
    // ────────────────────────────────────────────────────────────

    /**
     * Delay que simula o tempo de digitação humana
     * 40ms por caractere, mínimo 800ms, máximo 3500ms
     */
    typingDelay(text: string): number {
        return Math.max(800, Math.min(text.length * 40, 3500));
    }

    /**
     * Envia texto com efeito de digitação entre blocos
     */
    async sendSmart(phone: string, text: string): Promise<void> {
        const chunks = this.splitForChat(text);

        for (let i = 0; i < chunks.length; i++) {
            if (i > 0) {
                // Pausa proporcional ao próximo bloco
                await new Promise(r => setTimeout(r, this.typingDelay(chunks[i])));
            }
            await whatsappService.sendText(phone, chunks[i]);
        }
    }

    // ────────────────────────────────────────────────────────────
    // 4. ESPELHAMENTO DE MÍDIA
    // ────────────────────────────────────────────────────────────

    /**
     * Envia resposta espelhando o canal do cliente:
     * - Cliente enviou áudio → Elena responde com áudio (TTS) + texto
     * - Cliente enviou texto → Elena responde só com texto
     *
     * Pipeline TTS: Gemini-TTS → Chirp3-HD → Neural2 → degradação silenciosa para texto.
     *
     * @param phone           Número do destinatário
     * @param text            Texto da resposta (humanizado)
     * @param clientSentAudio true se o cliente enviou áudio (espelhamento ativo)
     * @param agentKey        Chave do agente para seleção de voz/persona (ex: "elena", "sdr")
     */
    async sendWithMirroring(
        phone: string,
        text: string,
        clientSentAudio: boolean,
        agentKey?: string | null,
    ): Promise<void> {
        if (clientSentAudio && ttsService.isConfigured()) {
            try {
                const audioBuffer = await ttsService.synthesize(text, agentKey);
                if (audioBuffer) {
                    await whatsappService.sendAudio(phone, audioBuffer);
                    // Pausa natural entre áudio e texto complementar
                    await new Promise(r => setTimeout(r, 1500));
                }
            } catch (e: any) {
                console.warn('[Response] TTS falhou, enviando só texto:', e.message);
            }
        }

        // Texto sempre enviado (como complemento do áudio ou resposta principal)
        await this.sendSmart(phone, text);
    }
}

export const whatsappResponseService = new WhatsAppResponseService();
export default whatsappResponseService;
