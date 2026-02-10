import { useState, useEffect, useRef } from 'react';
import { Target, Eye } from 'lucide-react';

const stats = [
  { value: '200+', label: 'Projetos' },
  { value: '70+', label: 'Clientes' },
  { value: '10M+', label: 'Investido' },
  { value: '100%', label: 'Satisfação' },
];

export default function About() {
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

  return (
    <section id="about" ref={sectionRef} className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className={`text-4xl md:text-5xl font-bold text-gray-900 mb-4 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            Quem Somos
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Text and Stats */}
          <div
            className={`transition-all duration-1000 ${
              isVisible ? 'opacity-100 -translate-x-0' : 'opacity-0 -translate-x-10'
            }`}
          >
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              A Crânios IMOB é uma startup inovadora dedicada a revolucionar o mercado imobiliário
              brasileiro. Combinamos tecnologia de ponta com um atendimento personalizado para
              oferecer a melhor experiência na busca do seu imóvel ideal.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              Nossa equipe de especialistas está comprometida em tornar o processo de compra,
              venda ou aluguel de imóveis mais simples, transparente e eficiente.
            </p>

            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="text-3xl font-bold text-[#1D3E7D] mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Vision and Mission */}
          <div
            className={`space-y-6 transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}
          >
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Nossa Visão</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Ser a plataforma imobiliária mais confiável e inovadora do Brasil, conectando
                pessoas aos seus lares dos sonhos através da tecnologia e excelência no
                atendimento.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Nossa Missão</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Simplificar o mercado imobiliário através da tecnologia, oferecendo transparência,
                eficiência e um atendimento personalizado que supera as expectativas de nossos
                clientes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
