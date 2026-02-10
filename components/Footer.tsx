import config from '../config';

const footerLinks = {
  servicos: [
    { label: 'Compra', href: '#properties' },
    { label: 'Venda', href: '#contact' },
    { label: 'Aluguel', href: '#properties' },
    { label: 'Investimentos', href: '#properties' },
  ],
  empresa: [
    { label: 'Sobre Nós', href: '#about' },
    { label: 'Equipe', href: '#about' },
    { label: 'Carreiras', href: '#contact' },
    { label: 'Blog', href: '#' },
  ],
  suporte: [
    { label: 'Central de Ajuda', href: '#faq' },
    { label: 'Contato', href: '#contact' },
    { label: 'Termos de Uso', href: '#' },
    { label: 'Privacidade', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer id="contact" className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="lg:col-span-1">
            <a href="https://www.cranios.pro" target="_blank" rel="noopener noreferrer">
              <img
                src="https://lguffaszqhygxowuinuj.supabase.co/storage/v1/object/public/Imagens%20para%20o%20site/cranios-logo-branca.png"
                alt="Logo Crânios"
                className="h-10 w-auto mb-4"
              />
            </a>
            <p className="text-gray-400 text-sm leading-relaxed">
              Startup líder em soluções de Inteligência Artificial e automação. Transformamos ideias em sistemas únicos que revolucionam processos empresariais.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Serviços</h3>
            <ul className="space-y-2">
              {footerLinks.servicos.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Empresa</h3>
            <ul className="space-y-2">
              {footerLinks.empresa.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contato</h3>
            <ul className="space-y-2">
              <li className="text-gray-400 text-sm">+55 11 9 1337-7110</li>
              <li>
                <a href="mailto:ola@cranios.pro" className="text-gray-400 hover:text-white transition-colors text-sm">
                  ola@cranios.pro
                </a>
              </li>
              <li>
                <a href="https://www.cranios.pro" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm">
                  www.cranios.pro
                </a>
              </li>
              <li>
                <a href="mailto:ceo@cranios.pro" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Fale com o CEO: ceo@cranios.pro
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-gray-400 text-sm">
            © 2025 Todos os Direitos Reservados a Crânios S/A - CNPJ: 46.132.028/0001-83
          </p>
        </div>
      </div>
    </footer>
  );
}
