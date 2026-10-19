import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { createStain } from './stain';
import { PX } from './ps1';

const CELL = PX; // px de tela por pixel de tecido
const K = 6 / CELL; // medidas abaixo foram feitas em grade de 6px
// Onde o clique é da interface, não do pano
const UI = 'a, button, input, select, textarea, label, summary, [role="button"], canvas:not(.skeleton3d-canvas), .cart-drawer, #navbar';
// Canvas do esqueleto é maior que ele: só o próprio esqueleto é interface, o vazio em volta é pano
const ui = (target, x, y) => target.closest(UI) || (target.classList?.contains('skeleton3d-canvas') && target.hitTest?.(x, y));
const SPLASH_PX = 70; // raio de um respingo na tela, seja qual for a grade

// O fundo do site inteiro é um pano preto do tamanho da página (rola junto com ela).
// Cada página já chega com manchas onde marca data-stain="fx,fy[,tamanho] …" (frações do elemento);
// clicou em qualquer lugar, pinga alvejante ali.
export default function BleachBackground() {
  const { pathname } = useLocation();
  const canvasRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const page = document.getElementById('root');
    let stain = null;
    let raf = 0;
    // Escorridos: algumas manchas soltam um fio fraco que desce devagar (gravidade), depois de um tempo
    let drips = [];
    let lastDrip = 0;

    const loop = (now) => {
      if (drips.length && now - lastDrip > 90 / K) {
        lastDrip = now;
        drips = drips.filter((d) => {
          if ((d.wait -= 1) > 0) return true;
          d.x += (Math.random() - 0.5) * 0.6;
          d.y += 1;
          stain.drop(d.x, d.y, d.r * (0.6 + 0.4 * (d.left / d.len)), 0.22);
          return --d.left > 0;
        });
      }
      const busy = stain.step(2) || drips.length > 0;
      stain.render(ctx);
      raf = busy ? requestAnimationFrame(loop) : 0;
    };
    const run = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    // Grade do tamanho da página; só cresce (o que sobra fica cortado pela moldura)
    const fit = () => {
      const w = Math.ceil(document.documentElement.clientWidth / CELL);
      const h = Math.ceil(page.scrollHeight / CELL);
      if (stain && stain.w === w && stain.h >= h) return;
      const next = createStain(w, Math.max(h, stain ? stain.h : 0), (Math.random() * 1e9) | 0);
      if (stain) next.paste(stain);
      stain = next;
      canvas.width = next.w;
      canvas.height = next.h;
      canvas.style.width = `${next.w * CELL}px`;
      canvas.style.height = `${next.h * CELL}px`;
      stain.render(ctx);
      if (stain.busy) run();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(page);

    const splashAt = (px, py, k = 1, strength) => {
      // Tela estreita, mancha menor (senão uma poça come o celular inteiro)
      const narrow = Math.max(0.5, Math.min(1, (stain.w * CELL) / 900));
      const size = (SPLASH_PX * narrow) / ((Math.min(stain.w, stain.h) / 100) * 9 * CELL);
      stain.blot(px / CELL, py / CELL, size * k, strength);
      if (Math.random() < 0.25) {
        // Começa da parte de baixo da mancha, depois de a poça assentar (wait em passos de ~90ms)
        const u = size * k * (Math.min(stain.w, stain.h) / 100);
        const len = Math.round((6 + Math.random() * 14) * u);
        drips.push({ x: px / CELL + (Math.random() - 0.5) * 6 * u, y: py / CELL + 5 * u, r: 0.9 * K + u * 0.35, len, left: len, wait: 15 + Math.random() * 25 });
      }
      run();
    };

    // Clique pinga uma mancha; arrastar (mouse apertado ou dedo deslizando) deixa rastro de gotas
    // pelo caminho, como garrafa sendo balançada. O dedo continua rolando a página.
    let trail = null; // última posição (px da página) do arrasto
    let dragged = false;
    let phase = 0; // anda ao longo do traço: a grossura ondula em vez de ser um fio constante
    const trailTo = (px, py) => {
      const dist = Math.hypot(px - trail[0], py - trail[1]);
      const STEP = 2.5 * CELL;
      if (dist < STEP) return;
      const nx = -(py - trail[1]) / dist;
      const ny = (px - trail[0]) / dist;
      for (let t = 0; t < dist; t += STEP) {
        const x = trail[0] + ((px - trail[0]) * t) / dist;
        const y = trail[1] + ((py - trail[1]) * t) / dist;
        phase += STEP / 40;
        // Grosso e irregular: largura ondula, força varia, e de vez em quando um pingo solto do lado
        const r = (1.9 + 1.1 * Math.sin(phase) + 0.8 * Math.sin(phase * 2.7 + 1) + Math.random() * 0.8) * K;
        stain.drop(x / CELL, y / CELL, Math.max(1, r), 0.5 + Math.random() * 0.5);
        if (Math.random() < 0.12) {
          const off = (6 + Math.random() * 16) * (Math.random() < 0.5 ? -1 : 1);
          stain.drop((x + nx * off) / CELL, (y + ny * off) / CELL, (0.6 + Math.random()) * K, 0.7);
        }
      }
      trail = [px, py];
      dragged = true;
      run();
    };
    const onPointerDown = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || ui(e.target, e.clientX, e.clientY)) return;
      fit();
      trail = [e.pageX, e.pageY];
      dragged = false;
    };
    // Sem isso o navegador começa a arrastar imagem/seleção no mousedown
    const onMouseDown = (e) => {
      if (e.button === 0 && !ui(e.target, e.clientX, e.clientY)) e.preventDefault();
    };
    const onPointerMove = (e) => {
      if (e.pointerType === 'mouse' && trail && e.buttons & 1) trailTo(e.pageX, e.pageY);
    };
    const onPointerUp = (e) => {
      if (e.pointerType === 'mouse') trail = null;
    };
    const onTouchStart = (e) => {
      if (e.touches.length !== 1 || ui(e.target, e.touches[0].clientX, e.touches[0].clientY)) return;
      fit();
      trail = [e.touches[0].pageX, e.touches[0].pageY];
      dragged = false;
    };
    const onTouchMove = (e) => {
      if (trail && e.touches.length === 1) trailTo(e.touches[0].pageX, e.touches[0].pageY);
    };
    const onTouchEnd = () => {
      trail = null;
    };
    const onClick = (e) => {
      if (ui(e.target, e.clientX, e.clientY)) return;
      // Fim de um arrasto não pinga mancha extra
      if (dragged) {
        dragged = false;
        return;
      }
      fit();
      splashAt(e.pageX, e.pageY, 0.8 + Math.random() * 0.5);
    };
    const passive = { passive: true };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('pointermove', onPointerMove, passive);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('touchstart', onTouchStart, passive);
    document.addEventListener('touchmove', onTouchMove, passive);
    document.addEventListener('touchend', onTouchEnd, passive);
    document.addEventListener('click', onClick);

    apiRef.current = {
      // Pano limpo + as manchas que a página pede
      seed() {
        fit();
        stain.reset();
        drips = [];
        document.querySelectorAll('[data-stain]').forEach((el) => {
          const r = el.getBoundingClientRect();
          el.dataset.stain.trim().split(/\s+/).forEach((spec) => {
            const [fx, fy, k = 1] = spec.split(',').map(Number);
            splashAt(r.left + window.scrollX + fx * r.width, r.top + window.scrollY + fy * r.height, k);
          });
        });
        // E umas a mais espalhadas, coladas nas laterais pra não brigar com o texto
        const pageW = stain.w * CELL;
        const pageH = page.scrollHeight;
        const extra = Math.round((pageW * pageH) / (480 * 480));
        for (let k = 0; k < extra; k++) {
          const side = Math.random() < 0.5 ? Math.random() * 0.2 : 0.8 + Math.random() * 0.2;
          splashAt(side * pageW, Math.random() * pageH, 0.4 + Math.random() * 0.8);
        }
        stain.render(ctx);
        run();
      },
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('pointermove', onPointerMove, passive);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('touchstart', onTouchStart, passive);
      document.removeEventListener('touchmove', onTouchMove, passive);
      document.removeEventListener('touchend', onTouchEnd, passive);
      document.removeEventListener('click', onClick);
    };
  }, []);

  // Página nova, pano novo: espera o conteúdo assentar pra mirar as manchas
  useEffect(() => {
    const t = setTimeout(() => apiRef.current.seed(), 250);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <>
      <div className="bleach-bg-frame" aria-hidden="true">
        <canvas ref={canvasRef} className="bleach-bg" />
      </div>
    </>
  );
}
