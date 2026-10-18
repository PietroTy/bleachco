import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createStain } from './stain';

const CELL = 6; // px de tela por pixel de tecido
// Onde o clique é da interface, não do pano
const UI = 'a, button, input, select, textarea, label, summary, [role="button"], canvas, .cart-drawer, #navbar';
const SPLASH_PX = 70; // raio de um respingo na tela, seja qual for a grade

// O fundo do site inteiro é um pano preto do tamanho da página (rola junto com ela).
// Cada página já chega com manchas onde marca data-stain="fx,fy[,tamanho] …" (frações do elemento);
// clicou em qualquer lugar, pinga alvejante ali.
export default function BleachBackground() {
  const { pathname } = useLocation();
  const canvasRef = useRef(null);
  const apiRef = useRef(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const page = document.getElementById('root');
    let stain = null;
    let raf = 0;

    const loop = () => {
      const busy = stain.step(2);
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

    const splashAt = (px, py, k = 1) => {
      const size = SPLASH_PX / ((Math.min(stain.w, stain.h) / 100) * 9 * CELL);
      stain.splash(px / CELL, py / CELL, size * k);
      run();
    };

    // click (e não pointerdown): no celular, arrastar pra rolar a página não pinga
    const onClick = (e) => {
      if (e.target.closest(UI)) return;
      fit();
      splashAt(e.pageX, e.pageY, 0.8 + Math.random() * 0.5);
      setTouched(true);
    };
    document.addEventListener('click', onClick);

    apiRef.current = {
      // Pano limpo + as manchas que a página pede
      seed() {
        fit();
        stain.reset();
        document.querySelectorAll('[data-stain]').forEach((el) => {
          const r = el.getBoundingClientRect();
          el.dataset.stain.trim().split(/\s+/).forEach((spec) => {
            const [fx, fy, k = 1] = spec.split(',').map(Number);
            splashAt(r.left + window.scrollX + fx * r.width, r.top + window.scrollY + fy * r.height, k);
          });
        });
        stain.render(ctx);
        run();
      },
      wash() {
        stain.reset();
        stain.render(ctx);
      },
      save() {
        const big = document.createElement('canvas');
        big.width = window.innerWidth * 2;
        big.height = window.innerHeight * 2;
        const c = big.getContext('2d');
        c.imageSmoothingEnabled = false;
        // Só o pedaço visível
        c.drawImage(canvas, window.scrollX / CELL, window.scrollY / CELL, window.innerWidth / CELL, window.innerHeight / CELL, 0, 0, big.width, big.height);
        c.fillStyle = 'rgba(242,238,232,0.85)';
        c.font = '40px VT323, monospace';
        c.fillText('BLEACH.CO — MANCHA ÚNICA', 32, big.height - 32);
        const a = document.createElement('a');
        a.download = 'minha-mancha-bleachco.png';
        a.href = big.toDataURL('image/png');
        a.click();
      },
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('click', onClick);
    };
  }, []);

  // Página nova, pano novo: espera o conteúdo assentar pra mirar as manchas
  useEffect(() => {
    const t = setTimeout(() => apiRef.current.seed(), 250);
    setTouched(false);
    return () => clearTimeout(t);
  }, [pathname]);

  const wash = () => {
    apiRef.current.wash();
    setTouched(false);
  };

  return (
    <>
      <div className="bleach-bg-frame" aria-hidden="true">
        <canvas ref={canvasRef} className="bleach-bg" />
      </div>
      <div className="bleach-bg-osd">
        {touched ? (
          <>
            <button type="button" onClick={wash}>Lavar</button>
            <button type="button" onClick={() => apiRef.current.save()}>Baixar</button>
          </>
        ) : (
          <span>clica em qualquer lugar pra alvejar</span>
        )}
      </div>
    </>
  );
}
