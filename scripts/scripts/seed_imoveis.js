const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (Mesma do index-simple.js)
const supabaseUrl = process.env.SUPABASE_URL || 'https://rbhkwmesmvytqdfuwcie.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiaGt3bWVzbXZ5dHFkZnV3Y2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ0ODUsImV4cCI6MjA4NTM5MDQ4NX0.vHffPyFGC99OhYpfeGihf59oGhIguVwKfQagySAyTck';
const supabase = createClient(supabaseUrl, supabaseKey);

const imoveisAracaju = [
    {
        titulo: 'Apartamento de Luxo na 13 de Julho',
        descricao: 'Apartamento alto padrão com vista para o calçadão e Rio Sergipe. Acabamento premium, varanda gourmet e automação residencial completa.',
        preco_venda: 1250000,
        quartos: 4,
        banheiros: 5,
        vagas_garagem: 3,
        area_total: 180,
        endereco: 'Av. Beira Mar, 13 de Julho',
        bairro: '13 de Julho',
        cidade: 'Aracaju',
        estado: 'SE',
        tipo: 'apartamento',
        finalidade: 'venda',
        foto_principal: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop',
        disponivel: true,
        destaque: true,
        features: ['Vista Mar', 'Varanda Gourmet', 'Automação', 'Piscina']
    },
    {
        titulo: 'Casa em Condomínio Fechado na Aruana',
        descricao: 'Casa moderna com piscina privativa, área gourmet e paisagismo exuberante. Segurança 24h e clube completo.',
        preco_venda: 980000,
        quartos: 3,
        banheiros: 4,
        vagas_garagem: 2,
        area_total: 220,
        endereco: 'Rodovia dos Náufragos, Aruana',
        bairro: 'Aruana',
        cidade: 'Aracaju',
        estado: 'SE',
        tipo: 'casa',
        finalidade: 'venda',
        foto_principal: 'https://images.unsplash.com/photo-1600596542815-2a4d9f9313b6?q=80&w=2070&auto=format&fit=crop',
        disponivel: true,
        destaque: true,
        features: ['Piscina Privativa', 'Condomínio Fechado', 'Área Gourmet']
    },
    {
        titulo: 'Loft Moderno no Jardins',
        descricao: 'Loft estilo industrial no coração do bairro Jardins. Próximo ao shopping, parques e melhores restaurantes.',
        preco_locacao: 3500,
        quartos: 1,
        banheiros: 2,
        vagas_garagem: 1,
        area_total: 75,
        endereco: 'Av. Pedro Valadares, Jardins',
        bairro: 'Jardins',
        cidade: 'Aracaju',
        estado: 'SE',
        tipo: 'apartamento',
        finalidade: 'locacao',
        foto_principal: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2080&auto=format&fit=crop',
        disponivel: true,
        destaque: true,
        features: ['Mobiliado', 'Academia', 'Coworking']
    },
    {
        titulo: 'Cobertura Duplex na Atalaia',
        descricao: 'Cobertura espetacular com vista 360º da orla de Atalaia. Piscina, churrasqueira e amplo terraço.',
        preco_venda: 2100000,
        quartos: 5,
        banheiros: 6,
        vagas_garagem: 4,
        area_total: 350,
        endereco: 'Av. Santos Dumont, Atalaia',
        bairro: 'Atalaia',
        cidade: 'Aracaju',
        estado: 'SE',
        tipo: 'apartamento',
        finalidade: 'venda',
        foto_principal: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?q=80&w=2073&auto=format&fit=crop',
        disponivel: true,
        destaque: true,
        features: ['Cobertura', 'Vista Mar', 'Jacuzzi']
    },
    {
        titulo: 'Casa Térrea no Ponto Novo',
        descricao: 'Excelente casa reformada, perfeita para família. Quintal espaçoso, próxima a escolas e supermercados.',
        preco_venda: 450000,
        quartos: 3,
        banheiros: 2,
        vagas_garagem: 2,
        area_total: 150,
        endereco: 'Rua Nestor Sampaio, Ponto Novo',
        bairro: 'Ponto Novo',
        cidade: 'Aracaju',
        estado: 'SE',
        tipo: 'casa',
        finalidade: 'venda',
        foto_principal: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=2070&auto=format&fit=crop',
        disponivel: true,
        destaque: false,
        features: ['Quintal', 'Reformada']
    },
    {
        titulo: 'Sala Comercial no Centro',
        descricao: 'Sala comercial pronta para uso em edifício empresarial renomado. Recepção, segurança e estacionamento.',
        preco_locacao: 1800,
        quartos: 0,
        banheiros: 1,
        vagas_garagem: 1,
        area_total: 40,
        endereco: 'Rua Itabaiana, Centro',
        bairro: 'Centro',
        cidade: 'Aracaju',
        estado: 'SE',
        tipo: 'comercial',
        finalidade: 'locacao',
        foto_principal: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop',
        disponivel: true,
        destaque: false,
        features: ['Comercial', 'Segurança', 'Elevador']
    }
];

async function seed() {
    console.log('🌱 Iniciando seed de imóveis em Aracaju...');

    for (const imovel of imoveisAracaju) {
        const { data, error } = await supabase
            .from('imoveis')
            .insert([{
                ...imovel,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error(`❌ Erro ao inserir "${imovel.titulo}":`, error.message);
        } else {
            console.log(`✅ Inserido: "${imovel.titulo}"`);
        }
    }

    console.log('🏁 Seed concluído!');
}

seed();
