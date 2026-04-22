import { useState, useEffect } from "react";
import { apiClient } from "../client";

const theme = {
    bg: "#0A1628", bgSurface: "#0F2240", bgCard: "#142952", bgElevated: "#1A3468",
    accent: "#3B82F6", accentHover: "#2563EB", success: "#10B981", warning: "#F59E0B",
    danger: "#EF4444", teal: "#0D9488", purple: "#7C3AED",
    textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
    border: "rgba(148,163,184,0.1)",
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('pt-BR');
};

export default function Vistorias({ onBack }: { onBack: () => void }) {
    const [vistorias, setVistorias] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenantId] = useState('rbhkwmesmvytqdfuwcie');
    const [viewingId, setViewingId] = useState<string | null>(null);
    const [currentVistoria, setCurrentVistoria] = useState<any>(null);

    const fetchVistorias = async () => {
        setLoading(true);
        try {
            const res: any = await apiClient.getVistorias(tenantId);
            setVistorias(res.vistorias || []);
        } catch (e) {
            console.error("Erro ao carregar vistorias", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async (id: string) => {
        setLoading(true);
        try {
            const res: any = await apiClient.getVistoriaById(id);
            setCurrentVistoria(res.vistoria);
            setViewingId(id);
        } catch (e) {
            console.error("Erro ao carregar detalhes", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVistorias();
    }, []);

    if (loading && !viewingId) return (
        <div style={{ padding: 40, color: theme.textSecondary, textAlign: 'center' }}>Carregando Vistorias...</div>
    );

    return (
        <div style={{ minHeight: '100vh', background: theme.bg, color: theme.textPrimary, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{ padding: '20px 40px', background: theme.bgSurface, borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={viewingId ? () => { setViewingId(null); setCurrentVistoria(null); } : onBack} style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', fontSize: 20 }}>←</button>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Vistorias Digitais</h1>
                        <p style={{ margin: 0, fontSize: 12, color: theme.textMuted }}>Módulo ERP - M6: Laudos de Entrada, Saída e Periódicos</p>
                    </div>
                </div>
                {!viewingId && (
                    <button
                        style={{ padding: '10px 20px', background: theme.accent, color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', opacity: 0.5 }}
                    >
                        + Nova Vistoria (Em Breve)
                    </button>
                )}
            </header>

            <main style={{ flex: 1, padding: 40 }}>
                {!viewingId ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                        {vistorias.map(v => (
                            <div key={v.id} onClick={() => fetchDetails(v.id)} style={{ background: theme.bgCard, borderRadius: 20, padding: 24, border: `1px solid ${theme.border}`, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', padding: '4px 8px', borderRadius: 6, background: v.tipo === 'entrada' ? theme.success + '22' : v.tipo === 'saida' ? theme.danger + '22' : theme.warning + '22', color: v.tipo === 'entrada' ? theme.success : v.tipo === 'saida' ? theme.danger : theme.warning }}>
                                        {v.tipo}
                                    </span>
                                    <span style={{ fontSize: 11, color: theme.textMuted }}>{formatDate(v.created_at)}</span>
                                </div>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700 }}>{v.imoveis?.titulo || 'Imóvel s/ Título'}</h3>
                                <p style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 20 }}>{v.imoveis?.endereco}</p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: `1px solid ${theme.border}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: theme.bgElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>👤</div>
                                        <span style={{ fontSize: 11, color: theme.textSecondary }}>{v.corretores?.nome || 'Gestor'}</span>
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: v.status === 'concluida' ? theme.success : theme.warning }}>
                                        {v.status.toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 60, opacity: 0.03 }}>📋</div>
                            </div>
                        ))}
                        {vistorias.length === 0 && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 100, color: theme.textMuted }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>📸</div>
                                <p>Nenhuma vistoria encontrada. Comece criando uma nova!</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {/* Info Card */}
                        <div style={{ background: `linear-gradient(135deg, ${theme.bgCard}, ${theme.bgElevated})`, borderRadius: 24, padding: 32, border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{currentVistoria.imoveis?.titulo}</h2>
                                <p style={{ color: theme.textSecondary, fontSize: 14, margin: 0 }}>{currentVistoria.imoveis?.endereco}</p>
                                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                                    <span style={{ padding: '6px 12px', background: theme.bgSurface, borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{currentVistoria.tipo.toUpperCase()}</span>
                                    <span style={{ padding: '6px 12px', background: theme.bgSurface, borderRadius: 8, fontSize: 12, fontWeight: 700, color: theme.accent }}>{currentVistoria.status.toUpperCase()}</span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 12, color: theme.textMuted }}>Vistoriador</div>
                                <div style={{ fontSize: 16, fontWeight: 700 }}>{currentVistoria.corretores?.nome || 'Admin'}</div>
                                <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 12 }}>Data</div>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(currentVistoria.data_vistoria) || 'Não realizada'}</div>
                            </div>
                        </div>

                        {/* Itens List */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>🛋️ Itens e Cômodos</h3>
                                <button style={{ padding: '8px 16px', background: theme.bgElevated, color: theme.textPrimary, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Add Cômodo/Item</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {currentVistoria.itens?.map((item: any) => (
                                    <div key={item.id} style={{ background: theme.bgSurface, padding: 20, borderRadius: 16, border: `1px solid ${theme.border}`, display: 'flex', gap: 20 }}>
                                        <div style={{ width: 80, height: 80, background: theme.bgElevated, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🖼️</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ fontSize: 14, fontWeight: 800 }}>{item.item} — <span style={{ color: theme.textMuted }}>{item.comodo}</span></span>
                                                <span style={{ fontSize: 11, fontWeight: 800, color: item.estado === 'Novo' ? theme.success : item.estado === 'Regular' ? theme.warning : theme.danger }}>{item.estado.toUpperCase()}</span>
                                            </div>
                                            <p style={{ fontSize: 13, color: theme.textSecondary, margin: '8px 0' }}>{item.detalhes || 'Sem observações detalhadas.'}</p>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                {item.fotos?.map((_f: string, idx: number) => (
                                                    <div key={idx} style={{ width: 32, height: 32, borderRadius: 6, background: theme.bgCard, border: `1px solid ${theme.border}` }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!currentVistoria.itens || currentVistoria.itens.length === 0) && (
                                    <div style={{ padding: 40, textAlign: 'center', background: theme.bgSurface, borderRadius: 16, border: `1px dashed ${theme.border}`, color: theme.textMuted }}>
                                        Nenhum item registrado nesta vistoria.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div style={{ display: 'flex', gap: 16, paddingTop: 20, borderTop: `1px solid ${theme.border}` }}>
                            <button style={{ flex: 1, padding: 16, background: theme.bgElevated, color: theme.textPrimary, border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Gerar PDF de Rascunho</button>
                            <button style={{ flex: 2, padding: 16, background: theme.success, color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>Finalizar e Enviar para Assinatura</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
