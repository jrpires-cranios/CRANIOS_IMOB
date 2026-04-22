import { describe, it, expect } from 'vitest';

// Lógica da roleta pura (sem depender do DB para testes unitários)
function distribuirLead(corretores: Array<{ id: string; peso: number; ativo: boolean }>, leadValor: number): string | null {
  const ativos = corretores.filter(c => c.ativo && c.peso > 0);
  if (ativos.length === 0) return null;

  const totalPeso = ativos.reduce((sum, c) => sum + c.peso, 0);
  const random = Math.random() * totalPeso;

  let acumulado = 0;
  for (const corretor of ativos) {
    acumulado += corretor.peso;
    if (random <= acumulado) return corretor.id;
  }
  return ativos[ativos.length - 1].id;
}

describe('Roleta Service — Distribuição de Leads', () => {
  const corretores = [
    { id: 'c1', peso: 3, ativo: true },
    { id: 'c2', peso: 1, ativo: true },
    { id: 'c3', peso: 2, ativo: true },
    { id: 'c4', peso: 0, ativo: true },  // peso 0 = não distribuir
    { id: 'c5', peso: 2, ativo: false }, // inativo = não distribuir
  ];

  it('deve retornar sempre um corretor ativo com peso > 0', () => {
    for (let i = 0; i < 100; i++) {
      const resultado = distribuirLead(corretores, 400000);
      expect(['c1', 'c2', 'c3']).toContain(resultado);
    }
  });

  it('deve distribuir proporcionalmente ao peso em 10.000 sorteios', () => {
    const contagem: Record<string, number> = { c1: 0, c2: 0, c3: 0 };
    const N = 10000;

    for (let i = 0; i < N; i++) {
      const r = distribuirLead(corretores, 400000);
      if (r && contagem[r] !== undefined) contagem[r]++;
    }

    // c1 tem peso 3/6 ≈ 50%, c2 tem 1/6 ≈ 16.7%, c3 tem 2/6 ≈ 33.3%
    const pct1 = contagem.c1 / N;
    const pct2 = contagem.c2 / N;
    const pct3 = contagem.c3 / N;

    expect(pct1).toBeGreaterThan(0.40);  // ~50% ± 10%
    expect(pct1).toBeLessThan(0.60);
    expect(pct2).toBeGreaterThan(0.07);  // ~17% ± 10%
    expect(pct2).toBeLessThan(0.27);
    expect(pct3).toBeGreaterThan(0.23);  // ~33% ± 10%
    expect(pct3).toBeLessThan(0.43);
  });

  it('deve retornar null quando não há corretores ativos', () => {
    const inativos = corretores.map(c => ({ ...c, ativo: false }));
    const resultado = distribuirLead(inativos, 400000);
    expect(resultado).toBeNull();
  });

  it('deve retornar null quando todos têm peso 0', () => {
    const semPeso = corretores.map(c => ({ ...c, peso: 0 }));
    const resultado = distribuirLead(semPeso, 400000);
    expect(resultado).toBeNull();
  });
});
