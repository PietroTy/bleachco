import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import ProductGrid from '../common/ProductGrid';
import BleachCanvas from '../../art/BleachCanvas';
import stainOrangeImg from '../../assets/stain_splash.png';
import bottleSplashImg from '../../assets/stain_bottle_splash.png';

const Skeleton3D = lazy(() => import('../../art/Skeleton3D'));

export default function HomePage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="hero" aria-label="Início">
        <div className="hero-bg">
          <div className="hero-stain hero-stain-1"></div>
          <div className="hero-stain hero-stain-2"></div>
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <p className="eyebrow reveal">Feito à mão — São Paulo</p>
            <h1 className="reveal reveal-delay-1">
              A MANCHA
              <br />
              <span className="accent">É A ARTE.</span>
            </h1>
            <p className="hero-sub reveal reveal-delay-2">
              Camisetas artesanais alvejadas à mão. Cada peça é única e irrepetível.
            </p>
            <div className="hero-cta reveal reveal-delay-3">
              <Link to="/produtos" className="btn btn-primary btn-lg">
                Ver estampas
              </Link>
              <Link to="/sobre" className="btn btn-ghost btn-lg">
                Como fazemos
              </Link>
            </div>
          </div>
          {(() => {
            const bottle = <img src={bottleSplashImg} alt="" className="hero-art" aria-hidden="true" />;
            return (
              <div className="hero-3d reveal reveal-delay-2">
                <Suspense fallback={bottle}><Skeleton3D fallback={bottle} /></Suspense>
              </div>
            );
          })()}
        </div>
        <div className="hero-scroll-hint" aria-hidden="true">
          <span>rolar</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* ── ESTAMPAS ── */}
      <section className="products-section" aria-label="Estampas">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Coleção atual</span>
            <h2>
              DUAS ESTAMPAS.
              <br />
              INFINITAS MANCHAS.
            </h2>
          </div>
        </div>
        <ProductGrid />
      </section>

      {/* ── ALVEJE VOCÊ MESMO ── */}
      <section className="bleach-section" aria-label="Alveje você mesmo">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Experimenta</span>
            <h2>ALVEJE <span className="accent">VOCÊ MESMO.</span></h2>
            <p className="section-sub">É assim que cada peça nasce: uma gota, um gesto, uma mancha que não se repete.</p>
          </div>
          <div className="reveal reveal-delay-1"><BleachCanvas /></div>
        </div>
      </section>

      {/* ── MANIFESTO / PARALLAX ── */}
      <section className="manifesto parallax-section" aria-label="Manifesto" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="manifesto-bg manifesto-parallax" data-speed="0.25" aria-hidden="true">
          <img
            src={stainOrangeImg}
            alt=""
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '55vw',
              maxWidth: '750px',
              opacity: 0.22,
              pointerEvents: 'none'
            }}
          />
        </div>
        <div className="manifesto-content">
          <p className="eyebrow reveal">Nosso manifesto</p>
          <p className="manifesto-quote reveal reveal-delay-1">
            "Água sanitária não é ferramenta de limpeza.
            <br />
            É <span className="accent">tinta</span>. É <span className="accent">voz</span>.
            <br />
            A mancha que você acha imperfeita
            <br />
            é exatamente o ponto."
          </p>
        </div>
      </section>

      {/* ── PROCESSO ── */}
      <section className="processo" aria-label="Processo de produção">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Do pedido à peça</span>
            <h2>COMO FUNCIONA.</h2>
          </div>
          <div className="processo-grid">
            <div className="processo-step reveal">
              <div className="step-num">01</div>
              <h3>Você escolhe</h3>
              <p>Selecione estampa e tamanho. Cada peça é feita sob encomenda.</p>
            </div>
            <div className="processo-step reveal reveal-delay-1">
              <div className="step-num">02</div>
              <h3>Fazemos à mão</h3>
              <p>Alvejamos o algodão preto à mão com água sanitária. Resultado único.</p>
            </div>
            <div className="processo-step reveal reveal-delay-2">
              <div className="step-num">03</div>
              <h3>Cura e lavagem</h3>
              <p>Cura, neutralização e lavagem especial para preservação do tecido.</p>
            </div>
            <div className="processo-step reveal reveal-delay-3">
              <div className="step-num">04</div>
              <h3>Enviamos</h3>
              <p>Envio seguro via transportadora com rastreamento.</p>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
