import { useEffect, useRef } from 'react';
import { createStain } from './stain';

const S = 110;

// Time-lapse de uma gota caindo no algodão preto e se espalhando, em loop
export default function DropTimelapse({ className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stain = null;
    let pouring = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    let wait = 0;
    let visible = true;
    let stopped = false;

    // Derrama aos poucos (um fio no centro + respingos de vez em quando): a mancha cresce na tela
    const pour = () => {
      stain = createStain(S, S, (Math.random() * 1e9) | 0);
      cx = S * (0.45 + Math.random() * 0.1);
      cy = S * (0.45 + Math.random() * 0.1);
      pouring = 140;
    };
    const drip = () => {
      if (pouring <= 0) return;
      pouring--;
      // a mão balança: o ponto do fio anda devagar e a mancha sai torta
      cx = Math.min(S * 0.75, Math.max(S * 0.25, cx + (Math.random() - 0.5) * 2.4));
      cy = Math.min(S * 0.75, Math.max(S * 0.25, cy + (Math.random() - 0.45) * 2.4));
      stain.drop(cx, cy, 1.6 + Math.random() * 1.4, 0.2);
      if (Math.random() < 0.05) {
        const ang = Math.random() * Math.PI * 2;
        const d = 10 + Math.random() * 28;
        stain.drop(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, 0.8 + Math.random() * 1.6, 0.9);
      }
    };
    pour();
    if (reduced) {
      for (let i = 0; i < 200; i++) { drip(); stain.step(); }
      stain.render(ctx);
      return undefined;
    }

    const loop = () => {
      if (stopped) return;
      drip();
      if (!stain.step(1) && pouring <= 0) {
        // terminou de espalhar: segura a mancha um pouco e pinga de novo
        wait = setTimeout(() => { pour(); if (visible) raf = requestAnimationFrame(loop); }, 3200);
        stain.render(ctx);
        return;
      }
      stain.render(ctx);
      if (visible) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was) { cancelAnimationFrame(raf); clearTimeout(wait); raf = requestAnimationFrame(loop); }
    });
    io.observe(canvas);
    return () => { stopped = true; cancelAnimationFrame(raf); clearTimeout(wait); io.disconnect(); };
  }, []);

  return <canvas ref={ref} width={S} height={S} className={`drop-timelapse ${className}`} aria-hidden="true" />;
}
