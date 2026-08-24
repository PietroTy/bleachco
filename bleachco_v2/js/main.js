/* ============================================================
   BLEACH.CO v2 — main.js
   jQuery 3.7 — cart, parallax, reveal, cursor, nav, form
   ============================================================ */
$(function () {

  /* ══════════════════════════════════════════
     CUSTOM CURSOR
  ══════════════════════════════════════════ */
  if (window.matchMedia('(pointer:fine)').matches) {
    $('body').append('<div id="cursor"></div>');
    $(document).on('mousemove', function (e) {
      $('#cursor').css({ left: e.clientX, top: e.clientY });
    });
    $(document).on('mouseenter', 'a,button,.size-btn,.thumb,.product-tile', function () {
      $('#cursor').addClass('hovered');
    });
    $(document).on('mouseleave', 'a,button,.size-btn,.thumb,.product-tile', function () {
      $('#cursor').removeClass('hovered');
    });
  }

  /* ══════════════════════════════════════════
     CART STATE (localStorage)
  ══════════════════════════════════════════ */
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('bleachco_cart') || '[]'); } catch(e) { cart = []; }

  function saveCart() {
    try { localStorage.setItem('bleachco_cart', JSON.stringify(cart)); } catch(e){}
    updateCartUI();
  }

  function updateCartUI() {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    const $c = $('#cart-count');
    if (total > 0) { $c.text(total).show(); }
    else           { $c.hide(); }
    renderCartDrawer();
  }

  function fmtPrice(n) { return 'R$ ' + n.toFixed(2).replace('.', ','); }

  function renderCartDrawer() {
    const $body = $('#cart-body');
    if (!$body.length) return;

    if (!cart.length) {
      $body.html(`<div class="cart-empty">
        <div class="cart-empty-icon">◎</div>
        <p>Nenhuma peça ainda.<br/><a href="produtos.html" style="color:var(--orange)">Ver estampas →</a></p>
      </div>`);
      $('#cart-subtotal').text('R$ 0,00');
      return;
    }

    let html = '', total = 0;
    cart.forEach((item, idx) => {
      total += item.price * item.qty;
      html += `
        <div class="cart-item" data-idx="${idx}">
          <div class="cart-item-img">${item.svgThumb || ''}</div>
          <div class="cart-item-details">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-size">Tamanho ${item.size}</div>
            <div class="cart-item-row">
              <span class="cart-item-price">${fmtPrice(item.price * item.qty)}</span>
              <div class="cart-qty-ctrl">
                <button class="qty-btn qty-down" data-idx="${idx}" aria-label="Diminuir">−</button>
                <span class="qty-num">${item.qty}</span>
                <button class="qty-btn qty-up"   data-idx="${idx}" aria-label="Aumentar">+</button>
              </div>
            </div>
          </div>
        </div>`;
    });
    $body.html(html);
    $('#cart-subtotal').text(fmtPrice(total));
  }

  function addToCart(item) {
    const key = item.id + '-' + item.size;
    const existing = cart.find(i => i.id + '-' + i.size === key);
    if (existing) { existing.qty++; }
    else          { cart.push({ ...item, qty: 1 }); }
    saveCart();
    openCart();
    showToast(`${item.name} — tam. ${item.size} adicionado ✦`);
  }

  window.bleachCart = { add: addToCart, get: () => cart };

  /* Qty controls */
  $(document).on('click', '.qty-up', function (e) {
    e.stopPropagation();
    const idx = +$(this).data('idx');
    if (cart[idx]) { cart[idx].qty++; saveCart(); }
  });
  $(document).on('click', '.qty-down', function (e) {
    e.stopPropagation();
    const idx = +$(this).data('idx');
    if (!cart[idx]) return;
    cart[idx].qty--;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    saveCart();
  });

  /* ══════════════════════════════════════════
     CART DRAWER
  ══════════════════════════════════════════ */
  function openCart()  {
    $('#cart-overlay, #cart-drawer').addClass('open');
    $('body').css('overflow','hidden');
  }
  function closeCart() {
    $('#cart-overlay, #cart-drawer').removeClass('open');
    $('body').css('overflow','');
  }

  $(document).on('click', '#nav-cart-btn, .open-cart-btn', openCart);
  $(document).on('click', '#cart-overlay, #cart-close-btn', closeCart);
  $(document).on('keydown', function(e) {
    if (e.key === 'Escape') closeCart();
  });

  /* ══════════════════════════════════════════
     PRODUCT PAGE — SIZE + ADD TO CART
  ══════════════════════════════════════════ */
  let selectedSize = null;

  $(document).on('click', '.size-btn', function () {
    $('.size-btn').removeClass('selected');
    $(this).addClass('selected');
    selectedSize = $(this).data('size');
    const $btn = $('#add-to-cart-btn');
    $btn.prop('disabled', false).text('Adicionar ao carrinho — Tam. ' + selectedSize);
  });

  $(document).on('click', '#add-to-cart-btn', function () {
    if (!selectedSize) return;
    const $pg  = $('[data-product]');
    const name = $pg.data('name') || 'Camiseta';
    const price= parseFloat($pg.data('price')) || 89;
    const id   = $pg.data('product') || 'produto';
    const thumb = $('#shirt-svg-thumb').html() || '';
    addToCart({ id, name, price, size: selectedSize, svgThumb: thumb });
  });

  /* ══════════════════════════════════════════
     CHECKOUT FORM VALIDATION
  ══════════════════════════════════════════ */
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function setErr($f, $e, msg) { $f.addClass('error'); $e.text(msg); }
  function clrErr($f, $e)      { $f.removeClass('error'); $e.text(''); }

  function validateCheckout() {
    let ok = true;
    const fields = [
      { id:'#checkout-nome',   err:'#err-checkout-nome',   msg:'Nome obrigatório.',    chk: v=>v.length>=2 },
      { id:'#checkout-email',  err:'#err-checkout-email',  msg:'E-mail inválido.',     chk: validEmail },
      { id:'#checkout-tel',    err:'#err-checkout-tel',    msg:'Telefone obrigatório.',chk: v=>v.length>=8 },
      { id:'#checkout-cep',    err:'#err-checkout-cep',    msg:'CEP obrigatório.',     chk: v=>v.replace(/\D/g,'').length===8 },
      { id:'#checkout-rua',    err:'#err-checkout-rua',    msg:'Rua obrigatória.',     chk: v=>v.length>=2 },
      { id:'#checkout-cidade', err:'#err-checkout-cidade', msg:'Cidade obrigatória.',  chk: v=>v.length>=2 },
      { id:'#checkout-estado', err:'#err-checkout-estado', msg:'Selecione o estado.',  chk: v=>v.length>0  },
    ];
    fields.forEach(f => {
      const $f = $(f.id), $e = $(f.err);
      if (!$f.length) return;
      const v = $f.val().trim();
      if (f.chk(v)) { clrErr($f,$e); }
      else          { setErr($f,$e,f.msg); ok=false; }
    });
    return ok;
  }

  $(document).on('click', '#checkout-submit', function (e) {
    e.preventDefault();
    if (!validateCheckout()) {
      // Scroll to first error
      const $first = $('.form-group input.error, .form-group select.error').first();
      if ($first.length) {
        $('html,body').animate({ scrollTop: $first.offset().top - 120 }, 400);
        $first.focus();
      }
      return;
    }
    const formData = {
      nome:   $('#checkout-nome').val().trim(),
      email:  $('#checkout-email').val().trim(),
      tel:    $('#checkout-tel').val().trim(),
      cep:    $('#checkout-cep').val().trim(),
      rua:    $('#checkout-rua').val().trim(),
      num:    $('#checkout-num').val().trim(),
      bairro: $('#checkout-bairro').val().trim(),
      cidade: $('#checkout-cidade').val().trim(),
      estado: $('#checkout-estado').val(),
      comp:   $('#checkout-comp').val().trim(),
    };
    try { sessionStorage.setItem('bleachco_order_form', JSON.stringify(formData)); } catch(e){}
    window.location.href = 'pagamento.html';
  });

  // Live validation on blur
  $(document).on('blur', '#checkout-nome',   function() { const v=$(this).val().trim(); v.length>=2?clrErr($(this),$('#err-checkout-nome')):setErr($(this),$('#err-checkout-nome'),'Nome obrigatório.'); });
  $(document).on('blur', '#checkout-email',  function() { const v=$(this).val().trim(); validEmail(v)?clrErr($(this),$('#err-checkout-email')):setErr($(this),$('#err-checkout-email'),'E-mail inválido.'); });
  $(document).on('blur', '#checkout-tel',    function() { const v=$(this).val().trim(); v.length>=8?clrErr($(this),$('#err-checkout-tel')):setErr($(this),$('#err-checkout-tel'),'Telefone obrigatório.'); });

  /* ══════════════════════════════════════════
     MERCADO PAGO — botão pagar
  ══════════════════════════════════════════ */
  $(document).on('click', '#btn-pagar', function () {
    const c = window.bleachCart ? window.bleachCart.get() : [];
    if (!c.length) { showToast('Seu carrinho está vazio.'); return; }

    const total = c.reduce((s,i)=>s+i.price*i.qty,0).toFixed(2);

    /* ── INTEGRAÇÃO MERCADO PAGO ────────────────────────────
       Em produção, substitua este bloco por uma chamada ao
       seu backend que gera a preferência e retorna o pref_id.

       Endpoint: POST /api/create-preference
       Payload: { items: cart, payer: formData }
       Resposta: { init_point: "https://mp.com/checkout/..." }

       Documentação: https://www.mercadopago.com.br/developers
    ──────────────────────────────────────────────────────── */
    const order = {
      items: c, total,
      form: (() => { try { return JSON.parse(sessionStorage.getItem('bleachco_order_form')||'{}'); } catch(e){ return {}; } })(),
      created_at: new Date().toISOString(),
      id: 'BCO-' + Date.now(),
    };
    try {
      sessionStorage.setItem('bleachco_last_order', JSON.stringify(order));
      localStorage.removeItem('bleachco_cart');
    } catch(e){}

    // DEMO: vai direto pra confirmação. Em prod: window.location.href = init_point
    window.location.href = 'confirmacao.html';
  });

  /* ══════════════════════════════════════════
     CONFIRMAÇÃO — popula dados do pedido
  ══════════════════════════════════════════ */
  if ($('#confirm-section').length) {
    let order = null;
    try { order = JSON.parse(sessionStorage.getItem('bleachco_last_order') || 'null'); } catch(e){}
    if (order) {
      $('#confirm-nome').text(order.form.nome   || 'Cliente');
      $('#confirm-email').text(order.form.email || '—');
      $('#confirm-total').text('R$ ' + parseFloat(order.total).toFixed(2).replace('.',','));
      if (order.id) $('#confirm-id').text(order.id);
      const items = (order.items||[]).map(i =>
        `<li style="font-size:.84rem;color:var(--gray);padding:9px 0;border-bottom:1px solid var(--gray-lt);">${i.name} — Tam. ${i.size} × ${i.qty} = <span style="color:var(--orange)">${fmtPrice(i.price*i.qty)}</span></li>`
      ).join('');
      $('#confirm-items').html(items);
    }
  }

  /* ══════════════════════════════════════════
     NAVBAR SCROLL + BACK TO TOP
  ══════════════════════════════════════════ */
  let lastScroll = 0;
  $(window).on('scroll.nav', function () {
    const y = $(this).scrollTop();

    // Scrolled class
    if (y > 30) { $('#navbar').addClass('scrolled'); }
    else        { $('#navbar').removeClass('scrolled'); }

    // Hide nav on scroll down, show on scroll up (only after 200px)
    if (y > 200) {
      if (y > lastScroll + 8)  { $('#navbar').css('transform','translateY(-100%)'); }
      else if (y < lastScroll - 4) { $('#navbar').css('transform','translateY(0)'); }
    } else {
      $('#navbar').css('transform','translateY(0)');
    }
    lastScroll = y;

    // Back to top
    if (y > 600) { $('#back-to-top').addClass('show'); }
    else         { $('#back-to-top').removeClass('show'); }
  }).trigger('scroll.nav');

  $('#back-to-top').on('click', function () {
    $('html,body').animate({ scrollTop:0 }, 540);
  });

  /* ══════════════════════════════════════════
     NAV MOBILE
  ══════════════════════════════════════════ */
  $('#nav-toggle').on('click', function () {
    const open = $(this).toggleClass('open').hasClass('open');
    $('#nav-links').toggleClass('open', open);
    $(this).attr('aria-expanded', open);
  });
  $(document).on('click', '#nav-links a', function () {
    $('#nav-toggle').removeClass('open').attr('aria-expanded',false);
    $('#nav-links').removeClass('open');
  });

  /* ══════════════════════════════════════════
     PARALLAX (rAF-based, butter smooth)
  ══════════════════════════════════════════ */
  let ticking = false;
  function doParallax() {
    const y = window.scrollY;
    // Hero stains
    $('.hero-stain-1').css('transform', `translateY(${y * 0.22}px)`);
    $('.hero-stain-2').css('transform', `translateY(${-y * 0.12}px)`);
    // Product hero bg
    $('.product-hero-bg').each(function () {
      const rect = $(this).closest('.product-hero')[0].getBoundingClientRect();
      $(this).css('transform', `translateY(${rect.top * 0.28}px)`);
    });
    // Manifesto bg
    $('.manifesto-parallax').each(function () {
      const rect = $(this).closest('.manifesto')[0].getBoundingClientRect();
      $(this).css('transform', `translateY(${rect.top * 0.18}px)`);
    });
    // Generic parallax-bg
    $('.parallax-bg[data-speed]').each(function () {
      const speed = parseFloat($(this).data('speed'));
      const rect  = $(this).closest('[class*="section"], section, .hero')[0];
      if (rect) {
        const r = rect.getBoundingClientRect();
        $(this).css('transform', `translateY(${r.top * speed}px)`);
      }
    });
    ticking = false;
  }

  if (!window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
    $(window).on('scroll.parallax', function () {
      if (!ticking) { requestAnimationFrame(doParallax); ticking = true; }
    });
    doParallax();
  }

  /* ══════════════════════════════════════════
     SCROLL REVEAL (IntersectionObserver)
  ══════════════════════════════════════════ */
  if ('IntersectionObserver' in window) {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          $(e.target).addClass('visible');
          ro.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => ro.observe(el));
  } else {
    // Fallback
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }

  /* ══════════════════════════════════════════
     CONTACT FORM VALIDATION
  ══════════════════════════════════════════ */
  $(document).on('submit', '#contact-form', function (e) {
    e.preventDefault();
    const nome  = $('#c-nome').val().trim();
    const email = $('#c-email').val().trim();
    const msg   = $('#c-msg').val().trim();
    let ok = true;

    if (nome.length < 2)    { $('#err-nome').text('Nome obrigatório.');    ok=false; }
    else                    { $('#err-nome').text(''); }
    if (!validEmail(email)) { $('#err-email').text('E-mail inválido.');    ok=false; }
    else                    { $('#err-email').text(''); }
    if (msg.length < 20)    { $('#err-msg').text(`Mínimo 20 caracteres (${msg.length}/20).`); ok=false; }
    else                    { $('#err-msg').text(''); }

    if (!ok) return;

    const $btn = $(this).find('[type=submit]');
    $btn.prop('disabled',true).text('Enviando…');
    setTimeout(() => {
      $(this).fadeOut(300, function () { $('#contact-success').fadeIn(400); });
    }, 800); // simulated network delay
  });

  // Char counter
  $(document).on('input', '#c-msg', function () {
    const len = $(this).val().length;
    const ok  = len >= 20;
    $('#c-char')
      .text(ok ? `${len} ✓` : `${len} / mín. 20`)
      .toggleClass('c-char-ok', ok);
  });

  // Live email feedback
  $(document).on('blur', '#c-email', function () {
    const v = $(this).val().trim();
    if (v && !validEmail(v)) { $('#err-email').text('E-mail inválido.'); }
    else { $('#err-email').text(''); }
  });

  /* ══════════════════════════════════════════
     CEP MASK
  ══════════════════════════════════════════ */
  $(document).on('input', '#checkout-cep', function () {
    let v = $(this).val().replace(/\D/g,'').slice(0,8);
    if (v.length > 5) v = v.slice(0,5) + '-' + v.slice(5);
    $(this).val(v);
  });

  /* ══════════════════════════════════════════
     TOAST
  ══════════════════════════════════════════ */
  let toastTimer;
  function showToast(msg) {
    clearTimeout(toastTimer);
    $('#toast').text(msg).addClass('show');
    toastTimer = setTimeout(() => $('#toast').removeClass('show'), 2800);
  }
  window.showToast = showToast;

  /* ══════════════════════════════════════════
     CHECKOUT & PAYMENT — populate order summary
  ══════════════════════════════════════════ */
  function populateOrderSummary(listId, totalId) {
    const $list = $(listId), $tot = $(totalId);
    if (!$list.length) return;
    if (!cart.length) {
      $list.html('<p style="color:var(--gray);font-size:.84rem;padding:14px 0">Carrinho vazio. <a href="produtos.html" style="color:var(--orange)">Ver estampas →</a></p>');
      return;
    }
    let html = '', total = 0;
    cart.forEach(item => {
      total += item.price * item.qty;
      html += `<div class="order-item">
        <div class="order-item-img">${item.svgThumb||''}</div>
        <div style="flex:1;min-width:0">
          <div class="order-item-name">${item.name}</div>
          <div class="order-item-detail">Tam. ${item.size} × ${item.qty}</div>
        </div>
        <span class="order-item-price">${fmtPrice(item.price*item.qty)}</span>
      </div>`;
    });
    $list.html(html);
    if ($tot.length) $tot.text(fmtPrice(total));
  }

  populateOrderSummary('#order-items-list', '#order-total-value');
  populateOrderSummary('#payment-items',    '#payment-total');

  /* ══════════════════════════════════════════
     INIT
  ══════════════════════════════════════════ */
  updateCartUI();
  $('#navbar').css('transition', 'background 0.4s ease, border-color 0.4s ease, transform 0.3s ease');

});
