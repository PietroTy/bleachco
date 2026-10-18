import { useEffect, useRef } from 'react';
import { generateStain } from './stain';

const W = 96;
const H = 120;

// Código público da mancha: hash do número do pedido (não dá pra voltar ao pedido,
// que é o que abre os dados do cliente). Ex: "7F3A-91C2".
export async function stainCode(orderId) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`bleachco:${orderId}`));
  const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

export const STAIN_CODE_RE = /^[0-9A-F]{4}-[0-9A-F]{4}$/;

// A mancha nº <code>: sempre a mesma pro mesmo código
export default function OrderStain({ code, download = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const stain = generateStain(code, W, H);
    stain.render(canvasRef.current.getContext('2d'));
  }, [code]);

  const save = () => {
    const big = document.createElement('canvas');
    big.width = W * 8;
    big.height = H * 8 + 120;
    const ctx = big.getContext('2d');
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, big.width, big.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvasRef.current, 0, 0, W * 8, H * 8);
    ctx.fillStyle = '#F2EEE8';
    ctx.font = '64px VT323, monospace';
    ctx.fillText(`MANCHA Nº ${code}`, 40, H * 8 + 78);
    ctx.fillStyle = '#D4521E';
    ctx.font = '40px VT323, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('BLEACH.CO', big.width - 40, H * 8 + 78);
    const a = document.createElement('a');
    a.download = `mancha-${code}.png`;
    a.href = big.toDataURL('image/png');
    a.click();
  };

  return (
    <figure className="order-stain">
      <canvas ref={canvasRef} width={W} height={H} aria-label={`Mancha nº ${code}`} />
      <figcaption>
        <span>MANCHA Nº {code}</span>
        {download && <button type="button" onClick={save}>Baixar</button>}
      </figcaption>
    </figure>
  );
}
