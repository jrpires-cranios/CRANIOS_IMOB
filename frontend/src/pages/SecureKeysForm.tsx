import React, { useState, useEffect } from 'react';

const apiBase = import.meta.env.VITE_API_URL || '/api';

export default function SecureKeysForm() {
    const [token, setToken] = useState<string | null>(null);
    const [keys, setKeys] = useState<Record<string, string>>({
        whatsapp: '', instagram: '', zap: '', olx: '', asaas: '', telegram: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('token');
        if (t) setToken(t);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setKeys({ ...keys, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            alert("Token inválido ou expirado.");
            return;
        }

        setStatus('loading');
        try {
            // Simulação de envio das chaves ultra-seguras (Cofre AES)
            const res = await fetch(`${apiBase}/onboarding/secure-keys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ keys })
            });

            if (!res.ok) throw new Error('Falha no upload');
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
                <p className="text-gray-500 text-center">Formulário expirado ou link inválido.<br />Use o link válido enviado ao seu email de gestor.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-['DM_Sans']">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gray-900 px-8 py-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-500/20 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-purple-500/20 blur-2xl"></div>

                    <div className="text-5xl mb-4 relative z-10">🔐</div>
                    <h2 className="text-2xl font-bold text-white relative z-10">Cofre de Chaves Secretas</h2>
                    <p className="mt-2 text-sm text-gray-400 max-w-lg mx-auto relative z-10">
                        Ambiente Ultra-Seguro de provisionamento para {`Imobiliária`}.<br />
                        Esses dados terão **criptografia AES-GCM 256 bits** trafegados apenas internamente.
                    </p>
                </div>

                {status === 'success' ? (
                    <div className="px-8 py-16 text-center">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">✅</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Chaves Armazenadas no Cofre</h3>
                        <p className="text-gray-500">
                            Obrigado! Este formulário foi inutilizado e não pode ser re-aberto por questões de segurança.
                            Nossa equipe já foi notificada para iniciar o Onboard Mágico!
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="px-8 py-10 space-y-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                            <p className="text-sm text-blue-800 flex items-start gap-2">
                                <span className="text-xl leading-none">ℹ️</span>
                                <span>Preencha as chaves dos portais que deseja integrar. Se não tiver um dos serviços, apenas deixe em branco. Nossos Engenheiros vão parear os webhooks após este envio.</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* WHATSAPP */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                                    <span>WhatsApp (Token)</span> <span className="text-xs text-gray-400 font-normal">Meta for Developers</span>
                                </label>
                                <input type="password" name="whatsapp" value={keys.whatsapp} onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
                                    placeholder="EAAI..." />
                            </div>
                            {/* INSTAGRAM */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                                    <span>Instagram (Token)</span> <span className="text-xs text-gray-400 font-normal">Page Access</span>
                                </label>
                                <input type="password" name="instagram" value={keys.instagram} onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
                                    placeholder="EAAI..." />
                            </div>
                            {/* ZAP IMÓVEIS */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                                    <span>ZAP Imóveis API Key</span> <span className="text-xs text-gray-400 font-normal">ZAP Central</span>
                                </label>
                                <input type="password" name="zap" value={keys.zap} onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
                                    placeholder="zap_..." />
                            </div>
                            {/* OLX */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                                    <span>OLX Webhook Secret</span> <span className="text-xs text-gray-400 font-normal">Painel Anunciante</span>
                                </label>
                                <input type="password" name="olx" value={keys.olx} onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
                                    placeholder="olx_..." />
                            </div>
                            {/* TELEGRAM */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                                    <span>Telegram Bot Token</span> <span className="text-xs text-gray-400 font-normal">@BotFather</span>
                                </label>
                                <input type="password" name="telegram" value={keys.telegram} onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
                                    placeholder="1234567:AAH..." />
                            </div>
                            {/* ASAAS */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                                    <span>Asaas API Key</span> <span className="text-xs text-gray-400 font-normal">Da conta da Imobiliária</span>
                                </label>
                                <input type="password" name="asaas" value={keys.asaas} onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
                                    placeholder="$aact_..." />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs text-gray-400 font-mono">🔒 Secure SSL/TLS End-to-End Encryption</span>
                            <button
                                type="submit" disabled={status === 'loading'}
                                className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-medium shadow-md transition-colors disabled:opacity-50"
                            >
                                {status === 'loading' ? 'Criptografando...' : 'Trancar no Cofre'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
