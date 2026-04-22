import { useEffect, useState } from 'react';
import { apiClient } from '../client';
import { Imovel } from '../types';

export default function Admin() {
    const [imoveis, setImoveis] = useState<Imovel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Imovel>>({
        tipo: 'apartamento',
        finalidade: 'venda',
        cidade: 'Aracaju',
        estado: 'SE',
        disponivel: true,
        destaque: false,
    } as Partial<Imovel>);

    useEffect(() => {
        fetchImoveis();
    }, []);

    async function fetchImoveis() {
        try {
            setLoading(true);
            const response = await apiClient.getImoveis({ limit: 200 });

            if (response.success && response.data) {
                setImoveis(response.data);
            } else {
                setError(response.error || 'Erro ao carregar imóveis');
            }
        } catch (err) {
            console.error('[Admin] Erro:', err);
            setError('Erro de conexão com o servidor');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            if (editingId) {
                const response = await apiClient.updateImovel(editingId, formData);

                if (response.success) {
                    alert('Imóvel atualizado com sucesso!');
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                        tipo: 'apartamento',
                        finalidade: 'venda',
                        cidade: 'Aracaju',
                        estado: 'SE',
                        disponivel: true,
                        destaque: false,
                    });
                    fetchImoveis();
                } else {
                    alert(`Erro: ${response.error}`);
                }
            } else {
                const response = await apiClient.createImovel(formData);

                if (response.success) {
                    alert('Imóvel criado com sucesso!');
                    setShowForm(false);
                    setFormData({
                        tipo: 'apartamento',
                        finalidade: 'venda',
                        cidade: 'Aracaju',
                        estado: 'SE',
                        disponivel: true,
                        destaque: false,
                    });
                    fetchImoveis();
                } else {
                    alert(`Erro: ${response.error}`);
                }
            }
        } catch (err) {
            console.error('[Admin] Erro ao salvar:', err);
            alert('Erro ao salvar imóvel');
        }
    }

    function handleEdit(imovel: Imovel) {
        setFormData(imovel);
        setEditingId(imovel.id);
        setShowForm(true);
    }

    async function handleDelete(id: string) {
        if (confirm('Tem certeza que deseja excluir este imóvel? (ID: ' + id + ')')) {
            try {
                const response = await apiClient.deleteImovel(id);
                if (response.success) {
                    fetchImoveis();
                } else {
                    alert(`Erro ao excluir: ${response.error}`);
                }
            } catch (err) {
                console.error('[Admin] Erro ao excluir:', err);
                alert('Erro ao excluir imóvel');
            }
        }
    }

    function cancelForm() {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            tipo: 'apartamento',
            finalidade: 'venda',
            cidade: 'Aracaju',
            estado: 'SE',
            disponivel: true,
            destaque: false,
        });
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 border-4 border-t-blue-500 rounded-full border-t-transparent animate-spin"></div>
                    <p className="mt-4 text-gray-600">Carregando painel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
                        <p className="text-gray-600">Gerenciamento de imóveis</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Novo Imóvel
                    </button>
                </div>

                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            {editingId ? 'Editar Imóvel' : 'Novo Imóvel'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.titulo || ''}
                                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ex: Apartamento 3 quartos em Atalaia"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                                    <select
                                        required
                                        value={formData.tipo || 'apartamento'}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="apartamento">Apartamento</option>
                                        <option value="casa">Casa</option>
                                        <option value="terreno">Terreno</option>
                                        <option value="comercial">Comercial</option>
                                        <option value="rural">Rural</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Finalidade *</label>
                                    <select
                                        required
                                        value={formData.finalidade || 'venda'}
                                        onChange={(e) => setFormData({ ...formData, finalidade: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="venda">Venda</option>
                                        <option value="locacao">Locação</option>
                                        <option value="ambos">Venda/Locação</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                                    <input
                                        type="text"
                                        value={formData.bairro || ''}
                                        onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ex: Atalaia"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.endereco || ''}
                                        onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ex: Rua das Flores, 123"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                                    <input
                                        type="text"
                                        value={formData.cep || ''}
                                        onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="00000-000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço Venda (R$)</label>
                                    <input
                                        type="number"
                                        value={formData.preco_venda || ''}
                                        onChange={(e) => setFormData({ ...formData, preco_venda: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço Locação (R$/mês)</label>
                                    <input
                                        type="number"
                                        value={formData.preco_locacao || ''}
                                        onChange={(e) => setFormData({ ...formData, preco_locacao: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor Condomínio (R$)</label>
                                    <input
                                        type="number"
                                        value={formData.valor_condominio || ''}
                                        onChange={(e) => setFormData({ ...formData, valor_condominio: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor IPTU (R$)</label>
                                    <input
                                        type="number"
                                        value={formData.valor_iptu || ''}
                                        onChange={(e) => setFormData({ ...formData, valor_iptu: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Área Total (m²)</label>
                                    <input
                                        type="number"
                                        value={formData.area_total || ''}
                                        onChange={(e) => setFormData({ ...formData, area_total: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quartos</label>
                                    <input
                                        type="number"
                                        value={formData.quartos || ''}
                                        onChange={(e) => setFormData({ ...formData, quartos: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Suítes</label>
                                    <input
                                        type="number"
                                        value={formData.suites || ''}
                                        onChange={(e) => setFormData({ ...formData, suites: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Banheiros</label>
                                    <input
                                        type="number"
                                        value={formData.banheiros || ''}
                                        onChange={(e) => setFormData({ ...formData, banheiros: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vagas Garagem</label>
                                    <input
                                        type="number"
                                        value={formData.vagas_garagem || ''}
                                        onChange={(e) => setFormData({ ...formData, vagas_garagem: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                    <textarea
                                        value={formData.descricao || ''}
                                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Descrição detalhada do imóvel..."
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.disponivel || false}
                                            onChange={(e) => setFormData({ ...formData, disponivel: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Disponível</span>
                                    </label>

                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.destaque || false}
                                            onChange={(e) => setFormData({ ...formData, destaque: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Destaque</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                    {editingId ? 'Atualizar' : 'Criar'} Imóvel
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelForm}
                                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Lista de Imóveis */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Imóveis Cadastrados ({imoveis.length})
                        </h2>
                    </div>

                    {error ? (
                        <div className="p-6 text-center text-red-600">{error}</div>
                    ) : imoveis.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <p>Nenhum imóvel cadastrado ainda.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bairro</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {imoveis.map((imovel) => (
                                        <tr key={imovel.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{imovel.titulo}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                                                    {imovel.tipo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {imovel.bairro || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {imovel.preco_venda ? `R$ ${imovel.preco_venda.toLocaleString('pt-BR')}` :
                                                    imovel.preco_locacao ? `R$ ${imovel.preco_locacao.toLocaleString('pt-BR')}/mês` :
                                                        'Sob consulta'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {imovel.disponivel && (
                                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                            Disponível
                                                        </span>
                                                    )}
                                                    {imovel.destaque && (
                                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                            Destaque
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(imovel)}
                                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(imovel.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Excluir
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
