import { MessageCircle } from 'lucide-react';
import { openWhatsApp } from '../utils/whatsapp';
import config from '../config';

export default function StickyWhatsApp() {
  if (!config.showWhatsApp) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-gradient-to-r from-green-500 to-green-600 text-white p-4 shadow-2xl z-40">
      <button
        onClick={() => openWhatsApp('Quero saber mais sobre a Crânios Imob!')}
        className="w-full flex items-center justify-center gap-3 font-semibold"
      >
        <MessageCircle className="w-6 h-6" />
        <span>Quero saber mais sobre a Crânios Imob!</span>
      </button>
    </div>
  );
}
