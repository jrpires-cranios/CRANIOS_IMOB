/**
 * Text-to-Speech Service — Crânios IMOB
 *
 * Hierarquia de síntese (fallback automático):
 *   1. Gemini-TTS  — requer GEMINI_API_KEY + ffmpeg no servidor
 *                    Modelo: gemini-3.1-flash-tts-preview (mais recente)
 *                    Suporta markup tags [short pause], [sigh], etc.
 *                    Retorna PCM → converte para OGG_OPUS via ffmpeg
 *
 *   2. Chirp3-HD   — requer GOOGLE_TTS_API_KEY
 *                    Vozes PT-BR de altíssima qualidade (Aoede, Kore, Leda, Achird, Orus)
 *                    Retorna OGG_OPUS diretamente (sem dependência de ffmpeg)
 *
 *   3. Neural2     — requer GOOGLE_TTS_API_KEY
 *                    Fallback garantido com boa qualidade
 *
 * Deixe as chaves em branco para desabilitar o TTS silenciosamente.
 *
 * Variáveis no .env:
 *   GOOGLE_TTS_API_KEY  — para Chirp3-HD e Neural2
 *   GEMINI_API_KEY      — para Gemini-TTS (expressividade máxima)
 */

import { spawn } from 'child_process';
import {
  getPersona,
  injectMarkupTags,
  stripMarkupTags,
  type VoicePersona,
} from './voice-persona.service.js';

// ─── Conversão PCM → OGG_OPUS via ffmpeg ─────────────────────────────────────

/**
 * Converte buffer PCM (signed 16-bit LE, mono) para OGG_OPUS via ffmpeg.
 * Lança erro se ffmpeg não estiver disponível — o caller deve capturar e fazer fallback.
 */
function pcmToOggOpus(pcmBuffer: Buffer, sampleRate = 24000): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const ffmpeg = spawn('ffmpeg', [
      '-f', 's16le',           // formato PCM entrada
      '-ar', String(sampleRate),
      '-ac', '1',              // mono
      '-i', 'pipe:0',          // lê de stdin
      '-c:a', 'libopus',
      '-b:a', '32k',
      '-vbr', 'on',
      '-application', 'voip', // otimizado para voz
      '-f', 'ogg',
      'pipe:1',                // escreve em stdout
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    ffmpeg.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    ffmpeg.stdout.on('end', () => resolve(Buffer.concat(chunks)));
    ffmpeg.stderr.on('data', () => { /* suprime logs do ffmpeg */ });
    ffmpeg.on('error', (err) => reject(new Error(`ffmpeg não disponível: ${err.message}`)));
    ffmpeg.on('close', (code) => {
      if (code !== 0 && chunks.length === 0) {
        reject(new Error(`ffmpeg saiu com código ${code}`));
      }
    });

    ffmpeg.stdin.write(pcmBuffer);
    ffmpeg.stdin.end();
  });
}

// ─── Classe principal ─────────────────────────────────────────────────────────

class TTSService {
  private googleKey: string;
  private geminiKey: string;

  constructor() {
    this.googleKey = process.env.GOOGLE_TTS_API_KEY || '';
    this.geminiKey = process.env.GEMINI_API_KEY || '';
  }

  isConfigured(): boolean {
    return !!(this.googleKey || this.geminiKey);
  }

