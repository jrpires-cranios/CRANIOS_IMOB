/**
 * Humanizer Service — Crânios IMOB
 * Reescreve respostas da Elena removendo padrões típicos de IA.
 *
 * Baseado no padrão "avoid-ai-writing" (21 categorias, 43 substituições):
 * - Remove: "Certamente!", "Ótima pergunta!", "Absolutamente!", "Com certeza!"
 * - Remove: bold/bullets excessivos, frases de transição artificiais
 * - Aplica: linguagem brasileira natural, tom caloroso e direto
 *
 * Usa gpt-4o-mini como pós-processador (barato e rápido).
 */

import { llmService } from './llm.service.js';

const HUMANIZER_SYSTEM = `Você é um revisor especialista em atendimento imobiliário premium via WhatsApp.

Sua função: receber a resposta de uma assistente de IA (Elena) e reescrevê-la para soar como uma atendente humana experiente, calorosa e natural — sem que o cliente perceba que está falando com IA.

REGRAS OBRIGATÓRIAS:
1. Mantenha TODOS os dados: preços, endereços, datas, nomes de imóveis
2. Elimine estes marcadores de IA (substitua ou remova):
   - "Certamente!", "Ótima pergunta!", "Absolutamente!", "Com certeza!", "Claro!", "Entendido!", "Perfeito!"
   - "Vou te ajudar com isso", "Estou aqui para ajudar"
   - Emojis excessivos (máximo 1-2 por mensagem, só se naturais)
   - Bullets e asteriscos onde cabe uma frase normal
   - Negrito desnecessário (**texto**)
3. Tom: caloroso, atencioso, direto — como uma consultora experiente conversando
4. Linguagem: português brasileiro coloquial, não formal demais
5. Comprimento: respostas curtas ficam CURTAS, longas ficam organizadas mas fluidas
6. Nunca comece com saudação se a conversa já está em andamento
7. Prefira frases simples: "vou verificar" em vez de "irei proceder com a verificação"

RETORNE APENAS o texto reescrito — sem explicações, sem prefixos, sem aspas.`;

class HumanizerService {
    /**
     * Humaniza a resposta da Elena antes de enviar ao cliente
     * Fallback silencioso para o texto original em caso de erro
     */
    async humanize(text: string): Promise<string> {
        // Mensagens muito curtas não precisam de pós-processamento
        if (text.length < 60) return text;

        // Substituições diretas de alta frequência (zero custo, zero latência)
        let quickFixed = this.quickFix(text);

        // Se mudou muito com quickFix, já está bom o suficiente para msgs curtas
        if (quickFixed.length < 120) return quickFixed;

        try {
            const humanized = await llmService.generateResponse({
                systemPrompt: HUMANIZER_SYSTEM,
                userMessage: quickFixed,
                temperature: 0.6,
                model: 'gpt-4o-mini',
            });
            return humanized?.trim() || quickFixed;
        } catch (e) {
            console.warn('[Humanizer] Usando quickFix como fallback');
            return quickFixed;
        }
    }

    /**
     * Substituições de alta frequência sem custo de LLM
     */
    private quickFix(text: string): string {
        return text
            // Saudações artificiais de IA
            .replace(/^(Certamente|Absolutamente|Com certeza|Claro|Ótima pergunta|Entendido|Perfeito)[!,.]?\s*/i, '')
            .replace(/^(Olá|Oi)[!,.]?\s+(Certamente|Absolutamente|Claro)[!,.]?\s*/i, '')
            // Frases de abertura genéricas
            .replace(/Estou aqui para (te )?ajudar[.!]?\s*/gi, '')
            .replace(/Vou te ajudar com isso[.!]?\s*/gi, '')
            .replace(/Fico feliz em (poder )?ajudar[.!]?\s*/gi, '')
            // Negrito desnecessário em palavras soltas
            .replace(/\*\*([^*]{1,30})\*\*/g, (_, word) => word)
            // Triplos emojis — deixa só um
            .replace(/([\u{1F300}-\u{1F9FF}])\s*\1+/gu, '$1')
            .trim();
    }
}

export const humanizerService = new HumanizerService();
export default humanizerService;
