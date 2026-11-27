/* =========================================================================
   Capa de datos de Sinter
   -------------------------------------------------------------------------
   La tienda (js/app.js) y el panel (js/admin.js) NUNCA leen ni escriben los
   datos directamente: siempre pasan por window.DB. Así, para pasar de la
   maqueta a una versión real solo hay que reemplazar el "adaptador".

   Adaptador actual: DEMO
     - Arranca con los datos iniciales de js/data.js
     - Guarda los cambios en el navegador (localStorage): cada navegador
       tiene su propia copia, ideal para mostrar la demo.
     - "Restablecer demo" vuelve todo al estado original.

   Adaptador futuro: REAL (por ejemplo Supabase)
     - Mismos métodos, pero contra una base de datos en la nube, con
       inicio de sesión real y fotos en un almacenamiento.

   Interfaz (todos los métodos devuelven promesas):
     loadCatalog()                 -> { STORE, CATEGORIES, TAGS, PRODUCTS, REVIEWS }
     getProducts() / saveProduct(p) / saveProducts(list) / deleteProduct(id)
     listPriceHistory() / addPriceHistory(e) / removePriceHistory(id)
     getStore() / saveStore(patch)
     getCategories() / saveCategories(list)
     getReviews() / saveReviews(list)
     listOrders() / createOrder(o) / updateOrder(id, patch)
     adjustStock(id, delta, reason, ref) / listStockLog(id?)
     login(email, pass) / logout() / currentUser()
     reset()                       -> restablece la demo
   ========================================================================= */
