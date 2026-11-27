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
     login(email, pass) / logout() / currentUser()
     reset()                       -> restablece la demo
   ========================================================================= */
(() => {
  "use strict";

  const KEY = "sinter_demo_db";
  const VERSION = 1;
  const SESSION = "sinter_admin_session";
  // Credenciales de la DEMO (se muestran en la pantalla de ingreso).
  const DEMO_USER = { email: "demo@sinter.com", pass: "demo1234", name: "Administrador" };

  const clone = (o) => JSON.parse(JSON.stringify(o));

  // Configuración de la tienda por defecto (se completa con lo que haya guardado)
  const STORE_DEFAULTS = {
    name: "Sinter Natural", shortName: "SINTER", tagline: "Dietética natural",
    logo: "", colorBrand: "#c9d58b", colorDark: "#213f2f",
    address: "Av. Ejemplo 1234", hours: "Lunes a sábado de 9 a 13 y de 16 a 20 hs",
    instagram: "", showCountdown: true, heroOrder: []
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
        const status = d === 0 ? pick(["nuevo", "nuevo", "preparando"]) : d === 1 ? pick(["preparando", "listo", "entregado"]) : "entregado";
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
    const products = clone(window.PRODUCTS || []);
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

  let memory = null;   // copia en memoria (si el navegador no permite guardar)
  function read() {
    if (memory) return memory;
    const saved = ls.get(KEY);
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
      if (i >= 0) db.products[i] = { ...db.products[i], ...p };
      else db.products.push({ ...p, id: p.id ?? Math.max(0, ...db.products.map((x) => x.id)) + 1 });
      write(db); return ok(p);
    },
    saveProducts(list) { const db = read(); db.products = clone(list); write(db); return ok(list); },
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

    /* Pedidos */
    listOrders() { return ok(read().orders); },
    createOrder(o) { const db = read(); db.orders.unshift({ status: "nuevo", createdAt: new Date().toISOString(), ...o }); write(db); return ok(o); },
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
})();
