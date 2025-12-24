/* =========================================
   NJM STORE - MAIN SCRIPT (FINAL VERSION)
   ========================================= */

const CONFIG = {
    // ⚠️ تأكد أن هذا الرابط هو "Current Web App URL" من آخر تحديث (New Version)
    appScriptUrl: "https://script.google.com/macros/s/AKfycbx6-X1mYlV0eO8_ySzKii9jTEFppd6035DuMi1SqA4QkLV97lbhOHzTZQdlqz6MtQ54/exec",
    sheetUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcPUQCm3QE33oPmDbxi56uTgNeG1sxPDeURHtK0Kn0hNx5T5gIQrsCwJZByk1Ng3w7QxiXCcaPF2WS/pub?output=csv",
    heroImages: [{ l: "p6.png", r: "p7.png" }]
};

const dictionary = {
    ar: {
        dir: 'rtl', hero_title: 'اكتشفي أحدث صيحات الموضة العصرية', hero_btn: 'تسوقي الآن',
        search_ph: 'ابحث عن منتج...', add_cart: 'أضف للسلة', cart_title: 'عربة التسوق',
        clear_cart: 'حذف السلة', cart_empty: 'سلتك فارغة حالياً 👜', total: 'الإجمالي:',
        curr: 'ج.م', input_name: 'الاسم بالكامل', input_phone: 'رقم الهاتف',
        input_addr: 'العنوان بالتفصيل', input_email: 'البريد الإلكتروني (Gmail)', order_now: 'تأكيد الطلب الآن',
        order_success: 'تم إرسال الطلب بنجاح ✅', order_error: 'حدث خطأ في الاتصال ❌',
        fill_data: 'يرجى تعبئة الحقول المطلوبة', select_size: 'اختر المقاس',
        size_req: 'يرجى اختيار المقاس أولاً', filter_all: 'الكل',
        invalid_phone: 'يرجى إدخال رقم هاتف صحيح (11 رقم)',
        cats: { 'men': 'رجال', 'women': 'نساء', 'accessories': 'اكسسوارات', 'sale': 'تصفية' },
        footer_about: 'عن NJM', footer_links: 'روابط سريعة', footer_track: 'تتبع طلبك الآن', footer_policy: 'سياسة الاستبدال'
    },
    en: {
        dir: 'ltr', hero_title: 'Discover the new luxury collection', hero_btn: 'Shop Now',
        search_ph: 'Search products...', add_cart: 'Add to Bag', cart_title: 'Shopping Bag',
        clear_cart: 'Clear All', cart_empty: 'Your bag is empty 👜', total: 'Total:',
        curr: 'EGP', input_name: 'Full Name', input_phone: 'Phone Number',
        input_addr: 'Detailed Address', input_email: 'Email (Gmail)', order_now: 'Checkout Now',
        order_success: 'Order placed successfully ✅', order_error: 'Something went wrong ❌',
        fill_data: 'Please fill required fields', select_size: 'Select Size',
        size_req: 'Please select a size first', filter_all: 'All',
        invalid_phone: 'Please enter a valid phone number',
        cats: { 'men': 'Men', 'women': 'Women', 'accessories': 'Accessories', 'sale': 'Sale' },
        footer_about: 'About NJM', footer_links: 'Quick Links', footer_track: 'Track Your Order Now', footer_policy: 'Return Policy'
    }
};

let curLang = localStorage.getItem('njm_lang') || 'ar';
const state = { products: [], cart: JSON.parse(localStorage.getItem('njm_cart')) || [], filter: 'all', searchTerm: '' };
const el = { grid: document.getElementById('productsGrid'), badge: document.getElementById('cartBadge'), filterBox: document.getElementById('filterContainer'), totalPrice: document.getElementById('totalPrice'), checkoutBtn: document.getElementById('checkoutBtn') };

// =========================================
// 🚀 1. التشغيل عند التحميل
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    // استعادة وضع الليل أو النهار
    const savedTheme = localStorage.getItem('njm_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const themeBtn = document.getElementById('themeBtn');
        if (themeBtn) themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    applyLanguage(curLang);
    initHero();
    fetchData();
    setupEvents();
    updateCart();
    loadUser();
    setupMobileSwipe();
});

