import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Como posso comprar um imóvel através da Crânios IMOB?',
    answer: 'É simples! Navegue por nossas propriedades, escolha a que mais gosta e entre em contato conosco. Nossa equipe irá guiá-lo através de todo o processo de compra.',
  },
  {
    question: 'Vocês trabalham com financiamento imobiliário?',
    answer: 'Sim! Temos parcerias com as principais instituições financeiras para oferecer as melhores condições de financiamento para nossos clientes.',
  },
  {
    question: 'Posso alugar imóveis pela plataforma?',
    answer: 'Absolutamente! Oferecemos tanto opções de compra quanto de aluguel. Todos os nossos imóveis estão claramente marcados com suas respectivas modalidades.',
  },
  {
    question: 'Os imóveis são mesmo sustentáveis?',
    answer: 'Sim, priorizamos construções ecológicas que utilizam materiais sustentáveis e tecnologias que reduzem o impacto ambiental e economizam energia.',
  },
  {
    question: 'Quanto tempo leva para fechar um negócio?',
    answer: 'O tempo pode variar dependendo do tipo de transação, mas em média, conseguimos concluir processos de compra em 30 a 60 dias.',
  },
  {
    question: 'Posso investir em imóveis para renda passiva?',
    answer: 'Com certeza! Temos uma seleção especial de imóveis ideais para investimento, com alto potencial de valorização e rentabilidade.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" ref={sectionRef} className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className={`text-4xl md:text-5xl font-bold text-gray-900 mb-4 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            Perguntas Frequentes
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-[#1D3E7D] flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-5 text-gray-700 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
