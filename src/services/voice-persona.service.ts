/**
 * Voice Persona Service — Crânios IMOB
 *
 * Define perfis de voz para cada agente da plataforma.
 * Cada persona tem:
 *   - Voz Chirp3-HD (melhor qualidade via Cloud TTS — só precisa de GOOGLE_TTS_API_KEY)
 *   - Voz Gemini (para Gemini-TTS com markup tags — precisa de GEMINI_API_KEY)
 *   - Voz Neural2 (fallback garantido)
 *   - Style Prompt (instrução de personalidade para Gemini-TTS)
 *   - Speaking rate ajustado por agente
 *
 * Hierarchy de qualidade:
 *   Gemini-TTS (expressividade máxima) → Chirp3-HD (alta qualidade) → Neural2 (fallback)
 */

export interface VoicePersona {
  agentName: string;
  gender: 'female' | 'male';
  /** Voz para Cloud TTS API padrão (Chirp3-HD) */
  chirp3Voice: string;
  /** Voz para Gemini-TTS (nome curto, sem prefixo de idioma) */
  geminiVoice: string;
  /** Voz Neural2 de fallback */
  neural2Voice: string;
  /** Instrução de estilo/personalidade para Gemini-TTS */
  stylePrompt: string;
  /** Taxa de fala (0.75–2.0). 1.0 = normal. */
  speakingRate: number;
}

// ── Personas por agente ───────────────────────────────────────────────────────
// Keys devem corresponder ao campo `resultado.agente` retornado pelo chatAgent.
// Busca parcial é usada como fallback (ex: "agente_elena" → "elena").
const PERSONAS: Record<string, VoicePersona> = {

  /**
   * Elena — Recepcionista / Assistente Principal
   * Voz: Aoede (feminina, calorosa, próxima)
   */
  elena: {
    agentName: 'Elena',
    gender: 'female',
    chirp3Voice: 'pt-BR-Chirp3-HD-Aoede',
    geminiVoice: 'Aoede',
    neural2Voice: 'pt-BR-Neural2-A',
    stylePrompt:
      'Você é Elena, assistente virtual de uma imobiliária premium brasileira. ' +
      'Fale com calor humano genuíno, entusiasmo moderado e simpatia próxima. ' +
      'Ritmo natural de conversa — como uma amiga de confiança que entende muito de imóveis. ' +
      'Nunca soe robótica, excessivamente formal ou apressada. ' +
      'Use pausas naturais ao apresentar informações importantes.',
    speakingRate: 1.05,
  },

  /**
   * SDR / Prospecção — Qualificação de leads
   * Voz: Kore (feminina, profissional, persuasiva)
   */
  sdr: {
    agentName: 'SDR',
    gender: 'female',
    chirp3Voice: 'pt-BR-Chirp3-HD-Kore',
    geminiVoice: 'Kore',
    neural2Voice: 'pt-BR-Neural2-C',
    stylePrompt:
      'Você é especialista em qualificação de leads imobiliários. ' +
      'Fale com confiança, clareza e profissionalismo. Tom persuasivo mas sempre respeitoso. ' +
      'Seja direta e objetiva, sem ser fria. Demonstre genuíno interesse no cliente.',
    speakingRate: 1.0,
  },

  /**
   * Agendamento — Marcação de visitas
   * Voz: Leda (feminina, energética, eficiente)
   */
  scheduling: {
    agentName: 'Agendamento',
    gender: 'female',
    chirp3Voice: 'pt-BR-Chirp3-HD-Leda',
    geminiVoice: 'Leda',
    neural2Voice: 'pt-BR-Neural2-A',
    stylePrompt:
      'Você agenda visitas a imóveis de forma ágil e organizada. ' +
      'Fale de forma eficiente e com leve animação — o cliente deve sentir que ' +
      'as coisas estão sendo resolvidas com agilidade. Tom prático e direto.',
    speakingRate: 1.05,
  },

  /**
   * Financiamento — Crédito imobiliário
   * Voz: Orus (masculino, autoritativo, confiável)
   */
  financing: {
    agentName: 'Financiamento',
    gender: 'male',
    chirp3Voice: 'pt-BR-Chirp3-HD-Orus',
    geminiVoice: 'Orus',
    neural2Voice: 'pt-BR-Neural2-B',
    stylePrompt:
      'Você é especialista em financiamento imobiliário brasileiro. ' +
      'Fale com autoridade, tranquilidade e clareza técnica. Tom confiável, didático e seguro. ' +
      'O cliente deve sentir que está nas mãos de um profissional experiente. ' +
      'Use pausas ao explicar valores e condições.',
    speakingRate: 0.98,
  },

  /**
   * Qualificação — Pré-atendimento
   * Voz: Kore (reutiliza perfil SDR)
   */
  qualification: {
    agentName: 'Qualificação',
    gender: 'female',
    chirp3Voice: 'pt-BR-Chirp3-HD-Kore',
    geminiVoice: 'Kore',
    neural2Voice: 'pt-BR-Neural2-C',
    stylePrompt:
      'Você faz a qualificação inicial de clientes interessados em imóveis. ' +
      'Fale com curiosidade genuína e simpatia. Tom acolhedor, interessado e profissional. ' +
      'Faça perguntas de forma leve, como uma conversa, não um interrogatório.',
    speakingRate: 1.0,
  },

  /**
   * Corretor — Assistência técnica a corretores
   * Voz: Achird (masculino, profissional)
   */
  corretor: {
    agentName: 'Corretor',
    gender: 'male',
    chirp3Voice: 'pt-BR-Chirp3-HD-Achird',
    geminiVoice: 'Charon',
    neural2Voice: 'pt-BR-Neural2-B',
    stylePrompt:
      'Você é assistente de um corretor de imóveis profissional. ' +
      'Fale de forma objetiva, técnica e profissional. Tom colega-de-trabalho, eficiente e direto.',
    speakingRate: 1.0,
  },
};

