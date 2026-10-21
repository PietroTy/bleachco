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

// Quanto corante sobra quando o pano chega nessa cor (a mais próxima da paleta), ex: laranja ≈ 0.36
export function dyeFor([r, g, b]) {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < 256; i++) {
    const d = (PALETTE[i * 3] - r) ** 2 + (PALETTE[i * 3 + 1] - g) ** 2 + (PALETTE[i * 3 + 2] - b) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best / 255;
}

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
  // Blocos com líquido: só eles (e os vizinhos, pra onde ele pode andar) são simulados.
  // As manchas ficam espalhadas, então a maior parte do pano está seca a cada passo.
  const T = 16;
  const tw = Math.ceil(w / T);
  const th = Math.ceil(h / T);
  const wet = new Uint8Array(tw * th);
  const sim = new Uint8Array(tw * th);
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
    // fase e número de bicos sorteados por gota (antes todos usavam a mesma fase: bicos no mesmo ângulo)
    const ph1 = rand() * Math.PI * 2;
    const ph2 = rand() * Math.PI * 2;
    const k1 = 2 + Math.floor(rand() * 3);
    const k2 = 5 + Math.floor(rand() * 4);
    for (let y = Math.floor(cy - r * 1.6); y <= cy + r * 1.6; y++) {
      if (y < 0 || y >= h) continue;
      for (let x = Math.floor(cx - r * 1.6); x <= cx + r * 1.6; x++) {
        if (x < 0 || x >= w) continue;
        const ang = Math.atan2(y - cy, x - cx);
        const edge = r * (1 + 0.28 * Math.sin(ang * k1 + ph1) * wobble + 0.18 * Math.sin(ang * k2 + ph2));
        const d = Math.hypot(x - cx, y - cy);
        if (d <= edge) {
          bleach[y * w + x] += amount * (1 - (d / edge) * 0.5);
          wet[((y / T) | 0) * tw + ((x / T) | 0)] = 1;
        }
      }
    }
    y0 = Math.max(0, Math.min(y0, Math.floor(cy - r * 1.6)));
    y1 = Math.min(h - 1, Math.max(y1, Math.ceil(cy + r * 1.6)));
    active = 30;
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

  // Mancha do fundo: um blob irregular (poça principal + lóbulos de tamanhos diferentes), cada um
  // diferente mas da mesma família. Força varia: fraca fica ferrugem, forte vai pro osso.
  function blot(cx, cy, size = 1, strength = 0.06 + Math.pow(rand(), 1.6) * 1.3) {
    const u = size * unit;
    const R = (4 + rand() * 9) * u; // tamanho bem variado
    const lobe = (x, y, r, k) => drop(x, y, r, k * strength);
    // Uma poça irregular: miolo + lóbulos de tamanhos diferentes, num eixo achatado e girado
    const puddle = (x, y, rr, nLobes, flat, rot) => {
      lobe(x, y, rr * 0.7, 1.4);
      for (let k = 0; k < nLobes; k++) {
        const a = rand() * Math.PI * 2;
        const d = rr * (0.3 + rand() * 0.6);
        const dx = Math.cos(a) * d;
        const dy = Math.sin(a) * d * flat;
        lobe(x + dx * Math.cos(rot) - dy * Math.sin(rot), y + dx * Math.sin(rot) + dy * Math.cos(rot), rr * (0.2 + rand() * 0.45), 1.2);
      }
    };
    const kind = rand();
    const rot = rand() * Math.PI;
    if (kind < 0.35) {
      puddle(cx, cy, R, 2 + Math.floor(rand() * 8), 0.5 + rand() * 0.6, rot); // poça
    } else if (kind < 0.6) {
      // alongada: lóbulos enfileirados num eixo, larguras desiguais
      const n = 3 + Math.floor(rand() * 4);
      const len = R * (1.4 + rand());
      for (let k = 0; k < n; k++) {
        const t = (k / (n - 1) - 0.5) * len;
        const off = (rand() - 0.5) * R * 0.5;
        lobe(cx + Math.cos(rot) * t - Math.sin(rot) * off, cy + Math.sin(rot) * t + Math.cos(rot) * off, R * (0.3 + rand() * 0.4), 1.2);
      }
    } else if (kind < 0.82) {
      // cacho: duas ou três poças coladas, uma maior
      const n = 2 + Math.floor(rand() * 2);
      for (let k = 0; k < n; k++) {
        const a = rand() * Math.PI * 2;
        const d = k ? R * (0.7 + rand() * 0.5) : 0;
        puddle(cx + Math.cos(a) * d, cy + Math.sin(a) * d, R * (k ? 0.4 + rand() * 0.3 : 0.8), 2 + Math.floor(rand() * 4), 0.6 + rand() * 0.4, rand() * Math.PI);
      }
    } else {
      // lavada: área grande e fraca (fica ferrugem) com um núcleo forte fora do centro
      puddle(cx, cy, R * 1.5, 4 + Math.floor(rand() * 4), 0.6 + rand() * 0.4, rot);
      bleachScale(cx, cy, R * 1.9, 0.45);
      puddle(cx + (rand() - 0.5) * R, cy + (rand() - 0.5) * R, R * 0.4, 2 + Math.floor(rand() * 3), 0.8, rot);
    }
  }

  // Enfraquece o alvejante recém pingado numa área (deixa a mancha "lavada", só ferrugem)
  function bleachScale(cx, cy, r, k) {
    for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(h - 1, cy + r); y++) {
      for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(w - 1, cx + r); x++) {
        if (Math.hypot(x - cx, y - cy) <= r) bleach[y * w + x] *= k;
      }
    }
  }


  // Prende o corante entre floor e floor + above: floor é onde a cor para (um número, ou um por
  // ponto: logo com parte branca e parte laranja), above é o quanto ainda pode estar mais escuro
  function bleachTo(above, floor = 0) {
    const per = typeof floor !== 'number';
    for (let i = 0; i < n; i++) {
      const lo = per ? floor[i] : floor;
      dye[i] = Math.min(lo + above, Math.max(lo, dye[i]));
    }
    dirty0 = 0;
    dirty1 = h - 1;
  }

  // Abaixo disso o alvejante já não muda a cor de forma visível: dá o pano por seco
  const DRY = 0.005;

  function step(iterations = 1) {
    for (let it = 0; it < iterations; it++) {
      if (y1 < y0) break;
      // O líquido anda no máximo uma célula por passo
      y0 = Math.max(0, y0 - 1);
      y1 = Math.min(h - 1, y1 + 1);
      dirty0 = Math.min(dirty0, y0);
      dirty1 = Math.max(dirty1, y1);
      const ty0 = (y0 / T) | 0;
      const ty1 = (y1 / T) | 0;
      // Bloco seco sem vizinho molhado não muda: pula
      for (let ty = ty0; ty <= ty1; ty++) {
        for (let tx = 0; tx < tw; tx++) {
          let s = 0;
          for (let dy = -1; dy <= 1 && !s; dy++) {
            const yy = ty + dy;
            if (yy < 0 || yy >= th) continue;
            for (let dx = -1; dx <= 1; dx++) {
              const xx = tx + dx;
              if (xx >= 0 && xx < tw && wet[yy * tw + xx]) {
                s = 1;
                break;
              }
            }
          }
          sim[ty * tw + tx] = s;
        }
      }
      for (let ty = ty0; ty <= ty1; ty++) {
        const ya = ty * T;
        const yb = Math.min(h, ya + T);
        for (let tx = 0; tx < tw; tx++) {
          if (!sim[ty * tw + tx]) continue;
          const xa = tx * T;
          const xb = Math.min(w, xa + T);
          for (let y = ya; y < yb; y++) {
            for (let x = xa; x < xb; x++) {
              const i = y * w + x;
              const b = bleach[i];
              const c = cond[i];
              let flow = 0;
              // Mobilidade ~ quantidade de líquido: tecido seco segura a frente (borda nítida)
              if (x > 0) flow += (bleach[i - 1] - b) * Math.min(c, cond[i - 1]) * Math.min(1, (b + bleach[i - 1]) * 1.6);
              if (x < w - 1) flow += (bleach[i + 1] - b) * Math.min(c, cond[i + 1]) * Math.min(1, (b + bleach[i + 1]) * 1.6);
              if (y > 0) flow += (bleach[i - w] - b) * Math.min(c, cond[i - w]) * Math.min(1, (b + bleach[i - w]) * 1.6);
              if (y < h - 1) flow += (bleach[i + w] - b) * Math.min(c, cond[i + w]) * Math.min(1, (b + bleach[i + w]) * 1.6);
              next[i] = b + flow * 0.22;
            }
          }
        }
      }
      let max = 0;
      let wy0 = h;
      let wy1 = -1;
      for (let ty = ty0; ty <= ty1; ty++) {
        const ya = ty * T;
        const yb = Math.min(h, ya + T);
        for (let tx = 0; tx < tw; tx++) {
          const t = ty * tw + tx;
          if (!sim[t]) continue;
          const xa = tx * T;
          const xb = Math.min(w, xa + T);
          let any = 0;
          for (let y = ya; y < yb; y++) {
            for (let i = y * w + xa, end = y * w + xb; i < end; i++) {
              const b = next[i];
              if (b > 0.002) {
                // O alvejante come o corante e vai sendo consumido/absorvido
                dye[i] -= dye[i] * Math.min(1, b * 1.2) * 0.042;
                bleach[i] = b * 0.982;
                any = 1;
                if (b > max) max = b;
              } else {
                bleach[i] = 0;
              }
            }
          }
          wet[t] = any;
          if (any) {
            if (ya < wy0) wy0 = ya;
            if (yb - 1 > wy1) wy1 = yb - 1;
          }
        }
      }
      y0 = wy0;
      y1 = wy1;
      if (max < DRY) active = Math.max(0, active - 1);
      if (!active || y1 < y0) {
        if (y1 >= y0) bleach.fill(0, y0 * w, (y1 + 1) * w);
        wet.fill(0);
        active = 0;
        y0 = h;
        y1 = -1;
      }
    }
    return active > 0;
  }

  // wetness: quanto o molhado escurece. Padrão 0: no site virava sombra escura/pisca onde pingava
  function render(ctx, wetness = 0) {
    if (dirty1 < dirty0) return;
    if (!img) img = ctx.createImageData(w, h);
    const px = img.data;
    for (let i = dirty0 * w, end = (dirty1 + 1) * w; i < end; i++) {
      const d = Math.min(1, Math.max(0, dye[i] + grain[i]));
      const k = Math.round(d * 255) * 3;
      const wet = Math.min(0.35, bleach[i] * wetness); // molhado fica um pouco mais escuro
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
    wet.fill(0);
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
      active = 30;
      wet.fill(1, 0, Math.ceil(Math.min(h, other.h) / T) * tw);
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
