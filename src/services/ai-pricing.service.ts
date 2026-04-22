import { supabase } from '../config/supabase.js';

export interface PricingParams {
  tenantId: string;
  tipo: string;
  contexto: 'venda' | 'locacao'; // 'ambos' is separated at UI level
  bairro: string;
  cidade: string;
  quartos: number;
  area_construida: number; 
}

export const aiPricingService = {
  async getPriceSuggestion(params: PricingParams) {
    const { tipo, contexto, bairro, cidade } = params;
    const quartos = Number(params.quartos) || 0;
    const area = Number(params.area_construida) || 0;

    if (!tipo || !bairro || !cidade) {
      return { success: false, error: 'Parâmetros insuficientes' };
    }

    let query = supabase
      .from('imoveis')
      .select('preco_venda, preco_locacao, bairro, id')
      .eq('tipo', tipo)
      .eq('cidade', cidade)
      .gte('quartos', Math.max(0, quartos - 1))
      .lte('quartos', quartos + 1)
      .not('status', 'eq', 'inativo');

    if (area > 0) {
      query = query
        .gte('area_construida', area * 0.7)
        .lte('area_construida', area * 1.3);
    }

    if (contexto === 'venda') {
      query = query.not('preco_venda', 'is', null).gt('preco_venda', 0);
    } else {
      query = query.not('preco_locacao', 'is', null).gt('preco_locacao', 0);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Pricing lookup error:', error);
      return { success: false, error: 'Falha ao processar sugestão' };
    }

    // Attempt exact neighborhood exact
    let comparables = data.filter(d => 
      d.bairro?.trim().toLowerCase() === bairro.trim().toLowerCase()
    );

    // If less than 3 in neighborhood, fallback to city
    let usedCityLevel = false;
    if (comparables.length < 3) {
      comparables = data;
      usedCityLevel = true;
    }

    const count = comparables.length;
    let confidence = 'ALTA';
    let margin = 0.08; 

    if (count < 3) {
      confidence = 'BAIXA';
      margin = 0.20;
    } else if (count < 10) {
      confidence = 'MEDIA';
      margin = 0.15;
    }

    if (usedCityLevel && count >= 3) {
      // Penalize confidence if fallback to city was needed
      confidence = confidence === 'ALTA' ? 'MEDIA' : 'BAIXA';
      margin += 0.05;
    }

    if (count === 0) {
      return { 
        success: true, 
        suggestion: null, 
        confidence: 'N/A', 
        comparablesCount: 0 
      };
    }

    // Calculate Median
    const prices = comparables.map(c => 
      contexto === 'venda' ? Number(c.preco_venda) : Number(c.preco_locacao)
    ).sort((a, b) => a - b);
    
    let median = 0;
    const mid = Math.floor(prices.length / 2);
    if (prices.length % 2 === 0) {
      median = (prices[mid - 1] + prices[mid]) / 2;
    } else {
      median = prices[mid];
    }

    const marginValue = median * margin;

    return {
      success: true,
      contexto,
      suggestion: median,
      rangeMin: median - marginValue,
      rangeMax: median + marginValue,
      confidence,
      comparablesCount: count,
      usedCityFallback: usedCityLevel
    };
  }
};
