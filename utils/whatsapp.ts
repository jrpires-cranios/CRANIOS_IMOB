import config from '../config';

export function buildWhatsAppLink(customMessage?: string): string {
  const phone = config.whatsappPhone.replace(/\D/g, '');
  const message = customMessage || 'Olá! Vim do site e gostaria de mais informações.';
  const utm = config.whatsappUtm ? `&${config.whatsappUtm}` : '';
  
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${phone}?text=${encodedMessage}${utm}`;
}

export function openWhatsApp(customMessage?: string): void {
  const link = buildWhatsAppLink(customMessage);
  window.open(link, '_blank', 'noopener,noreferrer');
}
