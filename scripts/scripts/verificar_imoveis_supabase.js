import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rbhkwmesmvytqdfuwcie.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiaGt3bWVzbXZ5dHFkZnV3Y2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ0ODUsImV4cCI6MjA4NTM5MDQ0NX0.vHffPyFGC99OhYpfeGihf59oGhIguVwKfQagySAyTck'
);

async function main() {
  console.log('='.repeat(60));
  console.log('🔍 VERIFICANDO IMÓVEIS NO SUPABASE');
  console.log('='.repeat(60));
  
  try {
    const { data, error, count } = await supabase
      .from('imoveis')
      .select('*', { count: 'exact', head: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`📊 Total de imóveis no Supabase: ${count || 0}`);
    
    if (data && data.length > 0) {
      console.log('\n🏠 Imóveis encontrados (10 últimos):');
      
      for (let i = 0; i < Math.min(data.length, 10); i++) {
        const imovel = data[i];
        console.log(`\n${i+1}. ${imovel.titulo || 'Sem título'}`);
        console.log(`   Tipo: ${imovel.tipo}`);
        console.log(`   Finalidade: ${imovel.finalidade}`);
        console.log(`   Preço Venda: R$ ${(imovel.preco_venda || 0).toLocaleString('pt-BR')}`);
        console.log(`   Preço Locação: R$ ${(imovel.preco_locacao || 0).toLocaleString('pt-BR')}`);
        console.log(`   Bairro: ${imovel.bairro || 'N/A'}`);
        console.log(`   Status: ${imovel.disponivel ? 'Disponível' : 'Indisponível'}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICAÇÃO CONCLUÍDA!');
    console.log('='.repeat(60));
    
    if (count === 0) {
      console.log('\n⚠️  NENHUM IMÓVEL ENCONTRADO!');
      console.log('❌ É NECESSÁRIO IMPORTAR OS 29 IMÓVEIS DO AIRTABLE!');
      console.log('\nSolução: Importe os 29 imóveis manualmente via Supabase Painel Web');
    } else if (count >= 20) {
      console.log('\n✅  IMÓVEIS SUFICIENTES PARA APRESENTAÇÃO!');
      console.log('✅ FOCO: Conectar Frontend ao Backend e tudo funcional!');
    } else {
      console.log('\n⚠️  IMÓVEIS INSUFICIENTES!');
      console.log(`❌ Temos apenas ${count} imóveis, seria ideal ter mais (20+)`);
      console.log('\nSolução: Importar os 29 imóveis do Airtable');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔗 URL DO SUPABASE');
    console.log('='.repeat(60));
    console.log('URL: https://rbhkwmesmvytqdfuwcie.supabase.co');
    console.log('Tabela: imoveis');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERRO NA VERIFICAÇÃO');
    console.error('='.repeat(60));
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
