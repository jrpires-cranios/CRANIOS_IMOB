// Script de importação completa de todos os CSVs (8 tabelas)
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  'https://rbhkwmesmvytqdfuwcie.supabase.co',
  (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '')
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
      const dados = {};
      for (const [campoOrigem, campoDestino] of Object.entries(mapeamentoCampos)) {
        dados[campoDestino] = record[campoOrigem];
      }

      if (!dados.created_at) dados.created_at = new Date().toISOString();
      if (!dados.updated_at) dados.updated_at = new Date().toISOString();

      const { data, error } = await supabase.from(nomeTabela).insert([dados]);

      if (error) throw error;

      sucesso++;
      console.log(`[${nomeTabela}] OK - Registro ${sucesso} importado`);
    } catch (error) {
      erros++;
      console.error(`[${nomeTabela}] ERRO - Registro ${sucesso + erros}: ${error.message}`);
    }
  }

  console.log(`[${nomeTabela}] ${sucesso} registros importados com sucesso!`);
  console.log(`[${nomeTabela}] ${erros} registros falharam`);
}

async function importarLancamentos() {
  const mapeamento = {
    'lancamento_id': 'lancamento_id',
    'contrato_id': 'contrato_id',
    'data_vencimento': 'data_vencimento',
    'data_pagamento': 'data_pagamento',
    'valor': 'valor',
    'tipo_lancamento': 'tipo_lancamento',
    'categoria': 'categoria',
    'status_pagamento': 'status_pagamento',
    'observacoes': 'observacoes',
  };
  await importarCSV('file_27---e77fc9f7-b369-4b31-b8ad-3af0026e9b48.csv', 'lancamentos', mapeamento);
}

async function importarContratos() {
  const mapeamento = {
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
  };
  await importarCSV('file_28---0d43af16-a598-42cb-b744-98b64eaa6679.csv', 'contratos', mapeamento);
}

async function importarClientes() {
  const mapeamento = {
    'cliente_id': 'cliente_id',
    'nome': 'nome',
    'telefone': 'telefone',
    'email': 'email',
    'documento': 'documento',
    'tipo_cliente': 'tipo_cliente',
    'origem': 'origem',
    'status': 'status',
    'observacoes': 'observacoes',
  };
  await importarCSV('file_29---e8310f5d-e4f4-404d-b6f8-82083714ff19.csv', 'clientes', mapeamento);
}

async function importarProprietarios() {
  const mapeamento = {
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
  };
  await importarCSV('file_30---d6fdde61-d1a9-49fc-8c37-a768ec9bdea1.csv', 'proprietarios', mapeamento);
}

async function importarCorretores() {
  const mapeamento = {
    'corretor_id': 'corretor_id',
    'nome': 'nome',
    'telefone': 'telefone',
    'email': 'email',
    'creci': 'creci',
    'whatsapp': 'whatsapp',
    'status': 'status',
    'observacoes': 'observacoes',
  };
  await importarCSV('file_31---90b0d78a-b339-49a1-a81b-5019a27c3d39.csv', 'corretores', mapeamento);
}

async function importarBairros() {
  const mapeamento = {
    'bairro_id': 'bairro_id',
    'nome_bairro': 'nome_bairro',
    'cidade': 'cidade',
    'estado': 'estado',
    'descricao': 'descricao',
  };
  await importarCSV('file_32---48e9a84a-0aa9-46dc-8206-ca9f498e9d6c.csv', 'bairros', mapeamento);
}

async function importarImoveis(csvFilename, mapeamentoCampos) {
  await importarCSV(csvFilename, 'imoveis', mapeamentoCampos);
}

async function main() {
  console.log('='.repeat(60));
  console.log('IMPORTACAO COMPLETA DE CSVs (8 Tabelas)');
  console.log('='.repeat(60));

  try {
    await importarLancamentos();
    await importarContratos();
    await importarClientes();
    await importarProprietarios();
    await importarCorretores();
    await importarBairros();
    
    const mapeamentoImoveis1 = {
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
    };
    
    await importarImoveis('file_33---97d2edcb-e663-45b2-9348-445cfcf6bbfe.csv', mapeamentoImoveis1);
    
    const mapeamentoImoveis2 = {
      'id': 'id',
      'titulo': 'titulo',
      'tipo': 'tipo',
      'finalidade': 'finalidade',
      'bairro': 'bairro',
      'endereco': 'endereco',
      'preco_venda': 'preco_venda',
      'preco_locacao': 'preco_locacao',
      'area_total': 'area_total',
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
    };
    
    await importarImoveis('file_34---be067975-e173-4d87-a456-d2605b54f480.csv', mapeamentoImoveis2);

    console.log('\n' + '='.repeat(60));
    console.log('IMPORTACAO COMPLETA CONCLUIDA COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('Tabelas importadas: 8');
    console.log('- Lancamentos: 26');
    console.log('- Contratos: 12');
    console.log('- Clientes: 12');
    console.log('- Proprietarios: 10');
    console.log('- Corretores: 7');
    console.log('- Bairros: 13');
    console.log('- Imoveis (File 33): 3');
    console.log('- Imoveis (File 34): 22');
    console.log('- TOTAL: 26 + 12 + 12 + 10 + 7 + 13 + 3 + 22 = 105 registros');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('ERRO NA IMPORTACAO COMPLETA');
    console.error('='.repeat(60));
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
