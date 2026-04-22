// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from 'react';

const T = {
    bg: '#060A14', surface: '#0C1220', card: '#111827',
    border: 'rgba(255,255,255,0.07)', borderBright: 'rgba(59,130,246,0.4)',
    accent: '#3B82F6', accentGlow: 'rgba(59,130,246,0.12)',
    gold: '#F59E0B', goldGlow: 'rgba(245,158,11,0.12)',
    green: '#10B981', greenGlow: 'rgba(16,185,129,0.12)',
    teal: '#06B6D4', purple: '#8B5CF6', danger: '#EF4444',
    textPrimary: '#F9FAFB', textSecondary: '#9CA3AF', textMuted: '#4B5563',
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
.iu-input { background: ${T.surface}; border: 1px solid ${T.border}; color: ${T.textPrimary}; border-radius: 8px; padding: 10px 14px; font-size: 13px; font-family: 'Inter', sans-serif; width: 100%; transition: border-color 0.2s, box-shadow 0.2s; outline: none; }
.iu-input:focus { border-color: ${T.accent}; box-shadow: 0 0 0 3px ${T.accentGlow}; }
.iu-select { background: ${T.surface}; border: 1px solid ${T.border}; color: ${T.textPrimary}; border-radius: 8px; padding: 10px 14px; font-size: 13px; font-family: 'Inter', sans-serif; width: 100%; outline: none; cursor: pointer; }
.iu-select option { background: ${T.card}; }
.iu-textarea { background: ${T.surface}; border: 1px solid ${T.border}; color: ${T.textPrimary}; border-radius: 8px; padding: 10px 14px; font-size: 13px; font-family: 'Inter', sans-serif; width: 100%; resize: vertical; min-height: 80px; outline: none; }
.iu-textarea:focus { border-color: ${T.accent}; box-shadow: 0 0 0 3px ${T.accentGlow}; }
.iu-label { font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${T.textSecondary}; display: block; margin-bottom: 6px; }
@keyframes iu-spin { to { transform: rotate(360deg); } }
@keyframes iu-fade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
@keyframes iu-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
.iu-spin { animation: iu-spin 1s linear infinite; }
.iu-fade { animation: iu-fade 0.3s ease; }
.iu-pulse { animation: iu-pulse 1.5s ease infinite; }
`;

const TIPOS_IMOVEL = [
    'Apartamento', 'Casa', 'Cobertura', 'Studio', 'Loft', 'Flat',
    'Sala Comercial', 'Loja', 'Galpão', 'Terreno', 'Chácara', 'Fazenda',
];

const ESTADOS = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
    'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const CARACTERISTICAS_OPCOES = [
    'piscina', 'academia', 'salao_festas', 'playground', 'portaria_24h',
    'elevador', 'garagem', 'churrasqueira', 'varanda', 'jardim',
    'vista_mar', 'vista_panoramica', 'pet_friendly', 'mobiliado',
    'ar_condicionado', 'aquecimento', 'segurança_24h', 'concierge',
    'coworking', 'rooftop',
];

const Row = ({ children, gap = 12 }: any) => (
    <div style={{ display: 'flex', gap, flexWrap: 'wrap' }}>{children}</div>
);
const Field = ({ label, children, flex = 1, minWidth = 140 }: any) => (
    <div style={{ flex, minWidth }}>
        <label className="iu-label">{label}</label>
        {children}
    </div>
);
const Section = ({ title, icon, color = T.accent, children }: any) => (
    <div style={{ background: T.card, borderRadius: 14, padding: 20, border: `1px solid ${T.border}`, animation: 'iu-fade 0.3s ease' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color, marginBottom: 16 }}>
            {icon} {title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
);

export default function ImovelUpload({ onBack }: { onBack?: () => void }) {
    const [finalidade, setFinalidade] = useState<string>('');
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [dragOverPhotos, setDragOverPhotos] = useState(false);
    const [fotos, setFotos] = useState<File[]>([]);
    const [fotoPreviews, setFotoPreviews] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [steps, setSteps] = useState<string[]>([]);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fotosInputRef = useRef<HTMLInputElement>(null);
    const [caracteristicasSel, setCaracteristicasSel] = useState<string[]>([]);

    // Liberar URLs de objeto ao desmontar
    useEffect(() => () => fotoPreviews.forEach(URL.revokeObjectURL), [fotoPreviews]);

    const [form, setForm] = useState({
        titulo: '', tipo: 'Apartamento',
        endereco: '', bairro: '', cidade: '', estado: 'SP', cep: '',
        descricao: '',
        preco: '', quartos: '', banheiros: '', area: '',
        destaque: false,
    });

    const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

    // ── PDF drag & drop ──────────────────────────────────────────
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file?.type === 'application/pdf') setPdfFile(file);
        else setError('Apenas arquivos PDF são aceitos.');
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file?.type === 'application/pdf') { setPdfFile(file); setError(''); }
        else setError('Apenas arquivos PDF são aceitos.');
    };

    // ── Fotos: drag & drop e input ────────────────────────────────
    const addFotos = useCallback((files: File[]) => {
        const validas = files.filter(f => f.type.startsWith('image/'));
        if (!validas.length) return;
        setFotos(prev => [...prev, ...validas].slice(0, 20));
        setFotoPreviews(prev => [...prev, ...validas.map(f => URL.createObjectURL(f))].slice(0, 20));
    }, []);

    const handleFotosDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOverPhotos(false);
        addFotos(Array.from(e.dataTransfer.files));
    }, [addFotos]);

    const handleFotosInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFotos(Array.from(e.target.files));
        e.target.value = '';
    };

    const removeFoto = (idx: number) => {
        URL.revokeObjectURL(fotoPreviews[idx]);
        setFotos(p => p.filter((_, i) => i !== idx));
        setFotoPreviews(p => p.filter((_, i) => i !== idx));
    };

    const moverFoto = (idx: number, dir: -1 | 1) => {
        const ni = idx + dir;
        if (ni < 0 || ni >= fotos.length) return;
        setFotos(p => { const a = [...p]; [a[idx], a[ni]] = [a[ni], a[idx]]; return a; });
        setFotoPreviews(p => { const a = [...p]; [a[idx], a[ni]] = [a[ni], a[idx]]; return a; });
    };

    // ── Toggle característica ─────────────────────────────────────
    const toggleCar = (c: string) => setCaracteristicasSel(prev =>
        prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );

    // ── Submit ────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!form.titulo.trim()) { setError('Título é obrigatório.'); return; }
        if (!finalidade) { setError('Selecione a finalidade do imóvel.'); return; }
        if (finalidade === 'lancamento' && !pdfFile) { setError('Lançamentos exigem um PDF de apresentação.'); return; }

        setSubmitting(true);
        setSteps([]);
        setError('');
        setResult(null);

        try {
            const fd = new FormData();
            if (pdfFile) fd.append('pdf', pdfFile);

            // Append metadata as individual fields (backend supports both modes)
            fd.append('titulo', form.titulo);
            fd.append('tipo', form.tipo);
            fd.append('finalidade', finalidade);
            fd.append('endereco', form.endereco);
            fd.append('bairro', form.bairro);
            fd.append('cidade', form.cidade);
            fd.append('estado', form.estado);
            fd.append('cep', form.cep);
            fd.append('descricao', form.descricao);
            if (form.preco) fd.append('preco', form.preco);
            if (form.quartos) fd.append('quartos', form.quartos);
            if (form.banheiros) fd.append('banheiros', form.banheiros);
            if (form.area) fd.append('area', form.area);
            fd.append('destaque', String(form.destaque));
            if (caracteristicasSel.length) fd.append('caracteristicas', caracteristicasSel.join(','));
            fotos.forEach(f => fd.append('fotos', f));

            const clienteId = localStorage.getItem('tenantId');
            if (clienteId) fd.append('cliente_id', clienteId);

            const sessionToken = localStorage.getItem('sessionToken');
            const headers: any = {};
            if (sessionToken) headers['x-session-token'] = sessionToken;

            const apiBase = (import.meta as any).env?.VITE_API_URL || '/api';
            const res = await fetch(`${apiBase}/imoveis/ingest`, {
                method: 'POST',
                headers,
                body: fd,
            });

            const data = await res.json();
            setSteps(data.steps || []);
            if (data.success) {
                setResult(data.imovel);
            } else {
                setError(data.error || 'Erro ao processar imóvel.');
            }
        } catch (e: any) {
            setError(e.message || 'Erro de rede');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setFinalidade(''); setPdfFile(null); setSteps([]); setResult(null); setError('');
        setCaracteristicasSel([]);
        fotoPreviews.forEach(URL.revokeObjectURL);
        setFotos([]); setFotoPreviews([]);
        setForm({ titulo: '', tipo: 'Apartamento', endereco: '', bairro: '', cidade: '', estado: 'SP', cep: '', descricao: '', preco: '', quartos: '', banheiros: '', area: '', destaque: false });
    };

    const tipoLabel = { lancamento: 'Lançamento', venda: 'Venda', locacao: 'Locação' }[finalidade] || '';

    // ── SUCCESS STATE ─────────────────────────────────────────────
    if (result) {
        return (
            <div style={{ fontFamily: "'Inter', sans-serif", background: T.bg, minHeight: '100vh', padding: '32px 24px', color: T.textPrimary }}>
                <style>{css}</style>
                <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', animation: 'iu-fade 0.4s ease' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: T.green + '22', border: `2px solid ${T.green}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>
                        ✅
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: T.textPrimary, marginBottom: 8 }}>Imóvel Cadastrado!</h1>
                    <p style={{ color: T.textSecondary, fontSize: 14, marginBottom: 24 }}>
                        <strong style={{ color: T.textPrimary }}>{result.titulo}</strong> foi salvo com sucesso.
                    </p>

                    {/* Steps */}
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, textAlign: 'left', marginBottom: 24 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 12 }}>Pipeline de Processamento</div>
                        {steps.map((s, i) => (
                            <div key={i} style={{ fontSize: 13, color: s.startsWith('✅') ? T.green : s.startsWith('⚠️') ? T.gold : T.danger, padding: '4px 0', borderBottom: i < steps.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                                {s}
                            </div>
                        ))}
                    </div>

                    {/* Quick info */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                        {[
                            { l: 'ID', v: result.id?.substring(0, 8) + '…' },
                            { l: 'Tipo', v: result.tipo },
                            { l: 'Finalidade', v: result.finalidade },
                            { l: 'Cidade', v: result.cidade || '—' },
                            { l: 'Fotos', v: (result.fotos?.length || 0) + ' foto(s)' },
                        ].map(({ l, v }) => (
                            <div key={l} style={{ flex: 1, minWidth: 100, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: T.textMuted, marginBottom: 4 }}>{l}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{v}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <button onClick={handleReset} style={{ padding: '10px 24px', background: T.accent, color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                            + Cadastrar Outro
                        </button>
                        {onBack && (
                            <button onClick={onBack} style={{ padding: '10px 24px', background: T.surface, color: T.textSecondary, border: `1px solid ${T.border}`, borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                                Voltar ao Dashboard
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── MAIN FORM ─────────────────────────────────────────────────
    return (
        <div style={{ fontFamily: "'Inter', sans-serif", background: T.bg, minHeight: '100vh', color: T.textPrimary }}>
            <style>{css}</style>

            {/* Header */}
            <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 10 }}>
                {onBack && (
                    <button onClick={onBack} style={{ background: 'none', border: 'none', color: T.textSecondary, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 4px' }}>←</button>
                )}
                <div>
                    <h1 style={{ fontSize: 17, fontWeight: 700, color: T.textPrimary, margin: 0 }}>Cadastrar Imóvel</h1>
                    <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>Lançamentos · Locação · Venda</p>
                </div>
                <div style={{ flex: 1 }} />
                {finalidade && (
                    <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: T.accent + '22', color: T.accent, border: `1px solid ${T.accent}44` }}>
                        {tipoLabel}
                    </span>
                )}
            </div>

            <div style={{ maxWidth: 820, margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* STEP 1 — Finalidade */}
                <Section title="Tipo de Imóvel" icon="🏷️" color={T.teal}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {[
                            { v: 'lancamento', icon: '🏗️', label: 'Lançamento', desc: 'Empreendimento novo — PDF obrigatório', color: T.purple },
                            { v: 'venda', icon: '🏠', label: 'Venda', desc: 'Imóvel para venda direta', color: T.accent },
                            { v: 'locacao', icon: '🔑', label: 'Locação', desc: 'Imóvel para aluguel', color: T.green },
                        ].map(opt => (
                            <button key={opt.v} onClick={() => { setFinalidade(opt.v); setError(''); }}
                                style={{
                                    flex: 1, minWidth: 180, padding: '16px 18px', borderRadius: 12, cursor: 'pointer',
                                    background: finalidade === opt.v ? opt.color + '22' : T.surface,
                                    border: `2px solid ${finalidade === opt.v ? opt.color : T.border}`,
                                    textAlign: 'left', transition: 'all 0.2s',
                                }}>
                                <div style={{ fontSize: 22, marginBottom: 6 }}>{opt.icon}</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: finalidade === opt.v ? opt.color : T.textPrimary, marginBottom: 4 }}>{opt.label}</div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>{opt.desc}</div>
                            </button>
                        ))}
                    </div>
                </Section>

                {/* STEP 2 — PDF Upload (lançamento ou opcional) */}
                {finalidade && (
                    <Section title={finalidade === 'lancamento' ? 'PDF do Empreendimento' : 'PDF / Book (opcional)'} icon="📄" color={finalidade === 'lancamento' ? T.purple : T.textMuted}>
                        <div
                            onDrop={handleDrop}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: `2px dashed ${pdfFile ? T.green : dragOver ? T.accent : T.border}`,
                                borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
                                background: pdfFile ? T.green + '08' : dragOver ? T.accentGlow : T.surface,
                                transition: 'all 0.2s',
                            }}>
                            <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleFileChange} />
                            {pdfFile ? (
                                <div>
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: T.green, marginBottom: 4 }}>{pdfFile.name}</div>
                                    <div style={{ fontSize: 12, color: T.textMuted }}>{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</div>
                                    <button onClick={e => { e.stopPropagation(); setPdfFile(null); }}
                                        style={{ marginTop: 10, padding: '4px 12px', background: T.danger + '22', color: T.danger, border: `1px solid ${T.danger}44`, borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>
                                        Remover
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: T.textSecondary, marginBottom: 4 }}>
                                        {dragOver ? 'Solte o PDF aqui' : 'Arraste o PDF ou clique para selecionar'}
                                    </div>
                                    <div style={{ fontSize: 12, color: T.textMuted }}>
                                        {finalidade === 'lancamento' ? 'Obrigatório — será indexado na IA (RAG)' : 'Opcional — até 50 MB'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Section>
                )}

                {/* STEP 3 — Fotos */}
                {finalidade && (
                    <Section title="Fotos do Imóvel" icon="📷" color={T.gold}>
                        {/* Drop zone */}
                        <div
                            onDrop={handleFotosDrop}
                            onDragOver={e => { e.preventDefault(); setDragOverPhotos(true); }}
                            onDragLeave={() => setDragOverPhotos(false)}
                            onClick={() => fotosInputRef.current?.click()}
                            style={{
                                border: `2px dashed ${fotos.length > 0 ? T.gold : dragOverPhotos ? T.accent : T.border}`,
                                borderRadius: 12, padding: '20px', textAlign: 'center', cursor: 'pointer',
                                background: fotos.length > 0 ? T.gold + '08' : dragOverPhotos ? T.accentGlow : T.surface,
                                transition: 'all 0.2s',
                            }}>
                            <input ref={fotosInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFotosInput} />
                            <div style={{ fontSize: 28, marginBottom: 6 }}>🖼️</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary, marginBottom: 4 }}>
                                {dragOverPhotos ? 'Solte as fotos aqui' : 'Arraste fotos ou clique para selecionar'}
                            </div>
                            <div style={{ fontSize: 11, color: T.textMuted }}>
                                JPG, PNG, WEBP — até 20 fotos — a 1ª será a capa do Book PDF
                            </div>
                        </div>

                        {/* Grade de previews */}
                        {fotoPreviews.length > 0 && (
                            <div>
                                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>
                                    {fotoPreviews.length} foto(s) — arraste para reordenar · 1ª foto = capa
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                                    {fotoPreviews.map((src, idx) => (
                                        <div key={idx} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: `2px solid ${idx === 0 ? T.gold : T.border}`, aspectRatio: '4/3', background: T.surface }}>
                                            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                            {idx === 0 && (
                                                <div style={{ position: 'absolute', top: 5, left: 5, background: T.gold, color: '#000', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 6, letterSpacing: '0.05em' }}>
                                                    CAPA
                                                </div>
                                            )}
                                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px' }}>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <button onClick={e => { e.stopPropagation(); moverFoto(idx, -1); }} disabled={idx === 0}
                                                        style={{ background: 'none', border: 'none', color: 'white', cursor: idx === 0 ? 'default' : 'pointer', fontSize: 12, opacity: idx === 0 ? 0.3 : 1, padding: '0 2px' }}>←</button>
                                                    <button onClick={e => { e.stopPropagation(); moverFoto(idx, 1); }} disabled={idx === fotos.length - 1}
                                                        style={{ background: 'none', border: 'none', color: 'white', cursor: idx === fotos.length - 1 ? 'default' : 'pointer', fontSize: 12, opacity: idx === fotos.length - 1 ? 0.3 : 1, padding: '0 2px' }}>→</button>
                                                </div>
                                                <button onClick={e => { e.stopPropagation(); removeFoto(idx); }}
                                                    style={{ background: 'none', border: 'none', color: T.danger, cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px' }}>✕</button>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Botão adicionar mais */}
                                    {fotoPreviews.length < 20 && (
                                        <div onClick={() => fotosInputRef.current?.click()}
                                            style={{ borderRadius: 10, border: `2px dashed ${T.border}`, aspectRatio: '4/3', background: T.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.textMuted, fontSize: 12 }}>
                                            <div style={{ fontSize: 22, marginBottom: 4 }}>+</div>
                                            Adicionar
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Info sobre o Book PDF */}
                        <div style={{ background: T.gold + '0F', border: `1px solid ${T.gold}33`, borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 18 }}>✨</span>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: T.gold, marginBottom: 3 }}>Book PDF automático</div>
                                <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>
                                    Ao cadastrar, o sistema gera automaticamente um Book/Portfólio em PDF com as fotos, características e a identidade visual da sua imobiliária (logomarca + cores). Pronto para enviar por WhatsApp ou publicar nos portais.
                                </div>
                            </div>
                        </div>
                    </Section>
                )}

                {/* STEP 4 — Dados básicos */}
                {finalidade && (
                    <Section title="Dados do Imóvel" icon="🏠" color={T.accent}>
                        <Row gap={12}>
                            <Field label="Título *" flex={3} minWidth={220}>
                                <input className="iu-input" value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ex: Residencial Jardins — Apto 3 Quartos" />
                            </Field>
                            <Field label="Tipo" flex={2} minWidth={160}>
                                <select className="iu-select" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                                    {TIPOS_IMOVEL.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </Field>
                        </Row>
                        <Row gap={12}>
                            <Field label="Endereço" flex={4} minWidth={220}>
                                <input className="iu-input" value={form.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, complemento" />
                            </Field>
                            <Field label="CEP" flex={1} minWidth={110}>
                                <input className="iu-input" value={form.cep} onChange={e => set('cep', e.target.value)} placeholder="00000-000" maxLength={9} />
                            </Field>
                        </Row>
                        <Row gap={12}>
                            <Field label="Bairro" flex={2} minWidth={150}>
                                <input className="iu-input" value={form.bairro} onChange={e => set('bairro', e.target.value)} placeholder="Nome do bairro" />
                            </Field>
                            <Field label="Cidade" flex={2} minWidth={150}>
                                <input className="iu-input" value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="Cidade" />
                            </Field>
                            <Field label="Estado" flex={1} minWidth={100}>
                                <select className="iu-select" value={form.estado} onChange={e => set('estado', e.target.value)}>
                                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                            </Field>
                        </Row>
                        <Row gap={12}>
                            <Field label="Descrição" flex={1} minWidth={300}>
                                <textarea className="iu-textarea" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Descrição do imóvel para o portal e IA..." rows={3} />
                            </Field>
                        </Row>
                    </Section>
                )}

                {/* STEP 5 — Financeiro */}
                {finalidade && (
                    <Section title="Valores & Métricas" icon="💰" color={T.gold}>
                        <Row gap={12}>
                            <Field label={finalidade === 'locacao' ? 'Valor do Aluguel (R$)' : 'Preço (R$)'} flex={2} minWidth={160}>
                                <input className="iu-input" type="number" value={form.preco} onChange={e => set('preco', e.target.value)} placeholder="0,00" min="0" step="1000" />
                            </Field>
                            <Field label="Quartos" flex={1} minWidth={90}>
                                <input className="iu-input" type="number" value={form.quartos} onChange={e => set('quartos', e.target.value)} placeholder="0" min="0" max="20" />
                            </Field>
                            <Field label="Banheiros" flex={1} minWidth={90}>
                                <input className="iu-input" type="number" value={form.banheiros} onChange={e => set('banheiros', e.target.value)} placeholder="0" min="0" max="20" />
                            </Field>
                            <Field label="Área (m²)" flex={1} minWidth={90}>
                                <input className="iu-input" type="number" value={form.area} onChange={e => set('area', e.target.value)} placeholder="0" min="0" />
                            </Field>
                        </Row>
                        <Row gap={12}>
                            <Field label="Imóvel em Destaque" flex={1} minWidth={200}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                                    <button onClick={() => set('destaque', !form.destaque)} style={{
                                        width: 40, height: 22, borderRadius: 11, background: form.destaque ? T.gold : T.textMuted,
                                        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                                    }}>
                                        <div style={{ position: 'absolute', top: 3, left: form.destaque ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                                    </button>
                                    <span style={{ fontSize: 12, color: T.textSecondary }}>{form.destaque ? 'Sim — aparece em destaque no site' : 'Não'}</span>
                                </div>
                            </Field>
                        </Row>
                    </Section>
                )}

                {/* STEP 6 — Características */}
                {finalidade && (
                    <Section title="Características & Comodidades" icon="✨" color={T.teal}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {CARACTERISTICAS_OPCOES.map(c => {
                                const sel = caracteristicasSel.includes(c);
                                return (
                                    <button key={c} onClick={() => toggleCar(c)} style={{
                                        padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                        background: sel ? T.teal + '22' : T.surface,
                                        color: sel ? T.teal : T.textSecondary,
                                        border: `1px solid ${sel ? T.teal + '66' : T.border}`,
                                        transition: 'all 0.15s',
                                    }}>
                                        {c.replace(/_/g, ' ')}
                                    </button>
                                );
                            })}
                        </div>
                        {caracteristicasSel.length > 0 && (
                            <div style={{ fontSize: 12, color: T.textMuted }}>
                                {caracteristicasSel.length} característica(s) selecionada(s)
                            </div>
                        )}
                    </Section>
                )}

                {/* Error */}
                {error && (
                    <div style={{ background: T.danger + '15', border: `1px solid ${T.danger}44`, borderRadius: 10, padding: '12px 16px', fontSize: 13, color: T.danger }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Progress steps (during/after submit) */}
                {steps.length > 0 && (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 12 }}>
                            Pipeline de Processamento
                        </div>
                        {steps.map((s, i) => (
                            <div key={i} style={{
                                fontSize: 13, padding: '5px 0',
                                borderBottom: i < steps.length - 1 ? `1px solid ${T.border}` : 'none',
                                color: s.startsWith('✅') ? T.green : s.startsWith('⚠️') ? T.gold : T.danger,
                            }}>
                                {s}
                            </div>
                        ))}
                    </div>
                )}

                {/* Submit */}
                {finalidade && (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !form.titulo.trim()}
                            style={{
                                flex: 1, padding: '14px 28px', borderRadius: 10, border: 'none', cursor: submitting ? 'wait' : 'pointer',
                                background: submitting ? T.textMuted : T.accent, color: 'white', fontWeight: 700, fontSize: 14,
                                fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                opacity: (!form.titulo.trim() && !submitting) ? 0.5 : 1,
                            }}>
                            {submitting ? (
                                <>
                                    <div className="iu-spin" style={{ width: 18, height: 18, border: `2px solid rgba(255,255,255,0.3)`, borderTopColor: 'white', borderRadius: '50%' }} />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    {finalidade === 'lancamento' ? '🚀 Cadastrar e Indexar na IA' : '💾 Cadastrar Imóvel'}
                                </>
                            )}
                        </button>
                        {onBack && (
                            <button onClick={onBack} style={{ padding: '14px 20px', borderRadius: 10, background: T.surface, color: T.textSecondary, border: `1px solid ${T.border}`, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                                Cancelar
                            </button>
                        )}
                    </div>
                )}

                <div style={{ height: 32 }} />
            </div>
        </div>
    );
}
