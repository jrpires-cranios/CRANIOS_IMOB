const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const fallbackByTipo = {
  apartamento: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&auto=format&fit=crop',
  casa: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&auto=format&fit=crop',
  terreno: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop',
  comercial: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&auto=format&fit=crop',
};

function needsImagePatch(photo) {
  return !photo || photo.includes('photo-1600607687644-aac4c3eac7f4');
}

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

  const { error: lucianoDuplicateError } = await supabase
    .from('imoveis')
    .update({
      destaque: false,
      disponivel: false,
      status: 'duplicado_substituido',
      updated_at: new Date().toISOString(),
    })
    .eq('id', 'f95bbb33-00f5-45e5-8a85-e549ae816c6b');

  if (lucianoDuplicateError) throw lucianoDuplicateError;

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

  const { data: activeProperties, error: activeError } = await supabase
    .from('imoveis')
    .select('id,tipo,foto_principal,fotos')
    .eq('disponivel', true);

  if (activeError) throw activeError;

  let imagePatchCount = 0;
  for (const property of activeProperties || []) {
    if (!needsImagePatch(property.foto_principal)) continue;

    const fallback = fallbackByTipo[property.tipo] || fallbackByTipo.apartamento;
    const { error: imageError } = await supabase
      .from('imoveis')
      .update({
        foto_principal: fallback,
        fotos: Array.isArray(property.fotos) && property.fotos.length > 0 ? property.fotos : [fallback],
        updated_at: new Date().toISOString(),
      })
      .eq('id', property.id);

    if (imageError) throw imageError;
    imagePatchCount += 1;
  }

  console.log(`Property display data fixed. Image fallbacks updated: ${imagePatchCount}.`);
})().catch((error) => {
  console.error(JSON.stringify(error, null, 2) || error.message || error);
  process.exit(1);
});
