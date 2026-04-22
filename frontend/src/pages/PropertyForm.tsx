// @ts-nocheck
import { useState, useEffect } from 'react';
import apiClient from '../client';
import PriceSuggestionPanel from '../components/PriceSuggestionPanel';

// ─── THEME ───────────────────────────────────────────────────────────────────
const T = {
    bg: '#060A14', surface: '#0C1220', card: '#111827',
    border: 'rgba(255,255,255,0.07)', borderBright: 'rgba(59,130,246,0.4)',
    accent: '#3B82F6', accentGlow: 'rgba(59,130,246,0.12)',
    gold: '#F59E0B', goldGlow: 'rgba(245,158,11,0.12)',
    green: '#10B981', greenGlow: 'rgba(16,185,129,0.12)',
    teal: '#06B6D4', purple: '#8B5CF6', danger: '#EF4444',
    textPrimary: '#F9FAFB', textSecondary: '#9CA3AF', textMuted: '#4B5563',
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.bg}; }
  input[type=text], input[type=number], input[type=date], input[type=url], select, textarea { 
    background: ${T.surface}; border: 1px solid ${T.border}; color: ${T.textPrimary}; 
    border-radius: 8px; padding: 10px 14px; font-size: 13px; font-family: 'Inter', sans-serif; 
    width: 100%; transition: border-color 0.2s, box-shadow 0.2s; outline: none; 
  }
  input:focus, select:focus, textarea:focus { border-color: ${T.accent}; box-shadow: 0 0 0 3px ${T.accentGlow}; }
  select option { background: ${T.card}; }
  label { font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${T.textSecondary}; display: block; margin-bottom: 6px; }
  textarea { resize: vertical; min-height: 80px; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
`;

// ─── Badge de herança ─────────────────────────────────────────────────────────
const InheritedBadge = ({ isInherited, onReset }) => (
    <span
        onClick={isInherited ? undefined : onReset}
        style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
            cursor: isInherited ? 'default' : 'pointer',
            background: isInherited ? T.accent + '22' : T.gold + '22',
            color: isInherited ? T.accent : T.gold,
            border: `1px solid ${isInherited ? T.accent + '44' : T.gold + '44'}`,
            letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'all 0.15s',
            userSelect: 'none',
        }}
        title={isInherited ? 'Usando padrão da imobiliária' : 'Clique para restaurar padrão'}
    >
        {isInherited ? '⟳ Herdado' : '✏ Personalizado'}
    </span>
);

// ─── Componentes auxiliares ───────────────────────────────────────────────────
const Row = ({ children, gap = 12 }) => <div style={{ display: 'flex', gap }}>{children}</div>;
const Field = ({ label, children, flex = 1, badge = null }) => (
    <div style={{ flex }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <label style={{ margin: 0 }}>{label}</label>
            {badge}
        </div>
        {children}
    </div>
);
const Section = ({ title, color = T.accent, icon, children }) => (
    <div style={{ background: T.card, borderRadius: 14, padding: 20, border: `1px solid ${T.border}`, animation: 'fadeIn 0.3s ease' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color, marginBottom: 16 }}>
            {icon} {title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
);
const Toggle = ({ active, onClick }) => (
    <button onClick={onClick} style={{
        width: 40, height: 22, borderRadius: 11, background: active ? T.accent : T.textMuted,
        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
        <div style={{ position: 'absolute', top: 3, left: active ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
    </button>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function PropertyForm({ onBack, propertyId = undefined }: { onBack?: () => void; propertyId?: string | undefined }) {
    // Parâmetros padrão que virão da imobiliária (onboard)
    const [defaults, setDefaults] = useState({
        lease_duration_months: 30,
        penalty_type: 'months_rent',
        penalty_value: 3,
        penalty_proportional: true,
        penalty_grace_months: 0,
        penalty_exemption_after_grace: false,
        adjustment_index: 'igpm',
        adjustment_indices: ['igpm'],
        notice_days_before: 30,
        notification_channels: ['email', 'whatsapp'],
        // Comissão de venda (padrões da agência)
        resolved_commission_pct: 6.0,
        commission_split_agency: 50,
        commission_split_broker: 50,
        allow_custom_commission: true,
        commission_pct_launch: 5.0,
        commission_pct_resale: 6.0,
    });

    // Dados do imóvel
    const [form, setForm] = useState({
        // Dados básicos
        titulo: '', tipo: 'Apartamento', finalidade: 'locacao',
        endereco: '', bairro: '', cidade: '', estado: 'SE', cep: '',
        descricao: '',
        // Área e quartos
        area_total: '', area_construida: '', quartos: '', suites: '', banheiros: '', vagas_garagem: '',
        // Financeiro
        preco_venda: '', preco_locacao: '', valor_caucao: '', valor_iptu: '', valor_condominio: '',
        // ERP - Novos campos
        proprietario_id: '',
        taxa_administracao_pct: '',
        valor_seguro_incendio: '',
        valor_taxa_lixo: '',
        outras_taxas_mensais: '',
        // Características específicas de locação
        aceita_pets: false, aceita_fumantes: false, permite_sublocacao: false,
        mobiliado: 'nao', disponibilidade_data: '',
        // Condições contratuais de locação — nullable = usa herança
        lease_duration_months: null,
        penalty_type: null,
        penalty_value: null,
        penalty_proportional: null,
        penalty_grace_months: null,
        penalty_exemption_after_grace: null,
        adjustment_index: null,
        notice_days_before: null,
        // Condições de venda — nullable = usa herança da agência
        commission_pct: null,   // null = herda (launch 5% ou resale 6%)
        is_launch: false,
        launch_developer: '',
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeSection, setActiveSection] = useState('basicos');
    const [proprietarios, setProprietarios] = useState([]);

    // Campos da sugestão de preço (M6)
    const [sugestaoVenda, setSugestaoVenda] = useState(null);
    const [sugestaoLocacao, setSugestaoLocacao] = useState(null);

    // M9: IA Generativa de Conteúdo
    const [gerandoDesc, setGerandoDesc] = useState(false);
    const [gerandoPost, setGerandoPost] = useState(false);
    const [generatedPost, setGeneratedPost] = useState('');

    // Efeito para buscar preço sugerido M6
    useEffect(() => {
        const { tipo, finalidade, bairro, cidade, quartos, area_construida } = form;
        if (!tipo || !bairro || !cidade || finalidade === '') return;

        const checkParams = {
            tenantId: localStorage.getItem('tenantId') || 'rbhkwmesmvytqdfuwcie',
            tipo,
            bairro,
            cidade,
            quartos: quartos || 0,
            area_construida: area_construida || 0
        };

        const fetchPricing = async () => {
            try {
                if (finalidade === 'venda' || finalidade === 'ambos') {
                    const res = await fetch('/api/imoveis/sugestao-preco', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...checkParams, contexto: 'venda' })
                    });
                    const data = await res.json();
                    if (data.success) setSugestaoVenda(data);
                }
                if (finalidade === 'locacao' || finalidade === 'ambos') {
                    const res = await fetch('/api/imoveis/sugestao-preco', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...checkParams, contexto: 'locacao' })
                    });
                    const data = await res.json();
                    if (data.success) setSugestaoLocacao(data);
                }
            } catch (err) {
                console.error('Erro ao buscar sugestao', err);
            }
        };

        const timer = setTimeout(fetchPricing, 800);
        return () => clearTimeout(timer);
    }, [form.tipo, form.finalidade, form.bairro, form.cidade, form.quartos, form.area_construida]);

    // Busca parâmetros padrão da imobiliária (locação + venda)
    useEffect(() => {
        const tid = localStorage.getItem('tenantId') || 'rbhkwmesmvytqdfuwcie';

        // Busca proprietários para o select
        apiClient.getProprietarios(tid).then(res => {
            if (res.success) setProprietarios(res.proprietarios || []);
        });

        const endpoint = propertyId ? `/api/sales/params/${propertyId}` : null;
        if (endpoint) {
            fetch(endpoint).then(r => r.json()).then(d => {
                if (d.success && d.params) setDefaults(prev => ({ ...prev, ...d.params }));
            }).catch(() => { });
        }
    }, [propertyId]);

    const set = (key, value) => setForm(p => ({ ...p, [key]: value }));
    // Se campo for null, usa o default da imobiliária
    const val = (key) => form[key] !== null && form[key] !== undefined ? form[key] : defaults[key];
    const isInherited = (key) => form[key] === null || form[key] === undefined;
    const resetToDefault = (key) => set(key, null);
    const customizeField = (key, value) => set(key, value);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...form,
                // Envia null para campos não sobrescritos (herança ficará no servidor via view)
            };
            const res = await fetch('/api/imoveis', {
                method: propertyId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(propertyId ? { id: propertyId, ...payload } : payload),
            });
            const json = await res.json();
            if (json.success || json.id) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (e) {
            // Simula sucesso local
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
        setSaving(false);
    };

    const handleGerarConteudo = async (tipo: 'descricao' | 'instagram_post') => {
        if (tipo === 'descricao') setGerandoDesc(true);
        else setGerandoPost(true);

        try {
            const payload = { ...form, id: propertyId, tipoConteudo: tipo };
            const res = await fetch('/api/imoveis/gerar-conteudo', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success && data.text) {
                if (tipo === 'descricao') {
                    set('descricao', data.text);
                } else {
                    setGeneratedPost(data.text);
                }
            } else {
                alert('Erro ao gerar conteúdo: ' + data.error);
            }
        } catch (err) {
            alert('Falha de conexão ao gerar conteúdo');
        } finally {
            if (tipo === 'descricao') setGerandoDesc(false);
            else setGerandoPost(false);
        }
    };

    const navItems = [
        { id: 'basicos', icon: '🏠', label: 'Dados Básicos' },
        { id: 'financeiro', icon: '💰', label: 'Financeiro' },
        { id: 'detalhes', icon: '🛋️', label: 'Detalhes' },
        { id: 'contratos', icon: '📋', label: 'Condições Contratuais' },
        { id: 'marketing', icon: '📱', label: 'Marketing IA' },
    ];

    return (
        <>
            <style>{css}</style>
            <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', sans-serif", color: T.textPrimary, display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {onBack && <button onClick={onBack} style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.textMuted, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>← Voltar</button>}
                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800 }}>
                            {propertyId ? '✏️ Editar Imóvel' : '➕ Cadastrar Imóvel'}
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={saving} style={{
                        padding: '8px 24px', background: saving ? T.textMuted : (saved ? T.green : T.accent),
                        border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: 13, transition: 'all 0.2s', boxShadow: '0 2px 12px rgba(59,130,246,0.3)',
                    }}>
                        {saving ? '⏳ Salvando...' : saved ? '✅ Salvo!' : '💾 Salvar Imóvel'}
                    </button>
                </div>

                <div style={{ display: 'flex', flex: 1 }}>
                    {/* Sidebar Nav */}
                    <div style={{ width: 200, background: T.surface, borderRight: `1px solid ${T.border}`, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {navItems.map(n => (
                            <button key={n.id} onClick={() => setActiveSection(n.id)} style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                                background: activeSection === n.id ? T.accent + '22' : 'transparent',
                                border: `1px solid ${activeSection === n.id ? T.accent + '44' : 'transparent'}`,
                                color: activeSection === n.id ? T.accent : T.textSecondary,
                                cursor: 'pointer', fontSize: 13, fontWeight: activeSection === n.id ? 600 : 400, textAlign: 'left',
                                transition: 'all 0.15s',
                            }}>
                                <span>{n.icon}</span><span>{n.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, padding: '32px 36px', maxWidth: 800, overflowY: 'auto' }}>

                        {activeSection === 'basicos' && (
                            <Section title="Dados Básicos do Imóvel" icon="🏠" color={T.accent}>
                                <div style={{ display: 'flex', gap: 16 }}>
                                    <Field label="Título do Anúncio *" flex={2}>
                                        <input value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ex: Apartamento 3 quartos com varanda gourmet" />
                                    </Field>
                                    <Field label="Proprietário" flex={1}>
                                        <select value={form.proprietario_id} onChange={e => set('proprietario_id', e.target.value)}>
                                            <option value="">— Selecionar —</option>
                                            {proprietarios.map(p => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}
                                        </select>
                                    </Field>
                                </div>
                                <Row>
                                    <Field label="Tipo">
                                        <select value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                                            {['Apartamento', 'Casa', 'Studio', 'Cobertura', 'Kitnet', 'Terreno', 'Sala Comercial', 'Loja', 'Galpão'].map(t => <option key={t}>{t}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Finalidade">
                                        <select value={form.finalidade} onChange={e => set('finalidade', e.target.value)}>
                                            <option value="venda">Venda</option>
                                            <option value="locacao">Locação</option>
                                            <option value="ambos">Venda + Locação</option>
                                        </select>
                                    </Field>
                                </Row>
                                <Field label="Endereço">
                                    <input value={form.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, nº, complemento" />
                                </Field>
                                <Row>
                                    <Field label="Bairro">
                                        <input value={form.bairro} onChange={e => set('bairro', e.target.value)} placeholder="Atalaia" />
                                    </Field>
                                    <Field label="Cidade">
                                        <input value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="Aracaju" />
                                    </Field>
                                    <Field label="UF" flex={0.4}>
                                        <select value={form.estado} onChange={e => set('estado', e.target.value)}>
                                            {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </Field>
                                </Row>
                                <Row>
                                    <Field label="Área Total (m²)">
                                        <input type="number" value={form.area_total} onChange={e => set('area_total', e.target.value)} placeholder="80" />
                                    </Field>
                                    <Field label="Área Construída (m²)">
                                        <input type="number" value={form.area_construida} onChange={e => set('area_construida', e.target.value)} placeholder="65" />
                                    </Field>
                                </Row>
                                <Row>
                                    <Field label="Quartos"><input type="number" value={form.quartos} onChange={e => set('quartos', e.target.value)} placeholder="3" /></Field>
                                    <Field label="Suítes"><input type="number" value={form.suites} onChange={e => set('suites', e.target.value)} placeholder="1" /></Field>
                                    <Field label="Banheiros"><input type="number" value={form.banheiros} onChange={e => set('banheiros', e.target.value)} placeholder="2" /></Field>
                                    <Field label="Vagas Garagem"><input type="number" value={form.vagas_garagem} onChange={e => set('vagas_garagem', e.target.value)} placeholder="2" /></Field>
                                </Row>
                                <Field label="Descrição do Imóvel" badge={
                                    <button 
                                        onClick={(e) => { e.preventDefault(); handleGerarConteudo('descricao'); }} 
                                        disabled={gerandoDesc}
                                        style={{ background: 'linear-gradient(90deg, #8B5CF6, #3B82F6)', border: 'none', borderRadius: 12, padding: '4px 10px', color: 'white', fontSize: 10, fontWeight: 700, cursor: gerandoDesc ? 'not-allowed' : 'pointer', opacity: gerandoDesc ? 0.7 : 1, width: 'fit-content' }}
                                    >
                                        {gerandoDesc ? '⏳ Gerando...' : '✨ Gerar c/ IA'}
                                    </button>
                                }>
                                    <textarea value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Descreva os diferenciais do imóvel para os agentes de IA e para o anúncio..." rows={10} />
                                </Field>
                            </Section>
                        )}

                        {activeSection === 'financeiro' && (
                            <Section title="Financeiro" icon="💰" color={T.gold}>
                                {(form.finalidade === 'venda' || form.finalidade === 'ambos') && (
                                    <>
                                        <Field label="Preço de Venda (R$)">
                                            <input type="number" value={form.preco_venda} onChange={e => set('preco_venda', e.target.value)} placeholder="480000" />
                                        </Field>
                                        <PriceSuggestionPanel 
                                            contexto="venda" 
                                            suggestionData={sugestaoVenda} 
                                            onApply={p => set('preco_venda', String(p))} 
                                        />
                                    </>
                                )}
                                {(form.finalidade === 'locacao' || form.finalidade === 'ambos') && (
                                    <>
                                        <Row>
                                            <Field label="Aluguel Mensal (R$)">
                                                <input type="number" value={form.preco_locacao} onChange={e => set('preco_locacao', e.target.value)} placeholder="2800" />
                                            </Field>
                                            <Field label="Caução (R$)">
                                                <input type="number" value={form.valor_caucao} onChange={e => set('valor_caucao', e.target.value)} placeholder="5600" />
                                                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Sugestão: 2x o valor do aluguel.</div>
                                            </Field>
                                        </Row>
                                        <PriceSuggestionPanel 
                                            contexto="locacao" 
                                            suggestionData={sugestaoLocacao} 
                                            onApply={p => set('preco_locacao', String(p))} 
                                        />
                                    </>
                                )}
                                <Row>
                                    <Field label="IPTU Mensal (R$)">
                                        <input type="number" value={form.valor_iptu} onChange={e => set('valor_iptu', e.target.value)} placeholder="120" />
                                    </Field>
                                    <Field label="Condomínio Mensal (R$)">
                                        <input type="number" value={form.valor_condominio} onChange={e => set('valor_condominio', e.target.value)} placeholder="350" />
                                    </Field>
                                </Row>

                                {(form.finalidade === 'locacao' || form.finalidade === 'ambos') && (
                                    <>
                                        <div style={{ padding: '4px 0', borderTop: `1px solid ${T.border}`, margin: '8px 0' }} />
                                        <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, marginBottom: 8 }}>CONFIGURAÇÕES DE REPASSE (ERP)</div>
                                        <Row>
                                            <Field label="Taxa de Adm (%)">
                                                <input type="number" value={form.taxa_administracao_pct} onChange={e => set('taxa_administracao_pct', e.target.value)} placeholder="8" />
                                            </Field>
                                            <Field label="Seguro Incêndio (R$)">
                                                <input type="number" value={form.valor_seguro_incendio} onChange={e => set('valor_seguro_incendio', e.target.value)} placeholder="35" />
                                            </Field>
                                        </Row>
                                        <Row>
                                            <Field label="Taxa de Lixo (R$)">
                                                <input type="number" value={form.valor_taxa_lixo} onChange={e => set('valor_taxa_lixo', e.target.value)} placeholder="20" />
                                            </Field>
                                            <Field label="Outras Taxas (R$)">
                                                <input type="number" value={form.outras_taxas_mensais} onChange={e => set('outras_taxas_mensais', e.target.value)} placeholder="0" />
                                            </Field>
                                        </Row>
                                    </>
                                )}
                            </Section>
                        )}

                        {activeSection === 'detalhes' && (form.finalidade === 'locacao' || form.finalidade === 'ambos') && (
                            <Section title="Detalhes de Locação" icon="🛋️" color={T.purple}>
                                <Field label="Mobiliado">
                                    <select value={form.mobiliado} onChange={e => set('mobiliado', e.target.value)}>
                                        <option value="nao">Não Mobiliado</option>
                                        <option value="semi">Semi-Mobiliado</option>
                                        <option value="completo">Totalmente Mobiliado</option>
                                    </select>
                                </Field>
                                <Field label="Disponível a partir de">
                                    <input type="date" value={form.disponibilidade_data} onChange={e => set('disponibilidade_data', e.target.value)} />
                                </Field>
                                <div style={{ display: 'flex', gap: 24 }}>
                                    {[
                                        { key: 'aceita_pets', label: '🐾 Aceita Pets' },
                                        { key: 'aceita_fumantes', label: '🚭 Aceita Fumantes' },
                                        { key: 'permite_sublocacao', label: '🔄 Permite Sublocação' },
                                    ].map(opt => (
                                        <div key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <Toggle active={!!form[opt.key]} onClick={() => set(opt.key, !form[opt.key])} />
                                            <span style={{ fontSize: 13, color: T.textSecondary }}>{opt.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        )}

                        {activeSection === 'contratos' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Info box de herança */}
                                <div style={{ padding: '12px 16px', borderRadius: 10, background: T.accent + '11', border: `1px solid ${T.accent}33`, fontSize: 12, color: T.textSecondary, lineHeight: 1.7 }}>
                                    <strong style={{ color: T.accent }}>🔗 Sistema de Herança Automático</strong><br />
                                    Campos marcados com <span style={{ background: T.accent + '22', color: T.accent, padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>⟳ Herdado</span> utilizam os padrões configurados no Onboard da imobiliária. Edite qualquer campo para personalizá-lo, ou clique em <span style={{ background: T.gold + '22', color: T.gold, padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>✏ Personalizado</span> para restaurar o padrão.
                                </div>

                                <Section title="Contrato de Locação" icon="📋" color={T.gold}>
                                    <Row>
                                        <Field label="Prazo do Contrato (meses)"
                                            badge={<InheritedBadge isInherited={isInherited('lease_duration_months')} onReset={() => resetToDefault('lease_duration_months')} />}>
                                            <input
                                                type="number" min="12" max="60"
                                                value={val('lease_duration_months')}
                                                onChange={e => customizeField('lease_duration_months', parseInt(e.target.value) || null)}
                                                style={{ borderColor: isInherited('lease_duration_months') ? T.accent + '44' : T.gold }}
                                            />
                                        </Field>
                                        <Field label="Aviso Prévio Inquilino (dias)"
                                            badge={<InheritedBadge isInherited={isInherited('notice_days_before')} onReset={() => resetToDefault('notice_days_before')} />}>
                                            <input
                                                type="number" min="15"
                                                value={val('notice_days_before')}
                                                onChange={e => customizeField('notice_days_before', parseInt(e.target.value) || null)}
                                                style={{ borderColor: isInherited('notice_days_before') ? T.accent + '44' : T.gold }}
                                            />
                                        </Field>
                                    </Row>

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <label style={{ margin: 0 }}>Tipo de Multa</label>
                                            <InheritedBadge isInherited={isInherited('penalty_type')} onReset={() => resetToDefault('penalty_type')} />
                                        </div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            {[{ v: 'months_rent', l: '📆 Nº de Aluguéis' }, { v: 'pct_contract', l: '📊 % do Contrato' }].map(o => (
                                                <button key={o.v}
                                                    onClick={() => customizeField('penalty_type', o.v)}
                                                    style={{
                                                        flex: 1, padding: '10px 14px', borderRadius: 8,
                                                        border: `1px solid ${val('penalty_type') === o.v ? T.gold : T.border}`,
                                                        background: val('penalty_type') === o.v ? T.goldGlow : 'transparent',
                                                        color: val('penalty_type') === o.v ? T.gold : T.textSecondary,
                                                        cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                                                    }}>{o.l}</button>
                                            ))}
                                        </div>
                                    </div>

                                    <Row>
                                        <Field label={val('penalty_type') === 'months_rent' ? 'Nº de Aluguéis de Multa' : 'Percentual de Multa (%)'}
                                            badge={<InheritedBadge isInherited={isInherited('penalty_value')} onReset={() => resetToDefault('penalty_value')} />}>
                                            <input type="number" min="0" step="0.5"
                                                value={val('penalty_value')}
                                                onChange={e => customizeField('penalty_value', parseFloat(e.target.value) || null)}
                                                style={{ borderColor: isInherited('penalty_value') ? T.accent + '44' : T.gold }}
                                            />
                                        </Field>
                                        <Field label="Carência de Multa (meses)"
                                            badge={<InheritedBadge isInherited={isInherited('penalty_grace_months')} onReset={() => resetToDefault('penalty_grace_months')} />}>
                                            <input type="number" min="0"
                                                value={val('penalty_grace_months')}
                                                onChange={e => customizeField('penalty_grace_months', parseInt(e.target.value) || null)}
                                                style={{ borderColor: isInherited('penalty_grace_months') ? T.accent + '44' : T.gold }}
                                            />
                                        </Field>
                                    </Row>

                                    <div style={{ display: 'flex', gap: 24 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <Toggle active={!!val('penalty_proportional')} onClick={() => customizeField('penalty_proportional', !val('penalty_proportional'))} />
                                            <span style={{ fontSize: 13, color: T.textSecondary }}>Multa proporcional ao tempo restante</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <Toggle active={!!val('penalty_exemption_after_grace')} onClick={() => customizeField('penalty_exemption_after_grace', !val('penalty_exemption_after_grace'))} />
                                            <span style={{ fontSize: 13, color: T.textSecondary }}>Isento após carência</span>
                                        </div>
                                    </div>
                                </Section>

                                <Section title="Reajuste de Aluguel" icon="📈" color={T.teal}>
                                    <Field label="Índice de Reajuste"
                                        badge={<InheritedBadge isInherited={isInherited('adjustment_index')} onReset={() => resetToDefault('adjustment_index')} />}>
                                        <select value={val('adjustment_index')} onChange={e => customizeField('adjustment_index', e.target.value)}
                                            style={{ borderColor: isInherited('adjustment_index') ? T.accent + '44' : T.gold }}>
                                            <option value="igpm">IGP-M (FGV)</option>
                                            <option value="ipca">IPCA (IBGE)</option>
                                            <option value="inpc">INPC (IBGE)</option>
                                        </select>
                                    </Field>
                                    <div style={{ padding: '10px 14px', borderRadius: 8, background: T.teal + '11', border: `1px solid ${T.teal}33`, fontSize: 11, color: T.textSecondary }}>
                                        ⚖️ Periodicidade de reajuste: <strong style={{ color: T.teal }}>12 meses</strong> — bloqueado por lei (Art. 17, Lei 8.245/91). Avisos gerados automaticamente pelo sistema.
                                    </div>
                                </Section>

                                <Section title="Comissão de Venda" icon="💼" color={T.purple}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                        <Toggle active={!!form.is_launch} onClick={() => set('is_launch', !form.is_launch)} />
                                        <div>
                                            <div style={{ fontSize: 13, color: T.textSecondary }}>Imóvel de Lançamento (Incorporadora)</div>
                                            <div style={{ fontSize: 10, color: T.textMuted }}>Altera o % de comissão padrão: Lançamento ({defaults.commission_pct_launch}%) vs Usado ({defaults.commission_pct_resale}%)</div>
                                        </div>
                                    </div>
                                    {form.is_launch && (
                                        <Field label="Construtora / Incorporadora">
                                            <input value={form.launch_developer} onChange={e => set('launch_developer', e.target.value)} placeholder="Ex: Construtora ABC Empreendimentos" />
                                        </Field>
                                    )}
                                    <Field label="% Comissão (neste imóvel)"
                                        badge={<InheritedBadge isInherited={isInherited('commission_pct')} onReset={() => resetToDefault('commission_pct')} />}>
                                        <input
                                            type="number" min="0" max="20" step="0.5"
                                            value={form.commission_pct !== null ? form.commission_pct : (form.is_launch ? defaults.commission_pct_launch : defaults.commission_pct_resale)}
                                            onChange={e => customizeField('commission_pct', parseFloat(e.target.value) || null)}
                                            style={{ borderColor: isInherited('commission_pct') ? T.accent + '44' : T.purple }}
                                        />
                                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>
                                            Split: {defaults.commission_split_agency}% imobiliária / {defaults.commission_split_broker}% corretor
                                            {!defaults.allow_custom_commission && ' | 🔒 Corretor não pode alterar no fechamento'}
                                        </div>
                                    </Field>
                                    {form.commission_pct !== null && form.preco_venda && (
                                        <div style={{ padding: '10px 14px', borderRadius: 8, background: T.purple + '11', border: `1px solid ${T.purple}33`, fontSize: 11, color: T.textSecondary }}>
                                            💼 Comissão estimada: <strong style={{ color: T.purple }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(form.preco_venda) * form.commission_pct / 100)}</strong>
                                            &nbsp;| Imob: {defaults.commission_split_agency}% | Corretor: {defaults.commission_split_broker}%
                                        </div>
                                    )}
                                </Section>

                                {/* Preview do contrato desta unidade */}
                                <div style={{ background: T.card, borderRadius: 14, padding: 20, border: `1px solid ${T.gold}33` }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: T.gold, marginBottom: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>👁 Como o Agente Vai Descrever Este Imóvel:</div>
                                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: T.green, lineHeight: 1.9, padding: '12px 16px', background: T.bg, borderRadius: 8 }}>
                                        <div>📋 Contrato: <strong style={{ color: T.textPrimary }}>{val('lease_duration_months')} meses</strong>{isInherited('lease_duration_months') && <span style={{ color: T.accent, fontSize: 9, marginLeft: 6 }}>⟳ padrão</span>}</div>
                                        <div>📈 Reajuste: Anual pelo <strong style={{ color: T.textPrimary }}>{(val('adjustment_index') || 'igpm').toUpperCase()}</strong>{isInherited('adjustment_index') && <span style={{ color: T.accent, fontSize: 9, marginLeft: 6 }}>⟳ padrão</span>}</div>
                                        <div>⚠️ Multa rescisória: <strong style={{ color: T.textPrimary }}>
                                            {val('penalty_type') === 'months_rent'
                                                ? `${val('penalty_value')} aluguel(eis)${val('penalty_proportional') ? ' (proporcional)' : ''}`
                                                : `${val('penalty_value')}% do contrato`
                                            }
                                        </strong></div>
                                        {val('penalty_grace_months') > 0 && (
                                            <div>🕐 Carência: <strong style={{ color: T.textPrimary }}>{val('penalty_grace_months')} meses{val('penalty_exemption_after_grace') ? ' (isento após)' : ''}</strong></div>
                                        )}
                                        <div>🔔 Aviso de reajuste: <strong style={{ color: T.textPrimary }}>{val('notice_days_before')} dias antes</strong></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'marketing' && (
                            <Section title="Marketing & Redes Sociais" icon="📱" color={T.purple}>
                                <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 16 }}>
                                    Utilize nossa Inteligência Artificial para gerar postagens prontas para o Instagram baseadas nas características deste imóvel. 
                                    Preencha os dados básicos antes de gerar o conteúdo para melhor precisão.
                                </div>
                                <button 
                                    onClick={(e) => { e.preventDefault(); handleGerarConteudo('instagram_post'); }}
                                    disabled={gerandoPost}
                                    style={{
                                        background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: 'white', fontWeight: 700,
                                        border: 'none', borderRadius: 8, padding: '12px 24px', cursor: gerandoPost ? 'not-allowed' : 'pointer',
                                        opacity: gerandoPost ? 0.7 : 1, alignSelf: 'flex-start'
                                    }}
                                >
                                    {gerandoPost ? '⏳ Gerando Roteiro...' : '📸 Gerar Post p/ Instagram'}
                                </button>
                                {generatedPost && (
                                    <div style={{ marginTop: 24 }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: T.purple, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Sugestão de Postagem (Feed/Reels):
                                        </div>
                                        <div style={{ background: T.bg, border: `1px solid ${T.purple}44`, borderRadius: 12, padding: 16, position: 'relative' }}>
                                            <textarea 
                                                value={generatedPost} 
                                                onChange={(e) => setGeneratedPost(e.target.value)}
                                                style={{ border: 'none', background: 'transparent', minHeight: 250, boxShadow: 'none', padding: 0 }}
                                            />
                                            <button 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    navigator.clipboard.writeText(generatedPost);
                                                    alert('Copiado para a área de transferência!');
                                                }}
                                                style={{ position: 'absolute', top: 12, right: 12, background: T.surface, border: `1px solid ${T.border}`, padding: '6px 12px', borderRadius: 6, color: T.textPrimary, fontSize: 11, cursor: 'pointer' }}
                                            >
                                                📋 Copiar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </Section>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
