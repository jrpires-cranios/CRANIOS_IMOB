import { llmService } from './llm.service.js';

export class GeoService {
    /**
     * Converte uma referência vaga ("perto da praia", "perto do shopping")
     * em uma lista de bairros de Aracaju/Região para filtro no banco.
     */
    async inferirBairrosProximos(referencia: string): Promise<string[]> {
        console.log('[GeoService] Inferindo bairros para:', referencia);

        const prompt = `
      Você é um especialista em geografia imobiliária de ARACAJU (SERGIPE).
      O usuário está buscando imóveis "perto de: ${referencia}".
      
      Liste até 5 bairros de Aracaju que atendem a esse critério geográfico.
      Exemplo: "perto da praia" -> ["Atalaia", "Aruana", "Coroa do Meio"].
      Exemplo: "perto do shopping jardins" -> ["Jardins", "Grageru", "Garcia", "Inácio Barbosa"].
      
      RETORNE APENAS UM ARRAY JSON DE STRINGS. Nada mais.
    `;

        try {
            const response = await llmService.generateResponse({
                systemPrompt: prompt,
                userMessage: "Liste os bairros.",
                temperature: 0,
                jsonMode: true
            });

            const bairros = JSON.parse(response).bairros || JSON.parse(response);
            console.log('[GeoService] Bairros inferidos:', bairros);

            // Validação básica se é array
            if (Array.isArray(bairros)) return bairros;
            return [];
        } catch (error) {
            console.error('[GeoService] Erro ao inferir bairros:', error);
            return []; // Fallback seguro
        }
    }

    /**
     * (Futuro) Calcular distância real se tivermos lat/long
     */
    calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
        // Haversine formula placeholder
        return 0;
    }
}

export const geoService = new GeoService();
