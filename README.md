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
