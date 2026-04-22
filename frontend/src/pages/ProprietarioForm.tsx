// @ts-nocheck
import { useState, useEffect } from 'react';
import apiClient from '../client';

// ─── THEME (Mesmo das outras páginas) ──────────────────────────────
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

export default function ProprietarioForm({ id, tenantId, onBack }) {
    const [tab, setTab] = useState('dados'); // 'dados' | 'contas' | 'portfolio'
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [data, setData] = useState({
        tipo_pessoa: 'PF', nome_completo: '', cpf_cnpj: '', email: '',
        telefone: '', whatsapp: '', cep: '', logradouro: '', numero: '',
        complemento: '', bairro: '', cidade: '', estado: '', observacoes: ''
    });
    const [contas, setContas] = useState([]);
    const [portfolio, setPortfolio] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await apiClient.getProprietarioById(id);
            if (res.success) {
                setData(res.proprietario);
                setContas(res.proprietario.contas || []);
                setPortfolio(res.portfolio);
            }
        } catch (e) {
            setError('Erro ao carregar dados do proprietário.');
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSubmitting(true);
        setError('');
        try {
            const payload = { ...data, tenant_id: tenantId };
            const res = id
                ? await apiClient.updateProprietario(id, payload)
                : await apiClient.createProprietario(payload);

            if (res.success) {
                onBack(); // Volta para a lista
            } else {
                setError(res.error || 'Erro ao salvar proprietário.');
            }
        } catch (e) {
            setError('Erro de rede ao salvar.');
        }
        setSubmitting(false);
    };

    const handleAddAccount = async () => {
        const banco = prompt('Qual o banco?');
        if (!banco) return;
        try {
            const res = await apiClient.saveBankAccount({
                tenant_id: tenantId,
                proprietario_id: id,
                banco,
                principal: contas.length === 0
            });
            if (res.success) fetchData();
        } catch (e) { alert('Erro ao adicionar conta'); }
    };

    const handleDeleteAccount = async (accId) => {
        if (!confirm('Excluir esta conta bancária?')) return;
        try {
            const res = await apiClient.deleteBankAccount(accId);
            if (res.success) fetchData();
        } catch (e) { alert('Erro ao excluir conta'); }
    };

    if (loading) return <div style={{ color: T.textMuted, padding: 40, textAlign: 'center' }}>Carregando...</div>;

    return (
        <div style={{ background: T.bg, minHeight: '100vh', padding: '0 32px 64px' }}>
            {/* Sticky Sub-Header */}
            <div style={{ padding: '24px 0', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, position: 'sticky', top: 0, background: T.bg, zIndex: 5 }}>
                <div>
                    <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 4 }}>Módulo Proprietários</div>
                    <h2 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800 }}>
                        {id ? `📝 Editar: ${data.nome_completo}` : '✨ Novo Proprietário'}
                    </h2>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={onBack} style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.textSecondary, borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
                    <button onClick={handleSave} disabled={submitting} style={{ background: T.accent, border: 'none', color: 'white', borderRadius: 8, padding: '10px 32px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                        {submitting ? 'Salvando...' : 'Gravar Alterações'}
                    </button>
                </div>
            </div>

            {error && <div style={{ background: T.dangerGlow, color: T.danger, padding: '16px 24px', borderRadius: 12, marginBottom: 24, border: `1px solid ${T.danger}44` }}>⚠️ {error}</div>}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 32, borderBottom: `1px solid ${T.border}`, marginBottom: 40 }}>
                {[
                    { id: 'dados', label: '📋 Dados Cadastrais', icon: '📝' },
                    { id: 'contas', label: '💳 Contas Bancárias', icon: '🏦', disabled: !id },
                    { id: 'portfolio', label: '🏢 Portfólio / Imóveis', icon: '🏢', disabled: !id },
                ].map(t => (
                    <button
                        key={t.id}
                        disabled={t.disabled}
                        onClick={() => setTab(t.id)}
                        style={{
                            padding: '12px 4px', background: 'transparent', border: 'none',
                            borderBottom: `2px solid ${tab === t.id ? T.accent : 'transparent'}`,
                            color: t.disabled ? T.textMuted : (tab === t.id ? T.accent : T.textSecondary),
                            fontSize: 14, fontWeight: tab === t.id ? 700 : 500, cursor: t.disabled ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div style={{ maxWidth: 900 }}>
                {tab === 'dados' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'flex', gap: 20 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Tipo de Pessoa</label>
                                    <select value={data.tipo_pessoa} onChange={e => setData({ ...data, tipo_pessoa: e.target.value })} style={{ width: '100%', background: T.card, border: `1px solid ${T.border}`, color: T.textPrimary, borderRadius: 8, padding: '10px 12px', outline: 'none' }}>
                                        <option value="PF">Pessoa Física</option>
                                        <option value="PJ">Pessoa Jurídica</option>
                                    </select>
                                </div>
                                <div style={{ flex: 2 }}>
                                    <label style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>CPF / CNPJ</label>
                                    <input value={data.cpf_cnpj} onChange={e => setData({ ...data, cpf_cnpj: e.target.value })} style={{ width: '100%', background: T.card, border: `1px solid ${T.border}`, color: T.textPrimary, borderRadius: 8, padding: '10px 12px', outline: 'none' }} placeholder="000.000.000-00" />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Nome Completo / Razão Social</label>
                                <input value={data.nome_completo} onChange={e => setData({ ...data, nome_completo: e.target.value })} style={{ width: '100%', background: T.card, border: `1px solid ${T.border}`, color: T.textPrimary, borderRadius: 8, padding: '10px 12px', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>E-mail</label>
                                    <input value={data.email} onChange={e => setData({ ...data, email: e.target.value })} style={{ width: '100%', background: T.card, border: `1px solid ${T.border}`, color: T.textPrimary, borderRadius: 8, padding: '10px 12px', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Telefone / WhatsApp</label>
                                    <input value={data.whatsapp || data.telefone} onChange={e => setData({ ...data, whatsapp: e.target.value })} style={{ width: '100%', background: T.card, border: `1px solid ${T.border}`, color: T.textPrimary, borderRadius: 8, padding: '10px 12px', outline: 'none' }} />
                                </div>
                            </div>
                        </section>

                        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>CEP</label>
                                    <input value={data.cep} onChange={e => setData({ ...data, cep: e.target.value })} style={{ width: '100%', background: T.card, border: `1px solid ${T.border}`, color: T.textPrimary, borderRadius: 8, padding: '10px 12px', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Logradouro</label>
                                    <input value={data.logradouro} onChange={e => setData({ ...data, logradouro: e.target.value })} style={{ width: '100%', background: T.card, border: `1px solid ${T.border}`, color: T.textPrimary, borderRadius: 8, padding: '10px 12px', outline: 'none' }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 150px', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Número</label>
                                    <input value={data.numero} onChange={e => setData({ ...data, numero: e.target.value })} style={{ width: '100%', background: T.card, border: `1px solid ${T.border}`, color: T.textPrimary, borderRadius: 8, padding: '10px 12px', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Bairro</label>
                                    <input value={data.bairro} onChange={e => setData({ ...data, bairro: e.target.value })} style={{ width: '100%', background: T.card, border: `1px solid ${T.border}`, color: T.textPrimary, borderRadius: 8, padding: '10px 12px', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Cidade / UF</label>
                                    <input value={data.cidade} onChange={e => setData({ ...data, cidade: e.target.value })} style={{ width: '100%', background: T.card, border: `1px solid ${T.border}`, color: T.textPrimary, borderRadius: 8, padding: '10px 12px', outline: 'none' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Observações Privadas</label>
                                <textarea value={data.observacoes} onChange={e => setData({ ...data, observacoes: e.target.value })} style={{ width: '100%', background: T.card, border: `1px solid ${T.border}`, color: T.textPrimary, borderRadius: 8, padding: '10px 12px', outline: 'none', minHeight: 80, resize: 'vertical' }} />
                            </div>
                        </section>
                    </div>
                )}

                {tab === 'contas' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div style={{ color: T.textSecondary, fontSize: 14 }}>Contas bancárias cadastradas para repasse.</div>
                            <button onClick={handleAddAccount} style={{ background: T.teal + '22', color: T.teal, border: `1px solid ${T.teal}`, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>+ Add Conta</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {contas.length === 0 ? (
                                <div style={{ padding: 40, textAlign: 'center', color: T.textMuted, background: T.surface, borderRadius: 12 }}>Nenhuma conta cadastrada.</div>
                            ) : (
                                contas.map(acc => (
                                    <div key={acc.id} style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${acc.principal ? T.accent : T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700 }}>🏦 {acc.banco} {acc.principal && <span style={{ fontSize: 10, background: T.accent, color: 'white', padding: '2px 6px', borderRadius: 4, marginLeft: 8 }}>Principal</span>}</div>
                                            <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>Ag: {acc.agencia} | CC: {acc.conta} ({acc.tipo_conta})</div>
                                            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Pix: {acc.chave_pix || '—'}</div>
                                        </div>
                                        <button onClick={() => handleDeleteAccount(acc.id)} style={{ color: T.danger, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16 }}>🗑️</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {tab === 'portfolio' && portfolio && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {/* Estatísticas do portfólio */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                            {[
                                { l: 'Disponíveis', v: portfolio.qtd_disponiveis, c: T.accent },
                                { l: 'Locados', v: portfolio.qtd_locados, c: T.teal },
                                { l: 'Vendidos', v: portfolio.qtd_vendidos, c: T.green },
                                { l: 'Receita Mensal', v: formatCurrency(portfolio.receita_mensal), c: T.gold },
                            ].map(m => (
                                <div key={m.l} style={{ background: T.card, borderRadius: 12, padding: 16, border: `1px solid ${T.border}` }}>
                                    <div style={{ fontSize: 10, color: T.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>{m.l}</div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: m.c }}>{m.v}</div>
                                </div>
                            ))}
                        </div>

                        {/* Lista de imóveis do proprietário (resumida) */}
                        <div>
                            <h4 style={{ fontSize: 16, marginBottom: 16 }}>📍 Imóveis Vinculados</h4>
                            <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                                {(!data.imoveis || data.imoveis.length === 0) ? (
                                    <div style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>Nenhum imóvel vinculado a este proprietário.</div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ background: T.surface }}>
                                            <tr style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>
                                                <th style={{ textAlign: 'left', padding: 12 }}>Imóvel</th>
                                                <th style={{ textAlign: 'left', padding: 12 }}>Status</th>
                                                <th style={{ textAlign: 'right', padding: 12 }}>Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.imoveis.map(i => (
                                                <tr key={i.id} style={{ borderTop: `1px solid ${T.border}`, fontSize: 13 }}>
                                                    <td style={{ padding: 12 }}>{i.titulo}</td>
                                                    <td style={{ padding: 12 }}>
                                                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: i.status === 'disponivel' ? T.greenGlow : T.purple + '22', color: i.status === 'disponivel' ? T.green : T.purple }}>{i.status}</span>
                                                    </td>
                                                    <td style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(i.preco_locacao || i.preco_venda)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
