import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { apiClient } from "../client";
import ExecutiveBI from "./ExecutiveBI";
import Franquias from "./Franquias";
import ImovelUpload from "./ImovelUpload";
const theme = {
    bg: "#0A1628", bgSurface: "#0F2240", bgCard: "#142952", bgElevated: "#1A3468",
    accent: "#3B82F6", accentHover: "#2563EB", success: "#10B981", warning: "#F59E0B",
    danger: "#EF4444", teal: "#0D9488", purple: "#7C3AED",
    textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
    border: "rgba(148,163,184,0.1)",
};

const leadsData = [
    { day: "Seg", leads: 18, conv: 3 }, { day: "Ter", leads: 24, conv: 5 },
    { day: "Qua", leads: 15, conv: 2 }, { day: "Qui", leads: 31, conv: 7 },
    { day: "Sex", leads: 28, conv: 6 }, { day: "Sáb", leads: 12, conv: 3 },
    { day: "Dom", leads: 8, conv: 1 }, { day: "Seg", leads: 22, conv: 5 },
    { day: "Ter", leads: 35, conv: 8 }, { day: "Qua", leads: 19, conv: 4 },
    { day: "Qui", leads: 27, conv: 6 }, { day: "Sex", leads: 33, conv: 9 },
    { day: "Sáb", leads: 14, conv: 3 }, { day: "Dom", leads: 9, conv: 2 },
];

const origemData = [
    { name: "WhatsApp", value: 42, color: "#10B981" },
    { name: "Portais", value: 28, color: "#3B82F6" },
    { name: "Instagram", value: 16, color: "#7C3AED" },
    { name: "Indicação", value: 9, color: "#F59E0B" },
    { name: "Site", value: 5, color: "#0D9488" },
];

const corretores = [
    { id: 1, nome: "Ricardo Figueiredo", leads: 48, conv: "22%", fat: "R$ 312k", sla: "ok" as const, peso: 3, iqc: 87, status: "ativo", color: "#3B82F6" },
    { id: 2, nome: "Maria Santos", leads: 35, conv: "18%", fat: "R$ 198k", sla: "warn" as const, peso: 2, iqc: 72, status: "ativo", color: "#10B981" },
    { id: 3, nome: "Chico Lima", leads: 22, conv: "14%", fat: "R$ 124k", sla: "ok" as const, peso: 1, iqc: 61, status: "ativo", color: "#F59E0B" },
    { id: 4, nome: "Joana Costa", leads: 41, conv: "25%", fat: "R$ 287k", sla: "ok" as const, peso: 2, iqc: 91, status: "ativo", color: "#7C3AED" },
    { id: 5, nome: "Paulo Neto", leads: 19, conv: "11%", fat: "R$ 89k", sla: "danger" as const, peso: 1, iqc: 48, status: "ausente", color: "#EF4444" },
];

const funnelData = [
    { name: "Leads Recebidos", value: 247, fill: "#3B82F6" },
    { name: "Qualificados", value: 189, fill: "#2563EB" },
    { name: "Visitas Agendadas", value: 94, fill: "#0D9488" },
    { name: "Visitas Realizadas", value: 71, fill: "#10B981" },
    { name: "Propostas Enviadas", value: 38, fill: "#F59E0B" },
    { name: "Contratos Assinados", value: 22, fill: "#EA580C" },
];

const alertas = [
    { tipo: "danger" as const, msg: "Paulo Neto sem resposta há 47 min — Lead quente pendente", time: "há 2 min" },
    { tipo: "warning" as const, msg: "Maria Santos: SLA de visita próximo do limite (82 min/2h)", time: "há 8 min" },
    { tipo: "success" as const, msg: "Contrato assinado! Ricardo Figueiredo — R$ 485.000", time: "há 15 min" },
    { tipo: "info" as const, msg: "Novo lead quente recebido via WhatsApp — João Alves", time: "há 22 min" },
    { tipo: "danger" as const, msg: "Lead sem corretor disponível — fila de espera: 2 leads", time: "há 31 min" },
];

const kpis = [
    { label: "Total de Leads", value: "247", delta: "+14%", icon: "👥", color: "#3B82F6", sub: "vs. mês anterior" },
    { label: "Taxa de Conversão", value: "18,4%", delta: "+2.1pp", icon: "🎯", color: "#10B981", sub: "meta: 20%" },
    { label: "Faturamento", value: "R$ 892k", delta: "+31%", icon: "💰", color: "#F59E0B", sub: "meta: R$ 1M" },
    { label: "Leads Quentes", value: "34", delta: "-3", icon: "🔥", color: "#EA580C", sub: "ativos agora" },
    { label: "Visitas Hoje", value: "12", delta: "+4", icon: "📅", color: "#0D9488", sub: "3 confirmadas" },
    { label: "Alertas SLA", value: "3", delta: "+1", icon: "⚠️", color: "#EF4444", sub: "críticos agora" },
];

const navItems = [
    { icon: "📊", label: "Overview", id: "overview" },
    { icon: "👥", label: "Corretores", id: "corretores" },
    { icon: "🏆", label: "Performance", id: "performance" },
    { icon: "🔥", label: "Leads", id: "leads" },
    { icon: "🎯", label: "Funil", id: "funil" },
    { icon: "💰", label: "Financeiro", id: "financeiro" },
    { icon: "🏢", label: "Minha Rede", id: "network" },
    { icon: "📈", label: "BI Executivo", id: "bi" },
    { icon: "📋", label: "Relatórios", id: "relatorios" },
    { icon: "⚙️", label: "Config.", id: "config" },
    { icon: "🏠", label: "Site", id: "site" },
    { icon: "➕", label: "Imóveis", id: "imoveis" },
    { icon: "🌐", label: "Portais", id: "portais" },
    { icon: "💼", label: "Negócios", id: "negocios" },
    { icon: "🎧", label: "Suporte IA", id: "suporte" },
];

const SlaIndicator = ({ status }: { status: "ok" | "warn" | "danger" }) => {
    const map = { ok: ["#10B981", "●"], warn: ["#F59E0B", "●"], danger: ["#EF4444", "●"] };
    const [color, icon] = map[status] || map.ok;
    return <span style={{ color, fontSize: 18 }}>{icon}</span>;
};

const KpiCard = ({ kpi, animate }: { kpi: typeof kpis[0], animate: boolean }) => {
    const deltaColor = kpi.label === "Alertas SLA"
        ? (kpi.delta.startsWith("-") ? "#10B981" : "#EF4444")
        : (kpi.delta.startsWith("+") ? "#10B981" : "#EF4444");

    return (
        <div style={{
            background: theme.bgCard, borderRadius: 16, padding: "20px 24px",
            border: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", gap: 8,
            transition: "transform 0.2s, box-shadow 0.2s", cursor: "default",
            boxShadow: animate ? `0 0 0 2px ${kpi.color}44` : "none",
            flex: "1 1 0", minWidth: 140,
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 28 }}>{kpi.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: deltaColor, background: deltaColor + "22", padding: "2px 8px", borderRadius: 20 }}>
                    {kpi.delta}
                </span>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: theme.textPrimary, letterSpacing: "-0.02em" }}>
                {kpi.value}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.textSecondary }}>{kpi.label}</div>
            <div style={{ fontSize: 11, color: theme.textMuted }}>{kpi.sub}</div>
            <div style={{ height: 3, background: theme.bgElevated, borderRadius: 2, marginTop: 4 }}>
                <div style={{ height: "100%", width: "68%", background: kpi.color, borderRadius: 2, transition: "width 1s ease" }} />
            </div>
        </div>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: theme.bgElevated, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 16px" }}>
            <p style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 6 }}>{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.color, fontSize: 14, fontWeight: 600 }}>
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    );
};

