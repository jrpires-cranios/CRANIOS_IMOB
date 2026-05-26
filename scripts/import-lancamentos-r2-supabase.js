const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const lancamentosDir =
  process.argv[2] ||
  path.resolve(__dirname, '..', '..', '_DOCUMENTOS_ORGANIZADOS', '05_LANCAMENTOS');

const requiredEnv = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
];

const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const bucket = process.env.R2_BUCKET_NAME;
const publicBase = (process.env.R2_ASSET_BASE_URL || '/api/assets/r2').replace(/\/$/, '');

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/galeria de imagens/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, '-').replace(/^-|-$/g, '') || 'lancamento';
}

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.pdf') return 'application/pdf';
  return 'application/octet-stream';
}

function parseNumber(value) {
  if (typeof value === 'number') return value;
  const match = String(value || '').match(/[\d.,]+/);
  if (!match) return null;
  const normalized = match[0].replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapTipo(tipo) {
  const n = normalize(tipo);
  if (n.includes('casa')) return 'casa';
  if (n.includes('terreno') || n.includes('lote')) return 'terreno';
  if (n.includes('comercial') || n.includes('loja') || n.includes('sala')) return 'comercial';
  return 'apartamento';
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];
}

async function uploadFile(localPath, key) {
  const body = fs.readFileSync(localPath);
  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType(localPath),
      ACL: 'public-read',
    })
  );
  return `${publicBase}/${encodeURI(key).replace(/%2F/g, '/')}`;
}

function loadLaunches() {
  const dirs = fs
    .readdirSync(lancamentosDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const grouped = new Map();
  for (const folder of dirs) {
    const fichaPath = path.join(lancamentosDir, folder, 'ficha_site.json');
    if (!fs.existsSync(fichaPath)) continue;
    const ficha = JSON.parse(fs.readFileSync(fichaPath, 'utf8'));
    const canonical = String(ficha.nome || folder).replace(/\s*[–-]\s*Galeria de Imagens/i, '').trim();
    const groupKey = normalize(canonical);
    const current = grouped.get(groupKey);
    const candidate = { folder, ficha, canonical, score: JSON.stringify(ficha).length };
    if (!current || candidate.score > current.score) grouped.set(groupKey, candidate);
  }
  return [...grouped.values()];
}

async function findExisting(canonical) {
  const { data, error } = await supabase.from('imoveis').select('id,titulo');
  if (error) throw error;
  const target = normalize(canonical);
  return (data || []).find((row) => {
    const title = normalize(row.titulo);
    return title.includes(target) || target.includes(title);
  });
}

async function importLaunch({ folder, ficha, canonical }) {
  const slug = slugify(canonical);
  const folderPath = path.join(lancamentosDir, folder);
  const imageNames = Array.isArray(ficha.imagens) ? ficha.imagens : [];
  const imageUrls = [];

  for (const imageName of imageNames) {
    const localImage = path.join(folderPath, imageName);
    if (!fs.existsSync(localImage)) continue;
    const key = `lancamentos/${slug}/fotos/${path.basename(imageName)}`;
    imageUrls.push(await uploadFile(localImage, key));
  }

  const pdfPath = path.join(lancamentosDir, `${folder}.pdf`);
  const pdfUrl = fs.existsSync(pdfPath)
    ? await uploadFile(pdfPath, `lancamentos/${slug}/book/${path.basename(pdfPath)}`)
    : null;

  const tipologias = Array.isArray(ficha.tipologias) ? ficha.tipologias : [];
  const first = tipologias[0] || {};
  const precoMin = Math.min(
    ...tipologias.map((item) => Number(item.preco_de || item.preco_ate)).filter(Number.isFinite)
  );

  const caracteristicas = unique([
    ...(ficha.tags || []),
    ...(ficha.lazer || []),
    ...(ficha.diferenciais || []),
    ...(ficha.sustentabilidade || []),
    ficha.construtora ? `Construtora: ${ficha.construtora}` : null,
    ficha.incorporadora ? `Incorporadora: ${ficha.incorporadora}` : null,
    ficha.total_unidades ? `${ficha.total_unidades} unidades` : null,
    ficha.faixa_preco ? `Faixa de preço: ${ficha.faixa_preco}` : null,
  ]);

  const payload = {
    titulo: canonical,
    tipo: mapTipo(ficha.tipo),
    finalidade: 'venda',
    status: ficha.status || 'Venda',
    descricao: ficha.descricao_comercial || ficha.nota || null,
    endereco: ficha.endereco || '',
    bairro: ficha.bairro || null,
    cidade: ficha.cidade || 'São Paulo',
    estado: ficha.estado || 'SP',
    preco_venda: Number.isFinite(precoMin) ? precoMin : null,
    area_total: parseNumber(first.area_m2 || ficha.area_terreno_m2),
    area_construida: parseNumber(first.area_m2),
    quartos: first.quartos || null,
    suites: first.suites || null,
    banheiros: first.banheiros || null,
    vagas_garagem: first.vagas || null,
    caracteristicas,
    fotos: imageUrls,
    foto_principal: imageUrls[0] || null,
    book_pdf_url: pdfUrl,
    bucket_book_url: pdfUrl,
    disponivel: true,
    destaque: true,
    is_launch: true,
    launch_developer: ficha.construtora || ficha.incorporadora || null,
    updated_at: new Date().toISOString(),
  };

  const existing = await findExisting(canonical);
  if (existing) {
    const { error } = await supabase.from('imoveis').update(payload).eq('id', existing.id);
    if (error) throw error;
    return { action: 'updated', id: existing.id, title: canonical, photos: imageUrls.length };
  }

  const { data, error } = await supabase.from('imoveis').insert(payload).select('id').single();
  if (error) throw error;
  return { action: 'inserted', id: data.id, title: canonical, photos: imageUrls.length };
}

(async () => {
  const launches = loadLaunches();
  console.log(`Found ${launches.length} launch folders with ficha_site.json`);
  for (const launch of launches) {
    const result = await importLaunch(launch);
    console.log(`${result.action}: ${result.title} (${result.photos} photos) -> ${result.id}`);
  }
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
