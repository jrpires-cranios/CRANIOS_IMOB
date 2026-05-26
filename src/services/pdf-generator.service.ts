import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { supabase } from '../config/supabase.js';
import { LeadMemoryService } from './lead-memory.service.js';
import { calculateMatchScore } from './match-score.service.js';

interface PropertyData {
    id: string;
    titulo: string;
    bairro: string;
    tipo?: string;
    preco_venda?: number;
    preco_locacao?: number;
    finalidade: string;
    foto_principal: string;
    fotos?: string[];
    quartos: number;
    banheiros?: number;
    suites?: number;
    vagas_garagem?: number;
    area_construida?: number;
    valor_condominio?: number;
    valor_iptu?: number;
    descricao?: string;
}

interface ClientConfig {
    nome: string;
    logo_url?: string;
    telefone?: string;
    email?: string;
    tenant_id?: string;
    cor_primaria?: string;
    cor_secundaria?: string;
    creci?: string;
    whatsapp?: string;
}

interface PDFGeneratorParams {
    imovelData: PropertyData;
    clienteConfig: ClientConfig;
    r2StorageService: any;
    leadIdentifier?: string; // Para buscar o Match Score se for enviado a um lead específico
}

export class PDFGeneratorService {
    private template: HandlebarsTemplateDelegate | null = null;

    constructor() {
        this.loadTemplate();
    }

    private loadTemplate() {
        const templatePath = path.join(process.cwd(), 'templates', 'property-book.hbs');

        // Se o template não existir, criar um básico
        if (!fs.existsSync(templatePath)) {
            console.warn('[PDFGenerator] Template não encontrado, usando template básico');
            this.template = Handlebars.compile(this.getBasicTemplate());
            return;
        }

        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        this.template = Handlebars.compile(templateSource);
    }

