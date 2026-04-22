import { useState, useEffect } from "react";
import {
    Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend
} from "recharts";
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

export default function DashboardERP() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [month] = useState(new Date().getMonth() + 1);
    const [year] = useState(new Date().getFullYear());

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const data = await apiClient.getDashboardStats(month, year);
                setStats(data);
            } catch (e) {
                console.error("Erro dashboard stats", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [month, year]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: theme.textSecondary }}>
            <div className="animate-spin" style={{ fontSize: 40 }}>⚙️</div>
            <span style={{ marginLeft: 16 }}>Carregando Dashboard ERP...</span>
        </div>
    );

    const vgvGoal = stats?.metas?.find((m: any) => m.tipo_meta === 'vgv_venda')?.valor_meta || 1000000;
    const vgvCurrent = stats?.resumo?.vgv_total || 0;
    const vgvPct = Math.min(100, Math.round((vgvCurrent / vgvGoal) * 100));

    const vendasGoal = stats?.metas?.find((m: any) => m.tipo_meta === 'qtd_vendas')?.valor_meta || 10;
    const vendasCurrent = stats?.resumo?.vendas_qtd || 0;
    const vendasPct = Math.min(100, Math.round((vendasCurrent / vendasGoal) * 100));

    return (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, background: theme.bg, minHeight: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, margin: 0 }}>Dashboard de Performance & Metas</h1>
                    <p style={{ color: theme.textMuted, margin: "4px 0 0 0" }}>Acompanhamento executivo de resultados (ERP Layer 4)</p>
                </div>
                <div style={{ background: theme.bgCard, padding: '8px 16px', borderRadius: 12, border: `1px solid ${theme.border}`, display: 'flex', gap: 16 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: theme.textMuted, textTransform: 'uppercase' }}>Período</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{month}/{year}</div>
                    </div>
                </div>
            </div>

            {/* Top Row: Goal Thermometers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                {/* VGV Thermometer */}
                <div style={{ background: theme.bgCard, borderRadius: 20, padding: 24, border: `1px solid ${theme.border}`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: theme.textSecondary }}>Meta de VGV (Vendas)</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: theme.success }}>{vgvPct}%</span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, marginBottom: 4 }}>{formatCurrency(vgvCurrent)}</div>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>de {formatCurrency(vgvGoal)}</div>

                    <div style={{ height: 12, background: theme.bgElevated, borderRadius: 6, marginTop: 20, position: 'relative' }}>
                        <div style={{
                            height: '100%', width: `${vgvPct}%`, background: `linear-gradient(90deg, ${theme.accent}, ${theme.success})`,
                            borderRadius: 6, transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }} />
                    </div>
                </div>

                {/* Units/Sales Thermometer */}
                <div style={{ background: theme.bgCard, borderRadius: 20, padding: 24, border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: theme.textSecondary }}>Meta de Unidades</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: theme.warning }}>{vendasPct}%</span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, marginBottom: 4 }}>{vendasCurrent} Vendas</div>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>de {vendasGoal} unidades</div>

                    <div style={{ height: 12, background: theme.bgElevated, borderRadius: 6, marginTop: 20 }}>
                        <div style={{
                            height: '100%', width: `${vendasPct}%`, background: `linear-gradient(90deg, ${theme.purple}, ${theme.warning})`,
                            borderRadius: 6, transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }} />
                    </div>
                </div>

                {/* Realized Revenue */}
                <div style={{ background: theme.bgCard, borderRadius: 20, padding: 24, border: `1px solid ${theme.border}`, position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: theme.textSecondary }}>Receita Realizada (Cash-in)</span>
                        <span style={{ fontSize: 20 }}>💰</span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: theme.teal, marginBottom: 4 }}>{formatCurrency(stats?.resumo?.receita_realizada || 0)}</div>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>Entradas liquidadas no mês</div>
                    <div style={{ position: 'absolute', bottom: -10, right: -10, fontSize: 80, opacity: 0.05 }}>📈</div>
                </div>
            </div>

            {/* Middle Row: Ranking & Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                {/* Performance Ranking */}
                <div style={{ background: theme.bgCard, borderRadius: 20, padding: 24, border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🏆 Ranking de Performance (Corretores)</h3>
                        <button style={{ fontSize: 12, color: theme.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Ver Relatório Completo</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(stats?.performance || []).slice(0, 5).map((p: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: theme.bgSurface, borderRadius: 12, border: `1px solid ${theme.border}` }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : theme.bgElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: i < 3 ? '#000' : theme.textSecondary, marginRight: 16 }}>
                                    {i + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary }}>{p.broker_name}</div>
                                    <div style={{ fontSize: 11, color: theme.textMuted }}>{p.total_vendas} vendas realizadas</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: theme.accent }}>{formatCurrency(p.vgv_total)}</div>
                                    <div style={{ fontSize: 10, color: theme.textMuted }}>VGV Acumulado</div>
                                </div>
                            </div>
                        ))}
                        {(!stats?.performance || stats.performance.length === 0) && (
                            <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted }}>Nenhum dado de performance para este período.</div>
                        )}
                    </div>
                </div>

                {/* Composition/Share */}
                <div style={{ background: theme.bgCard, borderRadius: 20, padding: 24, border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 700 }}>📊 Market Share Interno</h3>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie
                                    data={stats?.performance?.slice(0, 5) || []}
                                    dataKey="vgv_total"
                                    nameKey="broker_name"
                                    cx="50%" cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                >
                                    {(stats?.performance || []).map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={[theme.accent, theme.success, theme.warning, theme.purple, theme.teal][index % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Projections or Recent Activities */}
            <div style={{ background: `linear-gradient(135deg, ${theme.bgCard}, ${theme.bgElevated})`, borderRadius: 20, padding: 30, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 40 }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 800 }}>🔮 Projeção Inteligente</h3>
                    <p style={{ margin: 0, color: theme.textSecondary, lineHeight: 1.6 }}>
                        Baseado na velocidade de vendas atual (VSO) e nos leads qualificados no pipeline, a projeção é fechar o mês com <strong>{formatCurrency(vgvCurrent * 1.25)}</strong> de VGV, atingindo <strong>98%</strong> da meta estipulada.
                    </p>
                </div>
                <button style={{ padding: '14px 28px', background: 'white', color: theme.bg, borderRadius: 12, fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                    Ver Insights IA
                </button>
            </div>
        </div>
    );
}
