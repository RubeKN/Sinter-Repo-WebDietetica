(() => {
  "use strict";

  const { STORE, CATEGORIES, TAGS, PRODUCTS } = window;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const app = $("#app");

  /* ---------------- Utilidades ---------------- */
  const money = (n) => "$" + Math.round(n).toLocaleString("es-AR");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const catById = (id) => CATEGORIES.find((c) => c.id === id);
  const productById = (id) => PRODUCTS.find((p) => p.id === Number(id));
  const round10 = (n) => Math.round(n / 10) * 10;
  const variantPrice = (p, vi = 0) => round10(p.price * (p.variants[vi]?.mult ?? 1));
  const variantOld = (p, vi = 0) => (p.oldPrice ? round10(p.oldPrice * (p.variants[vi]?.mult ?? 1)) : null);
  const offPct = (p) => (p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);
  const isOffer = (p) => Boolean(p.oldPrice);
  const offers = () => PRODUCTS.filter(isOffer);
  const novedades = () => PRODUCTS.filter((p) => p.isNew);
  const tint = (p) => {
    const c = catById(p.cat)?.color || "#888";
    return `background: radial-gradient(circle at 50% 45%, ${c}33, ${c}14 60%, #f6efe2)`;
  };
  const ph = (p, cls = "") => `<div class="ph ${cls}" style="${tint(p)}" aria-hidden="true">${p.emoji}</div>`;

  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* modo privado */ }
    }
  };

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  const waLink = (text = "") => `https://wa.me/${STORE.whatsapp}${text ? "?text=" + encodeURIComponent(text) : ""}`;

  /* ---------------- Carrito ---------------- */
  const cart = {
    items: store.get("sinter_cart", []), // [{ id, v, qty }]
    save() { store.set("sinter_cart", this.items); renderCartUI(); },
    add(id, v = 0, qty = 1) {
      const p = productById(id);
      if (!p || p.stock <= 0) return;
      const found = this.items.find((i) => i.id === id && i.v === v);
      if (found) found.qty = Math.min(found.qty + qty, 99);
      else this.items.push({ id, v, qty });
      this.save();
      const btn = $("#cartBtn");
      btn.classList.remove("bump"); void btn.offsetWidth; btn.classList.add("bump");
      toast(`✓ ${p.name} (${p.variants[v].label}) agregado`);
    },
    setQty(idx, qty) {
      if (qty <= 0) this.items.splice(idx, 1);
      else this.items[idx].qty = Math.min(qty, 99);
      this.save();
    },
    clear() { this.items = []; this.save(); },
    lines() {
      return this.items
        .map((i) => ({ ...i, p: productById(i.id) }))
        .filter((l) => l.p)
        .map((l) => ({ ...l, unit: variantPrice(l.p, l.v), total: variantPrice(l.p, l.v) * l.qty }));
    },
    count() { return this.items.reduce((a, i) => a + i.qty, 0); },
    subtotal() { return this.lines().reduce((a, l) => a + l.total, 0); }
  };

  function freeShipHTML(sub) {
    const missing = STORE.freeShippingFrom - sub;
    const pct = Math.min(100, (sub / STORE.freeShippingFrom) * 100);
    return `<div class="free-ship">
      ${missing > 0
        ? `Te faltan <b>${money(missing)}</b> para tener <b>envío gratis</b> 🚚`
        : `🎉 ¡Tenés <b>envío gratis</b> en ${esc(STORE.city)}!`}
      <div class="free-ship__bar"><div style="width:${pct}%"></div></div>
    </div>`;
  }

  function renderCartUI() {
    const count = cart.count();
    const sub = cart.subtotal();
    const badge = $("#cartCount");
    badge.textContent = count;
    badge.hidden = count === 0;

    // Barra flotante
    const bar = $("#orderbar");
    const onCheckout = location.hash.startsWith("#/checkout");
    bar.hidden = count === 0 || onCheckout;
    $("#orderbarCount").textContent = `${count} ${count === 1 ? "ARTÍCULO" : "ARTÍCULOS"}`;
    $("#orderbarTotal").textContent = money(sub);

    // Drawer
    const body = $("#cartBody");
    const foot = $("#cartFoot");
    const lines = cart.lines();
    if (!lines.length) {
      body.innerHTML = `<div class="empty"><div>🧺</div><p>Tu pedido está vacío.</p><a class="btn btn--gold" href="#/productos" data-close>Ver productos</a></div>`;
      foot.innerHTML = "";
      return;
    }
    body.innerHTML = freeShipHTML(sub) + lines.map((l, idx) => `
      <div class="line">
        <a href="#/producto/${l.p.id}" data-close>${ph(l.p)}</a>
        <div>
          <div class="line__name">${esc(l.p.name)}</div>
          <div class="line__meta">${esc(l.p.variants[l.v].label)} · ${money(l.unit)} c/u</div>
          <div class="qty qty--sm" style="margin-top:6px">
            <button data-qty="${idx}" data-d="-1" aria-label="Restar">−</button>
            <input value="${l.qty}" data-qty-input="${idx}" inputmode="numeric" aria-label="Cantidad">
            <button data-qty="${idx}" data-d="1" aria-label="Sumar">+</button>
          </div>
        </div>
        <div class="line__right">
          <span>${money(l.total)}</span>
          <button class="line__remove" data-remove="${idx}">Quitar</button>
        </div>
      </div>`).join("");
    foot.innerHTML = `
      <div class="row row--total"><span>Subtotal</span><span>${money(sub)}</span></div>
      <div class="row row--green"><span>Pagando con transferencia</span><span>${money(sub * (1 - STORE.transferDiscount))}</span></div>
      <a class="btn btn--gold btn--block" href="#/checkout" data-close>Finalizar pedido</a>
      <button class="btn btn--ghost btn--block" data-close>Seguir comprando</button>`;
  }

  /* ---------------- Drawers ---------------- */
  function openDrawer(id) {
    closeDrawers();
    const d = $(id);
    d.classList.add("open");
    d.setAttribute("aria-hidden", "false");
    $("#overlay").hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeDrawers() {
    $$(".drawer").forEach((d) => { d.classList.remove("open"); d.setAttribute("aria-hidden", "true"); });
    $("#overlay").hidden = true;
    document.body.style.overflow = "";
  }

  /* ---------------- Componentes ---------------- */
  function productCard(p, kicker) {
    const off = offPct(p);
    const out = p.stock <= 0;
    const k = kicker ?? catById(p.cat)?.name ?? "";
    return `<article class="card">
      <a href="#/producto/${p.id}" class="card__img ph" style="${tint(p)}" aria-label="${esc(p.name)}">
        ${p.emoji}${p.isNew ? `<span class="badge-new">Nuevo</span>` : ""}${out ? `<span class="out">Sin stock</span>` : ""}
      </a>
      <div class="card__body">
        <span class="card__kicker ${isOffer(p) ? "" : "card__kicker--tag"}">${esc(k)}</span>
        <h3 class="card__name"><a href="#/producto/${p.id}">${esc(p.name)}</a></h3>
        <span class="card__variant">${esc(p.variants[0].label)}</span>
        <div class="card__prices">
          <div class="price-top">${off ? `<span class="off">${off}% OFF</span><span class="old">${money(p.oldPrice)}</span>` : ""}</div>
          <div class="now ${off ? "" : "now--plain"}">${money(p.price)}</div>
        </div>
        <a class="btn" href="#/producto/${p.id}">VER Y PEDIR ›</a>
      </div>
    </article>`;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Scroll suave ---------------- */
  const header = $("#header");
  let scrollAnim = null;

  // Animación de scroll propia (más suave y pareja que la nativa).
  function smoothScrollTo(targetY, duration = 550) {
    cancelAnimationFrame(scrollAnim);
    const startY = window.scrollY;
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    const endY = Math.max(0, Math.min(targetY, maxY));
    const dist = endY - startY;
    if (Math.abs(dist) < 2) return;
    if (reduceMotion) { window.scrollTo(0, endY); return; }
    // Si el recorrido es largo, saltamos cerca del destino (oculto por el fade del contenido)
    // y hacemos un deslizamiento corto: se siente suave en vez de "viajar" por toda la página.
    const GLIDE = 220;
    let from = startY;
    if (Math.abs(dist) > GLIDE * 2) {
      from = endY - Math.sign(dist) * GLIDE;
      window.scrollTo(0, from);
    }
    const d = endY - from;
    const t0 = performance.now();
    const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      window.scrollTo(0, from + d * ease(t));
      if (t < 1) scrollAnim = requestAnimationFrame(step);
    };
    scrollAnim = requestAnimationFrame(step);
  }
  // Si la persona usa la rueda o el dedo, se corta la animación.
  ["wheel", "touchstart", "keydown"].forEach((ev) => window.addEventListener(ev, () => cancelAnimationFrame(scrollAnim), { passive: true }));

  // Al bajar se oculta la fila superior del header; al volver arriba reaparece.
  const HIDE_AT = 90, SHOW_AT = 30; // histéresis para que no "tiemble"
  const headerRow = $(".header__row", header);
  // En celular el buscador vive siempre debajo de la barra de categorías (el del header se oculta).
  const isMobile = window.matchMedia("(max-width: 640px)");
  const setRowHeight = () => {
    header.style.setProperty("--row-h", headerRow.offsetHeight + "px");
    syncBarSearch();
  };
  function syncBarSearch() {
    const on = isMobile.matches || header.classList.contains("is-scrolled");
    $("#barSearchForm").setAttribute("aria-hidden", String(!on));
    $("#barSearchForm input").tabIndex = on ? 0 : -1;
  }
  function onScrollHeader() {
    const y = window.scrollY;
    const was = header.classList.contains("is-scrolled");
    const now = was ? y > SHOW_AT : y > HIDE_AT;
    if (now === was) return;
    header.classList.toggle("is-scrolled", now);
    // Si estabas escribiendo en un buscador, el foco pasa al que queda visible.
    const from = now ? $("#searchInput") : $("#barSearchForm input");
    const to = now ? $("#barSearchForm input") : $("#searchInput");
    syncBarSearch();
    if (!isMobile.matches && document.activeElement === from) { to.value = from.value; to.focus({ preventScroll: true }); }
    $$(".search__suggest").forEach((box) => { box.hidden = true; });
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  window.addEventListener("resize", setRowHeight);
  setRowHeight();

  // Lleva la vista al inicio del contenido (título de la categoría), justo debajo del header fijo.
  function scrollToContent() {
    // Al llegar, el header ya está oculto: solo queda visible la barra de categorías.
    const shift = parseFloat(getComputedStyle(header).getPropertyValue("--row-h")) || 0;
    const visible = header.offsetHeight - shift;   // lo que queda a la vista del header al bajar
    const y = app.getBoundingClientRect().top + window.scrollY - visible + 8;
    smoothScrollTo(Math.max(y, HIDE_AT + 2));
  }

  /* ---------------- Barra de categorías (por páginas) ----------------
     Nunca se muestra una categoría cortada: se calculan "páginas" con las
     categorías que entran completas y las flechas pasan de una página a otra.
     Las categorías de la página se estiran para ocupar todo el ancho. */
  function renderCatbar(active) {
    const bar = $("#catbar");
    if (bar._cat) { bar._cat.setActive(active); return; }

    const chip = (k, href, label, extra = "") =>
      `<a class="chip ${extra} ${active === k ? "active" : ""}" data-key="${k}" href="${href}">${label}</a>`;
    const chips = [chip("productos", "#/productos", "Todo"), chip("novedades", "#/novedades", "Novedades", "chip--new")]
      .concat(CATEGORIES.map((c) => chip(c.id, `#/categoria/${c.id}`, esc(c.name))))
      .concat(chip("ofertas", "#/ofertas", "Ofertas", "chip--offer"));
    bar.innerHTML = `<div class="catbar__scroller">
        <button class="catbar__arrow catbar__arrow--prev" data-dir="-1" aria-label="Ver categorías anteriores" hidden><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="M15 5l-7 7 7 7"/></svg></button>
        <div class="catbar__chips">${chips.join("")}</div>
        <button class="catbar__arrow catbar__arrow--next" data-dir="1" aria-label="Ver más categorías" hidden><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="M9 5l7 7-7 7"/></svg></button>
      </div>`;
    const scroller = $(".catbar__scroller", bar);
    const track = $(".catbar__chips", bar);
    const prev = $(".catbar__arrow--prev", bar);
    const next = $(".catbar__arrow--next", bar);
    const items = $$(".chip", track);
    let pages = [[0, items.length]];
    let page = 0;
    let lastW = 0;
    let userPaged = false;   // si la persona usó las flechas, respetamos su página al redimensionar

    // Calcula qué categorías entran completas en cada página.
    function measure() {
      items.forEach((c) => { c.hidden = false; });
      track.classList.add("is-measuring");
      const widths = items.map((c) => Math.ceil(c.getBoundingClientRect().width));
      track.classList.remove("is-measuring");
      const wasHidden = prev.hidden;
      prev.hidden = false;
      const A = prev.offsetWidth;            // ancho de una flecha
      prev.hidden = wasHidden;
      const W = scroller.clientWidth;
      pages = [];
      let start = 0;
      while (start < items.length) {
        const left = start > 0 ? A : 0;      // flecha "anterior" si no es la primera página
        const rest = widths.slice(start).reduce((x, y) => x + y, 0);
        if (rest <= W - left) { pages.push([start, items.length]); break; }
        const avail = W - left - A;          // reservamos la flecha "siguiente"
        let end = start, sum = 0;
        while (end < items.length && sum + widths[end] <= avail) { sum += widths[end]; end++; }
        if (end === start) end = start + 1;  // al menos una categoría por página
        pages.push([start, end]);
        start = end;
      }
      // La última página se completa "hacia atrás" para que no quede con pocas categorías estiradas.
      if (pages.length > 1) {
        let st = items.length, sum = 0;
        while (st > 0 && sum + widths[st - 1] <= W - A) { sum += widths[st - 1]; st--; }
        pages = pages.slice(0, -1).filter(([s0]) => s0 < st).concat([[st, items.length]]);
      }
    }

    function show(n, dir = 0) {
      page = Math.max(0, Math.min(n, pages.length - 1));
      track.scrollLeft = 0;
      const [s0, e0] = pages[page];
      items.forEach((c, i) => {
        c.hidden = i < s0 || i >= e0;
        c.classList.toggle("is-first", i === s0);
      });
      prev.hidden = page === 0;
      next.hidden = page === pages.length - 1;
      if (dir && !reduceMotion) {
        track.classList.remove("slide-next", "slide-prev");
        void track.offsetWidth;
        track.classList.add(dir > 0 ? "slide-next" : "slide-prev");
      }
    }

    const pageOf = (key) => {
      const i = items.findIndex((c) => c.dataset.key === key);
      return i < 0 ? -1 : pages.findIndex(([s0, e0]) => i >= s0 && i < e0);
    };

    function relayout() {
      const W = scroller.clientWidth;
      if (!W || W === lastW) return;
      lastW = W;
      const firstKey = items[pages[page] ? pages[page][0] : 0].dataset.key;
      measure();
      let p = pageOf(firstKey);
      const act = $(".chip.active", track);
      if (act && !userPaged) p = pageOf(act.dataset.key);
      show(Math.max(0, p));
    }

    // La lista nunca se desplaza sola (p. ej. al enfocar una categoría): así no queda nada cortado.
    track.addEventListener("scroll", () => { if (track.scrollLeft) track.scrollLeft = 0; });

    [prev, next].forEach((btn) => btn.addEventListener("click", () => {
      userPaged = true;
      show(page + Number(btn.dataset.dir), Number(btn.dataset.dir));
    }));

    // Deslizar con el dedo pasa de página
    let x0 = null;
    track.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) {
        const dir = dx < 0 ? 1 : -1;
        if ((dir > 0 && page < pages.length - 1) || (dir < 0 && page > 0)) show(page + dir, dir);
      }
    });

    // Recalcular cuando cambia el ancho (ventana o aparece el buscador en la barra)
    if ("ResizeObserver" in window) new ResizeObserver(relayout).observe(scroller);
    window.addEventListener("resize", relayout);
    // Las fuentes pueden cambiar el ancho de las categorías: medir de nuevo al cargarlas
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { lastW = 0; relayout(); });

    bar._cat = {
      setActive(key) {
        items.forEach((c) => c.classList.toggle("active", c.dataset.key === key));
        const p = pageOf(key);
        if (p >= 0 && p !== page) show(p, p > page ? 1 : -1);
      }
    };
    requestAnimationFrame(relayout);
  }

  /* ---------------- Countdown ---------------- */
  let cdTimer;
  function startCountdown() {
    clearInterval(cdTimer);
    const end = new Date(STORE.promoEndsAt).getTime();
    const tick = () => {
      const el = $("#countdown");
      if (!el) return clearInterval(cdTimer);
      let s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const d = Math.floor(s / 86400); s %= 86400;
      const h = Math.floor(s / 3600); s %= 3600;
      const m = Math.floor(s / 60); s %= 60;
      const pad = (n) => String(n).padStart(2, "0");
      el.innerHTML = [[d, "DÍAS"], [h, "HS"], [m, "MIN"], [s, "SEG"]]
        .map(([v, l]) => `<div><b>${pad(v)}</b><small>${l}</small></div>`).join("<i>:</i>");
    };
    tick();
    cdTimer = setInterval(tick, 1000);
  }

  /* ---------------- Vistas ---------------- */
  /* ---------------- Carrusel de novedades ---------------- */
  let carouselTimer = null;
  function stopCarousel() { clearInterval(carouselTimer); carouselTimer = null; }

  function carouselHTML(items) {
    const slides = items.map((p, i) => {
      const cat = catById(p.cat);
      return `<article class="slide ${i % 2 ? "slide--alt" : ""}" data-i="${i}" aria-roledescription="slide" aria-label="${i + 1} de ${items.length}">
        <div class="container slide__inner">
          <div class="slide__text">
            <span class="slide__kicker">Nuevo ingreso · ${esc(cat.name)}</span>
            <h2 class="slide__title">${esc(p.name)}</h2>
            <p class="slide__desc">${esc(p.desc)}</p>
            <div class="slide__price">
              ${p.oldPrice ? `<span class="old">${money(p.oldPrice)}</span>` : ""}
              <b class="${p.oldPrice ? "now" : ""}">${money(p.price)}</b>
              <small>${esc(p.variants[0].label)}</small>
            </div>
            <div class="slide__ctas">
              <a class="btn" href="#/producto/${p.id}">Ver producto</a>
              <a class="btn btn--ghost" href="#/novedades">Todas las novedades</a>
            </div>
          </div>
          <a class="slide__visual" href="#/producto/${p.id}" tabindex="-1" aria-hidden="true">
            <span class="slide__emoji">${p.emoji}</span>
            <span class="slide__stamp">Nuevo</span>
          </a>
        </div>
      </article>`;
    }).join("");
    return `<section class="carousel" aria-roledescription="carousel" aria-label="Novedades y nuevos ingresos">
      <div class="carousel__track" id="carTrack">${slides}</div>
      <button class="carousel__arrow carousel__arrow--prev" data-car="-1" aria-label="Novedad anterior"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"><path d="M15 5l-7 7 7 7"/></svg></button>
      <button class="carousel__arrow carousel__arrow--next" data-car="1" aria-label="Novedad siguiente"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"><path d="M9 5l7 7-7 7"/></svg></button>
      <div class="carousel__dots">${items.map((_, i) => `<button data-dot="${i}" aria-label="Ir a la novedad ${i + 1}"><span></span></button>`).join("")}</div>
    </section>`;
  }

  function initCarousel(count) {
    const root = $(".carousel");
    if (!root || count < 2) return;
    const track = $("#carTrack");
    const slides = $$(".slide", track);
    const dots = $$("[data-dot]", root);
    const DELAY = 5500;
    let idx = 0;
    const go = (n) => {
      idx = (n + count) % count;
      track.style.transform = `translateX(-${idx * 100}%)`;
      slides.forEach((sl, i) => { sl.classList.toggle("is-active", i === idx); sl.setAttribute("aria-hidden", String(i !== idx)); });
      dots.forEach((d, i) => d.classList.toggle("active", i === idx));
      // reinicia la barra de progreso del punto activo
      root.style.setProperty("--car-delay", DELAY + "ms");
      dots.forEach((d) => { const bar = $("span", d); bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; });
    };
    const play = () => { stopCarousel(); if (!reduceMotion) carouselTimer = setInterval(() => go(idx + 1), DELAY); root.classList.remove("paused"); };
    const pause = () => { stopCarousel(); root.classList.add("paused"); };
    $$("[data-car]", root).forEach((b) => b.addEventListener("click", () => { go(idx + Number(b.dataset.car)); play(); }));
    dots.forEach((d) => d.addEventListener("click", () => { go(Number(d.dataset.dot)); play(); }));
    root.addEventListener("mouseenter", pause);
    root.addEventListener("mouseleave", play);
    root.addEventListener("focusin", pause);
    root.addEventListener("focusout", play);
    // Deslizar con el dedo
    let x0 = null;
    root.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; pause(); }, { passive: true });
    root.addEventListener("touchend", (e) => {
      if (x0 !== null) { const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1)); }
      x0 = null; play();
    });
    go(0);
    play();
  }

  function viewHome() {
    renderCatbar(null);
    const off = offers();
    const nuevos = novedades();
    const endDate = new Date(STORE.promoEndsAt);
    // Más vendidos: destacados sin oferta; se completa hasta 8 con otros productos con stock.
    const destacados = PRODUCTS.filter((p) => p.featured && !isOffer(p));
    const relleno = PRODUCTS.filter((p) => !p.featured && !isOffer(p) && !p.isNew && p.stock > 0);
    const masVendidos = destacados.concat(relleno).slice(0, 8);
    app.innerHTML = `
    ${carouselHTML(nuevos)}
    <div class="container">
      <div class="benefits">
        <div class="benefit"><span>🌿</span>Productos naturales</div>
        <div class="benefit"><span>📦</span>Fraccionado en el día</div>
        <div class="benefit"><span>🏷️</span>Precios justos</div>
        <div class="benefit"><span>🚚</span>Envíos a domicilio</div>
      </div>

      <section class="section">
        <div class="section__head">
          <div><span class="eyebrow">Los favoritos de nuestros clientes</span><h2>Más vendidos</h2></div>
          <a href="#/productos">Ver catálogo →</a>
        </div>
        <div class="grid">${masVendidos.slice(0, 8).map((p) => productCard(p)).join("")}</div>
      </section>

      <section class="section section--offers">
        <div class="section__head">
          <div><span class="eyebrow eyebrow--red">Selección especial · ${off.length} productos</span><h2>Ofertas de la semana</h2></div>
          <div class="countdown countdown--inline" title="Hasta el ${endDate.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })} a las 23:59 (hora argentina)">
            <span class="countdown__title">Termina en</span>
            <div class="countdown__nums" id="countdown"></div>
          </div>
        </div>
        <div class="grid">${off.slice(0, 8).map((p, i) => productCard(p, `Oferta ${i + 1} de ${off.length}`)).join("")}</div>
        <div class="section__more"><a class="btn btn--ghost" href="#/ofertas">Ver todas las ofertas →</a></div>
      </section>

      <section class="section">
        <div class="section__head"><div><span class="eyebrow">Explorá</span><h2>Comprá por categoría</h2></div><a href="#/productos">Ver todo →</a></div>
        <div class="cat-grid">${CATEGORIES.map((c) => `
          <a class="cat-tile" href="#/categoria/${c.id}">
            <div class="ph" style="background:${c.color}22">${c.emoji}</div>${esc(c.name)}
          </a>`).join("")}</div>
      </section>
    </div>`;
    initCarousel(nuevos.length);
    startCountdown();
  }

  function viewCatalog({ title, crumb, list, active, query = {} }) {
    renderCatbar(active);
    const state = {
      tags: query.tags ? query.tags.split(",").filter((t) => TAGS[t]) : [],
      stock: query.stock === "1",
      sort: query.sort || "relevancia"
    };

    app.innerHTML = `
    <div class="container"><div class="page">
      <div class="breadcrumb"><a href="#/">Inicio</a> › ${crumb}</div>
      <h1 class="page__title">${title}</h1>
      <div class="catalog">
        <aside class="filters" id="filters">
          <h4>Características</h4>
          ${Object.entries(TAGS).map(([k, v]) => `<label><input type="checkbox" value="${k}" data-tag ${state.tags.includes(k) ? "checked" : ""}> ${v}</label>`).join("")}
          <h4>Disponibilidad</h4>
          <label><input type="checkbox" id="fStock" ${state.stock ? "checked" : ""}> Solo con stock</label>
        </aside>
        <div>
          <div class="toolbar">
            <button class="btn btn--ghost btn--sm filters-toggle" id="filtersToggle">⚙ Filtros</button>
            <span id="resultCount"></span>
            <label>Ordenar:
              <select id="fSort">
                ${[["relevancia", "Destacados"], ["precio-asc", "Menor precio"], ["precio-desc", "Mayor precio"], ["nombre", "A - Z"], ["descuento", "Mayor descuento"]]
                  .map(([v, l]) => `<option value="${v}" ${state.sort === v ? "selected" : ""}>${l}</option>`).join("")}
              </select>
            </label>
          </div>
          <div class="grid" id="results"></div>
        </div>
      </div>
    </div></div>`;

    const apply = () => {
      let r = list.filter((p) => state.tags.every((t) => p.tags.includes(t)) && (!state.stock || p.stock > 0));
      const sorters = {
        "precio-asc": (a, b) => a.price - b.price,
        "precio-desc": (a, b) => b.price - a.price,
        nombre: (a, b) => a.name.localeCompare(b.name, "es"),
        descuento: (a, b) => offPct(b) - offPct(a),
        relevancia: (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.stock > 0) - (a.stock > 0)
      };
      r = [...r].sort(sorters[state.sort] || sorters.relevancia);
      $("#resultCount").textContent = `${r.length} producto${r.length === 1 ? "" : "s"}`;
      $("#results").innerHTML = r.length
        ? r.map((p) => productCard(p)).join("")
        : `<div class="empty"><div>🔎</div><p>No encontramos productos con esos filtros.</p></div>`;
    };

    $$("[data-tag]").forEach((cb) => cb.addEventListener("change", () => {
      state.tags = $$("[data-tag]:checked").map((c) => c.value); apply();
    }));
    $("#fStock").addEventListener("change", (e) => { state.stock = e.target.checked; apply(); });
    $("#fSort").addEventListener("change", (e) => { state.sort = e.target.value; apply(); });
    $("#filtersToggle").addEventListener("click", () => $("#filters").classList.toggle("open"));
    apply();
  }

  function viewProduct(id) {
    const p = productById(id);
    if (!p) return viewNotFound();
    const cat = catById(p.cat);
    renderCatbar(p.cat);
    let v = 0;
    let qty = 1;
    const out = p.stock <= 0;

    app.innerHTML = `
    <div class="container"><div class="page">
      <div class="breadcrumb"><a href="#/">Inicio</a> › <a href="#/categoria/${cat.id}">${esc(cat.name)}</a> › ${esc(p.name)}</div>
      <div class="pdp">
        ${ph(p, "pdp__img")}
        <div>
          <span class="card__kicker ${isOffer(p) ? "" : "card__kicker--tag"}">${isOffer(p) ? "Oferta de la semana" : esc(cat.name)}</span>
          <h1>${esc(p.name)}</h1>
          <div class="tags">${p.tags.map((t) => `<span class="tag">${TAGS[t]}</span>`).join("")}</div>
          <div id="pdpPrice"></div>
          <p class="pdp__desc">${esc(p.desc)}</p>
          <div class="label">Presentación</div>
          <div class="variants">${p.variants.map((x, i) => `<button class="variant ${i === 0 ? "active" : ""}" data-v="${i}">${esc(x.label)}</button>`).join("")}</div>
          ${out ? `<p class="stock-low">Sin stock por el momento. Consultanos por WhatsApp.</p>`
                : p.stock < 20 ? `<p class="stock-low">¡Quedan pocas unidades!</p>` : ""}
          <div class="pdp__buy">
            <div class="qty">
              <button id="qMinus" aria-label="Restar">−</button>
              <input id="qInput" value="1" inputmode="numeric" aria-label="Cantidad">
              <button id="qPlus" aria-label="Sumar">+</button>
            </div>
            <button class="btn btn--gold" id="addBtn" ${out ? "disabled" : ""}>Agregar al pedido</button>
          </div>
          <div class="pdp__info">
            <div>🚚 <b>Envío gratis</b> en compras desde ${money(STORE.freeShippingFrom)}. Si no, ${money(STORE.shippingCost)}.</div>
            <div>🏪 <b>Retiro sin cargo</b> en nuestro local.</div>
            <div>💬 ¿Dudas? <a href="${waLink(`Hola! Tengo una consulta sobre ${p.name}`)}" target="_blank" rel="noopener"><b>Consultanos por WhatsApp</b></a></div>
          </div>
        </div>
      </div>
      <section class="section" style="padding-inline:0">
        <div class="section__head"><h2>También te puede gustar</h2></div>
        <div class="grid">${PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id).concat(PRODUCTS.filter((x) => x.featured && x.cat !== p.cat))
          .slice(0, 4).map((x) => productCard(x)).join("")}</div>
      </section>
    </div></div>`;

    const renderPrice = () => {
      const now = variantPrice(p, v);
      const old = variantOld(p, v);
      $("#pdpPrice").innerHTML = `
        <div class="price-top" style="justify-content:flex-start;gap:10px">
          ${old ? `<span class="off">${offPct(p)}% OFF</span><span class="old" style="margin:0">${money(old)}</span>` : ""}
        </div>
        <div class="now ${old ? "" : "now--plain"}">${money(now)}</div>
        <div class="pdp__transfer">${money(now * (1 - STORE.transferDiscount))} pagando con transferencia (${STORE.transferDiscount * 100}% OFF)</div>`;
    };
    const setQty = (n) => { qty = Math.max(1, Math.min(99, n || 1)); $("#qInput").value = qty; };

    $$("[data-v]").forEach((b) => b.addEventListener("click", () => {
      v = Number(b.dataset.v);
      $$("[data-v]").forEach((x) => x.classList.toggle("active", x === b));
      renderPrice();
    }));
    $("#qMinus").addEventListener("click", () => setQty(qty - 1));
    $("#qPlus").addEventListener("click", () => setQty(qty + 1));
    $("#qInput").addEventListener("change", (e) => setQty(parseInt(e.target.value, 10)));
    $("#addBtn").addEventListener("click", () => cart.add(p.id, v, qty));
    renderPrice();
  }

  function viewCheckout() {
    renderCatbar(null);
    const lines = cart.lines();
    if (!lines.length) {
      app.innerHTML = `<div class="container"><div class="page"><div class="empty"><div>🧺</div><p>No tenés productos en tu pedido.</p><a class="btn btn--gold" href="#/productos">Ver productos</a></div></div></div>`;
      return;
    }
    const saved = store.get("sinter_customer", {});

    app.innerHTML = `
    <div class="container"><div class="page">
      <div class="breadcrumb"><a href="#/">Inicio</a> › Finalizar pedido</div>
      <h1 class="page__title">Finalizar pedido</h1>
      <form class="checkout" id="checkoutForm" novalidate>
        <div class="panel">
          <h3>Tus datos</h3>
          <div class="form-grid">
            <label class="field">Nombre y apellido<input name="name" required placeholder="Juana Pérez" value="${esc(saved.name || "")}"></label>
            <label class="field">Teléfono / WhatsApp<input name="phone" required type="tel" placeholder="249 1234567" value="${esc(saved.phone || "")}"></label>
          </div>

          <h3>Entrega</h3>
          <div class="options">
            <label class="option"><input type="radio" name="delivery" value="envio" checked>
              <span>Envío a domicilio<small>Entregamos en ${esc(STORE.city)} en 24/48 hs hábiles</small></span><span class="right" id="shipLabel"></span></label>
            <label class="option"><input type="radio" name="delivery" value="retiro">
              <span>Retiro en el local<small>Te avisamos cuando esté listo</small></span><span class="right">Gratis</span></label>
          </div>
          <div class="form-grid" id="addressFields">
            <label class="field field--full">Dirección<input name="address" placeholder="Calle, número, piso/depto" value="${esc(saved.address || "")}"></label>
            <label class="field field--full">Entre calles / referencias (opcional)<input name="ref" value="${esc(saved.ref || "")}"></label>
          </div>

          <h3>Pago</h3>
          <div class="options">
            <label class="option"><input type="radio" name="pay" value="Transferencia" checked>
              <span>Transferencia bancaria<small>${STORE.transferDiscount * 100}% de descuento</small></span></label>
            <label class="option"><input type="radio" name="pay" value="Efectivo">
              <span>Efectivo<small>Al recibir o al retirar</small></span></label>
            <label class="option"><input type="radio" name="pay" value="Mercado Pago">
              <span>Mercado Pago<small>Te enviamos el link de pago</small></span></label>
          </div>
          <label class="field field--full">Notas del pedido (opcional)<textarea name="notes" rows="3" placeholder="Ej: tocar timbre 2B, horario preferido..."></textarea></label>
        </div>

        <div class="panel">
          <h3>Resumen</h3>
          ${lines.map((l) => `<div class="summary-line"><span>${l.qty}× ${esc(l.p.name)} <small>(${esc(l.p.variants[l.v].label)})</small></span><b>${money(l.total)}</b></div>`).join("")}
          <div id="totals" style="margin-top:12px;display:grid;gap:6px"></div>
          <button class="btn btn--wa btn--block" style="margin-top:16px">Enviar pedido por WhatsApp</button>
          <p style="font-size:.8rem;color:var(--muted);text-align:center">Confirmamos stock y coordinamos la entrega por WhatsApp.</p>
        </div>
      </form>
    </div></div>`;

    const form = $("#checkoutForm");
    const calc = () => {
      const sub = cart.subtotal();
      const delivery = form.delivery.value;
      const ship = delivery === "retiro" || sub >= STORE.freeShippingFrom ? 0 : STORE.shippingCost;
      const disc = form.pay.value === "Transferencia" ? sub * STORE.transferDiscount : 0;
      return { sub, ship, disc, total: sub - disc + ship, delivery };
    };
    const renderTotals = () => {
      const t = calc();
      $("#shipLabel").textContent = t.sub >= STORE.freeShippingFrom ? "Gratis" : money(STORE.shippingCost);
      $("#addressFields").style.display = t.delivery === "envio" ? "" : "none";
      $("#totals").innerHTML = `
        <div class="row"><span>Subtotal</span><span>${money(t.sub)}</span></div>
        ${t.disc ? `<div class="row row--green"><span>Descuento transferencia</span><span>−${money(t.disc)}</span></div>` : ""}
        <div class="row"><span>Envío</span><span>${t.ship ? money(t.ship) : "Gratis"}</span></div>
        <div class="row row--total"><span>Total</span><span>${money(t.total)}</span></div>
        ${t.delivery === "envio" && t.sub < STORE.freeShippingFrom ? freeShipHTML(t.sub) : ""}`;
    };
    form.addEventListener("change", renderTotals);
    renderTotals();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const t = calc();
      const missing = [];
      if (!data.name?.trim()) missing.push("name");
      if (!/\d{6,}/.test((data.phone || "").replace(/\D/g, ""))) missing.push("phone");
      if (t.delivery === "envio" && !data.address?.trim()) missing.push("address");
      if (missing.length) {
        form[missing[0]].focus();
        return toast("Completá los datos obligatorios");
      }
      store.set("sinter_customer", { name: data.name, phone: data.phone, address: data.address, ref: data.ref });

      const orderId = "S" + Date.now().toString(36).toUpperCase().slice(-6);
      const msg = [
        `🧾 *Nuevo pedido ${orderId}*`,
        "",
        ...cart.lines().map((l) => `• ${l.qty}x ${l.p.name} (${l.p.variants[l.v].label}) — ${money(l.total)}`),
        "",
        `Subtotal: ${money(t.sub)}`,
        t.disc ? `Desc. transferencia: -${money(t.disc)}` : null,
        `Envío: ${t.ship ? money(t.ship) : "Gratis"}`,
        `*Total: ${money(t.total)}*`,
        "",
        `👤 ${data.name} · ${data.phone}`,
        t.delivery === "envio" ? `📍 Envío a: ${data.address}${data.ref ? " (" + data.ref + ")" : ""}` : "🏪 Retiro en el local",
        `💳 Pago: ${data.pay}`,
        data.notes ? `📝 ${data.notes}` : null
      ].filter((x) => x !== null).join("\n");

      window.open(waLink(msg), "_blank", "noopener");
      cart.clear();
      app.innerHTML = `<div class="container"><div class="page"><div class="success">
        <div>✅</div>
        <h1>¡Gracias, ${esc(data.name.split(" ")[0])}!</h1>
        <p>Tu pedido <b>${orderId}</b> por <b>${money(t.total)}</b> se abrió en WhatsApp. Enviá el mensaje y te confirmamos a la brevedad.</p>
        <p><a class="btn btn--wa" href="${waLink(msg)}" target="_blank" rel="noopener">Abrir WhatsApp de nuevo</a></p>
        <a class="btn btn--ghost" href="#/">Volver al inicio</a>
      </div></div></div>`;
    });
  }

  const INFO = {
    nosotros: () => `<h1>Nosotros</h1>
      <p>Somos una dietética de barrio que se volvió online. Seleccionamos frutos secos, semillas, legumbres y productos de almacén natural de productores que conocemos, y los fraccionamos en el día para que lleguen frescos a tu casa.</p>
      <p>Creemos en comer rico, simple y a precios justos.</p>`,
    "como-comprar": () => `<h1>Cómo comprar</h1>
      <ol class="steps">
        <li><b>Elegí tus productos</b><br>Navegá por categorías o usá el buscador. Elegí la presentación y la cantidad.</li>
        <li><b>Revisá tu pedido</b><br>Desde la barra inferior “Ver pedido” podés ajustar cantidades.</li>
        <li><b>Completá tus datos</b><br>Indicá si querés envío o retiro, y cómo vas a pagar.</li>
        <li><b>Enviá el pedido por WhatsApp</b><br>Te confirmamos stock, total y horario de entrega.</li>
      </ol>`,
    envios: () => `<h1>Envíos y retiro</h1>
      <p>🚚 <b>Envío a domicilio</b> en ${esc(STORE.city)}: ${money(STORE.shippingCost)}. <b>Gratis</b> en compras desde ${money(STORE.freeShippingFrom)}.</p>
      <p>🏪 <b>Retiro en el local</b> sin cargo, de lunes a sábado.</p>
      <p>Los pedidos confirmados antes de las 13 hs se entregan en el día o al siguiente día hábil.</p>`,
    faq: () => `<h1>Preguntas frecuentes</h1>
      <details open><summary>¿Los productos son sueltos o envasados?</summary><p>Fraccionamos a granel y envasamos al vacío o en bolsas con cierre en el momento.</p></details>
      <details><summary>¿Tienen productos aptos celíacos?</summary><p>Sí, los marcados como “Sin TACC” son de origen certificado. Consultá por contaminación cruzada en productos fraccionados.</p></details>
      <details><summary>¿Qué medios de pago aceptan?</summary><p>Efectivo, transferencia (con ${STORE.transferDiscount * 100}% OFF) y Mercado Pago.</p></details>
      <details><summary>¿Puedo modificar mi pedido?</summary><p>Sí, escribinos por WhatsApp antes de que salga a reparto.</p></details>`,
    contacto: () => `<h1>Contacto</h1>
      <p>📍 Av. Ejemplo 1234<br>🕘 Lunes a sábado de 9 a 13 y de 16 a 20 hs</p>
      <p><a class="btn btn--wa" href="${waLink("Hola! Quería hacer una consulta")}" target="_blank" rel="noopener">💬 Escribinos por WhatsApp</a></p>`
  };

  function viewInfo(page) {
    renderCatbar(null);
    const fn = INFO[page];
    if (!fn) return viewNotFound();
    app.innerHTML = `<div class="container"><div class="page"><div class="info">${fn()}</div></div></div>`;
  }

  function viewNotFound() {
    renderCatbar(null);
    app.innerHTML = `<div class="container"><div class="page"><div class="empty"><div>🌱</div><p>No encontramos esta página.</p><a class="btn btn--gold" href="#/">Ir al inicio</a></div></div></div>`;
  }

  /* ---------------- Router ---------------- */
  function parseHash() {
    const raw = location.hash.slice(1) || "/";
    const [path, qs = ""] = raw.split("?");
    const query = Object.fromEntries(new URLSearchParams(qs));
    return { parts: path.split("/").filter(Boolean), query };
  }

  function route() {
    const { parts, query } = parseHash();
    const [a, b] = parts;
    closeDrawers();
    $$(".search__suggest").forEach((box) => { box.hidden = true; });

    stopCarousel();
    if (!a) viewHome();
    else if (a === "productos") viewCatalog({ title: "Todos los productos", crumb: "Productos", list: PRODUCTS, active: "productos", query });
    else if (a === "novedades") viewCatalog({ title: "Novedades y nuevos ingresos", crumb: "Novedades", list: novedades(), active: "novedades", query });
    else if (a === "ofertas") viewCatalog({ title: "Ofertas de la semana", crumb: "Ofertas", list: offers(), active: "ofertas", query: { sort: "descuento", ...query } });
    else if (a === "categoria" && catById(b)) {
      const c = catById(b);
      viewCatalog({ title: `${c.emoji} ${esc(c.name)}`, crumb: esc(c.name), list: PRODUCTS.filter((p) => p.cat === c.id || (c.id === "sin-tacc" && p.tags.includes("sin-tacc"))), active: c.id, query });
    } else if (a === "buscar") {
      const q = (query.q || "").trim();
      $$(".search input").forEach((i) => { i.value = q; });
      viewCatalog({ title: `Resultados para “${esc(q)}”`, crumb: "Búsqueda", list: search(q), active: null, query });
    } else if (a === "producto") viewProduct(b);
    else if (a === "checkout") viewCheckout();
    else if (a === "info") viewInfo(b);
    else viewNotFound();

    renderCartUI();
    // Transición suave entre páginas: fade del contenido + scroll animado hacia arriba.
    app.classList.toggle("page-enter", false);
    void app.offsetWidth;
    app.classList.add("page-enter");
    // Listados (categorías, ofertas, búsqueda): ir al inicio de los productos.
    // Resto de páginas: volver arriba de todo.
    if (["productos", "ofertas", "categoria", "buscar"].includes(a)) scrollToContent();
    else smoothScrollTo(0);
    onScrollHeader();
    app.focus({ preventScroll: true });
  }

  /* ---------------- Búsqueda ---------------- */
  // (ver initSearch: hay dos buscadores, el del header y el de la barra de categorías)
  function search(q) {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return PRODUCTS;
    return PRODUCTS.filter((p) => {
      const hay = norm(`${p.name} ${catById(p.cat)?.name} ${p.tags.map((t) => TAGS[t]).join(" ")} ${p.desc}`);
      return terms.every((t) => hay.includes(t));
    });
  }

  function initSearch(form) {
    const input = $("input", form);
    const box = $(".search__suggest", form);
    let hl = -1;
    const show = () => {
      const q = input.value.trim();
      hl = -1;
      if (q.length < 2) { box.hidden = true; return; }
      const r = search(q).slice(0, 6);
      box.innerHTML = r.length
        ? r.map((p) => `<li><a href="#/producto/${p.id}">${ph(p)}<span>${esc(p.name)}</span><small>${money(p.price)}</small></a></li>`).join("")
        : `<li style="padding:10px;color:var(--muted)">Sin resultados para “${esc(q)}”</li>`;
      box.hidden = false;
    };
    input.addEventListener("input", () => {
      // Mantiene ambos buscadores con el mismo texto.
      $$(".search input").forEach((other) => { if (other !== input) other.value = input.value; });
      show();
    });
    input.addEventListener("focus", show);
    input.addEventListener("keydown", (e) => {
      const links = $$("a", box);
      if (!links.length || box.hidden) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        hl = (hl + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
        links.forEach((l, i) => l.classList.toggle("hl", i === hl));
      } else if (e.key === "Enter" && hl >= 0) {
        e.preventDefault();
        location.hash = links[hl].getAttribute("href");
      } else if (e.key === "Escape") box.hidden = true;
    });
    document.addEventListener("click", (e) => { if (!form.contains(e.target)) box.hidden = true; });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      box.hidden = true;
      input.blur();
      location.hash = q ? `#/buscar?q=${encodeURIComponent(q)}` : "#/productos";
    });
  }

  /* ---------------- Init ---------------- */
  function init() {
    // Marquesina (duplicada para loop continuo)
    const msg = `🚚 Envíos gratis en <b>${esc(STORE.city)}</b> en compras a partir de ${money(STORE.freeShippingFrom)}`;
    const extra = `💸 ${STORE.transferDiscount * 100}% OFF pagando con transferencia`;
    const items = Array.from({ length: 6 }, (_, i) => `<span>${i % 2 ? extra : msg}</span>`).join("");
    $("#marquee").innerHTML = items + items;

    $("#footerCats").innerHTML = CATEGORIES.map((c) => `<li><a href="#/categoria/${c.id}">${esc(c.name)}</a></li>`).join("");
    $("#menuList").innerHTML = `
      <a href="#/">🏠 Inicio</a>
      <a href="#/info/nosotros">🌿 Nosotros</a><a href="#/info/como-comprar">🛒 Cómo comprar</a><a href="#/info/contacto">💬 Contacto</a>
      <h5>Tienda</h5><a href="#/ofertas" class="menu-offer">🔥 Ofertas de la semana</a><a href="#/novedades">✨ Novedades</a><a href="#/productos">🛍️ Todos los productos</a>
      <h5>Ayuda</h5><a href="#/info/envios">Envíos y retiro</a><a href="#/info/faq">Preguntas frecuentes</a>`;
    $("#footerWa").href = waLink("Hola! Quería hacer una consulta");
    $("#waFloat").href = waLink("Hola! Quería hacer una consulta");
    $("#year").textContent = new Date().getFullYear();

    $("#cartBtn").addEventListener("click", () => openDrawer("#cartDrawer"));
    $("#orderbar").addEventListener("click", () => openDrawer("#cartDrawer"));
    $("#menuBtn").addEventListener("click", () => openDrawer("#menuDrawer"));
    $("#overlay").addEventListener("click", closeDrawers);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawers(); });

    // Delegación de eventos del carrito
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-close],[data-qty],[data-remove]");
      if (!t) return;
      if (t.matches("[data-close]")) closeDrawers();
      if (t.matches("[data-qty]")) {
        const idx = Number(t.dataset.qty);
        cart.setQty(idx, cart.items[idx].qty + Number(t.dataset.d));
      }
      if (t.matches("[data-remove]")) cart.setQty(Number(t.dataset.remove), 0);
    });
    document.addEventListener("change", (e) => {
      const t = e.target.closest("[data-qty-input]");
      if (t) cart.setQty(Number(t.dataset.qtyInput), parseInt(t.value, 10) || 0);
    });

    // Sincroniza carrito entre pestañas
    window.addEventListener("storage", (e) => {
      if (e.key === "sinter_cart") { cart.items = store.get("sinter_cart", []); renderCartUI(); }
    });

    initSearch($("#searchForm"));
    initSearch($("#barSearchForm"));
    window.addEventListener("hashchange", route);
    route();
  }

  init();
})();
