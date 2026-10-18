import { useParams, Link } from 'react-router-dom';
import OrderStain, { STAIN_CODE_RE } from '../../art/OrderStain';

// Página compartilhável da mancha de um pedido: /mancha/7F3A-91C2
export default function StainPage() {
  const code = (useParams().code || '').toUpperCase();

  if (!STAIN_CODE_RE.test(code)) {
    return (
      <div className="page-header confirm-page">
        <span className="eyebrow">Mancha</span>
        <h1>MANCHA <span className="accent">NÃO EXISTE.</span></h1>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 32 }}>Ir pra loja</Link>
      </div>
    );
  }

  return (
    <div className="page-header stain-page">
      <div>
        <span className="eyebrow">Peça única</span>
        <h1>MANCHA <span className="accent">Nº {code}.</span></h1>
        <p>
          Todo pedido Bleach Co. ganha uma mancha digital gerada só pra ele, como a peça: não existe outra
          igual.
        </p>
        <Link to="/produtos" className="btn btn-ghost" style={{ marginTop: 32 }}>Fazer a minha</Link>
      </div>
      <OrderStain code={code} />
    </div>
  );
}
