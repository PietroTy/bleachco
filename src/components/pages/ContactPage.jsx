import { CONTACT_LINKS } from '../../config/contact';

export default function ContactPage() {
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
          Dúvidas sobre pedidos, peças personalizadas, parcerias ou só curiosidade.
        </p>
      </div>

      <section style={{ padding: '0 0 120px' }}>
        <div className="container">
          <div className="about-grid">
            <div className="contact-channels reveal">
              {CONTACT_LINKS.length > 0 ? (
                CONTACT_LINKS.map((c) => (
                  <a key={c.label} href={c.href} className="contact-channel" target="_blank" rel="noopener noreferrer">
                    <span className="contact-channel-label">{c.label}</span>
                    <span className="contact-channel-value">{c.value}</span>
                    <span className="contact-channel-arrow">→</span>
                  </a>
                ))
              ) : (
                <p>Nossos canais de contato estão chegando. Volta daqui a pouco.</p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="reveal reveal-delay-1">
              <div className="contact-note">
                <span className="eyebrow">Peças personalizadas</span>
                <p>
                  Tem uma ideia de estampa? A gente pode criar uma peça exclusiva pra você. Chama e explica o
                  conceito — avaliamos caso a caso.
                </p>
                <p style={{ marginTop: '12px', fontSize: '.8rem' }}>Prazo adicional para desenvolvimento.</p>
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
