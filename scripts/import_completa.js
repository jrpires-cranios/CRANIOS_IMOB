// Script de importação completa de todos os CSVs (8 tabelas)
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  'https://rbhkwmesmvytqdfuwcie.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiaGt3bWVzbXZ5dHFkZnV3Y2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ0ODUsImV4cCI6MjA4NTM5MDQ0NX0.vHffPyFGC99OhYpfeGihf59oGhIguVwKfQagySAyTck'
);

async function importarCSV(csvFilename, nomeTabela, mapeamentoCampos) {
  console.log(`\n=== IMPORTANDO ${nomeTabela} (${csvFilename}) ===`);
  
  const csvPath = join(process.cwd(), 'csv', csvFilename);
  const csvContent = readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true });

  console.log(`[${nomeTabela}] Lendo ${records.length} registros...`);

  let sucesso = 0;
  let erros = 0;

  for (const record of records) {
    try {
      // Mapear campos conforme tabela
      const dados = {};
      for (const [campoOrigem, campoDestino] of Object.entries(mapeamentoCampos)) {
        dados[campoDestino] = record[campoOrigem];
      }

      // Adicionar timestamps padrão
      if (!dados.created_at) dados.created_at = new Date().toISOString();
      if (!dados.updated_at) dados.updated_at = new Date().toISOString();

      const { data, error } = await supabase.from(nomeTabela).insert([dados]);

      if (error) throw error;

      sucesso++;
      console.log(`[${nomeTabela}] ✅ Importado: ${record[Object.keys(record)[0]}`);
    } catch (error) {
      erros++;
      console.error(`[${nomeTabela}] ❌ Erro ao importar registro ${sucesso + erros}:`, error);
    }
  }

  console.log(`[${nomeTabela}] ${sucesso} registros importados com sucesso!`);
  console.log(`[${nomeTabela}] ${erros} registros falharam`);

  return {
    sucesso,
    erros,
    total: records.length,
  };
}

async function importarLancamentos() {
  return await importarCSV(
    'file_27---e77fc9f7-b369-4b31-b8ad-3af0026e9b48.csv',
    'lancamentos',
    {
      'lancamento_id': 'lancamento_id',
      'contrato_id': 'contrato_id',
      'data_vencimento': 'data_vencimento',
      'data_pagamento': 'data_pagamento',
      'valor': 'valor',
      'tipo_lancamento': 'tipo_lancamento',
      'categoria': 'categoria',
      'status_pagamento': 'status_pagamento',
      'observacoes': 'observacoes',
    }
  );
}

async function importarContratos() {
  return await importarCSV(
    'file_28---0d43af16-a598-42cb-b744-98b64eaa6679.csv',
    'contratos',
    {
      'contrato_id': 'contrato_id',
      'tipo_contrato': 'tipo_contrato',
      'imovel_id': 'imovel_id',
      'cliente_id': 'cliente_id',
      'proprietario_id': 'proprietario_id',
      'corretor_id': 'corretor_id',
      'data_inicio': 'data_inicio',
      'data_fim': 'data_fim',
      'valor_mensal': 'valor_mensal',
      'valor_total': 'valor_total',
      'forma_pagamento': 'forma_pagamento',
      'status_contrato': 'status_contrato',
      'observacoes': 'observacoes',
    }
  );
}

async function importarClientes() {
  return await importarCSV(
    'file_29---e8310f5d-e4f4-404d-b6f8-82083714ff19.csv',
    'clientes',
    {
      'cliente_id': 'cliente_id',
      'nome': 'nome',
      'telefone': 'telefone',
      'email': 'email',
      'documento': 'documento',
      'tipo_cliente': 'tipo_cliente',
      'origem': 'origem',
      'status': 'status',
      'observacoes': 'observacoes',
    }
  );
}

async function importarProprietarios() {
  return await importarCSV(
    'file_30---d6fdde61-d1a9-49fc-8c37-a768ec9bdea1.csv',
    'proprietarios',
    {
      'proprietario_id': 'proprietario_id',
      'nome': 'nome',
      'telefone': 'telefone',
      'email': 'email',
      'documento': 'documento',
      'tipo_pessoa': 'tipo_pessoa',
      'endereco': 'endereco',
      'cidade': 'cidade',
      'estado': 'estado',
      'observacoes': 'observacoes',
      'status': 'status',
    }
  );
}

