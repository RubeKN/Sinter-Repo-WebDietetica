// Catálogo de ejemplo. Reemplazar por datos reales (o por una API) más adelante.
// Precios en pesos argentinos. `variants` define presentaciones con multiplicador de precio.

window.STORE = {
  name: "Sinter Natural",
  whatsapp: "5491100000000", // número de ejemplo, reemplazar
  city: "tu ciudad",
  freeShippingFrom: 25000,
  shippingCost: 2500,
  transferDiscount: 0.05, // 5% off pagando por transferencia
  // Fin de la promo "Ofertas de la semana" (hora Argentina)
  promoEndsAt: "2026-11-28T23:59:59-03:00",
  // Imagen opcional para el hero (ej: "img/hero.jpg"). Si está vacío se muestra un mosaico de ofertas.
  heroImage: "",
  shippingZones: [
    { name: "CABA", from: 1000, to: 1499, price: 4500, days: "24 a 48 hs" },
    { name: "GBA", from: 1600, to: 1999, price: 6200, days: "2 a 3 días hábiles" },
    { name: "Interior", from: 2000, to: 9999, price: 8900, days: "3 a 6 días hábiles" }
  ]
};

window.CATEGORIES = [
  { id: "frutos-secos", name: "Frutos secos", emoji: "🥜", color: "#c98b4b" },
  { id: "semillas", name: "Semillas", emoji: "🌻", color: "#d9b44a" },
  { id: "mixes", name: "Mixes y granolas", emoji: "🥣", color: "#b5884f" },
  { id: "frutas-deshidratadas", name: "Frutas deshidratadas", emoji: "🍑", color: "#d0763a" },
  { id: "harinas", name: "Harinas y premezclas", emoji: "🌾", color: "#c7a873" },
  { id: "legumbres", name: "Legumbres", emoji: "🫘", color: "#8f5f3a" },
  { id: "suplementos", name: "Suplementos", emoji: "💪", color: "#5f8c6a" },
  { id: "infusiones", name: "Infusiones y yerbas", emoji: "🍵", color: "#6f9a52" },
  { id: "almacen", name: "Almacén natural", emoji: "🍯", color: "#d08a2e" },
  { id: "sin-tacc", name: "Sin TACC", emoji: "🌱", color: "#4f8f6b" }
];

window.TAGS = {
  "sin-tacc": "Sin TACC",
  vegano: "Vegano",
  organico: "Orgánico",
  "sin-azucar": "Sin azúcar",
  keto: "Keto"
};

const W = [
  { label: "250 g", mult: 1 },
  { label: "500 g", mult: 1.9 },
  { label: "1 kg", mult: 3.6 }
];

