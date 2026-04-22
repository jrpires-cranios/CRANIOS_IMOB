import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  'https://rbhkwmesmvytqdfuwcie.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiaGt3bWVzbXZ5dHFkZnV3Y2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ0ODUsImV4cCI6MjA4NTM5MDQ0NX0.vHffPyFGC99OhYpfeGihf59oGhIguVwKfQagySAyTck'
);

// Templates de imoveis baseados em contratos
const imovelTemplates = {
  'Apartamento': {
    quartos: 2,
    suites: 1,
    banheiros: 2,
    vagas: 1,
    area_total: 68,
    area_construida: 65,
    caracteristicas: ['varanda', 'lavabo', 'ar_condicionado'],
  },
  'Casa': {
    quartos: 3,
    suites: 2,
    banheiros: 3,
    vagas: 2,
    area_total: 120,
    area_construida: 115,
    caracteristicas: ['quintal', 'garagem_coberta', 'sala_2_ambientes'],
  },
  'Kitnet': {
    quartos: 1,
    suites: 0,
    banheiros: 1,
    vagas: 0,
    area_total: 35,
    area_construida: 33,
    caracteristicas: ['mobiliada', 'cozinha_americana'],
  },
  'Studio': {
    quartos: 0,
    suites: 0,
    banheiros: 1,
    vagas: 0,
    area_total: 30,
    area_construida: 28,
    caracteristicas: ['compacto', 'moderno'],
  },
  'Sala Comercial': {
    quartos: 0,
    suites: 0,
    banheiros: 1,
    vagas: 1,
    area_total: 48,
    area_construida: 45,
    caracteristicas: ['pronto_para_consultorio', 'estacionamento_rotativo'],
  },
};

// Enderecos genericos de Aracaju (baseados em bairros)
const enderecosPorBairro = {
  'Atalaia': 'Av. Santos Dumont, {numero} - Atalaia, Aracaju - SE',
  'Aruana': 'Av. Santos Dumont, {numero} - Aruana, Aracaju - SE',
  'Santa Maria': 'Av. Santos Dumont, {numero} - Santa Maria, Aracaju - SE',
  'Jardins': 'Av. Ministro Geraldo Barreto Sobral - Neo Residence, {numero} - Jardins, Aracaju - SE',
  'Farolândia': 'Rua João Batista Ribeiro, {numero} - Farolândia, Aracaju - SE',
  'Luzia': 'Alameda das Árvores, {numero} - Luzia, Aracaju - SE',
  'Grageru': 'Rua Marieta Leite, {numero} - Grageru, Aracaju - SE',
};

