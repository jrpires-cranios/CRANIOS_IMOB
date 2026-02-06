// Gera 22 imóveis inteligentes a partir dos 12 contratos
// Usa o endpoint POST /api/imoveis para inserir

const { fetch } = require('node-fetch');

// Templates de imóveis baseados em contratos
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

// Endereços genéricos de Aracaju (baseados em bairros)
const enderecosPorBairro = {
  'Atalaia': 'Av. Santos Dumont, {numero} - Atalaia, Aracaju - SE',
  'Aruana': 'Av. Santos Dumont, {numero} - Aruana, Aracaju - SE',
  'Santa Maria': 'Av. Santos Dumont, {numero} - Santa Maria, Aracaju - SE',
  'Jardins': 'Av. Ministro Geraldo Barreto Sobral - Neo Residence, {numero} - Jardins, Aracaju - SE',
  'Farolândia': 'Rua João Batista Ribeiro, {numero} - Farolândia, Aracaju - SE',
  'Luzia': 'Alameda das Árvores, {numero} - Luzia, Aracaju - SE',
  'Grageru': 'Rua Marieta Leite, {numero} - Grageru, Aracaju - SE',
};

async function gerarImovelAPartirDeContrato(contrato, numero) {
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

  // Imóvel final
  return {
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
  };
}

async function criarImovelNaAPI(imovel) {
  try {
    const response = await fetch('http://localhost:3002/api/imoveis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imovel),
    });

    const data = await response.json();
    return {
      success: data.success || false,
      imovel: data.data,
      error: data.error || null,
    };
  } catch (error) {
    return {
      success: false,
      imovel: null,
      error: error.message,
    };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 GERAÇÃO INTELIGENTE DE IMÓVEIS (API REST)');
  console.log('='.repeat(60));

  try {
    // 1. Buscar contratos (API)
    console.log('\n[API] Buscando contratos...');
    const responseContratos = await fetch('http://localhost:3002/api/contratos');
    const contratos = await responseContratos.json();

    if (!contratos.success || !contratos.data || contratos.data.length === 0) {
      console.error('[API] Erro ao buscar contratos:', contratos);
      throw new Error('Não foi possível buscar contratos');
    }

    console.log(`[API] ${contratos.data.length} contratos encontrados para gerar imóveis`);

    // 2. Gerar imóveis a partir dos contratos
    let imoveisCriados = 0;
    let imoveisErros = 0;
    const totalImoveis = contratos.data.length * 2; // 2 imóveis por contrato

    console.log(`\n[Geracao] Gerando ${totalImoveis} imóveis a partir dos contratos...`);

    for (const contrato of contratos.data) {
      try {
        // Se o contrato já tem imóvel, pular
        if (contrato.imovel_id) {
          console.log(`[Geracao] ⏭️  Contrato ${contrato.id} já tem imóvel, pulando...`);
          continue;
        }

        // Gerar imóvel 1 (Locação)
        const imovel1 = await gerarImovelAPartirDeContrato({ ...contrato, tipo_contrato: 'Locacao' }, contratos.data.indexOf(contrato) * 2 + 1);
        const criacao1 = await criarImovelNaAPI(imovel1);
        if (criacao1.success) {
          imoveisCriados++;
          console.log(`[Geracao] ✅ Imóvel 1 criado: ${imovel1.titulo} (Contrato ${contrato.id})`);
        } else {
          imoveisErros++;
          console.error(`[Geracao] ❌ Erro ao criar imóvel 1: ${imovel1.titulo} - ${criacao1.error}`);
        }

        // Gerar imóvel 2 (Venda)
        const imovel2 = await gerarImovelAPartirDeContrato({ ...contrato, tipo_contrato: 'Venda' }, contratos.data.indexOf(contrato) * 2 + 2);
        const criacao2 = await criarImovelNaAPI(imovel2);
        if (criacao2.success) {
          imoveisCriados++;
          console.log(`[Geracao] ✅ Imóvel 2 criado: ${imovel2.titulo} (Contrato ${contrato.id})`);
        } else {
          imoveisErros++;
          console.error(`[Geracao] ❌ Erro ao criar imóvel 2: ${imovel2.titulo} - ${criacao2.error}`);
        }

      } catch (error) {
        imoveisErros++;
        console.error(`[Geracao] ❌ Erro ao processar contrato ${contrato.id}:`, error);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO FINAL');
    console.log('='.repeat(60));
    console.log(`✅ Imóveis criados: ${imoveisCriados}`);
    console.log(`❌ Imóveis falharam: ${imoveisErros}`);
    console.log(`🏠 Total final: ${imoveisCriados} imóveis`);
    console.log('='.repeat(60));

    if (imoveisCriados > 0) {
      console.log('✅ GERAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log(`🎯 Para verificar: GET http://localhost:3002/api/imoveis/destaque?limit=10`);
    } else {
      console.log('❌ GERAÇÃO FALHOU!');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERRO FATAL NA GERAÇÃO');
    console.error('='.repeat(60));
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
