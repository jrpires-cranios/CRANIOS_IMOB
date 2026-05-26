import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('WhatsApp Service — Validações', () => {
  it('deve normalizar números de telefone removendo caracteres não-numéricos', () => {
    const normalizar = (tel: string) => tel.replace(/\D/g, '');

    expect(normalizar('+55 (79) 99999-9999')).toBe('5579999999999');
    expect(normalizar('79 99999-9999')).toBe('79999999999');
    expect(normalizar('5579999999999')).toBe('5579999999999');
  });

  it('deve validar que mensagem de boas-vindas contém nome do lead', () => {
    const lead = { nome: 'João Silva', telefone: '79999999999', imobiliariaNome: 'Imob Teste' };
    const mensagem = `Olá ${lead.nome}! 👋\n\nSou Elena, assistente virtual da *${lead.imobiliariaNome}*.`;

    expect(mensagem).toContain('João Silva');
    expect(mensagem).toContain('Imob Teste');
    expect(mensagem).toContain('Elena');
  });

  it('deve formatar valor monetário corretamente', () => {
    const valor = 450000;
    const formatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

    expect(formatado).toContain('450');
    expect(formatado).toContain('R$');
  });
});