async function gerarImoveisAPartirDeContratos() {
  console.log('\n=== GERANDO IMÓVEIS A PARTIR DE CONTRATOS ===');

  try {
    // 1. Buscar todos os contratos
    const { data: contratos, error: errorContratos } = await supabase
      .from('contratos')
      .select(`
        *,
        imoveis (
          tipo,
          quartos,
          suites,
          banheiros,
          vagas,
          area_total,
          area_construida,
          caracteristicas,
          bairro,
          endereco
        ),
        proprietarios (
          nome,
          telefone,
          email,
          documento,
          tipo_pessoa,
          endereco,
          cidade,
          estado
        ),
        clientes (
          nome,
          telefone,
          email,
          documento,
          tipo_cliente
        ),
        corretores (
          nome,
          email,
          creci,
          whatsapp
        )
      `);

    if (errorContratos) throw errorContratos;

    console.log(`[Geracao] Encontrados ${contratos.length} contratos para gerar imóveis`);

    // 2. Gerar imóveis a partir dos contratos
    let imoveisGerados = 0;
    let imoveisErros = 0;

    for (const contrato of contratos) {
      try {
        // Se o contrato já tem imóvel, pular
        if (contrato.imoveis) {
          console.log(`[Geracao] ⏭️  Contrato ${contrato.id} já tem imóvel, pulando...`);
          continue;
        }

        // Dados do imóvel a partir do contrato
        let tipoImovel = 'Apartamento'; // Default
        let finalidade = 'Venda';

        if (contrato.tipo_contrato === 'Locacao') {
          finalidade = 'Locacao';
          tipoImovel = contrato.imovel_id < 10 ? 'Apartamento' : 'Kitnet';
        } else if (contrato.tipo_contrato === 'Venda') {
          finalidade = 'Venda';
          tipoImovel = contrato.imovel_id < 10 ? 'Casa' : 'Apartamento';
        }

        // Template do imóvel
        const template = imovelTemplates[tipoImovel] || imovelTemplates['Apartamento'];

        // Bairro a partir do contrato (ou genérico)
        let bairro = 'Jardins'; // Default
        if (contrato.imovel_id >= 1 && contrato.imovel_id <= 3) bairro = 'Atalaia';
        else if (contrato.imovel_id >= 4 && contrato.imovel_id <= 6) bairro = 'Aruana';
        else if (contrato.imovel_id >= 7 && contrato.imovel_id <= 9) bairro = 'Santa Maria';
        else if (contrato.imovel_id >= 10 && contrato.imovel_id <= 12) bairro = 'Jardins';
        else if (contrato.imovel_id >= 13 && contrato.imovel_id <= 15) bairro = 'Farolândia';
        else if (contrato.imovel_id >= 16 && contrato.imovel_id <= 18) bairro = 'Luzia';
        else if (contrato.imovel_id >= 19 && contrato.imovel_id <= 20) bairro = 'Grageru';

        // Endereço
        const enderecoTemplate = enderecosPorBairro[bairro] || enderecosPorBairro['Jardins'];
        const endereco = enderecoTemplate.replace('{numero}', contrato.imovel_id * 10 + Math.floor(Math.random() * 100));

        // Preço baseado no contrato
        const precoVenda = finalidade === 'Venda' 
          ? (contrato.valor_total || contrato.valor_mensal * 60)
          : null;
        const precoLocacao = finalidade === 'Locacao'
          ? contrato.valor_mensal
          : null;

        // Título e descrição gerados
        const titulo = `${tipoImovel} ${template.quartos} Quartos - ${bairro}`;
        const descricao = finalidade === 'Locacao'
          ? `${tipoImovel} excelente no bairro ${bairro}, próximo a comércios e transportes.`
          : `${tipoImovel} espaçoso no bairro ${bairro}, com ótima localização.`;

        // Imagens (usando Unsplash para exemplo)
        const imagensUrls = [
          `https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800`,
          `https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800`,
          `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800`,
        ];

        // Criar imóvel no Supabase
        const { data: imovel, error: errorImovel } = await supabase
          .from('imoveis')
          .insert([{
            id: `imovel_gerado_${contrato.id}`,
            titulo,
            descricao,
            tipo: tipoImovel,
            finalidade,
            bairro,
            endereco,
            preco_venda: precoVenda,
            preco_locacao: precoLocacao,
            area_total: template.area_total,
            area_construida: template.area_construida,
            quartos: template.quartos,
            suites: template.suites,
            banheiros: template.banheiros,
            vagas_garagem: template.vagas,
            caracteristicas: template.caracteristicas,
            fotos: imagensUrls,
            foto_principal: imagensUrls[0],
            disponivel: true,
            destaque: true,
            cidade: 'Aracaju',
            estado: 'SE',
            proprietario_id: contrato.proprietario_id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);

        if (errorImovel) throw errorImovel;

        imoveisGerados++;
        console.log(`[Geracao] ✅ Imóvel gerado: ${titulo} (Contrato ${contrato.id})`);

      } catch (error) {
        imoveisErros++;
        console.error(`[Geracao] ❌ Erro ao gerar imóvel para contrato ${contrato.id}:`, error);
      }
    }

    console.log(`\n[Geracao] ${imoveisGerados} imóveis gerados com sucesso!`);
    console.log(`[Geracao] ${imoveisErros} imóveis falharam`);

    return {
      success: true,
      gerados: imoveisGerados,
      erros: imoveisErros,
    };
  } catch (error) {
    console.error('\n[Geracao] Erro fatal:', error);
    return {
      success: false,
      error: error.message,
      gerados: 0,
      erros: 0,
    };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 GERAÇÃO INTELIGENTE DE IMÓVEIS');
  console.log('='.repeat(60));

  const resultado = await gerarImoveisAPartirDeContratos();

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADO FINAL');
  console.log('='.repeat(60));
  console.log(`✅ Imóveis gerados: ${resultado.gerados}`);
  console.log(`❌ Imóveis falharam: ${resultado.erros}`);
  console.log(`🏠 Total final: 3 (reais) + ${resultado.gerados} (gerados) = ${3 + resultado.gerados} imóveis`);
  console.log('='.repeat(60));

  if (resultado.success) {
    console.log('✅ GERAÇÃO CONCLUÍDA COM SUCESSO!');
  } else {
    console.log('❌ GERAÇÃO FALHOU!');
    process.exit(1);
  }
}

main();
