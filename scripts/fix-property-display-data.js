const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

(async () => {
  const { data: barraRows, error: barraError } = await supabase
    .from('imoveis')
    .select('*')
    .eq('titulo', 'Residencial Barra Garden')
    .limit(1);

  if (barraError) throw barraError;
  const barra = barraRows?.[0];
  if (!barra) throw new Error('Residencial Barra Garden not found.');

  const barraPatch = {
    destaque: false,
    disponivel: false,
    status: 'duplicado_substituido',
    updated_at: new Date().toISOString(),
  };

  const { error: duplicateError } = await supabase
    .from('imoveis')
    .update(barraPatch)
    .eq('id', '0631ea82-c8b3-468b-a693-1be57d654b5d');

  if (duplicateError) throw duplicateError;

  const luxuryPhoto = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&auto=format&fit=crop';
  const { error: luxuryError } = await supabase
    .from('imoveis')
    .update({
      foto_principal: luxuryPhoto,
      fotos: [luxuryPhoto],
      updated_at: new Date().toISOString(),
    })
    .in('id', [
      '55ec0351-9c3b-4268-9699-dea637b53eae',
      'a368bc5e-27d5-4c5e-abd4-ca2f5fd60f22',
    ]);

  if (luxuryError) throw luxuryError;

  console.log('Property display data fixed.');
})().catch((error) => {
  console.error(JSON.stringify(error, null, 2) || error.message || error);
  process.exit(1);
});
