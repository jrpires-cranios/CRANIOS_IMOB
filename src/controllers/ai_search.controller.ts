import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { llmService } from '../services/llm.service.js';

export const aiSearchController = {
    /**
     * Endpoint 1: Parseia o input de busca (Search Bar) e transforma num JSON estruturado
     * POST /api/ai-search/parse
     */
    async parseSearchIntent(req: Request, res: Response) {
        try {
            const { query } = req.body;
            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }

            const systemPrompt = `Você é o agente de busca de imóveis da CRÂNIOS IMOB em Aracaju/SE.
Analise a consulta do usuário e retorne APENAS um JSON com:
{
  "interpretacao": "frase curta explicando o que o usuário quer (máx 15 palavras)",
  "operacao": "venda" | "locacao" | null,
  "tipo": "casa" | "apartamento" | "terreno" | "comercial" | null (ATENÇÃO: mapeie sempre para as categorias padrões. Ex: Kitnet/Cobertura = apartamento, Sítio/Granja = casa, Lote = terreno, Loja/Galpão = comercial),
  "palavra_chave": "qualquer termo específico que ele buscar (ex: kitnet, mobiliado, cobertura, piscina) ou null",
  "bairros_relevantes": ["array de bairros de Aracaju que fazem sentido para o pedido, ex: praia = Atalaia, Coroa do Meio, Aruana; shopping RioMar = Jardins; centro = Centro"],
  "max_distancia_praia": numero em metros ou null,
  "quartos_min": numero ou null,
  "vagas_min": numero ou null,
  "preco_max": numero ou null,
  "sugestao_texto": "mensagem amigável de 1 linha para mostrar ao usuário sobre o que foi encontrado"
}
Responda SOMENTE com o JSON.`;

            const responseText = await llmService.generateResponse({
                systemPrompt: systemPrompt,
                userMessage: query,
                temperature: 0.1,
                jsonMode: true
            });

            let parsed = {};
            try {
                const cleanJson = responseText.replace(/^```json/g, '').replace(/^```/g, '').replace(/```$/g, '').trim();
                parsed = JSON.parse(cleanJson);
            } catch (e) {
                console.warn('Failed to parse search JSON:', responseText);
                parsed = { interpretacao: "Buscando imóveis...", sugestao_texto: "Mostrando resultados disponíveis." };
            }

            res.json(parsed);
        } catch (error: any) {
            console.error('[AI Search] Error parsing intent:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * Endpoint 2: Chatbot Elena (Conversa humanizada)
     * POST /api/ai-search/chat
     */
    async chatAgent(req: Request, res: Response) {
        try {
            const { messages, clientName, clientPhone } = req.body;
            if (!messages || !Array.isArray(messages)) {
                return res.status(400).json({ error: 'Messages array is required' });
            }

            // Format messages history for LLM Service
            // For LLM Service, we can pass userMessage as the last message
            // and history as the previous ones but mapped to {role, content}

            const systemPrompt = `Você é Elena, recepcionista e especialista digital da CRÂNIOS IMOB em Aracaju/SE.
Seja calorosa, profissional e objetiva. Máximo 2 a 3 frases por resposta.
${clientName ? `O cliente se chama ${clientName}.` : "Se ainda não souber o nome do cliente, pergunte gentilmente."}
${clientPhone ? `Telefone: ${clientPhone}.` : "Pergunte o número de WhatsApp de forma não-intrusiva caso ele demonstre interesse em visitas."}

Você ajuda com:
- Busca de imóveis. Se o cliente der qualquer característica ("kitnet", "com garagem", "na praia"), faça a busca IMEDIATAMENTE.
- NÃO exija o WhatsApp prematuramente. Se o cliente perguntar "onde estão as opções?" ou pedir detalhes, oriente-o a olhar os "Cards de imóveis que apareceram na tela do site" e diga que ele pode clicar em "Ver Detalhes" em qualquer um deles ou no botão de WhatsApp do anúncio.
- Informações sobre a imobiliária.

Tags Especiais de Ação:
- EXTREMAMENTE IMPORTANTE: Assim que o cliente indicar o que quer, MESMO que adicione filtros (ex: "com garagem", "perto da praia"), termine sua resposta com a tag exata: [BUSCAR: <descrição completa da busca>]. 
  Exemplo: "Entendi, vou filtrar kitnets com garagem agora mesmo! [BUSCAR: kitnet para alugar com garagem perto da praia]"
- IMPORTANTE: Não invente dados. Você não "lê" o banco de dados diretamente no chat, você apenas aciona a busca do site usando a tag [BUSCAR: ...]. Após realizar a busca uma vez, se o cliente perguntar os detalhes, oriente a clicar nos resultados da tela principal do site ou tirar dúvidas específicas.

Responda sempre em português brasileiro de forma amigável e direta. Nunca invente dados de imóveis.`;

            // Extract the last user message
            const lastMessage = messages[messages.length - 1];
            const history = messages.slice(0, -1);

            const responseText = await llmService.generateResponse({
                systemPrompt: systemPrompt,
                userMessage: lastMessage.content,
                history: history,
                temperature: 0.7
            });

            res.json({ reply: responseText });
        } catch (error: any) {
            console.error('[AI Chat] Error in chat agent:', error);
            res.status(500).json({ error: error.message });
        }
    }
};
