import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import logoImg from '../../assets/logo-mark.png';

export default function Nav() {
  const { cart, setCartOpen } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [transform, setTransform] = useState('translateY(0)');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let lastScroll = 0;
    const handleScroll = () => {
      const y = window.scrollY;

      if (y > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      if (y > 200) {
        if (y > lastScroll + 8) {
          setTransform('translateY(-100%)');
        } else if (y < lastScroll - 4) {
          setTransform('translateY(0)');
        }
      } else {
        setTransform('translateY(0)');
      }
      lastScroll = y;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      id="navbar"
      className={scrolled ? 'scrolled' : ''}
      style={{
        transform,
        transition: 'background 0.4s ease, border-color 0.4s ease, transform 0.3s ease',
      }}
    >
      <div className="nav-inner">
        <Link to="/" className="logo-brand-link" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src={logoImg} alt="Bleach.Co Logo" className="nav-logo-img" />
        </Link>
        <button
          className={`nav-toggle ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <li>
            <Link to="/" className={isActive('/') ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/produtos" className={isActive('/produtos') || location.pathname.startsWith('/produto/') ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
              Estampas
            </Link>
          </li>
          <li>
            <Link to="/sobre" className={isActive('/sobre') ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
              Sobre
            </Link>
          </li>
          <li>
            <Link to="/contato" className={isActive('/contato') ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
              Contato
            </Link>
          </li>
        </ul>
        <div className="nav-actions">
          <button className="nav-cart-btn" onClick={() => setCartOpen(true)}>
            ◎ Carrinho{' '}
            {totalItems > 0 && <span id="cart-count">{totalItems}</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}
