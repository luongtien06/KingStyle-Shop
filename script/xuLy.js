'use strict';

/* ════════════════════════════════════════════════════════
   XULY.JS v3 — Dùng chung cho MỌI trang sản phẩm King Style

   Hỗ trợ 3 cấu trúc HTML:

   ── Cấu trúc A (TTnam / TTnu) ──────────────────────────
     <div class="product-card">
       <input type="radio" name="size-{id}" value="M">
       <a class="product-button"
          data-id="sp001" data-name="..." data-price="..." data-image="...">
         Thêm vào giỏ hàng
       </a>
     </div>

   ── Cấu trúc B (Giaydep) ───────────────────────────────
     <div class="product-card"
          data-id="giay-nike" data-name="..." data-price="...">
       <img src="..." class="product-image">
       <select class="product-size"><option value="39">39</option>...</select>
       <button class="product-button add-to-cart-btn">Thêm vào giỏ hàng</button>
     </div>

   ── Cấu trúc C (Phukien) ───────────────────────────────
     <div class="product-card"
          data-id="vong-bac" data-name="Vòng tay bạc" data-price="499000">
       <img src="images/Vongbac.jpg" class="product-image">
       <div class="product-info">
         <h3 class="product-title">Vòng tay bạc</h3>
         <p class="product-new">499.000₫</p>
         <a href="#" class="product-button">Thêm vào giỏ hàng</a>
       </div>
     </div>
     (Không có size — size sẽ là "Mặc định")
════════════════════════════════════════════════════════ */


/* ══ CART HELPERS ══ */
function getCart() {
    return JSON.parse(localStorage.getItem('shoppingCart') || '[]');
}
function saveCart(cart) {
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
}
function updateCartCount() {
    const el = document.getElementById('cart-item-count');
    if (el) el.textContent = getCart().reduce((n, i) => n + i.quantity, 0);
}
function addToCart(id, name, price, image, size) {
    const cart = getCart();
    const uid  = id + '_' + size;
    const item = cart.find(i => i.productId + '_' + i.selectedSize === uid);
    if (item) {
        item.quantity++;
    } else {
        cart.push({ productId: id, name, price, imageUrl: image, selectedSize: size, quantity: 1 });
    }
    saveCart(cart);
    updateCartCount();
    showToast(name, size);
}


/* ══ TOAST NOTIFICATION ══ */
function showToast(name, size) {
    let wrap = document.getElementById('_ks_toast_wrap');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = '_ks_toast_wrap';
        Object.assign(wrap.style, {
            position: 'fixed', bottom: '28px', right: '24px', zIndex: '9999',
            display: 'flex', flexDirection: 'column', gap: '10px',
            pointerEvents: 'none',
        });
        document.body.appendChild(wrap);
    }

    const noSize = !size || size === 'N/A' || size === 'Mặc định';
    const sizeText = noSize ? '' : ` — Size <b>${size}</b>`;

    const toast = document.createElement('div');
    toast.innerHTML = `<span style="font-size:1.1rem">🛒</span><span><b>${name}</b>${sizeText} đã thêm vào giỏ!</span>`;
    Object.assign(toast.style, {
        display: 'flex', alignItems: 'center', gap: '10px',
        background: '#1a1a1a', color: '#fff',
        borderLeft: '4px solid #f3c622',
        padding: '12px 18px', borderRadius: '8px',
        fontSize: '.88rem', fontFamily: "'Segoe UI', Arial, sans-serif",
        boxShadow: '0 6px 24px rgba(0,0,0,.4)',
        opacity: '0', transform: 'translateX(30px)',
        transition: 'opacity .3s ease, transform .3s ease',
        pointerEvents: 'auto', maxWidth: '320px',
    });
    wrap.appendChild(toast);

    requestAnimationFrame(() => requestAnimationFrame(() => {
        toast.style.opacity   = '1';
        toast.style.transform = 'translateX(0)';
    }));
    setTimeout(() => {
        toast.style.opacity   = '0';
        toast.style.transform = 'translateX(30px)';
        setTimeout(() => toast.remove(), 320);
    }, 3000);
}


