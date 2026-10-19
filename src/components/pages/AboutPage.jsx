import DropTimelapse from '../../art/DropTimelapse';

export default function AboutPage() {
  return (
    <>
      {/* HERO PARALLAX */}
      <section className="product-hero parallax-section" style={{ minHeight: '70vh', position: 'relative', overflow: 'hidden' }} aria-label="Sobre">
        <DropTimelapse className="about-drop" />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1180px', margin: '0 auto', padding: '160px 28px 80px', width: '100%' }}>
          <span className="eyebrow reveal">Quem somos</span>
          <h1 className="reveal reveal-delay-1">
            NASCEMOS
            <br />
            <span className="accent">DA MANCHA.</span>
          </h1>
          <p style={{ maxWidth: '480px', marginTop: '20px' }} className="reveal reveal-delay-2">
            Um respingo numa camiseta preta. Foi assim que começou.
          </p>
        </div>
      </section>

      {/* HISTÓRIA */}
      <section className="about-section" data-stain="0.93,0.15,0.9 0.05,0.6,0.7">
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
                Caiu água sanitária numa camiseta preta e, em vez de estragar, desenhou. Ali ficou claro: alvejante não é produto de limpeza. É tinta.
              </p>
              <p>
                A bleach.co é pequena de propósito. Nada de molde, nada de estoque parado: cada peça é feita à mão, em São Paulo, depois que o seu pedido é confirmado.
              </p>
            </div>
            <div className="reveal reveal-delay-1">
              <div className="values-list">
                {[
                  'Cada peça é única, nem a gente consegue repetir',
                  'Feita à mão, sem linha de montagem',
                  'Algodão 100%, fornecedor nacional',
                  'Sem estoque: a gente produz depois do pedido',
                  'Você recebe a foto da sua peça antes do envio',
                  'Processo e prazo às claras',
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
              <p>Algodão preto 180g/m². Quanto mais escuro o fundo, mais a mancha aparece.</p>
            </div>
            <div className="processo-step reveal reveal-delay-1">
              <div className="step-num">02</div>
              <h3>Técnica manual</h3>
              <p>Spray, pingo ou imersão. Tudo à mão, e cada peça reage de um jeito.</p>
            </div>
            <div className="processo-step reveal reveal-delay-2">
              <div className="step-num">03</div>
              <h3>Cura e Lavagem</h3>
              <p>A gente neutraliza o alvejante e lava a peça, pra mancha ficar e o tecido durar.</p>
            </div>
            <div className="processo-step reveal reveal-delay-3">
              <div className="step-num">04</div>
              <h3>Envio Seguro</h3>
              <p>Vai por transportadora, com código de rastreio.</p>
            </div>
          </div>
        </div>
      </section>


    </>
  );
}
