import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign } from 'lucide-react';

const propertyImages = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500&h=400&fit=crop',
];

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const [projectCount, setProjectCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);
  const [valueCount, setValueCount] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    
    // Animate counters
    const duration = 2000;
    const steps = 60;
    const projectTarget = 200;
    const clientTarget = 70;
    const valueTarget = 10;
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setProjectCount(Math.floor(projectTarget * progress));
      setClientCount(Math.floor(clientTarget * progress));
      setValueCount(Math.floor(valueTarget * progress));
      
      if (currentStep >= steps) {
        clearInterval(interval);
        setProjectCount(projectTarget);
        setClientCount(clientTarget);
        setValueCount(valueTarget);
      }
    }, duration / steps);
    
    return () => clearInterval(interval);
  }, []);

  const scrollToProperties = () => {
    const element = document.getElementById('properties');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen bg-gradient-to-br from-[#1D3E7D] via-[#2558b8] to-[#1D3E7D] pt-24 pb-16 overflow-hidden"
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="lg:col-span-1 space-y-6">
            <div
              className={`transition-all duration-1000 ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-10'
              }`}
            >
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                Encontre Seu
              </h1>
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                Lar Perfeito
              </h1>
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                Hoje
              </h1>
            </div>

            <p
              className={`text-xl text-blue-100 transition-all duration-1000 delay-300 ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-10'
              }`}
            >
              Descubra propriedades luxuosas e sustentáveis que se adequam ao seu estilo de vida
            </p>

            <button
              onClick={scrollToProperties}
              className={`bg-white text-[#1D3E7D] px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 transition-all duration-1000 delay-500 ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-10'
              }`}
            >
              Ver Propriedades
            </button>
          </div>

          {/* Middle Column - Floating Property Images */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="relative h-[500px]">
              {propertyImages.map((image, index) => (
                <div
                  key={index}
                  className={`absolute w-64 h-80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-1000 hover:scale-105 hover:rotate-0 hover:z-20 ${
                    isVisible ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    transform: `rotate(${index === 0 ? '-6deg' : index === 1 ? '4deg' : '-3deg'}) translateX(${index * 40}px) translateY(${index * 60}px)`,
                    transitionDelay: `${index * 200}ms`,
                  }}
                >
                  <img
                    src={image}
                    alt={`Property ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="lg:col-span-1 space-y-8">
            <div
              className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 ${
                isVisible
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 translate-x-10'
              }`}
              style={{ transitionDelay: '400ms' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-4xl font-bold text-white">{projectCount}+</div>
                  <div className="text-blue-200 font-medium">Projetos Concluídos</div>
                </div>
              </div>
            </div>

            <div
              className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 ${
                isVisible
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 translate-x-10'
              }`}
              style={{ transitionDelay: '600ms' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-4xl font-bold text-white">{clientCount}+</div>
                  <div className="text-blue-200 font-medium">Clientes Satisfeitos</div>
                </div>
              </div>
            </div>

            <div
              className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 ${
                isVisible
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 translate-x-10'
              }`}
              style={{ transitionDelay: '800ms' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-4xl font-bold text-white">{valueCount}M+</div>
                  <div className="text-blue-200 font-medium">Valor em Propriedades</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
