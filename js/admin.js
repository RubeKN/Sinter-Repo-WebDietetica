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
    { id: "productos", label: "Productos", ico: "box", stage: 2, desc: "Crear, editar, duplicar y pausar productos. Fotos, presentaciones, etiquetas, stock y edición rápida de precios desde la lista." },
    { id: "precios", label: "Aumento de precios", ico: "trend", stage: 2, desc: "Subí o bajá precios en bloque por porcentaje, a toda la tienda o por categoría, con vista previa y redondeo." },
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
    const id = (location.hash.replace(/^#\/?/, "").split("/")[0]) || "inicio";
    const sec = SECTIONS.find((s) => s.id === id) || SECTIONS[0];
    $$(".side__link[data-sec]").forEach((a) => a.classList.toggle("active", a.dataset.sec === sec.id));
    $("#pageTitle").textContent = sec.label;
    document.title = `${sec.label} · Panel Sinter`;
    openSide(false);
    if (sec.id === "inicio") renderDashboard();
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
              ${outOfStock.map((p) => `<li><span>${esc(p.name)}</span><span class="st st--cancel">Sin stock</span></li>`).join("")}
              ${lowStock.slice(0, 6).map((p) => `<li><span>${esc(p.name)}</span><span class="st st--prep">Quedan ${p.stock}</span></li>`).join("")}
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

  /* ---------- Arranque ---------- */
  start();
})();
