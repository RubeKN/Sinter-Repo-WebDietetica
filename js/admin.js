/* =========================================================================
   Panel de administración de Sinter — Etapa 1
   Ingreso, estructura (menú lateral) y resumen del negocio.
   Todos los datos pasan por window.DB (js/db.js).
   ========================================================================= */
(() => {
  "use strict";
  const DB = window.DB;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const money = (n) => "$" + Math.round(n).toLocaleString("es-AR");
  const view = $("#view");

  /* ---------- Íconos (línea) ---------- */
  const PATHS = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    box: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
    bag: '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
    image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 8"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/>',
    store: '<path d="M4 10v10h16V10"/><path d="M3 10l2-6h14l2 6"/><path d="M3 10h18"/><path d="M10 20v-5h4v5"/>',
    reset: '<path d="M4 4v6h6"/><path d="M20 12a8 8 0 1 0-2.3 5.7"/><path d="M4 10a8 8 0 0 1 1-1.6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    alert: '<path d="M12 4l9 16H3l9-16z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  const icon = (k, w = 20) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[k] || ""}</svg>`;
  const paintIcons = (root = document) => $$("[data-ico]", root).forEach((el) => { el.innerHTML = icon(el.dataset.ico); });

  /* ---------- Secciones del panel ---------- */
  const SECTIONS = [
    { id: "inicio", label: "Inicio", ico: "home", ready: true },
    { id: "productos", label: "Productos", ico: "box", ready: true, desc: "Crear, editar, duplicar y pausar productos. Fotos, presentaciones, etiquetas, stock y edición rápida de precios desde la lista." },
    { id: "precios", label: "Aumento de precios", ico: "trend", ready: true, desc: "Subí o bajá precios en bloque por porcentaje, a toda la tienda o por categoría, con vista previa y redondeo." },
    { id: "ofertas", label: "Ofertas", ico: "tag", stage: 4, desc: "Marcá productos en oferta, definí la fecha de fin de la promo semanal y el descuento por transferencia." },
    { id: "pedidos", label: "Pedidos", ico: "bag", stage: 3, desc: "Todos los pedidos de la tienda con su estado (nuevo, preparando, listo, entregado), detalle para armar y contacto por WhatsApp." },
    { id: "categorias", label: "Categorías", ico: "grid", stage: 4, desc: "Creá, renombrá y ordená las categorías de la tienda." },
    { id: "portada", label: "Portada", ico: "image", stage: 4, desc: "Elegí qué productos aparecen en el carrusel de novedades y en qué orden." },
    { id: "resenas", label: "Reseñas", ico: "star", stage: 4, desc: "Cargá, ocultá y ordená los comentarios de clientes que se muestran en el inicio." },
    { id: "config", label: "Configuración", ico: "gear", stage: 4, desc: "Nombre, logo, colores, WhatsApp, dirección, horarios y costos de envío de la tienda." }
  ];

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2400);
  }

  /* =======================================================================
     Ingreso
     ======================================================================= */
  async function showLogin() {
    $("#shell").hidden = true; $("#login").hidden = false;
    const c = DB.demoCredentials;
    $("#demoCreds").innerHTML = c ? `Email: <code>${esc(c.email)}</code> · Contraseña: <code>${esc(c.pass)}</code>` : "";
    $("#fillDemo").hidden = !c;
    $("#loginForm").email.focus();
  }

  $("#fillDemo").addEventListener("click", () => {
    const f = $("#loginForm"); f.email.value = DB.demoCredentials.email; f.pass.value = DB.demoCredentials.pass;
  });
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target; const err = $("#loginError");
    try {
      await DB.login(f.email.value, f.pass.value);
      err.hidden = true; f.reset(); start();
    } catch (ex) { err.textContent = ex.message; err.hidden = false; }
  });

  /* =======================================================================
     Estructura del panel
     ======================================================================= */
  async function start() {
    const user = await DB.currentUser();
    if (!user) return showLogin();
    $("#login").hidden = true; $("#shell").hidden = false;
    $("#userName").textContent = user.name; $("#userEmail").textContent = user.email;
    $("#avatar").textContent = (user.name || "A").charAt(0).toUpperCase();
    $("#sideNav").innerHTML = SECTIONS.map((s) =>
      `<a class="side__link" href="#/${s.id}" data-sec="${s.id}">${icon(s.ico)}<span>${s.label}</span>${s.ready ? "" : `<em>Pronto</em>`}</a>`).join("");
    paintIcons();
    route();
  }

  const openSide = (o) => { $("#side").classList.toggle("open", o); $("#sideOverlay").hidden = !o; };
  $("#menuBtn").addEventListener("click", () => openSide(true));
  $("#sideOverlay").addEventListener("click", () => openSide(false));
  $("#logoutBtn").addEventListener("click", async () => { await DB.logout(); location.hash = ""; showLogin(); });
  $("#resetDemo").addEventListener("click", async () => {
    if (!confirm("¿Restablecer la demo? Se borran los cambios hechos en este navegador y vuelven los datos originales.")) return;
    await DB.reset(); toast("Demo restablecida"); route();
  });

  function route() {
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    const id = parts[0] || "inicio";
    const sec = SECTIONS.find((s) => s.id === id) || SECTIONS[0];
    $$(".side__link[data-sec]").forEach((a) => a.classList.toggle("active", a.dataset.sec === sec.id));
    $("#pageTitle").textContent = sec.label;
    document.title = `${sec.label} · Panel Sinter`;
    openSide(false);
    if (sec.id === "inicio") renderDashboard();
    else if (sec.id === "productos") parts[1] ? renderEditor(parts[1]) : renderProducts();
    else if (sec.id === "precios") renderPrices();
    else renderSoon(sec);
    view.scrollTop = 0; window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", () => { if (!$("#shell").hidden) route(); });

  function renderSoon(sec) {
    view.innerHTML = `<div class="soon">
      <span class="soon__ico">${icon(sec.ico, 30)}</span>
      <h2>${esc(sec.label)}</h2>
      <p>${esc(sec.desc)}</p>
      <span class="soon__tag">Llega en la etapa ${sec.stage}</span>
      <a class="btn btn--ghost" href="#/inicio">Volver al inicio</a>
    </div>`;
  }

  /* =======================================================================
     Inicio: resumen del negocio
     ======================================================================= */
  const DAY = 86400000;
  const dayKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`; };
  const STATUS = {
    nuevo: { label: "Nuevo", cls: "st--new" },
    preparando: { label: "Preparando", cls: "st--prep" },
    listo: { label: "Listo", cls: "st--ready" },
    entregado: { label: "Entregado", cls: "st--done" },
    cancelado: { label: "Cancelado", cls: "st--cancel" }
  };
  const chip = (s) => `<span class="st ${STATUS[s]?.cls || ""}">${STATUS[s]?.label || esc(s)}</span>`;

  async function renderDashboard() {
    const [orders, products, store] = await Promise.all([DB.listOrders(), DB.getProducts(), DB.getStore()]);
    const now = new Date();
    const valid = orders.filter((o) => o.status !== "cancelado");
    const today = valid.filter((o) => dayKey(o.createdAt) === dayKey(now));
    const last30 = valid.filter((o) => now - new Date(o.createdAt) < 30 * DAY);
    const prev30 = valid.filter((o) => { const a = now - new Date(o.createdAt); return a >= 30 * DAY && a < 60 * DAY; });
    const sum = (list) => list.reduce((a, o) => a + o.total, 0);
    const pending = orders.filter((o) => ["nuevo", "preparando", "listo"].includes(o.status));
    const avg = last30.length ? sum(last30) / last30.length : 0;
    const outOfStock = products.filter((p) => p.stock <= 0);
    const lowStock = products.filter((p) => p.stock > 0 && p.stock < 20).sort((a, b) => a.stock - b.stock);

    // Ventas por día (últimos 14 días)
    const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 13 + i); return d; });
    const series = days.map((d) => { const list = valid.filter((o) => dayKey(o.createdAt) === dayKey(d)); return { d, total: sum(list), n: list.length }; });

    // Más vendidos (unidades, últimos 30 días)
    const units = {};
    last30.forEach((o) => o.items.forEach((it) => { units[it.id] = units[it.id] || { name: it.name, qty: 0, total: 0 }; units[it.id].qty += it.qty; units[it.id].total += it.qty * it.unit; }));
    const top = Object.values(units).sort((a, b) => b.qty - a.qty).slice(0, 5);
    const topMax = top[0]?.qty || 1;

    const hasDemo = orders.some((o) => o.demo);
    const hour = now.getHours();
    const greet = hour < 12 ? "Buen día" : hour < 20 ? "Buenas tardes" : "Buenas noches";

    view.innerHTML = `
      <div class="dash-head">
        <div><h2>${greet}</h2><p>${now.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} · así va ${esc(store.name || "tu tienda")}</p></div>
        <a class="btn btn--primary" href="./" target="_blank" rel="noopener">${icon("store", 18)} Ver tienda</a>
      </div>
      ${hasDemo ? `<div class="notice">${icon("alert", 18)}<span>Estás viendo <b>datos de demostración</b>. Los pedidos que hagas en la tienda desde este navegador aparecen acá.</span></div>` : ""}

      <section class="kpis">
        ${kpi("cash", "Ventas de hoy", money(sum(today)), `${today.length} pedido${today.length === 1 ? "" : "s"}`)}
        ${kpi("trend", "Últimos 30 días", money(sum(last30)), trendText(sum(last30), sum(prev30)) || `${last30.length} pedidos`)}
        ${kpi("clock", "Pedidos pendientes", String(pending.length), pending.length ? "Para preparar o entregar" : "Todo al día", pending.length ? "warn" : "")}
        ${kpi("receipt", "Ticket promedio", money(avg), "Por pedido, últimos 30 días")}
      </section>

      <section class="card chart-card">
        <div class="card__head"><h3>Ventas de los últimos 14 días</h3><span class="muted">${money(sum(series))} en total</span></div>
        <div class="chart" id="salesChart"></div>
        <details class="chart-table"><summary>Ver como tabla</summary>
          <table><thead><tr><th>Día</th><th>Pedidos</th><th>Ventas</th></tr></thead><tbody>
          ${series.map((s) => `<tr><td>${s.d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}</td><td>${s.n}</td><td>${money(s.total)}</td></tr>`).join("")}
          </tbody></table></details>
      </section>

      <div class="dash-cols">
        <section class="card">
          <div class="card__head"><h3>Pedidos recientes</h3><a class="link" href="#/pedidos">Ver todos ${icon("arrow", 14)}</a></div>
          <div class="table-wrap"><table class="tbl">
            <thead><tr><th>Pedido</th><th>Cliente</th><th class="col-date">Fecha</th><th class="num">Total</th><th>Estado</th></tr></thead>
            <tbody>${orders.slice(0, 7).map((o) => `<tr>
              <td><b>${esc(o.id)}</b></td><td>${esc(o.customer?.name)}</td>
              <td class="muted col-date">${new Date(o.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
              <td class="num">${money(o.total)}</td><td>${chip(o.status)}</td></tr>`).join("")}</tbody>
          </table></div>
        </section>

        <div class="dash-side">
          <section class="card">
            <div class="card__head"><h3>Stock a revisar</h3><a class="link" href="#/productos">Productos ${icon("arrow", 14)}</a></div>
            ${outOfStock.length + lowStock.length === 0 ? `<p class="muted">Todo el stock está bien.</p>` : `<ul class="stock-list">
              ${outOfStock.map((p) => `<li><a href="#/productos/${p.id}">${esc(p.name)}</a><span class="st st--cancel">Sin stock</span></li>`).join("")}
              ${lowStock.slice(0, 6).map((p) => `<li><a href="#/productos/${p.id}">${esc(p.name)}</a><span class="st st--prep">Quedan ${p.stock}</span></li>`).join("")}
            </ul>`}
          </section>
          <section class="card">
            <div class="card__head"><h3>Más vendidos</h3><span class="muted">30 días</span></div>
            <ol class="top-list">${top.map((t) => `<li>
              <div class="top-list__row"><span>${esc(t.name)}</span><b>${t.qty} u.</b></div>
              <div class="top-list__bar"><span style="width:${Math.max(6, (t.qty / topMax) * 100)}%"></span></div></li>`).join("")}</ol>
          </section>
        </div>
      </div>`;
    drawChart($("#salesChart"), series);
    window.onresize = () => { clearTimeout(window.__rz); window.__rz = setTimeout(() => { const el = $("#salesChart"); if (el) drawChart(el, series); }, 150); };
  }

  function kpi(ico, label, value, sub, tone = "") {
    return `<div class="kpi ${tone ? "kpi--" + tone : ""}"><span class="kpi__ico">${icon(ico, 20)}</span>
      <div><span class="kpi__label">${label}</span><b class="kpi__value">${value}</b><span class="kpi__sub">${sub}</span></div></div>`;
  }
  function trendText(cur, prev) {
    if (!prev) return null;
    const pct = Math.round(((cur - prev) / prev) * 100);
    return `<span class="${pct >= 0 ? "up" : "down"}">${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct)}%</span> vs. 30 días anteriores`;
  }

  /* ---------- Gráfico de barras (una serie) con tooltip ---------- */
  function drawChart(el, series) {
    const W = Math.max(320, Math.round(el.clientWidth || 760)), H = W < 520 ? 200 : 240, pad = { l: 48, r: 8, t: 12, b: 28 };
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const max = Math.max(1, ...series.map((s) => s.total));
    const stepRaw = max / 4; const mag = Math.pow(10, Math.floor(Math.log10(stepRaw)));
    const step = Math.ceil(stepRaw / mag) * mag; const top = step * 4;
    const bw = iw / series.length; const barW = Math.min(36, bw - 8);
    const y = (v) => pad.t + ih - (v / top) * ih;
    const short = (v) => v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`;
    let g = "";
    for (let i = 0; i <= 4; i++) {
      const v = step * i, yy = y(v);
      g += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${yy}" y2="${yy}" class="grid${i === 0 ? " base" : ""}"/><text x="${pad.l - 8}" y="${yy + 4}" class="ax" text-anchor="end">${short(v)}</text>`;
    }
    series.forEach((s, i) => {
      const x = pad.l + bw * i + (bw - barW) / 2; const h = Math.max(0, (s.total / top) * ih);
      const r = Math.min(4, h);
      const yy = pad.t + ih - h;
      const path = h > 0 ? `M${x},${pad.t + ih} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + barW - r} Q${x + barW},${yy} ${x + barW},${yy + r} V${pad.t + ih} Z` : "";
      const isToday = i === series.length - 1;
      g += `<g class="bar${isToday ? " today" : ""}" data-i="${i}"><rect x="${pad.l + bw * i}" y="${pad.t}" width="${bw}" height="${ih}" class="hit"/>${path ? `<path d="${path}"/>` : ""}</g>`;
      if ((series.length - 1 - i) % (W < 520 ? 3 : 2) === 0) g += `<text x="${x + barW / 2}" y="${H - 8}" class="ax" text-anchor="middle">${s.d.getDate()}/${s.d.getMonth() + 1}</text>`;
    });
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ventas diarias de los últimos 14 días">${g}</svg><div class="tip" hidden></div>`;
    const tip = $(".tip", el);
    $$(".bar", el).forEach((b) => {
      const show = () => {
        const s = series[Number(b.dataset.i)];
        $$(".bar", el).forEach((o) => o.classList.toggle("on", o === b));
        tip.innerHTML = `<b>${money(s.total)}</b><span>${s.d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short" })}</span><span>${s.n} pedido${s.n === 1 ? "" : "s"}</span>`;
        tip.hidden = false;
        const rb = b.getBoundingClientRect(), re = el.getBoundingClientRect();
        let left = rb.left - re.left + rb.width / 2 - tip.offsetWidth / 2;
        left = Math.max(0, Math.min(left, re.width - tip.offsetWidth));
        tip.style.left = left + "px"; tip.style.top = "0px";
      };
      b.addEventListener("mouseenter", show); b.addEventListener("click", show);
    });
    el.addEventListener("mouseleave", () => { tip.hidden = true; $$(".bar", el).forEach((o) => o.classList.remove("on")); });
  }

  /* =======================================================================
     Utilidades de productos
     ======================================================================= */
  const round10 = (n) => Math.round(n / 10) * 10;
  const vPrice = (p, v = 0) => round10(p.price * (p.variants?.[v]?.mult ?? 1));
  const offPct = (p) => (p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);
  const thumb = (p, cls = "") => p.image
    ? `<img class="${cls}" src="${esc(p.image)}" alt="" loading="lazy">`
    : `<span class="${cls} thumb-mono">${esc((p.name || "?").charAt(0))}</span>`;
  PATHS.plus = '<path d="M12 5v14M5 12h14"/>';
  PATHS.search = '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>';
  PATHS.edit = '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>';
  PATHS.copy = '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>';
  PATHS.trash = '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>';
  PATHS.upload = '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>';
  PATHS.back = '<path d="M15 5l-7 7 7 7"/>';
  PATHS.undo = '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>';
  PATHS.check = '<path d="M5 12.5l4.5 4.5L19 7.5"/>';

  /* =======================================================================
     Productos: lista
     ======================================================================= */
  const pState = { q: "", cat: "", filter: "todos" };
  const FILTERS = [["todos", "Todos"], ["sinstock", "Sin stock"], ["poco", "Poco stock"], ["oferta", "En oferta"], ["pausados", "Pausados"]];

  async function renderProducts() {
    const [products, cats] = await Promise.all([DB.getProducts(), DB.getCategories()]);
    const catName = (id) => cats.find((c) => c.id === id)?.name || "Sin categoría";
    const visible = products.filter((p) => !p.paused).length;
    view.innerHTML = `
      <div class="page-head">
        <div><h2>Productos</h2><p class="muted">${products.length} productos · ${visible} visibles en la tienda</p></div>
        <a class="btn btn--primary" href="#/productos/nuevo">${icon("plus", 18)} Nuevo producto</a>
      </div>
      <div class="filters">
        <label class="searchbox">${icon("search", 18)}<input id="pq" type="text" placeholder="Buscar por nombre…" value="${esc(pState.q)}" autocomplete="off"></label>
        <select id="pcat" class="select"><option value="">Todas las categorías</option>${cats.map((c) => `<option value="${c.id}" ${pState.cat === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
        <div class="segs" id="pfilter">${FILTERS.map(([k, l]) => `<button type="button" data-f="${k}" class="${pState.filter === k ? "on" : ""}">${l}</button>`).join("")}</div>
      </div>
      <div class="card card--flush">
        <div class="plist-head"><span></span><span>Producto</span><span>Precio</span><span>Stock</span><span>En tienda</span><span></span></div>
        <div id="plist"></div>
      </div>`;

    const draw = () => {
      const q = pState.q.trim().toLowerCase();
      const list = products.filter((p) =>
        (!q || p.name.toLowerCase().includes(q)) &&
        (!pState.cat || p.cat === pState.cat) &&
        (pState.filter === "todos" ||
          (pState.filter === "sinstock" && p.stock <= 0) ||
          (pState.filter === "poco" && p.stock > 0 && p.stock < 20) ||
          (pState.filter === "oferta" && offPct(p) > 0) ||
          (pState.filter === "pausados" && p.paused)));
      $("#plist").innerHTML = list.length ? list.map((p) => `
        <div class="pitem ${p.paused ? "is-paused" : ""}" data-id="${p.id}">
          <a class="pitem__img" href="#/productos/${p.id}">${thumb(p)}</a>
          <div class="pitem__info">
            <a class="pitem__name" href="#/productos/${p.id}">${esc(p.name)}</a>
            <span class="pitem__meta">${esc(catName(p.cat))} · ${esc(p.variants?.[0]?.label || "")}${p.variants?.length > 1 ? ` y ${p.variants.length - 1} más` : ""}</span>
            <span class="pitem__badges">
              ${offPct(p) ? `<span class="pb pb--off">-${offPct(p)}%</span>` : ""}
              ${p.isNew ? `<span class="pb pb--new">Novedad</span>` : ""}
              ${p.featured ? `<span class="pb">Destacado</span>` : ""}
              ${p.stock <= 0 ? `<span class="pb pb--warn">Sin stock</span>` : p.stock < 20 ? `<span class="pb pb--low">Poco stock</span>` : ""}
            </span>
          </div>
          <label class="qedit"><span>$</span><input type="number" min="0" step="10" data-k="price" value="${p.price}" aria-label="Precio de ${esc(p.name)}"></label>
          <label class="qedit qedit--stock"><input type="number" min="0" step="1" data-k="stock" value="${p.stock}" aria-label="Stock de ${esc(p.name)}"><span>u.</span></label>
          <label class="switch" title="${p.paused ? "Pausado: no se muestra en la tienda" : "Visible en la tienda"}"><input type="checkbox" data-k="visible" ${p.paused ? "" : "checked"}><span></span></label>
          <div class="pitem__actions">
            <a class="icon-btn" href="#/productos/${p.id}" title="Editar" aria-label="Editar">${icon("edit", 18)}</a>
            <button class="icon-btn" type="button" data-act="dup" title="Duplicar" aria-label="Duplicar">${icon("copy", 18)}</button>
            <button class="icon-btn icon-btn--danger" type="button" data-act="del" title="Eliminar" aria-label="Eliminar">${icon("trash", 18)}</button>
          </div>
        </div>`).join("")
        : `<div class="empty">No hay productos con esos filtros.</div>`;
    };
    draw();

    $("#pq").addEventListener("input", (e) => { pState.q = e.target.value; draw(); });
    $("#pcat").addEventListener("change", (e) => { pState.cat = e.target.value; draw(); });
    $("#pfilter").addEventListener("click", (e) => {
      const b = e.target.closest("[data-f]"); if (!b) return;
      pState.filter = b.dataset.f; $$("#pfilter button").forEach((x) => x.classList.toggle("on", x === b)); draw();
    });

    // Edición rápida
    $("#plist").addEventListener("change", async (e) => {
      const input = e.target.closest("[data-k]"); if (!input) return;
      const row = input.closest(".pitem"); const p = products.find((x) => x.id === Number(row.dataset.id));
      if (input.dataset.k === "visible") { p.paused = !input.checked; row.classList.toggle("is-paused", p.paused); }
      else {
        const v = Math.max(0, Math.round(Number(input.value) || 0));
        input.value = v; p[input.dataset.k] = v;
      }
      await DB.saveProduct(p);
      input.closest("label").classList.add("saved"); setTimeout(() => input.closest("label")?.classList.remove("saved"), 900);
      toast(input.dataset.k === "visible" ? (p.paused ? "Producto pausado" : "Producto visible en la tienda") : "Cambio guardado");
    });
    $("#plist").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-act]"); if (!b) return;
      const id = Number(b.closest(".pitem").dataset.id); const p = products.find((x) => x.id === id);
      if (b.dataset.act === "dup") {
        const copy = { ...JSON.parse(JSON.stringify(p)), id: Math.max(...products.map((x) => x.id)) + 1, name: `${p.name} (copia)`, paused: true, featured: false, isNew: false };
        await DB.saveProduct(copy); toast("Producto duplicado (queda pausado)"); location.hash = `#/productos/${copy.id}`;
      }
      if (b.dataset.act === "del") {
        if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return;
        await DB.deleteProduct(id); toast("Producto eliminado"); renderProducts();
      }
    });
  }

  /* =======================================================================
     Productos: crear / editar
     ======================================================================= */
  async function renderEditor(id) {
    const [products, cats, catalog] = await Promise.all([DB.getProducts(), DB.getCategories(), DB.loadCatalog()]);
    const TAGS = catalog.TAGS || {};
    const store = catalog.STORE || {};
    const isNew = id === "nuevo";
    const found = products.find((x) => x.id === Number(id));
    if (!isNew && !found) { view.innerHTML = `<div class="soon"><h2>Producto no encontrado</h2><a class="btn btn--ghost" href="#/productos">Volver a productos</a></div>`; return; }
    const d = isNew
      ? { name: "", cat: cats[0]?.id || "", desc: "", price: 0, oldPrice: null, stock: 0, tags: [], image: "", paused: false, isNew: true, featured: false, variants: [{ label: "250 g", mult: 1 }] }
      : JSON.parse(JSON.stringify(found));
    // Presentaciones con precio propio (en los datos se guardan como multiplicador del precio base)
    let rows = (d.variants || [{ label: "Unidad", mult: 1 }]).map((v, i) => ({ label: v.label, price: i === 0 ? d.price : round10(d.price * v.mult) }));
    $("#pageTitle").textContent = isNew ? "Nuevo producto" : "Editar producto";

    view.innerHTML = `
      <a class="back" href="#/productos">${icon("back", 16)} Productos</a>
      <form class="editor" id="pform" novalidate>
        <div class="editor__main">
          <section class="card">
            <h3 class="card__title">Información</h3>
            <label class="f">Nombre<input name="name" value="${esc(d.name)}" placeholder="Ej: Almendras Non Pareil" required></label>
            <div class="f-row">
              <label class="f">Categoría<select name="cat" class="select">${cats.map((c) => `<option value="${c.id}" ${d.cat === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label>
              <label class="f">Stock<input name="stock" type="number" min="0" step="1" value="${d.stock}"></label>
            </div>
            <label class="f">Descripción<textarea name="desc" rows="3" placeholder="Contale al cliente qué es, cómo se usa, de dónde viene…">${esc(d.desc)}</textarea></label>
          </section>

          <section class="card">
            <h3 class="card__title">Foto</h3>
            <div class="photo">
              <div class="photo__preview" id="photoPrev">${thumb(d, "photo__img")}</div>
              <div class="photo__side">
                <label class="drop" id="drop">${icon("upload", 22)}<b>Subir foto</b><span>Arrastrá una imagen o tocá para elegir. Se optimiza sola.</span><input type="file" accept="image/*" id="photoIn" hidden></label>
                <button type="button" class="btn btn--ghost btn--sm" id="photoDel" ${d.image ? "" : "hidden"}>Quitar foto</button>
              </div>
            </div>
          </section>

          <section class="card">
            <h3 class="card__title">Precio</h3>
            <div class="f-row">
              <label class="f">Precio<span class="money"><i>$</i><input name="price" type="number" min="0" step="10" value="${d.price || ""}" placeholder="0" required></span></label>
              <label class="f">Precio anterior <small>(si está en oferta)</small><span class="money"><i>$</i><input name="oldPrice" type="number" min="0" step="10" value="${d.oldPrice || ""}" placeholder="Opcional"></span></label>
            </div>
            <p class="hint" id="priceHint"></p>
          </section>

          <section class="card">
            <h3 class="card__title">Presentaciones</h3>
            <p class="muted small">La primera usa el precio de arriba. Agregá otras (por ejemplo 500 g o 1 kg) con su propio precio.</p>
            <div id="vrows" class="vrows"></div>
            <button type="button" class="btn btn--ghost btn--sm" id="vadd">${icon("plus", 16)} Agregar presentación</button>
          </section>

          <section class="card">
            <h3 class="card__title">Etiquetas</h3>
            <div class="chips">${Object.entries(TAGS).map(([k, l]) => `<label class="chipbox"><input type="checkbox" name="tag" value="${k}" ${d.tags?.includes(k) ? "checked" : ""}><span>${esc(l)}</span></label>`).join("")}</div>
          </section>
        </div>

        <aside class="editor__side">
          <section class="card">
            <h3 class="card__title">Visibilidad</h3>
            <label class="toggle"><span><b>Visible en la tienda</b><small>Si lo apagás, el producto queda pausado</small></span><span class="switch"><input type="checkbox" name="visible" ${d.paused ? "" : "checked"}><span></span></span></label>
            <label class="toggle"><span><b>Novedad</b><small>Aparece en el carrusel del inicio</small></span><span class="switch"><input type="checkbox" name="isNew" ${d.isNew ? "checked" : ""}><span></span></span></label>
            <label class="toggle"><span><b>Destacado</b><small>Aparece en "Más vendidos"</small></span><span class="switch"><input type="checkbox" name="featured" ${d.featured ? "checked" : ""}><span></span></span></label>
          </section>
          <section class="card preview-card">
            <h3 class="card__title">Así se ve en la tienda</h3>
            <div id="preview"></div>
          </section>
          <div class="editor__actions">
            <button class="btn btn--primary btn--block" type="submit">${icon("check", 18)} ${isNew ? "Crear producto" : "Guardar cambios"}</button>
            <a class="btn btn--ghost btn--block" href="#/productos">Cancelar</a>
            ${isNew ? "" : `<button class="btn btn--danger-ghost btn--block" type="button" id="pdel">${icon("trash", 16)} Eliminar producto</button>`}
          </div>
        </aside>
      </form>`;

    const f = $("#pform");
    const readForm = () => {
      d.name = f.name.value.trim(); d.cat = f.cat.value; d.desc = f.desc.value.trim();
      d.price = Math.max(0, Math.round(Number(f.price.value) || 0));
      const old = Math.round(Number(f.oldPrice.value) || 0); d.oldPrice = old > 0 ? old : null;
      d.stock = Math.max(0, Math.round(Number(f.stock.value) || 0));
      d.tags = $$("input[name=tag]:checked", f).map((x) => x.value);
      d.paused = !f.visible.checked; d.isNew = f.isNew.checked; d.featured = f.featured.checked;
      rows[0].price = d.price;
    };
    const drawRows = () => {
      $("#vrows").innerHTML = rows.map((r, i) => `<div class="vrow" data-i="${i}">
        <input class="vlabel" value="${esc(r.label)}" placeholder="Ej: 500 g" aria-label="Presentación">
        <span class="money"><i>$</i><input class="vprice" type="number" min="0" step="10" value="${i === 0 ? d.price || "" : r.price || ""}" ${i === 0 ? "disabled title='Usa el precio principal'" : ""} aria-label="Precio"></span>
        ${i === 0 ? `<span class="vtag">Principal</span>` : `<button type="button" class="icon-btn icon-btn--danger" data-vdel="${i}" aria-label="Quitar">${icon("trash", 16)}</button>`}
      </div>`).join("");
    };
    const drawPreview = () => {
      const off = d.oldPrice && d.oldPrice > d.price ? Math.round((1 - d.price / d.oldPrice) * 100) : 0;
      const transfer = d.price * (1 - (store.transferDiscount || 0));
      $("#preview").innerHTML = `<div class="pv">
        <div class="pv__img">${thumb(d)}${off ? `<span class="pv__badge">-${off}%</span>` : d.isNew ? `<span class="pv__badge pv__badge--new">Nuevo</span>` : ""}</div>
        <b class="pv__name">${esc(d.name || "Nombre del producto")}</b>
        <span class="pv__variant">${esc(rows[0]?.label || "")}</span>
        ${off ? `<s class="pv__old">${money(d.oldPrice)}</s>` : ""}
        <div class="pv__now"><b>${money(transfer)}</b> <span>transferencia</span></div>
        <span class="pv__other">${money(d.price)} otros medios</span>
        <span class="pv__btn">VER Y PEDIR ›</span>
        ${d.paused ? `<span class="pv__paused">Pausado: no se muestra en la tienda</span>` : ""}
      </div>`;
      const hint = $("#priceHint");
      hint.innerHTML = off ? `En oferta: <b>${off}% OFF</b> (antes ${money(d.oldPrice)}). Con transferencia: <b>${money(transfer)}</b>.`
        : d.oldPrice && d.oldPrice <= d.price ? `<span class="warn">El precio anterior tiene que ser mayor al precio actual para mostrarse como oferta.</span>`
        : d.price ? `Con transferencia (${Math.round((store.transferDiscount || 0) * 100)}% OFF): <b>${money(transfer)}</b>.` : "";
    };
    drawRows(); drawPreview();

    f.addEventListener("input", (e) => {
      if (e.target.closest(".vrow")) {
        const i = Number(e.target.closest(".vrow").dataset.i);
        if (e.target.classList.contains("vlabel")) rows[i].label = e.target.value;
        if (e.target.classList.contains("vprice")) rows[i].price = Math.round(Number(e.target.value) || 0);
      }
      readForm(); drawPreview();
      if (e.target.name === "price") { const first = $(".vrow[data-i='0'] .vprice"); if (first) first.value = d.price || ""; }
    });
    f.addEventListener("change", () => { readForm(); drawPreview(); });
    $("#vadd").addEventListener("click", () => { rows.push({ label: "", price: d.price ? round10(d.price * 1.9) : 0 }); drawRows(); $(`.vrow[data-i='${rows.length - 1}'] .vlabel`).focus(); });
    $("#vrows").addEventListener("click", (e) => { const b = e.target.closest("[data-vdel]"); if (!b) return; rows.splice(Number(b.dataset.vdel), 1); drawRows(); drawPreview(); });

    // Foto: se reduce a 800 px y se guarda optimizada
    const setPhoto = async (file) => {
      if (!file || !file.type.startsWith("image/")) return toast("Elegí un archivo de imagen");
      try {
        d.image = await shrinkImage(file, 800);
        $("#photoPrev").innerHTML = thumb(d, "photo__img"); $("#photoDel").hidden = false; drawPreview();
      } catch { toast("No se pudo leer la imagen"); }
    };
    $("#photoIn").addEventListener("change", (e) => setPhoto(e.target.files[0]));
    const drop = $("#drop");
    ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
    ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
    drop.addEventListener("drop", (e) => setPhoto(e.dataTransfer.files[0]));
    $("#photoDel").addEventListener("click", () => { d.image = ""; $("#photoPrev").innerHTML = thumb(d, "photo__img"); $("#photoDel").hidden = true; drawPreview(); });

    $("#pdel")?.addEventListener("click", async () => {
      if (!confirm(`¿Eliminar "${d.name}"? Esta acción no se puede deshacer.`)) return;
      await DB.deleteProduct(d.id); toast("Producto eliminado"); location.hash = "#/productos";
    });

    f.addEventListener("submit", async (e) => {
      e.preventDefault(); readForm();
      const errors = [];
      if (!d.name) errors.push(["name", "Poné un nombre"]);
      if (!d.price) errors.push(["price", "Poné un precio"]);
      if (rows.some((r) => !r.label.trim())) errors.push([null, "Completá el nombre de cada presentación"]);
      if (rows.slice(1).some((r) => !r.price)) errors.push([null, "Poné el precio de cada presentación"]);
      if (errors.length) { if (errors[0][0]) f[errors[0][0]].focus(); return toast(errors[0][1]); }
      d.variants = rows.map((r, i) => ({ label: r.label.trim(), mult: i === 0 ? 1 : Math.round((r.price / d.price) * 10000) / 10000 }));
      if (isNew) d.id = Math.max(0, ...products.map((x) => x.id)) + 1;
      try { await DB.saveProduct(d); }
      catch { return toast("No se pudo guardar (¿foto muy pesada?)"); }
      toast(isNew ? "Producto creado" : "Cambios guardados");
      location.hash = "#/productos";
    });
  }

  function shrinkImage(file, max) {
    return new Promise((resolve, reject) => {
      const img = new Image(); const url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        let out = c.toDataURL("image/webp", .82);
        if (!out.startsWith("data:image/webp")) out = c.toDataURL("image/jpeg", .85);
        resolve(out);
      };
      img.onerror = reject; img.src = url;
    });
  }

  /* =======================================================================
     Aumento de precios (masivo)
     ======================================================================= */
  const pr = { scope: "todas", cats: [], dir: "up", pct: 10, round: 10, old: true };

  async function renderPrices() {
    const [products, cats, history] = await Promise.all([DB.getProducts(), DB.getCategories(), DB.listPriceHistory()]);
    const catName = (id) => cats.find((c) => c.id === id)?.name || "—";
    view.innerHTML = `
      <div class="page-head"><div><h2>Aumento de precios</h2><p class="muted">Actualizá muchos precios de una vez, con vista previa antes de aplicar.</p></div></div>
      <div class="prices">
        <div class="prices__form">
          <section class="card">
            <h3 class="card__title"><span class="num-step">1</span> ¿A qué productos?</h3>
            <div class="segs segs--big" id="scope"><button type="button" data-s="todas">Toda la tienda</button><button type="button" data-s="cats">Elegir categorías</button></div>
            <div class="chips" id="catChips" ${pr.scope === "cats" ? "" : "hidden"}>${cats.map((c) => `<label class="chipbox"><input type="checkbox" value="${c.id}" ${pr.cats.includes(c.id) ? "checked" : ""}><span>${esc(c.name)}</span></label>`).join("")}</div>
          </section>
          <section class="card">
            <h3 class="card__title"><span class="num-step">2</span> ¿Cuánto?</h3>
            <div class="segs segs--big" id="dir"><button type="button" data-d="up">Aumentar</button><button type="button" data-d="down">Bajar</button></div>
            <div class="pct">
              <label class="pct__in"><input type="number" id="pct" min="0" max="100" step="0.5" value="${pr.pct}"><span>%</span></label>
              <div class="pct__quick">${[5, 8, 10, 15, 20].map((n) => `<button type="button" data-p="${n}">${n}%</button>`).join("")}</div>
            </div>
            <label class="f">Redondear precios a
              <select id="round" class="select">${[[1, "No redondear"], [10, "$10"], [50, "$50"], [100, "$100"]].map(([v, l]) => `<option value="${v}" ${pr.round === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
            <label class="check"><input type="checkbox" id="oldToo" ${pr.old ? "checked" : ""}><span>Aplicar también al precio anterior de las ofertas <small>(mantiene el % de descuento)</small></span></label>
          </section>
        </div>
        <section class="card prices__preview">
          <div class="card__head"><h3><span class="num-step">3</span> Vista previa</h3><span class="muted" id="sumTxt"></span></div>
          <div class="pv-table" id="pvTable"></div>
          <button class="btn btn--primary btn--block btn--lg" type="button" id="applyBtn">${icon("check", 18)} Aplicar cambios</button>
        </section>
      </div>
      <section class="card history">
        <div class="card__head"><h3>Últimos cambios masivos</h3></div>
        ${history.length ? `<ul class="hist">${history.map((h, i) => `<li>
          <div><b>${esc(h.desc)}</b><span class="muted">${new Date(h.date).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · ${h.before.length} productos</span></div>
          ${i === 0 ? `<button class="btn btn--ghost btn--sm" type="button" data-undo="${h.id}">${icon("undo", 16)} Deshacer</button>` : ""}</li>`).join("")}</ul>`
          : `<p class="muted">Todavía no hiciste cambios masivos.</p>`}
      </section>`;

    const roundTo = (n) => pr.round > 1 ? Math.max(pr.round, Math.round(n / pr.round) * pr.round) : Math.max(1, Math.round(n));
    const factor = () => 1 + (pr.dir === "up" ? 1 : -1) * (Math.max(0, Math.min(100, pr.pct)) / 100);
    const affected = () => products.filter((p) => pr.scope === "todas" || pr.cats.includes(p.cat));
    const newPrice = (p) => roundTo(p.price * factor());
    const newOld = (p) => (pr.old && p.oldPrice ? roundTo(p.oldPrice * factor()) : p.oldPrice);

    const draw = () => {
      $$("#scope button").forEach((b) => b.classList.toggle("on", b.dataset.s === pr.scope));
      $$("#dir button").forEach((b) => b.classList.toggle("on", b.dataset.d === pr.dir));
      $$(".pct__quick button").forEach((b) => b.classList.toggle("on", Number(b.dataset.p) === pr.pct));
      $("#catChips").hidden = pr.scope !== "cats";
      const list = affected();
      const sign = pr.dir === "up" ? "+" : "−";
      $("#sumTxt").textContent = list.length ? `${list.length} producto${list.length === 1 ? "" : "s"} · ${sign}${pr.pct}%` : "";
      $("#pvTable").innerHTML = list.length ? `<table class="tbl">
        <thead><tr><th>Producto</th><th class="num">Ahora</th><th class="num">Nuevo</th><th class="num">Diferencia</th></tr></thead>
        <tbody>${list.map((p) => { const n = newPrice(p); const diff = n - p.price; return `<tr>
          <td><b>${esc(p.name)}</b><small class="muted block">${esc(catName(p.cat))}</small></td>
          <td class="num muted">${money(p.price)}</td><td class="num"><b>${money(n)}</b></td>
          <td class="num ${diff >= 0 ? "up" : "down"}">${diff >= 0 ? "+" : "−"}${money(Math.abs(diff))}</td></tr>`; }).join("")}</tbody></table>`
        : `<div class="empty">${pr.scope === "cats" ? "Elegí al menos una categoría." : "No hay productos."}</div>`;
      $("#applyBtn").disabled = !list.length || !pr.pct;
    };
    draw();

    $("#scope").addEventListener("click", (e) => { const b = e.target.closest("[data-s]"); if (b) { pr.scope = b.dataset.s; draw(); } });
    $("#dir").addEventListener("click", (e) => { const b = e.target.closest("[data-d]"); if (b) { pr.dir = b.dataset.d; draw(); } });
    $(".pct__quick").addEventListener("click", (e) => { const b = e.target.closest("[data-p]"); if (b) { pr.pct = Number(b.dataset.p); $("#pct").value = pr.pct; draw(); } });
    $("#pct").addEventListener("input", (e) => { pr.pct = Number(e.target.value) || 0; draw(); });
    $("#round").addEventListener("change", (e) => { pr.round = Number(e.target.value); draw(); });
    $("#oldToo").addEventListener("change", (e) => { pr.old = e.target.checked; draw(); });
    $("#catChips").addEventListener("change", () => { pr.cats = $$("#catChips input:checked").map((x) => x.value); draw(); });

    $("#applyBtn").addEventListener("click", async () => {
      const list = affected();
      const label = `${pr.dir === "up" ? "Aumento" : "Baja"} de ${pr.pct}% — ${pr.scope === "todas" ? "toda la tienda" : pr.cats.map(catName).join(", ")}`;
      if (!confirm(`${label}\nSe van a actualizar ${list.length} productos. ¿Aplicar?`)) return;
      const before = list.map((p) => ({ id: p.id, price: p.price, oldPrice: p.oldPrice ?? null }));
      const ids = new Set(list.map((p) => p.id));
      const updated = products.map((p) => ids.has(p.id) ? { ...p, price: newPrice(p), oldPrice: newOld(p) } : p);
      await DB.saveProducts(updated);
      await DB.addPriceHistory({ id: "h" + Date.now(), date: new Date().toISOString(), desc: label, before });
      toast(`Listo: ${list.length} precios actualizados`);
      renderPrices();
    });
    view.querySelector("[data-undo]")?.addEventListener("click", async (e) => {
      const h = history.find((x) => x.id === e.currentTarget.dataset.undo);
      if (!h || !confirm(`¿Deshacer "${h.desc}"? Los ${h.before.length} productos vuelven a su precio anterior.`)) return;
      const map = new Map(h.before.map((b) => [b.id, b]));
      const restored = (await DB.getProducts()).map((p) => map.has(p.id) ? { ...p, price: map.get(p.id).price, oldPrice: map.get(p.id).oldPrice } : p);
      await DB.saveProducts(restored); await DB.removePriceHistory(h.id);
      toast("Cambio deshecho: precios restaurados"); renderPrices();
    });
  }

  /* ---------- Arranque ---------- */
  start();
})();
