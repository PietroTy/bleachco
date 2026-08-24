import stainOrangeImg from '../../assets/stain_splash.png';
import stainWhiteImg from '../../assets/stain_splash_white.png';

export default function AboutPage() {
  return (
    <>
      {/* HERO PARALLAX */}
      <section className="product-hero parallax-section" style={{ minHeight: '70vh', position: 'relative', overflow: 'hidden' }} aria-label="Sobre">
        <div className="product-hero-bg parallax-bg" data-speed="0.25" aria-hidden="true">
          <img
            src={stainOrangeImg}
            alt=""
            style={{
              position: 'absolute',
              right: '-10vw',
              top: '-5vh',
              width: '55vw',
              maxWidth: '700px',
              opacity: 0.32,
              pointerEvents: 'none'
            }}
          />
          <img
            src={stainWhiteImg}
            alt=""
            style={{
              position: 'absolute',
              left: '-10vw',
              bottom: '0',
              width: '45vw',
              maxWidth: '550px',
              opacity: 0.15,
              pointerEvents: 'none'
            }}
          />
        </div>
        <div className="product-hero-overlay"></div>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1180px', margin: '0 auto', padding: '160px 28px 80px', width: '100%' }}>
          <span className="eyebrow reveal">Quem somos</span>
          <h1 className="reveal reveal-delay-1">
            NASCEMOS
            <br />
            <span className="accent">DA MANCHA.</span>
          </h1>
          <p style={{ maxWidth: '480px', marginTop: '20px' }} className="reveal reveal-delay-2">
            Uma garagem. Água sanitária. A pergunta certa.
          </p>
        </div>
      </section>

      {/* HISTÓRIA */}
      <section className="about-section">
        <div className="container">
          <div className="about-grid">
            <div className="about-text reveal">
              <span className="eyebrow">Nossa história</span>
              <h2 style={{ margin: '12px 0 28px' }}>
                De acidente
                <br />
                a identidade.
              </h2>
              <p>
                Tudo começou por acaso. Um respingo acidental de água sanitária em uma camiseta preta revelou que o alvejante não é produto de limpeza, mas sim tinta, ferramenta e arte.
              </p>
              <p>
                Criada em São Paulo, a bleach.co opera de forma intencionalmente pequena. Sem moldes ou estoque acumulado: cada peça é feita à mão e sob medida após a confirmação do seu pedido.
              </p>
            </div>
            <div className="reveal reveal-delay-1">
              <div className="values-list">
                {[
                  'Cada peça é única — impossível de replicar',
                  'Produção artesanal, sem linha de montagem',
                  'Algodão 100%, fornecedor nacional',
                  'Sem estoque — produzimos após o pedido',
                  'Foto da peça enviada antes do despacho',
                  'Transparência no processo e no prazo',
                  'A mancha é intencional. A arte, inevitável.'
                ].map((val, idx) => (
                  <div className="value-item" key={idx}>
                    <span className="value-dot"></span>
                    <span>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESSO VISUAL */}
      <section style={{ padding: '0 0 120px' }}>
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Como fazemos</span>
            <h2>
              DO TECIDO
              <br />
              À SUA PORTA.
            </h2>
          </div>
          <div className="processo-grid">
            <div className="processo-step reveal">
              <div className="step-num">01</div>
              <h3>Algodão selecionado</h3>
              <p>Algodão premium 180g/m² preto. A base ideal para o contraste.</p>
            </div>
            <div className="processo-step reveal reveal-delay-1">
              <div className="step-num">02</div>
              <h3>Técnica manual</h3>
              <p>Aplicação com spray, drip ou imersão. Arte 100% manual e imprevisível.</p>
            </div>
            <div className="processo-step reveal reveal-delay-2">
              <div className="step-num">03</div>
              <h3>Cura e Lavagem</h3>
              <p>Cura, neutralização química e lavagem especial para durabilidade.</p>
            </div>
            <div className="processo-step reveal reveal-delay-3">
              <div className="step-num">04</div>
              <h3>Envio Seguro</h3>
              <p>Envio via transportadora com rastreamento incluído.</p>
            </div>
          </div>
        </div>
      </section>


    </>
  );
}
