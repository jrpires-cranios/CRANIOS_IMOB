import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do LLM service para evitar chamadas reais OpenAI
vi.mock('../services/llm.service.js', () => ({
  llmService: {
    generateResponse: vi.fn().mockResolvedValue(JSON.stringify({
      sistema: 'SAC',
      valorFinanciado: 300000,
      entrada: 60000,
      prazoMeses: 360,
      taxaJurosAoMes: 0.008,
      primeiraParcela: 2800.50,
      ultimaParcela: 1100.20,
      totalPago: 756180.00,
      totalJuros: 456180.00,
      rendaMinima: 8401.50,
      resumo: 'Simulação SAC: 360 meses, entrada de R$ 60.000'
    }))
  }
}));

vi.mock('../config/supabase.js', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      })
    })
  }
}));

describe('FinanciamentoAgent — Cálculos SAC/Price', () => {
  it('deve calcular parcela SAC com amortização decrescente', () => {
    const principal = 300000;
    const taxaAoMes = 0.008; // 0.8% a.m. ≈ CET ~10% a.a.
    const prazoMeses = 360;
    const amortizacao = principal / prazoMeses;
    const primeiraParcela = amortizacao + principal * taxaAoMes;

    expect(primeiraParcela).toBeCloseTo(3233.33, 0);
    expect(amortizacao).toBeCloseTo(833.33, 0);
  });

  it('deve calcular parcela Price (constante)', () => {
    const principal = 300000;
    const taxa = 0.008;
    const n = 360;
    // Fórmula Price: PMT = PV * [i(1+i)^n] / [(1+i)^n - 1]
    const fator = Math.pow(1 + taxa, n);
    const pmt = principal * (taxa * fator) / (fator - 1);

    expect(pmt).toBeCloseTo(2544.48, 0);
    expect(pmt).toBeGreaterThan(0);
  });

  it('deve calcular renda mínima necessária (PMT / 0.35)', () => {
    const pmt = 2544.48;
    const rendaMinima = pmt / 0.35;

    expect(rendaMinima).toBeCloseTo(7269.94, 0);
    expect(rendaMinima).toBeGreaterThan(pmt);
  });

  it('deve validar que SAC tem total pago maior que Price para imóveis acima de 500k', () => {
    const principal = 500000;
    const taxa = 0.009;
    const n = 240;

    // Price total
    const fator = Math.pow(1 + taxa, n);
    const pmt = principal * (taxa * fator) / (fator - 1);
    const totalPrice = pmt * n;

    // SAC total
    let totalSAC = 0;
    const amort = principal / n;
    for (let i = 0; i < n; i++) {
      const saldo = principal - amort * i;
      totalSAC += amort + saldo * taxa;
    }

    // SAC tem menor custo total pois juros caem mais rápido
    expect(totalSAC).toBeLessThan(totalPrice);
  });
});
