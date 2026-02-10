export default function CTA() {
  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-[#1D3E7D] via-[#2558b8] to-[#1D3E7D]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Vamos Tornar Sua Jornada Imobiliária Simples
        </h2>
        <p className="text-xl text-blue-100 mb-8">
          Entre em contato hoje e descubra como podemos ajudá-lo a encontrar o imóvel perfeito
        </p>
        <button
          onClick={scrollToContact}
          className="bg-white text-[#1D3E7D] px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          Fale Conosco
        </button>
      </div>
    </section>
  );
}
