import { useState, useEffect } from 'react';
import { Tooltip, ResponsiveContainer, BarChart, Bar, Legend, CartesianGrid, XAxis, YAxis } from 'recharts';

export default function ExecutiveBI() {
    const tenantId = localStorage.getItem('tenant_id') || 'rbhkwmesmvytqdfuwcie';
    const [loading, setLoading] = useState(true);
    const [biData, setBiData] = useState<any>(null);

    useEffect(() => {
        if (!tenantId) return;
        const fetchBI = async () => {
            try {
                const res = await fetch(`/api/dashboard/bi/${tenantId}`);
                const data = await res.json();
                if (data.success) {
                    setBiData(data.bi);
                }
            } catch (error) {
                console.error('Failed to fetch BI data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBI();
    }, [tenantId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!biData) {
        return <div className="text-gray-500 text-center mt-10">Não foi possível carregar os dados de BI.</div>;
    }

    const { vso, tml, benchmark } = biData;

    return (
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                📈 BI Executivo <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded">Visão Estratégica</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* VSO */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">VSO (Vendas sobre Oferta)</div>
                        <div className="text-4xl font-bold text-blue-600">{vso?.percentage}%</div>
                        <div className="text-gray-500 text-sm mt-3">
                            <span className="font-semibold">{vso?.vendidos}</span> imóveis vendidos de <span className="font-semibold">{vso?.ativos}</span> disponíveis este mês.
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Meta Saudável: &gt; 5% ao mês.</span>
                        {Number(vso?.percentage) >= 5 ? <span className="text-xs text-green-500 font-bold bg-green-50 px-2 py-1 rounded">EXCELENTE</span> : <span className="text-xs text-yellow-600 font-bold bg-yellow-50 px-2 py-1 rounded">ATENÇÃO</span>}
                    </div>
                </div>

                {/* TML */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Tempo Médio de Fechamento (TML)</div>
                        <div className="text-4xl font-bold text-purple-600">{tml?.dias} <span className="text-2xl text-gray-400 font-medium">dias</span></div>
                        <div className="text-gray-500 text-sm mt-3">
                            Média baseada nos últimos <span className="font-semibold">{tml?.base_leads}</span> leads ganhos.
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Tempo de conversão entre entrada e fechamento.</span>
                    </div>
                </div>
            </div>

            {/* Benchmark Corretor */}
            <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 Benchmark de Corretores</h3>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                {benchmark && benchmark.length > 0 ? (
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={benchmark} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="broker_name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                                <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`} />
                                <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
                                <Tooltip formatter={(value, name) => [name === 'vgv_total' ? `R$ ${Number(value).toLocaleString()}` : value, name === 'vgv_total' ? 'VGV Total' : 'Total Vendas']} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="vgv_total" name="VGV Total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="right" dataKey="total_vendas" name="Total Vendas" fill="#10B981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-10">Nenhum dado de corretor disponível para o benchmark.</div>
                )}
            </div>
        </div>
    );
}
