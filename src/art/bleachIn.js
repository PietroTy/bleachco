import { createStain, dyeFor } from './stain';

const CELL = 4; // px de tela por pixel de tecido

const rgb = (el) => getComputedStyle(el).color.match(/\d+/g).slice(0, 3).map(Number);

// Título que aparece alvejado: as letras são o pano preto do fundo, e o mesmo motor
// das manchas pinga alvejante nelas até chegar na cor delas (preto → ferrugem → laranja → osso):
// texto branco vai até o osso, trecho laranja (.accent) para no laranja.
// A mancha vira o fundo do texto (background-clip: text) só durante a animação.
export function bleachIn(el, duration = 3400) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const base = getComputedStyle(el).color;
  stainText(el, duration);
  // Trecho de outra cor mancha por conta própria, por cima, e para na cor dele
  el.querySelectorAll('*').forEach((child) => {
    if (getComputedStyle(child).color !== base) stainText(child, duration);
  });
}

function stainText(el, duration) {
  const floor = dyeFor(rgb(el));
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
        r: 2 + stain.rand() * 2.5,
        at: stain.rand() * 0.7,
      });
    }
  }
  drops.sort((a, b) => a.at - b.at);

  const style = el.style;
  // A mancha é a entrada: sem o fade/subida do .reveal por cima dela
  const props = ['opacity', 'transform', 'transition', 'backgroundImage', 'backgroundSize', 'backgroundOrigin', 'backgroundRepeat', 'backgroundClip', 'webkitBackgroundClip', 'webkitTextFillColor', 'imageRendering'];
  Object.assign(style, {
    opacity: '1',
    transform: 'none',
    transition: 'none',
    backgroundSize: '100% 100%',
    backgroundOrigin: 'border-box',
    backgroundRepeat: 'no-repeat',
    backgroundClip: 'text',
    webkitBackgroundClip: 'text',
    webkitTextFillColor: 'transparent',
    imageRendering: 'pixelated',
  });
  // Cada quadro só entra no fundo depois de decodificado: trocar a imagem direto deixa o
  // Firefox sem pintar nada até a animação acabar (letra invisível e depois "pop")
  let decoding = false;
  let done = false;
  const paint = () => {
    stain.render(ctx);
    if (decoding) return;
    decoding = true;
    const url = canvas.toDataURL();
    const frame = new Image();
    frame.src = url;
    frame.decode().then(
      () => {
        if (!done) style.backgroundImage = `url(${url})`;
        decoding = false;
      },
      () => (decoding = false)
    );
  };
  paint();

  const start = performance.now();
  let last = start;
  let pending = 0;
  let next = 0;
  const tick = (now) => {
    const p = Math.min(1, (now - start) / duration);
    while (next < drops.length && drops[next].at <= p) {
      const d = drops[next++];
      stain.drop(d.x, d.y, d.r, 0.35);
    }
    // Passo da simulação por tempo (60/s), não por quadro: tela de 120Hz não acelera
    pending += (now - last) / (1000 / 60);
    last = now;
    const steps = Math.min(4, Math.floor(pending));
    pending -= steps;
    if (steps) stain.step(steps);
    // Nunca passa da cor do texto; na reta final o que sobrou de preto chega nela junto
    stain.bleachTo(p > 0.8 ? floor + (1 - floor) * (1 - (p - 0.8) / 0.2) : 1, floor);
    paint();
    if (p < 1) requestAnimationFrame(tick);
    else {
      done = true;
      props.forEach((k) => (style[k] = ''));
    }
  };
  requestAnimationFrame(tick);
}
