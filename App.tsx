import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import FeaturedProperties from './components/FeaturedProperties';
import About from './components/About';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import CTA from './components/CTA';
import SecaoCTAs from './components/SecaoCTAs';
import ChatIA from './components/ChatIA';
import StickyWhatsApp from './components/StickyWhatsApp';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Services />
      <FeaturedProperties />
      <About />
      <Testimonials />
      <FAQ />
      <SecaoCTAs />
      <CTA />
      <Footer />
      <ChatIA />
      <StickyWhatsApp />
    </div>
  );
}