/* ══ ĐỌC THÔNG TIN SẢN PHẨM — tự nhận biết A / B / C ══ */
function getProductInfo(btn) {
    const card = btn.closest('.product-card');
    if (!card) return null;

    /* ── Cấu trúc A: data-* trên button ── */
    if (btn.dataset.id) {
        const { id, name, price, image } = btn.dataset;
        const sizeInput = card.querySelector(`input[name="size-${id}"]:checked`);
        return {
            id,
            name,
            price: parseFloat(price) || 0,
            image,
            size: sizeInput ? sizeInput.value : 'N/A',
        };
    }

    /* ── Cấu trúc B & C: data-* trên .product-card ── */
    if (card.dataset.id) {
        const id    = card.dataset.id;
        const name  = card.dataset.name
                   || card.querySelector('.product-title')?.textContent.trim()
                   || 'Sản phẩm';
        const price = parseFloat(card.dataset.price) || 0;
        const img   = card.querySelector('.product-image, img');
        const image = img ? img.getAttribute('src') : '';

        /* B — có <select class="product-size"> */
        const sel  = card.querySelector('select.product-size');
        if (sel) return { id, name, price, image, size: sel.value };

        /* C — có <input[radio]> */
        const radio = card.querySelector(`input[name="size-${id}"]:checked`);
        if (radio) return { id, name, price, image, size: radio.value };

        /* C — không có size (phụ kiện) */
        return { id, name, price, image, size: 'Mặc định' };
    }

    /* Fallback: đọc từ DOM */
    const title = card.querySelector('.product-title')?.textContent.trim() || 'Sản phẩm';
    const img   = card.querySelector('.product-image, img');
    const priceEl = card.querySelector('.product-new, .price-current, .product-new');
    const rawPrice = priceEl?.textContent.replace(/[^\d]/g, '') || '0';
    return {
        id:    'item_' + Math.random().toString(36).slice(2, 8),
        name:  title,
        price: parseInt(rawPrice) || 0,
        image: img ? img.getAttribute('src') : '',
        size:  'Mặc định',
    };
}


/* ══ GẮN DATA-* VÀO CARD (tự động cho Phukien nếu chưa có) ══ */
function autoInjectData() {
    document.querySelectorAll('.product-card').forEach((card, i) => {
        if (card.dataset.id) return; // đã có rồi, bỏ qua

        const title    = card.querySelector('.product-title')?.textContent.trim() || '';
        const img      = card.querySelector('.product-image, img');
        const priceEl  = card.querySelector('.product-new, .price-current');
        const rawPrice = priceEl?.textContent.replace(/[^\d]/g, '') || '0';

        // Tạo id từ tên (slugify đơn giản)
        const slug = title
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            || ('item-' + i);

        card.dataset.id    = slug;
        card.dataset.name  = title;
        card.dataset.price = rawPrice;
        if (img) card.dataset.image = img.getAttribute('src');
    });
}


/* ══ CART BUTTONS ══ */
function initCartButtons() {
    document.querySelectorAll('.product-button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const info = getProductInfo(this);
            if (!info) return;
            addToCart(info.id, info.name, info.price, info.image, info.size);
            const orig = this.style.transform;
            this.style.transform = 'scale(.95)';
            setTimeout(() => { this.style.transform = orig; }, 180);
        });
    });
}


