import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PropertyParams {
  tipo: string;
  finalidade: string;
  bairro: string;
  cidade: string;
  quartos: number;
  area_construida: number;
  valor: number;
  caracteristicas?: string[];
  [key: string]: any;
}

export const contentGeneratorService = {
  async generatePropertyDescription(params: PropertyParams): Promise<{ success: boolean; text?: string; error?: string }> {
    try {
      const caracteristicasText = params.caracteristicas?.join(', ') || 'Não especificadas detalhadamente.';
      const prompt = `
🚨 MODO DE OPERAÇÃO: COPYWRITER IMOBILIÁRIO DE ALTA CONVERSÃO 🚨
Escreva uma descrição atraente, profissional e persuasiva para o seguinte imóvel. Use técnicas de copywriting (AIDA, gatilhos mentais) para destacar os benefícios, não apenas as características. A descrição precisa ser emocional e visual, ajudando o cliente a se imaginar morando ou investindo no local. Formate em parágrafos bem espaçados.

DADOS DO IMÓVEL:
- Tipo: ${params.tipo}
- Finalidade: ${params.finalidade}
- Localização: ${params.bairro}, ${params.cidade}
- Quartos: ${params.quartos}
- Área: ${params.area_construida} m²
- Valor: R$ ${params.valor}
- Outras Características: ${caracteristicasText}

Escreva diretamente o texto da descrição (sem introduções suas).
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const text = completion.choices[0]?.message?.content?.trim();
      return { success: true, text };
    } catch (error: any) {
      console.error('[ContentGenerator] Erro ao gerar descrição:', error);
      return { success: false, error: error.message };
    }
  },

  async generateInstagramPost(params: PropertyParams): Promise<{ success: boolean; text?: string; error?: string }> {
    try {
      const caracteristicasText = params.caracteristicas?.join(', ') || 'Excelentes comodidades.';
      const prompt = `
🚨 MODO DE OPERAÇÃO: SOCIAL MEDIA ESPECIALISTA EM MERCADO IMOBILIÁRIO 🚨
Crie um roteiro de legenda para post de Instagram (Feed ou Reels) para divulgar este imóvel. A linguagem deve ser envolvente, direta, e utilizar emojis com moderação (sem exagero visual). Siga a estrutura:
1. "Hook" (Gancho inicial forte que segure a atenção)
2. Benefício Principal (O que torna esse imóvel especial?)
3. Resumo das Características (Bullet points curtos)
4. Call to Action (CTA forte convidando para acessar o site ou mandar direct)
5. Sugestão de Hashtags (5 a 7 hashtags relevantes).

DADOS DO IMÓVEL:
- Tipo: ${params.tipo}
- Localização: ${params.bairro}, ${params.cidade}
- Quartos: ${params.quartos}
- Área: ${params.area_construida} m²
- Valor: R$ ${params.valor}
- Características de destaque: ${caracteristicasText}

Devolva apenas o conteúdo pronto para ser postado (sem textos extras).
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      });

      const text = completion.choices[0]?.message?.content?.trim();
      return { success: true, text };
    } catch (error: any) {
      console.error('[ContentGenerator] Erro ao gerar post de Instagram:', error);
      return { success: false, error: error.message };
    }
  }
};