    /**
     * Gera PDF do imóvel e salva link no Supabase
     */
    async gerarBookImovel(
        params: PDFGeneratorParams
    ): Promise<{ pdfUrl: string, pdfBuffer: Buffer }> {
        const { imovelData, clienteConfig, r2StorageService, leadIdentifier } = params;
        if (!this.template) {
            throw new Error('[PDFGenerator] Template não carregado');
        }

        // 1. Preparar dados para o template
        const preco = imovelData.finalidade === 'venda'
            ? imovelData.preco_venda
            : imovelData.preco_locacao;

        // MATCH SCORE
        let matchHtml = '';
        if (leadIdentifier) {
            try {
                const tenantId = clienteConfig.tenant_id || 'DEFAULT_TENANT';
                const memoryService = new LeadMemoryService(supabase, tenantId);
                const profile = await memoryService.getProfile(leadIdentifier, 'whatsapp');
                if (profile) {
                    const imovelCompat: any = {
                        tipo: imovelData.tipo || 'casa',
                        finalidade: imovelData.finalidade,
                        bairro: imovelData.bairro,
                        preco: preco || 0,
                        quartos: imovelData.quartos
                    };
                    const matchResult = calculateMatchScore(imovelCompat, profile);

                    matchHtml = `
                    <div class="match-score-box" style="background:${matchResult.color}15; border:2px solid ${matchResult.color}; border-radius:12px; padding:16px; margin: 20px 0; display:flex; align-items:center; gap:16px;">
                        <div style="text-align:center;">
                            <div style="font-size:36px; font-weight:900; color:${matchResult.color}">${matchResult.percentage}</div>
                            <div style="font-size:11px; color:#64748B; font-weight:600; letter-spacing:0.05em">COMPATIBILIDADE</div>
                        </div>
                        <div>
                            <div style="font-size:16px; font-weight:700; color:#0F2645">${matchResult.label} com seu perfil</div>
                            <div style="font-size:12px; color:#64748B; margin-top:4px">Calculado pela IA com base nas suas preferências (Score: ${matchResult.score}/100)</div>
                        </div>
                    </div>`;
                }
            } catch (err) {
                console.warn('[PDFGenerator] Falha ao calcular Match Score:', err);
            }
        }

        const cor1 = clienteConfig.cor_primaria || '#667eea';
        const cor2 = clienteConfig.cor_secundaria || '#764ba2';
        const allFotos = [imovelData.foto_principal, ...(imovelData.fotos || [])].filter(Boolean);

        const data = {
            logo: clienteConfig.logo_url || `https://placehold.co/200x80/${cor1.replace('#', '')}/white?text=${encodeURIComponent(clienteConfig.nome)}`,
            titulo: imovelData.titulo,
            bairro: imovelData.bairro,
            preco: Number(preco || 0).toLocaleString('pt-BR'),
            finalidade: imovelData.finalidade === 'venda' ? 'Venda' : 'Locação',
            foto_capa: allFotos[0] || '',
            fotos: allFotos.slice(1),
            fotos_todas: allFotos,
            total_fotos: allFotos.length,
            quartos: imovelData.quartos,
            banheiros: imovelData.banheiros || 0,
            suites: imovelData.suites || 0,
            vagas: imovelData.vagas_garagem || 0,
            area: imovelData.area_construida || 0,
            condominio: (imovelData.valor_condominio || 0) === 0 ? '—' : 'R$ ' + Number(imovelData.valor_condominio || 0).toLocaleString('pt-BR'),
            iptu: (imovelData.valor_iptu || 0) === 0 ? '—' : 'R$ ' + Number(imovelData.valor_iptu || 0).toLocaleString('pt-BR'),
            descricao: imovelData.descricao || 'Imóvel em excelente localização.',
            imobiliaria: clienteConfig.nome,
            telefone: clienteConfig.whatsapp || clienteConfig.telefone || '',
            email: clienteConfig.email || '',
            creci: clienteConfig.creci || '',
            cor_primaria: cor1,
            cor_secundaria: cor2,
            matchHtml: matchHtml
        };

        // 2. Renderizar HTML
        const html = this.template(data);

        // 3. Gerar PDF com Puppeteer
        const puppeteerArgs = process.env.PUPPETEER_ARGS
            ? process.env.PUPPETEER_ARGS.split(/\s+/).filter(Boolean)
            : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: puppeteerArgs
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 }
        });

        await browser.close();

        // 4. Upload pro R2
        const pdfUrl = await r2StorageService.uploadPropertyPDF(
            Buffer.from(pdfBuffer),
            imovelData.id,
            'general' // clienteId - usar "general" se não tiver multi-tenant ainda
        );

        // 5. SALVAR LINK NO SUPABASE
        const { error } = await supabase
            .from('imoveis')
            .update({ book_pdf_url: pdfUrl })
            .eq('id', imovelData.id);

        if (error) {
            console.error('[PDFGenerator] Erro ao salvar URL no Supabase:', error.message);
        } else {
            console.log(`[PDFGenerator] ✅ PDF salvo: ${pdfUrl} → Supabase atualizado`);
        }

        return { pdfUrl, pdfBuffer: Buffer.from(pdfBuffer) };
    }

    /**
     * Busca PDF existente ou gera novo
     */
    async obterOuGerarPDF(
        imovelId: string,
        clienteConfig: ClientConfig,
        r2StorageService: any,
        leadIdentifier?: string
    ): Promise<string> {
        // 1. Verificar se já existe PDF no Supabase
        const { data: imovel, error } = await supabase
            .from('imoveis')
            .select('*, book_pdf_url')
            .eq('id', imovelId)
            .single();

        if (error) {
            throw new Error(`Imóvel não encontrado: ${imovelId}`);
        }

        // 2. Se já tem PDF, retornar o link
        if (imovel.book_pdf_url) {
            console.log(`[PDFGenerator] PDF já existe: ${imovel.book_pdf_url}`);
            return imovel.book_pdf_url;
        }

        // 3. Se não tem (ou se a gente precisa renderizar de novo por conta de um leadIdentifier), gerar novo
        // Idealmente não renderizamos toda vez *exceto* se quisermos gerar PDF personalizado para cada lead 
        // Vamos logar:
        console.log(`[PDFGenerator] Gerando novo PDF para imóvel ${imovelId}`);
        const { pdfUrl } = await this.gerarBookImovel({ imovelData: imovel, clienteConfig, r2StorageService, leadIdentifier });

        return pdfUrl;
    }

    /**
     * Template HTML básico (fallback)
     */
    private getBasicTemplate(): string {
        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #f8f9fa; color: #1a1a2e; }

    /* ── CAPA ── */
    .cover {
      position: relative; width: 100%; height: 100vh; min-height: 800px;
      display: flex; flex-direction: column; overflow: hidden; page-break-after: always;
    }
    .cover-bg {
      position: absolute; inset: 0;
      background: linear-gradient(160deg, {{cor_primaria}} 0%, {{cor_secundaria}} 100%);
    }
    {{#if foto_capa}}
    .cover-photo {
      position: absolute; inset: 0;
      background: url('{{foto_capa}}') center/cover no-repeat;
    }
    .cover-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.72) 100%);
    }
    {{/if}}
    .cover-content {
      position: relative; z-index: 2; display: flex; flex-direction: column;
      height: 100%; padding: 48px;
    }
    .cover-header { display: flex; align-items: center; justify-content: space-between; }
    .cover-logo { height: 52px; object-fit: contain; filter: brightness(0) invert(1); }
    .cover-badge {
      background: rgba(255,255,255,0.2); backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.35); border-radius: 24px;
      padding: 6px 18px; font-size: 13px; font-weight: 600; color: white; letter-spacing: 0.06em;
    }
    .cover-body { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; }
    .cover-tag {
      display: inline-block; background: {{cor_primaria}}; color: white;
      font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
      padding: 5px 14px; border-radius: 4px; margin-bottom: 16px;
    }
    .cover-title { font-size: 42px; font-weight: 800; color: white; line-height: 1.15; margin-bottom: 12px; }
    .cover-sub { font-size: 18px; color: rgba(255,255,255,0.8); margin-bottom: 32px; }
    .cover-price { font-size: 38px; font-weight: 800; color: white; }
    .cover-price-label { font-size: 13px; color: rgba(255,255,255,0.65); font-weight: 500; margin-bottom: 6px; }
    .cover-chips { display: flex; gap: 10px; margin-top: 28px; flex-wrap: wrap; }
    .chip {
      background: rgba(255,255,255,0.15); backdrop-filter: blur(6px);
      border: 1px solid rgba(255,255,255,0.3); border-radius: 20px;
      padding: 6px 16px; font-size: 13px; font-weight: 500; color: white;
    }

    /* ── GALERIA DE FOTOS ── */
    .section { padding: 48px; background: white; page-break-inside: avoid; }
    .section-title {
      font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
      color: {{cor_primaria}}; margin-bottom: 24px; display: flex; align-items: center; gap: 10px;
    }
    .section-title::after { content: ''; flex: 1; height: 2px; background: {{cor_primaria}}22; }
    .photos-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .photo-item { border-radius: 12px; overflow: hidden; aspect-ratio: 4/3; background: #eee; }
    .photo-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .photo-item.wide { grid-column: span 2; aspect-ratio: 16/7; }

    /* ── CARACTERÍSTICAS ── */
    .details-bg { background: #f8f9fa; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card {
      background: white; border-radius: 12px; padding: 20px; text-align: center;
      border: 1px solid #e8eaf0;
    }
    .stat-icon { font-size: 28px; margin-bottom: 8px; }
    .stat-value { font-size: 24px; font-weight: 800; color: {{cor_primaria}}; }
    .stat-label { font-size: 11px; color: #94a3b8; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; margin-top: 4px; }
    .costs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; }
    .cost-item { background: white; border-radius: 10px; padding: 16px; border: 1px solid #e8eaf0; }
    .cost-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; }
    .cost-value { font-size: 15px; font-weight: 700; color: #1a1a2e; }

    /* ── DESCRIÇÃO ── */
    .desc-text { font-size: 15px; line-height: 1.7; color: #374151; }

    /* ── RODAPÉ ── */
    .footer {
      background: linear-gradient(135deg, {{cor_primaria}} 0%, {{cor_secundaria}} 100%);
      padding: 36px 48px; display: flex; align-items: center; justify-content: space-between;
    }
    .footer-logo { height: 40px; object-fit: contain; filter: brightness(0) invert(1); }
    .footer-info { text-align: right; color: rgba(255,255,255,0.9); }
    .footer-name { font-size: 16px; font-weight: 700; color: white; margin-bottom: 4px; }
    .footer-detail { font-size: 12px; color: rgba(255,255,255,0.75); }
  </style>
</head>
<body>

<!-- ══ CAPA ══ -->
<div class="cover">
  <div class="cover-bg"></div>
  {{#if foto_capa}}<div class="cover-photo"></div><div class="cover-overlay"></div>{{/if}}
  <div class="cover-content">
    <div class="cover-header">
      <img src="{{logo}}" alt="{{imobiliaria}}" class="cover-logo">
      <span class="cover-badge">{{finalidade}}</span>
    </div>
    <div class="cover-body">
      <span class="cover-tag">{{finalidade}}</span>
      <h1 class="cover-title">{{titulo}}</h1>
      <p class="cover-sub">{{bairro}}</p>
      <p class="cover-price-label">VALOR</p>
      <p class="cover-price">R$ {{preco}}</p>
      <div class="cover-chips">
        {{#if quartos}}<span class="chip">🛏 {{quartos}} Quartos</span>{{/if}}
        {{#if banheiros}}<span class="chip">🚿 {{banheiros}} Banheiros</span>{{/if}}
        {{#if area}}<span class="chip">📐 {{area}} m²</span>{{/if}}
        {{#if vagas}}<span class="chip">🚗 {{vagas}} Vagas</span>{{/if}}
      </div>
    </div>
  </div>
</div>

<!-- ══ GALERIA DE FOTOS ══ -->
{{#if fotos.length}}
<div class="section">
  <div class="section-title">Galeria de Fotos</div>
  <div class="photos-grid">
    {{#each fotos}}
      <div class="photo-item {{#if @first}}wide{{/if}}">
        <img src="{{this}}" alt="Foto {{@index}}">
      </div>
    {{/each}}
  </div>
</div>
{{/if}}

<!-- ══ CARACTERÍSTICAS ══ -->
<div class="section details-bg">
  <div class="section-title">Características do Imóvel</div>
  <div class="stats-grid">
    {{#if quartos}}
    <div class="stat-card">
      <div class="stat-icon">🛏️</div>
      <div class="stat-value">{{quartos}}</div>
      <div class="stat-label">Quartos{{#if suites}} · {{suites}} Suíte(s){{/if}}</div>
    </div>
    {{/if}}
    {{#if banheiros}}
    <div class="stat-card">
      <div class="stat-icon">🚿</div>
      <div class="stat-value">{{banheiros}}</div>
      <div class="stat-label">Banheiros</div>
    </div>
    {{/if}}
    {{#if area}}
    <div class="stat-card">
      <div class="stat-icon">📐</div>
      <div class="stat-value">{{area}}</div>
      <div class="stat-label">m² construídos</div>
    </div>
    {{/if}}
    {{#if vagas}}
    <div class="stat-card">
      <div class="stat-icon">🚗</div>
      <div class="stat-value">{{vagas}}</div>
      <div class="stat-label">Vagas garagem</div>
    </div>
    {{/if}}
  </div>
  <div class="costs-grid">
    <div class="cost-item">
      <div class="cost-label">Condomínio / mês</div>
      <div class="cost-value">{{condominio}}</div>
    </div>
    <div class="cost-item">
      <div class="cost-label">IPTU / ano</div>
      <div class="cost-value">{{iptu}}</div>
    </div>
  </div>
</div>

<!-- ══ MATCH SCORE (quando enviado para lead) ══ -->
{{#if matchHtml}}
<div class="section">
  {{{matchHtml}}}
</div>
{{/if}}

<!-- ══ DESCRIÇÃO ══ -->
<div class="section">
  <div class="section-title">Sobre o Imóvel</div>
  <p class="desc-text">{{descricao}}</p>
</div>

<!-- ══ RODAPÉ ══ -->
<div class="footer">
  <img src="{{logo}}" alt="{{imobiliaria}}" class="footer-logo">
  <div class="footer-info">
    <div class="footer-name">{{imobiliaria}}{{#if creci}} · CRECI {{creci}}{{/if}}</div>
    {{#if telefone}}<div class="footer-detail">📞 {{telefone}}</div>{{/if}}
    {{#if email}}<div class="footer-detail">✉ {{email}}</div>{{/if}}
  </div>
</div>

</body>
</html>`;
    }
}

export const pdfGeneratorService = new PDFGeneratorService();
