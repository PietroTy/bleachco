import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// Styles
import './styles/global.css';

// Common elements
import Nav from './components/common/Nav';
import Footer from './components/common/Footer';
import CartDrawer from './components/common/CartDrawer';
import Toast from './components/common/Toast';
import SoulsBanner from './components/common/SoulsBanner';
import BackToTop from './components/common/BackToTop';

// Pages
import HomePage from './components/pages/HomePage';
import ProductsPage from './components/pages/ProductsPage';
import ProductPage from './components/pages/ProductPage';
import AboutPage from './components/pages/AboutPage';
import ContactPage from './components/pages/ContactPage';
import CheckoutPage from './components/pages/CheckoutPage';
import ConfirmationPage from './components/pages/ConfirmationPage';
import StainPage from './components/pages/StainPage';
import NotFoundPage from './components/pages/NotFoundPage';
import { bleachIn, prepareBleach } from './art/bleachIn';
import BleachBackground from './art/BleachBackground';

// strong fica de fora: é inline e quebra linha, e a mancha animada (uma imagem do tamanho da caixa toda)
// sai esticada e deslocada nos pedaços de linha. Ele usa a textura parada do texto corrido.
const BLEACH = 'h1, h2, h3, h4, .product-tile-name, .product-card-name, .product-price, .contact-channel-value, .nav-logo-img, .footer-logo-img';

// Rótulos pequenos que não precisam do efeito
const NO_BLEACH = '.footer-col h4';

export default function App() {
  const location = useLocation();

  // Scroll to top and trigger animations/parallax on route change
  useEffect(() => {
    window.scrollTo(0, 0);

    // "Tracking" de VHS rapidinho na troca de página
    const main = document.querySelector('.app-main');
    main?.classList.add('vhs-cut');
    const cut = setTimeout(() => main?.classList.remove('vhs-cut'), 380);

    // 1. INTERSECTION OBSERVER FOR SCROLL REVEALS
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    // Títulos, negritos e logo aparecem alvejados quando entram na tela (uma vez cada)
    const pending = new Set();
    const bleacher = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          bleacher.unobserve(entry.target);
          pending.delete(entry.target);
          bleachIn(entry.target);
        });
      },
      { threshold: 0.2 }
    );
    const watchBleach = () => {
      document.querySelectorAll(BLEACH).forEach((el) => {
        // Dentro de outro (ex: negrito num título) quem mancha é o de fora
        if (el.dataset.bleach || el.parentElement.closest(BLEACH) || el.matches(NO_BLEACH)) return;
        el.dataset.bleach = '1';
        pending.add(el);
        prepareBleach(el);
        bleacher.observe(el);
      });
    };

    // Give DOM a split second to render (e de novo pro que chega depois, tipo dados do pedido)
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
      watchBleach();
    }, 100);
    const late = setTimeout(watchBleach, 900);

    return () => {
      clearTimeout(timer);
      clearTimeout(late);
      bleacher.disconnect();
      // O que não chegou a aparecer (ex: rodapé) volta ao normal e é preparado de novo na próxima página
      pending.forEach((el) => {
        delete el.dataset.bleach;
        el.style.opacity = '';
        el.style.webkitTextFillColor = '';
      });
      clearTimeout(cut);
      observer.disconnect();
    };
  }, [location.pathname, location.search]);

  // 2. PARALLAX EFFECT FOR BACKGROUNDS
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;

          // Hero stains
          const stain1 = document.querySelector('.hero-stain-1');
          if (stain1) stain1.style.transform = `translateY(${y * 0.22}px)`;

          const stain2 = document.querySelector('.hero-stain-2');
          if (stain2) stain2.style.transform = `translateY(${-y * 0.12}px)`;

          // Product hero bg
          document.querySelectorAll('.product-hero-bg').forEach((bg) => {
            const parent = bg.closest('.product-hero');
            if (parent) {
              const rect = parent.getBoundingClientRect();
              bg.style.transform = `translateY(${rect.top * 0.28}px)`;
            }
          });

          // Manifesto bg
          document.querySelectorAll('.manifesto-parallax').forEach((bg) => {
            const parent = bg.closest('.manifesto');
            if (parent) {
              const rect = parent.getBoundingClientRect();
              bg.style.transform = `translateY(${rect.top * 0.18}px)`;
            }
          });

          // Generic parallax-bg
          document.querySelectorAll('.parallax-bg[data-speed]').forEach((bg) => {
            const speed = parseFloat(bg.getAttribute('data-speed'));
            const parent = bg.closest('.section, section, .hero, .product-hero');
            if (parent) {
              const rect = parent.getBoundingClientRect();
              bg.style.transform = `translateY(${rect.top * speed}px)`;
            }
          });

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial run

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  return (
    <>
      <BleachBackground />
      <Toast />
      <SoulsBanner />
      <CartDrawer />
      <Nav />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/produtos" element={<ProductsPage />} />
          <Route path="/produto/:id" element={<ProductPage />} />
          <Route path="/sobre" element={<AboutPage />} />
          <Route path="/contato" element={<ContactPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/confirmacao" element={<ConfirmationPage />} />
          <Route path="/mancha/:code" element={<StainPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
      <BackToTop />
    </>
  );
}
