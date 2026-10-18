import { useEffect, useRef, useState } from 'react';
import { createStain } from './stain';

const CELL = 6; // px de tela por pixel de tecido
// Onde o clique é da interface, não do pano
const UI = 'a, button, input, select, textarea, label, summary, [role="button"], canvas, .cart-drawer, #navbar';

// O fundo do site inteiro é um pano preto: clicou em qualquer lugar, pinga alvejante ali.
export default function BleachBackground() {
  const canvasRef = useRef(null);
  const stainRef = useRef(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    // Grade do tamanho da tela (não da janela): girar/rolar no celular não apaga a mancha
    const w = Math.ceil(Math.max(window.screen.width, window.innerWidth) / CELL);
    const h = Math.ceil(Math.max(window.screen.height, window.innerHeight) / CELL);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w * CELL}px`;
    canvas.style.height = `${h * CELL}px`;
    const stain = createStain(w, h, (Math.random() * 1e9) | 0);
    stainRef.current = stain;
    stain.render(ctx);
    // Respingo com ~70px de raio, seja qual for a grade
    const size = 70 / ((Math.min(w, h) / 100) * 9 * CELL);

    let raf = 0;
    const loop = () => {
      const busy = stain.step(2);
      stain.render(ctx);
      raf = busy ? requestAnimationFrame(loop) : 0;
    };
    // click (e não pointerdown): no celular, arrastar pra rolar a página não pinga
    const onClick = (e) => {
      if (e.target.closest(UI)) return;
      stain.splash(e.clientX / CELL, e.clientY / CELL, size * (0.8 + Math.random() * 0.5));
      setTouched(true);
      if (!raf) raf = requestAnimationFrame(loop);
    };
    document.addEventListener('click', onClick);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('click', onClick);
    };
  }, []);

  const wash = () => {
    stainRef.current.reset();
    stainRef.current.render(canvasRef.current.getContext('2d'));
    setTouched(false);
  };

  const save = () => {
    const src = canvasRef.current;
    const big = document.createElement('canvas');
    big.width = window.innerWidth * 2;
    big.height = window.innerHeight * 2;
    const ctx = big.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    // Só o pedaço visível
    const sw = window.innerWidth / CELL;
    const sh = window.innerHeight / CELL;
    ctx.drawImage(src, 0, 0, sw, sh, 0, 0, big.width, big.height);
    ctx.fillStyle = 'rgba(242,238,232,0.85)';
    ctx.font = '40px VT323, monospace';
    ctx.fillText('BLEACH.CO — MANCHA ÚNICA', 32, big.height - 32);
    const a = document.createElement('a');
    a.download = 'minha-mancha-bleachco.png';
    a.href = big.toDataURL('image/png');
    a.click();
  };

  return (
    <>
      <canvas ref={canvasRef} className="bleach-bg" aria-hidden="true" />
      <div className="bleach-bg-osd">
        {touched ? (
          <>
            <button type="button" onClick={wash}>Lavar</button>
            <button type="button" onClick={save}>Baixar</button>
          </>
        ) : (
          <span>clica em qualquer lugar pra alvejar</span>
        )}
      </div>
    </>
  );
}
