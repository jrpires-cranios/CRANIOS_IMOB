// Script de importação completa de todos os CSVs (8 tabelas)
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://rbhkwmesmvytqdfuwcie.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiaGt3bWVzbXZ5dHFkZnV3Y2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ0ODUsImV4cCI6MjA4NTM5MDQ0NX0.vHffPyFGC99OhYpfeGihf59oGhIguVwKfQagySAyTck'
);

async function importarCSV(csvFilename, nomeTabela, mapeamentoCampos) {
  console.log(`\n=== IMPORTANDO ${nomeTabela.toUpperCase()} (${csvFilename}) ===`);
  
  const csvContent = readFileSync(csvFilename, 'utf-8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true });

  console.log(`[${nomeTabela}] Lendo ${records.length} registros...`);

  let sucesso = 0;
  let erros = 0;

  for (const record of records) {
    try {
      const dados = {};
      for (const [campoOrigem, campoDestino] of Object.entries(mapeamentoCampos)) {
        dados[campoDestino] = record[campoOrigem];
      }

      if (!dados.created_at) dados.created_at = new Date().toISOString();
      if (!dados.updated_at) dados.updated_at = new Date().toISOString();

      const { data, error } = await supabase.from(nomeTabela).insert([dados]);

      if (error) throw error;

      sucesso++;
      console.log(`[${nomeTabela}] OK - Registro ${sucesso}/${records.length}`);
    } catch (error) {
      erros++;
      console.error(`[${nomeTabela}] ERRO - Registro ${sucesso + erros}: ${error.message}`);
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

async function main() {
  console.log('='.repeat(60));
  console.log('IMPORTAÇÃO COMPLETA DE CSVs (8 Tabelas)');
  console.log('='.repeat(60));

  try {
    // 1. Lancamentos (26 registros)
    const lancamentos = await importarCSV(
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

    // 2. Contratos (12 registros)
    const contratos = await importarCSV(
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

    // 3. Clientes (12 registros)
    const clientes = await importarCSV(
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

    // 4. Proprietários (10 registros)
    const proprietarios = await importarCSV(
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

    // 5. Corretores (7 registros)
    const corretores = await importarCSV(
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

    // 6. Bairros (13 registros)
    const bairros = await importarCSV(
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

    // 7. Imoveis (3 registros)
    const imoveis1 = await importarCSV(
      'file_33---97d2edcb-e663-45b2-9348-445cfcf6bbfe.csv',
      'imoveis',
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
        'area_construida': null,
        'quartos': 'quartos',
        'suites': 'suites',
        'banheiros': 'banheiros',
        'vagas': 'vagas',
        'caracteristicas': [],
        'fotos': null,
        'foto_principal': null,
        'disponivel': true,
        'destaque': false,
        'cidade': 'Aracaju',
        'estado': 'SE',
        'proprietario_id': 'proprietario_id',
      }
    );

    // 8. Mais Imoveis (22 registros)
    const imoveis2 = await importarCSV(
      'file_34---be067975-e173-4d87-a456-d2605b54f480.csv',
      'imoveis',
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
        'area_construida': null,
        'quartos': 'quartos',
        'suites': 'suites',
        'banheiros': 'banheiros',
        'vagas': 'vagas',
        'caracteristicas': [],
        'fotos': 'fotos',
        'foto_principal': 'fotos',
        'disponivel': 'status',
        'destaque': true,
        'cidade': 'Aracaju',
        'estado': 'SE',
        'proprietario_id': 'proprietario_id',
      }
    );

    console.log('\n' + '='.repeat(60));
    console.log('IMPORTACAO COMPLETA CONCLUIDA COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('Tabelas importadas: 8');
    console.log(`- Lancamentos: ${lancamentos.sucesso}/${lancamentos.total}`);
    console.log(`- Contratos: ${contratos.sucesso}/${contratos.total}`);
    console.log(`- Clientes: ${clientes.sucesso}/${clientes.total}`);
    console.log(`- Proprietarios: ${proprietarios.sucesso}/${proprietarios.total}`);
    console.log(`- Corretores: ${corretores.sucesso}/${corretores.total}`);
    console.log(`- Bairros: ${bairros.sucesso}/${bairros.total}`);
    console.log(`- Imoveis 1: ${imoveis1.sucesso}/${imoveis1.total}`);
    console.log(`- Imoveis 2: ${imoveis2.sucesso}/${imoveis2.total}`);
    console.log(`- TOTAL: ${lancamentos.sucesso + contratos.sucesso + clientes.sucesso + proprietarios.sucesso + corretores.sucesso + bairros.sucesso + imoveis1.sucesso + imoveis2.sucesso}/${lancamentos.total + contratos.total + clientes.total + proprietarios.total + corretores.total + bairros.total + imoveis1.total + imoveis2.total} registros`);
    console.log('='.repeat(60));

    console.log('\nDados importados com sucesso!');
    console.log('Voce pode testar os endpoints:');
    console.log('- http://92.246.130.18:3002/api/imoveis/destaque?limit=10');
    console.log('- http://92.246.130.18:3002/api/contratos');
    console.log('- http://92.246.130.18:3002/api/clientes');
    console.log('- http://92.246.130.18:3002/api/proprietarios');
    console.log('- http://92.246.130.18:3002/api/corretores');
    console.log('- http://92.246.130.18:3002/api/bairros');
    console.log('- http://92.246.130.18:3002/api/lancamentos');
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('ERRO FATAL NA IMPORTAÇÃO COMPLETA');
    console.error('='.repeat(60));
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
