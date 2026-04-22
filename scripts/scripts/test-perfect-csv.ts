/**
 * TESTE COM CSV 100% VÁLIDO
 * Execute: npx tsx scripts/test-perfect-csv.ts
 */

import { dataImportService } from '../src/services/data-import.service.js';
import { parse } from 'csv-parse/sync';

// CSV 100% válido - todos campos preenchidos corretamente
const CSV_PERFEITO = `codigo,titulo,bairro,cidade,estado,finalidade,preco,tipo,quartos,suites,banheiros,vagas_garagem,area_construida,area_terreno,condominio,iptu,descricao,foto_principal
001,"Apartamento 3 quartos Vista Mar Jardins",Jardins,Aracaju,SE,venda,450000,apartamento,3,1,2,2,120.5,0,0,1200,"Apartamento 3 quartos com suíte, 2 banheiros e 2 vagas de garagem. Vista panorâmica para o mar. Excelente localização próximo a shopping, escolas e hospitais. Prédio com piscina, academia e salão de festas.",https://exemplo.com/foto1.jpg
002,"Casa 4 quartos com Piscina Atalaia",Atalaia,Aracaju,SE,locacao,3500,casa,4,2,3,2,180,250,450,350,"Casa ampla 4 quartos sendo 2 suítes próxima à praia. Piscina, churrasqueira, área gourmet completa. Quintal gramado 250m². Condomínio fechado com segurança 24h.",https://exemplo.com/foto2.jpg
003,"Apartamento 2 quartos Farolândia",Farolândia,Aracaju,SE,venda,280000,apartamento,2,1,2,1,85,0,300,800,"Apartamento 2 quartos sendo 1 suíte. Varanda gourmet, cozinha planejada. Prédio novo com elevador, playground e espaço pet.",https://exemplo.com/foto3.jpg
004,"Cobertura 4 quartos Grageru",Grageru,Aracaju,SE,venda,950000,apartamento,4,3,4,3,220,0,850,1500,"Cobertura luxuosa 4 quartos sendo 3 suítes. Terraço 100m² com piscina privativa, churrasqueira e vista 360°. 3 vagas cobertas. Acabamento premium.",https://exemplo.com/foto4.jpg
005,"Casa 3 quartos Aruana",Aruana,Aracaju,SE,locacao,4500,casa,3,1,2,2,150,200,0,450,"Casa 150m² em condomínio fechado. 3 quartos sendo 1 suíte. Área de lazer completa: piscina, quadra e salão de festas. Próximo à praia.",https://exemplo.com/foto5.jpg`;

async function testarCSVPerfeito() {
    console.log('🧪 Teste com CSV 100% Válido\n');

    try {
        // ==========================================
        // TESTE 1: Análise
        // ==========================================
        console.log('📊 Passo 1: Analisando CSV...\n');

        const estrutura = await dataImportService.analisarFonte({
            cliente_id: 'test-cliente-id',
            tipo: 'csv',
            csv_content: CSV_PERFEITO
        });

        console.log('✅ Estrutura detectada:');
        console.log(`   Total registros: ${estrutura.total_registros}`);
        console.log(`   Campos: ${estrutura.campos.imoveis.length}`);
        console.log('');

        // ==========================================
        // TESTE 2: Mapeamento IA
        // ==========================================
        console.log('🤖 Passo 2: Gerando mapeamento com IA...\n');

        const mapeamento = await dataImportService.gerarMapeamento(estrutura);

        console.log(`✅ Mapeamento gerado (${(mapeamento.confianca * 100).toFixed(0)}% confiança)`);
        console.log(`   Campos mapeados: ${Object.keys(mapeamento.campos).length}`);
        console.log(`   Transformações: ${Object.keys(mapeamento.transformacoes).length}`);
        console.log(`   Campos faltantes: ${mapeamento.campos_faltantes.length}`);
        console.log('');

        // ==========================================
        // TESTE 3: Validação
        // ==========================================
        console.log('🔍 Passo 3: Validando dados...\n');

        const registros = parse(CSV_PERFEITO, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        const validacao = await dataImportService.validarDados(registros, mapeamento);

        console.log('✅ Validação concluída:');
        console.log(`   ✅ Válidos: ${validacao.validos.length}/${estrutura.total_registros}`);
        console.log(`   ❌ Inválidos: ${validacao.invalidos.length}`);
        console.log(`   📈 Taxa sucesso: ${((validacao.validos.length / estrutura.total_registros) * 100).toFixed(1)}%`);
        console.log('');

        if (validacao.erros.length > 0) {
            console.log('❌ Erros:');
            validacao.erros.forEach(erro => console.log(`   - ${erro}`));
            console.log('');
        }

        if (validacao.avisos.length > 0) {
            console.log(`⚠️  Avisos (${validacao.avisos.length}):`);
            console.log(`   Exemplo: "${validacao.avisos[0]}"`);
            console.log('');
        }

        // ==========================================
        // TESTE 4: Preview
        // ==========================================
        console.log('📋 Passo 4: Preview dos dados importáveis...\n');

        if (validacao.validos.length > 0) {
            validacao.validos.slice(0, 3).forEach((reg, idx) => {
                console.log(`✅ Registro ${idx + 1}:`);
                console.log(`   Título: ${reg.titulo}`);
                console.log(`   Bairro: ${reg.bairro}`);
                console.log(`   Tipo: ${reg.tipo} | Finalidade: ${reg.finalidade}`);
                console.log(`   Preço: R$ ${Number(reg.preco_venda || reg.preco_locacao).toLocaleString('pt-BR')}`);
                console.log(`   Área: ${reg.area_construida}m² | Quartos: ${reg.quartos} | Vagas: ${reg.vagas_garagem}`);
                console.log('');
            });

            if (validacao.validos.length > 3) {
                console.log(`   ... e mais ${validacao.validos.length - 3} imóveis\n`);
            }
        }

        // ==========================================
        // RESUMO FINAL
        // ==========================================
        console.log('🎉 RESULTADO FINAL:\n');
        console.log(`📊 Taxa de Sucesso: ${((validacao.validos.length / estrutura.total_registros) * 100).toFixed(1)}%`);
        console.log(`📁 Total registros: ${estrutura.total_registros}`);
        console.log(`✅ Importáveis: ${validacao.validos.length}`);
        console.log(`❌ Rejeitados: ${validacao.invalidos.length}`);
        console.log(`💰 Valor total estoque: R$ ${validacao.validos.reduce((sum, v) => sum + Number(v.preco_venda || v.preco_locacao || 0), 0).toLocaleString('pt-BR')}`);
        console.log('');

        if (validacao.validos.length === estrutura.total_registros) {
            console.log('🏆 PERFEITO! 100% dos dados foram validados com sucesso!\n');
        }

        // Salvar mapeamento
        const fs = await import('fs');
        const path = await import('path');
        const mapeamentoPath = path.join(process.cwd(), 'mapeamento-perfeito.json');
        fs.writeFileSync(mapeamentoPath, JSON.stringify({ estrutura, mapeamento, validacao: { total: validacao.validos.length, invalidos: validacao.invalidos.length } }, null, 2));
        console.log(`💾 Mapeamento salvo em: ${mapeamentoPath}\n`);

    } catch (error: any) {
        console.error('❌ ERRO:', error.message);
        throw error;
    }
}

// Executar
testarCSVPerfeito();
