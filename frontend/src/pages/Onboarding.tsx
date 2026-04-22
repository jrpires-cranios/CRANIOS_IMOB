// @ts-nocheck
import { useState, useEffect, useRef } from "react";

// ─── THEME ───────────────────────────────────────────────────
const T = {
  bg: "#060A14", surface: "#0C1220", card: "#111827",
  border: "rgba(255,255,255,0.07)", borderBright: "rgba(59,130,246,0.4)",
  accent: "#3B82F6", accentGlow: "rgba(59,130,246,0.15)",
  gold: "#F59E0B", goldGlow: "rgba(245,158,11,0.15)",
  green: "#10B981", greenGlow: "rgba(16,185,129,0.15)",
  red: "#EF4444", purple: "#8B5CF6", teal: "#06B6D4",
  textPrimary: "#F9FAFB", textSecondary: "#9CA3AF", textMuted: "#4B5563",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.bg}; }
  ::-webkit-scrollbar { width: 4px; } 
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
  input, select, textarea { background: ${T.surface}; border: 1px solid ${T.border}; color: ${T.textPrimary}; border-radius: 8px; padding: 10px 14px; font-size: 13px; font-family: 'Inter', sans-serif; width: 100%; transition: border-color 0.2s, box-shadow 0.2s; outline: none; }
  input:focus, select:focus, textarea:focus { border-color: ${T.accent}; box-shadow: 0 0 0 3px ${T.accentGlow}; }
  input::placeholder, textarea::placeholder { color: ${T.textMuted}; }
  select option { background: ${T.card}; }
  label { font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${T.textSecondary}; display: block; margin-bottom: 6px; }
  textarea { resize: vertical; min-height: 80px; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes progressFill { from{width:0} to{width:var(--w)} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
`;

// ─── AGENTS CONFIG ───────────────────────────────────────────
const AGENTS_BASE = [
  { key: "ELENA", role: "Recepcionista Digital", emoji: "👋", desc: "Primeiro contato, acolhimento e captura do nome", defaultTone: "Acolhedor e caloroso" },
  { key: "RICARDO", role: "Consultor de Imóveis", emoji: "🏡", desc: "Apresentação de imóveis e entusiasmo comercial", defaultTone: "Entusiasmado e especialista" },
  { key: "AMANDA", role: "Especialista em Qualificação", emoji: "🎯", desc: "Filtragem de perfis e análise financeira", defaultTone: "Direto e analítico" },
  { key: "CARLOS", role: "Coordenador de Agendas", emoji: "📅", desc: "Agendamento de visitas e confirmações", defaultTone: "Eficiente e pontual" },
  { key: "LUCAS", role: "Consultor Financeiro", emoji: "💰", desc: "Crédito imobiliário, simuladores e taxas", defaultTone: "Técnico mas acessível" },
  { key: "BRUNA", role: "Jurídico e Contratos", emoji: "⚖️", desc: "Documentação, contratos e LGPD", defaultTone: "Formal e preciso" },
  { key: "GABRIEL", role: "Especialista em Lançamentos", emoji: "🚀", desc: "SDR de produtos premium e lançamentos", defaultTone: "Exclusivo e visionário" },
  { key: "MARINA", role: "Depto. Financeiro", emoji: "🧾", desc: "Boletos, cobranças e orçamentos via Asaas", defaultTone: "Organizado e cordial" },
  { key: "ROBERTO", role: "Coordenador de Serviços", emoji: "🔧", desc: "Vistorias e manutenção técnica", defaultTone: "Técnico e confiável" },
];

const TONE_OPTIONS = [
  "Acolhedor e caloroso", "Formal e corporativo", "Jovem e descontraído",
  "Exclusivo e sofisticado", "Técnico e preciso", "Consultivo e empático",
  "Direto ao ponto", "Entusiasmado e energético",
];

const INTEGRATIONS = [
  { key: "olx", name: "OLX Imóveis", emoji: "🔵", type: "portal" },
  { key: "zap", name: "ZAP Imóveis", emoji: "🔴", type: "portal" },
  { key: "viva", name: "Viva Real", emoji: "🟠", type: "portal" },
  { key: "imovelweb", name: "Imovel Web", emoji: "🟢", type: "portal" },
  { key: "asaas", name: "Asaas (Financeiro)", emoji: "💳", type: "financeiro" },
  { key: "instagram", name: "Instagram DM", emoji: "📸", type: "social" },
  { key: "facebook", name: "Facebook Messenger", emoji: "💬", type: "social" },
  { key: "tiktok", name: "TikTok Mensagens", emoji: "🎵", type: "social" },
  { key: "telegram", name: "Telegram Bot", emoji: "✈️", type: "social" },
  { key: "whatsapp", name: "WhatsApp Business", emoji: "📱", type: "social" },
];

const STEPS = [
  { id: 1, title: "Empresa", icon: "🏢", desc: "Dados da imobiliária" },
  { id: 2, title: "Mercado", icon: "📍", desc: "Região e especialidades" },
  { id: 3, title: "Marca", icon: "🎨", desc: "Identidade e tom de voz" },
  { id: 4, title: "Contratos", icon: "📋", desc: "Parâmetros de locação e multas" },
  { id: 5, title: "Agentes IA", icon: "🤖", desc: "Nomes e personalidades" },
  { id: 6, title: "Integrações", icon: "🔌", desc: "APIs e webhooks" },
  { id: 7, title: "Infraestrutura", icon: "⚙️", desc: "Supabase, R2, Pinecone" },
  { id: 8, title: "Deploy", icon: "🚀", desc: "Provisionar sistema" },
];

// ─── RAG PREVIEW GENERATOR ────────────────────────────────────
function generateRagPreview(agentKey, formData) {
  const agents = formData.agents || {};
  const ag = agents[agentKey] || {};
  const company = formData.company || {};
  const market = formData.market || {};
  const brand = formData.brand || {};

  const agentBase = AGENTS_BASE.find(a => a.key === agentKey);
  const name = ag.name || agentBase?.role || agentKey;
  const tone = ag.tone || brand.globalTone || agentBase?.defaultTone || "Profissional";
  const imob = company.name || "[Nome da Imobiliária]";
  const city = market.city || "[Cidade]";
  const bairros = (market.neighborhoods || "").split(",").filter(Boolean).slice(0, 3).join(", ") || "[Bairros]";
  const types = (market.propertyTypes || []).join(", ") || "[Tipos de imóvel]";
  const customObs = ag.customObs || "";

  return `# ${name} — ${agentBase?.role}
## RAG Gerado Automaticamente · ${imob}

**Imobiliária:** ${imob}
**Cidade Principal:** ${city}
**Bairros de Atuação:** ${bairros}
**Especialidade em Imóveis:** ${types}

---

## IDENTIDADE E PERSONA

**Nome:** ${name}
**Cargo:** ${agentBase?.role}
**Tom de Voz:** ${tone}
**Empresa:** ${imob}

${customObs ? `**Observações Personalizadas:**\n${customObs}\n` : ""}
---

## ABERTURA PADRÃO

\`\`\`
Olá! Sou ${name}, da ${imob}!
${brand.slogan ? `"${brand.slogan}"\n` : ""}
[Continua com script base do agente...]
\`\`\`

## CONTEXTO REGIONAL

A ${imob} atua em ${city}, com foco em:
${bairros ? `- Bairros: ${bairros}` : ""}
${types ? `- Tipos: ${types}` : ""}

## NAMESPACE PINECONE

→ \`${(imob || "imob").toLowerCase().replace(/\s+/g, "_")}:${agentKey.toLowerCase()}\`
`;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    company: { name: "", creci: "", email: "", phone: "", site: "" },
    market: { city: "", state: "", neighborhoods: "", propertyTypes: [] },
    brand: { globalTone: "Consultivo e empático", slogan: "", primaryColor: "#3B82F6", logoUrl: "" },
    // ─── Parâmetros Financeiros Padrão (onboard) ───
    contracts: {
      leaseDurationMonths: 30,
      penaltyGraceMonths: 0,
      penaltyExemptionAfterGrace: false,
      penaltyType: 'months_rent',
      penaltyValue: 3,
      penaltyProportional: true,
      noticeDaysTenant: 30,
      adjustmentIndices: ['igpm'],
      defaultAdjustmentIndex: 'igpm',
      adjustmentNoticeDays: 30,
      notificationChannels: ['email', 'whatsapp'],
    },
    // ─── Parâmetros Financeiros de Venda + Taxa Adm. (onboard) ───
    sales: {
      // Comissão de corretores
      commissionPctLaunch: 5.0,         // % para lançamentos
      commissionPctResale: 6.0,         // % para usados
      commissionSplitAgency: 50,        // % que fica na imobiliária
      commissionSplitBroker: 50,        // % do corretor
      allowCustomCommission: true,      // corretor pode alterar no fechamento
      // Taxa administrativa de locação
      adminFeeModel: 'pct_rent',        // 'pct_rent' | 'fixed' | 'guaranteed_pct'
      adminFeePct: 10.0,
      adminFeeMinValue: 100.0,
      intermediationModel: 'pct_first_rent', // 'pct_first_rent' | 'fixed' | 'none'
      intermediationValue: 100.0,       // 100% do 1º aluguel
      // Responsável por contratos de venda
      salesContractEmail: '',
      salesContractTelegram: '',
    },
    agents: Object.fromEntries(AGENTS_BASE.map(a => [a.key, { enabled: true, name: "", tone: "", customObs: "" }])),
    integrations: {},
    customIntegrations: [],
    infra: { supabaseRegion: "sa-east-1", r2Bucket: "", pineconeEnv: "us-east-1-aws" },
  });
  const [ragPreview, setRagPreview] = useState("ELENA");
  const [deploying, setDeploying] = useState(false);
  const [deployLog, setDeployLog] = useState([]);
  const [deployDone, setDeployDone] = useState(false);

  const update = (section, key, value) => setFormData(p => ({ ...p, [section]: { ...p[section], [key]: value } }));
  const updateContracts = (key, value) => setFormData(p => ({ ...p, contracts: { ...p.contracts, [key]: value } }));
  const updateSales = (key, value) => setFormData(p => ({ ...p, sales: { ...p.sales, [key]: value } }));
  const toggleContractIndex = (idx) => {
    const cur = formData.contracts.adjustmentIndices || [];
    const next = cur.includes(idx) ? cur.filter(i => i !== idx) : [...cur, idx];
    updateContracts('adjustmentIndices', next);
    // Se o índice padrão foi removido, atualiza para o primeiro disponível
    if (!next.includes(formData.contracts.defaultAdjustmentIndex)) {
      updateContracts('defaultAdjustmentIndex', next[0] || 'igpm');
    }
  };
  const toggleNotifChannel = (ch) => {
    const cur = formData.contracts.notificationChannels || [];
    const next = cur.includes(ch) ? cur.filter(c => c !== ch) : [...cur, ch];
    updateContracts('notificationChannels', next);
  };
  const updateAgent = (agentKey, field, value) => setFormData(p => ({ ...p, agents: { ...p.agents, [agentKey]: { ...p.agents[agentKey], [field]: value } } }));
  const toggleIntegration = (key) => setFormData(p => ({ ...p, integrations: { ...p.integrations, [key]: !p.integrations[key] } }));
  const togglePropType = (type) => {
    const cur = formData.market.propertyTypes || [];
    const next = cur.includes(type) ? cur.filter(t => t !== type) : [...cur, type];
    update("market", "propertyTypes", next);
  };

  const startDeploy = async () => {
    setDeploying(true);
    setDeployLog([]);

    // Logs simulados para interface visual rica durante disparo
    const initialLogs = [
      { icon: "🗄️", msg: "Enviando dados para Banco de Dados Master...", delay: 600 },
      { icon: "☁️", msg: `Criando infraestrutura do Tenant: ${formData.infra.r2Bucket || formData.company.name?.toLowerCase().replace(/\s+/g, "-") || "imob-docs"}`, delay: 1800 },
    ];

    for (const log of initialLogs) {
      await new Promise(r => setTimeout(r, log.delay));
      setDeployLog(prev => [...prev, log]);
    }

    try {
      const response = await fetch('http://localhost:3005/api/onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setDeployLog(prev => [...prev, { icon: "🔌", msg: "Registrando webhooks e salvando tenant...", delay: 500, success: true }]);
        await new Promise(r => setTimeout(r, 1000));
        setDeployLog(prev => [...prev, { icon: "🤖", msg: "Gerando RAG Template Engine para os 9 agentes...", delay: 500, success: true }]);
        await new Promise(r => setTimeout(r, 1000));
        setDeployLog(prev => [...prev, { icon: "📌", msg: "Indexando vetores no Pinecone assincronamente...", delay: 500, success: true }]);
        await new Promise(r => setTimeout(r, 1000));
        setDeployLog(prev => [...prev, { icon: "✅", msg: "Sistema provisionado e enfileirado com sucesso!", delay: 500, success: true }]);
        setDeployDone(true);
      } else {
        console.error(result.error);
        setDeployLog(prev => [...prev, { icon: "❌", msg: `Falha na API: ${result.error}`, delay: 0, success: false }]);
        setDeployDone(false);
        setDeploying(false);
        alert(`Erro no preenchimento: A API recusou. Certifique-se que executou a migration SQL (Tabela tenants). Detalhe: ${result.error}`);
      }
    } catch (e) {
      setDeployLog(prev => [...prev, { icon: "❌", msg: "Erro de rede ao contactar servidor.", delay: 0, success: false }]);
      setDeployDone(false);
      setDeploying(false);
    }
  };

  const enabledAgents = AGENTS_BASE.filter(a => formData.agents[a.key]?.enabled);
  const selectedIntegrations = Object.keys(formData.integrations).filter(k => formData.integrations[k]);

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter', sans-serif", color: T.textPrimary }}>
        {/* HEADER */}
        <div style={{ borderBottom: `1px solid ${T.border}`, padding: "0 32px", display: "flex", alignItems: "center", height: 60, background: T.surface, position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 40 }}>
            <div style={{ width: 30, height: 30, background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🏢</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>ImobSystem</div>
              <div style={{ fontSize: 10, color: T.textMuted }}>Onboarding de Imobiliárias</div>
            </div>
          </div>
          {/* Steps */}
          <div style={{ display: "flex", gap: 4, flex: 1 }}>
            {STEPS.map((s, i) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button onClick={() => done && setStep(s.id)} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
                    borderRadius: 20, border: active ? `1px solid ${T.accent}` : `1px solid ${T.border}`,
                    background: active ? T.accentGlow : done ? T.greenGlow : "transparent",
                    color: active ? T.accent : done ? T.green : T.textMuted,
                    cursor: done ? "pointer" : "default", fontSize: 11, fontWeight: 600, transition: "all 0.2s",
                    whiteSpace: "nowrap",
                  }}>
                    <span>{done ? "✓" : s.icon}</span>
                    <span style={{ display: window.innerWidth > 900 ? "block" : "none" }}>{s.title}</span>
                  </button>
                  {i < STEPS.length - 1 && <div style={{ width: 12, height: 1, background: done ? T.green : T.border }} />}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", height: "calc(100vh - 60px)" }}>
          {/* ─── MAIN FORM ─────────────────────────────────────── */}
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 36px" }}>
            <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 680 }}>

              {/* Step title */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T.accent, marginBottom: 8 }}>
                  Passo {step} de {STEPS.length} — {STEPS[step - 1].desc}
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>
                  {STEPS[step - 1].icon} {STEPS[step - 1].title}
                </div>
              </div>

              {/* ── STEP 1: EMPRESA ─────────────────────────── */}
              {step === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Row>
                    <Field label="Nome da Imobiliária *">
                      <input value={formData.company.name} onChange={e => update("company", "name", e.target.value)} placeholder="Ex: Horizonte Imóveis" />
                    </Field>
                    <Field label="CRECI *">
                      <input value={formData.company.creci} onChange={e => update("company", "creci", e.target.value)} placeholder="CRECI-BA 12345-J" />
                    </Field>
                  </Row>
                  <Row>
                    <Field label="E-mail de Gestão *">
                      <input type="email" value={formData.company.email} onChange={e => update("company", "email", e.target.value)} placeholder="gestor@imobiliaria.com.br" />
                    </Field>
                    <Field label="Telefone / WhatsApp">
                      <input value={formData.company.phone} onChange={e => update("company", "phone", e.target.value)} placeholder="(71) 99999-0000" />
                    </Field>
                  </Row>
                  <Field label="Site (opcional)">
                    <input value={formData.company.site} onChange={e => update("company", "site", e.target.value)} placeholder="https://horizonte.com.br" />
                  </Field>
                  <InfoBox icon="ℹ️" text="O nome da imobiliária será usado em todos os scripts dos agentes de IA e como identificador do namespace no Pinecone." />
                </div>
              )}

              {/* ── STEP 2: MERCADO ─────────────────────────── */}
              {step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Row>
                    <Field label="Cidade Principal *">
                      <input value={formData.market.city} onChange={e => update("market", "city", e.target.value)} placeholder="Salvador" />
                    </Field>
                    <Field label="Estado">
                      <select value={formData.market.state} onChange={e => update("market", "state", e.target.value)}>
                        <option value="">Selecione...</option>
                        {["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"].sort().map(s => <option key={s}>{s}</option>)}
                      </select>
                    </Field>
                  </Row>
                  <Field label="Bairros de Atuação (separados por vírgula)">
                    <textarea value={formData.market.neighborhoods} onChange={e => update("market", "neighborhoods", e.target.value)} placeholder="Barra, Itaigara, Pituba, Rio Vermelho, Ondina, Graça..." rows={3} />
                  </Field>
                  <Field label="Tipos de Imóvel Trabalhados">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                      {["Apartamento", "Casa", "Studio", "Cobertura", "Terreno", "Sala Comercial", "Loja", "Galpão", "Lançamento"].map(t => (
                        <Chip key={t} active={(formData.market.propertyTypes || []).includes(t)} onClick={() => togglePropType(t)}>{t}</Chip>
                      ))}
                    </div>
                  </Field>
                  <InfoBox icon="📍" text="Essas informações serão inseridas automaticamente no RAG de cada agente, dando contexto geográfico para respostas mais precisas e relevantes." color={T.gold} />
                </div>
              )}

              {/* ── STEP 3: MARCA ───────────────────────────── */}
              {step === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Field label="Tom de Voz Global da Marca">
                    <select value={formData.brand.globalTone} onChange={e => update("brand", "globalTone", e.target.value)}>
                      {TONE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Slogan ou Frase de Posicionamento">
                    <input value={formData.brand.slogan} onChange={e => update("brand", "slogan", e.target.value)} placeholder="Ex: 'Realizando o sonho do lar ideal'" />
                  </Field>
                  <Field label="Cor Primária da Marca">
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input type="color" value={formData.brand.primaryColor} onChange={e => update("brand", "primaryColor", e.target.value)} style={{ width: 48, height: 40, padding: 2, cursor: "pointer" }} />
                      <input value={formData.brand.primaryColor} onChange={e => update("brand", "primaryColor", e.target.value)} style={{ flex: 1 }} placeholder="#3B82F6" />
                    </div>
                  </Field>
                  <Field label="Logomarca (Upload)">
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      {formData.brand.logoUrl && (
                        <div style={{ padding: 4, background: "white", borderRadius: 8 }}>
                          <img src={formData.brand.logoUrl} alt="Logo" style={{ height: 48, objectFit: "contain" }} />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              update("brand", "logoUrl", reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ flex: 1, padding: 8 }}
                      />
                    </div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Formatos aceitos: PNG, JPG ou SVG.</div>
                  </Field>
                  <Field label="Personalidade da Marca (usado nos prompts dos agentes)">
                    <textarea value={formData.brand.personality} onChange={e => update("brand", "personality", e.target.value)}
                      placeholder="Ex: Somos uma imobiliária premium focada em famílias. Nossos clientes esperam atendimento sofisticado, respostas rápidas e total transparência..." rows={4} />
                  </Field>
                  <InfoBox icon="🎨" text="O tom de voz global será aplicado como padrão a todos os agentes. Cada agente pode ter seu tom individualizado no próximo passo." color={T.purple} />
                </div>
              )}

              {/* ── STEP 4: CONTRATOS / PARAMETRIZAÇÃO FINANCEIRA ─── */}
              {step === 4 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ background: T.card, borderRadius: 14, padding: 20, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: T.gold, marginBottom: 16 }}>📋 Contrato Padrão</div>
                    <Row>
                      <Field label="Prazo do Contrato (meses)">
                        <input type="number" min="12" max="60" value={formData.contracts.leaseDurationMonths}
                          onChange={e => updateContracts('leaseDurationMonths', parseInt(e.target.value) || 30)} />
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Sugestão: 30 meses. Mínimo legal: 12 meses.</div>
                      </Field>
                      <Field label="Aviso Prévio Inquilino (dias)">
                        <input type="number" min="15" value={formData.contracts.noticeDaysTenant}
                          onChange={e => updateContracts('noticeDaysTenant', parseInt(e.target.value) || 30)} />
                      </Field>
                    </Row>
                    <div style={{ marginTop: 14 }}>
                      <label>Tipo de Multa por Rescisão Antecipada</label>
                      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                        {[{ v: 'months_rent', l: '📆 Nº de Aluguéis' }, { v: 'pct_contract', l: '📊 % do Contrato' }].map(o => (
                          <button key={o.v} onClick={() => updateContracts('penaltyType', o.v)} style={{
                            flex: 1, padding: "10px 14px", borderRadius: 8, border: `1px solid ${formData.contracts.penaltyType === o.v ? T.gold : T.border}`,
                            background: formData.contracts.penaltyType === o.v ? T.goldGlow : 'transparent',
                            color: formData.contracts.penaltyType === o.v ? T.gold : T.textSecondary,
                            cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s"
                          }}>{o.l}</button>
                        ))}
                      </div>
                    </div>
                    <Row>
                      <Field label={formData.contracts.penaltyType === 'months_rent' ? 'Nº de Aluguéis de Multa' : 'Percentual de Multa (%)'}>
                        <input type="number" min="0" step="0.5" value={formData.contracts.penaltyValue}
                          onChange={e => updateContracts('penaltyValue', parseFloat(e.target.value) || 3)} />
                      </Field>
                      <Field label="Carência de Multa (meses)">
                        <input type="number" min="0" value={formData.contracts.penaltyGraceMonths}
                          onChange={e => updateContracts('penaltyGraceMonths', parseInt(e.target.value) || 0)} />
                      </Field>
                    </Row>
                    <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Toggle active={formData.contracts.penaltyProportional} onClick={() => updateContracts('penaltyProportional', !formData.contracts.penaltyProportional)} />
                        <span style={{ fontSize: 13, color: T.textSecondary }}>Multa proporcional ao tempo restante</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Toggle active={formData.contracts.penaltyExemptionAfterGrace} onClick={() => updateContracts('penaltyExemptionAfterGrace', !formData.contracts.penaltyExemptionAfterGrace)} />
                        <span style={{ fontSize: 13, color: T.textSecondary }}>Isento após carência</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: T.card, borderRadius: 14, padding: 20, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: T.teal, marginBottom: 16 }}>📈 Reajuste de Aluguel</div>
                    <Field label="Índices Aceitos pela Imobiliária">
                      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                        {['igpm', 'ipca', 'inpc'].map(idx => {
                          const labels = { igpm: 'IGP-M (FGV)', ipca: 'IPCA (IBGE)', inpc: 'INPC (IBGE)' };
                          const active = (formData.contracts.adjustmentIndices || []).includes(idx);
                          return (
                            <button key={idx} onClick={() => toggleContractIndex(idx)} style={{
                              flex: 1, padding: "10px 14px", borderRadius: 8,
                              border: `1px solid ${active ? T.teal : T.border}`,
                              background: active ? T.teal + '22' : 'transparent',
                              color: active ? T.teal : T.textSecondary,
                              cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.15s"
                            }}>{active ? '✓ ' : ''}{labels[idx]}</button>
                          );
                        })}
                      </div>
                    </Field>
                    <Field label="Índice Padrão (pré-selecionado nos contratos)">
                      <select value={formData.contracts.defaultAdjustmentIndex}
                        onChange={e => updateContracts('defaultAdjustmentIndex', e.target.value)}>
                        {(formData.contracts.adjustmentIndices || ['igpm']).map(idx => (
                          <option key={idx} value={idx}>{idx.toUpperCase()}</option>
                        ))}
                      </select>
                    </Field>
                    <Row>
                      <Field label="Antecedência do Aviso (dias)">
                        <input type="number" min="7" value={formData.contracts.adjustmentNoticeDays}
                          onChange={e => updateContracts('adjustmentNoticeDays', parseInt(e.target.value) || 30)} />
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>A IA enviará aviso este nº de dias antes do aniversário do contrato.</div>
                      </Field>
                      <Field label="Canais de Notificação">
                        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                          {[{ k: 'email', l: '📧 E-mail' }, { k: 'whatsapp', l: '📱 WhatsApp' }, { k: 'push', l: '🔔 Push' }].map(ch => {
                            const active = (formData.contracts.notificationChannels || []).includes(ch.k);
                            return (
                              <button key={ch.k} onClick={() => toggleNotifChannel(ch.k)} style={{
                                padding: "6px 12px", borderRadius: 8, border: `1px solid ${active ? T.accent : T.border}`,
                                background: active ? T.accentGlow : 'transparent', color: active ? T.accent : T.textSecondary,
                                cursor: "pointer", fontSize: 11, fontWeight: 600, transition: "all 0.15s"
                              }}>{ch.l}</button>
                            );
                          })}
                        </div>
                      </Field>
                    </Row>
                    <InfoBox icon="⚖️" text="Reajuste anual (12 meses) — bloqueado por lei (Art. 17, Lei 8.245/91). Avisos gerados automaticamente para todos os contratos." color={T.teal} />
                  </div>
                  <div style={{ background: T.card, borderRadius: 14, padding: 20, border: `1px solid ${T.gold}33` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.gold, marginBottom: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>👁 Como o Agente de Contratos Vai Descrever:</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.green, lineHeight: 1.8, padding: "12px 16px", background: T.bg, borderRadius: 8 }}>
                      <div>📋 Contrato padrão: <strong style={{ color: T.textPrimary }}>{formData.contracts.leaseDurationMonths} meses</strong></div>
                      <div>📈 Reajuste: Anual pelo <strong style={{ color: T.textPrimary }}>{(formData.contracts.defaultAdjustmentIndex || 'igpm').toUpperCase()}</strong></div>
                      <div>⚠️ Multa: <strong style={{ color: T.textPrimary }}>
                        {formData.contracts.penaltyType === 'months_rent'
                          ? `${formData.contracts.penaltyValue} aluguel(eis)${formData.contracts.penaltyProportional ? " (proporcional)" : ""}`
                          : `${formData.contracts.penaltyValue}% do contrato`}
                      </strong></div>
                      {formData.contracts.penaltyGraceMonths > 0 && (
                        <div>🕐 Carência: <strong style={{ color: T.textPrimary }}>{formData.contracts.penaltyGraceMonths} meses{formData.contracts.penaltyExemptionAfterGrace ? " (isento após)" : ""}</strong></div>
                      )}
                      <div>🔔 Aviso: <strong style={{ color: T.textPrimary }}>{formData.contracts.adjustmentNoticeDays} dias antes</strong> via {(formData.contracts.notificationChannels || []).join(" + ")}</div>
                    </div>
                  </div>

                  {/* --- Comissão de Corretores --- */}
                  <div style={{ background: T.card, borderRadius: 14, padding: 20, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.purple, marginBottom: 16 }}>💼 Comissão de Corretores — Venda</div>
                    <Row>
                      <Field label="% Comissão — Lançamentos">
                        <input type="number" min="0" max="20" step="0.5" value={formData.sales.commissionPctLaunch}
                          onChange={e => updateSales('commissionPctLaunch', parseFloat(e.target.value) || 5)} />
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Mercado: 4% – 6%</div>
                      </Field>
                      <Field label="% Comissão — Usados">
                        <input type="number" min="0" max="20" step="0.5" value={formData.sales.commissionPctResale}
                          onChange={e => updateSales('commissionPctResale', parseFloat(e.target.value) || 6)} />
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Mercado: 6% – 8%</div>
                      </Field>
                    </Row>
                    <div style={{ marginTop: 14 }}>
                      <label>Divisão da Comissão (Imobiliária / Corretor) — soma = 100%</label>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>Imobiliária (%)</div>
                          <input type="number" min="0" max="100" value={formData.sales.commissionSplitAgency}
                            onChange={e => {
                              const v = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                              updateSales('commissionSplitAgency', v);
                              updateSales('commissionSplitBroker', 100 - v);
                            }} />
                        </div>
                        <div style={{ fontSize: 20, color: T.textMuted, paddingTop: 14 }}>/</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>Corretor (%)</div>
                          <input type="number" min="0" max="100" value={formData.sales.commissionSplitBroker}
                            onChange={e => {
                              const v = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                              updateSales('commissionSplitBroker', v);
                              updateSales('commissionSplitAgency', 100 - v);
                            }} />
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
                      <Toggle active={formData.sales.allowCustomCommission} onClick={() => updateSales('allowCustomCommission', !formData.sales.allowCustomCommission)} />
                      <div>
                        <div style={{ fontSize: 13, color: T.textSecondary }}>Corretor pode personalizar % no fechamento</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>Se desativado, o % fica bloqueado (readonly) no formulário de fechamento.</div>
                      </div>
                    </div>
                    <Row style={{ marginTop: 14 }}>
                      <Field label="Responsável por Contratos — E-mail">
                        <input type="text" value={formData.sales.salesContractEmail}
                          onChange={e => updateSales('salesContractEmail', e.target.value)}
                          placeholder="contratos@suaimobiliaria.com.br" />
                      </Field>
                      <Field label="Responsável — Telegram (@user ou chat_id)">
                        <input type="text" value={formData.sales.salesContractTelegram}
                          onChange={e => updateSales('salesContractTelegram', e.target.value)}
                          placeholder="@gestor_contratos ou 123456789" />
                      </Field>
                    </Row>
                    <InfoBox icon="⚖️" text={`Comissão de lançamento: ${formData.sales.commissionPctLaunch}% | Usado: ${formData.sales.commissionPctResale}% | Split: ${formData.sales.commissionSplitAgency}% imob / ${formData.sales.commissionSplitBroker}% corretor`} color={T.purple} />
                  </div>

                  {/* --- Taxa Administrativa de Locação --- */}
                  <div style={{ background: T.card, borderRadius: 14, padding: 20, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.green, marginBottom: 16 }}>🏷️ Taxa Administrativa de Locação</div>
                    <Field label="Modelo de Cobrança">
                      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                        {[
                          { v: 'pct_rent', l: '📊 % do Aluguel' },
                          { v: 'fixed', l: '🔒 Valor Fixo' },
                          { v: 'guaranteed_pct', l: '🛡️ Aluguel Garantido %' },
                        ].map(o => (
                          <button key={o.v} onClick={() => updateSales('adminFeeModel', o.v)} style={{
                            flex: 1, padding: '8px 10px', borderRadius: 8,
                            border: `1px solid ${formData.sales.adminFeeModel === o.v ? T.green : T.border}`,
                            background: formData.sales.adminFeeModel === o.v ? T.green + '22' : 'transparent',
                            color: formData.sales.adminFeeModel === o.v ? T.green : T.textSecondary,
                            cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
                          }}>{o.l}</button>
                        ))}
                      </div>
                    </Field>
                    <Row>
                      <Field label={formData.sales.adminFeeModel === 'fixed' ? 'Valor Fixo Mensal (R$)' : 'Percentual da Taxa (%)'}>
                        <input type="number" min="0" step={formData.sales.adminFeeModel === 'fixed' ? 10 : 0.5}
                          value={formData.sales.adminFeeModel === 'fixed' ? formData.sales.adminFeeMinValue : formData.sales.adminFeePct}
                          onChange={e => {
                            if (formData.sales.adminFeeModel === 'fixed') updateSales('adminFeeMinValue', parseFloat(e.target.value) || 100);
                            else updateSales('adminFeePct', parseFloat(e.target.value) || 10);
                          }} />
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Mercado: 8% a 12% (% aluguel) | R$80–R$150 (fixo)</div>
                      </Field>
                      {formData.sales.adminFeeModel !== 'fixed' && (
                        <Field label="Taxa Mínima Fixa (R$)">
                          <input type="number" min="0" value={formData.sales.adminFeeMinValue}
                            onChange={e => updateSales('adminFeeMinValue', parseFloat(e.target.value) || 100)}
                            placeholder="100" />
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Cobrada quando % {'<'} mínimo viável.</div>
                        </Field>
                      )}
                    </Row>
                    <div style={{ marginTop: 14 }}>
                      <label>Taxa de Intermediação (novo contrato)</label>
                      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                        {[
                          { v: 'pct_first_rent', l: '🔑 % do 1º Aluguel' },
                          { v: 'fixed', l: '💵 Valor Fixo' },
                          { v: 'none', l: '🚫 Não Cobrar' },
                        ].map(o => (
                          <button key={o.v} onClick={() => updateSales('intermediationModel', o.v)} style={{
                            flex: 1, padding: '8px 10px', borderRadius: 8,
                            border: `1px solid ${formData.sales.intermediationModel === o.v ? T.gold : T.border}`,
                            background: formData.sales.intermediationModel === o.v ? T.goldGlow : 'transparent',
                            color: formData.sales.intermediationModel === o.v ? T.gold : T.textSecondary,
                            cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
                          }}>{o.l}</button>
                        ))}
                      </div>
                    </div>
                    {formData.sales.intermediationModel !== 'none' && (
                      <Field label={formData.sales.intermediationModel === 'pct_first_rent' ? '% do 1º Aluguel' : 'Valor Fixo de Intermediação (R$)'} style={{ marginTop: 12 }}>
                        <input type="number" min="0" step={formData.sales.intermediationModel === 'pct_first_rent' ? 10 : 50}
                          value={formData.sales.intermediationValue}
                          onChange={e => updateSales('intermediationValue', parseFloat(e.target.value) || 100)} />
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Mercado: 50%–100% do 1º aluguel (cobrado na assinatura).</div>
                      </Field>
                    )}
                  </div>
                </div>
              )}

              {/* ── STEP 5: AGENTES ─────────────────────────── */}
              {step === 5 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 4 }}>
                    Configure o nome e a personalidade de cada agente. Agentes desativados não serão provisionados.
                  </div>
                  {AGENTS_BASE.map(agent => {
                    const ag = formData.agents[agent.key];
                    return (
                      <div key={agent.key} style={{
                        background: T.card, border: `1px solid ${ag.enabled ? T.borderBright : T.border}`,
                        borderRadius: 12, padding: 16, transition: "all 0.2s",
                        opacity: ag.enabled ? 1 : 0.5,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: ag.enabled ? 14 : 0 }}>
                          <span style={{ fontSize: 22 }}>{agent.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{agent.role}</div>
                            <div style={{ fontSize: 11, color: T.textMuted }}>{agent.desc}</div>
                          </div>
                          <Toggle active={ag.enabled} onClick={() => updateAgent(agent.key, "enabled", !ag.enabled)} />
                        </div>
                        {ag.enabled && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeIn 0.2s ease" }}>
                            <Row>
                              <Field label="Nome Personalizado">
                                <input value={ag.name} onChange={e => updateAgent(agent.key, "name", e.target.value)} placeholder={`Ex: ${agent.role.split(" ")[0]} da sua marca`} />
                              </Field>
                              <Field label="Tom de Voz (sobrescreve o global)">
                                <select value={ag.tone} onChange={e => updateAgent(agent.key, "tone", e.target.value)}>
                                  <option value="">— Usar tom global —</option>
                                  {TONE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                                </select>
                              </Field>
                            </Row>
                            <Field label="Observações de Persona (opcional)">
                              <input value={ag.customObs} onChange={e => updateAgent(agent.key, "customObs", e.target.value)}
                                placeholder="Ex: Sempre mencione a tradição de 15 anos da empresa" />
                            </Field>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── STEP 6: INTEGRAÇÕES ─────────────────────── */}
              {step === 6 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {["portal", "financeiro", "social"].map(type => {
                    const allIntegrations = [...INTEGRATIONS, ...(formData.customIntegrations || [])];
                    const items = allIntegrations.filter(i => i.type === type);
                    const labels = { portal: "🔗 Portais Imobiliários", financeiro: "💳 Financeiro", social: "📱 Redes Sociais e Mensagens" };
                    return (
                      <div key={type}>
                        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.textSecondary, marginBottom: 10 }}>
                          {labels[type]}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {items.map(int => {
                            const on = !!formData.integrations[int.key];
                            return (
                              <button key={int.key} onClick={() => toggleIntegration(int.key)} style={{
                                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                                background: on ? T.accentGlow : T.card, border: `1px solid ${on ? T.accent : T.border}`,
                                borderRadius: 10, cursor: "pointer", color: on ? T.accent : T.textSecondary,
                                transition: "all 0.15s", textAlign: "left",
                              }}>
                                <span style={{ fontSize: 18 }}>{int.emoji}</span>
                                <span style={{ fontSize: 13, fontWeight: 500 }}>{int.name}</span>
                                {on && <span style={{ marginLeft: "auto", fontSize: 14, color: T.green }}>✓</span>}
                              </button>
                            );
                          })}

                          <button onClick={() => {
                            const name = prompt(`Nome da nova integração (${labels[type]}):`);
                            if (name && name.trim()) {
                              const key = `custom_${Date.now()}`;
                              const nextCustom = [...(formData.customIntegrations || []), { key, name, emoji: "🔌", type }];
                              setFormData(p => ({
                                ...p,
                                customIntegrations: nextCustom,
                                integrations: { ...p.integrations, [key]: true }
                              }));
                            }
                          }} style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 14px",
                            background: "transparent", border: `1px dashed ${T.borderBright}`,
                            borderRadius: 10, cursor: "pointer", color: T.accent,
                            transition: "all 0.15s", fontSize: 12, fontWeight: 500
                          }}>
                            ➕ Customizar...
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {selectedIntegrations.length > 0 && (
                    <div style={{ background: T.card, borderRadius: 12, padding: 16, border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 12 }}>CREDENCIAIS NECESSÁRIAS</div>
                      {selectedIntegrations.map(k => {
                        const allInts = [...INTEGRATIONS, ...(formData.customIntegrations || [])];
                        const intDef = allInts.find(i => i.key === k);
                        if (!intDef) return null;

                        return (
                          <div key={k} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: T.textSecondary, width: 110, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={intDef.name}>
                              {intDef.name}
                            </span>
                            <input placeholder={`Webook URL ou API Key / Token`} style={{ flex: 1, fontSize: 12 }} type="text" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 7: INFRAESTRUTURA ──────────────────── */}
              {step === 7 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>🗄️ Supabase</div>
                    <Row>
                      <Field label="Região do Banco de Dados">
                        <select value={formData.infra.supabaseRegion} onChange={e => update("infra", "supabaseRegion", e.target.value)}>
                          <option value="sa-east-1">South America (São Paulo)</option>
                          <option value="us-east-1">US East (N. Virginia)</option>
                          <option value="eu-west-1">Europe (Ireland)</option>
                        </select>
                      </Field>
                      <Field label="ID da Organização Supabase">
                        <input placeholder="org_xxxxxxxxxxxxxxxx" />
                      </Field>
                    </Row>
                  </div>
                  <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>☁️ Cloudflare R2</div>
                    <Row>
                      <Field label="Nome do Bucket">
                        <input value={formData.infra.r2Bucket || formData.company.name?.toLowerCase().replace(/\s+/g, "-")}
                          onChange={e => update("infra", "r2Bucket", e.target.value)}
                          placeholder="horizonte-docs" />
                      </Field>
                      <Field label="Account ID Cloudflare">
                        <input placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" type="password" />
                      </Field>
                    </Row>
                  </div>
                  <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>📌 Pinecone</div>
                    <Row>
                      <Field label="Ambiente Pinecone">
                        <select value={formData.infra.pineconeEnv} onChange={e => update("infra", "pineconeEnv", e.target.value)}>
                          <option value="us-east-1-aws">AWS us-east-1</option>
                          <option value="us-west4-gcp">GCP us-west4</option>
                          <option value="eu-west4-gcp">GCP eu-west4</option>
                        </select>
                      </Field>
                      <Field label="API Key Pinecone">
                        <input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" type="password" />
                      </Field>
                    </Row>
                    <div style={{ marginTop: 12, padding: 12, background: T.accentGlow, borderRadius: 8, border: `1px solid ${T.borderBright}` }}>
                      <div style={{ fontSize: 11, color: T.accent, fontWeight: 600, marginBottom: 4 }}>NAMESPACES QUE SERÃO CRIADOS</div>
                      <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: T.textSecondary, lineHeight: 1.8 }}>
                        {enabledAgents.map(a => {
                          const name = formData.company.name?.toLowerCase().replace(/\s+/g, "_") || "imob";
                          return <div key={a.key} style={{ color: T.green }}>→ {name}:{a.key.toLowerCase()}</div>;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 8: DEPLOY ──────────────────────────── */}
              {step === 8 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {!deploying && !deployDone && (
                    <>
                      <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
                        <SummaryRow label="Imobiliária" value={formData.company.name || "—"} />
                        <SummaryRow label="Cidade" value={`${formData.market.city || "—"}${formData.market.state ? ", " + formData.market.state : ""}`} />
                        <SummaryRow label="Tom Global" value={formData.brand.globalTone} />
                        <SummaryRow label="Prazo Padrão" value={`${formData.contracts?.leaseDurationMonths || 30} meses`} />
                        <SummaryRow label="Índice Padrão" value={(formData.contracts?.defaultAdjustmentIndex || 'igpm').toUpperCase()} />
                        <SummaryRow label="Agentes Ativos" value={`${enabledAgents.length} de ${AGENTS_BASE.length}`} />
                        <SummaryRow label="Integrações" value={selectedIntegrations.length + " conectadas"} />
                      </div>
                      <button onClick={startDeploy} style={{
                        padding: "16px 32px", background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
                        border: "none", borderRadius: 12, color: "white", cursor: "pointer",
                        fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em",
                        boxShadow: "0 4px 32px rgba(59,130,246,0.4)", transition: "transform 0.15s",
                      }}>
                        🚀 Provisionar Sistema Agora
                      </button>
                    </>
                  )}
                  {(deploying || deployDone) && (
                    <div style={{ background: T.card, borderRadius: 12, padding: 24, border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                        {deployDone ? "✅ Sistema Provisionado com Sucesso!" : "⚙️ Provisionando..."}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {deployLog.map((log, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: log.success ? T.greenGlow : T.accentGlow, border: `1px solid ${log.success ? T.green : T.borderBright}`, animation: "slideIn 0.3s ease" }}>
                            <span>{log.icon}</span>
                            <span style={{ fontSize: 12, color: log.success ? T.green : T.textPrimary }}>{log.msg}</span>
                          </div>
                        ))}
                        {deploying && !deployDone && (
                          <div style={{ display: "flex", gap: 6, padding: "8px 12px" }}>
                            {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, animation: `pulse 1.2s ${i * 0.2}s infinite` }} />)}
                          </div>
                        )}
                      </div>
                      {deployDone && (
                        <div style={{ marginTop: 20, padding: 16, background: T.greenGlow, borderRadius: 10, border: `1px solid ${T.green}` }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.green, marginBottom: 8 }}>🎉 {formData.company.name} está online!</div>
                          <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: T.textSecondary, lineHeight: 1.8 }}>
                            <div>Dashboard: <span style={{ color: T.accent }}>https://app.imobsystem.com.br/{(formData.company.name || "imob").toLowerCase().replace(/\s+/g, "-")}</span></div>
                            <div>Supabase: <span style={{ color: T.accent }}>Banco provisionado em {formData.infra.supabaseRegion}</span></div>
                            <div>Pinecone: <span style={{ color: T.green }}>{enabledAgents.length} namespaces indexados</span></div>
                            <div>Integrações: <span style={{ color: T.gold }}>{selectedIntegrations.length} webhooks ativos</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* NAV BUTTONS */}
              {!deployDone && (
                <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
                  {step > 1 && (
                    <button onClick={() => setStep(s => s - 1)} style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, cursor: "pointer", fontSize: 13 }}>
                      ← Anterior
                    </button>
                  )}
                  {step < 7 && (
                    <button onClick={() => setStep(s => s + 1)} style={{ padding: "10px 24px", background: T.accent, border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, marginLeft: "auto", boxShadow: "0 2px 12px rgba(59,130,246,0.35)" }}>
                      Próximo →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ─── RAG PREVIEW PANEL ─────────────────────────── */}
          <div style={{ width: 360, background: T.surface, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.textMuted, marginBottom: 10 }}>
                📋 Preview do RAG Gerado
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {AGENTS_BASE.filter(a => formData.agents[a.key]?.enabled).map(a => (
                  <button key={a.key} onClick={() => setRagPreview(a.key)} style={{
                    padding: "3px 9px", borderRadius: 20, fontSize: 11, cursor: "pointer", border: "none",
                    background: ragPreview === a.key ? T.accent : T.card,
                    color: ragPreview === a.key ? "white" : T.textSecondary,
                    transition: "all 0.15s",
                  }}>{a.emoji} {formData.agents[a.key]?.name || a.role.split(" ")[0]}</button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              <pre style={{ fontFamily: "JetBrains Mono", fontSize: 10.5, lineHeight: 1.7, color: T.textSecondary, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {generateRagPreview(ragPreview, formData).split("\n").map((line, i) => {
                  let color = T.textSecondary;
                  if (line.startsWith("# ")) color = T.accent;
                  else if (line.startsWith("## ")) color = T.gold;
                  else if (line.startsWith("**")) color = T.textPrimary;
                  else if (line.startsWith("→")) color = T.green;
                  else if (line.startsWith("```")) color = T.purple;
                  return <span key={i} style={{ color, display: "block" }}>{line}</span>;
                })}
              </pre>
            </div>
            <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 10, color: T.textMuted }}>Atualiza em tempo real conforme você preenche</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── SMALL COMPONENTS ────────────────────────────────────────
const Row = ({ children }) => <div style={{ display: "flex", gap: 12 }}>{children}</div>;
const Field = ({ label, children }) => <div style={{ flex: 1 }}><label>{label}</label>{children}</div>;
const InfoBox = ({ icon, text, color = T.accent }) => (
  <div style={{ display: "flex", gap: 10, padding: "10px 14px", background: color + "15", border: `1px solid ${color}33`, borderRadius: 8, fontSize: 12, color: T.textSecondary }}>
    <span>{icon}</span><span>{text}</span>
  </div>
);
const Chip = ({ children, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: "none",
    background: active ? T.accent : T.card, color: active ? "white" : T.textSecondary,
    transition: "all 0.15s",
  }}>{children}</button>
);
const Toggle = ({ active, onClick }) => (
  <button onClick={onClick} style={{
    width: 40, height: 22, borderRadius: 11, background: active ? T.accent : T.textMuted,
    border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s",
  }}>
    <div style={{ position: "absolute", top: 3, left: active ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
  </button>
);
const SummaryRow = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
    <span style={{ color: T.textMuted }}>{label}</span>
    <span style={{ fontWeight: 600 }}>{value}</span>
  </div>
);
