import { createStain, dyeFor } from './stain';

const CELL = 4; // px de tela por pixel de tecido

const rgb = (el) => getComputedStyle(el).color.match(/\d+/g).slice(0, 3).map(Number);

// Título que aparece alvejado: as letras são o pano preto do fundo, e o mesmo motor
// das manchas pinga alvejante nelas até chegar na cor delas (preto → ferrugem → laranja → osso):
// texto branco vai até o osso, trecho laranja (.accent) para no laranja.
// A mancha vira o fundo do texto (background-clip: text) só durante a animação.
export function bleachIn(el, duration = 2600) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const base = getComputedStyle(el).color;
  // Trecho de outra cor mancha por conta própria, por cima, e para na cor dele. Quando acaba
  // fica na cor real (senão o texto transparente mostra a mancha do título por baixo) até o título acabar.
  const parts = [...el.querySelectorAll('*')].filter((child) => getComputedStyle(child).color !== base);
  stainText(el, duration, () => parts.forEach((child) => (child.style.webkitTextFillColor = '')));
  parts.forEach((child) => stainText(child, duration, null, 'currentcolor'));
}

// onDone: chamado no fim; fill: cor do texto que fica no fim (padrão: a do CSS)
function stainText(el, duration, onDone, fill = '') {
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
  const gap = 8;
  const drops = [];
  for (let y = gap / 2; y < h + gap / 2; y += gap) {
    for (let x = gap / 2; x < w + gap / 2; x += gap) {
      drops.push({
        x: x + (stain.rand() - 0.5) * gap,
        y: y + (stain.rand() - 0.5) * gap,
        r: 2.5 + stain.rand() * 2.5,
        at: stain.rand() * duration,
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

  // Ritmo constante do começo ao fim: primeiro a grade de gotas, depois gotas mirando
  // o que ainda está escuro, até a mancha cobrir tudo sozinha. Só o finzinho (tudo já
  // quase na cor) é acabado junto, rápido o bastante pra não se notar.
  const DRIP_EVERY = 30;
  const FINISH = 450;
  const start = performance.now();
  let last = start;
  let pending = 0;
  let next = 0;
  let lastDrip = start;
  let finishAt = 0;
  let finishFrom = 1;
  // Quanto do título ainda está longe da cor (fração) e o mais escuro que sobrou
  const remaining = () => {
    let dark = 0;
    let max = 0;
    for (let i = 0; i < stain.dye.length; i++) {
      if (stain.dye[i] > floor + 0.15) dark++;
      if (stain.dye[i] > max) max = stain.dye[i];
    }
    return { left: dark / stain.dye.length, max };
  };
  const dripOnDark = () => {
    for (let k = 0; k < 60; k++) {
      const i = Math.floor(stain.rand() * stain.dye.length);
      if (stain.dye[i] > floor + 0.1) {
        stain.drop(i % w, Math.floor(i / w), 2.5 + stain.rand() * 2.5, 2);
        return;
      }
    }
  };
  const tick = (now) => {
    const t = now - start;
    while (next < drops.length && drops[next].at <= t) {
      const d = drops[next++];
      stain.drop(d.x, d.y, d.r, 2);
    }
    if (next >= drops.length && !finishAt && now - lastDrip > DRIP_EVERY) {
      lastDrip = now;
      dripOnDark();
    }
    // Passo da simulação por tempo (60/s), não por quadro: tela de 120Hz não acelera
    pending += (now - last) / (1000 / 60);
    last = now;
    const steps = Math.min(4, Math.floor(pending));
    pending -= steps;
    if (steps) stain.step(steps);
    // Nunca passa da cor do texto
    if (!finishAt && next >= drops.length) {
      const { left, max } = remaining();
      if (left < 0.015 || t > duration * 3) {
        finishAt = now;
        finishFrom = max;
      }
    }
    const q = finishAt ? Math.min(1, (now - finishAt) / FINISH) : 0;
    stain.bleachTo(finishAt ? floor + (finishFrom - floor) * (1 - q) : 1, floor);
    paint();
    if (q < 1) requestAnimationFrame(tick);
    else {
      done = true;
      props.forEach((k) => (style[k] = ''));
      style.webkitTextFillColor = fill;
      onDone?.();
    }
  };
  requestAnimationFrame(tick);
}
