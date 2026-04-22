import { useState, useEffect } from 'react';

const theme = {
    bgCard: "#142952", bgElevated: "#1A3468",
    accent: "#3B82F6", success: "#10B981", warning: "#F59E0B", purple: "#7C3AED",
    textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
    border: "rgba(148,163,184,0.1)",
};

export default function Franquias() {
    const tenantId = localStorage.getItem('tenant_id') || 'rbhkwmesmvytqdfuwcie';
    const [loading, setLoading] = useState(true);
    const [franquias, setFranquias] = useState<any[]>([]);
    const [newBranchNome, setNewBranchNome] = useState('');
    const [newBranchSlug, setNewBranchSlug] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (!tenantId) return;
        fetchBranches();
    }, [tenantId]);

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/franquias/${tenantId}`);
            const json = await res.json();
            if (json.success) {
                setFranquias(json.data || []);
            }
        } catch (error) {
            console.error('Failed to load branches', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBranch = async (e: any) => {
        e.preventDefault();
        if (!newBranchNome || !newBranchSlug) return;
        setIsCreating(true);
        try {
            const res = await fetch(`/api/franquias/${tenantId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: newBranchNome, slug: newBranchSlug })
            });
            const json = await res.json();
            if (json.success) {
                setNewBranchNome('');
                setNewBranchSlug('');
                await fetchBranches();
            } else {
                alert(`Erro: ${json.error}`);
            }
        } catch (error) {
            console.error('Create branch failed', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleImpersonate = async (branchId: string) => {
        const secretKey = prompt("Informe a chave mestre para acessar esta filial:");
        if (!secretKey) return;

        try {
            const response = await fetch('/api/auth/master-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ masterKey: secretKey, targetTenantId: branchId }),
            });

            const data = await response.json();
            if (data.success && data.token) {
                alert("Acesso autorizado! Você está agora acessando a conta da filial.");
                // Inject the impersonation token and reload
                localStorage.setItem('sessionToken', data.token); // this will override the session briefly
                window.location.reload();
            } else {
                alert(data.error || 'Acesso negado.');
            }
        } catch (e: any) {
            alert('Erro ao processar login: ' + e.message);
        }
    };

    if (loading) return <div className="text-gray-400 p-8 text-center" style={{ minWidth: 900 }}>Carregando filiais...</div>;

    const vgvTotal = franquias.reduce((acc, f) => acc + (f.total_vendas || 0), 0) * 450000; // Mock average ticket R$450k

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 900 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.02em" }}>Gestão da Rede (Franquias)</div>
                    <div style={{ fontSize: 13, color: theme.textMuted }}>Visão consolidada de todas as suas unidades e filiais (Feature #12)</div>
                </div>
            </div>

            <div style={{ display: "flex", gap: 16 }}>
                {[
                    { l: "Total de Filiais Ativas", v: franquias.length, d: "agora", c: theme.accent },
                    { l: "Corretores na Rede (Simulado)", v: franquias.length * 5, d: "estimativa", c: theme.success },
                    { l: "Leads Consolidado (Mês)", v: franquias.reduce((acc, f) => acc + (f.total_vendas || 0), 0) * 12, d: "aprox.", c: theme.warning },
                    { l: "VGV Consolidado (Matriz + Filiais)", v: `R$ ${(vgvTotal / 1000000).toFixed(1)}M`, d: "simulado", c: theme.purple }
                ].map((k, i) => (
                    <div key={i} style={{ flex: 1, background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20 }}>
                        <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8 }}>{k.l}</div>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: theme.textPrimary }}>{k.v}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: theme.success, paddingBottom: 6 }}>{k.d}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", gap: 24 }}>
                <div style={{ flex: 2, background: theme.bgCard, borderRadius: 16, padding: 24, border: `1px solid ${theme.border}` }}>
                    <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 20, color: theme.textPrimary }}>Suas Filiais e Franquias</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {franquias.length === 0 ? (
                            <div style={{ color: theme.textMuted, fontSize: 14 }}>Você ainda não possui filiais registradas.</div>
                        ) : (
                            franquias.map((f, i) => {
                                const leads = f.total_vendas || Math.floor(Math.random() * 50);
                                const max = Math.max(100, leads * 2);
                                return (
                                    <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: theme.bgElevated, padding: "12px 16px", borderRadius: 8 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                                <span style={{ fontSize: 14, color: theme.textSecondary, fontWeight: 600 }}>{i + 1}. {f.nome}</span>
                                                <span style={{ fontSize: 13, color: theme.textPrimary, fontWeight: 700 }}>{leads} leads convertidos</span>
                                            </div>
                                            <div style={{ height: 6, background: theme.bgCard, borderRadius: 3 }}>
                                                <div style={{ height: "100%", width: `${(leads / max) * 100}%`, background: theme.accent, borderRadius: 3 }} />
                                            </div>
                                        </div>
                                        <div style={{ marginLeft: 24 }}>
                                            <button 
                                                onClick={() => handleImpersonate(f.id)}
                                                style={{ padding: "6px 12px", background: "transparent", color: theme.accent, border: `1px solid ${theme.accent}`, borderRadius: 6, fontWeight: 600, cursor: "pointer", fontSize: 12 }}
                                            >
                                                Acessar Filial ↗
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div style={{ flex: 1, background: theme.bgCard, borderRadius: 16, padding: 24, border: `1px solid ${theme.border}` }}>
                    <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 20, color: theme.textPrimary }}>Cadastrar Nova Filial</h3>
                    <form onSubmit={handleCreateBranch} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4, display: "block" }}>Nome da Franquia</label>
                            <input 
                                required type="text" placeholder="Ex: Crânios IMOB Alphaville" 
                                value={newBranchNome} onChange={e => setNewBranchNome(e.target.value)}
                                style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bgElevated, color: theme.textPrimary }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4, display: "block" }}>Slug Institucional</label>
                            <input 
                                required type="text" placeholder="Ex: alpha-imob" 
                                value={newBranchSlug} onChange={e => setNewBranchSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bgElevated, color: theme.textPrimary }}
                            />
                        </div>
                        <button disabled={isCreating} type="submit" style={{ padding: "12px", background: theme.accent, color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>
                            {isCreating ? "Registrando..." : "+ Criar Unidade"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
