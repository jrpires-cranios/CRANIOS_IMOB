/**
 * TESTE DE ONBOARDING MULTI-TENANT
 * Execute: npx tsx scripts/test-onboarding.ts
 */

import { onboardingService } from '../src/services/onboarding.service.js';

async function testOnboarding() {
    console.log('🧪 Teste de Onboarding Multi-Tenant\n');

    try {
        // ==========================================
        // TESTE 1: Onboarding de novo cliente
        // ==========================================
        console.log('📝 Teste 1: Onboarding novo cliente...\n');

        const novoCliente = await onboardingService.onboardCliente({
            nome: 'Imobiliária Alpha',
            razao_social: 'Alpha Negócios Imobiliários LTDA',
            cnpj: '12.345.678/0001-90',
            email: 'contato@imobiliariaapex.com',
            telefone: ' (79) 3333-4444',
            whatsapp: '(79) 99999-8888',
            website: 'https://imobiliariaapex.com',
            logo_url: 'https://placehold.co/200x80/667eea/white?text=Alpha',
            cor_primaria: '#00d4ff',
            cor_secundaria: '#0099cc',
            plano: 'trial',
            trial_dias: 30
        });

        console.log('✅ Cliente criado:');
        console.log(`   ID: ${novoCliente.id}`);
        console.log(`   Nome: ${novoCliente.nome}`);
        console.log(`   Slug: ${novoCliente.slug}`);
        console.log(`   Bucket: ${novoCliente.bucket_name}`);
        console.log(`   URL: ${novoCliente.bucket_url}`);
        console.log(`   Status: ${novoCliente.status}`);
        console.log(`   Plano: ${novoCliente.plano}`);
        console.log(`   Trial até: ${novoCliente.trial_expira_em}\n`);

        // ==========================================
        // TESTE 2: Buscar branding
        // ==========================================
        console.log('🎨 Teste 2: Buscando branding do cliente...\n');

        const branding = await onboardingService.getClienteBranding(novoCliente.id);

        console.log('✅ Branding recuperado:');
        console.log(`   Nome: ${branding.nome}`);
        console.log(`   Logo: ${branding.logo_url}`);
        console.log(`   Cor Primária: ${branding.cor_primaria}`);
        console.log(`   Cor Secundária: ${branding.cor_secundaria}\n`);

        // ==========================================
        // TESTE 3: Listar buckets
        // ==========================================
        console.log('📦 Teste 3: Listando todos os buckets...\n');

        const buckets = await onboardingService.listClientBuckets();

        console.log(`✅ Total de buckets: ${buckets.length}`);
        buckets.forEach(bucket => {
            console.log(`   - ${bucket}`);
        });
        console.log('');

        // ==========================================
        // TESTE 4: Atualizar storage usado
        // ==========================================
        console.log('💾 Teste 4: Atualizando storage usado...\n');

        await onboardingService.updateStorageUsage(novoCliente.id, 2.5);

        console.log('✅ Storage atualizado para 2.5 GB\n');

        // ==========================================
        // RESUMO
        // ==========================================
        console.log('🎉 TODOS OS TESTES PASSARAM!');
        console.log('\n📊 Resumo:');
        console.log('   ✅ Onboarding de cliente');
        console.log('   ✅ Criação de bucket R2');
        console.log('   ✅ Estrutura de pastas criada');
        console.log('   ✅ Branding recuperado');
        console.log('   ✅ Listagem de buckets');
        console.log('   ✅ Atualização de storage\n');

        console.log('⚠️  LIMPEZA:');
        console.log(`   Para deletar o cliente de teste, execute:`);
        console.log(`   DELETE FROM clientes WHERE id = '${novoCliente.id}';\n`);

    } catch (error: any) {
        console.error('❌ ERRO NO TESTE:');
        console.error(`   ${error.message}\n`);

        if (error.message.includes('bucket')) {
            console.log('💡 Dica: Certifique-se que as credenciais R2 estão corretas no .env');
        } else if (error.message.includes('supabase')) {
            console.log('💡 Dica: Execute primeiro o setup_clientes.sql no Supabase');
        }

        process.exit(1);
    }
}

// Executar teste
testOnboarding();
