import { MessageCircle, Phone, Mail, MapPin, Calendar, Search } from 'lucide-react';
import { openWhatsApp } from '../utils/whatsapp';
import config from '../config';

const ctas = [
  {
    icon: MessageCircle,
    title: 'Fale Conosco Agora',
    description: 'Tire suas dúvidas em tempo real',
    message: 'Olá! Gostaria de mais informações sobre os imóveis.',
    gradient: 'from-green-500 to-green-700',
  },
  {
    icon: Search,
    title: 'Procurando Imóvel?',
    description: 'Encontre seu lar perfeito',
    message: 'Olá! Estou procurando um imóvel e gostaria de ajuda.',
    gradient: 'from-blue-500 to-blue-700',
  },
  {
    icon: Calendar,
    title: 'Agende uma Visita',
    description: 'Conheça pessoalmente',
    message: 'Olá! Gostaria de agendar uma visita a um imóvel.',
    gradient: 'from-[#1D3E7D] to-[#2558b8]',
  },
  {
    icon: Phone,
    title: 'Consultoria Grátis',
    description: 'Fale com um especialista',
    message: 'Olá! Gostaria de uma consultoria imobiliária.',
    gradient: 'from-orange-500 to-orange-700',
  },
  {
    icon: Mail,
    title: 'Vender seu Imóvel?',
    description: 'Avalie gratuitamente',
    message: 'Olá! Tenho um imóvel para vender e gostaria de uma avaliação.',
    gradient: 'from-red-500 to-red-700',
  },
  {
    icon: MapPin,
    title: 'Investimentos',
    description: 'Oportunidades exclusivas',
    message: 'Olá! Estou interessado em investir em imóveis.',
    gradient: 'from-indigo-500 to-indigo-700',
  },
];

export default function SecaoCTAs() {
  if (!config.showWhatsApp) {
    return null;
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Como Podemos Ajudar?
          </h2>
          <p className="text-xl text-gray-600">
            Entre em contato pelo WhatsApp e receba atendimento personalizado
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ctas.map((cta, index) => {
            const Icon = cta.icon;
            return (
              <button
                key={index}
                onClick={() => openWhatsApp(cta.message)}
                className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-left"
              >
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${cta.gradient} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{cta.title}</h3>
                <p className="text-gray-600">{cta.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
