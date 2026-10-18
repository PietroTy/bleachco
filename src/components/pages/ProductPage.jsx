import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { EclipseSvg, SpySvg, ECLIPSE_SVG_RAW, SPY_SVG_RAW } from '../common/SvgAssets';
import { calculateShipping } from '../../services/shippingService';

const Skeleton3D = lazy(() => import('../../art/Skeleton3D'));

const PRODUCTS_DATA = {
  eclipse: {
    id: 'eclipse',
    name: 'ECLIPSE',
    tagline: 'Eclipse solar feito à mão com água sanitária. Peças exclusivas.',
    price: 139,
    svgThumb: ECLIPSE_SVG_RAW,
    heroSvg: (
      <svg viewBox="0 0 1200 900" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', minHeight: '120vh' }}>
        <rect width="1200" height="900" fill="#080808"/>
        {/* Halo externo grande */}
        <ellipse cx="600" cy="450" rx="380" ry="380" fill="#D4521E" opacity="0.07"/>
        <ellipse cx="600" cy="450" rx="320" ry="320" fill="#D4521E" opacity="0.10"/>
        {/* Coroa solar */}
        <ellipse cx="600" cy="450" rx="260" ry="260" fill="#D4521E" opacity="0.75"/>
        {/* Disco negro do eclipse */}
        <ellipse cx="600" cy="450" rx="196" ry="196" fill="#060606"/>
        {/* Anel laranja interno (borda do eclipse) */}
        <ellipse cx="600" cy="450" rx="200" ry="200" fill="none" stroke="#D4521E" strokeWidth="22" opacity="0.3"/>
        {/* Centro luminoso pequeno */}
        <ellipse cx="600" cy="450" rx="42" ry="42" fill="#D4521E" opacity="0.15"/>
        {/* Raios da coroa */}
        <line x1="600" y1="150" x2="600" y2="200" stroke="#D4521E" strokeWidth="3" opacity="0.2"/>
        <line x1="600" y1="700" x2="600" y2="750" stroke="#D4521E" strokeWidth="3" opacity="0.2"/>
        <line x1="310" y1="450" x2="258" y2="450" stroke="#D4521E" strokeWidth="3" opacity="0.2"/>
        <line x1="890" y1="450" x2="942" y2="450" stroke="#D4521E" strokeWidth="3" opacity="0.2"/>
        <line x1="392" y1="242" x2="358" y2="208" stroke="#D4521E" strokeWidth="2" opacity="0.15"/>
        <line x1="808" y1="242" x2="842" y2="208" stroke="#D4521E" strokeWidth="2" opacity="0.15"/>
        <line x1="392" y1="658" x2="358" y2="692" stroke="#D4521E" strokeWidth="2" opacity="0.15"/>
        <line x1="808" y1="658" x2="842" y2="692" stroke="#D4521E" strokeWidth="2" opacity="0.15"/>
        {/* Respingos irregulares de alvejante */}
        <ellipse cx="340" cy="310" rx="28" ry="22" fill="#D4521E" opacity="0.3"/>
        <ellipse cx="870" cy="580" rx="20" ry="16" fill="#D4521E" opacity="0.25"/>
        <ellipse cx="420" cy="680" rx="14" ry="11" fill="#D4521E" opacity="0.22"/>
        <ellipse cx="760" cy="220" rx="10" ry="8" fill="#D4521E" opacity="0.28"/>
        <ellipse cx="200" cy="560" rx="8" ry="6" fill="#D4521E" opacity="0.18"/>
        <ellipse cx="1000" cy="340" rx="6" ry="5" fill="#D4521E" opacity="0.2"/>
        {/* gotas pequenas espalhadas */}
        <circle cx="480" cy="220" r="5" fill="#D4521E" opacity="0.22"/>
        <circle cx="730" cy="700" r="4" fill="#D4521E" opacity="0.18"/>
        <circle cx="150" cy="350" r="6" fill="#D4521E" opacity="0.15"/>
        <circle cx="1050" cy="620" r="5" fill="#D4521E" opacity="0.16"/>
      </svg>
    ),
    previewSvg: <EclipseSvg style={{ width: '100%', height: '100%' }} />,
    aboutTitle: 'Sobre a estampa',
    aboutSub: 'O que é Eclipse',
    aboutText: (
      <>
        <p>Inspirada no eclipse solar total. O halo externo e os respingos são criados à mão, garantindo que cada peça seja única.</p>
      </>
    ),
    aboutBullets: [
      'Disco central apagado pelo alvejante puro',
      'Coroa em spray diluído — cria o degradê natural',
      'Respingos livres à mão — posição sempre diferente',
      'Cada camiseta é fotografada antes do envio'
    ],
    otherProductId: 'spy',
    otherProductName: 'SPY',
    otherProductSvg: (
      <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="800" height="600" fill="#0c0c0c"/>
        <ellipse cx="400" cy="300" rx="200" ry="100" fill="none" stroke="#D4521E" strokeWidth="22" opacity="0.8"/>
        <ellipse cx="400" cy="300" rx="65" ry="65" fill="#D4521E" opacity="0.85"/>
        <ellipse cx="400" cy="300" rx="32" ry="32" fill="#080808"/>
        <ellipse cx="418" cy="286" rx="10" ry="10" fill="#D4521E" opacity="0.6"/>
        <line x1="260" y1="200" x2="250" y2="168" stroke="#D4521E" strokeWidth="5" strokeLinecap="round" opacity="0.5"/>
        <line x1="400" y1="200" x2="400" y2="166" stroke="#D4521E" strokeWidth="5" strokeLinecap="round" opacity="0.5"/>
        <line x1="540" y1="200" x2="550" y2="168" stroke="#D4521E" strokeWidth="5" strokeLinecap="round" opacity="0.5"/>
      </svg>
    )
  },
  spy: {
    id: 'spy',
    name: 'SPY',
    tagline: 'Ilustração do olho que tudo vê. Alvejado manualmente sobre algodão 100% preto.',
    price: 139,
    svgThumb: SPY_SVG_RAW,
    heroSvg: (
      <svg viewBox="0 0 1200 900" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', minHeight: '120vh' }}>
        <rect width="1200" height="900" fill="#080808"/>
        {/* Olho grande como fundo fullscreen */}
        <path d="M100,450 Q400,150 600,150 Q800,150 1100,450 Q800,750 600,750 Q400,750 100,450 Z" fill="none" stroke="#D4521E" strokeWidth="28" opacity="0.75"/>
        <ellipse cx="600" cy="450" rx="170" ry="170" fill="#D4521E" opacity="0.82"/>
        <ellipse cx="600" cy="450" rx="85" ry="85" fill="#060606"/>
        <ellipse cx="648" cy="408" rx="28" ry="28" fill="#D4521E" opacity="0.55"/>
        <ellipse cx="572" cy="478" rx="12" ry="12" fill="#D4521E" opacity="0.25"/>
        <line x1="260" y1="230" x2="230" y2="175" stroke="#D4521E" strokeWidth="8" strokeLinecap="round" opacity="0.5"/>
        <line x1="360" y1="185" x2="345" y2="130" stroke="#D4521E" strokeWidth="7" strokeLinecap="round" opacity="0.45"/>
        <line x1="470" y1="162" x2="462" y2="106" stroke="#D4521E" strokeWidth="7" strokeLinecap="round" opacity="0.5"/>
        <line x1="600" y1="155" x2="600" y2="96" stroke="#D4521E" strokeWidth="8" strokeLinecap="round" opacity="0.5"/>
        <line x1="730" y1="162" x2="738" y2="106" stroke="#D4521E" strokeWidth="7" strokeLinecap="round" opacity="0.5"/>
        <line x1="840" y1="185" x2="855" y2="130" stroke="#D4521E" strokeWidth="7" strokeLinecap="round" opacity="0.45"/>
        <line x1="940" y1="230" x2="970" y2="175" stroke="#D4521E" strokeWidth="8" strokeLinecap="round" opacity="0.5"/>
        <line x1="290" y1="660" x2="265" y2="710" stroke="#D4521E" strokeWidth="5" strokeLinecap="round" opacity="0.3"/>
        <line x1="460" y1="730" x2="452" y2="782" stroke="#D4521E" strokeWidth="5" strokeLinecap="round" opacity="0.3"/>
        <line x1="600" y1="745" x2="600" y2="800" stroke="#D4521E" strokeWidth="5" strokeLinecap="round" opacity="0.3"/>
        <line x1="740" y1="730" x2="748" y2="782" stroke="#D4521E" strokeWidth="5" strokeLinecap="round" opacity="0.3"/>
        <line x1="910" y1="660" x2="935" y2="710" stroke="#D4521E" strokeWidth="5" strokeLinecap="round" opacity="0.3"/>
        <ellipse cx="180" cy="380" rx="22" ry="16" fill="#D4521E" opacity="0.25"/>
        <ellipse cx="1020" cy="530" rx="18" ry="14" fill="#D4521E" opacity="0.22"/>
        <ellipse cx="350" cy="700" rx="12" ry="9" fill="#D4521E" opacity="0.2"/>
        <ellipse cx="850" cy="200" rx="10" ry="8" fill="#D4521E" opacity="0.22"/>
        <circle cx="140" cy="600" r="8" fill="#D4521E" opacity="0.16"/>
        <circle cx="1060" cy="280" r="6" fill="#D4521E" opacity="0.18"/>
        <circle cx="700" cy="780" r="5" fill="#D4521E" opacity="0.16"/>
        <ellipse cx="100" cy="450" rx="40" ry="20" fill="#D4521E" opacity="0.18"/>
        <ellipse cx="1100" cy="450" rx="40" ry="20" fill="#D4521E" opacity="0.18"/>
      </svg>
    ),
    previewSvg: <SpySvg style={{ width: '100%', height: '100%' }} />,
    aboutTitle: 'Sobre a estampa',
    aboutSub: 'O que é Spy',
    aboutText: (
      <>
        <p>O olho aberto como símbolo. Contorno feito em spray diluído e cílios desenhados individualmente com pincel fino.</p>
      </>
    ),
    aboutBullets: [
      'Contorno da pálpebra em spray livre',
      'Íris central alvejada em concentração alta',
      'Cílios com pincel fino — posição única em cada peça',
      'Foto da sua peça enviada antes do despacho'
    ],
    otherProductId: 'eclipse',
    otherProductName: 'ECLIPSE',
    otherProductSvg: (
      <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="800" height="600" fill="#0c0c0c"/>
        <ellipse cx="400" cy="300" rx="200" ry="200" fill="#D4521E" opacity="0.75"/>
        <ellipse cx="400" cy="300" rx="138" ry="138" fill="#060606"/>
        <ellipse cx="400" cy="300" rx="205" ry="205" fill="none" stroke="#D4521E" strokeWidth="14" opacity="0.2"/>
        <ellipse cx="240" cy="210" rx="20" ry="16" fill="#D4521E" opacity="0.3"/>
        <ellipse cx="570" cy="390" rx="14" ry="11" fill="#D4521E" opacity="0.25"/>
      </svg>
    )
  }
};

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useApp();
  const [selectedSize, setSelectedSize] = useState(null);

  // Estados de cálculo de frete
  const [cep, setCep] = useState('');
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [shippingError, setShippingError] = useState('');

  const product = PRODUCTS_DATA[id];

  // Scroll to top on load and reset selected size
  useEffect(() => {
    setSelectedSize(null);
    setShippingOptions([]);
    setShippingError('');
    if (!product) {
      navigate('/produtos', { replace: true });
    }
  }, [id, product, navigate]);

  if (!product) return null;

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      svgThumb: product.svgThumb
    });
  };

  const handleCalculateShipping = async (e) => {
    e.preventDefault();
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setShippingError('Digite um CEP válido com 8 números.');
      return;
    }
    setShippingError('');
    setShippingLoading(true);
    try {
      const data = await calculateShipping({
        cep: cleanCep,
        items: [{ id: product.id, qty: 1, price: product.price }]
      });
      setShippingOptions(data.options || []);
      if (!data.options || data.options.length === 0) {
        setShippingError('Nenhuma opção de frete disponível para este CEP.');
      }
    } catch (err) {
      console.error('Erro frete:', err);
      setShippingError(err.message || 'Erro ao calcular frete.');
    } finally {
      setShippingLoading(false);
    }
  };

  return (
    <>
      {/* ── PRODUCT HERO com PARALLAX ── */}
      <section className="product-hero parallax-section" aria-label={product.name}>
        {/* Fundo = a própria estampa em fullscreen, com parallax */}
        <div className="product-hero-bg parallax-bg" data-speed="0.28" aria-hidden="true">
          {product.heroSvg}
        </div>
        <div className="product-hero-overlay"></div>

        <div className="product-hero-content">
          <div className="product-shirt-preview">
            <div id="shirt-svg-thumb">
              <Suspense fallback={product.previewSvg}>
                <Skeleton3D print={product.id} cycle={false} fallback={product.previewSvg} />
              </Suspense>
            </div>
          </div>

          <div className="product-details">
            <span className="eyebrow">Estampa</span>
            <h1 className="product-name">{product.name}</h1>
            <p className="product-tagline">{product.tagline}</p>

            <div className="handmade-notice">
              <span className="handmade-notice-icon">✦</span>
              <p>
                <strong>100% artesanal.</strong> Produzida individualmente a cada pedido. Sem moldes ou telas.
              </p>
            </div>

            <div className="size-selector">
              <span className="size-label">Tamanho</span>
              <div className="size-options">
                {['P', 'M', 'G', 'GG'].map((size) => (
                  <button
                    key={size}
                    className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="product-price-row">
              <span className="product-price">R$ 139,00</span>
              <span className="product-price-note">à vista · parcelamento disponível</span>
            </div>

            <button
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={!selectedSize}
            >
              {selectedSize ? `Adicionar ao carrinho — Tam. ${selectedSize}` : 'Selecione um tamanho'}
            </button>

            {/* Aviso Legal / Disclaimers */}
            <div style={{
              marginTop: '20px',
              padding: '14px 16px',
              backgroundColor: 'rgba(212, 82, 30, 0.08)',
              border: '1px solid rgba(212, 82, 30, 0.25)',
              borderRadius: '4px',
              fontSize: '0.82rem',
              lineHeight: '1.5',
              color: 'var(--bone)'
            }}>
              <div style={{ fontWeight: 600, color: 'var(--orange)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚠️ Aviso de Produção Artesanal:</span>
              </div>
              <p style={{ margin: '0 0 6px 0', color: '#d0c8be' }}>
                Por ser um processo manual com água sanitária, o resultado final terá pequenas variações em relação à foto ilustrativa.
              </p>
              <p style={{ margin: 0, color: '#d0c8be' }}>
                <strong>Lave separadamente</strong> nas primeiras vezes para evitar manchas em outras roupas.
              </p>
            </div>

            {/* ── CALCULAR FRETE ── */}
            <div className="shipping-calc-box" style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--ink2)', border: '1px solid var(--gray-lt)', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bone)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🚚</span> Calcular Frete e Prazo (Melhor Envio)
              </div>
              <form onSubmit={handleCalculateShipping} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Digitar CEP (00000-000)"
                  maxLength={9}
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: 'var(--ink)',
                    border: '1px solid var(--gray-lt)',
                    color: 'var(--bone)',
                    fontSize: '0.88rem',
                    borderRadius: '4px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={shippingLoading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--orange)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  {shippingLoading ? '...' : 'Calcular'}
                </button>
              </form>
              {shippingError && (
                <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '8px' }}>{shippingError}</div>
              )}
              {shippingOptions.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {shippingOptions.map((opt) => (
                    <div key={opt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--bone)' }}>{opt.company} ({opt.name})</span>
                        <div style={{ color: 'var(--gray)', fontSize: '0.75rem' }}>{opt.deliveryRange}</div>
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--orange)' }}>
                        R$ {opt.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--gray)', marginTop: '12px', textAlign: 'center' }}>
              Produção: 5–10 dias úteis após pagamento confirmado
            </p>
          </div>
        </div>

        <div className="product-scroll-hint" aria-hidden="true">
          <span>mais</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* ── DETALHES ── */}
      <section className="product-info-section">
        <div className="container">
          <div className="product-info-grid">
            <div className="info-block reveal">
              <span className="eyebrow">{product.aboutTitle}</span>
              <h3>{product.aboutSub}</h3>
              {product.aboutText}
              <ul className="info-list">
                {product.aboutBullets.map((bullet, idx) => (
                  <li key={idx}>{bullet}</li>
                ))}
              </ul>
            </div>
            <div className="info-block reveal reveal-delay-1">
              <span className="eyebrow">Especificações</span>
              <h3>Produto</h3>
              <ul className="info-list">
                <li>Algodão penteado 100% — 180g/m²</li>
                <li>Corte unissex — tabela de medidas abaixo</li>
                <li>Costura dupla reforçada nas mangas</li>
                <li>Água sanitária profissional — sem toxinas residuais após lavagem</li>
                <li>Lavar à mão, virada ao avesso, água fria</li>
                <li>Não usar alvejante na lavagem</li>
              </ul>
              <table style={{ marginTop: '24px', width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--gray-lt)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 0', color: 'var(--gray)', fontWeight: 500 }}>Tam.</th>
                    <th style={{ textAlign: 'center', padding: '10px 0', color: 'var(--gray)', fontWeight: 500 }}>Tórax</th>
                    <th style={{ textAlign: 'center', padding: '10px 0', color: 'var(--gray)', fontWeight: 500 }}>Comp.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--gray-lt)' }}>
                    <td style={{ padding: '10px 0', color: 'var(--bone)' }}>P</td>
                    <td style={{ textAlign: 'center', color: 'var(--gray)' }}>94cm</td>
                    <td style={{ textAlign: 'center', color: 'var(--gray)' }}>68cm</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--gray-lt)' }}>
                    <td style={{ padding: '10px 0', color: 'var(--bone)' }}>M</td>
                    <td style={{ textAlign: 'center', color: 'var(--gray)' }}>100cm</td>
                    <td style={{ textAlign: 'center', color: 'var(--gray)' }}>71cm</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--gray-lt)' }}>
                    <td style={{ padding: '10px 0', color: 'var(--bone)' }}>G</td>
                    <td style={{ textAlign: 'center', color: 'var(--gray)' }}>106cm</td>
                    <td style={{ textAlign: 'center', color: 'var(--gray)' }}>74cm</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 0', color: 'var(--bone)' }}>GG</td>
                    <td style={{ textAlign: 'center', color: 'var(--gray)' }}>112cm</td>
                    <td style={{ textAlign: 'center', color: 'var(--gray)' }}>77cm</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── OUTRAS ESTAMPAS ── */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--ink)' }}>
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Também disponível</span>
            <h2>VER {product.otherProductName} →</h2>
          </div>
          <Link
            to={`/produto/${product.otherProductId}`}
            className="product-tile reveal"
            style={{ maxWidth: '520px', display: 'block', aspectRatio: '4/3' }}
          >
            <div className="product-tile-bg" style={{ backgroundColor: 'var(--ink2)' }}>
              {product.otherProductSvg}
            </div>
            <div className="product-tile-info">
              <div className="product-tile-name">{product.otherProductName}</div>
              <div className="product-tile-price">A partir de R$ 139,00</div>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}
