# Sinter Natural · Dietética online

Tienda online para una dietética: catálogo de productos naturales, carrito y pedido por WhatsApp.
Sitio estático (HTML + CSS + JavaScript, sin dependencias ni build).

## Cómo correrlo

```bash
python3 -m http.server 8000
```

Abrir http://localhost:8000 (también se puede abrir `index.html` directo en el navegador).

## Funcionalidades

- Marquesina con promo de envío gratis y descuento por transferencia
- Header con accesos rápidos, botón "Ver ofertas", carrito y menú lateral (móvil)
- Buscador con sugerencias en vivo (navegable con teclado, ignora tildes)
- Barra de categorías tipo "chips"
- Hero "Ofertas de la semana" con cuenta regresiva configurable
- Grillas de ofertas destacadas, categorías y más pedidos
- Catálogo con filtros (Sin TACC, vegano, orgánico, sin azúcar, keto, stock) y orden
- Ficha de producto con presentaciones (250 g / 500 g / 1 kg), cantidad, precio con transferencia
- Carrito persistente (localStorage) con barra flotante "Ver pedido" y progreso de envío gratis
- Checkout: datos, envío o retiro, medio de pago, totales y genera el pedido y lo abre en WhatsApp
- Páginas: Nosotros, Cómo comprar, Envíos, Preguntas frecuentes, Contacto

## Configuración

Todo en `js/data.js`:

- `STORE`: número de WhatsApp, ciudad, monto de envío gratis, costo de envío, % de descuento por transferencia y fecha de fin de la promo.
- `CATEGORIES`, `TAGS`, `PRODUCTS`: catálogo. Un producto con `oldPrice` aparece como oferta.

## Fotos de productos

Las fotos van en `img/productos/` (WebP, cuadradas, fondo blanco, 800×800 px como máximo) y se asignan
en `js/data.js` con el campo `image` del producto, por ejemplo:

```js
{ id: 1, image: "img/productos/almendras-non-pareil.webp", name: "Almendras Non Pareil", ... }
```

Los productos sin `image` muestran el ícono de su categoría.

## Comentarios de clientes

La sección "Lo que dicen nuestros clientes" (al final del inicio) lee la lista `REVIEWS` de `js/data.js`.
Hoy tiene reseñas **de ejemplo** (`source: "ejemplo"`). Reemplazarlas por reseñas reales:

```js
{ name: "Nombre A.", stars: 5, title: "Título corto", text: "Comentario del cliente", source: "google" }
```

Con `source: "google"` se muestra "Reseña de Google" debajo de cada una.

## Panel de administración

Disponible en `/admin` (en local: `admin.html`).

- **Demo:** ingreso con `demo@sinter.com` / `demo1234` (se muestran en la pantalla de ingreso).
- Los datos pasan siempre por la **capa de datos** `js/db.js` (`window.DB`). Hoy usa el
  adaptador **demo**: parte de `js/data.js` y guarda los cambios en el navegador (localStorage).
  "Restablecer demo" vuelve todo al estado original.
- Los pedidos hechos en la tienda quedan registrados y aparecen en el panel.
- **Para hacerlo real**, se reemplaza el adaptador de `js/db.js` por uno conectado a una base de
  datos (recomendado: Supabase, con login real y fotos en su almacenamiento). La tienda y el panel
  no cambian.
- Si se modifican los datos iniciales de `js/data.js`, subir `VERSION` en `js/db.js` para que la
  demo los vuelva a cargar.

Etapas: 1) estructura, ingreso y resumen ✔ · 2) productos y aumento masivo de precios ✔ · 3) pedidos ✔ ·
4) ofertas, portada, categorías, reseñas y configuración ✔.

Para adaptar la demo a otra dietética: Panel → Configuración (nombre, logo, colores, WhatsApp,
dirección, horarios y envíos). La tienda toma esos datos al recargar.

## Venta suelta (por peso)

- En **Categorías** cada categoría se marca como *Suelto* o no (frutos secos, semillas, mixes, frutas deshidratadas, harinas y legumbres vienen activadas).
- En la ficha de cada producto, la tarjeta **Venta suelta** permite seguir lo que diga la categoría o elegir *Sí* / *No*, el **mínimo** de gramos y de a cuánto sube.
- Si el producto se vende suelto, en **Precio** se carga el **precio por kg** (y el precio anterior por kg si está en oferta). Las presentaciones (250 g, 500 g, 1 kg…) y la venta suelta se calculan solas con ese precio, así siempre son coherentes. Aumentos masivos y ofertas también actualizan el precio por kg.
- En la tienda aparece la opción *Suelto: elegí los gramos*. Si el cliente pone un peso que ya es una presentación (ej. 250 g), queda elegida esa presentación. El carrito, el mensaje de WhatsApp y el pedido muestran los gramos. El stock se descuenta en paquetes de la primera presentación.

## Próximos pasos sugeridos

- Completar las fotos de los productos que todavía usan ícono
- Cargar el catálogo desde un backend / planilla
- Integrar Mercado Pago Checkout Pro

## Deploy en Vercel

El sitio es estático: Vercel lo sirve tal cual, sin build. `vercel.json` agrega headers de seguridad y caché.

**Desde el panel (recomendado):**
1. Entrá a https://vercel.com/new e importá el repo `Sinter-Repo-WebDietetica` desde GitHub.
2. Framework Preset: **Other**. Build Command y Output Directory: dejalos vacíos. Root Directory: `./`.
3. **Deploy**. Cada push a la rama de producción vuelve a desplegar automáticamente; las otras ramas generan URLs de preview.

**Desde la terminal:**
```bash
npm i -g vercel
vercel        # primer deploy (preview), te pide loguearte y vincular el proyecto
vercel --prod # deploy a producción
```
