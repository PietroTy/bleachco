import { useEffect, useRef } from 'react';

// Chuvisco de TV fora do ar, em baixa resolução
export default function NoSignal() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const { width: w, height: h } = canvas;
    const img = ctx.createImageData(w, h);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let timer = 0;
    let stopped = false;
    let frame = 0;
    const draw = () => {
      const band = (frame * 2) % (h + 40) - 20; // faixa de "rolagem" do VHS
      for (let y = 0; y < h; y++) {
        const inBand = Math.abs(y - band) < 6;
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const v = Math.random() * (inBand ? 255 : 150);
          img.data[i] = v;
          img.data[i + 1] = v;
          img.data[i + 2] = v * (inBand ? 0.9 : 1);
          img.data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      frame++;
      if (!reduced && !stopped) timer = setTimeout(() => requestAnimationFrame(draw), 60);
    };
    draw();
    return () => { stopped = true; clearTimeout(timer); };
  }, []);

  return <canvas ref={ref} width={160} height={90} className="no-signal-canvas" aria-hidden="true" />;
}