/* ══ STYLE: RADIO SIZE (cấu trúc A) ══ */
function initSizeStyles() {
    document.querySelectorAll('.product-sizes input[type="radio"]').forEach(input => {
        const label = input.nextElementSibling;
        if (!label || label.tagName !== 'LABEL') return;
        if (getComputedStyle(input).display !== 'none') {
            input.style.cssText = 'position:absolute;opacity:0;width:0;height:0;';
        }
        const paint = () => {
            const on = input.checked;
            Object.assign(label.style, {
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: '34px', height: '34px', borderRadius: '50%',
                border: `1.5px solid ${on ? '#f3c622' : '#ddd'}`,
                background: on ? '#f3c622' : 'transparent',
                color: on ? '#121212' : '#333',
                fontSize: '.78rem', fontWeight: '600', cursor: 'pointer',
                transition: 'all .2s ease', userSelect: 'none',
                boxShadow: on ? '0 0 0 3px rgba(243,198,34,.2)' : 'none',
            });
        };
        paint();
        input.addEventListener('change', () => {
            document.querySelectorAll(`input[name="${input.name}"]`).forEach(i => {
                const l = i.nextElementSibling;
                if (l?.tagName === 'LABEL') Object.assign(l.style, {
                    borderColor: '#ddd', background: 'transparent',
                    color: '#333', boxShadow: 'none',
                });
            });
            paint();
        });
        label.addEventListener('click', () => {
            input.checked = true;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
    });
}


/* ══ STYLE: SELECT SIZE (cấu trúc B) ══ */
function initSelectStyles() {
    document.querySelectorAll('select.product-size').forEach(sel => {
        Object.assign(sel.style, {
            padding: '7px 12px', borderRadius: '6px',
            border: '1.5px solid #ddd', background: '#fff',
            color: '#1a1a1a', fontSize: '.85rem', fontWeight: '600',
            cursor: 'pointer', outline: 'none',
            transition: 'border-color .2s, box-shadow .2s',
        });
        sel.addEventListener('focus',  () => { sel.style.borderColor = '#f3c622'; sel.style.boxShadow = '0 0 0 3px rgba(243,198,34,.15)'; });
        sel.addEventListener('blur',   () => { sel.style.borderColor = '#ddd';    sel.style.boxShadow = 'none'; });
    });
}


/* ══ SCROLL REVEAL ══ */
function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (!entry.isIntersecting) return;
            setTimeout(() => {
                entry.target.style.opacity   = '1';
                entry.target.style.transform = 'translateY(0)';
            }, i * 55);
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.product-card').forEach(card => {
        card.style.opacity    = '0';
        card.style.transform  = 'translateY(22px)';
        card.style.transition = 'opacity .5s ease, transform .5s ease';
        obs.observe(card);
    });
}


/* ══ SEARCH ══ */
function initSearch() {
    const input = document.querySelector('.search-box input');
    if (!input) return;
    input.addEventListener('input', function() {
        const kw = this.value.toLowerCase().trim();
        document.querySelectorAll('.product-card').forEach(card => {
            const title = (card.querySelector('.product-title')?.textContent || '').toLowerCase();
            const name  = (card.dataset.name || '').toLowerCase();
            card.style.display = (!kw || title.includes(kw) || name.includes(kw)) ? '' : 'none';
        });
    });
}


/* ══ BACK TO TOP ══ */
function initBackToTop() {
    const btn = document.createElement('button');
    btn.textContent = '↑';
    btn.title = 'Lên đầu trang';
    Object.assign(btn.style, {
        position: 'fixed', bottom: '28px', left: '24px', zIndex: '999',
        width: '42px', height: '42px', borderRadius: '50%',
        background: '#f3c622', color: '#121212', border: 'none',
        fontSize: '1.1rem', fontWeight: '900', cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(0,0,0,.2)',
        opacity: '0', transform: 'scale(.8)',
        transition: 'opacity .3s, transform .3s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    });
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        const show = window.scrollY > 300;
        btn.style.opacity       = show ? '1' : '0';
        btn.style.transform     = show ? 'scale(1)' : 'scale(.8)';
        btn.style.pointerEvents = show ? 'auto' : 'none';
    }, { passive: true });

    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}


/* ══ INIT ══ */
document.addEventListener('DOMContentLoaded', () => {
    autoInjectData();    // tự thêm data-* cho card chưa có (Phukien)
    updateCartCount();
    initSizeStyles();    // cấu trúc A
    initSelectStyles();  // cấu trúc B
    initCartButtons();   // cả 3 cấu trúc
    initScrollReveal();
    initSearch();
    initBackToTop();
});
