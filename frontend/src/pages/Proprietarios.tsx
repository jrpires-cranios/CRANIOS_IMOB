// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../client';
import ProprietarioForm from './ProprietarioForm';

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

function formatCurrency(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

export default function Proprietarios({ onBack }) {
    const [proprietarios, setProprietarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [tenantId, setTenantId] = useState(null);

    // Carrega tenantId (simulado ou do storage - aqui fixo no tenant padrão se não achar)
    useEffect(() => {
        const tid = localStorage.getItem('tenantId') || 'rbhkwmesmvytqdfuwcie'; // ID do projeto principal
        setTenantId(tid);
    }, []);

    const fetchProprietarios = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const res = await apiClient.getProprietarios(tenantId, search);
            if (res.success) setProprietarios(res.proprietarios || []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }, [tenantId, search]);

    useEffect(() => {
        fetchProprietarios();
    }, [fetchProprietarios]);

    const handleEdit = (id) => {
        setSelectedId(id);
        setShowForm(true);
    };

    const handleCreate = () => {
        setSelectedId(null);
        setShowForm(true);
    };

    if (showForm) {
        return (
            <ProprietarioForm
                id={selectedId}
                tenantId={tenantId}
                onBack={() => { setShowForm(false); fetchProprietarios(); }}
            />
        );
    }

    return (
        <div style={{ background: T.bg, minHeight: '100vh', color: T.textPrimary, fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {onBack && <button onClick={onBack} style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.textMuted, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>← Voltar</button>}
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, margin: 0 }}>🏠 Gestão de Proprietários</h1>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por nome ou CPF/CNPJ..."
                            style={{ background: T.card, border: `1px solid ${T.border}`, color: T.textPrimary, borderRadius: 8, padding: '8px 12px 8px 36px', fontSize: 13, width: 280, outline: 'none' }}
                        />
                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted }}>🔍</span>
                    </div>
                    <button onClick={handleCreate} style={{ padding: '8px 20px', background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>+ Novo Proprietário</button>
                </div>
            </div>

            <div style={{ padding: '32px' }}>
                {/* Dashboard Rápido */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
                    {[
                        { label: 'Total de Proprietários', value: proprietarios.length, icon: '👥', color: T.accent },
                        { label: 'Imóveis sob Gestão', value: '—', icon: '🏢', color: T.teal },
                        { label: 'Repasses do Mês', value: 'R$ 0,00', icon: '💰', color: T.green },
                    ].map(card => (
                        <div key={card.label} style={{ flex: 1, background: T.card, borderRadius: 16, padding: '20px 24px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ fontSize: 32, opacity: 0.8 }}>{card.icon}</div>
                            <div>
                                <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{card.label}</div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: card.color }}>{card.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabela de Proprietários */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 100, color: T.textMuted }}>Carregando dados...</div>
                ) : proprietarios.length === 0 ? (
                    <div style={{ textAlign: 'center', background: T.card, borderRadius: 16, padding: 80, border: `1px dashed ${T.border}` }}>
                        <div style={{ fontSize: 48, marginBottom: 20 }}>👤</div>
                        <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Nenhum proprietário cadastrado</h3>
                        <p style={{ color: T.textMuted, margin: '0 0 24px' }}>Comece adicionando os donos dos imóveis para gerir repasses e vistorias.</p>
                        <button onClick={handleCreate} style={{ padding: '12px 32px', background: T.accent, border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, cursor: 'pointer' }}>+ Cadastrar Proprietário</button>
                    </div>
                ) : (
                    <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: T.surface }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Proprietário</th>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Documento</th>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Contato</th>
                                    <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {proprietarios.map(p => (
                                    <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>{p.nome_completo}</div>
                                            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{p.tipo_pessoa === 'PF' ? '🙋‍♂️ Pessoa Física' : '🏢 Pessoa Jurídica'}</div>
                                        </td>
                                        <td style={{ padding: '16px 24px', fontSize: 13, color: T.textSecondary }}>{p.cpf_cnpj}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontSize: 13 }}>{p.email || '—'}</div>
                                            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{p.telefone || p.whatsapp || '—'}</div>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                            <button onClick={() => handleEdit(p.id)} style={{ background: 'transparent', border: `1px solid ${T.accent}`, color: T.accent, padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = T.accent; e.currentTarget.style.color = 'white'; }}>Editar / Detalhes</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
