import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import config from '../config';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-lg shadow-lg'
          : 'bg-white/60 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <img
              src={config.logoUrl}
              alt={config.brandName}
              className="h-10 w-auto cursor-pointer"
              onClick={() => scrollToSection('hero')}
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('hero')}
              className="text-gray-700 hover:text-[#1D3E7D] transition-colors font-medium"
            >
              Início
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className="text-gray-700 hover:text-[#1D3E7D] transition-colors font-medium"
            >
              Serviços
            </button>
            <button
              onClick={() => scrollToSection('properties')}
              className="text-gray-700 hover:text-[#1D3E7D] transition-colors font-medium"
            >
              Imóveis
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-gray-700 hover:text-[#1D3E7D] transition-colors font-medium"
            >
              Sobre
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="bg-gradient-to-r from-[#1D3E7D] to-[#2558b8] text-white px-6 py-2 rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-medium"
            >
              Contato
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pt-2 pb-4 space-y-2 bg-white/95 backdrop-blur-lg shadow-lg">
          <button
            onClick={() => scrollToSection('hero')}
            className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-[#1D3E7D] rounded-lg transition-colors font-medium"
          >
            Início
          </button>
          <button
            onClick={() => scrollToSection('services')}
            className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-[#1D3E7D] rounded-lg transition-colors font-medium"
          >
            Serviços
          </button>
          <button
            onClick={() => scrollToSection('properties')}
            className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-[#1D3E7D] rounded-lg transition-colors font-medium"
          >
            Imóveis
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-[#1D3E7D] rounded-lg transition-colors font-medium"
          >
            Sobre
          </button>
          <button
            onClick={() => scrollToSection('contact')}
            className="block w-full text-left px-4 py-3 bg-gradient-to-r from-[#1D3E7D] to-[#2558b8] text-white rounded-lg hover:shadow-lg transition-all font-medium"
          >
            Contato
          </button>
        </div>
      </div>
    </nav>
  );
}
