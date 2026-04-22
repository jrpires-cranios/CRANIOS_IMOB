/**
 * Transcription Service — Crânios IMOB
 * Converte áudios do WhatsApp em texto usando OpenAI Whisper
 *
 * Variável necessária no .env (já existe):
 * OPENAI_API_KEY=...
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';

class TranscriptionService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    /**
     * Baixa áudio de uma URL (enviada pelo UazAPI) e transcreve via Whisper
     * Suporta OGG, MP3, MP4, M4A, WAV, WEBM
     */
    async transcribeFromUrl(audioUrl: string): Promise<string | null> {
        const ext = this.guessExtension(audioUrl);
        const tmpPath = path.join(os.tmpdir(), `wa_audio_${Date.now()}${ext}`);

        try {
            console.log('[Transcription] Baixando áudio:', audioUrl);
            const response = await fetch(audioUrl);
            if (!response.ok) throw new Error(`Download falhou: HTTP ${response.status}`);

            const buffer = Buffer.from(await response.arrayBuffer());
            fs.writeFileSync(tmpPath, buffer);

            console.log(`[Transcription] Transcrevendo ${buffer.length} bytes...`);
            const transcription = await this.openai.audio.transcriptions.create({
                file: fs.createReadStream(tmpPath) as any,
                model: 'whisper-1',
                language: 'pt',
                response_format: 'text',
            });

            const text = typeof transcription === 'string' ? transcription : (transcription as any).text;
            console.log('[Transcription] Resultado:', text?.substring(0, 80));
            return text || null;

        } catch (e: any) {
            console.error('[Transcription] Erro:', e.message);
            return null;
        } finally {
            try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch {}
        }
    }

    /**
     * Tenta adivinhar extensão pelo Content-Type ou URL
     */
    private guessExtension(url: string): string {
        if (url.includes('.mp3')) return '.mp3';
        if (url.includes('.mp4')) return '.mp4';
        if (url.includes('.m4a')) return '.m4a';
        if (url.includes('.wav')) return '.wav';
        if (url.includes('.webm')) return '.webm';
        return '.ogg'; // padrão WhatsApp
    }
}

export const transcriptionService = new TranscriptionService();
export default transcriptionService;
