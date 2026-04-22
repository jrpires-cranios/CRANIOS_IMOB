// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { apiClient } from '../client';

const T = {
    primary: '#0F172A',
    secondary: '#3B82F6',
    accent: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    bg: '#F8FAFC',
    card: '#FFFFFF',
    text: '#1E293B',
    textMuted: '#64748B',
    border: '#E2E8F0'
};

interface Comissao {
    id: string;
    corretor_id: string;
    imovel_id: string;
    referencia_tipo: string;
    referencia_id: string;
    valor_base: number;
    percentual: number;
    valor_comissao: number;
    status: 'pendente' | 'disponivel' | 'pago' | 'cancelado';
    data_previsao: string;
    data_pagamento: string;
    observacoes: string;
    created_at: string;
    corretor?: {
        nome: string;
        email: string;
        creci: string;
    };
    imovel?: {
        titulo: string;
        endereco: string;
    };
}

export default function Comissoes({ onBack }: { onBack: () => void }) {
    const [comissoes, setComissoes] = useState<Comissao[]>([]);
    const [resumo, setResumo] = useState({ pendente: 0, disponivel: 0, pago: 0, total_gerado: 0 });
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCorretor, setFilterCorretor] = useState('');
    const [corretores, setCorretores] = useState<any[]>([]);

    const tenantId = 'rbhkwmesmvytqdfuwcie';

    useEffect(() => {
        fetchData();
        fetchCorretores();
    }, [filterStatus, filterCorretor]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (filterStatus) filters.status = filterStatus;
            if (filterCorretor) filters.corretor_id = filterCorretor;

            const [comRes, resRes] = await Promise.all([
                apiClient.getComissoes(tenantId, filters),
                apiClient.getComissaoResumo(tenantId, filterCorretor || undefined)
            ]);

            if (comRes.success) setComissoes(comRes.comissoes || []);
            if (resRes.success) setResumo(resRes.resumo);
        } catch (error) {
            console.error('Erro ao buscar comissões:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCorretores = async () => {
        try {
            const res = await apiClient.getCorretores();
            if (res.success) setCorretores(res.corretores || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleLiquidar = async (id: string) => {
        if (!confirm('Deseja marcar esta comissão como PAGA?')) return;
        try {
            const res = await apiClient.liquidarComissao(id);
            if (res.success) {
                alert('Comissão liquidada com sucesso!');
                fetchData();
            }
        } catch (error) {
            alert('Erro ao liquidar comissão.');
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pendente: { bg: '#FEF3C7', color: '#92400E', label: 'Pendente' },
            disponivel: { bg: '#D1FAE5', color: '#065F46', label: 'Disponível' },
            pago: { bg: '#DBEAFE', color: '#1E40AF', label: 'Pago' },
            cancelado: { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelado' }
        };
        const s = styles[status as keyof typeof styles] || styles.pendente;
        return (
            <span style={{
                backgroundColor: s.bg,
                color: s.color,
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase'
            }}>
                {s.label}
            </span>
        );
    };

    return (
        <div style={{ backgroundColor: T.bg, minHeight: '100vh', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <button
                            onClick={onBack}
                            style={{ background: 'none', border: 'none', color: T.secondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}
                        >
                            ← Voltar
                        </button>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: T.primary }}>Gestão de Comissões</h1>
                        <p style={{ color: T.textMuted }}>Módulo ERP - M3: Controle e liquidação de ganhos de corretores</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    {[
                        { label: 'Gerado Total', value: resumo.total_gerado, color: T.primary },
                        { label: 'A Receber (Corretor)', value: resumo.pendente + resumo.disponivel, color: T.warning },
                        { label: 'Disponível p/ Saque', value: resumo.disponivel, color: T.accent },
                        { label: 'Pago/Liquidado', value: resumo.pago, color: T.secondary }
                    ].map((card, i) => (
                        <div key={i} style={{ backgroundColor: T.card, padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: `1px solid ${T.border}` }}>
                            <p style={{ color: T.textMuted, fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>{card.label}</p>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: card.color }}>{formatCurrency(card.value)}</h3>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div style={{ backgroundColor: T.card, padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', border: `1px solid ${T.border}` }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: T.textMuted, marginBottom: '0.25rem' }}>FILTRAR POR CORRETOR</label>
                        <select
                            value={filterCorretor}
                            onChange={(e) => setFilterCorretor(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${T.border}`, outline: 'none' }}
                        >
                            <option value="">Todos os Corretores</option>
                            {corretores.map(c => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: T.textMuted, marginBottom: '0.25rem' }}>STATUS</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${T.border}`, outline: 'none' }}
                        >
                            <option value="">Todos os Status</option>
                            <option value="pendente">Pendente</option>
                            <option value="disponivel">Disponível</option>
                            <option value="pago">Pago</option>
                        </select>
                    </div>
                    <button
                        onClick={fetchData}
                        style={{ padding: '0.75rem 1.5rem', backgroundColor: T.primary, color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: '1.25rem' }}
                    >
                        Atualizar
                    </button>
                </div>

                {/* Table */}
                <div style={{ backgroundColor: T.card, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: `1px solid ${T.border}` }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: T.bg, borderBottom: `1px solid ${T.border}` }}>
                            <tr>
                                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: T.textMuted }}>DATA</th>
                                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: T.textMuted }}>CORRETOR</th>
                                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: T.textMuted }}>IMÓVEL / REF</th>
                                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: T.textMuted }}>VALOR BASE</th>
                                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: T.textMuted }}>COMISSÃO</th>
                                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: T.textMuted }}>STATUS</th>
                                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: T.textMuted }}>AÇÕES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: T.textMuted }}>Carregando dados...</td>
                                </tr>
                            ) : comissoes.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: T.textMuted }}>Nenhuma comissão encontrada.</td>
                                </tr>
                            ) : comissoes.map((c) => (
                                <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: T.textMuted }}>
                                        {new Date(c.created_at).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text }}>{c.corretor?.nome || 'N/A'}</div>
                                        <div style={{ fontSize: '0.75rem', color: T.textMuted }}>CRECI: {c.corretor?.creci || '-'}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.875rem', color: T.text }}>{c.imovel?.titulo || 'Ref: ' + c.referencia_tipo}</div>
                                        <div style={{ fontSize: '0.75rem', color: T.textMuted }}>{c.observacoes}</div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: T.text }}>
                                        {formatCurrency(c.valor_base)}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: T.accent }}>{formatCurrency(c.valor_comissao)}</div>
                                        <div style={{ fontSize: '0.75rem', color: T.textMuted }}>{c.percentual}%</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {getStatusBadge(c.status)}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {c.status !== 'pago' && (
                                            <button
                                                onClick={() => handleLiquidar(c.id)}
                                                style={{ padding: '5px 12px', backgroundColor: T.secondary, color: 'white', borderRadius: '6px', border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                Liquidar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
