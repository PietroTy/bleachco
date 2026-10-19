import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { checkPaymentStatus, getOrderDetails } from '../../services/paymentService';
import OrderStain, { stainCode } from '../../art/OrderStain';
import PixelIcon from '../common/PixelIcon';

const fmt = (v) => `R$ ${parseFloat(v).toFixed(2).replace('.', ',')}`;
const FAILED = ['rejected', 'cancelled', 'refunded', 'charged_back', 'amount_mismatch'];

// O pagamento acontece no Mercado Pago; aqui só mostramos o status real que o backend confirmou
export default function ConfirmationPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [status, setStatus] = useState(null); // null = carregando | 'not_found' | status do pedido
  const [order, setOrder] = useState(null);
  const [code, setCode] = useState(null);
  const statusRef = useRef(null);

  useEffect(() => {
    if (!orderId) return;
    let stopped = false;

    const check = async () => {
      try {
        const data = await checkPaymentStatus(orderId);
        if (stopped) return;
        statusRef.current = data.status;
        setStatus(data.status);
        if (data.status === 'approved') {
          setOrder(await getOrderDetails(orderId).catch(() => null));
          setCode(await stainCode(orderId));
        }
      } catch (err) {
        if (stopped || statusRef.current) return;
        statusRef.current = String(err.message).includes('nao_encontrado') ? 'not_found' : 'pending';
        setStatus(statusRef.current);
      }
    };

    check();
    const interval = setInterval(() => {
      if (statusRef.current === null || statusRef.current === 'pending') check();
    }, 5000);
    return () => { stopped = true; clearInterval(interval); };
  }, [orderId]);

  if (!orderId || status === 'not_found') {
    return (
      <div className="page-header confirm-page">
        <span className="eyebrow">Status do pedido</span>
        <h1 className="accent">PEDIDO NÃO ENCONTRADO.</h1>
        <p>Confira o link que você recebeu ou faça o pedido de novo.</p>
        <Link to="/produtos" className="btn btn-primary" style={{ marginTop: 32 }}>Ver estampas</Link>
      </div>
    );
  }

  return (
    <div className="page-header confirm-page">
      <span className="eyebrow">Pedido {orderId}</span>

      {status === null && <p className="confirm-wait"><span className="pulse-dot" /> Carregando o pedido...</p>}

      {status === 'approved' && (
        <>
          <h1>PAGAMENTO <span className="accent">APROVADO.</span></h1>
          <p>Sua camiseta entrou na fila de produção artesanal. Mandamos as novidades pro seu e-mail.</p>
          {order && (
            <div className="confirm-summary">
              <div><strong>Cliente:</strong> {order.payer?.nome} ({order.payer?.email})</div>
              <div>
                <strong>Entrega:</strong> {order.payer?.rua}, {order.payer?.num}
                {order.payer?.comp ? ` - ${order.payer.comp}` : ''} — {order.payer?.cidade}/{order.payer?.estado}
              </div>
              <div><strong>Itens:</strong> {order.items?.map((i) => `${i.qty}x ${i.name} (${i.size})`).join(', ')}</div>
              {order.shipping && <div><strong>Frete:</strong> {order.shipping.company} {order.shipping.name} — {fmt(order.shipping.price)}</div>}
              <div className="confirm-total">Total pago: {fmt(order.total)}</div>
            </div>
          )}
          {code && (
            <div className="confirm-stain">
              <OrderStain code={code} />
              <p>
                Sua mancha nº {code}: gerada só pra este pedido. <Link to={`/mancha/${code}`}>Link pra compartilhar <PixelIcon name="arrow" /></Link>
              </p>
            </div>
          )}
          <Link to="/produtos" className="btn btn-primary" style={{ marginTop: 32 }}>Voltar pra loja</Link>
        </>
      )}

      {FAILED.includes(status) && (
        <>
          <h1>PAGAMENTO <span className="accent">NÃO APROVADO.</span></h1>
          <p>Nada foi cobrado. Você pode tentar de novo com outra forma de pagamento.</p>
          <Link to="/checkout" className="btn btn-primary" style={{ marginTop: 32 }}>Tentar de novo</Link>
        </>
      )}

      {status && status !== 'approved' && !FAILED.includes(status) && (
        <>
          <h1>AGUARDANDO <span className="accent">PAGAMENTO.</span></h1>
          <p>
            Assim que o Mercado Pago confirmar, esta página atualiza sozinha. Pix costuma cair na hora;
            boleto pode levar até 3 dias úteis.
          </p>
          <p className="confirm-wait"><span className="pulse-dot" /> Aguardando confirmação...</p>
        </>
      )}
    </div>
  );
}