async function fetchData() {
    el.grid.innerHTML = Array(4).fill(`
        <div class="skeleton-card">
            <div class="skeleton skeleton-img"></div>
            <div class="skeleton-details">
                <div class="skeleton skeleton-line sm"></div>
                <div class="skeleton skeleton-line"></div>
                <div class="skeleton skeleton-line price"></div>
            </div>
        </div>
    `).join('');
    try {
        const res = await fetch(CONFIG.sheetUrl);
        if (!res.ok) throw new Error("Net");
        const text = await res.text();
        state.products = parseCSV(text);
        initFilters();
        renderProducts();
    } catch (e) {
        el.grid.innerHTML = '<p style="text-align:center;padding:50px">Error loading data.</p>';
    }
}

function parseCSV(text) {
    const rows = text.split(/\r?\n/).filter(r => r.trim());
    // (افتراض أن ملف ال CSV سليم)
    const idx = { id: 0, name: 1, price: 2, cat: 3, img: 4, sale: 5, badge: 6, sizes: 7, desc: 8 };
    const reg = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/; // Split by comma ignoring quotes

    return rows.slice(1).map((r, i) => {
        const c = r.split(reg).map(x => x.replace(/^"|"$/g, '').trim());
        const p = parseFloat(c[idx.price]) || 0;
        const s = parseFloat(c[idx.sale]) || 0;
        const isSale = s > 0 && s < p;

        let rc = (c[idx.cat] || '').toLowerCase(), ck = 'general';
        if (rc.includes('men') || rc.includes('رجال')) ck = 'men';
        else if (rc.includes('women') || rc.includes('نساء')) ck = 'women';
        else if (rc.includes('access')) ck = 'accessories';
        else if (rc.includes('sale')) ck = 'sale';

        const rawImgs = c[idx.img] || '';
        const imgs = rawImgs.split(',').map(s => s.trim()).filter(s => s);

        return {
            id: idx.id > -1 ? c[idx.id] : i,
            name: c[idx.name],
            price: p,
            sale: isSale ? s : null,
            final: isSale ? s : p,
            catKey: ck,
            imgs: imgs,
            img: imgs[0] || 'https://via.placeholder.com/400x500?text=No+Image',
            badge: c[idx.badge] || (isSale ? 'Sale' : ''),
            sizes: (c[idx.sizes] || '').split(',').map(s => s.trim()).filter(s => s),
            desc: c[idx.desc] || (curLang === 'ar' ? 'جودة عالية وتصميم عصري' : 'High quality and modern design')
        };
    }).reverse();
}

function renderProducts() {
    const t = dictionary[curLang];
    const list = state.products.filter(p => {
        const matchCat = state.filter === 'all' || p.catKey === state.filter;
        const matchSearch = p.name.toLowerCase().includes(state.searchTerm.toLowerCase());
        return matchCat && matchSearch;
    });

    if (!list.length) {
        document.getElementById('noResults').style.display = 'block';
        document.getElementById('searchCount').innerText = '';
        el.grid.innerHTML = '';
        return;
    }

    document.getElementById('noResults').style.display = 'none';
    document.getElementById('searchCount').innerText = curLang === 'ar' ? `تم العثور على ${list.length} منتج` : `Found ${list.length} products`;

    el.grid.innerHTML = list.map(p => {
        let badgeHtml = '';
        if (p.badge) {
            badgeHtml = `<span class="badge ${p.badge.toLowerCase()}">${p.badge}</span>`;
        } else if (p.sale && p.price > p.final) {
            const disc = Math.round(((p.price - p.final) / p.price) * 100);
            badgeHtml = `<span class="badge discount">-${disc}%</span>`;
        }

        return `
        <article class="product-card" onclick="openProduct('${p.id}')">
            <div class="img-wrapper">
                <img id="img-${p.id}" loading="lazy" src="${p.img}" onerror="this.src='https://via.placeholder.com/400x500?text=Image'" style="transition: opacity 0.3s ease;">
                ${p.imgs.length > 1 ? `
                    <button class="slider-btn prev" onclick="slideImg(event, '${p.id}', -1)"><i class="fa-solid fa-chevron-left"></i></button>
                    <button class="slider-btn next" onclick="slideImg(event, '${p.id}', 1)"><i class="fa-solid fa-chevron-right"></i></button>
                    <div class="card-dots" id="dots-${p.id}">
                        ${p.imgs.map((_, i) => `<span class="card-dot ${i === 0 ? 'active' : ''}"></span>`).join('')}
                    </div>
                ` : ''}
                ${badgeHtml ? `<div class="badges">${badgeHtml}</div>` : ''}
            </div>
            <div class="details">
                <div class="cat">${t.cats[p.catKey] || p.catKey}</div>
                <div class="name">${p.name}</div>
                <div class="price">
                    <span>${p.final.toLocaleString()}</span> ${t.curr} 
                    ${p.sale ? `<small>${p.price.toLocaleString()}</small>` : ''}
                </div>
            </div>
        </article>`;
    }).join('');
}

