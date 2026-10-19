import { createStain, dyeFor } from './stain';
import { PX } from './ps1';

// Texto/logo que aparece alvejado: começa preto como o pano do fundo e o mesmo motor das manchas
// pinga alvejante até chegar na cor dele (preto → ferrugem → laranja → osso): branco vai até o
// osso, laranja para no laranja. Termina manchado de vez, não na cor chapada.

const rgbOf = (el) => getComputedStyle(el).color.match(/\d+/g).slice(0, 3).map(Number);
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Núcleo: anima uma grade w×h até cada ponto chegar no seu floor (Float32Array).
// mask: pontos que importam (as gotas extras e o "acabou?" só olham pra eles). show(stain, last) desenha.
function runStain({ w, h, floor, mask, duration = 2600, keep = 0.2, scale = 1, show }) {
  const stain = createStain(w, h, (Math.random() * 1e9) | 0);
  const r = stain.rand;
  // scale: grade mais fina que o normal mantém o tamanho das gotas em px de tela
  const gap = 8 * scale;
  const drops = [];
  for (let y = gap / 2; y < h + gap / 2; y += gap) {
    for (let x = gap / 2; x < w + gap / 2; x += gap) {
      drops.push({ x: x + (r() - 0.5) * gap, y: y + (r() - 0.5) * gap, r: (2.5 + r() * 2.5) * scale, at: r() * duration });
    }
  }
  drops.sort((a, b) => a.at - b.at);
  const cells = [];
  for (let i = 0; i < w * h; i++) if (!mask || mask[i]) cells.push(i);

  // Ritmo constante do começo ao fim: primeiro a grade de gotas, depois gotas mirando o que ainda
  // está escuro, até a mancha cobrir tudo sozinha. No finzinho os pontos que sobraram escuros
  // clareiam até perto da cor, mas a variação da mancha fica (keep).
  const DRIP_EVERY = 30;
  const FINISH = 450;
  const dark = (i) => stain.dye[i] - floor[i];
  const start = performance.now();
  let last = start;
  let pending = 0;
  let next = 0;
  let lastDrip = start;
  let finishAt = 0;
  let finishFrom = 1;

  show(stain, false);
  const tick = (now) => {
    const t = now - start;
    while (next < drops.length && drops[next].at <= t) {
      const d = drops[next++];
      stain.drop(d.x, d.y, d.r, 2);
    }
    if (next >= drops.length && !finishAt && now - lastDrip > DRIP_EVERY && cells.length) {
      lastDrip = now;
      for (let k = 0; k < 60; k++) {
        const i = cells[Math.floor(r() * cells.length)];
        if (dark(i) > 0.1) {
          stain.drop(i % w, Math.floor(i / w), (2.5 + r() * 2.5) * scale, 2);
          break;
        }
      }
    }
    // Passo da simulação por tempo (60/s), não por quadro: tela de 120Hz não acelera
    pending += (now - last) / (1000 / 60);
    last = now;
    const steps = Math.min(4, Math.floor(pending));
    pending -= steps;
    if (steps) stain.step(steps);
    if (!finishAt && next >= drops.length) {
      let left = 0;
      let max = 0;
      for (const i of cells) {
        const d = dark(i);
        if (d > 0.15) left++;
        if (d > max) max = d;
      }
      if (left < cells.length * 0.015 || t > duration * 3) {
        finishAt = now;
        finishFrom = max;
      }
    }
    const q = finishAt ? Math.min(1, (now - finishAt) / FINISH) : 0;
    stain.bleachTo(finishAt ? keep + Math.max(0, finishFrom - keep) * (1 - q) : 1, floor);
    show(stain, q >= 1);
    if (q < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Quadro → data URL, aplicado só depois de decodificado: trocar a imagem direto deixa o Firefox
// sem pintar nada até o fim. Só entra quadro mais novo que o da tela; o último sempre entra.
function framePipe(canvas, apply) {
  let seq = 0;
  let shown = 0;
  let inflight = false;
  return (last) => {
    if (inflight && !last) return;
    inflight = true;
    const id = ++seq;
    const url = canvas.toDataURL();
    const frame = new Image();
    frame.src = url;
    frame
      .decode()
      .then(() => {
        if (id > shown) {
          shown = id;
          apply(url);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (id === seq) inflight = false;
      });
  };
}

// Antes de entrar na tela o texto já fica "pano preto" (senão pisca na cor normal e depois escurece)
export function prepareBleach(el) {
  if (reduced()) return;
  if (el.tagName === 'IMG') el.style.opacity = '0';
  else el.style.webkitTextFillColor = 'rgb(12,12,12)';
}

export function bleachIn(el) {
  if (el.tagName === 'IMG') return bleachImage(el);
  if (reduced()) return undefined;
  const base = getComputedStyle(el).color;
  stainText(el);
  // Trecho de outra cor mancha por conta própria, por cima, e para na cor dele
  el.querySelectorAll('*').forEach((child) => {
    if (getComputedStyle(child).color !== base) stainText(child);
  });
  return undefined;
}

// A mancha vira o fundo do texto (background-clip: text). Grade mais fina em texto menor.
function stainText(el) {
  const style = el.style;
  const box = el.getBoundingClientRect();
  if (!box.width || !box.height) {
    style.webkitTextFillColor = '';
    return;
  }
  const size = parseFloat(getComputedStyle(el).fontSize);
  const cell = PX;
  const w = Math.ceil(box.width / cell);
  const h = Math.ceil(box.height / cell);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  // A mancha é a entrada: sem o fade/subida do .reveal por cima dela
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
    textShadow: 'none', // halo do parágrafo seria pintado por cima da mancha e apagaria a letra
  });
  const push = framePipe(canvas, (url) => (style.backgroundImage = `url(${url})`));
  runStain({
    w,
    h,
    floor: new Float32Array(w * h).fill(dyeFor(rgbOf(el))),
    show(stain, last) {
      stain.render(ctx, 0); // sem o "molhado escurece": na letra clara vira pisca-pisca escuro
      push(last);
    },
  });
}

// Logo (imagem): mancha recortada pelo formato dela; cada ponto para na cor que a logo tem ali
function bleachImage(img) {
  if (reduced()) {
    img.style.opacity = '';
    return;
  }
  const original = new Image();
  original.src = img.currentSrc || img.src;
  original.decode().then(() => {
    const cell = PX;
    const w = Math.max(8, Math.round(img.clientWidth / cell));
    const h = Math.max(4, Math.round(img.clientHeight / cell));
    // Cor da logo em cada ponto da grade
    const probe = document.createElement('canvas');
    probe.width = w;
    probe.height = h;
    const pctx = probe.getContext('2d', { willReadFrequently: true });
    // Cor de cada célula pela maioria dos px da logo dentro dela (média misturaria o pingo laranja com
    // as letras brancas vizinhas e ele sumiria); laranja vence com 1/3 da célula
    const SUB = 6;
    probe.width = w * SUB;
    probe.height = h * SUB;
    pctx.drawImage(original, 0, 0, w * SUB, h * SUB);
    const px = pctx.getImageData(0, 0, w * SUB, h * SUB).data;
    const floor = new Float32Array(w * h);
    const mask = new Uint8Array(w * h);
    const orange = dyeFor([212, 82, 30]);
    const bone = dyeFor([242, 238, 232]);
    for (let cy = 0; cy < h; cy++) {
      for (let cx = 0; cx < w; cx++) {
        let solid = 0;
        let warm = 0;
        for (let y = cy * SUB; y < (cy + 1) * SUB; y++) {
          for (let x = cx * SUB; x < (cx + 1) * SUB; x++) {
            const i = (y * w * SUB + x) * 4;
            if (px[i + 3] < 40) continue;
            solid++;
            if (px[i] - px[i + 2] > 80) warm++;
          }
        }
        if (!solid) continue;
        mask[cy * w + cx] = 1;
        floor[cy * w + cx] = warm * 3 >= solid ? orange : bone;
      }
    }
    const grid = document.createElement('canvas');
    grid.width = w;
    grid.height = h;
    const gctx = grid.getContext('2d');
    // Saída em resolução boa pra tela (recorte nítido), a mancha por cima em pixel duro
    const out = document.createElement('canvas');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    out.width = Math.round(img.clientWidth * dpr);
    out.height = Math.round(img.clientHeight * dpr);
    const octx = out.getContext('2d');
    let first = true;
    const push = framePipe(out, (url) => {
      img.src = url;
      if (first) {
        first = false;
        img.style.opacity = '';
      }
    });
    runStain({
      w,
      h,
      floor,
      mask,
      keep: 0.06, // logo termina quase na cor dela (o laranja é o do site), só com o grão
      scale: 1,
      show(stain, last) {
        stain.render(gctx, 0);
        octx.globalCompositeOperation = 'copy';
        octx.imageSmoothingEnabled = false;
        octx.drawImage(grid, 0, 0, out.width, out.height);
        octx.globalCompositeOperation = 'destination-in';
        octx.imageSmoothingEnabled = true;
        octx.drawImage(original, 0, 0, out.width, out.height);
        push(last);
      },
    });
  }, () => (img.style.opacity = ''));
}
