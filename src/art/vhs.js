// Título que "desbota" pra dentro: um ruído vai liberando as letras, como tecido sendo alvejado.
// Usa um filtro SVG só durante a animação e depois tira (texto volta nítido e leve).
let svgRoot = null;
let counter = 0;

function defs() {
  if (svgRoot) return svgRoot;
  svgRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgRoot.setAttribute('width', '0');
  svgRoot.setAttribute('height', '0');
  svgRoot.setAttribute('aria-hidden', 'true');
  svgRoot.style.position = 'absolute';
  document.body.appendChild(svgRoot);
  return svgRoot;
}

export function bleachIn(el, duration = 2600) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const id = `bleach-in-${++counter}`;
  const ns = 'http://www.w3.org/2000/svg';
  const filter = document.createElementNS(ns, 'filter');
  filter.id = id;
  filter.innerHTML = `
    <feTurbulence type="fractalNoise" baseFrequency="0.045 0.09" numOctaves="2" seed="${counter * 7}" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  9 0 0 0 -9" result="m"/>
    <feComposite in="SourceGraphic" in2="m" operator="in"/>`;
  defs().appendChild(filter);
  const matrix = filter.querySelector('feColorMatrix');
  el.style.filter = `url(#${id})`;

  const start = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - start) / duration);
    const e = 1 - Math.pow(1 - p, 3);
    // alpha = 9·ruído + b; b vai de -9 (nada) a +1 (tudo)
    matrix.setAttribute('values', `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  9 0 0 0 ${-9 + e * 10}`);
    if (p < 1) requestAnimationFrame(tick);
    else {
      el.style.filter = '';
      filter.remove();
    }
  };
  requestAnimationFrame(tick);
}
