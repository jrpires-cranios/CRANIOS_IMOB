-- BANCO DE DADOS IMOBILIÁRIA - SUPABASE
-- Execute este SQL no SQL Editor do Supabase

-- Tabela de Imóveis
CREATE TABLE imoveis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(50) NOT NULL, -- 'casa', 'apartamento', 'terreno', 'comercial'
  finalidade VARCHAR(20) NOT NULL, -- 'venda', 'locacao', 'ambos'
  titulo TEXT NOT NULL,
  descricao TEXT,
  endereco TEXT NOT NULL,
  bairro VARCHAR(100),
  cidade VARCHAR(100) DEFAULT 'Salvador',
  estado VARCHAR(2) DEFAULT 'BA',
  cep VARCHAR(10),
  preco_venda DECIMAL(12,2),
  preco_locacao DECIMAL(10,2),
  area_total DECIMAL(10,2),
  area_construida DECIMAL(10,2),
  quartos INTEGER,
  suites INTEGER,
  banheiros INTEGER,
  vagas_garagem INTEGER,
  caracteristicas JSONB, -- ['piscina', 'churrasqueira', 'varanda', etc]
  fotos JSONB, -- array de URLs das fotos
  foto_principal TEXT,
  disponivel BOOLEAN DEFAULT true,
  destaque BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Conversas (para histórico do chat)
CREATE TABLE conversas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(100) UNIQUE NOT NULL,
  nome_usuario VARCHAR(200),
  email VARCHAR(200),
  telefone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Mensagens
CREATE TABLE mensagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversa_id UUID REFERENCES conversas(id) ON DELETE CASCADE,
  session_id VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'user' ou 'assistant'
  content TEXT NOT NULL,
  metadata JSONB, -- dados extras como agente usado, ferramentas, etc
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Leads (interessados)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversa_id UUID REFERENCES conversas(id),
  nome VARCHAR(200),
  email VARCHAR(200),
  telefone VARCHAR(20),
  interesse TEXT, -- 'compra', 'locacao', 'venda_imovel'
  imoveis_interesse JSONB, -- array de IDs de imóveis
  orcamento_min DECIMAL(12,2),
  orcamento_max DECIMAL(12,2),
  observacoes TEXT,
  status VARCHAR(50) DEFAULT 'novo', -- 'novo', 'em_atendimento', 'qualificado', 'convertido'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_imoveis_tipo ON imoveis(tipo);
CREATE INDEX idx_imoveis_finalidade ON imoveis(finalidade);
CREATE INDEX idx_imoveis_disponivel ON imoveis(disponivel);
CREATE INDEX idx_imoveis_destaque ON imoveis(destaque);
CREATE INDEX idx_imoveis_preco_venda ON imoveis(preco_venda);
CREATE INDEX idx_imoveis_preco_locacao ON imoveis(preco_locacao);
CREATE INDEX idx_mensagens_session ON mensagens(session_id);
CREATE INDEX idx_mensagens_conversa ON mensagens(conversa_id);
CREATE INDEX idx_leads_status ON leads(status);

-- Function para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_imoveis_updated_at BEFORE UPDATE ON imoveis
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversas_updated_at BEFORE UPDATE ON conversas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================
-- DADOS DE EXEMPLO - IMÓVEIS REAIS DE ARACAJU/SE
-- ====================================================

-- APARTAMENTOS PARA VENDA

-- Bairro 13 de Julho (Nobre - Vista Rio Sergipe)
INSERT INTO imoveis (tipo, finalidade, titulo, descricao, endereco, bairro, cidade, estado, cep,
                     preco_venda, area_total, area_construida, quartos, suites, banheiros, vagas_garagem,
                     caracteristicas, foto_principal, disponivel, destaque) VALUES