// =========================================
// 🖼️ 2. معرض الصور (سلايدر + مودال)
// =========================================

// تقليب الصورة في الكارت الخارجي
window.slideImg = (e, pid, dir) => {
    e.stopPropagation();
    if (window.navigator.vibrate) window.navigator.vibrate(5);
    const p = state.products.find(x => x.id == pid);
    if (!p || p.imgs.length < 2) return;
    const imgEl = document.getElementById(`img-${pid}`);
    const dots = document.getElementById(`dots-${pid}`);

    let curIdx = p.imgs.findIndex(url => imgEl.src.includes(url));
    if (curIdx === -1) curIdx = 0;

    let nextIdx = curIdx + dir;
    if (nextIdx >= p.imgs.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = p.imgs.length - 1;

    imgEl.style.opacity = '0.3';
    setTimeout(() => {
        imgEl.src = p.imgs[nextIdx];
        imgEl.style.opacity = '1';
        if (dots) {
            dots.querySelectorAll('.card-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === nextIdx);
            });
        }
    }, 150);
};

window.openProduct = (id) => {
    const p = state.products.find(x => x.id == id);
    if (!p) return;

    window.currentModalProduct = p;
    window.currentModalImgIndex = 0;

    const mImg = document.getElementById('mImg');
    mImg.src = p.imgs && p.imgs[0] ? p.imgs[0] : p.img;
    mImg.style.opacity = '1';

    document.getElementById('mCat').innerText = dictionary[curLang].cats[p.catKey] || p.catKey;
    document.getElementById('mName').innerText = p.name;
    document.getElementById('mPrice').innerText = p.final.toLocaleString();
    document.getElementById('mDesc').innerText = p.desc;

    // إظهار قيمة التوفير إذا كان هناك خصم
    const savingsEl = document.getElementById('mSavings');
    if (p.sale && p.price > p.final) {
        const diff = p.price - p.final;
        const msg = curLang === 'ar' ? `أنت توفر ${diff.toLocaleString()} ${dictionary[curLang].curr}` : `You save ${diff.toLocaleString()} ${dictionary[curLang].curr}`;
        if (!savingsEl) {
            const s = document.createElement('div');
            s.id = 'mSavings';
            s.className = 'modal-savings';
            document.querySelector('.m-details').insertBefore(s, document.getElementById('mDesc'));
            s.innerText = msg;
        } else {
            savingsEl.style.display = 'inline-block';
            savingsEl.innerText = msg;
        }
    } else if (savingsEl) {
        savingsEl.style.display = 'none';
    }

    // أزرار التنقل والنقاط
    const prevBtn = document.getElementById('modalPrev');
    const nextBtn = document.getElementById('modalNext');
    const dotsContainer = document.getElementById('modalDots');

    if (p.imgs && p.imgs.length > 1) {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
        dotsContainer.innerHTML = p.imgs.map((_, i) =>
            `<span class="modal-dot ${i === 0 ? 'active' : ''}" onclick="goToModalImg(${i})"></span>`
        ).join('');
        dotsContainer.style.display = 'flex';
    } else {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        dotsContainer.style.display = 'none';
    }

    // المقاسات (Size Chips)
    const container = document.getElementById('mSizesContainer');
    window.selectedSize = null; // إعادة تعيين المقاس المختار
    if (p.sizes && p.sizes.length > 0) {
        container.innerHTML = `
            <div style="font-size:13px;font-weight:700;margin-bottom:8px">${dictionary[curLang].select_size}</div>
            <div class="size-chips">
                ${p.sizes.map(s => `<div class="size-chip" onclick="selectSizeChip(this, '${s}')">${s}</div>`).join('')}
            </div>`;
    } else { container.innerHTML = ''; }

    // زر الإضافة
    const btn = document.getElementById('mAddBtn');
    // إزالة أي حدث سابق لتجنب التكرار
    btn.replaceWith(btn.cloneNode(true));
    document.getElementById('mAddBtn').onclick = () => {
        if (p.sizes && p.sizes.length > 0 && !window.selectedSize) {
            toast(dictionary[curLang].size_req, 'error');
            container.classList.add('error-shake');
            setTimeout(() => container.classList.remove('error-shake'), 400);
            return;
        }
        addToCart(p, window.selectedSize);
        closeModal();
        animateFlyToCart(p.id);
    };

    document.getElementById('productModal').classList.add('open');
};

