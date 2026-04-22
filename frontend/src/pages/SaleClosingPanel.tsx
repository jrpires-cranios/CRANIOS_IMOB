// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';

// ─── THEME ──────────────────────────────────────────────
const T = {
    bg: '#060A14', surface: '#0C1220', card: '#111827',
    border: 'rgba(255,255,255,0.07)', borderBright: 'rgba(59,130,246,0.4)',
    accent: '#3B82F6', accentGlow: 'rgba(59,130,246,0.12)',
    gold: '#F59E0B', goldGlow: 'rgba(245,158,11,0.12)',
    green: '#10B981', greenGlow: 'rgba(16,185,129,0.12)',
    teal: '#06B6D4', purple: '#8B5CF6',
    danger: '#EF4444', dangerGlow: 'rgba(239,68,68,0.12)',
    textPrimary: '#F9FAFB', textSecondary: '#9CA3AF', textMuted: '#4B5563',
};

const STATUS_CONFIG = {
    pending_approval: { label: '⏳ Aguardando Aprovação', color: T.gold, bg: T.goldGlow },
    approved: { label: '✅ Aprovado', color: T.green, bg: T.greenGlow },
    rejected: { label: '❌ Rejeitado', color: T.danger, bg: T.dangerGlow },
    docs_requested: { label: '📄 Docs Solicitados', color: T.teal, bg: T.teal + '22' },
    docs_received: { label: '📦 Docs Recebidos', color: T.purple, bg: T.purple + '22' },
    contract_sent: { label: '📝 Contrato Enviado', color: T.accent, bg: T.accentGlow },
    signed: { label: '🖊️ Assinado', color: T.green, bg: T.greenGlow },
    done: { label: '🏆 Concluído', color: T.green, bg: T.greenGlow },
};

const PAYMENT_LABELS = {
    cash: '💵 À Vista',
    financing: '🏦 Financiamento',
    fgts: '🏛️ FGTS',
    trade: '🔄 Permuta',
    mixed: '🔀 Misto',
};

