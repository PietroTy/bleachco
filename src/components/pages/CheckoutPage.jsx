import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { createOrder } from '../../services/paymentService';
import { calculateShipping } from '../../services/shippingService';

export default function CheckoutPage() {
  const { cart, clearCart, showToast, selectedShipping, setSelectedShipping } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    zip: '',
    address: '',
    number: '',
    complement: '',
    city: '',
    state: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Estados do frete
  const [shippingOptions, setShippingOptions] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState('');

  if (cart.length === 0) {
    return (
      <div className="container" style={{ padding: '100px 20px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', marginBottom: '1rem', color: '#fff' }}>
          Seu carrinho está vazio ✦
        </h2>
        <p style={{ color: '#888', marginBottom: '2rem', maxWidth: '400px' }}>
          Adicione uma de nossas camisetas exclusivas feitas à mão antes de prosseguir com o checkout.
        </p>
        <Link to="/produtos" className="hero-btn-primary" style={{ display: 'inline-block', padding: '14px 28px', textDecoration: 'none' }}>
          Ver Coleção →
        </Link>
      </div>
    );
  }

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: '' }));
    }
  };

  const fetchShippingForCep = async (cleanCep) => {
    setShippingLoading(true);
    setShippingError('');
    try {
      const data = await calculateShipping({
        cep: cleanCep,
        items: cart.map((i) => ({ id: i.id, qty: i.qty, price: i.price })),
      });
      const options = data.options || [];
      setShippingOptions(options);

      if (options.length > 0) {
        // Seleciona a primeira opção por padrão se nenhuma foi escolhida ainda
        if (!selectedShipping || !options.some((o) => o.id === selectedShipping.id)) {
          setSelectedShipping(options[0]);
        }
      } else {
        setShippingError('Nenhuma modalidade de frete disponível para este CEP.');
      }
    } catch (err) {
      console.error('Erro frete checkout:', err);
      setShippingError(err.message || 'Erro ao consultar o frete.');
    } finally {
      setShippingLoading(false);
    }
  };

  const handleCepChange = async (e) => {
    const rawCep = e.target.value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, zip: rawCep }));

    if (rawCep.length === 8) {
      // 1. Busca Endereço
      try {
        const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            address: data.logradouro || prev.address,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
          }));
          setErrors((prev) => ({ ...prev, zip: '', address: '', city: '', state: '' }));
        } else {
          setErrors((prev) => ({ ...prev, zip: 'CEP não encontrado.' }));
        }
      } catch (err) {
        console.error('Error fetching CEP:', err);
      }

      // 2. Busca Opções do Melhor Envio
      fetchShippingForCep(rawCep);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (formData.name.trim().length < 3) newErrors.name = 'Nome completo obrigatório.';
    if (!validateEmail(formData.email.trim())) newErrors.email = 'E-mail inválido.';
    if (formData.phone.replace(/\D/g, '').length < 10) newErrors.phone = 'Telefone válido obrigatório.';
    if (formData.cpf.replace(/\D/g, '').length !== 11) newErrors.cpf = 'CPF válido (11 dígitos) obrigatório.';
    if (formData.zip.replace(/\D/g, '').length !== 8) newErrors.zip = 'CEP deve ter 8 dígitos.';
    if (!formData.address.trim()) newErrors.address = 'Endereço obrigatório.';
    if (!formData.number.trim()) newErrors.number = 'Número obrigatório.';
    if (!formData.city.trim()) newErrors.city = 'Cidade obrigatória.';
    if (!formData.state.trim()) newErrors.state = 'Estado obrigatório.';
    if (shippingOptions.length > 0 && !selectedShipping) newErrors.shipping = 'Selecione uma opção de frete.';
    if (!acceptedTerms) newErrors.terms = 'Concorde com os termos de variação artesanal para prosseguir.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.keys(newErrors)[0];
      const el = document.getElementById(firstError);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return;
    }

    setLoading(true);
    try {
      const orderItems = cart.map((item) => ({
        id: item.id,
        name: item.name || (item.id === 'eclipse' ? 'ECLIPSE' : 'SPY'),
        price: item.price || 139,
        qty: item.qty,
        size: item.size,
      }));

      const shippingCost = selectedShipping ? selectedShipping.price : 0;
      const totalAmount = subtotal + shippingCost;

      const res = await createOrder({
        items: orderItems,
        total: totalAmount,
        shipping: selectedShipping
          ? {
              id: selectedShipping.id,
              name: selectedShipping.name,
              company: selectedShipping.company,
              price: selectedShipping.price,
              deliveryRange: selectedShipping.deliveryRange,
            }
          : null,
        payer: {
          nome: formData.name.trim(),
          email: formData.email.trim(),
          tel: formData.phone.trim(),
          cpf: formData.cpf.trim(),
          cep: formData.zip.replace(/\D/g, ''),
          rua: formData.address.trim(),
          num: formData.number.trim(),
          comp: formData.complement.trim(),
          cidade: formData.city.trim(),
          estado: formData.state.trim(),
        },
      });

      if (res && res.checkoutUrl) {
        if (res.checkoutUrl.startsWith('http://') || res.checkoutUrl.startsWith('https://')) {
          window.location.href = res.checkoutUrl;
          return;
        } else {
          clearCart();
          try {
            navigate(res.checkoutUrl, { replace: true });
          } catch (e) {
            window.location.href = res.checkoutUrl;
          }
        }
      } else if (res && (res.orderId || res.id)) {
        const oId = res.orderId || res.id;
        clearCart();
        try {
          navigate(`/confirmacao?orderId=${oId}`, { replace: true });
        } catch (e) {
          window.location.href = `/confirmacao?orderId=${oId}`;
        }
      } else {
        throw new Error('Retorno inválido da API.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      showToast(err.message || 'Ocorreu um erro ao processar seu pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shippingCost = selectedShipping ? selectedShipping.price : 0;
  const grandTotal = subtotal + shippingCost;

  const fmtPrice = (value) => {
    return 'R$ ' + value.toFixed(2).replace('.', ',');
  };

  return (
    <>
      <div className="page-header" style={{ paddingBottom: '40px' }}>
        <span className="eyebrow reveal">Finalizar pedido</span>
        <h1 className="reveal reveal-delay-1">CHECKOUT</h1>
      </div>

      <section style={{ padding: '0 0 120px' }}>
        <div className="container">
          <div className="about-grid">
            {/* FORM */}
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', letterSpacing: '0.05em' }}>Dados de Entrega</h2>
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="name">Nome Completo *</label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Ex: Ana Silva"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? 'error' : ''}
                  />
                  <span className="form-error">{errors.name}</span>
                </div>

                <div className="form-group">
                  <label htmlFor="email">E-mail *</label>
                  <input
                    type="email"
                    id="email"
                    placeholder="Ex: ana@exemplo.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? 'error' : ''}
                  />
                  <span className="form-error">{errors.email}</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Telefone / WhatsApp *</label>
                    <input
                      type="tel"
                      id="phone"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={errors.phone ? 'error' : ''}
                    />
                    <span className="form-error">{errors.phone}</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="cpf">CPF *</label>
                    <input
                      type="text"
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={handleInputChange}
                      className={errors.cpf ? 'error' : ''}
                    />
                    <span className="form-error">{errors.cpf}</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="zip">CEP *</label>
                    <input
                      type="text"
                      id="zip"
                      placeholder="00000-000"
                      value={formData.zip}
                      onChange={handleCepChange}
                      className={errors.zip ? 'error' : ''}
                    />
                    <span className="form-error">{errors.zip}</span>
                  </div>

                  <div className="form-group" style={{ flexGrow: 2 }}>
                    <label htmlFor="address">Rua/Avenida *</label>
                    <input
                      type="text"
                      id="address"
                      placeholder="Rua..."
                      value={formData.address}
                      onChange={handleInputChange}
                      className={errors.address ? 'error' : ''}
                    />
                    <span className="form-error">{errors.address}</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="number">Número *</label>
                    <input
                      type="text"
                      id="number"
                      placeholder="123"
                      value={formData.number}
                      onChange={handleInputChange}
                      className={errors.number ? 'error' : ''}
                    />
                    <span className="form-error">{errors.number}</span>
                  </div>

                  <div className="form-group" style={{ flexGrow: 2 }}>
                    <label htmlFor="complement">Complemento</label>
                    <input
                      type="text"
                      id="complement"
                      placeholder="Apto, Bloco..."
                      value={formData.complement}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">Cidade *</label>
                    <input
                      type="text"
                      id="city"
                      placeholder="São Paulo"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={errors.city ? 'error' : ''}
                    />
                    <span className="form-error">{errors.city}</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="state">Estado *</label>
                    <input
                      type="text"
                      id="state"
                      placeholder="SP"
                      maxLength="2"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={errors.state ? 'error' : ''}
                    />
                    <span className="form-error">{errors.state}</span>
                  </div>
                </div>

                {/* ── OPÇÕES DE FRETE MELHOR ENVIO ── */}
                <div style={{ marginTop: '24px', marginBottom: '24px', padding: '20px', backgroundColor: 'var(--ink2)', border: '1px solid var(--gray-lt)', borderRadius: '6px' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '14px', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🚚</span> Opções de Entrega (Melhor Envio)
                  </h3>

                  {shippingLoading && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray)', padding: '10px 0' }}>
                      Calculando as melhores opções de frete...
                    </div>
                  )}

                  {shippingError && (
                    <div style={{ color: '#ff6b6b', fontSize: '0.82rem', marginBottom: '10px' }}>
                      {shippingError}
                    </div>
                  )}

                  {!shippingLoading && shippingOptions.length === 0 && !shippingError && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
                      Preencha um CEP válido acima para consultar as opções de envio.
                    </div>
                  )}

                  {shippingOptions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {shippingOptions.map((opt) => {
                        const isSelected = selectedShipping && selectedShipping.id === opt.id;
                        return (
                          <label
                            key={opt.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justify: 'space-between',
                              padding: '12px 14px',
                              backgroundColor: isSelected ? 'rgba(212,82,30,0.12)' : 'rgba(255,255,255,0.02)',
                              border: isSelected ? '1px solid var(--orange)' : '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <input
                                type="radio"
                                name="shippingMethod"
                                checked={isSelected}
                                onChange={() => setSelectedShipping(opt)}
                                style={{ accentColor: 'var(--orange)', width: '16px', height: '16px' }}
                              />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--bone)' }}>
                                  {opt.company} — {opt.name}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--gray)' }}>
                                  Prazo: {opt.deliveryRange}
                                </div>
                              </div>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--orange)' }}>
                              {fmtPrice(opt.price)}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {errors.shipping && (
                    <span className="form-error" style={{ display: 'block', marginTop: '8px' }}>{errors.shipping}</span>
                  )}
                </div>

                {/* Termos de Isenção e Responsabilidade (Disclaimers) */}
                <div style={{
                  margin: '24px 0 16px',
                  padding: '16px',
                  background: 'rgba(212, 82, 30, 0.08)',
                  border: '1px solid rgba(212, 82, 30, 0.3)',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  color: 'var(--bone)'
                }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--orange)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚠️ Termos do Processo Artesanal & Cuidados:</span>
                  </div>
                  <ul style={{ margin: '0 0 12px 18px', padding: 0, lineHeight: 1.5, color: '#d0c8be' }}>
                    <li style={{ marginBottom: '6px' }}>
                      <strong>Variações Únicas:</strong> Por ser um processo manual com água sanitária, o resultado final terá pequenas variações estéticas exclusivas em relação à foto ilustrativa.
                    </li>
                    <li>
                      <strong>Instruções de Lavagem:</strong> Lave separadamente nas primeiras lavagens para evitar manchas em outras roupas.
                    </li>
                  </ul>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.84rem', marginTop: '10px', color: '#fff' }}>
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => {
                        setAcceptedTerms(e.target.checked);
                        if (e.target.checked && errors.terms) setErrors(prev => ({ ...prev, terms: null }));
                      }}
                      style={{ accentColor: 'var(--orange)', width: '18px', height: '18px', marginTop: '2px' }}
                    />
                    <span>Estou ciente e de acordo com as variações artesanais e instruções de lavagem.</span>
                  </label>
                  {errors.terms && (
                    <span className="form-error" style={{ display: 'block', marginTop: '6px' }}>{errors.terms}</span>
                  )}
                </div>

                {/* Selos de Formas de Pagamento Aceitas */}
                <div style={{
                  margin: '20px 0 12px',
                  padding: '14px 16px',
                  background: '#161616',
                  border: '1px solid #282828',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '0.78rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
                    💳 Formas de Pagamento Aceitas (Mercado Pago):
                  </span>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.82rem', color: '#fff', alignItems: 'center' }}>
                    <span style={{ background: '#222', padding: '4px 10px', borderRadius: '4px', border: '1px solid #333' }}>
                      💳 Cartão de Crédito (até 12x)
                    </span>
                    <span style={{ background: '#222', padding: '4px 10px', borderRadius: '4px', border: '1px solid #333' }}>
                      ⚡ Pix Instantâneo
                    </span>
                    <span style={{ background: '#222', padding: '4px 10px', borderRadius: '4px', border: '1px solid #333' }}>
                      📄 Boleto Bancário
                    </span>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '10px' }}>
                  {loading ? 'Redirecionando...' : 'Ir para Pagamento (Cartão / Pix / Boleto) →'}
                </button>
              </form>
            </div>

            {/* ORDER SUMMARY */}
            <div style={{ padding: '32px', background: 'var(--ink2)', border: '1px solid var(--gray-lt)', borderRadius: '8px', alignSelf: 'flex-start' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', letterSpacing: '0.05em' }}>Resumo da Sacola</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
                {cart.map((item) => (
                  <div key={`${item.id}-${item.size}`} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div
                      style={{ width: '60px', height: '70px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--gray-lt)', flexShrink: 0 }}
                      dangerouslySetInnerHTML={{ __html: item.svgThumb }}
                    />
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ color: 'var(--bone)', fontWeight: 500, fontSize: '0.9rem' }}>{item.name}</div>
                      <div style={{ color: 'var(--gray)', fontSize: '0.78rem' }}>Tamanho {item.size} × {item.qty}</div>
                    </div>
                    <div style={{ color: 'var(--bone)', fontSize: '0.9rem', fontWeight: 500 }}>
                      {fmtPrice(item.price * item.qty)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--gray-lt)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--gray)' }}>
                  <span>Subtotal</span>
                  <span>{fmtPrice(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.9rem', color: 'var(--gray)' }}>
                  <span>Frete {selectedShipping ? `(${selectedShipping.company} - ${selectedShipping.name})` : ''}</span>
                  <span style={{ color: selectedShipping ? 'var(--bone)' : 'var(--orange)', fontWeight: 500 }}>
                    {selectedShipping ? fmtPrice(selectedShipping.price) : 'Consulte pelo CEP'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 600, color: 'var(--bone)', borderTop: '1px dashed var(--gray-lt)', paddingTop: '16px' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--orange)' }}>{fmtPrice(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