window.closeModal = () => document.getElementById('productModal').classList.remove('open');
window.closeSuccessModal = () => document.getElementById('successModal').classList.remove('active');
window.openInfoModal = () => document.getElementById('infoModal').classList.add('open');
window.closeInfoModal = () => document.getElementById('infoModal').classList.remove('open');

window.slideModalImg = (dir) => {
    const p = window.currentModalProduct;
    if (!p || !p.imgs || p.imgs.length < 2) return;
    window.currentModalImgIndex += dir;
    if (window.currentModalImgIndex >= p.imgs.length) window.currentModalImgIndex = 0;
    if (window.currentModalImgIndex < 0) window.currentModalImgIndex = p.imgs.length - 1;
    updateModalImg();
};

window.goToModalImg = (index) => {
    window.currentModalImgIndex = index;
    updateModalImg();
};

function updateModalImg() {
    const p = window.currentModalProduct;
    if (!p || !p.imgs) return;
    const imgEl = document.getElementById('mImg');
    // تأثير التلاشي الناعم
    imgEl.style.opacity = '0';
    setTimeout(() => {
        imgEl.src = p.imgs[window.currentModalImgIndex];
        imgEl.style.opacity = '1';
    }, 150);
    document.querySelectorAll('.modal-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === window.currentModalImgIndex);
    });
}

window.selectSizeChip = (el, size) => {
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    document.querySelectorAll('.size-chip').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    window.selectedSize = size;
};

function setupMobileSwipe() {
    let touchStartX = 0;
    let touchEndX = 0;
    const box = document.getElementById('modalImgBox');
    if (!box) return;
    box.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX, { passive: true });
    box.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchEndX < touchStartX - 50) slideModalImg(1);
        if (touchEndX > touchStartX + 50) slideModalImg(-1);
    }, { passive: true });
}

// =========================================
// 🛒 3. إدارة السلة والأوردر
// =========================================

