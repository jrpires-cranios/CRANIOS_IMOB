/**
 * CONHECIMENTO BASE PARA AGENTES - LANÇAMENTOS PREMIUM
 * 
 * Este arquivo contém o conhecimento estruturado para os agentes Amanda (qualificação)
 * e Gabriel (lançamentos/vendas) sobre empreendimentos de alto padrão.
 * 
 * Será usado para popular o Pinecone com vetores especializados.
 */

export interface EmpreendimentoKnowledge {
    nome: string;
    arquivo_pdf: string;
    local: string;
    cidade: string;
    categoria: 'alto_padrao' | 'medio_padrao' | 'popular';
    resumo_executivo: string;
    plantas: PlantaInfo[];
    lazer: string[];
    servicos: string[];
    localizacao: LocalizacaoInfo;
    diferenciais: string[];
    investimento: InvestimentoInfo;
    qualificacao: QualificacaoScript;
    vendas: VendasScript;
}

interface PlantaInfo {
    tipo: string;
    area: string;
    config: string;
    vagas: number;
    preco_base?: string;
    ideal_para: string;
}

interface LocalizacaoInfo {
    endereco: string;
    bairro: string;
    proximidades: string[];
    vista: string;
    diferencial: string;
}

interface InvestimentoInfo {
    faixa_preco: string;
    roi_mensal: string;
    aluguel_estimado: string;
    valorizacao_estimada: string;
}

interface QualificacaoScript {
    personas_alvo: string[];
    perguntas_investigativas: string[];
    desqualificadores: string[];
    criterios_9_5: string[];
}

interface VendasScript {
    rapport_elite: string[];
    quebra_objecoes: { objecao: string; resposta: string }[];
    gatilhos_emocionais: string[];
    fechamento: string;
}

/**
 * BASE DE CONHECIMENTO - LINDENBERG VISTA ARUANA
 */
