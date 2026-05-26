import axios, { AxiosInstance } from 'axios';

interface AsaasCustomer {
    name: string;
    cpfCnpj: string;
    email?: string;
    phone?: string;
    mobilePhone?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    province?: string;
    postalCode?: string;
}

interface AsaasPayment {
    customer: string;
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
    valu

    e: number;
    dueDate: string;
    description?: string;
    externalReference?: string;
}

interface AsaasSubscription {
    customer: string;
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
    value: number;
    cycle: 'MONTHLY' | 'YEARLY';
    description?: string;
    nextDueDate?: string;
}

export class AsaasService {
    private api: AxiosInstance;
    private isProduction: boolean;

    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';
        const apiKey = this.isProduction
            ? (process.env.ASAAS_API_KEY || '')
            : ((process.env.ASAAS_SANDBOX || process.env.ASAAS_SANBOX) || '');

        const baseURL = this.isProduction
            ? 'https://www.asaas.com/api/v3'
            : 'https://sandbox.asaas.com/api/v3';

        this.api = axios.create({
            baseURL,
            headers: {
                'access_token': apiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`[AsaasService] Initialized in ${this.isProduction ? 'PRODUCTION' : 'SANDBOX'} mode`);
    }

    /**
     * Criar cliente no Asaas
     */
    async createCustomer(data: AsaasCustomer) {
        try {
            const response = await this.api.post('/customers', data);
            console.log(`[AsaasService] Cliente criado: ${response.data.id}`);
            return response.data;
        } catch (error: any) {
            console.error('[AsaasService] Erro ao criar cliente:', error.response?.data || error.message);
            throw new Error(`Falha ao criar cliente no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
        }
    }

    /**
     * Criar cobrança recorrente (ALUGUEL)
     */
    async createSubscription(data: AsaasSubscription) {
        try {
            const response = await this.api.post('/subscriptions', data);
            console.log(`[AsaasService] Assinatura criada: ${response.data.id}`);
            return response.data;
        } catch (error: any) {
            console.error('[AsaasService] Erro ao criar assinatura:', error.response?.data || error.message);
            throw new Error(`Falha ao criar assinatura: ${error.response?.data?.errors?.[0]?.description || error.message}`);
        }
    }

    /**
     * Criar cobrança única (CAUÇÃO, ENTRADA)
     */
    async createPayment(data: AsaasPayment) {
        try {
            const response = await this.api.post('/payments', data);
            console.log(`[AsaasService] Cobrança criada: ${response.data.id}`);
            return response.data;
        } catch (error: any) {
            console.error('[AsaasService] Erro ao criar cobrança:', error.response?.data || error.message);
            throw new Error(`Falha ao criar cobrança: ${error.response?.data?.errors?.[0]?.description || error.message}`);
        }
    }

    /**
     * Emitir 2ª via de boleto
     */
    async getPaymentBankSlipUrl(paymentId: string): Promise<string> {
        try {
            const response = await this.api.get(`/payments/${paymentId}`);
            return response.data.bankSlipUrl || response.data.invoiceUrl;
        } catch (error: any) {
            console.error('[AsaasService] Erro ao buscar boleto:', error.response?.data || error.message);
            throw new Error('Falha ao buscar link do boleto');
        }
    }

    /**
     * Gerar link de pagamento PIX
     */
    async getPixQRCode(paymentId: string): Promise<{ qrCode: string; payload: string }> {
        try {
            const response = await this.api.get(`/payments/${paymentId}/pixQrCode`);
            return {
                qrCode: response.data.encodedImage, // Base64 da imagem QR Code
                payload: response.data.payload // Payload para copia e cola
            };
        } catch (error: any) {
            console.error('[AsaasService] Erro ao buscar PIX:', error.response?.data || error.message);
            throw new Error('Falha ao buscar QR Code PIX');
        }
    }

    /**
     * Cancelar assinatura (fim de contrato de locação)
     */
    async cancelSubscription(subscriptionId: string) {
        try {
            const response = await this.api.delete(`/subscriptions/${subscriptionId}`);
            console.log(`[AsaasService] Assinatura cancelada: ${subscriptionId}`);
            return response.data;
        } catch (error: any) {
            console.error('[AsaasService] Erro ao cancelar assinatura:', error.response?.data || error.message);
            throw new Error('Falha ao cancelar assinatura');
        }
    }

    /**
     * Verificar status de pagamento
     */
    async getPaymentStatus(paymentId: string) {
        try {
            const response = await this.api.get(`/payments/${paymentId}`);
            return {
                id: response.data.id,
                status: response.data.status, // PENDING, RECEIVED, CONFIRMED, OVERDUE, etc
                value: response.data.value,
                netValue: response.data.netValue,
                dueDate: response.data.dueDate,
                paymentDate: response.data.paymentDate
            };
        } catch (error: any) {
            console.error('[AsaasService] Erro ao verificar status:', error.response?.data || error.message);
            throw new Error('Falha ao verificar status do pagamento');
        }
    }

    /**
     * Criar link de pagamento (alternativa ao boleto/PIX direto)
     */
    async createPaymentLink(paymentId: string) {
        try {
            const response = await this.api.get(`/payments/${paymentId}/identificationField`);
            return response.data.identificationField; // Link de pagamento
        } catch (error: any) {
            console.error('[AsaasService] Erro ao criar link:', error.response?.data || error.message);
            throw new Error('Falha ao criar link de pagamento');
        }
    }
}

export const asaasService = new AsaasService();
