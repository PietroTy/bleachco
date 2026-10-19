// Ícones do site em pixel art (grade 12×12, traço de 1 pixel), na cor do texto, sem contorno.
// Tamanho padrão 1em: acompanha a fonte de onde está.
const PATHS = {
  cart: 'M0 1h2v1H0zM2 2h1v1H2zM2 3h10v1H2zM3 4h1v2H3zM11 4h1v1h-1zM10 5h1v1h-1zM4 6h6v1H4zM6 4h1v2H6zM8 4h1v2H8zM4 7h1v1H4zM4 8h7v1H4zM4 9h2v2H4zM9 9h2v2H9z',
  menu: 'M1 2h10v1H1zM1 5h10v1H1zM1 8h10v1H1z',
  close: 'M1 1h1v1h-1zM2 2h1v1h-1zM3 3h1v1h-1zM4 4h1v1h-1zM5 5h1v1h-1zM6 6h1v1h-1zM7 7h1v1h-1zM8 8h1v1h-1zM9 9h1v1h-1zM10 10h1v1h-1zM10 1h1v1h-1zM9 2h1v1h-1zM8 3h1v1h-1zM7 4h1v1h-1zM6 5h1v1h-1zM5 6h1v1h-1zM4 7h1v1h-1zM3 8h1v1h-1zM2 9h1v1h-1zM1 10h1v1h-1z',
  arrow: 'M1 5h1v1h-1zM2 5h1v1h-1zM3 5h1v1h-1zM4 5h1v1h-1zM5 5h1v1h-1zM6 5h1v1h-1zM7 5h1v1h-1zM8 5h1v1h-1zM9 5h1v1h-1zM10 5h1v1h-1zM9 4h1v1h-1zM8 3h1v1h-1zM7 2h1v1h-1zM9 6h1v1h-1zM8 7h1v1h-1zM7 8h1v1h-1z',
  up: 'M5 2h1v1h-1zM5 3h1v1h-1zM5 4h1v1h-1zM5 5h1v1h-1zM5 6h1v1h-1zM5 7h1v1h-1zM5 8h1v1h-1zM5 9h1v1h-1zM5 10h1v1h-1zM5 1h1v1h-1zM4 2h1v1h-1zM3 3h1v1h-1zM2 4h1v1h-1zM6 2h1v1h-1zM7 3h1v1h-1zM8 4h1v1h-1z',
  play: 'M3 1h2v10H3zM5 2h1v8H5zM6 3h1v6H6zM7 4h1v4H7zM8 5h1v2H8z',
};

export default function PixelIcon({ name, className = '' }) {
  return (
    <svg className={`px-icon ${className}`} viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
      <path fill="currentColor" d={PATHS[name]} />
    </svg>
  );
}
