import { useEffect, useRef, useState } from 'react';
import { createStain } from './stain';

const W = 160;
const H = 100;

// "Alveje você mesmo": um pano preto onde o dedo/mouse pinga alvejante.
// Cada mancha nasce do gesto da pessoa, então nunca se repete.
export default function BleachCanvas() {
  const canvasRef = useRef(null);
  const stainRef = useRef(null);
  const runningRef = useRef(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const stain = createStain(W, H, (Math.random() * 1e9) | 0);
    stainRef.current = stain;
    stain.render(ctx);

    let visible = true;
    let raf = 0;
    const loop = () => {
      const busy = stain.step(2);
      stain.render(ctx);
      if (busy && visible) raf = requestAnimationFrame(loop);
      else runningRef.current = false;
    };
    stainRef.current.kick = () => {
      if (!runningRef.current && visible) {
        runningRef.current = true;
        raf = requestAnimationFrame(loop);
      }
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && stain.busy) stainRef.current.kick();
    });
    io.observe(canvas);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);

  const toGrid = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };

  const last = useRef(null);
  const onDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = toGrid(e);
    stainRef.current.splash(x, y, 0.7 + Math.random() * 0.5);
    last.current = [x, y];
    setTouched(true);
    stainRef.current.kick();
  };
  const onMove = (e) => {
    if (!last.current) return;
    const [x, y] = toGrid(e);
    const [lx, ly] = last.current;
    const dist = Math.hypot(x - lx, y - ly);
    if (dist < 2.5) return;
    // Rastro: gotas finas ao longo do caminho, como garrafa sendo balançada
    for (let t = 0; t < dist; t += 2.5) {
      stainRef.current.drop(lx + ((x - lx) * t) / dist, ly + ((y - ly) * t) / dist, 0.9 + Math.random() * 0.9, 0.7);
    }
    last.current = [x, y];
    stainRef.current.kick();
  };
  const onUp = () => { last.current = null; };

  const wash = () => {
    stainRef.current.reset();
    stainRef.current.render(canvasRef.current.getContext('2d'));
    setTouched(false);
  };

  const save = () => {
    const src = canvasRef.current;
    const big = document.createElement('canvas');
    big.width = W * 8;
    big.height = H * 8;
    const ctx = big.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0, big.width, big.height);
    ctx.fillStyle = 'rgba(242,238,232,0.85)';
    ctx.font = '40px VT323, monospace';
    ctx.fillText('BLEACH.CO — MANCHA ÚNICA', 32, big.height - 32);
    const a = document.createElement('a');
    a.download = 'minha-mancha-bleachco.png';
    a.href = big.toDataURL('image/png');
    a.click();
  };

  return (
    <div className="bleach-canvas">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        aria-label="Pano preto: clique ou arraste para pingar alvejante"
      />
      {!touched && <span className="bleach-canvas-hint">clica ou arrasta</span>}
      <div className="bleach-canvas-actions">
        <button type="button" onClick={wash}>Lavar</button>
        <button type="button" onClick={save} disabled={!touched}>Baixar</button>
      </div>
    </div>
  );
}
