import { createStain } from './stain';

const CELL = 4; // px de tela por pixel de tecido

// Título que aparece alvejado: as letras são o pano preto do fundo, e o mesmo motor
// das manchas pinga alvejante nelas até descolorir (preto → ferrugem → laranja → osso).
// A mancha vira o fundo do texto (background-clip: text) só durante a animação.
export function bleachIn(el, duration = 2600) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = el.getBoundingClientRect();
  if (!box.width || !box.height) return;
  const w = Math.ceil(box.width / CELL);
  const h = Math.ceil(box.height / CELL);
  const stain = createStain(w, h, (Math.random() * 1e9) | 0);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Gotas espalhadas pelo título, cada uma caindo numa hora
  const gap = 9;
  const drops = [];
  for (let y = gap / 2; y < h + gap / 2; y += gap) {
    for (let x = gap / 2; x < w + gap / 2; x += gap) {
      drops.push({
        x: x + (stain.rand() - 0.5) * gap,
        y: y + (stain.rand() - 0.5) * gap,
        r: 2.5 + stain.rand() * 3.5,
        at: stain.rand() * 0.55,
      });
    }
  }
  drops.sort((a, b) => a.at - b.at);

  const style = el.style;
  const props = ['backgroundImage', 'backgroundSize', 'backgroundOrigin', 'backgroundRepeat', 'backgroundClip', 'webkitBackgroundClip', 'webkitTextFillColor', 'imageRendering'];
  Object.assign(style, {
    backgroundSize: '100% 100%',
    backgroundOrigin: 'border-box',
    backgroundRepeat: 'no-repeat',
    backgroundClip: 'text',
    webkitBackgroundClip: 'text',
    webkitTextFillColor: 'transparent',
    imageRendering: 'pixelated',
  });
  const paint = () => {
    stain.render(ctx);
    style.backgroundImage = `url(${canvas.toDataURL()})`;
  };
  paint();

  const start = performance.now();
  let next = 0;
  const tick = (now) => {
    const p = Math.min(1, (now - start) / duration);
    while (next < drops.length && drops[next].at <= p) {
      const d = drops[next++];
      stain.drop(d.x, d.y, d.r, 1.3);
    }
    stain.step(2);
    // Reta final: o que sobrou de preto termina de descolorir junto
    if (p > 0.7) stain.bleachTo(1 - (p - 0.7) / 0.3);
    paint();
    if (p < 1) requestAnimationFrame(tick);
    else props.forEach((k) => (style[k] = ''));
  };
  requestAnimationFrame(tick);
}
