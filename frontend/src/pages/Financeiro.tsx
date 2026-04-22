// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../client';

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
    pendente: { label: '⏳ Pendente', color: T.gold, bg: T.goldGlow },
    pago: { label: '✅ Pago', color: T.green, bg: T.greenGlow },
    atrasado: { label: '⚠️ Atrasado', color: T.danger, bg: T.dangerGlow },
    cancelado: { label: '🚫 Cancelado', color: T.textMuted, bg: T.card },
};

function formatCurrency(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}
function formatDate(d) {
    return new Date(d).toLocaleDateString('pt-BR');
}

export default function Financeiro({ onBack }) {
    const [lancamentos, setLancamentos] = useState([]);
    const [summary, setSummary] = useState(null);
    const [fluxo, setFluxo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('receber'); // 'receber' | 'pagar' | 'fluxo'
    const [tenantId, setTenantId] = useState('rbhkwmesmvytqdfuwcie');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [resL, resS, resF] = await Promise.all([
                apiClient.getLancamentos(tenantId, { tipo: tab === 'receber' ? 'receita' : 'despesa' }),
                apiClient.getFinancialSummary(tenantId),
                apiClient.getCashFlow(tenantId)
            ]);

            if (resL.success) setLancamentos(resL.lancamentos || []);
            if (resS.success) setSummary(resS.summary);
            if (resF.success) setFluxo(resF.fluxo || []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }, [tenantId, tab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDarBaixa = async (id) => {
        if (!confirm('Confirmar pagamento deste título?')) return;
        try {
            const res = await apiClient.updateLancamento(id, { status: 'pago', data_pagamento: new Date().toISOString() });
            if (res.success) fetchData();
        } catch (e) { alert('Erro ao dar baixa'); }
    };

    return (
        <div style={{ background: T.bg, minHeight: '100vh', color: T.textPrimary, fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {onBack && <button onClick={onBack} style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.textMuted, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>← Voltar</button>}
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, margin: 0 }}>📊 Fluxo Financeiro ERP</h1>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button style={{ padding: '8px 16px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontSize: 13 }}>📅 Este Mês</button>
                    <button style={{ padding: '8px 20px', background: T.accent, border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>+ Novo Lançamento</button>
                </div>
            </div>

            <div style={{ padding: '32px' }}>
                {/* Summary Cards */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
                    {[
                        { label: 'Receita Realizada (Mês)', value: summary?.receita_realizada || 0, color: T.green, icon: '📈' },
                        { label: 'Receita Pendente', value: (summary?.receita_prevista || 0) - (summary?.receita_realizada || 0), color: T.gold, icon: '⏳' },
                        { label: 'Atrasados', value: summary?.atrasados || 0, color: T.danger, icon: '⚠️', isQty: true },
                        { label: 'Lucro Líquido (Realizado)', value: (summary?.receita_realizada || 0) - (summary?.despesa_realizada || 0), color: T.teal, icon: '🏦' },
                    ].map(card => (
                        <div key={card.label} style={{ flex: 1, background: T.card, borderRadius: 16, padding: '20px 24px', border: `1px solid ${T.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</span>
                                <span>{card.icon}</span>
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: card.color }}>
                                {card.isQty ? card.value : formatCurrency(card.value)}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                    {[
                        { id: 'receber', label: '📥 Contas a Receber', icon: '💰' },
                        { id: 'pagar', label: '📤 Contas a Pagar', icon: '💸' },
                        { id: 'fluxo', label: '📊 Fluxo de Caixa', icon: '📈' },
                    ].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)} style={{
                            padding: '10px 20px', borderRadius: 10, border: `1px solid ${tab === t.id ? T.accent : T.border}`,
                            background: tab === t.id ? T.accentGlow : 'transparent', color: tab === t.id ? T.accent : T.textSecondary,
                            cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: 8
                        }}>
                            <span>{t.icon}</span>{t.label}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                {tab === 'fluxo' ? (
                    <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 32 }}>
                        <h3 style={{ marginBottom: 24, fontSize: 16 }}>Histórico de Fluxo Mensal</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {fluxo.map(f => (
                                <div key={f.mes} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 16, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
                                    <div style={{ width: 100, fontSize: 14, fontWeight: 700 }}>{new Date(f.mes + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
                                    <div style={{ flex: 1, display: 'flex', gap: 16 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 10, color: T.textMuted, textTransform: 'uppercase' }}>Receitas</div>
                                            <div style={{ color: T.green, fontWeight: 700 }}>{formatCurrency(f.total_receita)}</div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 10, color: T.textMuted, textTransform: 'uppercase' }}>Despesas</div>
                                            <div style={{ color: T.danger, fontWeight: 700 }}>{formatCurrency(f.total_despesa)}</div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 10, color: T.textMuted, textTransform: 'uppercase' }}>Saldo</div>
                                            <div style={{ color: f.saldo >= 0 ? T.teal : T.danger, fontWeight: 800 }}>{formatCurrency(f.saldo)}</div>
                                        </div>
                                    </div>
                                    {f.qtd_atrasados > 0 && <div style={{ background: T.dangerGlow, color: T.danger, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>⚠️ {f.qtd_atrasados} atrasados</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: T.surface }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Vencimento</th>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Categoria / Descrição</th>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Proprietário / Imóvel</th>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Valor</th>
                                    <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 100, color: T.textMuted }}>Carregando lançamentos...</td></tr>
                                ) : lancamentos.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 100, color: T.textMuted }}>Nenhum lançamento encontrado nesta categoria.</td></tr>
                                ) : (
                                    lancamentos.map(l => (
                                        <tr key={l.id} style={{ borderTop: `1px solid ${T.border}`, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: l.status === 'atrasado' ? T.danger : T.textPrimary }}>{formatDate(l.vencimento)}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ fontSize: 13, fontWeight: 600 }}>{l.categoria}</div>
                                                <div style={{ fontSize: 11, color: T.textMuted }}>{l.descricao || '—'}</div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ fontSize: 13 }}>{l.proprietario?.nome_completo || '—'}</div>
                                                <div style={{ fontSize: 11, color: T.textMuted }}>{l.imovel?.titulo || '—'}</div>
                                            </td>
                                            <td style={{ padding: '16px 24px', fontSize: 15, fontWeight: 800, color: l.tipo === 'receita' ? T.green : T.danger }}>{formatCurrency(l.valor)}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, fontWeight: 700, ...STATUS_CONFIG[l.status] }}>
                                                    {STATUS_CONFIG[l.status]?.label || l.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                {l.status === 'pendente' || l.status === 'atrasado' ? (
                                                    <button onClick={() => handleDarBaixa(l.id)} style={{ padding: '6px 14px', borderRadius: 8, background: T.green, border: 'none', color: 'white', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Dar Baixa</button>
                                                ) : (
                                                    <span style={{ fontSize: 18 }}>👁️</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
