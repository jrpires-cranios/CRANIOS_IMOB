import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Configuração dos clientes
const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const openRouterClient = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": "https://cranios-imob.com",
        "X-Title": "Crânios IMOB",
    }
});

interface CompletionParams {
    systemPrompt: string;
    userMessage: string;
    model?: string;
    temperature?: number;
    jsonMode?: boolean;
}

export class LLMService {
    /**
     * Gera uma resposta usando o modelo principal (OpenAI GPT-4o)
     * Fallback automático para OpenRouter se falhar
     */
    /**
     * Gera uma resposta usando o modelo principal (OpenAI GPT-4o)
     * Fallback automático para OpenRouter se falhar
     */
    async generateResponse(params: CompletionParams & { history?: { role: 'user' | 'assistant' | 'system', content: string }[] }): Promise<string> {
        try {
            // Tenta usar OpenAI Principal (GPT-4o)
            return await this.callOpenAI(params);
        } catch (error) {
            console.warn('[LLMService] Erro na OpenAI, tentando OpenRouter...', error);
            try {
                // Fallback para OpenRouter
                return await this.callOpenRouter(params);
            } catch (backupError) {
                console.error('[LLMService] Falha em ambos os provedores:', backupError);
                return "Desculpe, estou com dificuldades de conexão no momento. Poderia repetir?";
            }
        }
    }

    private async callOpenAI(params: CompletionParams & { history?: any[] }): Promise<string> {
        // Monta o array de mensagens: System + History + User (se não estiver no history)
        let messages: any[] = [{ role: "system", content: params.systemPrompt }];

        if (params.history && params.history.length > 0) {
            messages = messages.concat(params.history);
        } else {
            messages.push({ role: "user", content: params.userMessage });
        }

        // Se o último não for a mensagem atual (caso o history não a inclua), adiciona
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.content !== params.userMessage && !params.history) {
            // Lógica defensiva: se passou history, assume-se que o userMessage tá lá ou deve ser appendado
            messages.push({ role: "user", content: params.userMessage });
        } else if (params.history && lastMsg.role !== 'user') {
            // Garante que a mensagem atual entre se não estiver no histórico
            messages.push({ role: "user", content: params.userMessage });
        }

        const completion = await openaiClient.chat.completions.create({
            model: params.model || "gpt-4o-mini", // Upgrade para 4o-mini (mais inteligente/barato que 3.5)
            messages: messages,
            temperature: params.temperature || 0.7,
            response_format: params.jsonMode ? { type: "json_object" } : undefined,
        });

        return completion.choices[0].message.content || "";
    }

    private async callOpenRouter(params: CompletionParams & { history?: any[] }): Promise<string> {
        let messages: any[] = [{ role: "system", content: params.systemPrompt }];
        if (params.history) {
            messages = messages.concat(params.history);
        } else {
            messages.push({ role: "user", content: params.userMessage });
        }
        // Append user msg if needed
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.role !== 'user' || lastMsg.content !== params.userMessage) {
            messages.push({ role: 'user', content: params.userMessage });
        }

        const completion = await openRouterClient.chat.completions.create({
            model: "google/gemini-2.0-pro-exp-02-05:free",
            messages: messages,
            temperature: params.temperature || 0.7,
        });

        return completion.choices[0].message.content || "";
    }

    /**
     * Gera um Briefing Tático do Lead para ajudar o Corretor
     * Lê o histórico de mensagens e extrai pontos-chave em formato JSON.
     */
    async gerarBriefingDoLead(historicoRaw: { role: string, content: string }[]): Promise<any> {
        if (!historicoRaw || historicoRaw.length === 0) {
            return null;
        }

        const historicoTexto = historicoRaw.map(h => `${h.role === 'user' ? 'Lead' : 'Bot'}: ${h.content}`).join('\n');

        const systemPrompt = `Você é um analista comportamental de vendas imobiliárias de elite.
Sua tarefa é ler a transcrição de uma conversa entre um Lead (cliente) e um Bot de atendimento, e gerar um "Briefing Tático" para o Corretor que vai assumir o atendimento.

Retorne EXATAMENTE um JSON válido com a seguinte estrutura:
{
  "resumo": "Um parágrafo curto resumindo o que o cliente quer (tipo de imóvel, região, valor esperado).",
  "temperatura": "Frio, Morno ou Quente",
  "probabilidade_fechamento": 75, // número inteiro de 0 a 100
  "dicas_abordagem": [
    "Dica 1 para o corretor que vai ligar pro cliente",
    "Dica 2 para o corretor"
  ]
}

REGRAS:
- Temperatura "Quente" = cliente já quer visitar, já sabe o que quer ou está com pressa.
- Temperatura "Morno" = cliente está pesquisando, pediu opções.
- Temperatura "Frio" = cliente parou de responder logo no início ou foi muito evasivo.
- Dicas de abordagem: Seja pragmático. Ex: "Foque em falar sobre segurança pois ele demonstrou preocupação com isso."`;

        try {
            console.log(`[LLMService] Gerando briefing para histórico de ${historicoRaw.length} mensagens...`);
            const respostaRaw = await this.generateResponse({
                systemPrompt: systemPrompt,
                userMessage: `Histórico da conversa:\n\n${historicoTexto}`,
                temperature: 0.3, // Menos criatividade, mais análise fria
                jsonMode: true
            });

            // Parseia e sanitiza a resposta JSON do modelo
            let briefing = {};
            try {
                // Remove possiveis escapes de markdown em volta do JSON
                const cleanJson = respostaRaw.replace(/^```json/g, '').replace(/^```/g, '').replace(/```$/g, '').trim();
                briefing = JSON.parse(cleanJson);
            } catch (jsonErr) {
                console.warn('[LLMService] Falha ao fazer parse do Briefing JSON:', respostaRaw);
                briefing = {
                    resumo: "Conseguiu capturar os dados, mas não foi possível gerar análise semântica estruturada.",
                    temperatura: "Morno",
                    probabilidade_fechamento: 50,
                    dicas_abordagem: ["Tente entender melhor o perfil do cliente na primeira ligação."]
                };
            }

            return briefing;

        } catch (error) {
            console.error('[LLMService] Erro ao gerar briefing do lead:', error);
            return null;
        }
    }
}

export const llmService = new LLMService();
