import { PortalAdapter, PortalImovel, PortalPublishResult } from './portal-adapter.interface.js';

export class ZapAdapter implements PortalAdapter {
    portalName = 'zap'; // Também serve Viva Real

    async publish(imovel: PortalImovel, credentials: any, config?: any): Promise<PortalPublishResult> {
        console.log(`[ZAP/VivaReal Adapter] Publicando imóvel ${imovel.id}...`);

        await new Promise(resolve => setTimeout(resolve, 1500));

        const mockExternalId = `zap-${Math.floor(Math.random() * 1000000)}`;
        return {
            externalId: mockExternalId,
            url: `https://zapimoveis.com.br/imovel/${mockExternalId}`
        };
    }

    async update(externalId: string, changes: Partial<PortalImovel>, credentials: any, config?: any): Promise<void> {
        console.log(`[ZAP/VivaReal Adapter] Atualizando imóvel ${externalId}...`, changes);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    async unpublish(externalId: string, credentials: any, config?: any): Promise<void> {
        console.log(`[ZAP/VivaReal Adapter] Removendo imóvel ${externalId}...`);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    async syncStatus(externalId: string, credentials: any, config?: any): Promise<'published' | 'paused' | 'unpublished' | 'error'> {
        return 'published';
    }
}
