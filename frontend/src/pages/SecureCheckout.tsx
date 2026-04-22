import React, { useState } from 'react';
import { ShieldCheck, Upload, CreditCard } from 'lucide-react';

export default function SecureCheckout({ leadId }: { leadId: string }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        nomeCompleto: '',
        cpf: '',
        rg: '',
        dataNascimento: '',
        telefone: '',
        email: '',
        profissao: '',
        renda: '',
        nomeFiador: '',
        cpfFiador: '',
        telefoneFiador: ''
    });

    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        docIdentidade: null,
        comprovanteRenda: null,
        docFiador: null,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (name: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles({ ...files, [name]: e.target.files[0] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Create FormData to send files and json
            const data = new FormData();
            data.append('leadId', leadId);
            data.append('json_data', JSON.stringify(formData));

            if (files.docIdentidade) data.append('docIdentidade', files.docIdentidade);
            if (files.comprovanteRenda) data.append('comprovanteRenda', files.comprovanteRenda);
            if (files.docFiador) data.append('docFiador', files.docFiador);

            const res = await fetch('/api/secure/checkout/submit', {
                method: 'POST',
                body: data // Omittance of Content-Type allows browser to set multipart boundary
            });

            const responseData = await res.json();

            if (responseData.success) {
                setSuccess(true);
            } else {
                alert('Ocorreu um erro: ' + responseData.error);
            }
        } catch (err) {
            alert('Falha na comunicação com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border-t-4 border-green-500">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Documentação Recebida!</h2>
                    <p className="text-gray-600 mb-8">
                        Seus dados foram processados com segurança. Nosso time jurídico está validando o seu perfil.
                        Fique de olho no seu WhatsApp e E-mail para receber o contrato digital para assinatura e os links de pagamento.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
            <div className="mb-8 text-center flex flex-col items-center">
                <img src="/logo_bco.png" alt="Crânios Imob" className="h-14 mb-4" />
                <h1 className="text-3xl font-bold text-gray-900">Portal do Cliente</h1>
                <p className="text-gray-500 mt-2 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-green-600" /> Ambiente 100% Seguro e Criptografado
                </p>
            </div>

            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-blue-600 px-8 py-6 text-white text-center">
                    <h2 className="text-2xl font-bold">Checkout: Locação Digital</h2>
                    <p className="opacity-90 mt-1">Insira seus dados para geração automática do seu contrato (ID: {leadId.substring(0, 8)}...)</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {/* DADOS PESSOAIS */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">1. Dados do Locatário</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
                                <input required type="text" name="nomeCompleto" value={formData.nomeCompleto} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">CPF</label>
                                <input required type="text" name="cpf" value={formData.cpf} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail</label>
                                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Telefone (WhatsApp)</label>
                                <input required type="text" name="telefone" value={formData.telefone} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Profissão</label>
                                <input required type="text" name="profissao" value={formData.profissao} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Renda Mensal Bruta (R$)</label>
                                <input required type="text" name="renda" value={formData.renda} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                    </div>

                    {/* DADOS FIADOR */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">2. Dados do Fiador (Opcional se usar Seguro)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Fiador</label>
                                <input type="text" name="nomeFiador" value={formData.nomeFiador} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">CPF do Fiador</label>
                                <input type="text" name="cpfFiador" value={formData.cpfFiador} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                    </div>

                    {/* UPLOAD DE ARQUIVOS */}
                    <div className="mb-8 bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Upload size={20} /> 3. Documentação Anexa</h3>
                        <div className="flex flex-col gap-4">
                            <div className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                                <div>
                                    <div className="font-semibold text-sm">Doc de Identidade (CNH ou RG)</div>
                                    <div className="text-xs text-gray-500">Foto nítida frente e verso</div>
                                </div>
                                <input required type="file" onChange={(e) => handleFileChange('docIdentidade', e)} className="text-sm" />
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                                <div>
                                    <div className="font-semibold text-sm">Comprovante de Renda</div>
                                    <div className="text-xs text-gray-500">3 últimos contracheques ou IR</div>
                                </div>
                                <input required type="file" onChange={(e) => handleFileChange('comprovanteRenda', e)} className="text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* TERMOS E BOTAO */}
                    <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-6 text-center">
                            Ao clicar em enviar, os seus dados serão armazenados e criptografados conforme a LGPD para a geração exclusiva do contrato e emissão do Caução (Asaas / BACEN).
                        </p>
                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 flex justify-center items-center gap-2 text-white font-bold py-4 rounded-xl text-lg transition-transform hover:scale-[1.02] disabled:opacity-50"
                        >
                            {loading ? 'Processando Envios...' : <><CreditCard size={24} /> Enviar Documentação e Gerar Contrato</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
