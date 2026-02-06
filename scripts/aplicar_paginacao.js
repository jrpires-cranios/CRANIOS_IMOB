// Script para aplicar paginação completa no Backend
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const filePath = '/root/cranios-backend/src/index-simple.js';

console.log('='.repeat(60));
console.log('🚀 APLICANDO PAGINAÇÃO COMPLETA (Código que você enviou)');
console.log('='.repeat(60));

try {
    // 1. Ler o arquivo atual
    console.log('\n[1] Lendo arquivo atual...');
    let code = fs.readFileSync(filePath, 'utf-8');
    console.log(`✅ Arquivo lido (${code.length} bytes)`);

    // 2. Encontrar a rota `/api/imoveis`
    console.log('\n[2] Buscando rota /api/imoveis...');
    const rotaRegex = /app\.get\(['\"]\/api\/imoveis['\"]\s*,\s*async\s*\(req/g;
    const match = code.match(rotaRegex);
    
    if (!match) {
        console.error('❌ Rota /api/imoveis não encontrada!');
        process.exit(1);
    }
    
    console.log('✅ Rota encontrada');

    // 3. Encontrar o início da função handler
    console.log('\n[3] Buscando início do handler...');
    const handlerInicio = match.index + match[0].length;
    const handlerRegex = /\s*(const\s+{[^}]*\s*=\s*req\.query\;)/;
    const handlerMatch = code.substring(handlerInicio).match(handlerRegex);
    
    if (!handlerMatch) {
        console.error('❌ Handler não encontrado!');
        process.exit(1);
    }
    
    console.log('✅ Handler encontrado:', handlerMatch[1]);

    // 4. Remover código antigo (limit simples)
    console.log('\n[4] Removendo código antigo...');
    const handlerFim = handlerInicio + handlerMatch[0].length + handlerMatch[1].length;
    const proximaRotaRegex = /(\s*)(app\.(?:get|post|put|delete)\()/;
    const proximaRotaMatch = code.substring(handlerFim).match(proximaRotaRegex);
    
    if (!proximaRotaMatch) {
        console.error('❌ Próxima rota não encontrada!');
        process.exit(1);
    }
    
    const handlerCode = code.substring(handlerFim, handlerFim + proximaRotaMatch.index);
    console.log(`✅ Handler code (${handlerCode.length} bytes)`);

    // 5. Criar novo código com paginação completa
    console.log('\n[5] Criando novo código com paginação...');
    const novoCodigo = `    // Paginação completa (req.query.limit e req.query.offset)
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const { data: imoveis, error, count } = await supabase
      .from('imoveis')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1);
    
    return res.json({
      success: true,
      data: imoveis,
      pagination: {
        total: count,
        limit: limit,
        offset: offset,
        has_more: (offset + limit) < count
      }
    });`;

    // 6. Aplicar a substituição
    const novoArquivo = code.substring(0, handlerFim) + novoCodigo + code.substring(handlerFim + handlerCode.length);
    
    console.log('✅ Novo código criado');
    console.log(`✅ Tamanho antigo: ${code.length} bytes`);
    console.log(`✅ Tamanho novo: ${novoArquivo.length} bytes`);
    console.log(`✅ Diferença: ${novoArquivo.length - code.length} bytes`);

    // 7. Salvar o arquivo
    console.log('\n[6] Salvando arquivo...');
    fs.writeFileSync(filePath, novoArquivo, 'utf-8');
    console.log('✅ Arquivo salvo com sucesso!');

    // 8. Verificar se houve erro
    console.log('\n[7] Verificando sintaxe...');
    execSync(`node -c ${filePath}`, { stdio: 'pipe' });
    console.log('✅ Sintaxe OK!');

    console.log('\n' + '='.repeat(60));
    console.log('✅ PAGINAÇÃO COMPLETA APLICADA!');
    console.log('='.repeat(60));
    console.log('📊 Código adicionado:');
    console.log('   - const limit = parseInt(req.query.limit) || 100;');
    console.log('   - const offset = parseInt(req.query.offset) || 0;');
    console.log('   - await supabase.from("imoveis").select(...).range(...)');
    console.log('   - JSON de resposta com total, limit, offset, has_more');
    console.log('='.repeat(60));
    console.log('🚀 PRÓXIMO PASSO: Reiniciar Backend');
    console.log('   Comando: cd /root/cranios-backend && pm2 restart cranios-backend');
    console.log('   Ou: killall node; nohup node src/index-simple.js &');
    console.log('='.repeat(60));

} catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERRO APLICANDO PAGINAÇÃO');
    console.error('='.repeat(60));
    console.error('Error:', error);
    process.exit(1);
}