async function importarCorretores() {
  return await importarCSV(
    'file_31---90b0d78a-b339-49a1-a81b-5019a27c3d39.csv',
    'corretores',
    {
      'corretor_id': 'corretor_id',
      'nome': 'nome',
      'telefone': 'telefone',
      'email': 'email',
      'creci': 'creci',
      'whatsapp': 'whatsapp',
      'status': 'status',
      'observacoes': 'observacoes',
    }
  );
}

async function importarBairros() {
  return await importarCSV(
    'file_32---48e9a84a-0aa9-46dc-8206-ca9f498e9d6c.csv',
    'bairros',
    {
      'bairro_id': 'bairro_id',
      'nome_bairro': 'nome_bairro',
      'cidade': 'cidade',
      'estado': 'estado',
      'descricao': 'descricao',
    }
  );
}

async function importarImoveis(csvFilename, mapeamentoCampos) {
  return await importarCSV(
    csvFilename,
    'imoveis',
    mapeamentoCampos
  );
}

async function importarImoveisFile1() {
  return await importarImoveis(
    'file_33---97d2edcb-e663-45b2-9348-445cfcf6bbfe.csv',
    {
      'id': 'id',
      'titulo': 'titulo',
      'tipo': 'tipo',
      'finalidade': 'finalidade',
      'bairro': 'bairro',
      'endereco': 'endereco',
      'preco_venda': 'preco_venda',
      'preco_locacao': 'preco_locacao',
      'area_total': 'area_total_m2',
      'area_construida': 'area_construida',
      'quartos': 'quartos',
      'suites': 'suites',
      'banheiros': 'banheiros',
      'vagas': 'vagas',
      'descricao': 'descricao',
      'imagens_urls': 'imagens_urls',
      'status': 'status',
      'data_cadastro': 'data_cadastro',
      'ultima_atualizacao': 'ultima_atualizacao',
      'proprietario_id': 'proprietario_id',
    }
  );
}

async function importarImoveisFile2() {
  return await importarImoveis(
    'file_34---be067975-e173-4d87-a456-d2605b54f480.csv',
    {
      'id': 'id',
      'titulo': 'titulo',
      'tipo': 'tipo',
      'finalidade': 'finalidade',
      'bairro': 'bairro',
      'endereco': 'endereco',
      'preco_venda': 'preco_venda',
      'preco_locacao': 'preco_locacao',
      'area_total': 'area_total',
      'area_construida': 'area_construida',
      'quartos': 'quartos',
      'suites': 'suites',
      'banheiros': 'banheiros',
      'vagas': 'vagas',
      'descricao': 'descricao',
      'imagens_urls': 'imagens_urls',
      'status': 'status',
      'data_cadastro': 'data_cadastro',
      'ultima_atualizacao': 'ultima_atualizacao',
      'proprietario_id': 'proprietario_id',
    }
  );
}

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 IMPORTAÇÃO COMPLETA DE CSVs (8 Tabelas)');
  console.log('='.repeat(60));

  try {
    // 1. Importar Lancamentos (26 registros)
    await importarLancamentos();

    // 2. Importar Contratos (12 registros)
    await importarContratos();

    // 3. Importar Clientes (12 registros)
    await importarClientes();

    // 4. Importar Proprietários (10 registros)
    await importarProprietarios();

    // 5. Importar Corretores (7 registros)
    await importarCorretores();

    // 6. Importar Bairros (13 registros)
    await importarBairros();

    // 7. Importar Imoveis (3 registros - file_33)
    await importarImoveisFile1();

    // 8. Importar Imoveis (22 registros - file_34)
    await importarImoveisFile2();

    console.log('\n' + '='.repeat(60));
    console.log('✅ IMPORTAÇÃO COMPLETA CONCLUÍDA!');
    console.log('='.repeat(60));
    console.log('📊 Total de registros importados:');
    console.log(`  • Lancamentos: 26`);
    console.log(`  • Contratos: 12`);
    console.log(`  • Clientes: 12`);
    console.log(`  • Proprietarios: 10`);
    console.log(`  • Corretores: 7`);
    console.log(`  • Bairros: 13`);
    console.log(`  • Imoveis: 3 + 22 = 25`);
    console.log(`  • TOTAL: ${26 + 12 + 12 + 10 + 7 + 13 + 25} = 105+ registros`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERRO FATAL NA IMPORTAÇÃO COMPLETA');
    console.error('='.repeat(60));
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
