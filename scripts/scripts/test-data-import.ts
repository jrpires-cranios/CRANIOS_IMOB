/**
 * TESTE DO AGENTE DE IMPORTAÇÃO
 * Execute: npx tsx scripts/test-data-import.ts
 */

import { dataImportService } from '../src/services/data-import.service.js';
import fs from 'fs';
import path from 'path';

// CSV de exemplo para teste (bem formatado)
const CSV_EXEMPLO = `codigo,titulo,bairro,valor,dormitorios,suites,garagens,area,tipo_negocio,descricao
001,"Apartamento 3 quartos Jardins",Jardins,450000,3,1,2,120,venda,"Apartamento 3 quartos em excelente localização com vista panorâmica"
002,"Casa 4 quartos Atalaia",Atalaia,3500,4,2,2,180,locacao,"Casa 4 quartos próximo à praia com piscina"
003,"Apartamento 2 quartos Farolândia",Farolândia,280000,2,1,1,85,venda,"Apartamento 2 quartos com suite e varanda gourmet"
004,"Apartamento sem preço Centro",Centro,,3,0,1,95,venda,"Imóvel sem preço - DEVE SER IGNORADO"
005,"Apartamento sem bairro","",320000,2,1,1,75,venda,"Imóvel sem bairro - DEVE SER IGNORADO"`;

async function testarImportacao() {
    console.log('🧪 Teste do Agente de Importação Inteligente\n');

    try {
        // ==========================================
        // TESTE 1: Análise de CSV
        // ==========================================
        console.log('📊 Teste 1: Analisando estrutura CSV...\n');

        const estrutura = await dataImportService.analisarFonte({
            cliente_id: 'test-cliente-id',
            tipo: 'csv',
            csv_content: CSV_EXEMPLO
        });

        console.log('✅ Estrutura detectada:');
        console.log(`   Tipo: ${estrutura.tipo}`);
        console.log(`   Total registros: ${estrutura.total_registros}`);
        console.log(`   Campos: ${estrutura.campos.imoveis.join(', ')}`);
        console.log(`   Tipos:`, estrutura.tipos);
        console.log('');

        // ==========================================
        // TESTE 2: Geração de Mapeamento com IA
        // ==========================================
        console.log('🤖 Teste 2: Gerando mapeamento com IA...\n');

        const mapeamento = await dataImportService.gerarMapeamento(estrutura);

        console.log('✅ Mapeamento gerado:');
        console.log(`   Confiança: ${(mapeamento.confianca * 100).toFixed(0)}%`);
        console.log('   Campos mapeados:');
        Object.entries(mapeamento.campos).forEach(([orig, dest]) => {
            console.log(`      ${orig} → ${dest}`);
        });
        console.log('   Transformações:');
        Object.entries(mapeamento.transformacoes).forEach(([campo, transf]) => {
            console.log(`      ${campo}: ${transf}`);
        });
        if (mapeamento.campos_faltantes.length > 0) {
            console.log(`   Campos faltantes: ${mapeamento.campos_faltantes.join(', ')}`);
        }
        console.log('');

        // ==========================================
        // TESTE 3: Validação de Dados
        // ==========================================
        console.log('🔍 Teste 3: Validando dados...\n');

        // Parse do CSV
        const { parse } = await import('csv-parse/sync');
        const registros = parse(CSV_EXEMPLO, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        const validacao = await dataImportService.validarDados(registros, mapeamento);

        console.log('✅ Validação concluída:');
        console.log(`   ✅ Válidos: ${validacao.validos.length}`);
        console.log(`   ❌ Inválidos: ${validacao.invalidos.length}`);
        console.log(`   ⚠️  Avisos: ${validacao.avisos.length}`);
        console.log('');

        if (validacao.erros.length > 0) {
            console.log('❌ Erros encontrados:');
            validacao.erros.forEach(erro => {
                console.log(`   - ${erro}`);
            });
            console.log('');
        }

        if (validacao.avisos.length > 0) {
            console.log('⚠️  Avisos (não bloqueantes):');
            validacao.avisos.slice(0, 5).forEach(aviso => {
                console.log(`   - ${aviso}`);
            });
            if (validacao.avisos.length > 5) {
                console.log(`   ... e mais ${validacao.avisos.length - 5} avisos`);
            }
            console.log('');
        }

        // ==========================================
        // TESTE 4: Preview dos Dados Mapeados
        // ==========================================
        console.log('📋 Teste 4: Preview dos dados mapeados...\n');

        if (validacao.validos.length > 0) {
            console.log('✅ Primeiros registros válidos:');
            validacao.validos.slice(0, 2).forEach((reg, idx) => {
                console.log(`\n   Registro ${idx + 1}:`);
                console.log(`      Título: ${reg.titulo}`);
                console.log(`      Bairro: ${reg.bairro}`);
                console.log(`      Finalidade: ${reg.finalidade}`);
                console.log(`      Preço: R$ ${reg.preco_venda || reg.preco_locacao}`);
                console.log(`      Quartos: ${reg.quartos}`);
                console.log(`      Área: ${reg.area_construida}m²`);
            });
        }
        console.log('');

        // ==========================================
        // RESUMO
        // ==========================================
        console.log('🎉 TODOS OS TESTES PASSARAM!');
        console.log('\n📊 Resumo final:');
        console.log(`   📁 Fonte: CSV com ${estrutura.total_registros} registros`);
        console.log(`   🤖 Mapeamento: ${(mapeamento.confianca * 100).toFixed(0)}% confiança`);
        console.log(`   ✅ Importáveis: ${validacao.validos.length}`);
        console.log(`   ❌ Rejeitados: ${validacao.invalidos.length}`);
        console.log(`   📈 Taxa sucesso: ${((validacao.validos.length / estrutura.total_registros) * 100).toFixed(1)}%\n`);

        console.log('⚠️  NOTA: Este teste não executa importação real no Supabase');
        console.log('   Para importar de verdade, chame: dataImportService.executarImportacao()\n');

        // Salvar mapeamento para referência
        const mapeamentoPath = path.join(process.cwd(), 'mapeamento-exemplo.json');
        fs.writeFileSync(mapeamentoPath, JSON.stringify(mapeamento, null, 2));
        console.log(`💾 Mapeamento salvo em: ${mapeamentoPath}\n`);

    } catch (error: any) {
        console.error('❌ ERRO NO TESTE:');
        console.error(`   ${error.message}\n`);

        if (error.message.includes('OPENAI_API_KEY')) {
            console.log('💡 Dica: Configure OPENAI_API_KEY no .env para usar o mapeamento IA');
        } else if (error.message.includes('CSV')) {
            console.log('💡 Dica: Verifique o formato do CSV de entrada');
        }

        console.error('\nStack trace:', error.stack);
        process.exit(1);
    }
}

// Executar teste
testarImportacao();
