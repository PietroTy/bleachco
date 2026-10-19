import { Link } from 'react-router-dom';
import NoSignal from '../../art/NoSignal';
import PixelIcon from '../common/PixelIcon';

export default function NotFoundPage() {
  return (
    <section className="no-signal" aria-label="Página não encontrada">
      <NoSignal />
      <div className="no-signal-osd">
        <span>CANAL 404</span>
        <strong>SEM SINAL</strong>
        <Link to="/"><PixelIcon name="play" /> VOLTAR PRA LOJA</Link>
      </div>
    </section>
  );
}
