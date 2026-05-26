import React, { useState } from 'react';

const apiBase = import.meta.env.VITE_API_URL || '/api';

interface LoginModalProps {
    onSuccess: (email: string) => void;
    onClose: () => void;
    target: string;
}

export default function LoginModal({ onSuccess, onClose, target }: LoginModalProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // Solicitar token de Sessão Única via Backend
            const response = await fetch(`${apiBase}/auth/demo-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const apiData = await response.json();

            if (apiData.success && apiData.token) {
                localStorage.setItem('sessionToken', apiData.token);
                onSuccess(email);
            } else {
                setError(apiData.error || 'Credenciais inválidas.');
            }
        } catch (err) {
            setError('Erro de conexão com servidor.');
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                            🔒
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Acesso Restrito</h2>
                        <p className="text-sm text-gray-500 mt-2">
                            Faça login para acessar a área de {target === 'onboarding' ? 'Onboarding SaaS' : target === 'dashboard' ? 'Dashboard BI' : 'Administração'}.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Corporativo</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700">Senha</label>
                                <button type="button" className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer" onClick={() => alert('Fluxo de redefinição de senha enviado para seu e-mail (Simulação).')}>
                                    Esqueci minha senha
                                </button>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Sua senha segura"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors"
                        >
                            Entrar no Sistema
                        </button>
                    </form>

                    <div className="mt-6 border-t border-gray-100 pt-6">
                        <button
                            type="button"
                            onClick={() => alert('No seu primeiro login como Gestor da Imobiliária, o sistema exigirá a troca de senha. (Interface Demo)')}
                            className="w-full py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            Alterar senha do GESTOR (1º Acesso)
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                        Cancelar e Voltar
                    </button>
                </div>
            </div>
        </div>
    );
}