function addToCart(p, size) {
    if (window.navigator.vibrate) window.navigator.vibrate(20);
    const key = size ? `${p.id}-${size}` : `${p.id}`;
    const item = state.cart.find(x => x.key == key);
    if (item) {
        if (item.qty >= 10) {
            toast(curLang === 'ar' ? 'الحد الأقصى لكل منتج هو 10 قطع' : 'Maximum 10 pieces per item', 'error');
            return;
        }
        item.qty++;
    } else {
        state.cart.push({ ...p, qty: 1, selectedSize: size, key: key });
    }
    saveCart();
    toast(dictionary[curLang].add_cart);
    document.getElementById('cartDrawer').classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

function animateFlyToCart(pid) {
    const imgEl = document.getElementById(`img-${pid}`) || document.getElementById('mImg');
    const cartIcon = document.getElementById('cartBtn');
    if (!imgEl || !cartIcon) return;

    const clone = imgEl.cloneNode();
    const rect = imgEl.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    clone.classList.add('fly-item');
    clone.style.top = rect.top + 'px';
    clone.style.left = rect.left + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';

    document.body.appendChild(clone);

    setTimeout(() => {
        clone.style.top = (cartRect.top + 10) + 'px';
        clone.style.left = (cartRect.left + 10) + 'px';
        clone.style.width = '20px';
        clone.style.height = '20px';
        clone.style.opacity = '0.4';
        clone.style.borderRadius = '50%';
    }, 50);

    setTimeout(() => {
        clone.remove();
        cartIcon.classList.add('cart-pulse');
        setTimeout(() => cartIcon.classList.remove('cart-pulse'), 500);
    }, 850);
}

function modQty(key, n) {
    const i = state.cart.find(x => x.key == key);
    if (i) {
        if (i.qty + n <= 0) {
            // انيميشن الحذف
            const itemEl = document.querySelector(`.c-item[data-key="${key}"]`);
            if (itemEl) {
                itemEl.classList.add('removing');
                setTimeout(() => {
                    state.cart = state.cart.filter(x => x.key != key);
                    saveCart();
                }, 400);
                return;
            }
        }
        if (n > 0 && i.qty >= 10) {
            toast(curLang === 'ar' ? 'الحد الأقصى لكل منتج هو 10 قطع' : 'Maximum 10 pieces per item', 'error');
            return;
        }
        i.qty += n;
        saveCart();
    }
}

function saveCart() { localStorage.setItem('njm_cart', JSON.stringify(state.cart)); updateCart(); }

function updateCart() {
    el.badge.innerText = state.cart.reduce((a, b) => a + b.qty, 0);
    const total = state.cart.reduce((a, b) => a + (b.final * b.qty), 0);
    el.totalPrice.innerText = total.toLocaleString();

    el.checkoutBtn.disabled = state.cart.length === 0;

    document.getElementById('cartItems').innerHTML = state.cart.length ? state.cart.map(x => `
        <div class="c-item" data-key="${x.key}">
            <img src="${x.img}" class="c-img">
            <div class="c-info" style="flex:1">
                <div style="font-weight:bold;font-size:14px">${x.name}</div>
                ${x.selectedSize ? `<div style="font-size:12px;color:var(--muted)">Size: ${x.selectedSize}</div>` : ''}
                <div style="font-size:13px;color:var(--muted)">${x.final.toLocaleString()} x ${x.qty}</div>
                <div class="qty-box">
                    <div class="qty-btn" onclick="modQty('${x.key}',-1)">-</div>
                    <span>${x.qty}</span>
                    <div class="qty-btn" onclick="modQty('${x.key}',1)">+</div>
                </div>
            </div>
            <div style="font-weight:bold">${(x.final * x.qty).toLocaleString()}</div>
        </div>`).join('') : `<div style="text-align:center;padding:40px;opacity:0.6">${dictionary[curLang].cart_empty}</div>`;
}

// 🎮 إدارة الأحداث (Events)
function setupEvents() {
    const overlay = document.getElementById('overlay');
    const cartDrawer = document.getElementById('cartDrawer');

    // 1. قفل السلة من المنطقة الفاضية
    overlay.onclick = () => {
        cartDrawer.classList.remove('active');
        overlay.classList.remove('active');
    };

    // فتح السلة
    document.getElementById('cartBtn').onclick = () => {
        cartDrawer.classList.add('active');
        overlay.classList.add('active');
    };

    // مسح السلة
    document.getElementById('clearCartBtn').onclick = () => {
        if (confirm(curLang === 'ar' ? 'هل أنت متأكد من مسح جميع المنتجات من السلة؟' : 'Are you sure you want to clear all items?')) {
            state.cart = [];
            saveCart();
            toast(curLang === 'ar' ? 'تم مسح السلة' : 'Cart Cleared');
        }
    };

    // تبديل اللغة والثيم
    document.getElementById('themeBtn').onclick = function () {
        const isDark = document.body.classList.toggle('dark-mode');
        this.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        localStorage.setItem('njm_theme', isDark ? 'dark' : 'light');
    };
    document.getElementById('langBtn').onclick = () => applyLanguage(curLang === 'ar' ? 'en' : 'ar');
    document.getElementById('productModal').onclick = (e) => { if (e.target === document.getElementById('productModal')) closeModal(); };

    // زر العودة للأعلى + الهيدر الزجاجي
    const btt = document.getElementById('backToTop');
    const header = document.querySelector('header');
    window.onscroll = () => {
        // العودة للأعلى
        if (window.scrollY > 400) btt.classList.add('show');
        else btt.classList.remove('show');

        // الهيدر الذكي
        if (window.scrollY > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    };
    window.scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ✨ تحسين البحث (Debounce) لمنع التهنيج عند الكتابة السريعة
    let searchTimeout;
    document.getElementById('searchInput').oninput = (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.searchTerm = e.target.value.trim();
            renderProducts();
        }, 300); // تأخير بسيط للبحث
    };

    // 💳 تأكيد الطلب
    el.checkoutBtn.onclick = function () {
        const nameInput = document.getElementById('cName');
        const phoneInput = document.getElementById('cPhone');
        const emailInput = document.getElementById('cEmail');
        const addrInput = document.getElementById('cAddr');

        const n = nameInput.value.trim();
        const p = phoneInput.value.trim();
        const eVal = emailInput.value.trim();
        const a = addrInput.value.trim();

        const t = dictionary[curLang];

        // 🔍 التحقق من تعبئة البيانات (وتحديد الحقل الناقص)
        let isValid = true;
        [nameInput, phoneInput, emailInput, addrInput].forEach(inp => {
            if (!inp.value.trim()) {
                inp.style.borderColor = 'red';
                setTimeout(() => inp.style.borderColor = '#ddd', 2000);
                isValid = false;
            }
        });

        if (!isValid) return toast(t.fill_data, 'error');

        // التحقق من صحة الهاتف المصري
        const phoneRegex = /^01[0125][0-9]{8}$/;
        if (!phoneRegex.test(p)) {
            phoneInput.style.borderColor = 'red';
            return toast(t.invalid_phone || "رقم هاتف غير صحيح", 'error');
        }

        const btn = this; const old = btn.innerHTML;
        btn.disabled = true; btn.innerText = '...';

        const details = state.cart.map(x => `${x.name} ${x.selectedSize ? '(' + x.selectedSize + ')' : ''} x${x.qty}`).join('\n');

        // إرسال الطلب (TEXT/PLAIN لتجنب CORS)
        fetch(CONFIG.appScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'placeOrder',
                name: n,
                phone: p,
                email: eVal, // ✅ إرسال الإيميل
                address: a,
                details: details,
                total: el.totalPrice.innerText
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    state.cart = [];
                    saveCart();
                    cartDrawer.classList.remove('active');
                    overlay.classList.remove('active');
                    document.getElementById('successModal').classList.add('active');
                    // ✅ حفظ البيانات (والايميل) لتسهيل الطلب القادم
                    localStorage.setItem('njm_user', JSON.stringify({ n, p, a, e: eVal }));
                } else {
                    toast(t.order_error, 'error');
                }
            })
            .catch((err) => {
                console.error(err);
                toast(t.order_error, 'error');
            })
            .finally(() => {
                btn.disabled = false;
                btn.innerHTML = old;
            });
    };
}

