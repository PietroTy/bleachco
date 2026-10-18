import { Link } from 'react-router-dom';
import NoSignal from '../../art/NoSignal';

export default function NotFoundPage() {
  return (
    <section className="no-signal" aria-label="Página não encontrada">
      <NoSignal />
      <div className="no-signal-osd">
        <span>CANAL 404</span>
        <strong>SEM SINAL</strong>
        <Link to="/">▶ VOLTAR PRA LOJA</Link>
      </div>
    </section>
  );
}