  // ─── Provider 1: Gemini-TTS ────────────────────────────────────────────────
  private async synthesizeWithGemini(text: string, persona: VoicePersona): Promise<Buffer | null> {
    if (!this.geminiKey) return null;

    // Injeta markup tags para fala mais natural
    const textWithTags = injectMarkupTags(text);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${this.geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: textWithTags }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: persona.geminiVoice },
                },
              },
            },
            systemInstruction: {
              parts: [{ text: persona.stylePrompt }],
            },
          }),
        }
      );

      if (!response.ok) {
        const errBody = await response.text();
        console.warn('[TTS/Gemini] HTTP', response.status, errBody.substring(0, 150));
        return null;
      }

      const data = await response.json() as any;
      const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;

      if (!inlineData?.data) {
        console.warn('[TTS/Gemini] Resposta sem audioContent');
        return null;
      }

      const mimeType: string = inlineData.mimeType || 'audio/pcm;rate=24000';
      const sampleRate = parseInt(mimeType.match(/rate=(\d+)/)?.[1] ?? '24000');
      const pcm = Buffer.from(inlineData.data, 'base64');

      return await pcmToOggOpus(pcm, sampleRate);

    } catch (e: any) {
      console.warn('[TTS/Gemini] Erro:', e.message);
      return null;
    }
  }

  // ─── Provider 2: Chirp3-HD via Cloud TTS ──────────────────────────────────
  private async synthesizeWithChirp3(text: string, persona: VoicePersona): Promise<Buffer | null> {
    if (!this.googleKey) return null;

    // Chirp3-HD não suporta markup — remover antes de enviar
    const clean = stripMarkupTags(text);

    try {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.googleKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: clean },
            voice: { languageCode: 'pt-BR', name: persona.chirp3Voice },
            audioConfig: {
              audioEncoding: 'OGG_OPUS',
              speakingRate: persona.speakingRate,
              pitch: 0.0,
              effectsProfileId: ['telephony-class-application'],
            },
          }),
        }
      );

      if (!response.ok) {
        const errBody = await response.text();
        console.warn('[TTS/Chirp3HD] HTTP', response.status, errBody.substring(0, 150));
        return null;
      }

      const data = await response.json() as { audioContent: string };
      return Buffer.from(data.audioContent, 'base64');

    } catch (e: any) {
      console.warn('[TTS/Chirp3HD] Erro:', e.message);
      return null;
    }
  }

  // ─── Provider 3: Neural2 (fallback) ───────────────────────────────────────
  private async synthesizeWithNeural2(text: string, persona: VoicePersona): Promise<Buffer | null> {
    if (!this.googleKey) return null;

    const clean = stripMarkupTags(text);

    try {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.googleKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: clean },
            voice: { languageCode: 'pt-BR', name: persona.neural2Voice },
            audioConfig: {
              audioEncoding: 'OGG_OPUS',
              speakingRate: persona.speakingRate,
              pitch: 0.0,
              effectsProfileId: ['telephony-class-application'],
            },
          }),
        }
      );

      if (!response.ok) return null;
      const data = await response.json() as { audioContent: string };
      return Buffer.from(data.audioContent, 'base64');

    } catch (e: any) {
      console.warn('[TTS/Neural2] Erro:', e.message);
      return null;
    }
  }

  // ─── Método público ────────────────────────────────────────────────────────

  /**
   * Sintetiza texto em áudio OGG_OPUS com fallback automático.
   *
   * Pipeline:
   *   Gemini-TTS (GEMINI_API_KEY + ffmpeg)
   *     → Chirp3-HD (GOOGLE_TTS_API_KEY)
   *       → Neural2 (GOOGLE_TTS_API_KEY)
   *         → null (degradação silenciosa)
   *
   * @param text      Texto a sintetizar (truncado em 400 chars)
   * @param agentKey  Chave do agente para seleção de persona (ex: "elena", "sdr")
   */
  async synthesize(text: string, agentKey?: string | null): Promise<Buffer | null> {
    if (!this.isConfigured()) return null;

    // Limitar tamanho — áudios muito longos ficam ruins no WhatsApp
    const input = text.length > 400
      ? (text.substring(0, 400).replace(/[^.!?]*$/, '') || text.substring(0, 400))
      : text;

    const persona = getPersona(agentKey);

    // ── 1. Gemini-TTS ──────────────────────────────────────────────
    if (this.geminiKey) {
      const audio = await this.synthesizeWithGemini(input, persona);
      if (audio) {
        console.log(`[TTS] ✓ Gemini (${persona.geminiVoice}) — ${agentKey ?? 'elena'} — ${input.length} chars`);
        return audio;
      }
      console.log('[TTS] Gemini falhou → tentando Chirp3-HD');
    }

    // ── 2. Chirp3-HD ───────────────────────────────────────────────
    if (this.googleKey) {
      const audio = await this.synthesizeWithChirp3(input, persona);
      if (audio) {
        console.log(`[TTS] ✓ Chirp3-HD (${persona.chirp3Voice}) — ${agentKey ?? 'elena'} — ${input.length} chars`);
        return audio;
      }
      console.log('[TTS] Chirp3-HD falhou → tentando Neural2');

      // ── 3. Neural2 fallback ─────────────────────────────────────
      const fallback = await this.synthesizeWithNeural2(input, persona);
      if (fallback) {
        console.log(`[TTS] ✓ Neural2 fallback (${persona.neural2Voice})`);
        return fallback;
      }
    }

    console.warn('[TTS] Todos os providers falharam — enviando só texto');
    return null;
  }
}

export const ttsService = new TTSService();
export default ttsService;
