import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { checkPaymentStatus, getOrderDetails } from '../../services/paymentService';
import { API_CONFIG } from '../../config/apiConfig';
import { useApp } from '../../context/AppContext';

export default function ConfirmationPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { showToast } = useApp();
  const [status, setStatus] = useState('pending');
  const [paymentData, setPaymentData] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const isSimulated = searchParams.get('simulated') === 'true';

  useEffect(() => {
    if (!orderId) return;

    const checkStatus = async () => {
      try {
        const data = await checkPaymentStatus(orderId, isSimulated);
        if (data) {
          setStatus(data.status);
          setPaymentData(data);
        }
        const details = await getOrderDetails(orderId).catch(() => null);
        if (details) {
          setOrderDetails(details);
        }
      } catch (err) {
        console.error('Error fetching order status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();

    const interval = setInterval(() => {
      if (status === 'pending') {
        checkStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId, status, isSimulated]);

  if (!orderId) {
    return (
      <div className="page-header" style={{ padding: '120px 20px', textAlign: 'center' }}>
        <h1 className="accent">Pedido Não Encontrado</h1>
        <p style={{ marginTop: '20px' }}>Por favor, retorne à loja e faça seu pedido novamente.</p>
        <Link to="/produtos" className="btn btn-primary" style={{ marginTop: '30px', display: 'inline-block' }}>
          Ver Estampas
        </Link>
      </div>
    );
  }



  const simulateApproval = async () => {
    try {
      const res = await fetch(`${API_CONFIG.BACKEND_URL}/payment/debug/approve/${orderId}`);
      if (res.ok) {
        showToast('Pagamento aprovado na simulação!');
        setStatus('approved');
        return;
      }
    } catch (err) {
      console.warn('Simulação via backend falhou, aprovando localmente:', err);
    }
    // Fallback garantido de simulação local para testes imediatos
    showToast('Pagamento aprovado na simulação!');
    setStatus('approved');
  };

  return (
    <>
      <div className="page-header" style={{ paddingBottom: '30px' }}>
        <span className="eyebrow">Status do Pedido</span>
        <h1 className="accent">CONFIRMAÇÃO</h1>
      </div>

      <section style={{ padding: '0 0 120px' }}>
        <div className="container--narrow" style={{ textAlign: 'center' }}>
          {loading ? (
            <div style={{ padding: '60px 0' }}>
              <div className="loading-spinner" />
              <p style={{ marginTop: '20px', color: 'var(--gray)' }}>Carregando dados do pedido...</p>
            </div>
          ) : status === 'approved' ? (
            <div style={{ padding: '40px 24px', border: '1px solid var(--orange)', borderRadius: '12px', background: 'rgba(235, 94, 40, 0.06)', maxWidth: '560px', margin: '0 auto' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px', color: 'var(--orange)' }}>✦</div>
              <h2 style={{ fontSize: '2rem', marginBottom: '12px', color: '#fff', fontFamily: 'Syne, sans-serif' }}>PAGAMENTO APROVADO!</h2>
              <p style={{ maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.6, color: '#ccc', fontSize: '0.95rem' }}>
                Sua camiseta já entrou na nossa fila de produção artesanal. Em breve enviaremos as atualizações para o seu e-mail.
              </p>

              {orderDetails?.payer && (
                <div style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '16px 20px', textAlign: 'left', marginBottom: '24px', fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--orange)', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Resumo do Pedido #{orderId}
                  </div>
                  <div style={{ color: '#fff', marginBottom: '4px' }}>
                    <strong>Cliente:</strong> {orderDetails.payer.nome} ({orderDetails.payer.email})
                  </div>
                  {orderDetails.payer.rua && (
                    <div style={{ color: '#aaa', marginBottom: '4px' }}>
                      <strong>Entrega:</strong> {orderDetails.payer.rua}, {orderDetails.payer.num} {orderDetails.payer.comp ? `- ${orderDetails.payer.comp}` : ''} — {orderDetails.payer.cidade}/{orderDetails.payer.estado} (CEP: {orderDetails.payer.cep})
                    </div>
                  )}
                  {orderDetails.items && orderDetails.items.length > 0 && (
                    <div style={{ color: '#aaa', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #333' }}>
                      <strong>Itens:</strong> {orderDetails.items.map(i => `${i.qty}x ${i.name} (Tam: ${i.size})`).join(', ')}
                    </div>
                  )}
                  {orderDetails.total && (
                    <div style={{ color: '#fff', marginTop: '8px', fontWeight: 'bold', fontSize: '0.95rem' }}>
                      Total Pago: R$ {parseFloat(orderDetails.total).toFixed(2).replace('.', ',')}
                    </div>
                  )}
                </div>
              )}

              <Link to="/produtos" className="hero-btn-primary" style={{ display: 'inline-block', padding: '12px 28px', textDecoration: 'none' }}>
                Voltar para a Loja →
              </Link>
            </div>
          ) : (
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>◎</div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '12px', color: 'var(--bone)' }}>AGUARDANDO PAGAMENTO</h2>
              <p style={{ color: 'var(--gray)', marginBottom: '32px' }}>
                Escaneie o código QR ou copie o código Pix abaixo para pagar.
              </p>

              {/* QR Code Display */}
              <div style={{ margin: '0 auto 28px', width: '220px', height: '220px', background: '#fff', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={
                    paymentData?.qrCodeBase64
                      ? `data:image/png;base64,${paymentData.qrCodeBase64}`
                      : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                          paymentData?.qrCode || '00020126580014br.gov.bcb.pix0136bleachco-pix-teste-sandbox@bleachco.com.br5204000053039865406139.005802BR5909BLEACH_CO6009SAO_PAULO62070503***6304'
                        )}`
                  }
                  alt="QR Code Pix"
                  style={{ width: '200px', height: '200px' }}
                />
              </div>

              {/* Pix Copia e Cola */}
              <div style={{ maxWidth: '440px', margin: '0 auto 32px' }}>
                <button
                  onClick={() => {
                    const pixText = paymentData?.qrCode || '00020126580014br.gov.bcb.pix0136bleachco-pix-teste-sandbox@bleachco.com.br5204000053039865406139.005802BR5909BLEACH_CO6009SAO_PAULO62070503***6304';
                    navigator.clipboard.writeText(pixText);
                    setCopied(true);
                    showToast('Código Pix copiado para a área de transferência.');
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="btn btn-ghost btn-full"
                  style={{ marginBottom: '12px', borderColor: 'var(--gray)' }}
                >
                  {copied ? 'Copiado! ✓' : 'Copiar Código Pix (Copia e Cola)'}
                </button>
                <textarea
                  readOnly
                  value={
                    paymentData?.qrCode || '00020126580014br.gov.bcb.pix0136bleachco-pix-teste-sandbox@bleachco.com.br5204000053039865406139.005802BR5909BLEACH_CO6009SAO_PAULO62070503***6304'
                  }
                  onClick={(e) => e.target.select()}
                  style={{
                    width: '100%',
                    height: '70px',
                    background: 'var(--ink2)',
                    border: '1px solid var(--gray-lt)',
                    color: 'var(--gray)',
                    fontFamily: 'monospace',
                    fontSize: '0.72rem',
                    padding: '10px',
                    borderRadius: '4px',
                    resize: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>

              <div style={{ borderTop: '1px dashed var(--gray-lt)', paddingTop: '28px', marginTop: '28px' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--gray)' }}>
                  A página atualizará automaticamente assim que o pagamento for detectado.
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', marginTop: '12px' }}>
                  <div className="pulse-dot" />
                  <span style={{ fontSize: '0.78rem', color: 'var(--orange)' }}>Aguardando confirmação...</span>
                </div>
              </div>

              <div style={{ marginTop: '60px', padding: '20px', border: '1px dashed var(--gray-lt)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray)', marginBottom: '12px' }}>
                  Ambiente de Testes / Sandbox
                </p>
                <button onClick={simulateApproval} className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '8px 16px' }}>
                  Simular Aprovação (Pix Aprovado)
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
