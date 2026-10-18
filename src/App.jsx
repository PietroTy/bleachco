import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// Styles
import './styles/global.css';

// Common elements
import Nav from './components/common/Nav';
import Footer from './components/common/Footer';
import CartDrawer from './components/common/CartDrawer';
import Toast from './components/common/Toast';
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

export default function App() {
  const location = useLocation();

  // Scroll to top and trigger animations/parallax on route change
  useEffect(() => {
    window.scrollTo(0, 0);

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

    // Give DOM a split second to render
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(timer);
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
      <Toast />
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
        </Routes>
      </main>

      <Footer />
      <BackToTop />
    </>
  );
}
