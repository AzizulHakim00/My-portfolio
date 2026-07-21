(() => {
  "use strict";
  const pipeline = document.querySelector(".research-pipeline");
  if (!pipeline || document.querySelector(".research-status-grid")) return;
  if (!document.querySelector('link[href^="/assets/css/v3-research.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/assets/css/v3-research.css?v=20260721-v3";
    document.head.appendChild(link);
  }
  pipeline.insertAdjacentHTML("afterend", `<div class="research-status-grid">
    <article><div><span>DUAL-BAND SENSOR</span><strong>Simulation and calibration study</strong></div><ul><li data-value="100"><b>Geometry & simulation</b><i><em></em></i><small>Complete</small></li><li data-value="100"><b>Soil response analysis</b><i><em></em></i><small>Complete</small></li><li data-value="82"><b>ML interpretation</b><i><em></em></i><small>In progress</small></li><li data-value="70"><b>Paper review cycle</b><i><em></em></i><small>In progress</small></li></ul></article>
    <article><div><span>THYRO-RIFT</span><strong>Reliability-aware clinical AI</strong></div><ul><li data-value="100"><b>Problem & protocol</b><i><em></em></i><small>Complete</small></li><li data-value="92"><b>Model pipeline</b><i><em></em></i><small>Advanced</small></li><li data-value="78"><b>Robustness evaluation</b><i><em></em></i><small>In progress</small></li><li data-value="68"><b>External validation</b><i><em></em></i><small>Planned</small></li></ul></article>
  </div>`);
  const rows = document.querySelectorAll(".research-status-grid li");
  const reveal = () => rows.forEach((row, index) => setTimeout(() => row.style.setProperty("--status", `${row.dataset.value}%`), index * 80));
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) reveal();
  else new IntersectionObserver((entries, observer) => entries.forEach((entry) => { if (entry.isIntersecting) { reveal(); observer.disconnect(); } }), { threshold: .25 }).observe(document.querySelector(".research-status-grid"));
})();
