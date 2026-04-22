import { supabase } from '../config/supabase.js';
import { OlxAdapter } from '../portals/olx.adapter.js';
import { ZapAdapter } from '../portals/zap.adapter.js';
import { PortalAdapter, PortalImovel } from '../portals/portal-adapter.interface.js';

class PortalPublisherJob {
    private adapters: Record<string, PortalAdapter> = {};

    constructor() {
        this.adapters['olx'] = new OlxAdapter();
        this.adapters['zap'] = new ZapAdapter();
        this.adapters['vivareal'] = new ZapAdapter(); // VivaReal usa o mesmo adapter do ZAP
    }

    async processImovelChange(imovelId: string, tenantId: string, action: 'CREATE' | 'UPDATE' | 'DELETE') {
        try {
            console.log(`[PortalPublisher] Processando ${action} para imóvel ${imovelId}`);

            if (action === 'DELETE') {
                return this.unpublishFromAll(imovelId, tenantId);
            }

            // Busca os dados atualizados do imóvel
            const { data: imovel } = await supabase.from('imoveis').select('*').eq('id', imovelId).single();
            if (!imovel) return;

            // Busca quais portais estão ativos para este tenant e configurados para auto_publish
            const { data: configs } = await supabase.from('portal_configs').select('*').eq('tenant_id', tenantId).eq('enabled', true);
            if (!configs || configs.length === 0) return;

            // Verifica as publicações atuais deste imóvel
            const { data: listings } = await supabase.from('portal_listings').select('*').eq('imovel_id', imovelId);
            const listingsMap = new Map((listings || []).map(l => [l.portal, l]));

            for (const config of configs) {
                const adapter = this.adapters[config.portal];
                if (!adapter) continue;

                const existingListing = listingsMap.get(config.portal);

                if (imovel.status === 'ativo' || imovel.status === 'disponivel') {
                    if (existingListing && existingListing.status === 'published') {
                        // UPDATE
                        if (config.auto_update) {
                            await adapter.update(existingListing.external_id, imovel, config.credentials, config.config);
                            await supabase.from('portal_listings').update({ last_synced_at: new Date() }).eq('id', existingListing.id);
                        }
                    } else {
                        // CREATE
                        if (config.auto_publish) {
                            const result = await adapter.publish(imovel, config.credentials, config.config);
                            if (existingListing) {
                                await supabase.from('portal_listings').update({ external_id: result.externalId, external_url: result.url, status: 'published', last_synced_at: new Date() }).eq('id', existingListing.id);
                            } else {
                                await supabase.from('portal_listings').insert({
                                    tenant_id: tenantId, imovel_id: imovelId, portal: config.portal,
                                    external_id: result.externalId, external_url: result.url, status: 'published', last_synced_at: new Date()
                                });
                            }
                        }
                    }
                } else {
                    // SE O IMOVEL FICOU INATIVO/VENDIDO
                    if (existingListing && existingListing.status === 'published' && config.auto_unpublish) {
                        await adapter.unpublish(existingListing.external_id, config.credentials, config.config);
                        await supabase.from('portal_listings').update({ status: 'unpublished', last_synced_at: new Date() }).eq('id', existingListing.id);
                    }
                }
            }

        } catch (error) {
            console.error(`[PortalPublisher] Erro ao processar imóvel ${imovelId}:`, error);
        }
    }

    async unpublishFromAll(imovelId: string, tenantId: string) {
        const { data: listings } = await supabase.from('portal_listings').select('*').eq('imovel_id', imovelId).eq('status', 'published');
        if (!listings) return;

        const { data: configs } = await supabase.from('portal_configs').select('*').eq('tenant_id', tenantId);
        const configMap = new Map((configs || []).map(c => [c.portal, c]));

        for (const listing of listings) {
            const config = configMap.get(listing.portal);
            const adapter = this.adapters[listing.portal];
            if (adapter && config && config.auto_unpublish) {
                try {
                    await adapter.unpublish(listing.external_id, config.credentials, config.config);
                    await supabase.from('portal_listings').update({ status: 'unpublished', last_synced_at: new Date() }).eq('id', listing.id);
                } catch (err) {
                    console.error(`[PortalPublisher] Falha ao remover ${imovelId} do portal ${listing.portal}`);
                }
            }
        }
    }
}

export const portalPublisher = new PortalPublisherJob();
