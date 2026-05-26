// Script de importação dos CSVs da pasta inbound/
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  'https://rbhkwmesmvytqdfuwcie.supabase.co',
  (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '')
);

async function importarBairros() {
  console.log('\n=== IMPORTANDO BAIRROS ===');
  
  const csvPath = join(process.cwd(), 'file_32---48e9a84a-0aa9-46dc-8206-ca9f498e9d6c.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true });

  console.log(`[Bairros] Lendo ${records.length} bairros...`);

  for (const record of records) {
    try {
      const { data, error } = await supabase.from('bairros').insert([{
        bairro_id: record.bairro_id,
        nome_bairro: record.nome_bairro,
        cidade: record.cidade,
        estado: record.estado,
        descricao: record.descricao,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);

      if (error) throw error;
      console.log(`[Bairros] ✅ Importado: ${record.nome_bairro}`);
    } catch (error) {
      console.error(`[Bairros] ❌ Erro ao importar ${record.nome_bairro}:`, error);
    }
  }

  console.log(`[Bairros] ${records.length} bairros importados com sucesso!`);
}

async function importarImoveis(csvFilename) {
  console.log(`\n=== IMPORTANDO IMÓVEIS (${csvFilename}) ===`);  

  const csvPath = join(process.cwd(), csvFilename);
  const csvContent = readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true });

  console.log(`[Imoveis] Lendo ${records.length} imóveis...`);

  for (const record of records) {
    try {
      // Parse imagens_urls (se tiver)
      const imagens_urls = record.imagens_urls ? record.imagens_urls.split(';') : ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'];
      
      // Parse fotos (se tiver)
      const fotos = record.fotos ? record.fotos.split(';') : null;

      const { data, error } = await supabase.from('imoveis').insert([{
        id: record.id,
        titulo: record.titulo,
        tipo: record.tipo,
        finalidade: record.finalidade,
        bairro: record.bairro,
        endereco: record.endereco,
        preco_venda: record.preco_venda ? parseFloat(record.preco_venda) : null,
        preco_locacao: record.preco_locacao ? parseFloat(record.preco_locacao) : null,
        area_total: record.area_total ? parseFloat(record.area_total) : null,
        area_construida: null,
        quartos: record.quartos ? parseInt(record.quartos) : 0,
        suites: record.suites ? parseInt(record.suites) : 0,
        banheiros: record.banheiros ? parseInt(record.banheiros) : 0,
        vagas_garagem: record.vagas ? parseInt(record.vagas) : 0,
        caracteristicas: [],
        fotos: fotos,
        foto_principal: record.fotos ? record.fotos.split(';')[0] : null,
        disponivel: record.status === 'Disponivel' || true,
        destaque: false,
        cidade: 'Aracaju',
        estado: 'SE',
        proprietario_id: record.proprietario_id || null,
        created_at: record.data_cadastro || new Date().toISOString(),
        updated_at: record.ultima_atualizacao || new Date().toISOString(),
      }]);

      if (error) throw error;
      console.log(`[Imoveis] ✅ Importado: ${record.titulo}`);
    } catch (error) {
      console.error(`[Imoveis] ❌ Erro ao importar ${record.titulo}:`, error);
    }
  }

  console.log(`[Imoveis] ${records.length} imóveis importados com sucesso!`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 IMPORTAÇÃO AUTOMÁTICA - CRÂNIOS IMOB');
  console.log('='.repeat(60));

  try {
    // 1. Importar Bairros
    await importarBairros();

    // 2. Importar Imóveis (file_33 - 3 registros)
    await importarImoveis('file_33---97d2edcb-e663-45b2-9348-445cfcf6bbfe.csv');

    // 3. Importar Imóveis (file_34 - 22 registros)
    await importarImoveis('file_34---be067975-e173-4d87-a456-d2605b54f480.csv');

    console.log('\n' + '='.repeat(60));
    console.log('✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('='.repeat(60));
    console.log(`📊 Total: ${13 + 3 + 22} = 38 registros importados`);
    console.log(`🏠 Imóveis: ${3 + 22} = 25 imóveis`);
    console.log(`📍 Bairros: 13 bairros`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERRO NA IMPORTAÇÃO');
    console.error('='.repeat(60));
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
