import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import { CONTACT_LINKS } from '../../config/contact';

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" style={{ display: 'inline-block', marginBottom: '16px' }}>
              <img src={logoImg} alt="Bleach.Co Logo" style={{ height: '60px', width: 'auto', display: 'block' }} />
            </Link>
            <p className="eyebrow" style={{ marginBottom: '12px', display: 'block' }}>A mancha é a arte.</p>
            <p>Camisetas artesanais feitas à mão. São Paulo, SP.</p>
          </div>
          <div className="footer-col">
            <h4>Estampas</h4>
            <ul>
              <li><Link to="/produto/eclipse">Eclipse</Link></li>
              <li><Link to="/produto/spy">Spy</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contato</h4>
            <ul>
              {CONTACT_LINKS.map((c) => (
                <li key={c.label}><a href={c.href} target="_blank" rel="noopener noreferrer">{c.value}</a></li>
              ))}
              <li><Link to="/contato">Fale com a gente</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} bleach.co</span>
          <span>Feito à mão ✦ SP</span>
        </div>
      </div>
    </footer>
  );
}
