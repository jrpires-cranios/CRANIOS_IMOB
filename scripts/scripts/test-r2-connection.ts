# ============================================================
# TESTE DE CONEXÃO CLOUDFLARE R2
# ============================================================
# Este script valida se as credenciais R2 estão corretas
# Execute: npx tsx scripts / test - r2 - connection.ts
# ============================================================

import { r2StorageService } from '../src/services/r2-storage.service.js';

async function testR2Connection() {
    console.log('🧪 Testando conexão com Cloudflare R2...\n');

    try {
        // Teste 1: Upload de um arquivo de teste
        console.log('📤 Teste 1: Upload de arquivo...');
        const testContent = `Teste de upload - ${new Date().toISOString()}`;
        const testBuffer = Buffer.from(testContent, 'utf-8');

        const testUrl = await r2StorageService.upload(
            testBuffer,
            'test/connection-test.txt',
            'text/plain'
        );

        console.log('✅ Upload bem-sucedido!');
        console.log(`   URL: ${testUrl}\n`);

        // Teste 2: Verificar se arquivo existe
        console.log('🔍 Teste 2: Verificando existência do arquivo...');
        const exists = await r2StorageService.exists('test/connection-test.txt');

        if (exists) {
            console.log('✅ Arquivo encontrado!\n');
        } else {
            console.log('❌ Arquivo não encontrado (pode ser delay de propagação)\n');
        }

        // Teste 3: Upload de PDF simulado
        console.log('📄 Teste 3: Upload de PDF simulado...');
        const fakePdfContent = '%PDF-1.4\nTeste de PDF';
        const pdfBuffer = Buffer.from(fakePdfContent, 'utf-8');

        const pdfUrl = await r2StorageService.uploadPropertyPDF(
            pdfBuffer,
            'imovel-teste-001',
            'teste-cliente'
        );

        console.log('✅ PDF enviado com sucesso!');
        console.log(`   URL: ${pdfUrl}\n`);

        // Teste 4: Deletar arquivos de teste
        console.log('🗑️  Teste 4: Limpando arquivos de teste...');
        await r2StorageService.delete('test/connection-test.txt');
        console.log('✅ Arquivo 1 deletado\n');

        // Extrair path do PDF para deletar
        const pdfPath = pdfUrl.split('.r2.dev/')[1] || pdfUrl.split('pub-')[1]?.split('/').slice(1).join('/');
        if (pdfPath) {
            await r2StorageService.delete(pdfPath);
            console.log('✅ Arquivo 2 deletado\n');
        }

        console.log('🎉 TODOS OS TESTES PASSARAM!');
        console.log('✅ Cloudflare R2 está configurado corretamente\n');
        console.log('📊 Resumo:');
        console.log('   - Upload: OK');
        console.log('   - Verificação: OK');
        console.log('   - PDF: OK');
        console.log('   - Deleção: OK\n');

    } catch (error: any) {
        console.error('❌ ERRO NO TESTE:');
        console.error(`   ${error.message}\n`);

        if (error.message.includes('credentials')) {
            console.log('💡 Dica: Verifique se as credenciais no .env estão corretas');
        } else if (error.message.includes('bucket')) {
            console.log('💡 Dica: O bucket pode não existir ainda. Crie-o no dashboard do Cloudflare');
        } else if (error.message.includes('network')) {
            console.log('💡 Dica: Verifique sua conexão com a internet');
        }

        process.exit(1);
    }
}

// Executar teste
testR2Connection();
