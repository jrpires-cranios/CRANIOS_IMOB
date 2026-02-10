// Configuration values for the application
// These values can be set through environment variables or have defaults

interface Config {
  // API endpoint for fetching properties (GET /buscar-imoveis)
  apiUrl: string;
  
  // Webhook endpoint for AI chat (POST /chat)
  webhookUrl: string;
  
  // Backend data source (default: "airtable")
  dataBackend: string;
  
  // Brand name
  brandName: string;
  
  // Logo URL
  logoUrl: string;
  
  // Whether to show WhatsApp integration
  showWhatsApp: boolean;
  
  // WhatsApp phone number in format +55DD9XXXXXXXX
  whatsappPhone: string;
  
  // WhatsApp UTM parameters
  whatsappUtm: string;
}

const config: Config = {
  apiUrl: import.meta.env.VITE_API_URL || '',
  webhookUrl: import.meta.env.VITE_WEBHOOK_URL || '',
  dataBackend: import.meta.env.VITE_DATA_BACKEND || 'airtable',
  brandName: import.meta.env.VITE_BRAND_NAME || 'Crânios IMOB',
  logoUrl: import.meta.env.VITE_LOGO_URL || 'https://lguffaszqhygxowuinuj.supabase.co/storage/v1/object/public/Imagens%20para%20o%20site/Logo-Cranios-Imob.png',
  showWhatsApp: import.meta.env.VITE_SHOW_WHATSAPP === 'true',
  whatsappPhone: import.meta.env.VITE_WHATSAPP_PHONE || '',
  whatsappUtm: import.meta.env.VITE_WHATSAPP_UTM || '',
};

export default config;
