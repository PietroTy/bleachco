import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import PixelIcon from './PixelIcon';

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQty } = useApp();

  useEffect(() => {
    if (cartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [cartOpen]);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  const fmtPrice = (value) => {
    return 'R$ ' + value.toFixed(2).replace('.', ',');
  };

  return (
    <>
      <div
        id="cart-overlay"
        className={cartOpen ? 'open' : ''}
        onClick={() => setCartOpen(false)}
      />
      <aside id="cart-drawer" className={cartOpen ? 'open' : ''}>
        <div className="cart-header">
          <h3>CARRINHO</h3>
          <button className="cart-close-btn" onClick={() => setCartOpen(false)}>
            <PixelIcon name="close" />
          </button>
        </div>
        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <p>
                Nenhuma peça ainda.
                <br />
                <Link to="/produtos" style={{ color: 'var(--orange)' }} onClick={() => setCartOpen(false)}>
                  Ver estampas <PixelIcon name="arrow" />
                </Link>
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div className="cart-item" key={`${item.id}-${item.size}`}>
                <div
                  className="cart-item-img"
                  dangerouslySetInnerHTML={{ __html: item.svgThumb }}
                />
                <div className="cart-item-details">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-size">Tamanho {item.size}</div>
                  <div className="cart-item-row">
                    <span className="cart-item-price">
                      {fmtPrice(item.price * item.qty)}
                    </span>
                    <div className="cart-qty-ctrl">
                      <button
                        className="qty-btn qty-down"
                        onClick={() => updateQty(item.id, item.size, -1)}
                        aria-label="Diminuir"
                      >
                        −
                      </button>
                      <span className="qty-num">{item.qty}</span>
                      <button
                        className="qty-btn qty-up"
                        onClick={() => updateQty(item.id, item.size, 1)}
                        aria-label="Aumentar"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="cart-footer">
          <div className="cart-handmade-note">
            Cada peça é feita à mão após o pedido. Prazo: 5–10 dias úteis.
          </div>
          <div className="cart-total-row">
            <span className="cart-total-label">Total</span>
            <span className="cart-total-value">{fmtPrice(subtotal)}</span>
          </div>
          <Link
            to="/checkout"
            className={`btn btn-primary btn-full ${cart.length === 0 ? 'disabled' : ''}`}
            onClick={(e) => {
              if (cart.length === 0) {
                e.preventDefault();
              } else {
                setCartOpen(false);
              }
            }}
          >
            Finalizar pedido <PixelIcon name="arrow" />
          </Link>
        </div>
      </aside>
    </>
  );
}
