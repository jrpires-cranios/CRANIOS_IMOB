import { pineconeService } from '../services/pinecone.service.js';
import { EMPREENDIMENTOS_DATABASE, EmpreendimentoKnowledge } from '../knowledge/lancamentos-premium.js';

/**
 * Script para popular base de conhecimento Pinecone com empreendimentos de lançamento
 * Execute: npx tsx scripts/populate-lancamentos-knowledge.ts
 */

async function popularConhecimentoLancamentos() {
    console.log('🏢 Populando base de conhecimento - Lançamentos Premium\n');

    try {
        let totalDocs = 0;

        for (const emp of EMPREENDIMENTOS_DATABASE) {
            console.log(`\n📋 Processando: ${emp.nome}`);
            console.log(`   Localização: ${emp.local}`);
            console.log(`   Categoria: ${emp.categoria}\n`);

            // 1. Documento: Resumo Executivo
            await pineconeService.upsertDocument(
                `lancamento_${emp.nome.toLowerCase().replace(/\s+/g, '_')}_resumo`,
                `${emp.nome} - ${emp.resumo_executivo}`,
                {
                    text: emp.resumo_executivo,
                    source: emp.arquivo_pdf,
                    agente: 'gabriel',
                    tipo: 'lancamento',
                    empreendimento: emp.nome,
                    categoria: emp.categoria
                },
                'gabriel_lancamentos'
            );
            totalDocs++;
            console.log('   ✅ Resumo executivo');

            // 2. Documento: Plantas e Opções
            const plantasText = emp.plantas.map(p =>
                `${p.tipo}: ${p.area}, ${p.config}. Ideal para: ${p.ideal_para}. ${p.preco_base || ''}`
            ).join(' | ');

            await pineconeService.upsertDocument(
                `lancamento_${emp.nome.toLowerCase().replace(/\s+/g, '_')}_plantas`,
                `${emp.nome} oferece as seguintes opções: ${plantasText}`,
                {
                    text: plantasText,
                    source: emp.arquivo_pdf,
                    agente: 'gabriel',
                    tipo: 'lancamento_plantas',
                    empreendimento: emp.nome
                },
                'gabriel_lancamentos'
            );
            totalDocs++;
            console.log('   ✅ Plantas e opções');

            // 3. Documento: Localização
            const localizacaoText = `${emp.nome} está localizado em ${emp.localizacao.endereco}, ${emp.localizacao.bairro}. 
${emp.localizacao.diferencial}. Proximidades: ${emp.localizacao.proximidades.join(', ')}. Vista: ${emp.localizacao.vista}`;

            await pineconeService.upsertDocument(
                `lancamento_${emp.nome.toLowerCase().replace(/\s+/g, '_')}_localizacao`,
                localizacaoText,
                {
                    text: localizacaoText,
                    source: emp.arquivo_pdf,
                    agente: 'gabriel',
                    tipo: 'lancamento_localizacao',
                    empreendimento: emp.nome,
                    bairro: emp.localizacao.bairro
                },
                'gabriel_lancamentos'
            );
            totalDocs++;
            console.log('   ✅ Localização');

            // 4. Documento: Investimento/ROI
            const investimentoText = `${emp.nome}: ${emp.investimento.faixa_preco}. ROI: ${emp.investimento.roi_mensal}. 
Aluguel estimado: ${emp.investimento.aluguel_estimado}. Valorização: ${emp.investimento.valorizacao_estimada}`;

            await pineconeService.upsertDocument(
                `lancamento_${emp.nome.toLowerCase().replace(/\s+/g, '_')}_investimento`,
                investimentoText,
                {
                    text: investimentoText,
                    source: emp.arquivo_pdf,
                    agente: 'gabriel',
                    tipo: 'lancamento_investimento',
                    empreendimento: emp.nome
                },
                'gabriel_lancamentos'
            );
            totalDocs++;
            console.log('   ✅ Investimento/ROI');

            // 5. Documento: Diferenciais
            const diferenciaisText = `${emp.nome} se destaca por: ${emp.diferenciais.join('. ')}`;

            await pineconeService.upsertDocument(
                `lancamento_${emp.nome.toLowerCase().replace(/\s+/g, '_')}_diferenciais`,
                diferenciaisText,
                {
                    text: diferenciaisText,
                    source: emp.arquivo_pdf,
                    agente: 'gabriel',
                    tipo: 'lancamento_diferenciais',
                    empreendimento: emp.nome
                },
                'gabriel_lancamentos'
            );
            totalDocs++;
            console.log('   ✅ Diferenciais');

            // 6. AMANDA: Qualificação - Personas
            const personasText = `Para ${emp.nome}, as personas alvo são: ${emp.qualificacao.personas_alvo.join('. ')}`;

            await pineconeService.upsertDocument(
                `qualificacao_${emp.nome.toLowerCase().replace(/\s+/g, '_')}_personas`,
                personasText,
                {
                    text: personasText,
                    source: emp.arquivo_pdf,
                    agente: 'amanda',
                    tipo: 'qualificacao_personas',
                    empreendimento: emp.nome
                },
                'amanda_qualificacao'
            );
            totalDocs++;
            console.log('   ✅ Qualificação - Personas (Amanda)');

            // 7. AMANDA: Qualificação - Perguntas
            const perguntasText = `Perguntas investigativas para ${emp.nome}: ${emp.qualificacao.perguntas_investigativas.join(' | ')}`;

            await pineconeService.upsertDocument(
                `qualificacao_${emp.nome.toLowerCase().replace(/\s+/g, '_')}_perguntas`,
                perguntasText,
                {
                    text: perguntasText,
                    source: emp.arquivo_pdf,
                    agente: 'amanda',
                    tipo: 'qualificacao_script',
                    empreendimento: emp.nome
                },
                'amanda_qualificacao'
            );
            totalDocs++;
            console.log('   ✅ Qualificação - Perguntas (Amanda)');

            // 8. AMANDA: Critérios 9.5+
            const criteriosText = `Critérios 9.5+ para ${emp.nome}: ${emp.qualificacao.criterios_9_5.join('. ')}`;

            await pineconeService.upsertDocument(
                `qualificacao_${emp.nome.toLowerCase().replace(/\s+/g, '_')}_criterios`,
                criteriosText,
                {
                    text: criteriosText,
                    source: emp.arquivo_pdf,
                    agente: 'amanda',
                    tipo: 'qualificacao_criterios',
                    empreendimento: emp.nome
                },
                'amanda_qualificacao'
            );
            totalDocs++;
            console.log('   ✅ Qualificação - Critérios (Amanda)');

            // 9. GABRIEL: Quebra de Objeções
            emp.vendas.quebra_objecoes.forEach((obj, idx) => {
                const objText = `Objeção: ${obj.objecao}. Resposta: ${obj.resposta}`;

                pineconeService.upsertDocument(
                    `vendas_${emp.nome.toLowerCase().replace(/\s+/g, '_')}_objecao_${idx}`,
                    objText,
                    {
                        text: objText,
                        source: emp.arquivo_pdf,
                        agente: 'gabriel',
                        tipo: 'vendas_objecao',
                        empreendimento: emp.nome
                    },
                    'gabriel_lancamentos'
                );
            });
            totalDocs += emp.vendas.quebra_objecoes.length;
            console.log(`   ✅ Quebra de objeções (${emp.vendas.quebra_objecoes.length} itens)`);

            // 10. GABRIEL: Gatilhos Emocionais
            const gatilhosText = `Gatilhos emocionais ${emp.nome}: ${emp.vendas.gatilhos_emocionais.join('. ')}`;

            await pineconeService.upsertDocument(
                `vendas_${emp.nome.toLowerCase().replace(/\s+/g, '_')}_gatilhos`,
                gatilhosText,
                {
                    text: gatilhosText,
                    source: emp.arquivo_pdf,
                    agente: 'gabriel',
                    tipo: 'vendas_gatilhos',
                    empreendimento: emp.nome
                },
                'gabriel_lancamentos'
            );
            totalDocs++;
            console.log('   ✅ Gatilhos emocionais');
        }

        console.log('\n🎉 POPULAÇÃO COMPLETA!');
        console.log(`\n📊 Resumo:`);
        console.log(`   Empreendimentos processados: ${EMPREENDIMENTOS_DATABASE.length}`);
        console.log(`   Documentos criados: ${totalDocs}`);
        console.log(`   Namespaces: amanda_qualificacao, gabriel_lancamentos\n`);

        console.log('✅ Base de conhecimento pronta para uso!\n');
        console.log('📝 Próximos passos:');
        console.log('   1. Ativar agentes Amanda e Gabriel no chat');
        console.log('   2. Testar qualificação com perguntas sobre lançamentos');
        console.log('   3. Adicionar outros 5 empreendimentos no arquivo lancamentos-premium.ts\n');

    } catch (error: any) {
        console.error('❌ ERRO:', error.message);
        process.exit(1);
    }
}

// Executar
popularConhecimentoLancamentos();
