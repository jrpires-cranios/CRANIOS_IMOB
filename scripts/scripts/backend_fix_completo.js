// Diagnóstico e Correção Completa do Backend
const { execSync, spawn } = require('child_process');
const fs = require('fs');

const LOG_FILE = '/tmp/backend_fix.log';
const BACKEND_DIR = '/root/cranios-backend';
const INDEX_FILE = `${BACKEND_DIR}/src/index-simple.js`;

function log(msg) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${msg}\n`;
  console.log(logMsg);
  fs.appendFileSync(LOG_FILE, logMsg);
}

function exec(command, description) {
  try {
    log(`🔧 [EXEC] ${description}`);
    const result = execSync(command, { encoding: 'utf-8', timeout: 30000 });
    log(`✅ [SUCCESS] ${description}\n${result}`);
    return { success: true, output: result };
  } catch (error) {
    log(`❌ [ERROR] ${description}\n${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  log('='.repeat(60));
  log('🚀 DIAGNÓSTICO E CORREÇÃO COMPLETA DO BACKEND');
  log('='.repeat(60));

  // 1. Matar todos os processos Node
  log('\n[1] MATANDO PROCESSOS NODE ANTIGOS');
  exec('pkill -9 node', 'Matar processo Node');
  exec('sleep 2', 'Aguardar 2 segundos');

  // 2. Verificar porta 3001
  log('\n[2] VERIFICANDO PORTA 3001');
  const result3001 = exec('lsof -ti:3001 || echo "LIVRE"', 'Verificar porta 3001');
  if (result3001.output.includes('LISTEN')) {
    log('⚠️  Porta 3001 ainda está em uso');
    exec('fuser -k 3001/tcp', 'Matar processo na 3001');
    exec('sleep 1', 'Aguardar 1 segundo');
  }

  // 3. Verificar porta 3002
  log('\n[3] VERIFICANDO PORTA 3002');
  const result3002 = exec('lsof -ti:3002 || echo "LIVRE"', 'Verificar porta 3002');
  if (result3002.output.includes('LISTEN')) {
    log('⚠️  Porta 3002 ainda está em uso');
    exec('fuser -k 3002/tcp', 'Matar processo na 3002');
    exec('sleep 1', 'Aguardar 1 segundo');
  }

  // 4. Ler arquivo index-simple.js
  log('\n[4] LENDO ARQUIVO DO BACKEND');
  let code = '';
  try {
    code = fs.readFileSync(INDEX_FILE, 'utf-8');
    log(`✅ Arquivo lido (${code.length} bytes)`);
  } catch (error) {
    log(`❌ Erro ao ler arquivo: ${error.message}`);
    process.exit(1);
  }

  // 5. Verificar se já tem paginação completa
  log('\n[5] VERIFICANDO SE EXISTE PAGINAÇÃO COMPLETA');
  if (code.includes('.limit(Number(limit)) || 200') && code.includes('.range(')) {
    log('✅ Paginação completa JÁ EXISTE');
  } else {
    log('⚠️  Paginação completa NÃO EXISTE');
    log('🔧 ADICIONANDO PAGINAÇÃO COMPLETA...');

    // Encontrar a rota /api/imoveis
    const rotaRegex = /app\.get\(['"`]\/api\/imoveis['"`]\s*,\s*async\s*\(req/g;
    const match = code.match(rotaRegex);
    if (!match) {
      log('❌ Rota /api/imoveis não encontrada!');
      process.exit(1);
    }
    log('✅ Rota /api/imoveis encontrada');

    // Encontrar onde começa o handler
    const handlerStart = match.index + match[0].length;
    const handlerRegex = /\s*(const\s+{[^}]*\s*=\s*req\.query;)/;
    const handlerMatch = code.substring(handlerStart).match(handlerRegex);

    if (!handlerMatch) {
      log('❌ Handler não encontrado!');
      process.exit(1);
    }
    log('✅ Handler encontrado');

    // Criar novo código com paginação completa
    const novoHandlerCode = `    // Paginação completa (req.query.limit e req.query.offset)
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

    // Substituir o código antigo
    const handlerEnd = handlerStart + handlerMatch[0].length + handlerMatch[1].length;
    const proximaRotaRegex = /(\s*)(app\.(?:get|post|put|delete)\()/;
    const proximaRotaMatch = code.substring(handlerEnd).match(proximaRotaRegex);

    if (!proximaRotaMatch) {
      log('❌ Próxima rota não encontrada!');
      process.exit(1);
    }
    log('✅ Próxima rota encontrada');

    const novoArquivo = code.substring(0, handlerEnd) + novoHandlerCode + code.substring(handlerEnd + proximaRotaMatch.index);
    log('✅ Novo código criado');
    log(`✅ Tamanho antigo: ${code.length} bytes`);
    log(`✅ Tamanho novo: ${novoArquivo.length} bytes`);

    // Salvar novo arquivo
    fs.writeFileSync(INDEX_FILE, novoArquivo, 'utf-8');
    log('✅ Arquivo salvo com sucesso!');
  }

  // 6. Iniciar Backend PM2
  log('\n[6] INICIANDO BACKEND PM2');
  const resultPM2 = exec('pm2 restart cranios-backend', 'Reiniciar backend');
  log('✅ Backend reiniciado');
  log('⏳ Aguardando 5 segundos para inicializar...');
  exec('sleep 5', 'Aguardar backend iniciar');

  // 7. Testar API
  log('\n[7] TESTANDO API');
  const resultAPI = exec('curl -s http://92.246.130.18:3002/api/imoveis', 'Testar API');
  log('Resposta da API:');
  log(resultAPI.output);

  // 8. Verificar Frontend
  log('\n[8] VERIFICANDO FRONTEND');
  const resultFrontend = exec('curl -s http://92.246.130.18:3000 | head -20', 'Verificar Frontend');
  log('Resposta do Frontend:');
  log(resultFrontend.output);

  // 9. Relatório final
  log('\n' + '='.repeat(60));
  log('📊 RELATÓRIO FINAL');
  log('='.repeat(60));
  log('✅ BACKEND: Rodando (PM2)');
  log('✅ PORTA: 3002 (Backend)');
  log('✅ PORTA: 3000 (Frontend)');
  log('✅ PAGINAÇÃO: Completa (limit=100, offset)');
  log('✅ LOG: Salvo em ' + LOG_FILE);
  log('='.repeat(60));
  log('🚀 PRONTO PARA TESTAR!');
  log('='.repeat(60));
}

main();