('apartamento', 'venda', 'Apartamento 3 Suítes - Vista Rio Sergipe - Ed. Premium',
 'Apartamento de alto padrão no 9º andar com vista para o Rio Sergipe. 3 quartos sendo 1 suíte máster, dependência completa, 2 salas amplas, ar-condicionado em todos os quartos. Condomínio com piscina, academia, salão de festas, churrasqueira, playground e quadra. IPTU: R$4.500/ano. Condomínio: R$1.200.',
 'Avenida Beira Mar, 1520', '13 de Julho', 'Aracaju', 'SE', '49020-010',
 720000.00, 120.00, 120.00, 3, 1, 3, 2,
 '["vista_rio", "piscina", "academia", "salao_festas", "churrasqueira", "playground", "quadra", "ar_condicionado", "dependencia_completa"]',
 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', true, true),

('apartamento', 'venda', 'Cobertura Duplex 4 Suítes - Mirante Atalaia',
 'Espetacular cobertura duplex no andar alto com vista 360º. 4 suítes, varanda gourmet com jacuzzi, lavabo, sala ampliada, 3 vagas. Lazer completo no condomínio.',
 'Rua Pacatuba, 250', '13 de Julho', 'Aracaju', 'SE', '49020-100',
 1500000.00, 230.00, 210.00, 4, 4, 5, 3,
 '["cobertura", "vista_panoramica", "jacuzzi", "varanda_gourmet", "lavabo", "piscina", "academia"]',
 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', true, true),

-- Bairro Jardins (Nobre - Próximo Shopping)
('apartamento', 'venda', 'Apartamento 3 Quartos + Suíte - Giardino - Jardins de Londres',
 'Belíssimo apartamento reformado com móveis modulados no Condomínio Giardino. Próximo ao Parque da Sementeira e Shopping Jardins. 3 quartos sendo 1 suíte, dependência, sala, varandão com jacuzzi, 3 vagas. Condomínio: R$650.',
 'Rua Jardins de Londres, 89', 'Jardins', 'Aracaju', 'SE', '49026-500',
 1400000.00, 230.00, 230.00, 3, 1, 3, 3,
 '["reformado", "moveis_modulados", "jacuzzi", "varanda", "dependencia_completa", "proximo_shopping", "parque"]',
 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', true, false),

('apartamento', 'venda', 'Apartamento 2 Quartos - Condomínio Club Jardins',
 'Apartamento moderno com 2 quartos sendo 1 suíte, sala, cozinha planejada, área de serviço, 1 vaga. Condomínio com infraestrutura completa.',
 'Avenida Ministro Geraldo Barreto Sobral, 456', 'Jardins', 'Aracaju', 'SE', '49026-010',
 530000.00, 85.00, 82.00, 2, 1, 2, 1,
 '["cozinha_planejada", "piscina", "academia", "salao_festas", "armarios_embutidos"]',
 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', true, false),

-- Bairro Atalaia (Turístico - Orla)
('apartamento', 'venda', 'Apartamento 3 Suítes - Sky Residence - Vista Mar Permanente',
 'Localizado na orla mais bonita do Brasil, na Passarela do Caranguejo. 3 suítes, varanda frente mar com vista permanente, 132m², posição leste, andar intermediário, 3 vagas.',
 'Avenida Santos Dumont, 1890', 'Atalaia', 'Aracaju', 'SE', '49037-470',
 1250000.00, 132.00, 132.00, 3, 3, 4, 3,
 '["vista_mar", "orla", "varanda", "piscina", "academia", "salao_festas"]',
 'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800', true, true),

('apartamento', 'venda', 'Apartamento 2 Quartos - Ocean Residence',
 'Apartamento com 2 quartos sendo 1 suíte, varanda, próximo à orla. Condomínio moderno com lazer completo.',
 'Rua Niceu Dantas, 670', 'Atalaia', 'Aracaju', 'SE', '49037-260',
 650000.00, 95.00, 92.00, 2, 1, 2, 2,
 '["proximo_praia", "varanda", "piscina", "academia", "churrasqueira"]',
 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800', true, false),

('apartamento', 'venda', 'Kitnet Mobiliada - Horizonte Atalaia',
 'Kitnet mobiliada perfeita para investimento ou moradia. Sala/quarto integrado, cozinha americana, banheiro, área de serviço, 1 vaga. Lazer no condomínio.',
 'Avenida Oceânica, 234', 'Atalaia', 'Aracaju', 'SE', '49037-485',
 380000.00, 42.00, 40.00, 1, 0, 1, 1,
 '["mobiliado", "cozinha_americana", "piscina", "proximo_praia", "investimento"]',
 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', true, false),

-- Bairro Farolândia (Em crescimento - Próximo UNIT)
('apartamento', 'venda', 'Apartamento 3 Quartos + Suíte - Le Vert Boulevard',
 'Projeto diferenciado próximo à Universidade Tiradentes. 3 quartos sendo 1 suíte, sala ampla, varanda, 2 vagas. Excelente para investimento.',
 'Rua Ananias Sobral, 789', 'Farolândia', 'Aracaju', 'SE', '49030-180',
 490000.00, 98.00, 95.00, 3, 1, 2, 2,
 '["proximo_universidade", "varanda", "piscina", "academia", "investimento"]',
 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', true, false),

('apartamento', 'venda', 'Apartamento 2 Quartos - Residencial Luzes do Farol',
 'Apartamento compacto e funcional. 2 quartos, sala, cozinha, área de serviço, 1 vaga. Ótima localização.',
 'Avenida Visconde de Maracaju, 1234', 'Farolândia', 'Aracaju', 'SE', '49030-420',
 310000.00, 68.00, 65.00, 2, 0, 1, 1,
 '["cozinha_planejada", "proximo_comercio", "area_lazer"]',
 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', true, false),

-- Bairro Luzia (Tradicional - Bem localizado)
('apartamento', 'venda', 'Apartamento 3 Quartos + Suíte - Urbanus Luzia',
 'Apartamento próximo à estrada do Aeroporto e Shopping Jardins. 3 quartos sendo 1 suíte, 2 banheiros, sala, cozinha, área de serviço, 2 vagas.',
 'Avenida Hermes Fontes, 2345', 'Luzia', 'Aracaju', 'SE', '49045-190',
 420000.00, 107.00, 104.00, 3, 1, 2, 2,
 '["proximo_shopping", "proximo_aeroporto", "piscina", "area_lazer"]',
 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800', true, false),

-- Bairro Aruana (Zona de Expansão - Luxo)
('apartamento', 'venda', 'Apartamento 4 Suítes - Condomínio de Alto Padrão',
 'Apartamento em condomínio luxuoso na Zona de Expansão. 4 suítes, sala 2 ambientes, varanda gourmet, lavabo, 3 vagas. Vista mar lateral. Infraestrutura premium.',
 'Rodovia José Sarney, KM 6', 'Aruana', 'Aracaju', 'SE', '49040-000',
 980000.00, 165.00, 160.00, 4, 4, 5, 3,
 '["condominio_fechado", "vista_mar", "varanda_gourmet", "lavabo", "piscina", "academia", "portaria_24h"]',
 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', true, true);

-- CASAS PARA VENDA

INSERT INTO imoveis (tipo, finalidade, titulo, descricao, endereco, bairro, cidade, estado, cep,
                     preco_venda, area_total, area_construida, quartos, suites, banheiros, vagas_garagem,
                     caracteristicas, foto_principal, disponivel, destaque) VALUES

-- Bairro Jabotiana (Verde - Banhado por rios)
('casa', 'venda', 'Casa 4 Quartos + Suíte - Condomínio Fechado Jabotiana',
 'Linda casa em condomínio próximo às lagoas Doce e Areal. 4 quartos sendo 1 suíte, sala 2 ambientes, cozinha ampla, área gourmet, quintal, 3 vagas. Segurança 24h.',
 'Loteamento Jardim dos Lagos, Rua das Hortênsias, 145', 'Jabotiana', 'Aracaju', 'SE', '49098-000',
 750000.00, 320.00, 240.00, 4, 1, 3, 3,
 '["condominio_fechado", "area_gourmet", "quintal", "churrasqueira", "portaria_24h", "proximo_lagoa"]',
 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', true, false),

('casa', 'venda', 'Casa Duplex 7 Suítes - Área de Lazer Completa',
 'Residência espetacular com 7 suítes (todas com banheiro), sendo 1 master com banheira, lavabo, sala ampla, varanda, cozinha espaçosa, DCE completa com banheiro. Área gourmet, piscina, jardim. Perfeita para famílias grandes ou investimento em temporada.',
 'Rua José Conrado de Araújo, 567', 'Jabotiana', 'Aracaju', 'SE', '49098-200',
 1800000.00, 550.00, 480.00, 7, 7, 9, 4,
 '["piscina", "area_gourmet", "jardim", "banheira_hidro", "lavabo", "dependencia_completa", "varanda"]',
 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800', true, true),

-- Bairro Grageru (Próximo Jardins)
('casa', 'venda', 'Casa 3 Quartos + Suíte - Grageru',
 'Casa em bairro tradicional próximo ao Jardins. 3 quartos sendo 1 suíte, sala, cozinha, área de serviço, quintal, 2 vagas.',
 'Rua Professor Aloísio de Campos, 890', 'Grageru', 'Aracaju', 'SE', '49027-320',
 620000.00, 250.00, 180.00, 3, 1, 2, 2,
 '["quintal", "garagem_coberta", "area_servico", "proximo_jardins"]',
 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', true, false),

-- Bairro Salgado Filho (Centro comercial)
('casa', 'venda', 'Casa 2 Quartos - Salgado Filho',
 'Casa prática e funcional no tradicional Salgado Filho. 2 quartos, sala, cozinha, banheiro social, área de serviço, posição sul. Próximo ao comércio e feira livre.',
 'Rua Itaporanga, 456', 'Salgado Filho', 'Aracaju', 'SE', '49020-390',
 320000.00, 150.00, 110.00, 2, 0, 1, 1,
 '["area_servico", "proximo_comercio", "feira_livre"]',
 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', true, false),

-- Bairro Luzia (Tradicional)
('casa', 'venda', 'Casa Espaçosa 4 Quartos + 2 Suítes - Luzia',
 'Casa ampla em bairro tradicional próximo a shoppings. 4 quartos sendo 2 suítes, sala grande, cozinha, área de serviço, quintal, 2 vagas cobertas.',
 'Rua João Pessoa, 789', 'Luzia', 'Aracaju', 'SE', '49045-410',
 580000.00, 280.00, 200.00, 4, 2, 3, 2,
 '["quintal", "garagem_coberta", "proximo_shopping", "area_servico"]',
 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800', true, false),

-- APARTAMENTOS PARA LOCAÇÃO

INSERT INTO imoveis (tipo, finalidade, titulo, descricao, endereco, bairro, cidade, estado, cep,
                     preco_locacao, area_total, area_construida, quartos, suites, banheiros, vagas_garagem,
                     caracteristicas, foto_principal, disponivel) VALUES

-- Atalaia
('apartamento', 'locacao', 'Apartamento 2 Quartos + Suíte para Alugar - Atalaia',
 'Apartamento próximo à orla. 2 quartos sendo 1 suíte, sala, cozinha, varanda, 1 vaga. Condomínio com piscina.',
 'Rua Professor Gonçalo Rollemberg, 345', 'Atalaia', 'Aracaju', 'SE', '49037-540',
 3200.00, 82.00, 78.00, 2, 1, 2, 1,
 '["proximo_praia", "varanda", "piscina", "area_lazer"]',
 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800', true),

('apartamento', 'locacao', 'Kitnet Mobiliada - Atalaia',
 'Kitnet mobiliada perfeita para solteiros. Cozinha americana, banheiro, 1 vaga. Lazer no condomínio.',
 'Rua Aracati, 123', 'Atalaia', 'Aracaju', 'SE', '49037-250',
 1800.00, 38.00, 36.00, 1, 0, 1, 1,
 '["mobiliado", "cozinha_americana", "area_lazer", "proximo_praia"]',
 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', true),

-- Farolândia
('apartamento', 'locacao', 'Apartamento 3 Quartos para Alugar - Farolândia',
 'Apartamento próximo à UNIT. 3 quartos, sala, cozinha, área de serviço, 2 vagas. Ideal para estudantes ou famílias.',
 'Avenida Eugênio Vanderlei Freire, 678', 'Farolândia', 'Aracaju', 'SE', '49030-230',
 2600.00, 90.00, 85.00, 3, 0, 2, 2,
 '["proximo_universidade", "area_servico", "area_lazer"]',
 'https://images.unsplash.com/photo-1600566752229-250ed79470ab?w=800', true),

('apartamento', 'locacao', 'Apartamento 2 Quartos + Suíte - Farolândia',
 'Apartamento bem localizado. 2 quartos sendo 1 suíte, sala, cozinha planejada, 1 vaga.',
 'Rua Cândido Inácio, 234', 'Farolândia', 'Aracaju', 'SE', '49030-510',
 2200.00, 75.00, 72.00, 2, 1, 2, 1,
 '["cozinha_planejada", "armarios_embutidos", "proximo_comercio"]',
 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', true),

-- Luzia
('apartamento', 'locacao', 'Apartamento 2 Quartos - Luzia',
 'Apartamento em bairro tradicional. 2 quartos, sala, cozinha, área de serviço, 1 vaga.',
 'Rua Laranjeiras, 567', 'Luzia', 'Aracaju', 'SE', '49045-270',
 1950.00, 70.00, 68.00, 2, 0, 1, 1,
 '["area_servico", "proximo_shopping", "transporte"]',
 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800', true),

-- Jardins
('apartamento', 'locacao', 'Apartamento 3 Quartos + Suíte + Dependência - Jardins',
 'Apartamento de alto padrão para locação. 3 quartos sendo 1 suíte, dependência completa, 2 vagas. Próximo ao Shopping Jardins.',
 'Rua Estância, 890', 'Jardins', 'Aracaju', 'SE', '49026-420',
 4200.00, 120.00, 115.00, 3, 1, 3, 2,
 '["dependencia_completa", "proximo_shopping", "piscina", "academia", "salao_festas"]',
 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', true),

-- CASAS PARA LOCAÇÃO

INSERT INTO imoveis (tipo, finalidade, titulo, descricao, endereco, bairro, cidade, estado, cep,
                     preco_locacao, area_total, area_construida, quartos, suites, banheiros, vagas_garagem,
                     caracteristicas, foto_principal, disponivel) VALUES

-- Salgado Filho
('casa', 'locacao', 'Casa 3 Quartos para Alugar - Salgado Filho',
 'Casa espaçosa em bairro tradicional. 3 quartos sendo 1 suíte, sala, cozinha, quintal, 2 vagas.',
 'Rua Sergipe, 234', 'Salgado Filho', 'Aracaju', 'SE', '49020-450',
 2800.00, 180.00, 140.00, 3, 1, 2, 2,
 '["quintal", "area_servico", "garagem_coberta", "proximo_comercio"]',
 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', true),

-- Grageru
('casa', 'locacao', 'Casa 2 Quartos - Grageru',
 'Casa simples e funcional. 2 quartos, sala, cozinha, área de serviço, quintal, 1 vaga.',
 'Rua Itabaiana, 567', 'Grageru', 'Aracaju', 'SE', '49027-140',
 2100.00, 120.00, 95.00, 2, 0, 1, 1,
 '["quintal", "area_servico"]',
 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800', true),

-- Jabotiana
('casa', 'locacao', 'Casa 4 Quartos + 2 Suítes - Condomínio Jabotiana',
 'Casa em condomínio fechado. 4 quartos sendo 2 suítes, sala 2 ambientes, varanda, quintal, 3 vagas. Área de lazer completa.',
 'Condomínio Ville de France, Rua das Acácias, 89', 'Jabotiana', 'Aracaju', 'SE', '49098-150',
 4500.00, 280.00, 210.00, 4, 2, 3, 3,
 '["condominio_fechado", "quintal", "varanda", "piscina", "portaria_24h", "churrasqueira"]',
 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800', true),

-- IMÓVEIS PARA VENDA E LOCAÇÃO

INSERT INTO imoveis (tipo, finalidade, titulo, descricao, endereco, bairro, cidade, estado, cep,
                     preco_venda, preco_locacao, area_total, area_construida, quartos, suites, banheiros, vagas_garagem,
                     caracteristicas, foto_principal, disponivel, destaque) VALUES

-- Siqueira Campos (Centro comercial)
('comercial', 'ambos', 'Sala Comercial - Siqueira Campos',
 'Excelente sala comercial no segundo maior centro comercial de Aracaju. 09 escritórios, 03 lavabos, estrutura completa. Ótima para clínicas, consultórios ou co-working.',
 'Avenida Augusto Franco, 1234', 'Siqueira Campos', 'Aracaju', 'SE', '49075-000',
 890000.00, 6500.00, 306.00, 295.00, 0, 0, 3, 3,
 '["comercial", "escritorios", "estacionamento", "rua_movimentada", "proximo_transporte"]',
 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', true, false),

('comercial', 'ambos', 'Prédio Misto 8 Kitnets + 2 Casas - Salgado Filho',
 'Excelente investimento! Prédio com 8 kitnets independentes (sala, cozinha, banheiro, área de serviço cada) + 2 casas completas. Posição leste. Casa 1: 2 salas, 3 quartos, 2 banheiros, garagem. Casa 2: sala, cozinha, 2 quartos.',
 'Rua Aracati, 456', 'Salgado Filho', 'Aracaju', 'SE', '49020-520',
 1200000.00, 9800.00, 429.00, 410.00, 5, 0, 11, 2,
 '["investimento", "renda_garantida", "multiplas_unidades", "comercial_residencial"]',
 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800', true, true);
