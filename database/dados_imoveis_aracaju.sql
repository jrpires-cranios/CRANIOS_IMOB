-- DADOS REALISTAS DE IMÓVEIS EM ARACAJU/SE
-- Execute DEPOIS do schema principal (supabase_schema.sql)

-- ========================================
-- APARTAMENTOS PARA LOCAÇÃO
-- ========================================

INSERT INTO imoveis (tipo, finalidade, titulo, descricao, endereco, bairro, cidade, estado, cep,
                     preco_locacao, area_total, area_construida, quartos, suites, banheiros, vagas_garagem,
                     caracteristicas, foto_principal, disponivel, destaque) VALUES

-- KITNETS E STUDIOS
('apartamento', 'locacao', 'Kitnet Mobiliada - Santa Maria',
 'Kitnet moderna e completamente mobiliada, ideal para solteiros ou estudantes. Próximo a comércios e transportes.',
 'Rua Campo do Brito, 145', 'Santa Maria', 'Aracaju', 'SE', '49090-000',
 1100.00, 31.00, 31.00, 1, 0, 1, 0,
 '["mobiliado", "proximo_comercio", "internet_inclusa"]',
 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', true, false),

('apartamento', 'locacao', 'Studio Moderno - Farolândia',
 'Studio compacto em frente à UNIT, perfeito para estudantes. Isento de água e condomínio.',
 'Av. Murilo Dantas, 67 - Condomínio Clóvis Borges', 'Farolândia', 'Aracaju', 'SE', '49032-000',
 950.00, 40.00, 40.00, 1, 0, 1, 0,
 '["proximo_universidade", "agua_inclusa", "condominio_incluso"]',
 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', true, false),

-- 2 QUARTOS
('apartamento', 'locacao', 'Apartamento 2 Quartos - Coroa do Meio',
 'Apartamento bem localizado com 2 quartos, sala ampla, cozinha e 1 vaga. Próximo à orla.',
 'Rua Antônio Andrade, 234', 'Coroa do Meio', 'Aracaju', 'SE', '49035-000',
 2000.00, 57.00, 57.00, 2, 0, 1, 1,
 '["proximo_praia", "area_servico"]',
 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', true, false),

('apartamento', 'locacao', 'Apartamento 2 Quartos - Neo Residence Jardins',
 'Apartamento semi-mobiliado em frente ao Shopping Jardins. 2 quartos sendo 1 suíte, varanda e lavabo.',
 'Av. Ministro Geraldo Barreto Sobral - Neo Residence', 'Jardins', 'Aracaju', 'SE', '49026-010',
 2800.00, 68.00, 65.00, 2, 1, 2, 1,
 '["semi_mobiliado", "varanda", "lavabo", "proximo_shopping"]',
 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800', true, true),

('apartamento', 'locacao', 'Apartamento 2 Quartos - Atalaia',
 'Excelente localização na Atalaia, próximo à orla. 2 quartos, varanda e 1 vaga.',
 'Rua Napoleão Dórea, 89', 'Atalaia', 'Aracaju', 'SE', '49037-490',
 3600.00, 67.00, 67.00, 2, 0, 2, 1,
 '["proximo_praia", "varanda", "area_lazer"]',
 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', true, true),

-- 3 QUARTOS
('apartamento', 'locacao', 'Apartamento 3 Quartos - Grageru',
 'Apartamento mobiliado no Condomínio Garden Ville. 3 quartos sendo 1 suíte, área de lazer completa.',
 'Rua Marieta Leite, 250 - Cond. Garden Ville Bloco B Apt 404', 'Grageru', 'Aracaju', 'SE', '49027-010',
 3000.00, 80.00, 80.00, 3, 1, 2, 1,
 '["mobiliado", "area_lazer", "piscina", "varanda", "gas_incluso"]',
 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', true, false),

('apartamento', 'locacao', 'Apartamento 3 Quartos - Farolândia',
 'Apartamento espaçoso no bairro Farolândia, próximo ao aeroporto. 3 quartos sendo 1 suíte.',
 'Rua João Batista Ribeiro, 156', 'Farolândia', 'Aracaju', 'SE', '49030-240',
 1800.00, 77.00, 77.00, 3, 1, 2, 1,
 '["varanda", "area_servico", "proximo_aeroporto"]',
 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', true, false),

('apartamento', 'locacao', 'Apartamento 3 Quartos - Atalaia',
 'No coração da Atalaia, Edifício Dom Felipe. 3 quartos sendo 1 suíte, varanda aconchegante.',
 'Av. Santos Dumont, 567 - Ed. Dom Felipe', 'Atalaia', 'Aracaju', 'SE', '49037-000',
 2000.00, 85.00, 82.00, 3, 1, 2, 1,
 '["proximo_praia", "varanda", "portaria_24h", "gas_incluso"]',
 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', true, false),

('apartamento', 'locacao', 'Apartamento 3 Quartos - Luzia',
 'Condomínio Porto Bello, excelente localização. 3 quartos sendo 1 suíte, área de lazer completa.',
 'Alameda das Árvores, 89 - Cond. Porto Bello', 'Luzia', 'Aracaju', 'SE', '49045-490',
 2500.00, 82.00, 82.00, 3, 1, 2, 1,
 '["area_lazer", "piscina", "academia", "playground", "salao_festas"]',
 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', true, false),

('apartamento', 'locacao', 'Apartamento 3 Quartos - Aruana Frente Mar',
 'FRENTE AO MAR! Condomínio Vista Aruanã, mobiliado. 3 quartos sendo 1 suíte, varanda gourmet.',
 'Rodovia José Sarney - Cond. Vista Aruanã', 'Aruana', 'Aracaju', 'SE', '49040-000',
 3800.00, 95.00, 92.00, 3, 1, 2, 1,
 '["mobiliado", "vista_mar", "varanda_gourmet", "area_lazer", "piscina", "frente_mar"]',
 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=800', true, true),

-- ALTO PADRÃO LOCAÇÃO
('apartamento', 'locacao', 'Apartamento Alto Padrão - 13 de Julho',
 'Apartamento sofisticado com vista para o rio e mar. 3 suítes, amplo e reformado.',
 'Rua Doutor Celso Oliva, 234', '13 de Julho', 'Aracaju', 'SE', '49020-110',
 4500.00, 145.00, 140.00, 3, 3, 4, 2,
 '["vista_mar", "vista_rio", "reformado", "varanda", "closet", "armarios_planejados"]',
 'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800', true, true),

-- ========================================
-- CASAS PARA LOCAÇÃO
-- ========================================

('casa', 'locacao', 'Casa 3 Quartos - Brotas',
 'Casa espaçosa com 3 quartos sendo 1 suíte, sala 2 ambientes, quintal e 2 vagas.',
 'Rua Silveira Martins, 234', 'Brotas', 'Aracaju', 'SE', '49040-000',
 3500.00, 180.00, 140.00, 3, 1, 2, 2,
 '["quintal", "area_servico", "varanda"]',
 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', true, false),

('casa', 'locacao', 'Casa 3 Quartos - Jardim Centenário',
 'Casa térrea em rua tranquila, 3 quartos, garagem para 2 carros, quintal amplo.',
 'Rua Paulo Cesar Santos, 178', 'Jardim Centenário', 'Aracaju', 'SE', '49066-490',
 2800.00, 150.00, 120.00, 3, 0, 2, 2,
 '["quintal", "garagem_coberta", "area_gourmet"]',
 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', true, false),

-- ========================================
-- APARTAMENTOS PARA VENDA
-- ========================================

INSERT INTO imoveis (tipo, finalidade, titulo, descricao, endereco, bairro, cidade, estado, cep,
                     preco_venda, area_total, area_construida, quartos, suites, banheiros, vagas_garagem,
                     caracteristicas, foto_principal, disponivel, destaque) VALUES

-- APARTAMENTOS 2 QUARTOS
('apartamento', 'venda', 'Apartamento 2 Quartos - Siqueira Campos',
 'Apartamento amplo na Av. Augusto Franco. 2 quartos, sala, cozinha, 1 vaga. Ótima localização.',
 'Av. Augusto Franco, 2340', 'Siqueira Campos', 'Aracaju', 'SE', '49075-000',
 255000.00, 75.00, 72.00, 2, 0, 1, 1,
 '["proximo_comercio", "area_servico"]',
 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800', true, false),

('apartamento', 'venda', 'Apartamento 2 Quartos + Suíte - Luzia',
 'Apartamento moderno no bairro Luzia, próximo a shoppings. 2 quartos sendo 1 suíte.',
 'Rua Professor José de Souza Brandão, 456', 'Luzia', 'Aracaju', 'SE', '49045-000',
 380000.00, 68.00, 65.00, 2, 1, 2, 1,
 '["area_lazer", "piscina", "proximo_shopping", "armarios_embutidos"]',
 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800', true, false),

-- APARTAMENTOS 3 QUARTOS
('apartamento', 'venda', 'Apartamento 3 Quartos - Jardins',
 'Apartamento no bairro Jardins, próximo ao Shopping. 3 quartos sendo 1 suíte, área de lazer completa.',
 'Rua Nicola Biancamano, 789', 'Jardins', 'Aracaju', 'SE', '49026-020',
 620000.00, 95.00, 90.00, 3, 1, 2, 2,
 '["area_lazer", "piscina", "academia", "proximo_shopping", "varanda"]',
 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', true, false),

('apartamento', 'venda', 'Apartamento 3 Quartos - Farolândia',
 'Próximo à UNIT e aeroporto. 3 quartos sendo 1 suíte, varanda, 2 vagas cobertas.',
 'Av. Presidente Tancredo Neves, 234', 'Farolândia', 'Aracaju', 'SE', '49032-490',
 485000.00, 88.00, 85.00, 3, 1, 2, 2,
 '["proximo_universidade", "proximo_aeroporto", "varanda", "area_lazer"]',
 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', true, false),

('apartamento', 'venda', 'Apartamento 3 Quartos - Coroa do Meio',
 'Apartamento espaçoso na Coroa do Meio. 3 quartos sendo 1 suíte, 2 vagas.',
 'Av. Conselheiro João Moreira Filho, 1234', 'Coroa do Meio', 'Aracaju', 'SE', '49035-560',
 550000.00, 92.00, 88.00, 3, 1, 2, 2,
 '["proximo_praia", "area_servico", "varanda"]',
 'https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800', true, false),

-- APARTAMENTOS ALTO PADRÃO
('apartamento', 'venda', 'Apartamento Luxo 3 Suítes - 13 de Julho Vista Rio',
 'Apartamento sofisticado com vista panorâmica para o rio e mar. 3 suítes com closet, totalmente reformado.',
 'Rua Paulo Freire Oliveira, 567', '13 de Julho', 'Aracaju', 'SE', '49020-390',
 1850000.00, 160.00, 155.00, 3, 3, 4, 2,
 '["vista_mar", "vista_rio", "reformado", "closet", "varanda_gourmet", "armarios_planejados", "area_lazer"]',
 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', true, true),

('apartamento', 'venda', 'Apartamento Alto Padrão - Jardins Europa',
 'Apartamento sofisticado e completamente reformado com jacuzzi. 234m² em bairro nobre.',
 'Alameda Europa - Cond. Jardins Europa', 'Jardins', 'Aracaju', 'SE', '49026-000',
 2200000.00, 234.00, 230.00, 4, 3, 5, 3,
 '["jacuzzi", "reformado", "closet", "varanda_gourmet", "area_lazer", "piscina", "sauna"]',
 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', true, true),

('apartamento', 'venda', 'Cobertura Duplex - Atalaia Frente Mar',
 'Cobertura espetacular frente ao mar com 3 suítes, piscina privativa e área gourmet.',
 'Av. Santos Dumont, 1890 - Portillo Residence', 'Atalaia', 'Aracaju', 'SE', '49037-000',
 1950000.00, 185.00, 180.00, 3, 3, 4, 3,
 '["frente_mar", "piscina_privativa", "area_gourmet", "varanda_gourmet", "cobertura", "churrasqueira"]',
 'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800', true, true),

-- ========================================
-- CASAS PARA VENDA
-- ========================================

('casa', 'venda', 'Casa 3 Quartos - Jardim Centenário',
 'Casa térrea com 3 quartos sendo 1 suíte, quintal amplo, garagem coberta para 2 carros.',
 'Rua Soldado José do Patrocínio, 345', 'Jardim Centenário', 'Aracaju', 'SE', '49066-000',
 480000.00, 200.00, 145.00, 3, 1, 2, 2,
 '["quintal", "garagem_coberta", "area_servico"]',
 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', true, false),

('casa', 'venda', 'Casa 4 Quartos - Jabotiana',
 'Casa espaçosa em condomínio fechado. 4 quartos sendo 2 suítes, área gourmet e piscina.',
 'Rua dos Ipês, 234 - Cond. Exclusive Jabotiana', 'Jabotiana', 'Aracaju', 'SE', '49095-000',
 750000.00, 280.00, 220.00, 4, 2, 3, 3,
 '["condominio_fechado", "piscina", "area_gourmet", "churrasqueira", "portaria_24h", "playground"]',
 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', true, false),

('casa', 'venda', 'Casa Duplex 4 Suítes - Aruana',
 'Linda casa em condomínio de alto padrão. 4 suítes, escritório, área gourmet completa e piscina.',
 'Rodovia José Sarney - Cond. Guilhermino Rezende', 'Aruana', 'Aracaju', 'SE', '49040-000',
 1650000.00, 420.00, 340.00, 4, 4, 5, 4,
 '["condominio_fechado", "piscina", "churrasqueira", "area_gourmet", "escritorio", "closet", "jardim", "portaria_24h"]',
 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', true, true),

('casa', 'venda', 'Casa Luxo 5 Suítes - Aruana',
 'Mansão em condomínio exclusivo, 5 suítes com closet, piscina, sauna, área gourmet premium.',
 'Rodovia José Sarney - Cond. Ravines', 'Aruana', 'Aracaju', 'SE', '49040-000',
 2300000.00, 550.00, 450.00, 5, 5, 6, 5,
 '["condominio_fechado", "piscina", "sauna", "churrasqueira", "area_gourmet", "escritorio", "closet", "jardim", "portaria_24h", "hidromassagem"]',
 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800', true, true),

-- ========================================
-- IMÓVEIS PARA VENDA E LOCAÇÃO (AMBOS)
-- ========================================

INSERT INTO imoveis (tipo, finalidade, titulo, descricao, endereco, bairro, cidade, estado, cep,
                     preco_venda, preco_locacao, area_total, area_construida, quartos, suites, banheiros, vagas_garagem,
                     caracteristicas, foto_principal, disponivel) VALUES

('comercial', 'ambos', 'Sala Comercial - Jardins',
 'Sala comercial moderna no Jardins, próximo ao shopping. Ótima para escritório ou consultório.',
 'Av. Ministro Geraldo Barreto Sobral, 789 - Sala 302', 'Jardins', 'Aracaju', 'SE', '49026-010',
 385000.00, 2800.00, 45.00, 42.00, 0, 0, 2, 1,
 '["ar_condicionado", "banheiros_privativos", "proximo_shopping", "copa"]',
 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', true),

('comercial', 'ambos', 'Sala Comercial - 13 de Julho',
 'Ponto comercial em área nobre com 5 salas amplas, 3 banheiros e 2 ar condicionados.',
 'Rua Itabaiana, 456 - Sala 201', '13 de Julho', 'Aracaju', 'SE', '49020-000',
 520000.00, 3500.00, 85.00, 82.00, 0, 0, 3, 2,
 '["ar_condicionado", "banheiros_privativos", "elevador", "copa", "area_nobre"]',
 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800', true),

('apartamento', 'ambos', 'Apartamento 2 Quartos - Atalaia',
 'Ótimo para investimento! Apartamento bem localizado na Atalaia, próximo à orla.',
 'Rua Jordão de Oliveira, 234', 'Atalaia', 'Aracaju', 'SE', '49037-000',
 420000.00, 2500.00, 86.00, 83.00, 3, 0, 2, 1,
 '["proximo_praia", "varanda", "investimento"]',
 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800', true);

-- ========================================
-- CRIAR ALGUMAS CONVERSAS E LEADS DE EXEMPLO
-- ========================================

-- Criar uma conversa exemplo
INSERT INTO conversas (session_id, nome_usuario, email, telefone) VALUES
('demo-session-001', 'Maria Silva', 'maria.silva@example.com', '(79) 99999-1234'),
('demo-session-002', 'João Santos', 'joao.santos@example.com', '(79) 98888-5678');

-- Criar mensagens exemplo
INSERT INTO mensagens (conversa_id, session_id, role, content) VALUES
((SELECT id FROM conversas WHERE session_id = 'demo-session-001'), 'demo-session-001', 'user', 'Olá, estou procurando apartamento para alugar'),
((SELECT id FROM conversas WHERE session_id = 'demo-session-001'), 'demo-session-001', 'assistant', 'Olá! Que ótimo que você está procurando um apartamento. Para te ajudar melhor, me conta: você busca qual bairro? Quantos quartos precisa?');

-- Criar leads exemplo
INSERT INTO leads (conversa_id, nome, email, telefone, interesse, orcamento_min, orcamento_max, observacoes, status) VALUES
((SELECT id FROM conversas WHERE session_id = 'demo-session-001'), 'Maria Silva', 'maria.silva@example.com', '(79) 99999-1234', 'locacao', 2000.00, 3500.00, 'Procura 2 quartos na Atalaia ou Coroa do Meio', 'em_atendimento');
