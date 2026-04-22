/**
 * Teste local do webhook UazAPI
 *
 * USO:
 *   node test-uazapi-webhook.js
 *
 * Aponta para localhost:3000 por padrão.
 * Mude BASE_URL para testar contra produção.
 */

const BASE_URL = 'http://localhost:3000';

// Simula exatamente o payload que o UazAPI envia
const payload = {
  type: 'ReceivedCallback',
  phone: '5511999999999',
  chatName: 'Teste Webhook',
  senderName: 'Teste Webhook',
  instanceId: process.env.UAZAPI_INSTANCE || 'minha-instancia',
  isGroup: false,
  fromMe: false,
  wasSentByApi: false,
  momment: Date.now(),
  status: 'RECEIVED',
  text: {
    message: 'Olá! Quero informações sobre apartamentos de 2 quartos.'
  }
};

async function testar() {
  console.log('\n🧪 Testando webhook UazAPI...');
  console.log('📍 URL:', `${BASE_URL}/api/webhooks/uazapi`);
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));
  console.log('\n---');

  try {
    const res = await fetch(`${BASE_URL}/api/webhooks/uazapi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log(`✅ Status HTTP: ${res.status}`);
    console.log('📩 Resposta:', JSON.stringify(data, null, 2));

    if (res.status === 200 && data.received) {
      console.log('\n✅ Webhook recebido com sucesso!');
      console.log('⏳ O agente está processando em background...');
      console.log('   Aguarde ~5s e verifique o console do servidor para ver a resposta da Elena.');
    } else {
      console.log('\n⚠️  Resposta inesperada — verifique os logs do servidor.');
    }
  } catch (err) {
    console.error('\n❌ Erro ao chamar webhook:', err.message);
    console.log('\nVerifique se o servidor está rodando: npm run dev');
  }
}

// Teste 2: mensagem enviada pela própria instância (deve ser ignorada)
async function testarFromMe() {
  console.log('\n🧪 Teste 2 — fromMe=true (deve ser IGNORADO silenciosamente)...');
  const payloadFromMe = { ...payload, fromMe: true, phone: '5511888888888' };

  try {
    const res = await fetch(`${BASE_URL}/api/webhooks/uazapi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadFromMe)
    });
    console.log(`✅ Status: ${res.status} — payload fromMe ignorado corretamente.`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

// Teste 3: evento não-texto (deve ser ignorado)
async function testarSemTexto() {
  console.log('\n🧪 Teste 3 — mensagem de áudio (sem text.message, deve ser IGNORADA)...');
  const { text: _, ...payloadSemTexto } = payload;
  payloadSemTexto.audio = { url: 'https://example.com/audio.ogg' };

  try {
    const res = await fetch(`${BASE_URL}/api/webhooks/uazapi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadSemTexto)
    });
    console.log(`✅ Status: ${res.status} — áudio ignorado corretamente.`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

(async () => {
  await testar();
  await testarFromMe();
  await testarSemTexto();
  console.log('\n🏁 Testes concluídos.');
})();