function formatCurrency(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}
function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ─── MODAL DE NOVA VENDA ──────────────────────────────────
function NewSaleModal({ onClose, onSuccess }) {
    const [step, setStep] = useState('code'); // 'code' | 'fill' | 'confirm'
    const [propertyCode, setPropertyCode] = useState('');
    const [params, setParams] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        closingValue: '', paymentType: 'financing',
        paymentNotes: '', commissionPct: '', observations: '',
        brokerName: '', brokerCreci: '',
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const lookupProperty = async () => {
        setLoading(true); setError('');
        try {
            // Busca por código ou UUID
            const r = await fetch(`/api/sales/params/${propertyCode.trim()}`);
            const j = await r.json();
            if (j.success && j.params) {
                setParams(j.params);
                setForm(f => ({ ...f, commissionPct: j.params.resolved_commission_pct || 6 }));
                setStep('fill');
            } else {
                setError('Imóvel não encontrado. Verifique o código.');
            }
        } catch (e) {
            setError('Erro ao buscar imóvel.');
        }
        setLoading(false);
    };

    const handleSubmit = async () => {
        if (!form.closingValue || !form.brokerName) {
            setError('Preencha Valor de Fechamento e Nome do Corretor.'); return;
        }
        setSubmitting(true); setError('');
        try {
            const r = await fetch('/api/sales/closing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId: params.property_id,
                    brokerName: form.brokerName,
                    brokerCreci: form.brokerCreci,
                    closingValue: parseFloat(form.closingValue),
                    paymentType: form.paymentType,
                    paymentNotes: form.paymentNotes,
                    commissionPct: parseFloat(form.commissionPct),
                    observations: form.observations,
                    sourceChannel: 'web',
                }),
            });
            const j = await r.json();
            if (j.success) { onSuccess?.(); onClose(); }
            else setError(j.error || 'Erro ao enviar fechamento.');
        } catch (e) { setError('Erro de rede.'); }
        setSubmitting(false);
    };

    const commissionValue = params && form.closingValue && form.commissionPct
        ? parseFloat(form.closingValue) * parseFloat(form.commissionPct) / 100
        : 0;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: T.card, borderRadius: 16, padding: 28, width: 520, maxWidth: '95vw', border: `1px solid ${T.borderBright}`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800 }}>🤝 Nova Venda</div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 18 }}>✕</button>
                </div>

                {step === 'code' && (
                    <>
                        <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 16 }}>Digite o <strong>código</strong> ou <strong>ID</strong> do imóvel para carregar os dados automaticamente.</div>
                        <input
                            value={propertyCode}
                            onChange={e => setPropertyCode(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && lookupProperty()}
                            placeholder="Ex: IMV-0042 ou UUID do imóvel"
                            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, borderRadius: 8, padding: '12px 14px', fontSize: 14, width: '100%', outline: 'none' }}
                            autoFocus
                        />
                        {error && <div style={{ color: T.danger, fontSize: 12, marginTop: 8 }}>{error}</div>}
                        <button onClick={lookupProperty} disabled={loading} style={{
                            marginTop: 16, width: '100%', padding: '12px', borderRadius: 8,
                            background: loading ? T.textMuted : T.accent, border: 'none', color: 'white',
                            fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
                        }}>{loading ? '⏳ Buscando...' : '🔍 Buscar Imóvel →'}</button>
                    </>
                )}

                {step === 'fill' && params && (
                    <>
                        {/* Card do imóvel */}
                        <div style={{ background: T.surface, borderRadius: 10, padding: 14, marginBottom: 16, border: `1px solid ${T.green}44` }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{params.titulo || 'Imóvel'}</div>
                            <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 4 }}>{params.endereco}{params.bairro ? ` — ${params.bairro}` : ''}</div>
                            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                                {params.preco_venda && <div style={{ fontSize: 12, color: T.gold }}>💰 Tabela: {formatCurrency(params.preco_venda)}</div>}
                                <div style={{ fontSize: 12, color: T.purple }}>💼 Comissão: {params.resolved_commission_pct}%{params.commission_is_inherited ? ' (padrão)' : ' (exclusivo)'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 11, color: T.textSecondary, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome do Corretor *</label>
                                    <input value={form.brokerName} onChange={e => setForm(f => ({ ...f, brokerName: e.target.value }))} placeholder="Seu nome completo" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, borderRadius: 6, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 11, color: T.textSecondary, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CRECI</label>
                                    <input value={form.brokerCreci} onChange={e => setForm(f => ({ ...f, brokerCreci: e.target.value }))} placeholder="Nº do CRECI" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, borderRadius: 6, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: 11, color: T.textSecondary, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor de Fechamento (R$) *</label>
                                <input type="number" value={form.closingValue} onChange={e => setForm(f => ({ ...f, closingValue: e.target.value }))} placeholder="430000" style={{ background: T.surface, border: `1px solid ${T.gold}`, color: T.textPrimary, borderRadius: 6, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none' }} />
                            </div>

                            <div>
                                <label style={{ fontSize: 11, color: T.textSecondary, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Condições de Pagamento</label>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {Object.entries(PAYMENT_LABELS).map(([k, l]) => (
                                        <button key={k} onClick={() => setForm(f => ({ ...f, paymentType: k }))} style={{
                                            padding: '6px 10px', borderRadius: 6, border: `1px solid ${form.paymentType === k ? T.accent : T.border}`,
                                            background: form.paymentType === k ? T.accentGlow : 'transparent', color: form.paymentType === k ? T.accent : T.textSecondary,
                                            cursor: 'pointer', fontSize: 11, fontWeight: 500, transition: 'all 0.15s',
                                        }}>{l}</button>
                                    ))}
                                </div>
                                <input value={form.paymentNotes} onChange={e => setForm(f => ({ ...f, paymentNotes: e.target.value }))} placeholder="Detalhes (ex: Financiamento CEF + R$50k entrada)" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, borderRadius: 6, padding: '8px 12px', fontSize: 12, width: '100%', outline: 'none', marginTop: 6 }} />
                            </div>

                            <div>
                                <label style={{ fontSize: 11, color: T.textSecondary, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    % Comissão {params.allow_custom_commission === false ? '(bloqueado pela imobiliária)' : ''}
                                </label>
                                <input
                                    type="number" min="0" max="20" step="0.5"
                                    value={form.commissionPct}
                                    onChange={e => setForm(f => ({ ...f, commissionPct: e.target.value }))}
                                    disabled={params.allow_custom_commission === false}
                                    style={{ background: T.surface, border: `1px solid ${params.allow_custom_commission === false ? T.textMuted : T.purple}`, color: params.allow_custom_commission === false ? T.textMuted : T.textPrimary, borderRadius: 6, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none' }}
                                />
                                {commissionValue > 0 && (
                                    <div style={{ fontSize: 11, color: T.purple, marginTop: 4 }}>
                                        = {formatCurrency(commissionValue)} | Imob: {formatCurrency(commissionValue * (params.commission_split_agency || 50) / 100)} | Corretor: {formatCurrency(commissionValue * (params.commission_split_broker || 50) / 100)}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={{ fontSize: 11, color: T.textSecondary, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observações</label>
                                <textarea value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} placeholder="Ex: Cliente quer vistoria antes da assinatura" rows={2} style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, borderRadius: 6, padding: '8px 12px', fontSize: 12, width: '100%', outline: 'none', resize: 'vertical' }} />
                            </div>

                            {error && <div style={{ color: T.danger, fontSize: 12 }}>{error}</div>}

                            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                <button onClick={() => setStep('code')} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${T.border}`, color: T.textMuted, borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>← Voltar</button>
                                <button onClick={handleSubmit} disabled={submitting} style={{
                                    flex: 2, padding: '10px', background: submitting ? T.textMuted : `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
                                    border: 'none', color: 'white', borderRadius: 8, cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13,
                                }}>{submitting ? '⏳ Enviando...' : '🚀 Enviar para Aprovação'}</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── MODAL DE APROVAÇÃO / REJEIÇÃO ───────────────────────
function ApprovalModal({ closing, action, onClose, onDone }) {
    const [reason, setReason] = useState('');
    const [approverName, setApproverName] = useState('Gestor');
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        const url = `/api/sales/closings/${closing.id}/${action === 'approve' ? 'approve' : 'reject'}`;
        const body = action === 'approve'
            ? { approverName }
            : { reason: reason || 'Não informado', rejectorName: approverName };
        await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        setLoading(false);
        onDone?.();
        onClose();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <div style={{ background: T.card, borderRadius: 14, padding: 24, width: 400, border: `1px solid ${action === 'approve' ? T.green + '44' : T.danger + '44'}` }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                    {action === 'approve' ? '✅ Confirmar Aprovação' : '❌ Confirmar Rejeição'}
                </div>
                <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 12 }}>
                    <strong>{closing.broker_name}</strong> — {formatCurrency(closing.closing_value)} | {closing.commission_pct}% comissão
                </div>
                <div>
                    <label style={{ fontSize: 11, color: T.textSecondary, display: 'block', marginBottom: 4 }}>Seu nome (gestor)</label>
                    <input value={approverName} onChange={e => setApproverName(e.target.value)} style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, borderRadius: 6, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none' }} />
                </div>
                {action === 'reject' && (
                    <div style={{ marginTop: 10 }}>
                        <label style={{ fontSize: 11, color: T.textSecondary, display: 'block', marginBottom: 4 }}>Motivo da rejeição</label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Informe o motivo" style={{ background: T.surface, border: `1px solid ${T.danger}`, color: T.textPrimary, borderRadius: 6, padding: '8px 12px', fontSize: 12, width: '100%', outline: 'none', resize: 'none' }} />
                    </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${T.border}`, color: T.textMuted, borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={handleConfirm} disabled={loading} style={{
                        flex: 2, padding: '10px', borderRadius: 8, border: 'none', fontWeight: 700, cursor: 'pointer',
                        background: action === 'approve' ? T.green : T.danger, color: 'white',
                    }}>{loading ? '⏳...' : action === 'approve' ? '✅ Aprovar' : '❌ Rejeitar'}</button>
                </div>
            </div>
        </div>
    );
}

// ─── MAIN: SALE CLOSING PANEL ────────────────────────────
export default function SaleClosingPanel({ onBack }) {
    const [closings, setClosings] = useState([]);
    const [filter, setFilter] = useState('all'); // 'all' | status key
    const [loading, setLoading] = useState(true);
    const [showNewSale, setShowNewSale] = useState(false);
    const [approvalModal, setApprovalModal] = useState(null); // { closing, action }
    const [expandedId, setExpandedId] = useState(null);
    const [notifications, setNotifications] = useState({});

    const fetchClosings = useCallback(async () => {
        setLoading(true);
        try {
            const url = filter === 'all' ? '/api/sales/closings' : `/api/sales/closings?status=${filter}`;
            const r = await fetch(url);
            const j = await r.json();
            if (j.success) setClosings(j.closings || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [filter]);

    useEffect(() => { fetchClosings(); }, [fetchClosings]);

    const fetchNotifications = async (closingId) => {
        if (notifications[closingId]) return;
        try {
            const r = await fetch(`/api/sales/closings/${closingId}/notifications`);
            const j = await r.json();
            if (j.success) setNotifications(n => ({ ...n, [closingId]: j.notifications }));
        } catch { }
    };

    const toggleExpand = (id) => {
        if (expandedId !== id) fetchNotifications(id);
        setExpandedId(expandedId === id ? null : id);
    };

    const pending = closings.filter(c => c.status === 'pending_approval').length;

    return (
        <>
            {showNewSale && <NewSaleModal onClose={() => setShowNewSale(false)} onSuccess={fetchClosings} />}
            {approvalModal && (
                <ApprovalModal
                    closing={approvalModal.closing}
                    action={approvalModal.action}
                    onClose={() => setApprovalModal(null)}
                    onDone={fetchClosings}
                />
            )}

            <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: T.textPrimary }}>
                {/* Header */}
                <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {onBack && <button onClick={onBack} style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.textMuted, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>← Voltar</button>}
                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800 }}>🤝 Fechamentos de Venda</div>
                        {pending > 0 && (
                            <span style={{ background: T.gold, color: '#000', borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 800 }}>
                                {pending} pendente{pending > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <button onClick={() => setShowNewSale(true)} style={{
                        padding: '8px 20px', background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
                        border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13,
                    }}>+ Nova Venda</button>
                </div>

                <div style={{ padding: '24px 32px' }}>
                    {/* Filtros de status */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                        {[{ k: 'all', l: 'Todos' }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ k, l: v.label }))].map(f => (
                            <button key={f.k} onClick={() => setFilter(f.k)} style={{
                                padding: '6px 14px', borderRadius: 20, border: `1px solid ${filter === f.k ? T.accent : T.border}`,
                                background: filter === f.k ? T.accentGlow : 'transparent', color: filter === f.k ? T.accent : T.textSecondary,
                                cursor: 'pointer', fontSize: 12, fontWeight: filter === f.k ? 600 : 400, transition: 'all 0.15s',
                            }}>{f.l}</button>
                        ))}
                    </div>

                    {/* Métricas rápidas */}
                    {closings.length > 0 && (() => {
                        const approved = closings.filter(c => ['approved', 'docs_requested', 'docs_received', 'contract_sent', 'signed', 'done'].includes(c.status));
                        const totalApproved = approved.reduce((s, c) => s + (c.closing_value || 0), 0);
                        const totalCommission = approved.reduce((s, c) => s + (c.commission_value || 0), 0);
                        return (
                            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                                {[
                                    { l: 'Volume Aprovado', v: formatCurrency(totalApproved), c: T.green },
                                    { l: 'Comissões', v: formatCurrency(totalCommission), c: T.gold },
                                    { l: 'Pendentes', v: pending, c: T.gold },
                                    { l: 'Total', v: closings.length, c: T.textSecondary },
                                ].map(m => (
                                    <div key={m.l} style={{ flex: 1, background: T.card, borderRadius: 10, padding: '14px 18px', border: `1px solid ${T.border}` }}>
                                        <div style={{ fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{m.l}</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: m.c }}>{m.v}</div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

                    {/* Lista de fechamentos */}
                    {loading ? (
                        <div style={{ textAlign: 'center', color: T.textMuted, padding: 60 }}>⏳ Carregando...</div>
                    ) : closings.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 60 }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
                            <div style={{ color: T.textMuted, fontSize: 14 }}>Nenhum fechamento encontrado.</div>
                            <button onClick={() => setShowNewSale(true)} style={{ marginTop: 16, padding: '10px 24px', background: T.accent, border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, cursor: 'pointer' }}>Registrar Primeiro Fechamento</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {closings.map(c => {
                                const sc = STATUS_CONFIG[c.status] || { label: c.status, color: T.textMuted, bg: T.card };
                                const isExpanded = expandedId === c.id;
                                const isPending = c.status === 'pending_approval';
                                return (
                                    <div key={c.id} style={{ background: T.card, borderRadius: 12, border: `1px solid ${isPending ? T.gold + '44' : T.border}`, overflow: 'hidden', transition: 'all 0.2s' }}>
                                        {/* Linha principal */}
                                        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => toggleExpand(c.id)}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {c.imoveis?.titulo || `Imóvel ${c.property_id?.substring(0, 8) || ''}`}
                                                    </div>
                                                    <span style={{ background: sc.bg, color: sc.color, borderRadius: 10, padding: '2px 8px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{sc.label}</span>
                                                </div>
                                                <div style={{ fontSize: 11, color: T.textSecondary }}>
                                                    👤 {c.broker_name} | {PAYMENT_LABELS[c.payment_type] || c.payment_type} | {formatDate(c.created_at)}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{ fontSize: 16, fontWeight: 700, color: T.gold }}>{formatCurrency(c.closing_value)}</div>
                                                <div style={{ fontSize: 11, color: T.purple }}>💼 {c.commission_pct}% = {formatCurrency(c.commission_value)}</div>
                                            </div>
                                            {isPending && (
                                                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => setApprovalModal({ closing: c, action: 'approve' })} style={{ padding: '6px 14px', background: T.green, border: 'none', borderRadius: 6, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>✅ Aprovar</button>
                                                    <button onClick={() => setApprovalModal({ closing: c, action: 'reject' })} style={{ padding: '6px 14px', background: T.danger, border: 'none', borderRadius: 6, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>❌ Rejeitar</button>
                                                </div>
                                            )}
                                            <span style={{ color: T.textMuted, fontSize: 16 }}>{isExpanded ? '▲' : '▼'}</span>
                                        </div>

                                        {/* Detalhes expandidos */}
                                        {isExpanded && (
                                            <div style={{ borderTop: `1px solid ${T.border}`, padding: '16px 20px', background: T.surface, animation: 'fadeIn 0.2s ease' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                                                    {[
                                                        ['Valor Fechamento', formatCurrency(c.closing_value)],
                                                        ['Valor Tabela', c.table_value ? formatCurrency(c.table_value) : '—'],
                                                        ['Desconto', c.discount_pct ? `${c.discount_pct}%` : '—'],
                                                        ['Comissão Total', formatCurrency(c.commission_value)],
                                                        ['Parte Imobiliária', c.commission_agency_value ? formatCurrency(c.commission_agency_value) : '—'],
                                                        ['Parte Corretor', c.commission_broker_value ? formatCurrency(c.commission_broker_value) : '—'],
                                                    ].map(([l, v]) => (
                                                        <div key={l}>
                                                            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2, textTransform: 'uppercase' }}>{l}</div>
                                                            <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {c.payment_notes && <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 8 }}>💳 {c.payment_notes}</div>}
                                                {c.observations && <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 8 }}>📝 {c.observations}</div>}
                                                {c.approved_by && <div style={{ fontSize: 11, color: T.green }}>✅ Aprovado por {c.approved_by} em {formatDate(c.approved_at)}</div>}
                                                {c.rejection_reason && <div style={{ fontSize: 11, color: T.danger }}>❌ Rejeitado: {c.rejection_reason}</div>}
                                                {c.assinafy_document_id && <div style={{ fontSize: 11, color: T.teal }}>📝 Contrato Assinafy: {c.assinafy_document_id}</div>}

                                                {/* Histórico de notificações */}
                                                {notifications[c.id]?.length > 0 && (
                                                    <div style={{ marginTop: 12, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                                                        <div style={{ fontSize: 10, color: T.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>Histórico de Notificações</div>
                                                        {notifications[c.id].map((n, i) => (
                                                            <div key={i} style={{ fontSize: 11, color: T.textSecondary, padding: '4px 0', borderBottom: `1px solid ${T.border}` }}>
                                                                <span style={{ color: n.channel === 'telegram' ? T.teal : T.accent }}>[{n.channel}]</span> {n.direction === 'sent' ? '→' : '←'} {n.message?.substring(0, 80)}{n.message?.length > 80 ? '...' : ''} <span style={{ color: T.textMuted }}>| {formatDate(n.sent_at)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </>
    );
}
