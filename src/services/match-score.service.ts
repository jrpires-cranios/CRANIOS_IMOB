import { LeadProfile } from './lead-memory.service.js';

export interface ImovelFiltro {
    tipo: string;
    finalidade: string;
    operacao?: string; // alias para finalidade
    preco: number;
    preco_venda?: number;
    preco_locacao?: number;
    bairro: string;
    quartos: number;
}

export interface ScoreBreakdown {
    criterio: string;
    pontos: number;
    max: number;
}

export interface MatchResult {
    score: number;           // 0-100
    percentage: string;      // '94%'
    label: string;           // 'Ótima combinação' | 'Boa compatibilidade' | ...
    color: string;           // '#16A34A' | '#D97706' | '#DC2626'
    breakdown: ScoreBreakdown[];
}

function tipoProximo(tipoA: string, tipoB: string): boolean {
    const a = tipoA.toLowerCase();
    const b = tipoB.toLowerCase();
    if (a === b) return true;
    if ((a.includes('casa') || a.includes('sobrado')) && (b.includes('casa') || b.includes('sobrado'))) return true;
    if ((a.includes('apartamento') || a.includes('apto') || a.includes('studio') || a.includes('flat') || a.includes('loft')) &&
        (b.includes('apartamento') || b.includes('apto') || b.includes('studio') || b.includes('flat') || b.includes('loft'))) return true;
    return false;
}

export function calculateMatchScore(
    imovel: ImovelFiltro,
    profile: LeadProfile
): MatchResult {
    let score = 0;
    const breakdown: ScoreBreakdown[] = [];

    // 1. Operação (comprar/alugar) - peso 20
    const operacaoImovel = imovel.operacao || imovel.finalidade || (imovel.preco_venda ? 'venda' : 'locacao');
    const operacaoLead = profile.operacao === 'alugar' ? 'locacao' : (profile.operacao === 'comprar' ? 'venda' : profile.operacao);

    if (operacaoLead) {
        if (operacaoImovel === operacaoLead || operacaoImovel === 'ambos') {
            score += 20;
            breakdown.push({ criterio: 'Operação', pontos: 20, max: 20 });
        } else {
            breakdown.push({ criterio: 'Operação', pontos: 0, max: 20 });
        }
    }

    // 2. Tipo de imóvel - peso 25
    if (profile.tipo_imovel) {
        let pts = 0;
        if (imovel.tipo.toLowerCase() === profile.tipo_imovel.toLowerCase()) {
            pts = 25;
        } else if (tipoProximo(imovel.tipo, profile.tipo_imovel)) {
            pts = 12;
        }
        score += pts;
        breakdown.push({ criterio: 'Tipo de imóvel', pontos: pts, max: 25 });
    }

    // 3. Localização - peso 20
    if (profile.bairros && profile.bairros.length > 0) {
        const inExact = profile.bairros.some(b =>
            imovel.bairro.toLowerCase().includes(b.toLowerCase()) ||
            b.toLowerCase().includes(imovel.bairro.toLowerCase())
        );
        const pts = inExact ? 20 : 8; // Assumimos que a cidade bate (8 pts min)
        score += pts;
        breakdown.push({ criterio: 'Localização', pontos: pts, max: 20 });
    }

    // 4. Faixa de preço - peso 20
    if (profile.preco_max) {
        const precoValue = operacaoLead === 'locacao' ? (imovel.preco_locacao || imovel.preco) : (imovel.preco_venda || imovel.preco);
        if (precoValue) {
            const ratio = precoValue / profile.preco_max;
            const pts = ratio <= 1 ? 20 : ratio <= 1.10 ? 15 : ratio <= 1.20 ? 5 : 0;
            score += pts;
            breakdown.push({ criterio: 'Preço', pontos: pts, max: 20 });
        }
    }

    // 5. Quartos - peso 10
    if (profile.quartos_min) {
        const diff = (imovel.quartos || 0) - profile.quartos_min;
        const pts = diff >= 0 ? 10 : diff === -1 ? 5 : 0;
        score += pts;
        breakdown.push({ criterio: 'Quartos', pontos: pts, max: 10 });
    }

    // Normalizar para o total de critérios avaliados (se não tem bairro no profile, o score não sofre penalidade)
    const maxPossible = breakdown.reduce((s, b) => s + b.max, 0) || 100;
    const normalized = Math.round((score / maxPossible) * 100);

    return {
        score: normalized,
        percentage: `${normalized}%`,
        label: normalized >= 85 ? 'Ótima combinação'
            : normalized >= 70 ? 'Boa compatibilidade'
                : normalized >= 50 ? 'Compatível'
                    : 'Compatibilidade parcial',
        color: normalized >= 85 ? '#16A34A' // Verde
            : normalized >= 70 ? '#D97706' // Âmbar
                : '#DC2626',                   // Vermelho
        breakdown,
    };
}
