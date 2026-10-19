import { Link } from 'react-router-dom';
import { EclipseSvg, SpySvg } from './SvgAssets';

const PRODUCTS = [
  { id: 'eclipse', name: 'ECLIPSE', price: 157, Art: EclipseSvg },
  { id: 'spy',     name: 'SPY',     price: 157, Art: SpySvg },
];

const fmt = (v) => `R$ ${v.toFixed(2).replace('.', ',')}`;

// Cards da coleção: nome, preço e chamada sempre visíveis (no celular não existe hover)
export default function ProductGrid() {
  return (
    <div className="container">
      <div className="product-grid">
        {PRODUCTS.map(({ id, name, price, Art }, i) => (
          <Link key={id} to={`/produto/${id}`} className={`product-card reveal reveal-delay-${i}`}>
            <div className="product-card-media">
              <Art style={{ width: '100%', height: '100%' }} />
            </div>
            <div className="product-card-info">
              <span className="product-card-name">{name}</span>
              <span className="product-card-price">{fmt(price)}</span>
            </div>
            <span className="product-card-cta">Ver estampa →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
