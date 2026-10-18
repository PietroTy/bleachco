// Motor de mancha de alvejante em algodão preto.
// Grade de pixels: o alvejante (b) escorre pelas fibras e vai comendo o corante (dye).
// A cor segue o que acontece de verdade: preto → ferrugem → laranja → osso.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

// Paleta: dye 1 = preto intacto, dye 0 = descolorido até o osso
const STOPS = [
  [0.0, [236, 226, 210]],
  [0.18, [229, 160, 104]],
  [0.36, [212, 82, 30]],
  [0.58, [120, 42, 18]],
  [0.8, [38, 18, 12]],
  [1.0, [12, 12, 12]],
];
const PALETTE = (() => {
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const d = i / 255;
    let k = 0;
    while (k < STOPS.length - 2 && d > STOPS[k + 1][0]) k++;
    const [d0, c0] = STOPS[k];
    const [d1, c1] = STOPS[k + 1];
    const t = Math.min(1, Math.max(0, (d - d0) / (d1 - d0)));
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = c0[c] + (c1[c] - c0[c]) * t;
  }
  return lut;
})();

export function createStain(w, h, seed = 1) {
  const rand = mulberry32(seed);
  const n = w * h;
  const bleach = new Float32Array(n);
  const next = new Float32Array(n);
  const dye = new Float32Array(n).fill(1);
  // Fibra: quanto cada ponto deixa o líquido passar (trama + irregularidade)
  const cond = new Float32Array(n);
  const grain = new Float32Array(n);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const weave = (x % 2 === 0 ? 0.08 : 0) + (y % 3 === 0 ? 0.06 : 0);
      cond[i] = 0.35 + rand() * 0.65 * (0.6 + weave * 3);
      grain[i] = rand() * 0.06 - 0.03;
    }
  }
  // Suaviza a fibra pra formar "veios" em vez de ruído puro
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        cond[i] = (cond[i] * 2 + cond[i - 1] + cond[i + 1] + cond[i - w] + cond[i + w]) / 6;
      }
    }
  }
  // Contraste: algumas fibras quase não deixam passar → borda rasgada
  for (let i = 0; i < n; i++) cond[i] = Math.pow(cond[i], 2.2) * 1.6;

  let active = 0;
  // Faixa de linhas com líquido (só ela é simulada) e faixa a redesenhar: numa grade alta
  // (o fundo da página inteira) o resto do pano fica parado de graça
  let y0 = h;
  let y1 = -1;
  let dirty0 = 0;
  let dirty1 = h - 1;
  let img = null;

  function drop(cx, cy, radius = 3, amount = 1) {
    const r = Math.max(1, radius);
    const wobble = 0.55 + rand() * 0.6;
    for (let y = Math.floor(cy - r * 1.6); y <= cy + r * 1.6; y++) {
      if (y < 0 || y >= h) continue;
      for (let x = Math.floor(cx - r * 1.6); x <= cx + r * 1.6; x++) {
        if (x < 0 || x >= w) continue;
        const ang = Math.atan2(y - cy, x - cx);
        const edge = r * (1 + 0.28 * Math.sin(ang * 3 + seed) * wobble + 0.18 * Math.sin(ang * 7 + rand()));
        const d = Math.hypot(x - cx, y - cy);
        if (d <= edge) bleach[y * w + x] += amount * (1 - (d / edge) * 0.5);
      }
    }
    y0 = Math.max(0, Math.min(y0, Math.floor(cy - r * 1.6)));
    y1 = Math.min(h - 1, Math.max(y1, Math.ceil(cy + r * 1.6)));
    active = 120;
  }

  // Respingo: gota principal + satélites espalhados
  const unit = Math.min(w, h) / 100; // gotas proporcionais ao tamanho da grade

  function splash(cx, cy, size = 1) {
    drop(cx, cy, (7 + rand() * 4) * size * unit, 1.6);
    const count = 5 + Math.floor(rand() * 9 * size);
    for (let k = 0; k < count; k++) {
      const ang = rand() * Math.PI * 2;
      const dist = (10 + rand() * 22) * size * unit;
      drop(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, (1 + rand() * 3 * size) * unit, 1.1);
    }
  }

  // Variedade: cada mancha sai de um jeito, e com força diferente (fraca fica ferrugem, forte vai pro osso)
  function blot(cx, cy, size = 1, strength = 0.6 + rand() * 0.8) {
    const u = size * unit;
    const kind = rand();
    if (kind < 0.4) {
      splash(cx, cy, size * Math.min(1, strength));
    } else if (kind < 0.5) {
      // Escorrido: poça que desceu em fios
      drop(cx, cy, (4 + rand() * 4) * u, 1.4 * strength);
      const trails = 1 + Math.floor(rand() * 3);
      for (let t = 0; t < trails; t++) {
        let x = cx + (rand() - 0.5) * 6 * u;
        const len = (20 + rand() * 45) * u;
        for (let d = 0; d < len; d += 1) {
          x += (rand() - 0.5) * 0.5;
          drop(x, cy + d, Math.max(0.7, (1 - d / len) * 2.2 * u), 0.55 * strength);
        }
      }
    } else if (kind < 0.57) {
      // Spray: névoa de pinguinhos
      const n = 30 + Math.floor(rand() * 50);
      const spread = (14 + rand() * 16) * u;
      for (let k = 0; k < n; k++) {
        const ang = rand() * Math.PI * 2;
        const d = Math.pow(rand(), 0.7) * spread;
        drop(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d * 0.7, (0.4 + rand() * 1.1) * u, 0.9 * strength);
      }
    } else if (kind < 0.75) {
      // Rastro: passada de pano molhado, falhando
      const ang = rand() * Math.PI;
      const len = (30 + rand() * 40) * u;
      const r = (2 + rand() * 2.5) * u;
      for (let d = -len / 2; d < len / 2; d += 1) {
        if (rand() < 0.25) continue;
        const wob = Math.sin(d * 0.08 + rand()) * r * 0.6;
        drop(cx + Math.cos(ang) * d - Math.sin(ang) * wob, cy + Math.sin(ang) * d + Math.cos(ang) * wob, r * (0.6 + rand() * 0.5), 0.45 * strength);
      }
    } else {
      // Poça seca: miolo fraco e anel mais forte na borda
      const R = (9 + rand() * 9) * u;
      drop(cx, cy, R, 0.35 * strength);
      const n = Math.ceil(R * 2.5);
      for (let k = 0; k < n; k++) {
        const ang = (k / n) * Math.PI * 2;
        const rr = R * (0.95 + rand() * 0.2);
        drop(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, (1 + rand()) * u, 0.9 * strength);
      }
    }
  }

  // Termina o serviço: ninguém fica com mais corante que maxDye
  function bleachTo(maxDye) {
    for (let i = 0; i < n; i++) if (dye[i] > maxDye) dye[i] = maxDye;
    dirty0 = 0;
    dirty1 = h - 1;
  }

  function step(iterations = 1) {
    for (let it = 0; it < iterations; it++) {
      if (y1 < y0) break;
      // O líquido anda no máximo uma célula por passo
      y0 = Math.max(0, y0 - 1);
      y1 = Math.min(h - 1, y1 + 1);
      dirty0 = Math.min(dirty0, y0);
      dirty1 = Math.max(dirty1, y1);
      let total = 0;
      for (let y = y0; y <= y1; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          const b = bleach[i];
          let flow = 0;
          const c = cond[i];
          // Mobilidade ~ quantidade de líquido: tecido seco segura a frente (borda nítida)
          const m = (j) => Math.min(c, cond[j]) * Math.min(1, (b + bleach[j]) * 1.6);
          if (x > 0) flow += (bleach[i - 1] - b) * m(i - 1);
          if (x < w - 1) flow += (bleach[i + 1] - b) * m(i + 1);
          if (y > 0) flow += (bleach[i - w] - b) * m(i - w);
          if (y < h - 1) flow += (bleach[i + w] - b) * m(i + w);
          next[i] = b + flow * 0.22;
        }
      }
      for (let i = y0 * w, end = (y1 + 1) * w; i < end; i++) {
        const b = next[i];
        if (b > 0.002) {
          // O alvejante come o corante e vai sendo consumido/absorvido
          dye[i] -= dye[i] * Math.min(1, b * 1.2) * 0.042;
          bleach[i] = b * 0.982;
          total += b;
        } else {
          bleach[i] = 0;
        }
      }
      if (total < 0.5) active = Math.max(0, active - 1);
      if (!active) {
        bleach.fill(0, y0 * w, (y1 + 1) * w);
        y0 = h;
        y1 = -1;
      }
    }
    return active > 0;
  }

  function render(ctx) {
    if (dirty1 < dirty0) return;
    if (!img) img = ctx.createImageData(w, h);
    const px = img.data;
    for (let i = dirty0 * w, end = (dirty1 + 1) * w; i < end; i++) {
      const d = Math.min(1, Math.max(0, dye[i] + grain[i]));
      const k = Math.round(d * 255) * 3;
      const wet = Math.min(0.35, bleach[i] * 0.4); // molhado fica um pouco mais escuro
      px[i * 4] = PALETTE[k] * (1 - wet);
      px[i * 4 + 1] = PALETTE[k + 1] * (1 - wet);
      px[i * 4 + 2] = PALETTE[k + 2] * (1 - wet);
      px[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0, 0, dirty0, w, dirty1 - dirty0 + 1);
    dirty0 = h;
    dirty1 = -1;
  }

  function reset() {
    bleach.fill(0);
    dye.fill(1);
    active = 0;
    y0 = h;
    y1 = -1;
    dirty0 = 0;
    dirty1 = h - 1;
  }

  // Herda o pano de outra grade (ex: a página cresceu): copia a área em comum
  function paste(other) {
    const cw = Math.min(w, other.w);
    for (let y = 0; y < Math.min(h, other.h); y++) {
      for (let x = 0; x < cw; x++) {
        dye[y * w + x] = other.dye[y * other.w + x];
        bleach[y * w + x] = other.bleach[y * other.w + x];
      }
    }
    if (other.busy) {
      active = 120;
      y0 = 0;
      y1 = Math.min(h, other.h) - 1;
    }
  }

  return { w, h, dye, bleach, rand, drop, splash, blot, bleachTo, step, render, reset, paste, get busy() { return active > 0; } };
}

// Mancha determinística: a mesma semente sempre gera a mesma mancha
export function generateStain(seedText, w = 96, h = 120) {
  const seed = hashString(seedText);
  const s = createStain(w, h, seed);
  const r = s.rand;
  const main = 1 + Math.floor(r() * 3);
  for (let k = 0; k < main; k++) {
    s.splash(w * (0.35 + r() * 0.3), h * (0.35 + r() * 0.3), 0.6 + r() * 0.5);
  }
  // Escorrido vertical, como gota que desceu pela camiseta
  if (r() > 0.4) {
    const x = w * (0.3 + r() * 0.4);
    let y = h * (0.25 + r() * 0.2);
    const len = 10 + r() * 30;
    for (let k = 0; k < len; k++) {
      s.drop(x + Math.sin(k * 0.3) * 0.8, y, 1.2, 0.5);
      y += 1;
    }
  }
  for (let k = 0; k < 6 + r() * 10; k++) s.drop(w * (0.1 + r() * 0.8), h * (0.1 + r() * 0.8), 0.6 + r() * 0.8, 0.8);
  for (let i = 0; i < 260; i++) s.step();
  return s;
}
