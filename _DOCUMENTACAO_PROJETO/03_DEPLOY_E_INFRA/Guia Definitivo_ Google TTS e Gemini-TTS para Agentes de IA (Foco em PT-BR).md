# Guia Definitivo: Google TTS e Gemini-TTS para Agentes de IA (Foco em PT-BR)

Este guia apresenta as atualizações mais recentes e as melhores práticas para elevar a qualidade do áudio dos seus agentes de IA utilizando as tecnologias do Google, com foco especial no cenário brasileiro.

---

## 1. O Salto Tecnológico: Gemini-TTS (Gemini 1.5 Flash & 3.1)

A maior inovação recente é o **Gemini-TTS**, disponível via Google AI Studio e Google Cloud Vertex AI. Ao contrário do TTS tradicional, ele é um modelo multimodal que entende o contexto e aceita comandos em linguagem natural para moldar a voz.

### Principais Diferenciais:
- **Expressividade Humana:** Capaz de reproduzir entonações, pausas e respirações naturais.
- **Baixa Latência:** Ideal para conversas em tempo real.
- **Controle por Prompts:** Você não apenas envia o texto, mas também uma "instrução de estilo".

---

## 2. Comandos de Emoção e Entonação (Markup Tags)

O Gemini-TTS introduziu um sistema de **Markup Tags** (em colchetes) que permite inserir comportamentos não-verbais e modificar o estilo dinamicamente.

### Tabela de Comandos Disponíveis (Modo Preview):

| Categoria | Comando | Efeito no Áudio |
| :--- | :--- | :--- |
| **Sons Não-Verbais** | `[sigh]` | Insere um suspiro natural. |
| | `[laughing]` | Insere uma risada (o tom depende do contexto). |
| | `[uhm]` | Insere uma hesitação/pausa pensativa. |
| **Modificadores de Estilo** | `[sarcasm]` | Aplica um tom sarcástico à frase seguinte. |
| | `[whispering]` | Reduz o volume para um sussurro. |
| | `[shouting]` | Aumenta o volume e a intensidade (grito). |
| | `[extremely fast]` | Aumenta drasticamente a velocidade da fala. |
| | `[robotic]` | Torna a fala subsequente mecanizada. |
| **Pausas e Ritmo** | `[short pause]` | Pausa breve (~250ms). |
| | `[medium pause]` | Pausa padrão (~500ms). |
| | `[long pause]` | Pausa dramática (~1000ms+). |

> **Dica de Ouro:** Para emoções como `[scared]`, `[curious]` ou `[bored]`, o modelo pode acabar falando a palavra. O ideal é usar o **Style Prompt** (descrito abaixo) para definir essas emoções de forma global.

---

## 3. As Três Alavancas do Controle de Voz

Para obter o melhor resultado, você deve alinhar três elementos:

1.  **Style Prompt (Instrução de Estilo):** Define o "personagem".
    *   *Exemplo:* "Você é um assistente virtual brasileiro, muito amigável, entusiasmado e fala de forma coloquial."
2.  **Text Content (Conteúdo do Texto):** O texto deve ser condizente com a emoção.
    *   *Ruim:* Style Prompt "Assustado" + Texto "A reunião é às 14h."
    *   *Bom:* Style Prompt "Assustado" + Texto "Ouvi um barulho estranho vindo do porão... [sigh] melhor eu não ir lá."
3.  **Markup Tags:** Use para pontuar momentos específicos (risadas, suspiros, pausas).

---

## 4. Melhores Vozes para Português-BR (PT-BR)

Para agentes de IA de alta qualidade, evite as vozes "Standard". Foque nas seguintes categorias:

### A. Vozes Chirp 3 (HD) - O Topo da Linha
Estas são as vozes que alimentam o Gemini-TTS. Elas possuem nomes de estrelas e são as mais realistas.
- **Femininas:** `pt-BR-Chirp3-HD-Achernar`, `pt-BR-Chirp3-HD-Aoede`, `pt-BR-Chirp3-HD-Kore`, `pt-BR-Chirp3-HD-Leda`.
- **Masculinas:** `pt-BR-Chirp3-HD-Achird`, `pt-BR-Chirp3-HD-Algenib`, `pt-BR-Chirp3-HD-Charon`, `pt-BR-Chirp3-HD-Orus`.

### B. Vozes Neural2
Excelente custo-benefício com alta fidelidade.
- `pt-BR-Neural2-A` (Feminina)
- `pt-BR-Neural2-B` (Masculina)
- `pt-BR-Neural2-C` (Feminina)

### C. Vozes Studio
Focadas em narração de longo formato (e-books, notícias).
- Verifique a disponibilidade de `pt-BR-Studio-O` ou similares no seu console, pois a Google está expandindo a linha Studio para PT-BR constantemente.

---

## 5. Cenário de Implementação para Agentes de IA

Se você estiver construindo um agente, aqui está como configurar o cenário:

### Configuração no Google AI Studio / Vertex AI:
- **Model:** `gemini-1.5-flash-tts` ou `gemini-3.1-flash-tts-preview`.
- **System Instructions (Prompt):** "Você é um atendente de suporte brasileiro da empresa X. Sua voz deve ser calma, profissional, mas acolhedora. Use pausas naturais e demonstre empatia."
- **Input de Exemplo:** "Olá! [short pause] Entendo perfeitamente o seu problema. [sigh] Realmente é uma situação chata, mas não se preocupe, eu vou te ajudar agora mesmo."

### Melhoria de Qualidade Técnica:
- **Sample Rate:** Use **24000Hz** ou **48000Hz** para clareza máxima.
- **Encoding:** Use **LINEAR16** (WAV) para processamento ou **MP3** para economia de banda sem muita perda perceptível.

---

## 6. Resumo de Dicas para Qualidade Máxima

1.  **Contexto é Tudo:** Sempre preencha o campo "Scene" ou forneça um prompt de sistema detalhado sobre quem está falando.
2.  **Pontuação Criativa:** Use reticências (...) para hesitações naturais e pontos de exclamação para mudar a energia da voz.
3.  **Evite Overload de Tags:** Muitas tags `[laughing]` ou `[sigh]` em sequência podem tornar a voz caricata. Use com moderação.
4.  **Teste de Temperatura:** No Vertex AI, ajustar a `temperature` pode influenciar a "aleatoriedade" e naturalidade da entonação.

---
*Este documento foi gerado com base nas atualizações de Abril de 2026 das ferramentas Google Cloud e Gemini.*
