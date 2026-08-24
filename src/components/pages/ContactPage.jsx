import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    tel: '',
    assunto: '',
    msg: '',
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const handleBlur = (field) => {
    const val = formData[field].trim();
    if (field === 'nome') {
      if (val.length < 2) {
        setErrors((prev) => ({ ...prev, nome: 'Nome obrigatório.' }));
      }
    } else if (field === 'email') {
      if (!validateEmail(val)) {
        setErrors((prev) => ({ ...prev, email: 'E-mail inválido.' }));
      }
    } else if (field === 'msg') {
      if (val.length < 20) {
        setErrors((prev) => ({ ...prev, msg: `Mínimo 20 caracteres (${val.length}/20).` }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (formData.nome.trim().length < 2) {
      newErrors.nome = 'Nome obrigatório.';
    }
    if (!validateEmail(formData.email.trim())) {
      newErrors.email = 'E-mail inválido.';
    }
    if (formData.msg.trim().length < 20) {
      newErrors.msg = `Mínimo 20 caracteres (${formData.msg.trim().length}/20).`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorField = Object.keys(newErrors)[0];
      const el = document.getElementById(firstErrorField);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  const isMsgOk = formData.msg.length >= 20;

  return (
    <>
      <div className="page-header">
        <span className="eyebrow reveal">Fale com a gente</span>
        <h1 className="reveal reveal-delay-1">
          MANDA
          <br />
          <span className="accent">UM OI.</span>
        </h1>
        <p className="reveal reveal-delay-2">
          Dúvidas sobre pedidos, peças personalizadas, parcerias ou só curiosidade. Responderemos pelo WhatsApp ou
          e-mail em até 1 dia útil.
        </p>
      </div>

      <section style={{ padding: '0 0 120px' }}>
        <div className="container">
          <div className="about-grid">
            {/* FORM */}
            <div className="contact-form-wrap">
              {submitted ? (
                <div
                  id="contact-success"
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    border: '1px solid var(--orange)',
                    borderRadius: '8px',
                    background: 'var(--orange-dim)',
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>✦</div>
                  <h3 style={{ fontSize: '2rem', marginBottom: '12px' }}>Mensagem enviada!</h3>
                  <p>A gente responde em breve pelo e-mail ou WhatsApp.</p>
                </div>
              ) : (
                <form id="contact-form" onSubmit={handleSubmit} noValidate>
                  <div className="form-group">
                    <label htmlFor="nome">Nome *</label>
                    <input
                      type="text"
                      id="nome"
                      placeholder="Seu nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('nome')}
                      className={errors.nome ? 'error' : ''}
                    />
                    <span className="form-error">{errors.nome}</span>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">E-mail *</label>
                      <input
                        type="email"
                        id="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('email')}
                        className={errors.email ? 'error' : ''}
                      />
                      <span className="form-error">{errors.email}</span>
                    </div>
                    <div className="form-group">
                      <label htmlFor="tel">WhatsApp</label>
                      <input
                        type="tel"
                        id="tel"
                        placeholder="(11) 99999-9999"
                        value={formData.tel}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="assunto">Assunto</label>
                    <select id="assunto" value={formData.assunto} onChange={handleInputChange}>
                      <option value="">Selecione</option>
                      <option value="pedido">Dúvida sobre pedido</option>
                      <option value="personalizado">Peça personalizada</option>
                      <option value="parceria">Parceria</option>
                      <option value="imprensa">Imprensa / mídia</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label
                      htmlFor="msg"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      Mensagem *
                      <span
                        id="c-char"
                        className={isMsgOk ? 'c-char-ok' : ''}
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 400,
                          letterSpacing: '0.05em',
                          textTransform: 'none',
                          color: 'var(--gray)',
                        }}
                      >
                        {isMsgOk ? `${formData.msg.length} ✓` : `${formData.msg.length} / mín. 20`}
                      </span>
                    </label>
                    <textarea
                      id="msg"
                      rows="5"
                      placeholder="Sua mensagem..."
                      value={formData.msg}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('msg')}
                      className={errors.msg ? 'error' : ''}
                    ></textarea>
                    <span className="form-error">{errors.msg}</span>
                  </div>
                  <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={submitting}>
                    {submitting ? 'Enviando...' : 'Enviar mensagem →'}
                  </button>
                </form>
              )}
            </div>

            {/* INFO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ padding: '32px', background: 'var(--ink2)', border: '1px solid var(--gray-lt)', borderRadius: '8px' }}>
                <span className="eyebrow" style={{ display: 'block', marginBottom: '20px' }}>
                  Contato direto
                </span>
                <p style={{ marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--bone)', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                    E-mail
                  </strong>
                </p>
                <p>oi@bleachco.com.br</p>
                <p style={{ marginTop: '20px', marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--bone)', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                    WhatsApp
                  </strong>
                </p>
                <p>(11) 99999-0000</p>
                <p style={{ marginTop: '4px', fontSize: '.8rem' }}>Seg–Sex, 10h–18h</p>
                <p style={{ marginTop: '20px', marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--bone)', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                    Instagram
                  </strong>
                </p>
                <p>
                  <a href="https://instagram.com/bleachco" style={{ color: 'var(--orange)' }} target="_blank" rel="noopener noreferrer">
                    @bleachco
                  </a>
                </p>
              </div>

              <div style={{ padding: '32px', background: 'var(--ink2)', border: '1px solid var(--gray-lt)', borderRadius: '8px' }}>
                <span className="eyebrow" style={{ display: 'block', marginBottom: '20px' }}>
                  Peças personalizadas
                </span>
                <p>
                  Tem uma ideia de estampa? A gente pode criar uma peça exclusiva para você. Entre em contato e explique
                  o conceito — avaliamos caso a caso.
                </p>
                <p style={{ marginTop: '12px', fontSize: '.8rem' }}>Prazo adicional para desenvolvimento. Consultar disponibilidade.</p>
              </div>

              <div
                style={{
                  padding: '32px',
                  background: 'var(--orange-dim)',
                  border: '1px solid rgba(212,82,30,.3)',
                  borderRadius: '8px',
                }}
              >
                <p style={{ fontFamily: 'var(--ff-display)', fontSize: '1.6rem', lineHeight: 1.2, color: 'var(--bone)' }}>
                  "Não existe peça errada.
                  <br />
                  Existe peça sua."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