// Persona padrão — Elena
const DEFAULT_PERSONA = PERSONAS.elena;

// ── Funções de acesso ─────────────────────────────────────────────────────────

/**
 * Retorna a persona correspondente ao agente informado.
 * Aceita match exato ou parcial (ex: "agente_sdr_imob" → "sdr").
 * Retorna Elena se nenhum match for encontrado.
 */
export function getPersona(agentKey?: string | null): VoicePersona {
  if (!agentKey) return DEFAULT_PERSONA;

  const key = agentKey.toLowerCase().trim();

  // Match exato
  if (PERSONAS[key]) return PERSONAS[key];

  // Match parcial (busca a primeira persona cujo nome está contido na key)
  for (const [k, p] of Object.entries(PERSONAS)) {
    if (key.includes(k)) return p;
  }

  return DEFAULT_PERSONA;
}

// ── Markup Tags ───────────────────────────────────────────────────────────────
//
// Tags suportadas pelo Gemini-TTS:
//   [sigh]          — suspiro natural
//   [uhm]           — pausa pensativa
//   [short pause]   — pausa curta (~200ms)
//   [medium pause]  — pausa média (~500ms)
//   [long pause]    — pausa longa (~800ms)
//   [laughing]      — risada suave
//   [whispering]    — sussurro
//
// Outros providers: os tags são REMOVIDOS (não enviados como texto literal).

/**
 * Injeta markup tags no texto para deixar a fala mais natural no Gemini-TTS.
 *
 * Regras aplicadas:
 *   - Pausa curta antes de valores monetários (R$)
 *   - Pausa curta antes de datas e horários formatados
 *   - Pausa curta após interrogação seguida de afirmação
 *   - Pausa curta após vírgula em frases longas
 */
export function injectMarkupTags(text: string): string {
  let out = text;

  // Pausa antes de valores monetários
  out = out.replace(/(\s)(R\$\s?\d)/g, '$1[short pause]$2');

  // Pausa antes de datas (dd/mm) e horários (10h30, 9h)
  out = out.replace(/(\s)(\d{1,2}\/\d{1,2}|\d{1,2}h\d{0,2})(\b)/g, '$1[short pause]$2$3');

  // Pausa após interrogação seguida de nova frase (suaviza transição)
  out = out.replace(/(\?)\s+([A-ZÀ-ÖØ-öø-ÿ])/g, '$1 [short pause] $2');

  // Pausa após vírgula em frase com 20+ chars antes do próximo ponto/!/?
  out = out.replace(/,(\s)(?=[A-Za-zÀ-ÖØ-öø-ÿ][^,!?.]{20,}[.!?])/g, ',[short pause]$1');

  return out;
}

/**
 * Remove todos os markup tags do texto.
 * Usado quando o provider de TTS não suporta markup (Chirp3-HD, Neural2).
 */
export function stripMarkupTags(text: string): string {
  return text
    .replace(/\[(sigh|uhm|short pause|medium pause|long pause|laughing|whispering)\]/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export const voicePersonaService = { getPersona, injectMarkupTags, stripMarkupTags };
export default voicePersonaService;
