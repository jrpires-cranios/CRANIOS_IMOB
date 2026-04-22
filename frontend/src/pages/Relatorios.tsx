import { useState } from "react";
import { apiClient } from "../client";

const theme = {
    bg: "#0A1628", bgSurface: "#0F2240", bgCard: "#142952", bgElevated: "#1A3468",
    accent: "#3B82F6", accentHover: "#2563EB", success: "#10B981", warning: "#F59E0B",
    danger: "#EF4444", orange: "#F97316",
    textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
    border: "rgba(148,163,184,0.1)",
};

export default function Relatorios({ onBack }: { onBack: () => void }) {
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [tenantId] = useState('rbhkwmesmvytqdfuwcie');
    const [tenantName] = useState('Crânios IMOB');

    const handleDownload = (format: 'pdf' | 'csv') => {
        const url = apiClient.getFinanceiroReportUrl(format, tenantId, startDate, endDate, tenantName);
        window.open(url, '_blank');
    };

    const reports = [
        {
            id: 'financeiro',
            title: 'Relatório Financeiro',
            description: 'Fluxo de caixa consolidado, receitas e despesas por categoria.',
            icon: '📊',
            color: theme.accent
        },
        {
            id: 'proprietario',
            title: 'Extrato de Proprietário',
            description: 'Detalhamento de aluguéis, taxas de adm e repasses líquidos.',
            icon: '🏠',
            color: theme.success,
            comingSoon: true
        },
        {
            id: 'comissoes',
            title: 'Relatório de Comissões',
            description: 'Performance de corretores e valores pendentes/liquidados.',
            icon: '💰',
            color: theme.orange,
            comingSoon: true
        },
        {
            id: 'vistorias',
            title: 'Relatório de Vistorias',
            description: 'Lista de laudos realizados e status de conservação.',
            icon: '📸',
            color: theme.textMuted,
            comingSoon: true
        }
    ];

    return (
        <div style={{ minHeight: '100vh', background: theme.bg, color: theme.textPrimary, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{ padding: '20px 40px', background: theme.bgSurface, borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={onBack} style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', fontSize: 20 }}>←</button>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Central de Relatórios</h1>
                        <p style={{ margin: 0, fontSize: 12, color: theme.textMuted }}>Módulo ERP - M7: Inteligência de Dados e Exportação</p>
                    </div>
                </div>
            </header>

            <main style={{ flex: 1, padding: 40, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                {/* Filters Section */}
                <div style={{ background: theme.bgSurface, padding: 32, borderRadius: 24, border: `1px solid ${theme.border}`, marginBottom: 40, display: 'flex', gap: 32, alignItems: 'flex-end', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: theme.textSecondary, marginBottom: 8 }}>DATA INICIAL</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{ width: '100%', background: theme.bgCard, color: 'white', border: `1px solid ${theme.border}`, padding: '12px 16px', borderRadius: 12, outline: 'none' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: theme.textSecondary, marginBottom: 8 }}>DATA FINAL</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{ width: '100%', background: theme.bgCard, color: 'white', border: `1px solid ${theme.border}`, padding: '12px 16px', borderRadius: 12, outline: 'none' }}
                        />
                    </div>
                    <div style={{ flex: 1, color: theme.textMuted, fontSize: 12 }}>
                        Os relatórios serão gerados com base no período de vencimento dos lançamentos.
                    </div>
                </div>

                {/* Reports Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                    {reports.map(report => (
                        <div key={report.id} style={{ background: theme.bgCard, borderRadius: 24, padding: 32, border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: 16, transition: '0.3s', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>{report.icon}</div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{report.title}</h3>
                                <p style={{ fontSize: 13, color: theme.textSecondary, margin: '8px 0', lineHeight: 1.5 }}>{report.description}</p>
                            </div>

                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {report.comingSoon ? (
                                    <div style={{ textAlign: 'center', padding: '12px', background: theme.bgElevated, borderRadius: 12, fontSize: 12, fontWeight: 700, color: theme.textMuted }}>
                                        🚧 Em breve nesta Sprint
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => handleDownload('pdf')}
                                            style={{ flex: 1, padding: '12px', background: theme.bgElevated, color: theme.textPrimary, border: `1px solid ${theme.border}`, borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}
                                        >
                                            📄 PDF
                                        </button>
                                        <button
                                            onClick={() => handleDownload('csv')}
                                            style={{ flex: 1, padding: '12px', background: theme.accent, color: 'white', border: 'none', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}
                                        >
                                            📗 EXCEL
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div style={{ position: 'absolute', bottom: -10, right: -10, fontSize: 100, opacity: 0.02, color: report.color }}>{report.icon}</div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