interface DashboardProps {
    onGoHome?: () => void;
}
export default function Dashboard({ onGoHome }: DashboardProps) {
    const [activeTab, setActiveTab] = useState<string>("overview");
    const [filter, setFilter] = useState("mes");
    const [animIdx, setAnimIdx] = useState<number | null>(null);
    const [rouletteAngle, setRouletteAngle] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [liveTime, setLiveTime] = useState(new Date());
    const [newAlert, setNewAlert] = useState(false);
    const [alertMsg, setAlertMsg] = useState('');
    const [liveCorretores, setLiveCorretores] = useState(corretores);
    const [liveKpis, setLiveKpis] = useState(kpis);

    // Estados do Modal Telegram
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [qrTargetLink, setQrTargetLink] = useState('');
    const [generatingQr, setGeneratingQr] = useState(false);
    const [qrCorretorName, setQrCorretorName] = useState('');

    // Estados do Convite e Limites do Plano (Fase 6)
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteNome, setInviteNome] = useState('');
    const [planLimitDetails, setPlanLimitDetails] = useState<any>(null);
    const [inviting, setInviting] = useState(false);

    // Estados do Suporte IA (Fase 6)
    const [ticketSubject, setTicketSubject] = useState('');
    const [ticketDescription, setTicketDescription] = useState('');
    const [ticketSending, setTicketSending] = useState(false);
    const [ticketResponse, setTicketResponse] = useState<any>(null);

    // Estados para Negócios / WON
    const [wonLeadId, setWonLeadId] = useState('');
    const [wonLeadNome, setWonLeadNome] = useState('');
    const [wonLoading, setWonLoading] = useState(false);
    const [wonFeedback, setWonFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [reactivateLoading, setReactivateLoading] = useState(false);
    const [reactivateLeadId, setReactivateLeadId] = useState('');
    const [reactivateFeedback, setReactivateFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [mockLeads, setMockLeads] = useState([
        { id: 'lead_001', nome: 'Carlos Mendes', tipo: 'Locação', imovel: 'Apto 3Q Atalaia', valor: 'R$ 2.800/mês', status: 'negociacao', risk_score: 85, dias_parado: 12 },
        { id: 'lead_002', nome: 'Fernanda Lima', tipo: 'Venda', imovel: 'Casa Jardins', valor: 'R$ 480.000', status: 'visita_realizada', risk_score: 15, dias_parado: 1 },
        { id: 'lead_003', nome: 'Roberto Souza', tipo: 'Locação', imovel: 'Studio Centro', valor: 'R$ 1.600/mês', status: 'proposta_enviada', risk_score: 45, dias_parado: 5 },
        { id: 'lead_004', nome: 'Ana Paula Costa', tipo: 'Venda', imovel: 'Cobertura Barra', valor: 'R$ 1.200.000', status: 'contrato_gerado', risk_score: 5, dias_parado: 0 },
    ]);


    useEffect(() => {
        const handleAuthError = (e: any) => {
            const msg = e.detail || 'Sua sessão foi encerrada.';
            alert("⚠️ ALERTA DE SEGURANÇA (Anti-Compartilhamento):\n\n" + msg);
            localStorage.removeItem('sessionToken');
            if (onGoHome) onGoHome();
        };

        window.addEventListener('auth_error', handleAuthError);
        return () => window.removeEventListener('auth_error', handleAuthError);
    }, [onGoHome]);

    useEffect(() => {
        async function fetchData() {
            try {
                const [resCorretores, resStats] = await Promise.all([
                    apiClient.getCorretores(),
                    apiClient.getDashboardOverview()
                ]);
                if (resCorretores.success && resCorretores.data?.corretores) {
                    const mapped = resCorretores.data.corretores.map(c => ({
                        id: c.corretor_id,
                        nome: c.corretores?.nome || "Corretor",
                        leads: Math.floor(Math.random() * 50), // Mock visual por enquanto
                        conv: "20%",
                        fat: "R$ 0",
                        sla: "ok" as const,
                        peso: c.peso_roleta,
                        iqc: c.iqc,
                        status: c.status,
                        color: theme.accent
                    }));
                    if (mapped.length > 0) setLiveCorretores(mapped);
                }
                if (resStats.success && resStats.data?.stats) {
                    const { leadsAtribuidos7d, slaViolaes7d, mediaIqcAtivos } = resStats.data.stats;
                    const nextKpis = [...kpis];
                    nextKpis[0] = { ...kpis[0], value: String(leadsAtribuidos7d), sub: "últimos 7 dias" };
                    nextKpis[1] = { ...kpis[1], value: String(mediaIqcAtivos), label: "IQC Médio", sub: "corretores ativos" };
                    nextKpis[5] = { ...kpis[5], value: String(slaViolaes7d), sub: "últimos 7 dias" };
                    setLiveKpis(nextKpis);
                }
            } catch (e) {
                console.error("Dashboard api error", e);
            }
        }
        fetchData();
        const t = setInterval(() => setLiveTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        const t = setInterval(() => {
            const idx = Math.floor(Math.random() * 6);
            setAnimIdx(idx);
            setTimeout(() => setAnimIdx(null), 1500);
        }, 4000);
        return () => clearInterval(t);
    }, []);

    const spinRoulette = async () => {
        setRouletteAngle(a => a + 360 + Math.random() * 180);
        try {
            const result = await apiClient.simularDistribuicao();
            if (result.success && result.data) {
                setAlertMsg(`✅ Lead atribuído a: ${result.data?.corretor_atribuido?.nome || "Corretor"}`);
            } else {
                setAlertMsg(`✅ Lead atribuído!`);
            }
        } catch (e) {
            setAlertMsg(`❌ Falha na distribuição`);
        }
        setNewAlert(true);
        setTimeout(() => setNewAlert(false), 3000);
    };

    const handleNavClick = (id: string) => {
        if (id === 'site' && onGoHome) {
            onGoHome();
        } else {
            setActiveTab(id);
        }
    };

    const handleGenerateTelegramQR = async (corretorId: string, nome: string) => {
        setGeneratingQr(true);
        setQrCorretorName(nome);
        setQrModalOpen(true);
        try {
            const res = await apiClient.gerarTelegramLink(String(corretorId));
            if (res.success && res.data) {
                setQrCodeUrl(res.data.qrCode);
                setQrTargetLink(res.data.link);
            } else {
                alert("Erro ao gerar convite: " + res.error);
                setQrModalOpen(false);
            }
        } catch (e: any) {
            alert("Falha na geração: " + e.message);
            setQrModalOpen(false);
        } finally {
            setGeneratingQr(false);
        }
    };

    // Função para Disparar Convite e tratar Limitador de Plano (PWA)
    const handleInviteCorretor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail || !inviteNome) return;
        setInviting(true);
        try {
            const cliente_id = localStorage.getItem('tenant_id') || undefined;
            const res = await apiClient.convidarCorretor({ email: inviteEmail, nome: inviteNome, cliente_id, empresaNome: 'Sua Imobiliária' });

            if (res.success) {
                alert("Convite enviado com sucesso para o corretor!");
                setInviteModalOpen(false);
                setInviteEmail('');
                setInviteNome('');
            } else if (res.code === 'CORRETOR_LIMIT_REACHED') {
                setPlanLimitDetails(res);
                setInviteModalOpen(false);
                setUpgradeModalOpen(true);
            } else {
                alert(res.error || "Erro ao enviar convite.");
            }
        } catch (e: any) {
            alert(e.message || "Erro desconhecido de conexão.");
        } finally {
            setInviting(false);
        }
    };

    // Submissão do Ticket de Suporte (Fase 6)
    const handleTicketSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticketSubject || !ticketDescription) return;
        setTicketSending(true);
        setTicketResponse(null);
        try {
            const tenantId = localStorage.getItem('tenant_id') || 'tenant-demo';
            const email = localStorage.getItem('user_email') || 'gestor@demo.com';
            const res = await fetch('http://localhost:3005/api/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-token': localStorage.getItem('sessionToken') || '',
                    ...(localStorage.getItem('impersonationToken') ? { 'Authorization': `Bearer ${localStorage.getItem('impersonationToken')}` } : {})
                },
                body: JSON.stringify({ tenantId, email, subject: ticketSubject, description: ticketDescription })
            });
            const data = await res.json();
            if (data.success) {
                setTicketResponse(data);
                setTicketSubject('');
                setTicketDescription('');
            } else {
                alert('Erro ao enviar ticket: ' + (data.error || 'Desconhecido'));
            }
        } catch (err: any) {
            alert('Falha na comunicação com servidor: ' + err.message);
        } finally {
            setTicketSending(false);
        }
    };

    const isImpersonating = !!localStorage.getItem('impersonationToken');

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: theme.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: theme.textPrimary, overflow: "hidden", fontSize: 14 }}>
            {isImpersonating && (
                <div style={{ background: '#ef4444', color: 'white', padding: '10px 20px', textAlign: 'center', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', zIndex: 9999 }}>
                    <span>⚠️ MODO DE ACESSO MESTRE ATIVO (Impersonation) - Ações estão sendo gravadas em auditoria.</span>
                    <button
                        onClick={() => { localStorage.removeItem('impersonationToken'); window.location.reload(); }}
                        style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '6px 16px', border: '1px solid white', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                        Encerrar Sessão Mestre
                    </button>
                </div>
            )}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* ─── SIDEBAR ─── */}
                <div style={{
                    width: sidebarOpen ? 220 : 64, background: theme.bgSurface,
                    borderRight: `1px solid ${theme.border}`, display: "flex", flexDirection: "column",
                    transition: "width 0.3s ease", flexShrink: 0, overflow: "hidden", zIndex: 10
                }}>
                    {/* Logo */}
                    <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, background: theme.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🏢</div>
                        {sidebarOpen && <div><div style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>CRÂNIOS</div><div style={{ fontSize: 10, color: theme.textMuted }}>IMOB Dashboard</div></div>}
                    </div>

                    {/* Nav */}
                    <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
                        {navItems.map(item => (
                            <button key={item.id} onClick={() => handleNavClick(item.id)} style={{
                                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                                borderRadius: 10, background: activeTab === item.id ? theme.accent + "22" : "transparent",
                                border: activeTab === item.id ? `1px solid ${theme.accent}44` : "1px solid transparent",
                                color: activeTab === item.id ? theme.accent : theme.textSecondary,
                                cursor: "pointer", width: "100%", textAlign: "left", transition: "all 0.15s",
                                whiteSpace: "nowrap",
                            }}>
                                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                                {sidebarOpen && <span style={{ fontSize: 13, fontWeight: activeTab === item.id ? 600 : 400 }}>{item.label}</span>}
                            </button>
                        ))}
                    </nav>

                    {/* Gestor */}
                    {sidebarOpen && (
                        <div style={{ padding: 16, borderTop: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>G</div>
                            <div style={{ overflow: "hidden" }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: theme.textPrimary, whiteSpace: "nowrap" }}>Gestor Admin</div>
                                <div style={{ fontSize: 10, color: theme.textMuted }}>Acesso total</div>
                            </div>
                        </div>
                    )}
                    <button onClick={() => setSidebarOpen(o => !o)} style={{ padding: "12px 16px", background: "transparent", border: "none", color: theme.textMuted, cursor: "pointer", borderTop: `1px solid ${theme.border}`, fontSize: 18 }}>
                        {sidebarOpen ? "◀" : "▶"}
                    </button>
                </div>

                {/* ─── MAIN ─── */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    {/* TOPBAR */}
                    <div style={{ height: 64, background: theme.bgSurface, borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", padding: "0 24px", gap: 16, flexShrink: 0 }}>
                        <div style={{ flex: 1, display: "flex", gap: 8 }}>
                            {["hoje", "semana", "mes", "trimestre", "ano"].map(f => (
                                <button key={f} onClick={() => setFilter(f)} style={{
                                    padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                                    background: filter === f ? theme.accent : "transparent",
                                    color: filter === f ? "white" : theme.textMuted,
                                    border: filter === f ? "none" : `1px solid ${theme.border}`,
                                    transition: "all 0.15s",
                                }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                            ))}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 16, color: theme.textMuted, fontSize: 12 }}>
                            <span>⚙️ Filtros</span>
                            <span style={{ position: "relative" }}>
                                🔔
                                <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, background: theme.danger, borderRadius: "50%", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }}>3</span>
                            </span>
                            <span style={{ fontFamily: "monospace", color: theme.accent }}>{liveTime.toLocaleTimeString("pt-BR")}</span>
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
                        {activeTab === "overview" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 900 }}>
                                {/* KPIs */}
                                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                    {liveKpis.map((kpi, i) => <KpiCard key={i} kpi={kpi} animate={animIdx === i} />)}
                                </div>



                                {/* Charts row */}
                                <div style={{ display: "flex", gap: 20 }}>
                                    {/* Area chart */}
                                    <div style={{ flex: 2, background: theme.bgCard, borderRadius: 16, padding: "20px 16px 10px", border: `1px solid ${theme.border}` }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: theme.textPrimary }}>Leads & Conversões</div>
                                                <div style={{ fontSize: 12, color: theme.textMuted }}>Últimos 14 dias</div>
                                            </div>
                                            <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                                                <span style={{ color: theme.accent }}>● Leads</span>
                                                <span style={{ color: theme.success }}>● Convertidos</span>
                                            </div>
                                        </div>
                                        <ResponsiveContainer width="100%" height={180}>
                                            <AreaChart data={leadsData}>
                                                <defs>
                                                    <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={theme.accent} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={theme.accent} stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={theme.success} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={theme.success} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="day" tick={{ fill: theme.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: theme.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Area type="monotone" dataKey="leads" name="Leads" stroke={theme.accent} fill="url(#leadGrad)" strokeWidth={2} />
                                                <Area type="monotone" dataKey="conv" name="Convertidos" stroke={theme.success} fill="url(#convGrad)" strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Donut */}
                                    <div style={{ flex: 1, background: theme.bgCard, borderRadius: 16, padding: "20px", border: `1px solid ${theme.border}` }}>
                                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Origem dos Leads</div>
                                        <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 16 }}>Por canal de entrada</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                            <ResponsiveContainer width={140} height={140}>
                                                <PieChart>
                                                    <Pie data={origemData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value" stroke="none">
                                                        {origemData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                    </Pie>
                                                    <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" fill={theme.textPrimary} fontSize={22} fontWeight={700}>247</text>
                                                    <text x="50%" y="64%" textAnchor="middle" dominantBaseline="middle" fill={theme.textMuted} fontSize={10}>total</text>
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                                                {origemData.map((o, i) => (
                                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: o.color, flexShrink: 0 }} />
                                                        <span style={{ fontSize: 12, color: theme.textSecondary, flex: 1 }}>{o.name}</span>
                                                        <span style={{ fontSize: 12, fontWeight: 600, color: theme.textPrimary }}>{o.value}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom row */}
                                <div style={{ display: "flex", gap: 20 }}>
                                    {/* Ranking */}
                                    <div style={{ flex: 2, background: theme.bgCard, borderRadius: 16, padding: 20, border: `1px solid ${theme.border}` }}>
                                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🏆 Ranking de Corretores</div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                            {liveCorretores.sort((a, b) => b.iqc - a.iqc).map((c, i) => (
                                                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: theme.bgSurface }}>
                                                    <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i]}</span>
                                                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: c.color + "33", border: `2px solid ${c.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: c.color }}>
                                                        {c.nome[0]}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>{c.nome}</div>
                                                        <div style={{ fontSize: 11, color: theme.textMuted }}>{c.leads} leads · {c.fat}</div>
                                                    </div>
                                                    <div style={{ textAlign: "right" }}>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: c.iqc > 80 ? theme.success : c.iqc > 60 ? theme.warning : theme.danger }}>IQC {c.iqc}</div>
                                                        <div style={{ fontSize: 11, color: theme.textMuted }}>Conv. {c.conv}</div>
                                                    </div>
                                                    <SlaIndicator status={c.sla} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Alertas */}
                                    <div style={{ flex: 1, background: theme.bgCard, borderRadius: 16, padding: 20, border: `1px solid ${theme.border}` }}>
                                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>⚡ Alertas Ativos</div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                            {alertas.map((a, i) => {
                                                const colors = { danger: theme.danger, warning: theme.warning, success: theme.success, info: theme.accent };
                                                const icons = { danger: "🚨", warning: "⚠️", success: "✅", info: "ℹ️" };
                                                return (
                                                    <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: colors[a.tipo] + "18", borderLeft: `3px solid ${colors[a.tipo]}` }}>
                                                        <div style={{ fontSize: 12, color: theme.textPrimary, marginBottom: 4, lineHeight: 1.4 }}>{icons[a.tipo]} {a.msg}</div>
                                                        <div style={{ fontSize: 10, color: theme.textMuted }}>{a.time}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "corretores" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%", minWidth: 900 }}>
                                {/* Header da Aba Corretores */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: theme.bgCard, padding: "16px 24px", borderRadius: 16, border: `1px solid ${theme.border}` }}>
                                    <div>
                                        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: theme.textPrimary }}>Gestão de Equipe (Corretores)</h2>
                                        <p style={{ margin: "4px 0 0 0", fontSize: 12, color: theme.textMuted }}>Monitore o desempenho, envie convites e edite integrações de corretores.</p>
                                    </div>
                                    <button
                                        onClick={() => setInviteModalOpen(true)}
                                        style={{ background: theme.accent, color: "white", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, transition: "opacity 0.2s" }}
                                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                                    >
                                        <i className="ri-user-add-fill"></i> + Adicionar Corretor
                                    </button>
                                </div>

                                <div style={{ display: "flex", gap: 24, flex: 1 }}>
                                    {/* Roleta */}
                                    <div style={{ flex: 1, background: theme.bgCard, borderRadius: 16, padding: 24, border: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", alignItems: "center", overflowY: "auto" }}>
                                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>🎡 Motor de Roleta — Distribuição Atual</div>
                                        <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 24 }}>Proporção de leads por peso configurado</div>
                                        <div style={{ position: "relative", width: 260, height: 260, flexShrink: 0 }}>
                                            <svg width={260} height={260} style={{ transform: `rotate(${rouletteAngle}deg)`, transition: "transform 1.5s cubic-bezier(0.17,0.67,0.35,1)" }}>
                                                {(() => {
                                                    const ativos = liveCorretores.filter(c => c.status === "ativo");
                                                    const total = ativos.reduce((s, c) => s + c.peso, 0);
                                                    let startAngle = -Math.PI / 2;
                                                    return ativos.map((c, i) => {
                                                        const angle = (c.peso / total) * 2 * Math.PI;
                                                        const x1 = 130 + 120 * Math.cos(startAngle);
                                                        const y1 = 130 + 120 * Math.sin(startAngle);
                                                        const x2 = 130 + 120 * Math.cos(startAngle + angle);
                                                        const y2 = 130 + 120 * Math.sin(startAngle + angle);
                                                        const largeArc = angle > Math.PI ? 1 : 0;
                                                        const midAngle = startAngle + angle / 2;
                                                        const tx = 130 + 80 * Math.cos(midAngle);
                                                        const ty = 130 + 80 * Math.sin(midAngle);
                                                        const d = `M 130 130 L ${x1} ${y1} A 120 120 0 ${largeArc} 1 ${x2} ${y2} Z`;
                                                        const result = (
                                                            <g key={i}>
                                                                <path d={d} fill={c.color} opacity={0.85} stroke={theme.bg} strokeWidth={2} />
                                                                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={11} fontWeight={700}>{c.peso}x</text>
                                                            </g>
                                                        );
                                                        startAngle += angle;
                                                        return result;
                                                    });
                                                })()}
                                                <circle cx={130} cy={130} r={40} fill={theme.bgSurface} stroke={theme.border} strokeWidth={2} />
                                                <text x={130} y={126} textAnchor="middle" fill={theme.textPrimary} fontSize={11} fontWeight={600}>Próximo</text>
                                                <text x={130} y={140} textAnchor="middle" fill={theme.accent} fontSize={10}>Ricardo</text>
                                            </svg>
                                            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 24, zIndex: 10 }}>▼</div>
                                        </div>
                                        <button onClick={spinRoulette} style={{ marginTop: 20, padding: "10px 24px", background: theme.accent, color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                                            🎯 Simular Distribuição
                                        </button>
                                        {newAlert && <div style={{ marginTop: 12, padding: "8px 16px", background: theme.success + "22", border: `1px solid ${theme.success}`, borderRadius: 8, fontSize: 12, color: theme.success }}>{alertMsg}</div>}

                                        {/* Legenda */}
                                        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                                            {liveCorretores.map(c => (
                                                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: theme.bgSurface, borderRadius: 8 }}>
                                                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: c.color }} />
                                                    <span style={{ flex: 1, fontSize: 13, color: c.status === "ativo" ? theme.textPrimary : theme.textMuted }}>{c.nome}</span>
                                                    <span style={{ fontSize: 12, color: theme.textMuted }}>Peso: {c.peso}</span>
                                                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: c.status === "ativo" ? theme.success + "22" : theme.warning + "22", color: c.status === "ativo" ? theme.success : theme.warning }}>
                                                        {c.status}
                                                    </span>
                                                    <button
                                                        onClick={() => handleGenerateTelegramQR(String(c.id), c.nome)}
                                                        style={{ padding: "4px 10px", background: "#0088cc", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        ✈️ Conectar
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Config */}
                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                                        <div style={{ background: theme.bgCard, borderRadius: 16, padding: 20, border: `1px solid ${theme.border}` }}>
                                            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>⚙️ Configurar Corretor: Ricardo Figueiredo</div>
                                            {[
                                                { label: "Peso na Roleta", value: "3", type: "stepper" },
                                                { label: "IQC Atual", value: "87 / 100", type: "display" },
                                                { label: "Tipos de Imóvel", value: "Aparto · Lançamentos · Casa", type: "chips" },
                                                { label: "Faixa de Valor", value: "R$ 200k – R$ 2M", type: "range" },
                                                { label: "Limite diário de leads", value: "8", type: "number" },
                                                { label: "Status", value: "Ativo", type: "status" },
                                            ].map((field, i) => (
                                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: i < 5 ? `1px solid ${theme.border}` : "none" }}>
                                                    <span style={{ fontSize: 12, color: theme.textMuted, width: 160, flexShrink: 0 }}>{field.label}</span>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary, flex: 1 }}>{field.value}</span>
                                                    <button style={{ padding: "4px 12px", background: theme.accent + "22", color: theme.accent, border: `1px solid ${theme.accent}44`, borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Editar</button>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ background: theme.bgCard, borderRadius: 16, padding: 20, border: `1px solid ${theme.border}` }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📊 Stats Rápidos — Ricardo</div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                                {[["Leads Recebidos", "48", theme.accent], ["Conversão", "22%", theme.success], ["Faturamento", "R$ 312k", theme.warning], ["Leads no Ciclo", "3/3", theme.teal]].map(([l, v, c], i) => (
                                                    <div key={i} style={{ padding: "12px 14px", background: theme.bgSurface, borderRadius: 10, borderLeft: `3px solid ${c}` }}>
                                                        <div style={{ fontSize: 11, color: theme.textMuted }}>{l}</div>
                                                        <div style={{ fontSize: 20, fontWeight: 700, color: c, fontFamily: "monospace", marginTop: 4 }}>{v}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "funil" && (
                            <div style={{ display: "flex", gap: 24, minWidth: 900 }}>
                                <div style={{ flex: 2, background: theme.bgCard, borderRadius: 16, padding: 24, border: `1px solid ${theme.border}` }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>🎯 Funil de Conversão</div>
                                    <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 24 }}>Mês atual — 247 leads de entrada</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {funnelData.map((stage, i) => {
                                            const pct = Math.round((stage.value / funnelData[0].value) * 100);
                                            const dropPct = i > 0 ? Math.round(((funnelData[i - 1].value - stage.value) / funnelData[i - 1].value) * 100) : 0;
                                            return (
                                                <div key={i}>
                                                    {i > 0 && (
                                                        <div style={{ textAlign: "center", fontSize: 11, color: dropPct > 40 ? theme.danger : theme.textMuted, marginBottom: 4 }}>
                                                            {dropPct > 40 ? "⚠️" : "↓"} -{dropPct}% de drop-off
                                                        </div>
                                                    )}
                                                    <div style={{ position: "relative", height: 48, display: "flex", alignItems: "center" }}>
                                                        <div style={{
                                                            position: "absolute", left: `${(100 - pct) / 2}%`, width: `${pct}%`,
                                                            height: "100%", background: stage.fill, borderRadius: 8, opacity: 0.9,
                                                            transition: "all 0.5s",
                                                        }} />
                                                        <div style={{ position: "relative", display: "flex", width: "100%", justifyContent: "space-between", padding: "0 16px", zIndex: 1 }}>
                                                            <span style={{ fontSize: 13, fontWeight: 600, color: "white", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>{stage.name}</span>
                                                            <span style={{ fontSize: 14, fontWeight: 700, color: "white", fontFamily: "monospace", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>{stage.value} ({pct}%)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                                    <div style={{ background: theme.bgCard, borderRadius: 16, padding: 20, border: `1px solid ${theme.border}` }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>💰 Valor no Funil</div>
                                        {[["Propostas Ativas", "R$ 2,4M", theme.accent], ["Em Negociação", "R$ 1,1M", theme.warning], ["Fechamentos Prováveis", "R$ 680k", theme.success]].map(([l, v, c], i) => (
                                            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 2 ? `1px solid ${theme.border}` : "none" }}>
                                                <span style={{ fontSize: 12, color: theme.textSecondary }}>{l}</span>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: c as string, fontFamily: "monospace" }}>{v}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ background: theme.bgCard, borderRadius: 16, padding: 20, border: `1px solid ${theme.border}` }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📊 Motivos de Perda</div>
                                        <ResponsiveContainer width="100%" height={160}>
                                            <BarChart data={[{ name: "Preço", value: 34 }, { name: "Crédito", value: 28 }, { name: "Timing", value: 19 }, { name: "Bairro", value: 13 }, { name: "Outros", value: 6 }]} layout="vertical">
                                                <XAxis type="number" tick={{ fill: theme.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <YAxis dataKey="name" type="category" tick={{ fill: theme.textSecondary, fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="value" fill={theme.danger} radius={[0, 4, 4, 0]} opacity={0.8} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "portais" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 900 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.02em" }}>Integração com Portais</div>
                                        <div style={{ fontSize: 13, color: theme.textMuted }}>Sincronização automática de imóveis (Feature #8)</div>
                                    </div>
                                    <button style={{ padding: "10px 16px", background: theme.accent, color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
                                        + Conectar Novo Portal
                                    </button>
                                </div>

                                <div style={{ display: "flex", gap: 16 }}>
                                    {[
                                        { nome: "OLX Imóveis", status: "Ativo", icon: "🟧", imóveis: 142, views: "12k", bg: theme.bgCard, border: theme.success },
                                        { nome: "ZAP Imóveis", status: "Ativo", icon: "🟦", imóveis: 142, views: "8k", bg: theme.bgCard, border: theme.success },
                                        { nome: "Viva Real", status: "Pausado", icon: "🟪", imóveis: 0, views: "-", bg: theme.bgSurface, border: theme.border },
                                        { nome: "ImovelWeb", status: "Não Configurado", icon: "🟩", imóveis: 0, views: "-", bg: theme.bgSurface, border: theme.border }
                                    ].map((p, idx) => (
                                        <div key={idx} style={{ flex: 1, background: p.bg, border: `1px solid ${p.border}`, borderRadius: 16, padding: 20 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                                <div style={{ fontSize: 32 }}>{p.icon}</div>
                                                <div style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: p.status === "Ativo" ? `${theme.success}22` : `${theme.textMuted}22`, color: p.status === "Ativo" ? theme.success : theme.textMuted }}>
                                                    {p.status}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary }}>{p.nome}</div>
                                            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                                                <div>
                                                    <div style={{ fontSize: 11, color: theme.textMuted }}>Imóveis</div>
                                                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.textSecondary }}>{p.imóveis}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 11, color: theme.textMuted }}>Visualizações</div>
                                                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.textSecondary }}>{p.views}</div>
                                                </div>
                                            </div>
                                            <button style={{ width: "100%", marginTop: 16, padding: "8px", background: "transparent", border: `1px solid ${theme.border}`, color: theme.textSecondary, borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                                                Configurar API
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ background: theme.bgCard, borderRadius: 16, padding: 24, border: `1px solid ${theme.border}` }}>
                                    <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 16, color: theme.textPrimary }}>Últimas Sincronizações</h3>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ borderBottom: `1px solid ${theme.border}`, textAlign: "left" }}>
                                                <th style={{ padding: "12px 0", fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>Imóvel</th>
                                                <th style={{ padding: "12px 0", fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>Portal</th>
                                                <th style={{ padding: "12px 0", fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>Status</th>
                                                <th style={{ padding: "12px 0", fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>Atualizado em</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                { imo: "Apto 3Q Jardins", p: "OLX", s: "Publicado", t: "Há 4 min", c: theme.success },
                                                { imo: "Casa 4Q Atalaia", p: "ZAP", s: "Erro de API", t: "Há 12 min", c: theme.danger },
                                                { imo: "Studio Centro", p: "OLX", s: "Removido", t: "Há 1h", c: theme.textMuted }
                                            ].map((r, i) => (
                                                <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                                                    <td style={{ padding: "12px 0", fontSize: 13, color: theme.textSecondary, fontWeight: 600 }}>{r.imo}</td>
                                                    <td style={{ padding: "12px 0", fontSize: 13, color: theme.textSecondary }}>{r.p}</td>
                                                    <td style={{ padding: "12px 0", fontSize: 12, color: r.c, fontWeight: 600 }}>• {r.s}</td>
                                                    <td style={{ padding: "12px 0", fontSize: 12, color: theme.textMuted }}>{r.t}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === "suporte" && (
                            <div style={{ display: "flex", gap: 24, minWidth: 900 }}>
                                <div style={{ flex: 1, background: theme.bgCard, borderRadius: 16, padding: 24, border: `1px solid ${theme.border}` }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.02em", marginBottom: 8 }}>Suporte IA (Self-Resolve)</div>
                                    <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 24 }}>Descreva seu problema. Nossa IA tentará resolver instantaneamente.</div>
                                    <form onSubmit={handleTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <input
                                            type="text" placeholder="Assunto (Ex: Erro ao cadastrar imóvel)" required value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)}
                                            style={{ width: "100%", padding: "14px", background: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textPrimary, borderRadius: 8 }}
                                        />
                                        <textarea
                                            placeholder="Detalhes (O que aconteceu, mensagens de erro, etc)" rows={5} required value={ticketDescription} onChange={(e) => setTicketDescription(e.target.value)}
                                            style={{ width: "100%", padding: "14px", background: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textPrimary, borderRadius: 8, resize: "none" }}
                                        />
                                        <button type="submit" disabled={ticketSending} style={{ padding: "14px", background: theme.accent, color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: ticketSending ? "not-allowed" : "pointer", opacity: ticketSending ? 0.7 : 1 }}>
                                            {ticketSending ? "Analisando..." : "Enviar para IA"}
                                        </button>
                                    </form>

                                    {ticketResponse && (
                                        <div style={{ marginTop: 24, background: theme.bgSurface, padding: 20, borderRadius: 12, border: `1px solid ${theme.success}55` }}>
                                            <div style={{ fontSize: 12, color: theme.success, fontWeight: 700, marginBottom: 8 }}>🧠 TICKET AVALIADO (Risco: {ticketResponse.priority})</div>
                                            <div style={{ fontSize: 14, color: theme.textSecondary, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{ticketResponse.selfResolveResponse}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "network" && (
                            <Franquias />
                        )}

                        {activeTab === "bi" && (
                            <div style={{ minWidth: 900 }}>
                                <ExecutiveBI />
                            </div>
                        )}

                        {activeTab === "imoveis" && (
                            <ImovelUpload onBack={() => setActiveTab("overview")} />
                        )}

                        {activeTab === "negocios" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 900 }}>
                                {/* Header */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: theme.bgCard, padding: "16px 24px", borderRadius: 16, border: `1px solid ${theme.border}` }}>
                                    <div>
                                        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: theme.textPrimary }}>💼 Painel de Negócios — Fechar Venda/Locação</h2>
                                        <p style={{ margin: "4px 0 0 0", fontSize: 12, color: theme.textMuted }}>Clique em "Fechar WON" para disparar automaticamente o link seguro de documentação ao cliente via WhatsApp.</p>
                                    </div>
                                </div>

                                {/* Leads em Andamento */}
                                <div style={{ background: theme.bgCard, borderRadius: 16, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: `1px solid ${theme.border}`, background: theme.bgSurface }}>
                                                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>CLIENTE</th>
                                                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>TIPO</th>
                                                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>IMÓVEL</th>
                                                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>VALOR</th>
                                                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>RISCO A.I.</th>
                                                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>STATUS</th>
                                                <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>AÇÃO</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mockLeads.map((lead) => {
                                                const statusColors: any = {
                                                    negociacao: { bg: theme.warning + '22', color: theme.warning, label: '🤝 Negociação' },
                                                    visita_realizada: { bg: theme.accent + '22', color: theme.accent, label: '🏠 Visita Realizada' },
                                                    proposta_enviada: { bg: theme.teal + '22', color: theme.teal, label: '📄 Proposta Enviada' },
                                                    contrato_gerado: { bg: theme.success + '22', color: theme.success, label: '✅ Contrato Gerado' },
                                                    won: { bg: '#ffd70022', color: '#ffd700', label: '🏆 FECHADA!' },
                                                };
                                                const s = statusColors[lead.status] || statusColors.negociacao;
                                                const isWon = lead.status === 'won';
                                                const isLoading = wonLoading && wonLeadId === lead.id;

                                                return (
                                                    <tr key={lead.id} style={{ borderBottom: `1px solid ${theme.border}`, transition: 'background 0.2s' }}>
                                                        <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: theme.textPrimary }}>{lead.nome}</td>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: lead.tipo === 'Locação' ? theme.purple + '22' : theme.accent + '22', color: lead.tipo === 'Locação' ? '#c084fc' : theme.accent, fontWeight: 600 }}>{lead.tipo}</span>
                                                        </td>
                                                        <td style={{ padding: '14px 20px', fontSize: 13, color: theme.textSecondary }}>{lead.imovel}</td>
                                                        <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: theme.textPrimary, fontFamily: 'monospace' }}>{lead.valor}</td>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            {lead.risk_score > 70 ? (
                                                                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: theme.danger + '22', color: theme.danger, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>🚨 Alto ({lead.risk_score})</span>
                                                            ) : lead.risk_score > 30 ? (
                                                                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: theme.warning + '22', color: theme.warning, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>⚠️ Médio ({lead.risk_score})</span>
                                                            ) : (
                                                                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: theme.success + '22', color: theme.success, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>✅ Baixo ({lead.risk_score})</span>
                                                            )}
                                                            <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 4 }}>Parado há {lead.dias_parado} dias</div>
                                                        </td>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: s.bg, color: s.color, fontWeight: 600 }}>{s.label}</span>
                                                        </td>
                                                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                                                {lead.risk_score > 60 && !isWon && (
                                                                    <button
                                                                        disabled={reactivateLoading && reactivateLeadId === lead.id}
                                                                        onClick={async () => {
                                                                            setReactivateLoading(true);
                                                                            setReactivateLeadId(lead.id);
                                                                            setReactivateFeedback(null);
                                                                            try {
                                                                                const res = await fetch(`/api/leads/${lead.id}/reactivate/generate`, { method: 'POST' });
                                                                                const data = await res.json();
                                                                                if (data.success) {
                                                                                    await fetch(`/api/leads/${lead.id}/reactivate/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: data.message }) });
                                                                                    setReactivateFeedback({ type: 'success', msg: `🤖 Mensagem de reativação com IA enviada para ${lead.nome}!` });
                                                                                    setMockLeads(prev => prev.map(l => l.id === lead.id ? { ...l, risk_score: 10, dias_parado: 0 } : l));
                                                                                } else {
                                                                                    setReactivateFeedback({ type: 'success', msg: `🤖 Simulado: IA gerou e enviou gatilho mental para ${lead.nome}!` });
                                                                                    setMockLeads(prev => prev.map(l => l.id === lead.id ? { ...l, risk_score: 10, dias_parado: 0 } : l));
                                                                                }
                                                                            } catch {
                                                                                setReactivateFeedback({ type: 'success', msg: `🤖 Simulado: IA gerou e enviou gatilho mental para ${lead.nome}!` });
                                                                                setMockLeads(prev => prev.map(l => l.id === lead.id ? { ...l, risk_score: 10, dias_parado: 0 } : l));
                                                                            } finally {
                                                                                setReactivateLoading(false);
                                                                                setReactivateLeadId('');
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            padding: '6px 12px', background: 'transparent',
                                                                            color: theme.accent, border: `1px solid ${theme.accent}`, borderRadius: 8, fontWeight: 700,
                                                                            cursor: (reactivateLoading && reactivateLeadId === lead.id) ? 'not-allowed' : 'pointer', fontSize: 11,
                                                                            opacity: (reactivateLoading && reactivateLeadId === lead.id) ? 0.6 : 1, transition: 'all 0.2s',
                                                                        }}
                                                                    >
                                                                        {(reactivateLoading && reactivateLeadId === lead.id) ? '⏳ IA...' : '🤖 Reativar IA'}
                                                                    </button>
                                                                )}
                                                                {isWon ? (
                                                                    <span style={{ fontSize: 12, color: '#ffd700', fontWeight: 700, display: 'flex', alignItems: 'center' }}>🏆 Link Enviado!</span>
                                                                ) : (
                                                                    <button
                                                                        id={`btn-won-${lead.id}`}
                                                                    disabled={isLoading}
                                                                    onClick={async () => {
                                                                        setWonLoading(true);
                                                                        setWonLeadId(lead.id);
                                                                        setWonFeedback(null);
                                                                        try {
                                                                            const res = await fetch(`/api/leads/${lead.id}/won`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
                                                                            const json = await res.json();
                                                                            if (json.success) {
                                                                                setMockLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'won' } : l));
                                                                                setWonFeedback({ type: 'success', msg: `✅ Link seguro enviado para ${lead.nome}! O cliente receberá as instruções para envio de documentação.` });
                                                                            } else {
                                                                                setWonFeedback({ type: 'error', msg: `⚠️ ${json.error || 'Erro ao processar fechamento.'}` });
                                                                            }
                                                                        } catch (err) {
                                                                            setWonFeedback({ type: 'success', msg: `✅ Simulado: Link seguro gerado para ${lead.nome}! (API offline)` });
                                                                            setMockLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'won' } : l));
                                                                        } finally {
                                                                            setWonLoading(false);
                                                                            setWonLeadId('');
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        padding: '8px 16px', background: 'linear-gradient(135deg, #10b981, #065f46)',
                                                                        color: 'white', border: 'none', borderRadius: 8, fontWeight: 700,
                                                                        cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: 12,
                                                                        opacity: isLoading ? 0.6 : 1, transition: 'all 0.2s',
                                                                        boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                                                                    }}
                                                                >
                                                                    {isLoading ? '⏳ Processando...' : '🏆 Fechar WON'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Feedback Reactivation */}
                                {reactivateFeedback && (
                                    <div style={{
                                        padding: '16px 20px', borderRadius: 12, border: `1px solid ${reactivateFeedback.type === 'success' ? theme.accent : theme.danger}55`,
                                        background: reactivateFeedback.type === 'success' ? theme.accent + '11' : theme.danger + '11',
                                        color: reactivateFeedback.type === 'success' ? theme.accent : theme.danger,
                                        fontSize: 14, fontWeight: 600, lineHeight: 1.5
                                    }}>
                                        {reactivateFeedback.msg}
                                        <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 6, fontWeight: 400 }}>
                                            A IA analisou o perfil do cliente e histórico de interações para criar uma mensagem persuasiva com gatilhos mentais (escassez/urgência) visando retomar o contato.
                                        </div>
                                    </div>
                                )}

                                {/* Feedback WON */}
                                {wonFeedback && (
                                    <div style={{
                                        padding: '16px 20px', borderRadius: 12, border: `1px solid ${wonFeedback.type === 'success' ? theme.success : theme.danger}55`,
                                        background: wonFeedback.type === 'success' ? theme.success + '11' : theme.danger + '11',
                                        color: wonFeedback.type === 'success' ? theme.success : theme.danger,
                                        fontSize: 14, fontWeight: 600, lineHeight: 1.5
                                    }}>
                                        {wonFeedback.msg}
                                        <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 6, fontWeight: 400 }}>
                                            O cliente receberá um link seguro para preencher dados pessoais, enviar RG, comprovante de renda e documentação do fiador. Após o envio, o contrato é gerado automaticamente via <strong>Assinafy</strong> e a cobrança ativada no <strong>Asaas</strong>.
                                        </div>
                                    </div>
                                )}

                                {/* Manual WON */}
                                <div style={{ background: theme.bgCard, borderRadius: 16, padding: 24, border: `1px solid ${theme.border}` }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>🔗 Disparar Manualmente por ID do Lead</div>
                                    <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 16 }}>Utilize o ID do Lead do seu CRM externo para acionar o fluxo de fechamento.</div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <input
                                            type="text" placeholder="ID do Lead (ex: lead_abc123 ou UUID)" value={wonLeadNome}
                                            onChange={e => setWonLeadNome(e.target.value)}
                                            style={{ flex: 1, padding: '10px 14px', background: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textPrimary, borderRadius: 8 }}
                                        />
                                        <button
                                            onClick={async () => {
                                                if (!wonLeadNome.trim()) return;
                                                setWonLoading(true);
                                                try {
                                                    await fetch(`/api/leads/${wonLeadNome.trim()}/won`, { method: 'POST' });
                                                    setWonFeedback({ type: 'success', msg: `✅ Automação de fechamento ativada para Lead ID: ${wonLeadNome}` });
                                                    setWonLeadNome('');
                                                } catch { setWonFeedback({ type: 'success', msg: `✅ Simulado: Fluxo WON ativado para ID ${wonLeadNome}` }); }
                                                setWonLoading(false);
                                            }}
                                            style={{ padding: '10px 20px', background: theme.accent, color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Disparar Fechamento
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(activeTab !== "overview" && activeTab !== "corretores" && activeTab !== "funil" && activeTab !== "portais" && activeTab !== "network" && activeTab !== "bi" && activeTab !== "suporte" && activeTab !== "negocios" && activeTab !== "imoveis") && (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16, opacity: 0.5 }}>
                                <span style={{ fontSize: 64 }}>{navItems.find(n => n.id === activeTab)?.icon}</span>
                                <div style={{ fontSize: 18, fontWeight: 600, color: theme.textSecondary }}>{navItems.find(n => n.id === activeTab)?.label}</div>
                                <div style={{ fontSize: 13, color: theme.textMuted }}>Esta tela está detalhada na especificação técnica do documento</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal de Convidar Corretor */}
                {inviteModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
                    }}>
                        <div style={{
                            background: theme.bgCard, borderRadius: 16, padding: 32, width: 450, maxWidth: '90%',
                            border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: 16,
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: theme.textPrimary }}>Convidar Novo Corretor</h3>
                                <button onClick={() => setInviteModalOpen(false)} style={{ background: 'transparent', border: 'none', color: theme.textMuted, fontSize: 20, cursor: 'pointer' }}>×</button>
                            </div>
                            <p style={{ fontSize: 13, color: theme.textSecondary, margin: "-8px 0 16px 0" }}>
                                Um e-mail será enviado com o link para o onboarding do corretor.
                            </p>
                            <form onSubmit={handleInviteCorretor} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: theme.textMuted }}>Nome Completo</label>
                                    <input
                                        type="text" required value={inviteNome} onChange={(e) => setInviteNome(e.target.value)}
                                        style={{ width: "100%", padding: "10px 14px", background: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textPrimary, borderRadius: 8, boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: theme.textMuted }}>E-mail do Corretor</label>
                                    <input
                                        type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                                        style={{ width: "100%", padding: "10px 14px", background: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textPrimary, borderRadius: 8, boxSizing: 'border-box' }}
                                    />
                                </div>
                                <button type="submit" disabled={inviting} style={{ padding: "12px", background: theme.accent, color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: inviting ? "not-allowed" : "pointer", marginTop: 8, opacity: inviting ? 0.7 : 1 }}>
                                    {inviting ? "Enviando Convite..." : "Enviar Convite"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal de Limite de Plano Atingido (UPGRADE) */}
                {upgradeModalOpen && planLimitDetails && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div style={{
                            background: 'linear-gradient(145deg, #1e293b, #0f172a)', borderRadius: 24, padding: 40, width: 480, maxWidth: '90%',
                            border: `1px solid ${theme.accent}55`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
                            boxShadow: `0 25px 50px -12px ${theme.accent}44`
                        }}>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${theme.warning}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                                🚀
                            </div>
                            <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: theme.textPrimary, textAlign: 'center' }}>
                                Limite do Plano Alcançado
                            </h2>
                            <p style={{ fontSize: 15, color: theme.textSecondary, textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
                                {planLimitDetails.error || "Você atingiu o limite de corretores do seu plano atual."}
                                Sua imobiliária está crescendo! Faça o upgrade para adicionar mais membros à sua equipe.
                            </p>

                            <div style={{ background: theme.bgSurface, padding: "16px 24px", borderRadius: 12, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${theme.border}` }}>
                                <div>
                                    <div style={{ fontSize: 12, color: theme.textMuted }}>Corretores Ativos</div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary }}>{planLimitDetails.current} <span style={{ color: theme.textMuted, fontSize: 14 }}>/ {planLimitDetails?.limit || 0}</span></div>
                                </div>
                                <div style={{ width: 2, height: 40, background: theme.border }}></div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 12, color: theme.textMuted }}>Plano Atual</div>
                                    <div style={{ fontSize: 16, fontWeight: 600, color: theme.warning, textTransform: "capitalize" }}>Starter</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 10 }}>
                                <button onClick={() => setUpgradeModalOpen(false)} style={{ flex: 1, background: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}`, padding: "12px", borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
                                    Talvez Depois
                                </button>
                                <button onClick={() => window.location.href = planLimitDetails.upgrade_url || '#'} style={{ flex: 2, background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', border: "none", padding: "12px", borderRadius: 10, cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' }}>
                                    Fazer Upgrade Agora ⚡
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Conexão Telegram */}
                {qrModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
                    }}>
                        <div style={{
                            background: theme.bgCard, borderRadius: 16, padding: 32, width: 400, maxWidth: '90%',
                            border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)'
                        }}>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: theme.textPrimary }}>Conectar Corretor</h3>
                                <button onClick={() => setQrModalOpen(false)} style={{ background: 'transparent', border: 'none', color: theme.textMuted, fontSize: 20, cursor: 'pointer' }}>×</button>
                            </div>
                            <p style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', margin: 0 }}>
                                Peça para <strong>{qrCorretorName}</strong> ler o QR Code abaixo usando o aplicativo do Telegram no celular.
                            </p>

                            {generatingQr ? (
                                <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bgSurface, borderRadius: 12 }}>
                                    <div style={{ fontSize: 13, color: theme.textMuted }}>Gerando...</div>
                                </div>
                            ) : (
                                <div style={{ width: 220, height: 220, background: 'white', padding: 12, borderRadius: 12, border: '4px solid #0088cc' }}>
                                    <img src={qrCodeUrl} alt="QR Code Telegram" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                            )}

                            {!generatingQr && qrTargetLink && (
                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ fontSize: 11, color: theme.textMuted, textAlign: 'center' }}>Ou envie o link abaixo diretamente:</div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            type="text" value={qrTargetLink} readOnly
                                            style={{ flex: 1, padding: "8px 12px", background: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textPrimary, borderRadius: 8, fontSize: 12 }}
                                        />
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(qrTargetLink); alert('Copiado!'); }}
                                            style={{ padding: "8px 12px", background: theme.accent, color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                                            Copiar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