function applyLanguage(lang) {
    curLang = lang; localStorage.setItem('njm_lang', lang); const t = dictionary[lang];
    document.documentElement.lang = lang; document.documentElement.dir = t.dir;
    document.getElementById('langBtn').innerText = lang === 'ar' ? 'EN' : 'عربي';
    document.querySelectorAll('[data-i18n]').forEach(e => e.innerText = t[e.getAttribute('data-i18n')]);
    document.querySelectorAll('[data-i18n-placeholder]').forEach(e => e.placeholder = t[e.getAttribute('data-i18n-placeholder')]);
    initFilters(); renderProducts(); updateCart();
}

function initFilters() {
    if (!state.products.length) return;
    const cats = new Set(['men', 'women', 'accessories', 'sale']); const t = dictionary[curLang];
    let html = `<button class="filter-btn ${state.filter === 'all' ? 'active' : ''}" onclick="setFilter('all')">${t.filter_all}</button>`;
    cats.forEach(c => { if (state.products.some(p => p.catKey === c)) html += `<button class="filter-btn ${state.filter === c ? 'active' : ''}" onclick="setFilter('${c}')">${t.cats[c] || c}</button>`; });
    el.filterBox.innerHTML = html;
}
window.setFilter = (c) => { state.filter = c; initFilters(); renderProducts(); };

function initHero() { const s = CONFIG.heroImages[0]; const urlL = `url('${s.l}')`; const urlR = `url('${s.r}')`; document.getElementById('heroSec').style.backgroundImage = `${urlL}, ${urlR}`; }

function loadUser() {
    const u = JSON.parse(localStorage.getItem('njm_user'));
    if (u) {
        document.getElementById('cName').value = u.n || '';
        document.getElementById('cPhone').value = u.p || '';
        document.getElementById('cAddr').value = u.a || '';
        if (u.e && document.getElementById('cEmail')) {
            document.getElementById('cEmail').value = u.e; // ✅ استرجاع الايميل لو محفوظ
        }
    }
}

function toast(m, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;

    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
    t.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${m}</span>`;

    container.appendChild(t);

    // Trigger Reflow for animation
    t.offsetHeight;
    t.classList.add('active');

    setTimeout(() => {
        t.classList.remove('active');
        setTimeout(() => t.remove(), 400);
    }, 3000);
}
