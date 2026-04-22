/**
 * Text-to-Speech Service — Crânios IMOB
 * Converte texto em áudio OGG usando Google Cloud TTS
 *
 * Variável necessária no .env:
 * GOOGLE_TTS_API_KEY=...
 *
 * Para obter: console.cloud.google.com → APIs → Cloud Text-to-Speech API → Credenciais → Criar chave de API
 * Custo: ~$4 / 1 milhão de caracteres (WaveNet), $16 / 1M chars (WaveNet premium)
 * Vozes pt-BR disponíveis: pt-BR-Wavenet-A (fem), pt-BR-Wavenet-B (masc), pt-BR-Wavenet-C (fem), pt-BR-Wavenet-E (fem)
 *
 * Deixe GOOGLE_TTS_API_KEY vazio para desabilitar TTS silenciosamente.
 */

class TTSService {
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.GOOGLE_TTS_API_KEY || '';
    }

    isConfigured(): boolean {
        return !!this.apiKey;
    }

    /**
     * Converte texto em áudio OGG_OPUS (formato aceito pelo WhatsApp como mensagem de voz)
     * Retorna Buffer do áudio ou null se TTS não configurado/falhou
     *
     * @param text     Texto a sintetizar (truncado em 400 chars para respostas de voz)
     * @param voice    Nome da voz Google (default: pt-BR-Wavenet-A, feminina)
     */
    async synthesize(text: string, voice = 'pt-BR-Wavenet-A'): Promise<Buffer | null> {
        if (!this.isConfigured()) return null;

        // Áudios longos ficam estranhos — limitar a ~400 chars
        const input = text.length > 400
            ? text.substring(0, 400).replace(/[^.!?]*$/, '') || text.substring(0, 400)
            : text;

        try {
            const response = await fetch(
                `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        input: { text: input },
                        voice: { languageCode: 'pt-BR', name: voice },
                        audioConfig: {
                            audioEncoding: 'OGG_OPUS',
                            speakingRate: 1.05,
                            pitch: 0.0,
                            effectsProfileId: ['telephony-class-application'],
                        },
                    }),
                }
            );

            if (!response.ok) {
                console.error('[TTS] Erro HTTP:', response.status, await response.text());
                return null;
            }

            const data = await response.json() as { audioContent: string };
            return Buffer.from(data.audioContent, 'base64');

        } catch (e: any) {
            console.error('[TTS] Erro:', e.message);
            return null;
        }
    }
}

export const ttsService = new TTSService();
export default ttsService;