window.PRODUCTS = [
  { id: 1, name: "Almendras Non Pareil", cat: "frutos-secos", price: 6200, oldPrice: 7100, emoji: "🌰", tags: ["sin-tacc", "vegano", "keto"], variants: W, featured: true, stock: 40,
    desc: "Almendras californianas enteras, crocantes y sin sal. Ideales para snack, leches vegetales o repostería." },
  { id: 2, name: "Nueces Mariposa Extra Light", cat: "frutos-secos", price: 7400, emoji: "🥜", tags: ["sin-tacc", "vegano", "keto"], variants: W, featured: true, stock: 25,
    desc: "Mariposas de nuez de color claro, seleccionadas. Fuente de omega 3." },
  { id: 3, name: "Mix Energético", cat: "mixes", price: 5300, oldPrice: 5900, emoji: "🥨", tags: ["vegano"], variants: W, stock: 60,
    desc: "Maní, almendras, pasas de uva, nueces y banana chips. El clásico para llevar a todos lados." },
  { id: 4, featured: true, name: "Castañas de Cajú", cat: "frutos-secos", price: 8100, emoji: "🌰", tags: ["sin-tacc", "vegano", "keto"], variants: W, stock: 18,
    desc: "Cajú W320 enteras, sin sal. Perfectas para quesos veganos o salteados." },
  { id: 5, name: "Pasas de Uva Morochas", cat: "frutas-deshidratadas", price: 2900, emoji: "🍇", tags: ["vegano", "sin-tacc"], variants: W, stock: 80,
    desc: "Pasas de uva sin semilla, dulces y tiernas." },

  { id: 35, name: "Dátiles Medjool", cat: "frutas-deshidratadas", price: 4790, oldPrice: 5400, emoji: "🌴", tags: ["sin-tacc", "vegano"], variants: W, featured: true, stock: 30,
    desc: "Dátiles grandes, carnosos y bien dulces. Endulzante natural para licuados y bocaditos." },
  { id: 36, name: "Ciruelas Pasa Sin Carozo", cat: "frutas-deshidratadas", price: 3200, emoji: "🫐", tags: ["sin-tacc", "vegano"], variants: W, stock: 40,
    desc: "Ciruelas tiernas descarozadas, ideales para snack o compotas." },
  { id: 37, name: "Banana Chips", cat: "frutas-deshidratadas", price: 2600, oldPrice: 2950, emoji: "🍌", tags: ["vegano"], variants: W, stock: 50,
    desc: "Rodajas de banana crocantes, apenas endulzadas." },
  { id: 38, name: "Arándanos Deshidratados", cat: "frutas-deshidratadas", price: 5900, emoji: "🫐", tags: ["sin-tacc", "vegano"], variants: W, stock: 22,
    desc: "Arándanos rojos tiernos, perfectos para granolas y ensaladas." },
  { id: 6, name: "Semillas de Chía", cat: "semillas", price: 2600, oldPrice: 3100, emoji: "⚫", tags: ["sin-tacc", "vegano", "organico", "keto"], variants: W, featured: true, stock: 100,
    desc: "Chía negra seleccionada. Rica en fibra y omega 3. Ideal para puddings y panificados." },
  { id: 7, name: "Semillas de Lino Dorado", cat: "semillas", price: 1900, emoji: "🟤", tags: ["sin-tacc", "vegano"], variants: W, stock: 70,
    desc: "Lino dorado limpio. Molelo antes de consumir para aprovechar sus nutrientes." },
  { id: 8, featured: true, name: "Mix de Semillas", cat: "semillas", price: 2800, emoji: "🌻", tags: ["sin-tacc", "vegano"], variants: W, stock: 55,
    desc: "Girasol, zapallo, sésamo, lino y chía. Para ensaladas, yogures y panes." },
  { id: 9, name: "Semillas de Zapallo Peladas", cat: "semillas", price: 4900, emoji: "🎃", tags: ["sin-tacc", "vegano", "keto"], variants: W, stock: 30,
    desc: "Pepitas verdes peladas, crocantes y nutritivas." },

  { id: 10, name: "Granola Crocante de Miel", cat: "mixes", price: 3900, oldPrice: 4400, emoji: "🥣", tags: [], variants: W, featured: true, stock: 45,
    desc: "Avena, miel, coco, almendras y pasas horneadas. Receta de la casa." },
  { id: 11, name: "Granola Sin Azúcar", cat: "mixes", price: 4500, oldPrice: 5000, emoji: "🥣", tags: ["sin-azucar", "vegano"], variants: W, stock: 35,
    desc: "Endulzada con dátiles. Sin azúcar agregada." },
  { id: 12, name: "Avena Arrollada Instantánea", cat: "mixes", price: 1500, emoji: "🌾", tags: ["vegano"], variants: W, stock: 120,
    desc: "Copos finos de rápida cocción. Para porridge, licuados y galletas." },
  { id: 13, featured: true, name: "Quinoa Blanca Lavada", cat: "mixes", price: 3200, emoji: "🍚", tags: ["sin-tacc", "vegano", "organico"], variants: W, stock: 40,
    desc: "Quinoa lista para cocinar, sin saponinas." },

  { id: 14, name: "Harina de Almendras", cat: "harinas", price: 7900, emoji: "🥄", tags: ["sin-tacc", "keto", "vegano"], variants: W, featured: true, stock: 22,
    desc: "Almendras blanqueadas finamente molidas. Base de la repostería keto." },
  { id: 15, name: "Harina de Garbanzo", cat: "harinas", price: 1800, emoji: "🥄", tags: ["sin-tacc", "vegano"], variants: W, stock: 50,
    desc: "Para fainá, rebozados y panqueques salados." },
  { id: 16, name: "Premezcla Universal Sin TACC", cat: "harinas", price: 2700, emoji: "🧁", tags: ["sin-tacc"], variants: [{ label: "1 kg", mult: 1 }], stock: 30,
    desc: "Premezcla apta celíacos para panes, tortas y pizzas." },
  { id: 17, name: "Harina Integral Agroecológica", cat: "harinas", price: 1400, emoji: "🌾", tags: ["organico", "vegano"], variants: [{ label: "1 kg", mult: 1 }, { label: "5 kg", mult: 4.5 }], stock: 60,
    desc: "Molienda a piedra de trigo agroecológico." },

  { id: 18, name: "Lentejas Turcas", cat: "legumbres", price: 2400, emoji: "🫘", tags: ["sin-tacc", "vegano"], variants: W, stock: 70,
    desc: "Lentejas rojas peladas, cocción rápida. Ideales para dhal y hamburguesas." },
  { id: 19, featured: true, name: "Garbanzos", cat: "legumbres", price: 1700, emoji: "🫘", tags: ["sin-tacc", "vegano"], variants: W, stock: 90,
    desc: "Garbanzos calibre 9. Para hummus, guisos y ensaladas." },
  { id: 20, name: "Porotos Aduki", cat: "legumbres", price: 2600, emoji: "🫘", tags: ["sin-tacc", "vegano", "organico"], variants: W, stock: 28,
    desc: "Porotos japoneses de cocción rápida y sabor suave." },

  { id: 21, name: "Proteína Vegetal de Arveja", cat: "suplementos", price: 21500, oldPrice: 24900, emoji: "🥤", tags: ["vegano", "sin-tacc"], variants: [{ label: "500 g", mult: 1 }, { label: "1 kg", mult: 1.85 }], featured: true, stock: 12,
    desc: "Aislado de arveja sabor vainilla. 22 g de proteína por porción." },
  { id: 22, name: "Colágeno Hidrolizado", cat: "suplementos", price: 16800, emoji: "💊", tags: ["sin-tacc", "sin-azucar"], variants: [{ label: "300 g", mult: 1 }], stock: 15,
    desc: "Colágeno bovino hidrolizado con vitamina C. Sin sabor." },
  { id: 23, name: "Magnesio Citrato", cat: "suplementos", price: 9900, emoji: "💊", tags: ["vegano", "sin-tacc"], variants: [{ label: "60 cápsulas", mult: 1 }, { label: "120 cápsulas", mult: 1.8 }], stock: 40,
    desc: "Citrato de magnesio de alta absorción." },
  { id: 24, name: "Spirulina en Polvo", cat: "suplementos", price: 8700, emoji: "🟢", tags: ["vegano", "sin-tacc", "organico"], variants: [{ label: "100 g", mult: 1 }, { label: "250 g", mult: 2.3 }], stock: 0,
    desc: "Alga spirulina pura, rica en proteínas y hierro." },

  { id: 25, name: "Yerba Mate Orgánica", cat: "infusiones", price: 4200, emoji: "🧉", tags: ["organico", "sin-tacc", "vegano"], variants: [{ label: "500 g", mult: 1 }, { label: "1 kg", mult: 1.9 }], featured: true, stock: 50,
    desc: "Yerba con palo, estacionamiento natural, cultivo orgánico certificado." },
  { id: 26, name: "Té Verde Sencha", cat: "infusiones", price: 3600, emoji: "🍵", tags: ["organico", "vegano"], variants: [{ label: "100 g", mult: 1 }], stock: 35,
    desc: "Hebras de té verde japonés estilo sencha." },
  { id: 27, name: "Cúrcuma con Jengibre (blend)", cat: "infusiones", price: 3100, oldPrice: 3500, emoji: "🫚", tags: ["vegano", "sin-tacc"], variants: [{ label: "100 g", mult: 1 }], stock: 25,
    desc: "Blend para golden milk: cúrcuma, jengibre, canela y pimienta." },

  { id: 28, featured: true, name: "Miel Pura de Monte", cat: "almacen", price: 5200, emoji: "🍯", tags: ["sin-tacc"], variants: [{ label: "500 g", mult: 1 }, { label: "1 kg", mult: 1.85 }], stock: 30,
    desc: "Miel cruda de productores de Entre Ríos." },
  { id: 29, name: "Mantequilla de Maní", cat: "almacen", price: 3800, emoji: "🥜", tags: ["sin-tacc", "vegano", "sin-azucar"], variants: [{ label: "380 g", mult: 1 }], featured: true, stock: 45,
    desc: "100% maní tostado. Sin azúcar, sin sal, sin aceites agregados." },
  { id: 30, name: "Aceite de Coco Neutro", cat: "almacen", price: 6900, emoji: "🥥", tags: ["vegano", "sin-tacc", "keto"], variants: [{ label: "360 ml", mult: 1 }], stock: 20,
    desc: "Aceite de coco desodorizado, ideal para cocinar a altas temperaturas." },
  { id: 31, name: "Stevia Líquida", cat: "almacen", price: 2300, emoji: "💧", tags: ["sin-azucar", "keto", "sin-tacc", "vegano"], variants: [{ label: "100 ml", mult: 1 }], stock: 60,
    desc: "Endulzante natural sin calorías." },

  { id: 32, name: "Galletitas de Arroz Sin TACC", cat: "sin-tacc", price: 1600, emoji: "🍘", tags: ["sin-tacc", "vegano"], variants: [{ label: "Paquete 150 g", mult: 1 }], stock: 80,
    desc: "Galletas de arroz integral infladas, con sal marina." },
  { id: 33, featured: true, name: "Fideos de Arroz Sin TACC", cat: "sin-tacc", price: 2100, emoji: "🍜", tags: ["sin-tacc", "vegano"], variants: [{ label: "500 g", mult: 1 }], stock: 40,
    desc: "Fideos tipo tallarín de arroz, aptos celíacos." },
  { id: 34, name: "Budín de Limón Sin TACC", cat: "sin-tacc", price: 3400, oldPrice: 3900, emoji: "🍋", tags: ["sin-tacc"], variants: [{ label: "Unidad 300 g", mult: 1 }], stock: 15,
    desc: "Budín húmedo de limón con glaseado, elaborado en planta libre de gluten." }
];