(() => {
  "use strict";

  const KEY = "sinter_demo_db";
  const VERSION = 3;   // 2: venta suelta (por peso) · 3: precio por kg en productos sueltos
  const SESSION = "sinter_admin_session";
  // Credenciales de la DEMO (se muestran en la pantalla de ingreso).
  const DEMO_USER = { email: "demo@sinter.com", pass: "demo1234", name: "Administrador" };

  const clone = (o) => JSON.parse(JSON.stringify(o));

  // Configuración de la tienda por defecto (se completa con lo que haya guardado)
  const STORE_DEFAULTS = {
    name: "Sinter Natural", shortName: "SINTER", tagline: "Dietética natural",
    logo: "", colorBrand: "#c9d58b", colorDark: "#213f2f",
    address: "Av. Ejemplo 1234", hours: "Lunes a sábado de 9 a 13 y de 16 a 20 hs",
    instagram: "", showCountdown: true, heroOrder: [],
    autoCancelHours: 24   // pedidos sin confirmar se cancelan solos después de X horas (0 = nunca)
  };
  const withDefaults = (store) => ({ ...STORE_DEFAULTS, ...store });
  const ls = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch { /* sin almacenamiento */ } }
  };


  /* ---------- Precios (misma regla que la tienda) ---------- */
  const round10 = (n) => Math.round(n / 10) * 10;
  const unitPrice = (p, v = 0) => round10(p.price * (p.variants[v]?.mult ?? 1));

  /* ---------- Pedidos de demostración (fijos y repetibles) ---------- */
  function demoOrders(products) {
    let seed = 20261127;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
    const names = ["María G.", "Lucía P.", "Juan M.", "Sofía R.", "Martín L.", "Carla D.", "Diego F.", "Valentina S.",
      "Pablo A.", "Florencia T.", "Nicolás B.", "Camila V.", "Gabriela N.", "Tomás C.", "Paula E."];
    const pays = ["Transferencia", "Transferencia", "Mercado Pago", "Efectivo"];
    const inStock = products.filter((p) => p.stock > 0);
    const popular = inStock.filter((p) => p.featured || p.oldPrice);
    const orders = [];
    const now = new Date();
    for (let d = 29; d >= 0; d--) {
      const perDay = 1 + Math.floor(rnd() * 4) + (d < 7 ? 1 : 0);
      for (let k = 0; k < perDay; k++) {
        const date = new Date(now);
        date.setDate(now.getDate() - d);
        date.setHours(9 + Math.floor(rnd() * 11), Math.floor(rnd() * 60), 0, 0);
        if (date > now) date.setTime(now.getTime() - (k + 1) * 3600e3);
        const items = [];
        const n = 1 + Math.floor(rnd() * 4);
        for (let i = 0; i < n; i++) {
          const p = rnd() < .6 ? pick(popular) : pick(inStock);
          if (items.some((it) => it.id === p.id)) continue;
          const v = Math.floor(rnd() * Math.min(p.variants.length, 2));
          const qty = 1 + Math.floor(rnd() * 2);
          items.push({ id: p.id, name: p.name, variant: p.variants[v].label, qty, unit: unitPrice(p, v) });
        }
        const subtotal = items.reduce((a, it) => a + it.unit * it.qty, 0);
        const pay = pick(pays);
        const delivery = rnd() < .65 ? "envio" : "retiro";
        const discount = pay === "Transferencia" ? Math.round(subtotal * .05) : 0;
        const shipping = delivery === "envio" && subtotal < 25000 ? 2500 : 0;
        const status = d === 0 ? pick(["sin_confirmar", "sin_confirmar", "nuevo", "preparando"]) : d === 1 ? pick(["preparando", "listo", "entregado", "sin_confirmar"]) : "entregado";
        orders.push({
          id: "S" + date.getTime().toString(36).toUpperCase().slice(-6),
          createdAt: date.toISOString(), status,
          customer: { name: pick(names), phone: "11 " + (40000000 + Math.floor(rnd() * 9999999)) },
          delivery, pay, items, subtotal, discount, shipping, total: subtotal - discount + shipping, demo: true
        });
      }
    }
    return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /* ---------- Estado de la demo ---------- */
  function seed() {
    const products = clone(window.PRODUCTS || []).map((p) => toPerKg(p, window.CATEGORIES || []));
    return {
      version: VERSION,
      store: clone(window.STORE || {}),
      categories: clone(window.CATEGORIES || []),
      tags: clone(window.TAGS || {}),
      products,
      reviews: clone(window.REVIEWS || []),
      orders: demoOrders(products)
    };
  }

  // Actualiza datos guardados de versiones anteriores sin perder lo cargado
  function migrate(saved) {
    if (!saved || !saved.version || saved.version >= VERSION) return saved;
    if (saved.version === 1) {
      const seedCats = window.CATEGORIES || [];
      saved.categories = (saved.categories || []).map((c) => ("bulk" in c ? c : { ...c, bulk: !!seedCats.find((x) => x.id === c.id)?.bulk }));
      saved.version = 2;
    }
    if (saved.version === 2) {
      saved.products = (saved.products || []).map((p) => toPerKg(p, saved.categories));
      saved.version = 3;
    }
    ls.set(KEY, saved); return saved;
  }

  // Productos sueltos: el precio se carga por kg y cada presentación se calcula sola.
  // Pasa un producto al esquema por kg manteniendo el precio de la presentación principal.
  function toPerKg(p, cats) {
    if (p.perKg !== undefined) return p;
    const on = p.bulk ?? !!(cats || []).find((c) => c.id === p.cat)?.bulk;
    const gs = (p.variants || []).map((v) => Bulk.grams(v.label));
    if (!on || !gs.length || gs.some((g) => !g)) return p;
    const g0 = gs[0];
    const out = { ...p, perKg: true, kgPrice: round10(p.price * 1000 / g0), kgOld: p.oldPrice ? round10(p.oldPrice * 1000 / g0) : null,
      variants: p.variants.map((v, i) => ({ ...v, mult: Math.round(gs[i] / g0 * 10000) / 10000 })) };
    return Bulk.derive(out);
  }
  // Mantiene coherentes precio por kg y precio principal cuando otra herramienta cambia el precio
  // (aumento masivo, ofertas, edición rápida): se respeta lo que haya cambiado.
  function syncPerKg(p, prev) {
    if (!p.perKg || !Bulk.grams(p.variants?.[0]?.label)) return p;
    if (prev && prev.perKg) {
      const known = new Map([[prev.price, prev.kgPrice], [prev.oldPrice, prev.kgOld]]);
      if (p.price !== prev.price && p.kgPrice === prev.kgPrice) p.kgPrice = known.get(p.price) ?? round10(prev.kgPrice * p.price / prev.price);
      if (p.oldPrice !== prev.oldPrice && p.kgOld === prev.kgOld) p.kgOld = p.oldPrice ? (known.get(p.oldPrice) ?? round10(p.oldPrice * 1000 / Bulk.grams(p.variants[0].label))) : null;
    }
    return Bulk.derive(p);
  }

  let memory = null;   // copia en memoria (si el navegador no permite guardar)
  function read() {
    if (memory) return memory;
    const saved = migrate(ls.get(KEY));
    memory = saved && saved.version === VERSION ? saved : seed();
    if (!saved || saved.version !== VERSION) ls.set(KEY, memory);
    return memory;
  }
  function write(db) { memory = db; ls.set(KEY, db); return db; }
  const ok = (v) => Promise.resolve(clone(v));

  // Si otra pestaña (por ejemplo el panel) cambia datos, esta se entera.
  window.addEventListener("storage", (e) => { if (e.key === KEY) memory = null; });

  const DemoAdapter = {
    mode: "demo",
    loadCatalog() {
      const db = read();
      return ok({ STORE: withDefaults(db.store), CATEGORIES: db.categories, TAGS: db.tags, PRODUCTS: db.products, REVIEWS: db.reviews });
    },

    /* Productos */
    getProducts() { return ok(read().products); },
    saveProduct(p) {
      const db = read();
      const i = db.products.findIndex((x) => x.id === p.id);
      if (i >= 0) db.products[i] = syncPerKg({ ...db.products[i], ...clone(p) }, db.products[i]);
      else db.products.push(syncPerKg({ ...clone(p), id: p.id ?? Math.max(0, ...db.products.map((x) => x.id)) + 1 }));
      write(db); return ok(i >= 0 ? db.products[i] : db.products[db.products.length - 1]);
    },
    saveProducts(list) {
      const db = read(); const prev = new Map(db.products.map((x) => [x.id, x]));
      db.products = clone(list).map((p) => syncPerKg(p, prev.get(p.id))); write(db); return ok(db.products);
    },
    deleteProduct(id) { const db = read(); db.products = db.products.filter((p) => p.id !== id); write(db); return ok(true); },

    /* Tienda, categorías y reseñas */
    getStore() { return ok(withDefaults(read().store)); },
    saveStore(patch) { const db = read(); db.store = { ...db.store, ...patch }; write(db); return ok(withDefaults(db.store)); },
    storeDefaults: STORE_DEFAULTS,
    getCategories() { return ok(read().categories); },
    saveCategories(list) { const db = read(); db.categories = clone(list); write(db); return ok(list); },
    getReviews() { return ok(read().reviews); },
    saveReviews(list) { const db = read(); db.reviews = clone(list); write(db); return ok(list); },

    /* Historial de cambios masivos de precios (para poder deshacer) */
    listPriceHistory() { return ok(read().priceHistory || []); },
    addPriceHistory(entry) { const db = read(); db.priceHistory = [entry, ...(db.priceHistory || [])].slice(0, 20); write(db); return ok(entry); },
    removePriceHistory(id) { const db = read(); db.priceHistory = (db.priceHistory || []).filter((h) => h.id !== id); write(db); return ok(true); },

    /* Stock: cada cambio queda registrado como movimiento */
    adjustStock(id, delta, reason, ref) {
      const db = read(); const p = db.products.find((x) => x.id === id);
      if (!p) return ok(null);
      const before = Number(p.stock) || 0; p.stock = Math.max(0, before + delta);
      if (p.stock !== before) {
        db.stockLog = [{ id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), productId: id,
          delta: p.stock - before, reason, ref: ref || "", at: new Date().toISOString(), stock: p.stock }, ...(db.stockLog || [])].slice(0, 500);
      }
      write(db); return ok(p);
    },
    listStockLog(id) { const l = read().stockLog || []; return ok(id == null ? l : l.filter((m) => m.productId === id)); },

    /* Pedidos */
    listOrders() { return ok(read().orders); },
    createOrder(o) {
      const db = read(); const at = new Date().toISOString();
      // Entra "sin confirmar": se confirma cuando el cliente manda el WhatsApp con el código
      db.orders.unshift({ status: "sin_confirmar", createdAt: at, history: [{ status: "sin_confirmar", at }], ...o });
      write(db); return ok(o);
    },
    updateOrder(id, patch) {
      const db = read(); const o = db.orders.find((x) => x.id === id);
      if (o) Object.assign(o, patch);
      write(db); return ok(o);
    },

    /* Acceso al panel (DEMO: credenciales fijas; REAL: login del proveedor) */
    login(email, pass) {
      const okUser = String(email).trim().toLowerCase() === DEMO_USER.email && pass === DEMO_USER.pass;
      if (!okUser) return Promise.reject(new Error("Email o contraseña incorrectos"));
      const user = { email: DEMO_USER.email, name: DEMO_USER.name };
      ls.set(SESSION, user); return ok(user);
    },
    logout() { ls.del(SESSION); return ok(true); },
    currentUser() { return ok(ls.get(SESSION)); },
    demoCredentials: { email: DEMO_USER.email, pass: DEMO_USER.pass },

    reset() { ls.del(KEY); memory = null; read(); return ok(true); }
  };

  window.DB = DemoAdapter;

  /* ---------- Venta suelta (por peso) ----------
     Un producto se vende suelto si lo dice el producto (bulk: true/false) o,
     si no lo define, su categoría. El cliente elige los gramos desde un mínimo. */
  const Bulk = {
    grams(label) {
      const m = String(label || "").toLowerCase().replace(",", ".").match(/([\d.]+)\s*(kg|g)\b/);
      return m ? Math.round(parseFloat(m[1]) * (m[2] === "kg" ? 1000 : 1)) : 0;
    },
    // Precio por kg sugerido: el de la presentación más grande (la más conveniente)
    autoKg(price, variants) {
      let g = 0, kg = 0;
      (variants || []).forEach((v) => { const gr = Bulk.grams(v.label); if (gr > g) { g = gr; kg = price * (v.mult ?? 1) * 1000 / gr; } });
      return g ? round10(kg) : 0;
    },
    kgPrice(p) { return p.perKg ? Number(p.kgPrice) || 0 : Bulk.autoKg(p.price, p.variants); },
    // Precio de una presentación: por kg si el producto es suelto, si no precio × multiplicador
    unit(p, v = 0, old = false) {
      const g = p.perKg ? Bulk.grams(p.variants?.[v]?.label) : 0;
      if (g) { const kg = old ? p.kgOld : p.kgPrice; return kg ? round10(kg * g / 1000) : null; }
      const base = old ? p.oldPrice : p.price;
      return base ? round10(base * (p.variants?.[v]?.mult ?? 1)) : (old ? null : 0);
    },
    // Recalcula el precio principal (primera presentación) desde el precio por kg
    derive(p) {
      const g0 = Bulk.grams(p.variants?.[0]?.label);
      if (!p.perKg || !g0) return p;
      p.price = round10((p.kgPrice || 0) * g0 / 1000);
      p.oldPrice = p.kgOld ? round10(p.kgOld * g0 / 1000) : null;
      return p;
    },
    catOn(p, cats) { return !!(cats || []).find((c) => c.id === p.cat)?.bulk; },
    enabled(p, cats) { return !!(p.bulk ?? Bulk.catOn(p, cats)) && Bulk.kgPrice(p) > 0; },
    min(p) { return Number(p.bulkMin) || 100; },
    step(p) { return Number(p.bulkStep) || 50; },
    base(p) { return Bulk.grams(p.variants?.[0]?.label) || 250; },   // gramos de una unidad de stock
    price(p, g, old = false) {
      let kg = Bulk.kgPrice(p);
      if (old) {
        if (p.perKg) kg = p.kgOld;
        else kg = p.oldPrice && p.price ? kg * p.oldPrice / p.price : 0;
        if (!kg) return null;
      }
      return round10(kg * g / 1000);
    },
    label(g) { return g >= 1000 ? `${(g / 1000).toLocaleString("es-AR", { maximumFractionDigits: 3 })} kg` : `${g} g`; }
  };
  window.Bulk = Bulk;
})();