export const LINDENBERG_VISTA_ARUANA: EmpreendimentoKnowledge = {
    nome: "Lindenberg Vista Aruana",
    arquivo_pdf: "Lançamentos/Book-LUXO-Lindenberg-Vista-Brooklin.pdf",
    local: "Rua Luisânia, 185 - Aruana, Aracaju-SE",
    cidade: "Aracaju",
    categoria: "alto_padrao",

    resumo_executivo: `Alto Padrão Absoluto - Torre 33 andares (100m+ altura), 65 unidades exclusivas | 
Apts 261-520m² (3-4 suítes) | Parceria Lindenberg (70 anos) + EZTEC (40 anos) | 
Lazer 5 estrelas: Piscina raia 25m, spa, pilates, fitness, rooftop | 
Serviços Personna Pay-Per-Use | Preço: R$2,8M-R$5,5M | ROI: 0,65-0,75%/mês`,

    plantas: [
        {
            tipo: "Garden 1",
            area: "333m²",
            config: "4 suítes, terraço jardim privativo, acesso direto lazer",
            vagas: 4,
            ideal_para: "Famílias tradicionais HNWI"
        },
        {
            tipo: "Garden 2",
            area: "371m²",
            config: "4 suítes master, home theater, closet duplo",
            vagas: 4,
            ideal_para: "Executivos aposentados"
        },
        {
            tipo: "Tipo Padrão",
            area: "261m²",
            config: "4 suítes (ou 3 + escritório), living 60m², varanda gourmet",
            vagas: 4,
            preco_base: "R$2.900.000",
            ideal_para: "Famílias empresariais"
        },
        {
            tipo: "Tipo Opção 3 Suítes",
            area: "261m²",
            config: "3 suítes ampliadas, sala 70m², closet master 20m²",
            vagas: 4,
            ideal_para: "Casais executivos sem filhos"
        },
        {
            tipo: "Penthouse Único",
            area: "520m²",
            config: "4-5 suítes, rooftop privativo, piscina descoberta, adega climatizada, terraço 150m²",
            vagas: 6,
            preco_base: "R$5.200.000",
            ideal_para: "Ultra HNWI, CEO empresas"
        }
    ],

    lazer: [
        "Piscina adulto raia 25m coberta + piscina descoberta rooftop",
        "Spa privativo + sala massagem",
        "Lounge externo espelho d'água (Benedito Abbud)",
        "Academia climatizada (equipamentos Technogym)",
        "Sala pilates privativa",
        "Salão festas 120m² (ar-condicionado, tratamento acústico)",
        "Bar festas + lounge festas (lareira design)",
        "Pool bar rooftop",
        "Brinquedoteca + playground externo",
        "Pet place premium"
    ],

    servicos: [
        "Home Repair: Manutenção apartamento 24h",
        "Laundry & Repair: Lavanderia + ajustes roupas",
        "Convenience: Compras supermercado entregues",
        "Beauty Care: Manicure, pedicure, cabeleireiro no apt",
        "Massage Time: Agendamento massagens",
        "Personal Trainer: Instrutor físico personalizado",
        "Cleaning Service: Limpeza profissional apts",
        "Pet Care: Passeios + cuidados pets"
    ],

    localizacao: {
        endereco: "Rua Luisânia, 185 (terreno 3.387m²)",
        bairro: "Aruana",
        proximidades: [
            "500m: Supermercado Hiper Bompreço, Farmácia Extrafarma, praia Aruana",
            "1km: Hospital São Lucas, Colégio Master, bancos Itaú/Bradesco Private",
            "2km: Shopping Jardins, restaurantes Cariri/Mangai",
            "3km: Aeroporto Santa Maria (8min carro)"
        ],
        vista: "Mar Aruana + Orla Pôr do Sol (raridade Aracaju!)",
        diferencial: "Aruana = Jardins de São Paulo em Aracaju: +28% valorização 2023-2025, único bairro praiano nobre com infraestrutura completa"
    },

    diferenciais: [
        "Grife Lindenberg 70 anos (700+ empreendimentos) + EZTEC 40 anos",
        "Arquitetura: LE Arquitetos + Carlos Rossi + Benedito Abbud paisagismo",
        "Única torre 100m+ Aruana com vista mar 180° sem interferência",
        "Personna: Personalize planta COM Lindenberg (alvenaria, instalações, acabamentos)",
        "Serviços 5 Estrelas Pay-Per-Use (8 itens)",
        "Escassez real: 65 unidades totais, esgota maio 2026"
    ],

    investimento: {
        faixa_preco: "R$2.800.000 - R$5.500.000",
        roi_mensal: "0,65-0,75% ao mês",
        aluguel_estimado: "R$18.000 - R$22.000/mês (executivos corporativos)",
        valorizacao_estimada: "+15% até 2028"
    },

    qualificacao: {
        personas_alvo: [
            "CEO/Empresário Consolidado (45-65): Renda >R$80k mensal, patrimônio R$5M+",
            "Executivo C-Level (40-60): Renda >R$60k, bônus anuais",
            "Família HNWI Tradicional (50-70): Patrimônio R$10M+, 2+ filhos adultos",
            "Investidor Premium (35-55): Portfólio imobiliário"
        ],

        perguntas_investigativas: [
            "Qual seu maior critério: vista, exclusividade ou investimento?",
            "Renda familiar? Patrimônio imobiliário atual?",
            "Conhece Aruana? Já considerou praia nobre Aracaju?",
            "Timeframe decisão? 30-90 dias?",
            "Pagamento: à vista (60%+) ou financiamento boutique?",
            "Já investiu Lindenberg/EZTEC? Conhece parceria?"
        ],

        desqualificadores: [
            "Renda <R$50k familiar",
            "Vou pensar muito tempo (>6 meses)",
            "Objeção preço inicial (R$3M é caro)",
            "Interesse só apartamento pequeno",
            "Desconhece marcas Lindenberg/EZTEC"
        ],

        criterios_9_5: [
            "Renda ≥R$60k familiar OU patrimônio R$5M+",
            "Conhece/valoriza marcas Lindenberg/EZTEC",
            "Interesse Aruana nobre (não só praia qualquer)",
            "Decisão ≤90 dias",
            "Sem objeção preço R$2,8M+ (naturalizou valor)"
        ]
    },

    vendas: {
        rapport_elite: [
            "Dr. Carlos, CEO perfil igual seu? Fechou Penthouse semana passada!",
            "Imagine: café varanda master, vista mar Aruana 180°, spa privativo, serviços 5*",
            "Aruana = único endereço praiano grife Aracaju. Lindenberg = Jardins SP"
        ],

        quebra_objecoes: [
            {
                objecao: "Preço alto R$3M",
                resposta: "R$11.500/m² Aruana nobre vs R$15k Jardins SP. Investimento: 0,7%/mês aluguel executivo = R$20k/mês!"
            },
            {
                objecao: "261m² pequeno",
                resposta: "Perfeito executivo! Penthouse 520m² disponível. Vista 360°, rooftop privativo, R$5,2M."
            },
            {
                objecao: "Aruana longe centro",
                resposta: "8min aeroporto, 5min Jardins Shopping. Executivos ADORAM. Silêncio + infraestrutura!"
            },
            {
                objecao: "Ainda avalio",
                resposta: "Lindenberg esgota rápido. 3 visitas amanhã. Qual horário: 10h, 14h ou 17h?"
            },
            {
                objecao: "Prefiro casa",
                resposta: "Apartamento Lindenberg = casa suspensa. Pé direito 3m, terraços amplos, segurança 24h blindada!"
            }
        ],

        gatilhos_emocionais: [
            "Status/Pertencimento: Aruana = endereço executivos C-level. Vizinhos: CEOs Petrobrás, Vale, juízes TJ",
            "Legado Familiar: Lindenberg = patrimônio gerações. Apartamento valoriza + mantém nome",
            "Exclusividade Absoluta: 65 famílias ÚNICAS. Portaria reconhece cada morador",
            "Lifestyle Internacional: Spa + serviços = Four Seasons Aracaju. Vista mar = Miami/Barcelona"
        ],

        fechamento: `Dr. Carlos, seu perfil [CEO consolidado] + Aruana + Lindenberg grife = combinação perfeita.
261m² vista mar: R$2,9M (últimas 8 unidades).
Penthouse 520m²: R$5,2M (ÚNICA).
Amanhã 3 visitas agendadas. Horários disponíveis: 10h, 14h ou 17h?
[Escolhe →] Perfeito! Envio dados corretor Lindenberg + plantas Personna agora WhatsApp.
Reserva unidade com R$50k sinal (reversível 7 dias).`
    }
};

/**
 * Lista de todos os empreendimentos (expandir conforme necessário)
 */
export const EMPREENDIMENTOS_DATABASE: EmpreendimentoKnowledge[] = [
    LINDENBERG_VISTA_ARUANA
    // Adicionar outros 5 empreendimentos aqui
];
