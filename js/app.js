(async () => {
  "use strict";

  // Los datos se leen siempre a través de la capa de datos (js/db.js)
  const CATALOG = await window.DB.loadCatalog();
  const { STORE, CATEGORIES, TAGS } = CATALOG;
  const REVIEWS = (CATALOG.REVIEWS || []).filter((r) => !r.hidden);   // las ocultas desde el panel no se muestran
  const PRODUCTS = CATALOG.PRODUCTS.filter((p) => !p.paused);   // los pausados desde el panel no se muestran
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
  // Novedades en el orden elegido en el panel (Portada)
  const novedades = () => {
    const order = STORE.heroOrder || [];
    const pos = (p) => { const i = order.indexOf(p.id); return i < 0 ? 999 + p.id : i; };
    return PRODUCTS.filter((p) => p.isNew).sort((a, b) => pos(a) - pos(b));
  };
  // Íconos de línea (sin emojis)
  const ICON = {
    leaf: (w = 20) => `<svg class="ico" width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15"/><path d="M5 19c3-4 6-6 9-8"/></svg>`,
    box: (w = 20) => `<svg class="ico" width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>`,
    tag: (w = 20) => `<svg class="ico" width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8.5" r="1.3"/></svg>`,
    truck: (w = 20) => `<svg class="ico" width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 6h11v10H2z"/><path d="M13 9h4l4 4v3h-8"/><circle cx="6" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></svg>`,
    store: (w = 20) => `<svg class="ico" width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10v10h16V10"/><path d="M3 10l2-6h14l2 6"/><path d="M3 10h18"/><path d="M10 20v-5h4v5"/></svg>`,
    chat: (w = 20) => `<svg class="ico" width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.3A8.5 8.5 0 1 1 21 12z"/></svg>`,
    basket: (w = 20) => `<svg class="ico" width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9h18l-2 11H5L3 9z"/><path d="M8 9l4-6 4 6"/></svg>`,
    search: (w = 20) => `<svg class="ico" width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
    check: (w = 20) => `<svg class="ico" width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16.5 9"/></svg>`,
    sliders: (w = 20) => `<svg class="ico" width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>`,
    sprout: (w = 20) => `<svg class="ico" width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20v-8"/><path d="M12 12C12 7 8 5 4 5c0 5 3 7 8 7z"/><path d="M12 14c0-4 3-6 8-6 0 4-3 6-8 6z"/></svg>`,
  };
  // Foto del producto si la tiene; si no, su inicial (monograma) sobre el color de la categoría.
  const mono = (p) => `<span class="mono" style="color:${catById(p.cat)?.color || "#55682a"}">${esc(p.name.charAt(0))}</span>`;
  const visual = (p, cls = "") => p.image
    ? `<img class="${cls}" src="${p.image}" alt="${esc(p.name)}" loading="lazy" decoding="async">`
    : mono(p);
  const tint = (p) => {
    if (p.image) return "background:#fff";
    const c = catById(p.cat)?.color || "#888";
    return `background: radial-gradient(circle at 50% 45%, ${c}33, ${c}14 60%, #f6efe2)`;
  };
  const ph = (p, cls = "") => `<div class="ph ${cls} ${p.image ? "has-img" : ""}" style="${tint(p)}" aria-hidden="true">${visual(p)}</div>`;

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
      store.set("sinter_bar_min", false);   // al agregar algo, la barra vuelve a aparecer
      if (found) found.qty = Math.min(found.qty + qty, 99);
      else this.items.push({ id, v, qty });
      this.save();
      const btn = $("#cartBtn");
      btn.classList.remove("bump"); void btn.offsetWidth; btn.classList.add("bump");
      toast(`${p.name} (${p.variants[v].label}) agregado al pedido`);
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
        ? `Te faltan <b>${money(missing)}</b> para tener <b>envío gratis</b>`
        : `¡Tenés <b>envío gratis</b> en ${esc(STORE.city)}!`}
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
    const onInfo = location.hash.startsWith("#/info/");   // cómo comprar, envíos, preguntas, nosotros, contacto
    const showOrder = count > 0 && !onCheckout && !onInfo;
    const minimized = store.get("sinter_bar_min", false);   // la persona la ocultó con la ×
    bar.hidden = !showOrder || minimized;
    $("#orderpill").hidden = !showOrder || !minimized;
    $("#orderpillCount").textContent = count;
    document.body.classList.toggle("has-orderbar", !bar.hidden);
    document.body.classList.toggle("has-orderpill", showOrder && minimized);
    $("#orderbarCount").textContent = `${count} ${count === 1 ? "artículo" : "artículos"}`;
    $("#orderbarTotal").textContent = money(sub);

    // Drawer
    const body = $("#cartBody");
    const foot = $("#cartFoot");
    const lines = cart.lines();
    if (!lines.length) {
      body.innerHTML = `<div class="empty"><div>${ICON.basket(40)}</div><p>Tu pedido está vacío.</p><a class="btn btn--gold" href="#/productos" data-close>Ver productos</a></div>`;
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
      <a href="#/producto/${p.id}" class="card__img ph ${p.image ? "has-img" : ""}" style="${tint(p)}" aria-label="${esc(p.name)}">
        ${visual(p)}${p.isNew ? `<span class="badge-new">Nuevo</span>` : ""}${out ? `<span class="out">Sin stock</span>` : ""}
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
  function smoothScrollTo(targetY) {
    cancelAnimationFrame(scrollAnim);
    const startY = window.scrollY;
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    const endY = Math.max(0, Math.min(targetY, maxY));
    const dist = endY - startY;
    if (Math.abs(dist) < 2) return;
    if (reduceMotion) { window.scrollTo(0, endY); return; }
    // Recorridos largos: saltamos casi hasta el destino (lo tapa el fundido del contenido)
    // y terminamos con un deslizamiento corto, en vez de "viajar" por toda la página.
    const GLIDE = 140;
    let from = startY;
    if (Math.abs(dist) > GLIDE * 1.5) {
      from = endY - Math.sign(dist) * GLIDE;
      window.scrollTo(0, from);
    }
    const d = endY - from;
    // Duración según la distancia: corta y ágil (entre 220 y 380 ms)
    const duration = Math.min(380, Math.max(220, Math.abs(d) * 1.6));
    const ease = (t) => 1 - Math.pow(1 - t, 3);   // arranca rápido y frena suave (sin tirones)
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      window.scrollTo(0, Math.round(from + d * ease(t)));
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
    const now = document.body.classList.contains("no-catbar") ? false : (was ? y > SHOW_AT : y > HIDE_AT);
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
    // Lista para el menú desplegable del celular
    const menuItems = [["productos", "#/productos", "Todo"], ["novedades", "#/novedades", "Novedades"]]
      .concat(CATEGORIES.map((c) => [c.id, `#/categoria/${c.id}`, esc(c.name)]))
      .concat([["ofertas", "#/ofertas", "Ofertas"]]);
    const labelOf = (k) => (menuItems.find((m) => m[0] === k) || [])[2] || "";
    bar.innerHTML = `<button class="catbar__toggle" type="button" aria-expanded="false" aria-controls="catMenu">
        <span class="catbar__toggle-txt">Categorías</span>
        <span class="catbar__current">${active ? labelOf(active) : ""}</span>
        <svg class="catbar__toggle-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="M5 9l7 7 7-7"/></svg>
      </button>
      <nav class="catbar__menu" id="catMenu" hidden>
        ${menuItems.map(([k, href, label]) => `<a class="catmenu__item ${k === "ofertas" ? "catmenu__item--offer" : ""} ${active === k ? "active" : ""}" data-key="${k}" href="${href}">${label}</a>`).join("")}
      </nav>
      <div class="catbar__scroller">
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

    // Abrir / cerrar el menú desplegable (celular)
    const toggle = $(".catbar__toggle", bar);
    const menu = $("#catMenu", bar);
    const setMenu = (open) => {
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      bar.classList.toggle("menu-open", open);
    };
    toggle.addEventListener("click", () => setMenu(menu.hidden));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("click", (e) => { if (!menu.hidden && !e.target.closest(".catbar__toggle, #catMenu")) setMenu(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

    bar._cat = {
      close() { setMenu(false); },
      setActive(key) {
        $(".catbar__current", bar).textContent = labelOf(key);
        $$(".catmenu__item", bar).forEach((m) => m.classList.toggle("active", m.dataset.key === key));
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
      // Primera palabra en blanco, el resto en pistacho
      const [first, ...rest] = p.name.split(" ");
      return `<article class="slide" data-i="${i}" aria-roledescription="slide" aria-label="${i + 1} de ${items.length}">
        <div class="container nv">
          <div class="nv__left">
            <div class="nv__brand"><img src="${esc(STORE.logo || "img/logo-96.png")}" width="24" height="24" alt=""> ${esc(STORE.shortName || "")} <span>· Nuevo ingreso</span></div>
            <h2 class="nv__title" style="--len:${Math.max(7, ...p.name.split(" ").map((w) => w.length))}"><span>${esc(first)}</span>${rest.length ? `<em>${esc(rest.join(" "))}</em>` : ""}</h2>
            <p class="nv__desc">${esc(p.desc)}</p>
            <div class="nv__ctas">
              <a class="nv__btn" href="#/producto/${p.id}">Ver producto</a>
              <a class="nv__link" href="#/novedades">Todas las novedades</a>
            </div>
          </div>
          <div class="nv__right">
            <a class="nv__photo" href="#/producto/${p.id}" tabindex="-1" aria-hidden="true">${p.image ? visual(p) : mono(p)}</a>
            <div class="nv__price">
              <small>${esc(cat.name)}</small>
              <b>${money(p.price)}</b>
              <span>${esc(p.variants[0].label)}${p.oldPrice ? ` · antes ${money(p.oldPrice)}` : " · Nuevo en la tienda"}</span>
            </div>
          </div>
        </div>
      </article>`;
    }).join("");
    return `<section class="carousel carousel--bold" aria-roledescription="carousel" aria-label="Novedades y nuevos ingresos">
      <div class="carousel__track" id="carTrack">${slides}</div>
      <button class="carousel__arrow carousel__arrow--prev" data-car="-1" aria-label="Novedad anterior"><svg width="44" height="20" viewBox="0 0 44 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M42 10H3M11 2 3 10l8 8"/></svg></button>
      <button class="carousel__arrow carousel__arrow--next" data-car="1" aria-label="Novedad siguiente"><svg class="arr-long" width="44" height="20" viewBox="0 0 44 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10h39M33 2l8 8-8 8"/></svg><svg class="arr-chev" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"><path d="M9 5l7 7-7 7"/></svg></button>
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
    // En celular no pasa solo: se avanza con las flechas o deslizando
    const auto = () => !reduceMotion && !isMobile.matches;
    const play = () => {
      stopCarousel();
      root.classList.toggle("no-auto", !auto());
      if (auto()) carouselTimer = setInterval(() => go(idx + 1), DELAY);
      root.classList.remove("paused");
    };
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

  /* ---------------- Comentarios de clientes ---------------- */
  function reviewsHTML() {
    if (!REVIEWS.length) return "";
    const stars = (n) => Array.from({ length: 5 }, (_, i) =>
      `<span class="rv__star ${i < n ? "on" : ""}"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3L2.8 9.5l6.4-.9z"/></svg></span>`).join("");
    const source = (r) => r.source === "google" ? "Reseña de Google" : r.source === "ejemplo" ? "Reseña de ejemplo" : esc(r.source || "");
    return `<section class="section reviews" aria-label="Comentarios de clientes">
      <h2 class="reviews__title">Lo que dicen nuestros clientes</h2>
      <div class="reviews__wrap">
        <button class="reviews__arrow reviews__arrow--prev" data-rv="-1" aria-label="Comentarios anteriores"><svg width="40" height="18" viewBox="0 0 44 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M42 10H3M11 2 3 10l8 8"/></svg></button>
        <div class="reviews__track" id="rvTrack">
          ${REVIEWS.map((r) => `<article class="rv">
            <header class="rv__head"><b>${esc(r.name)}</b><span class="rv__stars" aria-label="${r.stars} de 5 estrellas">${stars(r.stars)}</span></header>
            <h3 class="rv__title">${esc(r.title)}</h3>
            <p class="rv__text">${esc(r.text)}</p>
            <footer class="rv__src">${source(r)}</footer>
          </article>`).join("")}
        </div>
        <button class="reviews__arrow reviews__arrow--next" data-rv="1" aria-label="Más comentarios"><svg width="40" height="18" viewBox="0 0 44 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10h39M33 2l8 8-8 8"/></svg></button>
      </div>
      <div class="reviews__dots" id="rvDots"></div>
    </section>`;
  }

  function initReviews() {
    const track = $("#rvTrack");
    if (!track) return;
    const cards = $$(".rv", track);
    const dotsBox = $("#rvDots");
    const perView = () => Math.max(1, Math.round(track.clientWidth / cards[0].offsetWidth));
    const pages = () => Math.max(1, cards.length - perView() + 1);
    const current = () => Math.round(track.scrollLeft / (cards[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0)));
    const goTo = (i) => {
      const step = cards[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0);
      track.scrollTo({ left: Math.max(0, Math.min(i, pages() - 1)) * step, behavior: reduceMotion ? "auto" : "smooth" });
    };
    const renderDots = () => {
      const n = pages();
      dotsBox.innerHTML = n > 1 ? Array.from({ length: n }, (_, i) => `<button data-i="${i}" aria-label="Ir al comentario ${i + 1}"></button>`).join("") : "";
      update();
    };
    const update = () => {
      const c = current();
      $$("button", dotsBox).forEach((d, i) => d.classList.toggle("active", i === c));
      $(".reviews__arrow--prev").hidden = c <= 0;
      $(".reviews__arrow--next").hidden = c >= pages() - 1;
    };
    dotsBox.addEventListener("click", (e) => { const d = e.target.closest("[data-i]"); if (d) goTo(Number(d.dataset.i)); });
    $$("[data-rv]").forEach((b) => b.addEventListener("click", () => goTo(current() + Number(b.dataset.rv))));
    track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    window.addEventListener("resize", renderDots);
    renderDots();
  }

  /* ---------------- Filas de productos del inicio (a todo el ancho) ---------------- */
  function rowCard(p) {
    const off = offPct(p);
    const out = p.stock <= 0;
    const transfer = p.price * (1 - STORE.transferDiscount);
    return `<article class="pcard">
      <a class="pcard__img ${p.image ? "has-img" : ""}" href="#/producto/${p.id}" aria-label="${esc(p.name)}">
        ${visual(p)}
        ${off ? `<span class="pcard__badge">-${off}%</span>` : p.isNew ? `<span class="pcard__badge pcard__badge--new">Nuevo</span>` : ""}
        ${out ? `<span class="out">Sin stock</span>` : ""}
      </a>
      <h3 class="pcard__name"><a href="#/producto/${p.id}">${esc(p.name)}</a></h3>
      <span class="pcard__variant">${esc(p.variants[0].label)}</span>
      <div class="pcard__prices">
        <s class="pcard__old">${p.oldPrice ? money(p.oldPrice) : ""}</s>
        <div class="pcard__now"><b>${money(transfer)}</b> <span>transferencia</span></div>
        <div class="pcard__other">${money(p.price)} otros medios</div>
      </div>
      <a class="pcard__add" href="#/producto/${p.id}">Ver y pedir ›</a>
    </article>`;
  }

  function rowSection({ id, eyebrow, eyebrowClass = "", title, link, extra = "", list }) {
    return `<section class="prow" id="${id}">
      <div class="prow__head">
        <div><span class="eyebrow ${eyebrowClass}">${eyebrow}</span><h2>${title}</h2></div>
        <div class="prow__head-right">${extra}${link}</div>
      </div>
      <div class="prow__wrap">
        <button class="prow__arrow prow__arrow--prev" data-row="-1" aria-label="Anteriores"><svg width="36" height="16" viewBox="0 0 44 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M42 10H3M11 2 3 10l8 8"/></svg></button>
        <div class="prow__track">${list.map(rowCard).join("")}</div>
        <button class="prow__arrow prow__arrow--next" data-row="1" aria-label="Siguientes"><svg width="36" height="16" viewBox="0 0 44 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10h39M33 2l8 8-8 8"/></svg></button>
      </div>
    </section>`;
  }

  function initRows() {
    $$(".prow").forEach((row) => {
      const track = $(".prow__track", row);
      const prev = $(".prow__arrow--prev", row), next = $(".prow__arrow--next", row);
      const step = () => { const c = $(".pcard", track); return c ? c.offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0) : 300; };
      const update = () => {
        const max = track.scrollWidth - track.clientWidth;
        prev.hidden = track.scrollLeft <= 4;
        next.hidden = track.scrollLeft >= max - 4;
      };
      prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: reduceMotion ? "auto" : "smooth" }));
      next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: reduceMotion ? "auto" : "smooth" }));
      track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
      window.addEventListener("resize", update);
      update();
    });
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
        <div class="benefit"><span>${ICON.leaf()}</span>Productos naturales</div>
        <div class="benefit"><span>${ICON.box()}</span>Fraccionado en el día</div>
        <div class="benefit"><span>${ICON.tag()}</span>Precios justos</div>
        <div class="benefit"><span>${ICON.truck()}</span>Envíos a domicilio</div>
      </div>

    </div>

    ${rowSection({ id: "rowBest", eyebrow: "Los favoritos de nuestros clientes", title: "Más vendidos",
      link: `<a class="prow__link" href="#/productos">Ver catálogo →</a>`, list: masVendidos })}

    ${rowSection({ id: "rowOffers", eyebrow: `Selección especial · ${off.length} productos`, eyebrowClass: "eyebrow--red", title: "Ofertas de la semana",
      extra: STORE.showCountdown === false ? "" : `<div class="countdown countdown--inline" title="Hasta el ${endDate.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })} a las ${endDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })} (hora argentina)">
            <span class="countdown__title">Termina en</span>
            <div class="countdown__nums" id="countdown"></div>
          </div>`,
      link: `<a class="prow__link" href="#/ofertas">Ver todas →</a>`, list: off })}

    <div class="container">
      ${reviewsHTML()}
    </div>`;
    initCarousel(nuevos.length);
    initRows();
    initReviews();
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
            <button class="btn btn--ghost btn--sm filters-toggle" id="filtersToggle">${ICON.sliders(16)} Filtros</button>
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
        : `<div class="empty"><div>${ICON.search(40)}</div><p>No encontramos productos con esos filtros.</p></div>`;
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
            <div>${ICON.truck(18)} <span><b>Envío gratis</b> en compras desde ${money(STORE.freeShippingFrom)}. Si no, ${money(STORE.shippingCost)}.</span></div>
            <div>${ICON.store(18)} <span><b>Retiro sin cargo</b> en nuestro local.</span></div>
            <div>${ICON.chat(18)} <span>¿Dudas? <a href="${waLink(`Hola! Tengo una consulta sobre ${p.name}`)}" target="_blank" rel="noopener"><b>Consultanos por WhatsApp</b></a></span></div>
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
      app.innerHTML = `<div class="container"><div class="page"><div class="empty"><div>${ICON.basket(40)}</div><p>No tenés productos en tu pedido.</p><a class="btn btn--gold" href="#/productos">Ver productos</a></div></div></div>`;
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
        `*Nuevo pedido ${orderId}*`,
        "",
        ...cart.lines().map((l) => `• ${l.qty}x ${l.p.name} (${l.p.variants[l.v].label}) — ${money(l.total)}`),
        "",
        `Subtotal: ${money(t.sub)}`,
        t.disc ? `Desc. transferencia: -${money(t.disc)}` : null,
        `Envío: ${t.ship ? money(t.ship) : "Gratis"}`,
        `*Total: ${money(t.total)}*`,
        "",
        `*Cliente:* ${data.name} · ${data.phone}`,
        t.delivery === "envio" ? `*Envío a:* ${data.address}${data.ref ? " (" + data.ref + ")" : ""}` : "*Retiro en el local*",
        `*Pago:* ${data.pay}`,
        data.notes ? `*Notas:* ${data.notes}` : null
      ].filter((x) => x !== null).join("\n");

      // El pedido queda registrado para el panel de administración
      window.DB.createOrder({
        id: orderId,
        customer: { name: data.name, phone: data.phone, address: t.delivery === "envio" ? data.address : "", ref: data.ref || "" },
        delivery: t.delivery, pay: data.pay, notes: data.notes || "",
        items: cart.lines().map((l) => ({ id: l.p.id, name: l.p.name, variant: l.p.variants[l.v].label, qty: l.qty, unit: l.unit })),
        subtotal: t.sub, discount: Math.round(t.disc), shipping: t.ship, total: Math.round(t.total)
      }).catch(() => {});

      window.open(waLink(msg), "_blank", "noopener");
      cart.clear();
      app.innerHTML = `<div class="container"><div class="page"><div class="success">
        <div class="success__icon">${ICON.check(56)}</div>
        <h1>¡Gracias, ${esc(data.name.split(" ")[0])}!</h1>
        <p class="success__code">Tu código de pedido<b>${orderId}</b><span>${money(t.total)}</span></p>
        <div class="success__warn"><b>Último paso: enviá el mensaje de WhatsApp.</b>
          <span>Tu pedido queda tomado cuando nos llega ese mensaje con el código. Si WhatsApp no se abrió, tocá el botón.${Number(STORE.autoCancelHours) ? ` Los pedidos sin confirmar se cancelan a las ${Number(STORE.autoCancelHours)} h.` : ""}</span></div>
        <p><a class="btn btn--wa" href="${waLink(msg)}" target="_blank" rel="noopener">Enviar pedido por WhatsApp</a></p>
        <a class="btn btn--ghost" href="#/">Volver al inicio</a>
      </div></div></div>`;
    });
  }

  const INFO = {
    nosotros: () => `<span class="info__eyebrow">Quiénes somos</span>
      <h1>Nosotros</h1>
      <p class="info__lead">Somos una dietética de barrio que se volvió online.</p><!--body-->
      <p>Seleccionamos frutos secos, semillas, legumbres y productos de almacén natural de productores que conocemos, y los fraccionamos en el día para que lleguen frescos a tu casa.</p>
      <ul class="info-cards">
        <li><b>Naturales</b><span>Productos simples, sin vueltas.</span></li>
        <li><b>Frescos</b><span>Fraccionamos en el día.</span></li>
        <li><b>Precios justos</b><span>Comer rico no tiene que ser caro.</span></li>
      </ul>`,
    "como-comprar": () => `<span class="info__eyebrow">Paso a paso</span>
      <h1>Cómo comprar</h1>
      <p class="info__lead">Hacer tu pedido lleva un par de minutos.</p><!--body-->
      <ol class="steps">
        <li><b>Elegí tus productos</b><span>Navegá por categorías o usá el buscador. Elegí la presentación y la cantidad.</span></li>
        <li><b>Revisá tu pedido</b><span>Desde la barra inferior “Ver pedido” podés ajustar cantidades.</span></li>
        <li><b>Completá tus datos</b><span>Indicá si querés envío o retiro, y cómo vas a pagar.</span></li>
        <li><b>Enviá el pedido por WhatsApp</b><span>Te confirmamos stock, total y horario de entrega.</span></li>
      </ol>`,
    envios: () => `<span class="info__eyebrow">Entregas</span>
      <h1>Envíos y retiro</h1>
      <p class="info__lead">Elegí la opción que te quede más cómoda.</p><!--body-->
      <ul class="info-list">
        <li><span>Envío a domicilio</span><div>En ${esc(STORE.city)}: ${money(STORE.shippingCost)}.<br><b>Gratis</b> en compras desde ${money(STORE.freeShippingFrom)}.</div></li>
        <li><span>Retiro en el local</span><div>Sin cargo, de lunes a sábado.</div></li>
        <li><span>Tiempos</span><div>Los pedidos confirmados antes de las 13 hs se entregan en el día o al siguiente día hábil.</div></li>
      </ul>`,
    faq: () => `<span class="info__eyebrow">Ayuda</span>
      <h1>Preguntas frecuentes</h1>
      <p class="info__lead">Lo que más nos consultan.</p><!--body-->
      <div class="faq">
        <details open><summary>¿Los productos son sueltos o envasados?</summary><p>Fraccionamos a granel y envasamos al vacío o en bolsas con cierre en el momento.</p></details>
        <details><summary>¿Tienen productos aptos celíacos?</summary><p>Sí, los marcados como “Sin TACC” son de origen certificado. Consultá por contaminación cruzada en productos fraccionados.</p></details>
        <details><summary>¿Qué medios de pago aceptan?</summary><p>Efectivo, transferencia (con ${STORE.transferDiscount * 100}% OFF) y Mercado Pago.</p></details>
        <details><summary>¿Puedo modificar mi pedido?</summary><p>Sí, escribinos por WhatsApp antes de que salga a reparto.</p></details>
      </div>`,
    contacto: () => `<span class="info__eyebrow">Estamos para ayudarte</span>
      <h1>Contacto</h1>
      <p class="info__lead">Escribinos o pasá por el local.</p><!--body-->
      <ul class="info-list">
        <li><span>Dirección</span><div>${esc(STORE.address)}</div></li>
        <li><span>Horarios</span><div>${esc(STORE.hours)}</div></li>
        <li><span>WhatsApp</span><div>Respondemos consultas y tomamos pedidos</div></li>
      </ul>
      <a class="btn info__cta" href="${waLink("Hola! Quería hacer una consulta")}" target="_blank" rel="noopener">Escribinos por WhatsApp</a>`
  };

  function viewInfo(page) {
    renderCatbar(null);
    const fn = INFO[page];
    if (!fn) return viewNotFound();
    const [head, body] = fn().split("<!--body-->");
    app.innerHTML = `<div class="container"><div class="page">
      <div class="info info-layout">
        <div class="info__aside">
          <a class="btn btn--ghost btn--sm back-btn" href="#/productos">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"><path d="M15 5l-7 7 7 7"/></svg>
            Seguir comprando
          </a>
          ${head}
        </div>
        <div class="info__body">${body}</div>
      </div>
    </div></div>`;
  }

  function viewNotFound() {
    renderCatbar(null);
    app.innerHTML = `<div class="container"><div class="page"><div class="empty"><div>${ICON.sprout(40)}</div><p>No encontramos esta página.</p><a class="btn btn--gold" href="#/">Ir al inicio</a></div></div></div>`;
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
    $("#catbar")._cat?.close();

    stopCarousel();
    // Contacto, preguntas frecuentes, envíos, cómo comprar y nosotros: sin barra de categorías.
    document.body.classList.toggle("no-catbar", a === "info");
    if (!a) viewHome();
    else if (a === "productos") viewCatalog({ title: "Todos los productos", crumb: "Productos", list: PRODUCTS, active: "productos", query });
    else if (a === "novedades") viewCatalog({ title: "Novedades y nuevos ingresos", crumb: "Novedades", list: novedades(), active: "novedades", query });
    else if (a === "ofertas") viewCatalog({ title: "Ofertas de la semana", crumb: "Ofertas", list: offers(), active: "ofertas", query: { sort: "descuento", ...query } });
    else if (a === "categoria" && catById(b)) {
      const c = catById(b);
      viewCatalog({ title: esc(c.name), crumb: esc(c.name), list: PRODUCTS.filter((p) => p.cat === c.id || (c.id === "sin-tacc" && p.tags.includes("sin-tacc"))), active: c.id, query });
    } else if (a === "buscar") {
      const q = (query.q || "").trim();
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
    if (["productos", "ofertas", "categoria", "buscar", "novedades"].includes(a) || (a === "producto" && isMobile.matches)) scrollToContent();
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
        const href = links[hl].getAttribute("href");
        clearSearch();
        location.hash = href;
      } else if (e.key === "Escape") box.hidden = true;
    });
    document.addEventListener("click", (e) => { if (!form.contains(e.target)) box.hidden = true; });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      clearSearch();
      input.blur();
      location.hash = q ? `#/buscar?q=${encodeURIComponent(q)}` : "#/productos";
    });
    // Al tocar un producto sugerido, se limpia el buscador
    box.addEventListener("click", (e) => { if (e.target.closest("a")) clearSearch(); });
    // Si deja de escribir y sale del buscador sin buscar, también se limpia
    input.addEventListener("blur", () => {
      setTimeout(() => { if (!document.activeElement?.closest?.(".search")) clearSearch(); }, 180);
    });
  }

  function clearSearch() {
    $$(".search input").forEach((i) => { i.value = ""; });
    $$(".search__suggest").forEach((b) => { b.hidden = true; });
  }

  /* ---------------- Init ---------------- */
  // Marca y colores definidos en el panel (Configuración)
  function applyBrand() {
    const set = (sel, v) => $$(sel).forEach((el) => { el.textContent = v; });
    set(".js-short", STORE.shortName); set(".js-tagline", STORE.tagline); set(".js-name", STORE.name);
    set(".js-address", STORE.address); set(".js-hours", STORE.hours);
    if (STORE.logo) $$(".js-logo").forEach((img) => { img.removeAttribute("srcset"); img.src = STORE.logo; });
    document.title = `${STORE.name} · ${STORE.tagline || "Dietética online"}`;
    const r = document.documentElement.style;
    if (STORE.colorBrand) {
      const c = STORE.colorBrand;
      r.setProperty("--pistachio", c); r.setProperty("--gold", c);
      r.setProperty("--pistachio-dark", `color-mix(in srgb, ${c} 82%, #000)`);
      r.setProperty("--pistachio-light", `color-mix(in srgb, ${c} 50%, #fff)`);
      r.setProperty("--pistachio-soft", `color-mix(in srgb, ${c} 20%, #fff)`);
      r.setProperty("--rv-bg", `color-mix(in srgb, ${c} 30%, #fff)`);
    }
    if (STORE.colorDark) {
      r.setProperty("--forest", STORE.colorDark);
      r.setProperty("--nv-bg", `color-mix(in srgb, ${STORE.colorDark} 70%, #000)`);
      $('meta[name="theme-color"]')?.setAttribute("content", STORE.colorDark);
    }
  }

  function init() {
    applyBrand();
    // Marquesina (duplicada para loop continuo)
    const msg = `Envíos gratis en <b>${esc(STORE.city)}</b> en compras a partir de ${money(STORE.freeShippingFrom)}`;
    const extra = `${STORE.transferDiscount * 100}% OFF pagando con transferencia`;
    const items = Array.from({ length: 6 }, (_, i) => `<span>${i % 2 ? extra : msg}</span>`).join("");
    $("#marquee").innerHTML = items + items;

    // Menú ☰ con dos vistas: el menú principal y el panel "Catálogo" (categorías)
    $("#menuList").innerHTML = `
      <div class="menu-views">
        <div class="menu-view">
          <a href="#/">Inicio</a>
          <a href="#/info/nosotros">Nosotros</a><a href="#/info/como-comprar">Cómo comprar</a><a href="#/info/contacto">Contacto</a>
          <h5>Tienda</h5>
          <button type="button" class="menu-next" data-menu-view="cat">Catálogo<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="M9 5l7 7-7 7"/></svg></button>
          <a href="#/ofertas" class="menu-offer">Ofertas de la semana</a><a href="#/novedades">Novedades</a><a href="#/productos">Todos los productos</a>
          <h5>Ayuda</h5><a href="#/info/envios">Envíos y retiro</a><a href="#/info/faq">Preguntas frecuentes</a>
        </div>
        <div class="menu-view menu-view--cat" aria-label="Catálogo">
          <button type="button" class="menu-back" data-menu-view="main"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="M15 5l-7 7 7 7"/></svg> Volver</button>
          <h4 class="menu-view__title">Catálogo</h4>
          <a href="#/productos">Todo</a>
          <a href="#/novedades">Novedades</a>
          ${CATEGORIES.map((c) => `<a href="#/categoria/${c.id}">${esc(c.name)}</a>`).join("")}
          <a href="#/ofertas" class="menu-offer">Ofertas</a>
        </div>
      </div>`;
    const setMenuView = (v) => $("#menuList").classList.toggle("show-cat", v === "cat");
    $("#menuList").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-menu-view]");
      if (btn) { setMenuView(btn.dataset.menuView); $("#menuList").scrollTop = 0; }
    });
    // Cada vez que se abre el menú, arranca en la vista principal
    $("#menuBtn").addEventListener("click", () => setMenuView("main"));
    $$(".js-wa").forEach((a) => { a.href = waLink("Hola! Quería hacer una consulta"); });
    $("#waFloat").href = waLink("Hola! Quería hacer una consulta");
    // Volver arriba: visible solo después de bajar un poco
    const toTop = $("#toTop");
    const syncToTop = () => toTop.classList.toggle("show", window.scrollY > 500);
    window.addEventListener("scroll", syncToTop, { passive: true });
    toTop.addEventListener("click", () => smoothScrollTo(0));
    syncToTop();
    $$(".js-year").forEach((el) => { el.textContent = new Date().getFullYear(); });

    $("#cartBtn").addEventListener("click", () => openDrawer("#cartDrawer"));
    $("#orderbarOpen").addEventListener("click", () => openDrawer("#cartDrawer"));
    $("#orderpill").addEventListener("click", () => openDrawer("#cartDrawer"));
    // Si el carrito del header está a la vista, el carrito minimizado de abajo se esconde (y viceversa)
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => {
        document.body.classList.toggle("header-cart-visible", e.isIntersecting);
      }, { threshold: 0.6 }).observe($("#cartBtn"));
    }
    $("#orderbarHide").addEventListener("click", () => { store.set("sinter_bar_min", true); renderCartUI(); });
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
    // Siempre se entra por el inicio, aunque haya productos en el carrito o se recargue otra página
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    if (location.hash && location.hash !== "#/") history.replaceState(null, "", location.pathname + location.search + "#/");
    window.scrollTo(0, 0);
    route();
  }

  init();
})();
