import { useState, useEffect } from "react";
import { apiClient } from "../client";

const theme = {
    bg: "#0A1628", bgSurface: "#0F2240", bgCard: "#142952", bgElevated: "#1A3468",
    accent: "#3B82F6", accentHover: "#2563EB", success: "#10B981", warning: "#F59E0B",
    danger: "#EF4444", teal: "#0D9488", purple: "#7C3AED",
    textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
    border: "rgba(148,163,184,0.1)",
};

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const OS_STATUS = [
    { id: 'aberta', label: 'Aberta', color: theme.textMuted },
    { id: 'orcada', label: 'Orçada', color: theme.warning },
    { id: 'aprovada', label: 'Aprovada', color: theme.accent },
    { id: 'em_execucao', label: 'Em Execução', color: theme.purple },
    { id: 'concluida', label: 'Concluída', color: theme.success },
];

export default function OrdensServico({ onBack }: { onBack: () => void }) {
    const [activeSubTab, setActiveSubTab] = useState<'kanban' | 'prestadores'>('kanban');
    const [ordens, setOrdens] = useState<any[]>([]);
    const [prestadores, setPrestadores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenantId] = useState('rbhkwmesmvytqdfuwcie');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [osRes, pRes] = await Promise.all([
                apiClient.getOrdensServico(tenantId),
                apiClient.getPrestadores(tenantId)
            ]);
            setOrdens((osRes as any).ordens || []);
            setPrestadores((pRes as any).prestadores || []);
        } catch (e) {
            console.error("Erro ao buscar dados M5", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateStatus = async (osId: string, newStatus: string) => {
        try {
            await apiClient.updateStatusOS(osId, newStatus);
            fetchData();
        } catch (e) {
            alert("Erro ao atualizar status");
        }
    };

    if (loading) return (
        <div style={{ padding: 40, color: theme.textSecondary, textAlign: 'center' }}>Carregando Módulo de Serviços...</div>
    );

    return (
        <div style={{ minHeight: '100vh', background: theme.bg, color: theme.textPrimary, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{ padding: '20px 40px', background: theme.bgSurface, borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={onBack} style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', fontSize: 20 }}>←</button>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Gestão de Manutenção (OS)</h1>
                        <p style={{ margin: 0, fontSize: 12, color: theme.textMuted }}>Módulo ERP - M5: Ordens de Serviço e Prestadores</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, background: theme.bgElevated, padding: 4, borderRadius: 12 }}>
                    <button
                        onClick={() => setActiveSubTab('kanban')}
                        style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: activeSubTab === 'kanban' ? theme.accent : 'transparent', color: activeSubTab === 'kanban' ? 'white' : theme.textSecondary, fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}
                    >
                        📋 Kanban OS
                    </button>
                    <button
                        onClick={() => setActiveSubTab('prestadores')}
                        style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: activeSubTab === 'prestadores' ? theme.accent : 'transparent', color: activeSubTab === 'prestadores' ? 'white' : theme.textSecondary, fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}
                    >
                        🛠️ Prestadores
                    </button>
                </div>
            </header>

            <main style={{ flex: 1, padding: 40, overflowX: 'auto' }}>
                {activeSubTab === 'kanban' ? (
                    <div style={{ display: 'flex', gap: 20, minWidth: 1200, height: 'calc(100vh - 200px)' }}>
                        {OS_STATUS.map(status => (
                            <div key={status.id} style={{ flex: 1, background: theme.bgSurface, borderRadius: 16, border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: status.color }}>{status.label}</h3>
                                    <span style={{ fontSize: 12, color: theme.textMuted, background: theme.bgElevated, padding: '2px 8px', borderRadius: 10 }}>
                                        {ordens.filter(o => o.status === status.id).length}
                                    </span>
                                </div>
                                <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
                                    {ordens.filter(o => o.status === status.id).map(os => (
                                        <div key={os.id} style={{ background: theme.bgCard, padding: 16, borderRadius: 12, border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{os.imoveis?.titulo || 'Sem Título'}</div>
                                            <div style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 8 }}>{os.imoveis?.endereco}</div>
                                            <p style={{ fontSize: 12, margin: '8px 0', color: theme.textMuted, fontStyle: 'italic' }}>"{os.descricao_problema}"</p>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                                                <div style={{ fontSize: 11, color: theme.accent, fontWeight: 700 }}>{os.prestadores_servico?.nome || 'Prestador Pendente'}</div>
                                                <div style={{ fontSize: 12, fontWeight: 800, color: theme.textPrimary }}>{formatCurrency(os.valor_orcado)}</div>
                                            </div>

                                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.border}`, display: 'flex', gap: 4 }}>
                                                {os.status !== 'concluida' && (
                                                    <select
                                                        onChange={(e) => handleUpdateStatus(os.id, e.target.value)}
                                                        value={os.status}
                                                        style={{ width: '100%', fontSize: 10, background: theme.bgElevated, color: theme.textPrimary, border: 'none', padding: 4, borderRadius: 4 }}
                                                    >
                                                        {OS_STATUS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {ordens.filter(o => o.status === status.id).length === 0 && (
                                        <div style={{ textAlign: 'center', padding: 20, color: theme.textMuted, fontSize: 12 }}>Vazio</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800 }}>🛠️ Prestadores de Serviço</h2>
                            <button style={{ padding: '10px 20px', background: theme.accent, color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>+ Novo Prestador</button>
                        </div>
                        <div style={{ background: theme.bgCard, borderRadius: 16, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: theme.bgSurface, borderBottom: `1px solid ${theme.border}` }}>
                                        <th style={{ padding: 16, textAlign: 'left', fontSize: 12, color: theme.textMuted }}>NOME</th>
                                        <th style={{ padding: 16, textAlign: 'left', fontSize: 12, color: theme.textMuted }}>ESPECIALIDADE</th>
                                        <th style={{ padding: 16, textAlign: 'left', fontSize: 12, color: theme.textMuted }}>CONTATO</th>
                                        <th style={{ padding: 16, textAlign: 'center', fontSize: 12, color: theme.textMuted }}>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prestadores.map(p => (
                                        <tr key={p.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                                            <td style={{ padding: 16, fontWeight: 700 }}>{p.nome}</td>
                                            <td style={{ padding: 16, color: theme.textSecondary }}>{p.especialidade}</td>
                                            <td style={{ padding: 16 }}>
                                                <div style={{ fontSize: 13 }}>{p.telefone}</div>
                                                <div style={{ fontSize: 11, color: theme.textMuted }}>{p.email}</div>
                                            </td>
                                            <td style={{ padding: 16, textAlign: 'center' }}>
                                                <span style={{ padding: '4px 12px', borderRadius: 20, background: p.status === 'ativo' ? theme.success + '22' : theme.danger + '22', color: p.status === 'ativo' ? theme.success : theme.danger, fontSize: 11, fontWeight: 700 }}>
                                                    {p.status?.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {prestadores.length === 0 && (
                                        <tr>
                                            <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: theme.textMuted }}>Nenhum prestador cadastrado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
