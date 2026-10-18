import ProductGrid from '../common/ProductGrid';

export default function ProductsPage() {
  return (
    <>
      <div className="page-header" data-stain="0.9,0.3,1.1 0.04,0.85,0.7">
        <span className="eyebrow reveal">Coleção 2025</span>
        <h1 className="reveal reveal-delay-1">
          DUAS ESTAMPAS.
          <br />
          <span className="accent">INFINITAS MANCHAS.</span>
        </h1>
        <p className="reveal reveal-delay-2">
          Camisetas feitas à mão sob encomenda. Sem estoque. Sem réplicas.
        </p>
      </div>

      <section className="products-section" style={{ paddingTop: 0 }}>
        <ProductGrid />
      </section>

      {/* AVISO HANDMADE */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--ink2)' }}>
        <div className="container--narrow" style={{ textAlign: 'center' }}>
          <span className="eyebrow reveal">Importante</span>
          <h2 className="reveal reveal-delay-1" style={{ margin: '12px 0 24px' }}>
            Sem estoque.
            <br />
            Sem pressa.
          </h2>
          <p className="reveal reveal-delay-2" style={{ maxWidth: '520px', margin: '0 auto 40px' }}>
            Cada camiseta é produzida do zero sob encomenda, garantindo uma peça verdadeiramente única.
          </p>
          <div
            style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}
            className="reveal reveal-delay-3"
          >
            <span className="tag">Produção: 5–10 dias úteis</span>
            <span className="tag">Foto antes do envio</span>
            <span className="tag">100% algodão preto</span>
            <span className="tag">Técnica artesanal</span>
          </div>
        </div>
      </section>
    </>
  );
}
