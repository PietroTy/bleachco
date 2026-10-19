import { useState } from 'react';
import { CONTACT, CONTACT_LINKS } from '../../config/contact';
import { getApiUrl } from '../../config/apiConfig';
import PixelIcon from '../common/PixelIcon';

const SUBJECTS = ['Dúvida sobre pedido', 'Peça personalizada', 'Parceria', 'Outro assunto'];
const EMPTY = { nome: '', email: '', assunto: SUBJECTS[0], mensagem: '', website: '' };

export default function ContactPage() {
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setState('sending');
    setError('');
    let validation = '';
    try {
      const res = await fetch(getApiUrl('contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 400) validation = data.error;
      if (!res.ok) throw new Error();
      setState('sent');
      setForm(EMPTY);
    } catch {
      setState('error');
      setError(validation || `Não deu pra enviar agora. Manda direto pra ${CONTACT.email}.`);
    }
  };

  return (
    <>
      <div className="page-header" data-stain="0.9,0.3,1 0.04,0.85,0.6">
        <span className="eyebrow reveal">Fale com a gente</span>
        <h1 className="reveal reveal-delay-1">
          MANDA
          <br />
          <span className="accent">UM OI.</span>
        </h1>
        <p className="reveal reveal-delay-2">
          Dúvidas sobre pedidos, peças personalizadas, parcerias ou só curiosidade. A resposta chega no seu e-mail.
        </p>
      </div>

      <section style={{ padding: '0 0 120px' }}>
        <div className="container">
          <div className="about-grid">
            <div className="contact-form-box reveal">
              {state === 'sent' ? (
                <div className="contact-sent">
                  <h3>MENSAGEM <span className="accent">ENVIADA.</span></h3>
                  <p>Valeu! A gente responde no e-mail que você informou.</p>
                  <button type="button" className="btn btn-ghost" onClick={() => setState('idle')}>Mandar outra</button>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <span className="eyebrow">Fale conosco</span>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="nome">Nome *</label>
                      <input id="nome" name="nome" required minLength={2} maxLength={80} value={form.nome} onChange={update} placeholder="Seu nome" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">E-mail *</label>
                      <input id="email" name="email" type="email" required maxLength={160} value={form.email} onChange={update} placeholder="voce@exemplo.com" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="assunto">Assunto</label>
                    <select id="assunto" name="assunto" value={form.assunto} onChange={update}>
                      {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="mensagem">Mensagem *</label>
                    <textarea id="mensagem" name="mensagem" required minLength={10} maxLength={3000} rows={6} value={form.mensagem} onChange={update} placeholder="Conta pra gente..." />
                  </div>
                  {/* Armadilha pra robô: pessoa não vê nem preenche */}
                  <input className="contact-hp" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={update} aria-hidden="true" />
                  {state === 'error' && <p className="form-error" style={{ marginBottom: 14 }}>{error}</p>}
                  <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={state === 'sending'}>
                    {state === 'sending' ? 'Enviando...' : <>Enviar mensagem <PixelIcon name="arrow" /></>}
                  </button>
                </form>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="reveal reveal-delay-1">
              <div className="contact-channels">
                {CONTACT_LINKS.map((c) => (
                  <a key={c.label} href={c.href} className="contact-channel" target="_blank" rel="noopener noreferrer">
                    <span className="contact-channel-label">{c.label}</span>
                    <span className="contact-channel-value">{c.value}</span>
                    <span className="contact-channel-arrow"><PixelIcon name="arrow" /></span>
                  </a>
                ))}
              </div>
              <div className="contact-note">
                <span className="eyebrow">Peças personalizadas</span>
                <p>
                  Tem uma ideia de estampa? A gente pode criar uma peça exclusiva pra você. Escolhe "Peça
                  personalizada" no assunto e explica o conceito — avaliamos caso a caso.
                </p>
                <p style={{ marginTop: '12px', fontSize: '1rem' }}>Prazo adicional para desenvolvimento.</p>
              </div>
              <div className="contact-note contact-note--accent">
                <p className="contact-quote">
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
