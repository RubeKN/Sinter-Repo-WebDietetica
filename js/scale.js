/* Íconos escalables: los SVG con width/height fijos pasan a rem para crecer
   junto con el resto de la página (ver "Escalado según la pantalla" en el CSS).
   Si un ícono ya tiene tamaño puesto por CSS, se respeta. */
(() => {
  "use strict";
  const fix = (s) => {
    if (s.dataset.r) return;
    s.dataset.r = "1";
    const w = s.getAttribute("width"), h = s.getAttribute("height") || w;
    if (!w || /%/.test(w)) return;
    const cs = getComputedStyle(s);
    if (cs.width !== "auto" && Math.abs(parseFloat(cs.width) - Number(w)) > .5) return;   // tamaño por CSS
    s.style.width = Number(w) / 16 + "rem";
    s.style.height = Number(h) / 16 + "rem";
  };
  const scan = (root) => {
    if (root.nodeType !== 1) return;
    if (root.matches("svg[width]")) fix(root);
    root.querySelectorAll("svg[width]:not([data-r])").forEach(fix);
  };
  scan(document.body);
  new MutationObserver((list) => list.forEach((m) => m.addedNodes.forEach(scan)))
    .observe(document.body, { childList: true, subtree: true });
})();
