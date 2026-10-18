import { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

// Faixa estilo jogo Souls quando algo entra no carrinho: "PEÇA OBTIDA"
export default function SoulsBanner() {
  const { banner, setBanner } = useApp();

  useEffect(() => {
    if (!banner) return undefined;
    const id = setTimeout(() => setBanner(null), 2200);
    return () => clearTimeout(id);
  }, [banner, setBanner]);

  if (!banner) return null;
  return (
    <div className="souls-banner" key={banner.key} role="status">
      <strong>{banner.title}</strong>
      <span>{banner.sub}</span>
    </div>
  );
}
